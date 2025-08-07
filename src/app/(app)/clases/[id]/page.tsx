// src/app/(app)/clases/[id]/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import ClassCard from '@/components/class/ClassCard';
import { getMockTimeSlots, getMockCurrentUser, fetchTimeSlots } from '@/lib/mockData';
import type { TimeSlot, User } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function ClaseDetailPage() {
    const params = useParams();
    const id = params.id as string;

    const [classData, setClassData] = useState<TimeSlot | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch from both sources: proposals and confirmed slots
                const [user, proposalSlots, allSlots] = await Promise.all([
                    getMockCurrentUser(),
                    getMockTimeSlots(), // Gets proposals and initial state
                    fetchTimeSlots()     // Gets all slots including confirmed ones from the "DB"
                ]);

                // Combine and find the unique class
                const combinedSlots = [...allSlots, ...proposalSlots];
                const uniqueSlots = Array.from(new Map(combinedSlots.map(item => [item['id'], item])).values());
                const foundClass = uniqueSlots.find(s => s.id === id);
                
                setCurrentUser(user);

                if (foundClass) {
                    setClassData(foundClass);
                }
            } catch (error) {
                console.error("Error fetching class details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (loading) {
        return (
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <header>
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-4 w-2/3 mt-2" />
                </header>
                <main className="flex-1">
                    <div className="mx-auto max-w-sm">
                        <Skeleton className="h-96 w-full" />
                    </div>
                </main>
            </div>
        );
    }
    
    if (!classData) {
        return notFound();
    }

    // In a real scenario, you wouldn't be able to book from this page,
    // so we pass a no-op function for onBookingSuccess
    const handleBookingSuccess = () => {
        // Potentially refresh data if needed in the future
    };

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="font-headline text-3xl font-semibold">Detalle de la Clase</h1>
                    <p className="text-muted-foreground">
                        Aquí tienes la información de tu inscripción.
                    </p>
                </div>
                 <Button asChild variant="outline">
                    <Link href="/activities?view=clases">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver a Clases
                    </Link>
                </Button>
            </header>
            <main className="flex flex-1 items-start justify-center">
                 <div className="w-full max-w-sm">
                    <ClassCard
                        classData={classData}
                        currentUser={currentUser}
                        onBookingSuccess={handleBookingSuccess}
                        showPointsBonus={false} // Don't show bonus on detail page
                    />
                 </div>
            </main>
        </div>
    );
}
