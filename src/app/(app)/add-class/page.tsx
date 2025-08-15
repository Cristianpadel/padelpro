// src/app/(app)/add-class/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import AddClassForm from './components/AddClassForm';
import { getMockInstructors } from '@/lib/mockData';
import type { TimeSlot, Instructor } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import CourtAvailabilityView from '@/components/admin/CourtAvailabilityView';
import { Separator } from '@/components/ui/separator';


export default function AddClassPage() {
    const [instructor, setInstructor] = useState<Instructor | null>(null);
    const [loading, setLoading] = useState(true);
    const [addedClasses, setAddedClasses] = useState<TimeSlot[]>([]);

    useEffect(() => {
        const fetchInstructor = async () => {
            setLoading(true);
            const instructors = await getMockInstructors();
            // In a real app, you'd get the currently logged-in instructor
            setInstructor(instructors.find(i => i.id === 'inst-2') || null); // Simulate getting Ana García as logged in
            setLoading(false);
        };
        fetchInstructor();
    }, []);

    const handleClassAdded = (newSlot: TimeSlot) => {
        if(newSlot.id) {
           setAddedClasses(prev => [...prev, newSlot]);
        }
    };
    
    if (loading) {
        return (
             <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <header>
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-4 w-2/3 mt-2" />
                </header>
                <main className="flex-1">
                    <div className="mx-auto max-w-2xl">
                       <Skeleton className="h-96 w-full" />
                    </div>
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
                <h1 className="font-headline text-3xl font-semibold">Proponer Nueva Clase</h1>
                <p className="text-muted-foreground">
                    Rellena el formulario para crear un nuevo hueco de clase disponible para los alumnos.
                </p>
            </header>
            <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <AddClassForm 
                        instructor={instructor}
                        onClassAdded={handleClassAdded}
                    />
                </div>
                <div className="lg:col-span-2">
                     <CourtAvailabilityView instructor={instructor} />
                </div>
            </main>
        </div>
    );
}
