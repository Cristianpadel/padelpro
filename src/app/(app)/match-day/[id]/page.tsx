// src/app/(app)/match-day/[id]/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { notFound } from "next/navigation";

interface MatchDayDetailPageProps {
    params: {
        id: string;
    };
}

export default function MatchDayDetailPage({ params }: MatchDayDetailPageProps) {
    // In a real app, you would fetch event details by params.id
    // If not found, you would call notFound() from next/navigation
    // For now, we'll just display a placeholder.

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
            <header>
                <h1 className="font-headline text-3xl font-semibold">Detalles del Evento Match-Day</h1>
                <p className="text-muted-foreground">
                    Viendo detalles para el evento con ID: {params.id}
                </p>
            </header>
            <main className="flex-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Evento de Ejemplo</CardTitle>
                        <CardDescription>Esta es una página de marcador de posición para un evento específico de Match-Day.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>Aquí se mostrarían los detalles completos del evento, lista de inscritos, y las partidas generadas una vez que el sorteo se haya realizado.</p>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
