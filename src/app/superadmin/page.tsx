"use client";

import React from 'react';
import SuperAdminPanel from '@/components/superadmin/SuperAdminPanel';


export default function SuperAdminPage() {
    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
            <header>
                <h1 className="font-headline text-3xl font-semibold">Panel de Super Administración</h1>
                <p className="text-muted-foreground">
                    Gestiona todos los clubes e instructores del sistema.
                </p>
            </header>
            <main className="flex-1">
                <SuperAdminPanel />
            </main>
        </div>
    );
}
