"use client";

import React, { useState } from 'react';
import AddInstructorForm from './components/AddInstructorForm';
import { instructors } from '@/lib/mockData';
import type { Instructor } from '@/types';

export default function AddInstructorPage() {
    const [allInstructors, setAllInstructors] = useState<Instructor[]>(instructors);

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
