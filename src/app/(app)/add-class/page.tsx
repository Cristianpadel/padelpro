// src/app/(app)/add-class/page.tsx
"use client";

import React, { useState } from 'react';
import AddClassFormForAdmin from './components/AddClassFormForAdmin';
import { clubs, instructors, padelCourts } from '@/lib/mockData';
import type { TimeSlot } from '@/types';

export default function AddClassPage() {
    const [club, setClub] = useState(clubs[0]);
    const [availableInstructors, setAvailableInstructors] = useState(instructors.filter(i => i.assignedClubId === club.id || i.assignedClubId === 'all'));
    const [clubPadelCourts, setClubPadelCourts] = useState(padelCourts.filter(c => c.clubId === club.id));
    const [addedClasses, setAddedClasses] = useState<TimeSlot[]>([]);

    const handleClassAdded = (newSlot: TimeSlot) => {
        if(newSlot.id) {
           setAddedClasses(prev => [...prev, newSlot]);
        }
    };
    
    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
            <header>
                <h1 className="font-headline text-3xl font-semibold">Añadir Nueva Clase</h1>
                <p className="text-muted-foreground">
                    Rellena el formulario para crear una nueva clase para el club.
                </p>
            </header>
            <main className="flex-1">
                <div className="mx-auto max-w-2xl">
                    <AddClassFormForAdmin 
                        club={club}
                        availableInstructors={availableInstructors}
                        clubPadelCourts={clubPadelCourts}
                        onClassAdded={handleClassAdded}
                    />
                </div>
            </main>
        </div>
    );
}

