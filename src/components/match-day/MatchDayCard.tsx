// src/components/match-day/MatchDayCard.tsx
"use client";

import React from 'react';
import type { MatchDayEvent } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PartyPopper, Calendar, Clock, Users, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

interface MatchDayCardProps {
    event: MatchDayEvent;
    inscriptionCount: number;
}

const MatchDayCard: React.FC<MatchDayCardProps> = ({ event, inscriptionCount }) => {
    const isFull = inscriptionCount >= event.maxPlayers;

    return (
        <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <PartyPopper className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <CardTitle>{event.name}</CardTitle>
                        <CardDescription>{format(new Date(event.eventDate), "EEEE, d 'de' MMMM", { locale: es })}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-2 text-sm">
                <div className="flex items-center text-muted-foreground">
                    <Clock className="mr-2 h-4 w-4" />
                    <span>{format(new Date(event.eventDate), "HH:mm")}h - {event.eventEndTime ? format(new Date(event.eventEndTime), "HH:mm'h'") : ''}</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                    <Users className="mr-2 h-4 w-4" />
                    <span>{inscriptionCount} / {event.maxPlayers} jugadores</span>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
                <Badge variant={isFull ? "secondary" : "default"} className={isFull ? 'bg-destructive/10 text-destructive' : 'bg-green-100 text-green-800'}>
                    {isFull ? "Completo" : "¡Apúntate!"}
                </Badge>
                <Button asChild variant="ghost" size="sm">
                    <Link href={`/match-day/${event.id}`}>
                        Ver Evento <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
};

export default MatchDayCard;
