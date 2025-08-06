"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { Instructor, DayOfWeek, TimeRange } from '@/types';
import { getMockInstructors, updateInstructor } from '@/lib/mockData';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import InstructorAvailabilitySettings from '../components/InstructorAvailabilitySettings';

export default function InstructorPreferencesPage() {
    const [instructor, setInstructor] = useState<Instructor | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchInstructorData = useCallback(async () => {
        setLoading(true);
        try {
            // In a real app, you'd get the currently logged-in instructor.
            // For now, we'll simulate getting Ana García.
            const instructors = await getMockInstructors();
            const currentInstructor = instructors.find(i => i.id === 'inst-2');
            setInstructor(currentInstructor || null);
        } catch (error) {
            toast({ title: "Error", description: "No se pudo cargar la información del instructor.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchInstructorData();
    }, [fetchInstructorData]);

    const handleSave = async (unavailableHours: Partial<Record<DayOfWeek, TimeRange[]>>) => {
        if (!instructor) return;
        const result = await updateInstructor(instructor.id, { unavailableHours });
        if ('error' in result) {
            throw new Error(result.error);
        } else {
            // Re-fetch instructor data to get the latest version
            fetchInstructorData();
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
                    <div className="mx-auto max-w-4xl space-y-6">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                </main>
            </div>
        );
    }

    if (!instructor) {
        return <div className="p-6">Error: No se encontró al instructor.</div>;
    }

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
            <header>
                <h1 className="font-headline text-3xl font-semibold">Preferencias de Instructor</h1>
                <p className="text-muted-foreground">
                    Gestiona tu horario y otras configuraciones.
                </p>
            </header>
            <main className="flex-1">
                <div className="mx-auto max-w-4xl">
                   <InstructorAvailabilitySettings 
                        instructor={instructor}
                        onSaveUnavailableHours={handleSave}
                   />
                </div>
            </main>
        </div>
    );
}