// src/app/(app)/club-calendar/[clubId]/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ClubActivityCalendar from '@/app/(app)/admin/components/ClubActivityCalendar';
import { getMockClubs } from '@/lib/mockData';
import type { Club } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function ClubCalendarPage() {
    const params = useParams();
    const router = useRouter();
    const clubId = params.clubId as string;

    const [club, setClub] = useState<Club | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (clubId) {
            const foundClub = getMockClubs().find(c => c.id === clubId);
            setClub(foundClub || null);
        }
        setLoading(false);
    }, [clubId]);

    if (loading) {
        return (
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                 <header>
                    <Skeleton className="h-10 w-1/3" />
                    <Skeleton className="mt-2 h-5 w-2/3" />
                </header>
                <main className="flex-1">
                   <Skeleton className="h-[70vh] w-full" />
                </main>
            </div>
        )
    }

    if (!club) {
        return (
             <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 text-center">
                <h1 className="text-2xl font-bold text-destructive">Club no encontrado</h1>
                <p>No se pudo encontrar el club con el ID proporcionado.</p>
                <Button onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
             <header className="flex items-center justify-between">
                <div>
                    <h1 className="font-headline text-3xl font-semibold">Calendario de Actividad</h1>
                    <p className="text-muted-foreground">
                        Vista de las clases y partidas para <span className="font-semibold text-primary">{club.name}</span>.
                    </p>
                </div>
                 <Button onClick={() => router.back()} variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                </Button>
            </header>
            <main className="flex-1">
                <ClubActivityCalendar club={club} refreshKey={0} />
            </main>
        </div>
    );
}
