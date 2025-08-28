"use client";

import React, { useState, useEffect } from 'react';
import InstructorPanel from './components/InstructorPanel';
import { getMockInstructors } from '@/lib/mockData';
import type { Instructor } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function InstructorPage() {
    const [instructor, setInstructor] = useState<Instructor | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInstructor = async () => {
            setLoading(true);
            // In a real app, you'd get the currently logged-in user.
            // For this mock, we'll assume an instructor is a user.
            // Let's take the first instructor and treat them as a user for this context.
          const instructors = await getMockInstructors();
            if (instructors.length > 0) {
                 // We'll simulate 'inst-2' (Ana García) being the logged-in instructor
              const currentInstructor = instructors.find(i => i.id === 'inst-2') || instructors[0];
                 setInstructor(currentInstructor);
            }
            setLoading(false);
        };
        fetchInstructor();
    }, []);

    if (loading) {
        return (
             <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <header>
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-4 w-2/3 mt-2" />
                </header>
                <main className="flex-1">
                     <Skeleton className="h-10 w-full mb-4" />
                     <Skeleton className="h-96 w-full" />
                </main>
            </div>
        )
    }

    if (!instructor) {
        return <div className="p-6">Error: No se pudo cargar la información del instructor.</div>
    }
    
    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
            <header>
                <h1 className="font-headline text-3xl font-semibold">Panel de Instructor</h1>
                <p className="text-muted-foreground">
                    Gestiona tus clases, partidas y preferencias, {instructor.name}.
                </p>
            </header>
            <main className="flex-1">
                <InstructorPanel instructor={instructor} />
            </main>
        </div>
    );
}
