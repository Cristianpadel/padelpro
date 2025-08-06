"use client";

import React, { useState, useEffect } from 'react';
import AddCreditForm from './components/AddCreditForm';
import { getMockInstructors } from '@/lib/mockData'; // Assuming instructor is a user type
import type { User } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function AddCreditPage() {
    const [instructor, setInstructor] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInstructor = async () => {
            setLoading(true);
            // In a real app, you'd get the currently logged-in user.
            // For this mock, we'll assume an instructor is a user.
            // Let's take the first instructor and treat them as a user for this context.
            const instructors = await getMockInstructors();
            if (instructors.length > 0) {
                 setInstructor(instructors[0]);
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
                    <div className="mx-auto max-w-2xl">
                       <Skeleton className="h-96 w-full" />
                    </div>
                </main>
            </div>
        )
    }

    if (!instructor) {
        return <div className="p-6">Error: No se pudo cargar la información del usuario actual.</div>
    }
    
    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
            <header>
                <h1 className="font-headline text-3xl font-semibold">Añadir Crédito a Alumno</h1>
                <p className="text-muted-foreground">
                    Selecciona un alumno y la cantidad para recargar su saldo.
                </p>
            </header>
            <main className="flex-1">
                <div className="mx-auto max-w-2xl">
                    <AddCreditForm 
                        instructor={instructor}
                    />
                </div>
            </main>
        </div>
    );
}
