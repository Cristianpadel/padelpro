// src/app/(app)/add-instructor/page.tsx
"use client";

import React, { useState, useEffect, Suspense } from 'react';
import AddInstructorForm from './components/AddInstructorForm';
import { getMockInstructors } from '@/lib/mockData';
import type { Instructor } from '@/types';

function AddInstructorContent() {
    const [allInstructors, setAllInstructors] = useState<Instructor[]>([]);

    useEffect(() => {
        const fetchInstructorsData = async () => {
            const instructorsData = await getMockInstructors();
            setAllInstructors(instructorsData);
        };
        fetchInstructorsData();
    }, []);

    const handleInstructorAdded = (newInstructor: Instructor) => {
        if(newInstructor.id) {
           setAllInstructors(prev => [...prev, newInstructor]);
        }
    };
    
    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
            <header>
                <h1 className="font-headline text-3xl font-semibold">Añadir Nuevo Instructor</h1>
                <p className="text-muted-foreground">
                    Rellena el formulario para añadir un nuevo instructor al sistema.
                </p>
            </header>
            <main className="flex-1">
                <div className="mx-auto max-w-2xl">
                    <AddInstructorForm 
                        onInstructorAdded={handleInstructorAdded}
                    />
                </div>
            </main>
        </div>
    );
}

export default function AddInstructorPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen">Cargando...</div>}>
            <AddInstructorContent />
        </Suspense>
    );
}
