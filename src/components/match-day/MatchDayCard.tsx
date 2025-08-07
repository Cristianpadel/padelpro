"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import type { MatchDayEvent } from '@/types';

interface MatchDayCardProps {
    event: MatchDayEvent;
}

const MatchDayCard: React.FC<MatchDayCardProps> = ({ event }) => {
    return (
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
                <CardTitle>{event.name}</CardTitle>
                <CardDescription>¡Apúntate a nuestro evento semanal!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>{format(new Date(event.eventDate), "PPPP", { locale: es })}</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="mr-2 h-4 w-4" />
                    <span>{event.maxPlayers} Plazas (+{event.reservePlayers} reservas)</span>
                </div>
                <Link href={`/match-day/${event.id}`} passHref>
                    <Button className="w-full mt-2">
                        Ver Evento <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
            </CardContent>
        </Card>
    );
};

export default MatchDayCard;
