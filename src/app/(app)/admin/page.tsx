// src/app/(app)/admin/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import AdminPanel from '@/components/admin/AdminPanel';
import { clubs } from '@/lib/mockData';
import type { Club } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminPage() {
    const [adminClub, setAdminClub] = useState<Club | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // In a real app, you'd fetch the club based on the logged-in admin
        // For now, we'll just use the first club from our mock data.
        const club = clubs[0];
        if (club) {
            setAdminClub(club);
        }
        setLoading(false);
    }, []);

    if (loading || !adminClub) {
        return (
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                 <header>
                    <Skeleton className="h-10 w-1/3" />
                    <Skeleton className="mt-2 h-5 w-2/3" />
                </header>
                <main className="flex-1">
                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => (
                            <Skeleton key={i} className="h-20 w-full" />
                        ))}
                   </div>
                </main>
            </div>
        )
    }

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
            <header>
                <h1 className="font-headline text-3xl font-semibold">Panel de Administración del Club</h1>
                <p className="text-muted-foreground">
                    Gestiona todos los aspectos de <span className="font-semibold text-primary">{adminClub.name}</span>.
                </p>
            </header>
            <main className="flex-1">
                <AdminPanel adminClub={adminClub} />
            </main>
        </div>
    );
}