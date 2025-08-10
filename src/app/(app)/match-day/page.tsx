// src/app/(app)/match-day/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getMockCurrentUser, fetchActiveMatchDayEvents, getMatchDayInscriptions, getMockMatches, addMatchDayInscription, cancelMatchDayInscription, selectPreferredPartner, getMockPadelCourts } from '@/lib/mockData';
import type { MatchDayEvent, User, MatchDayInscription, Match, PadelCourt } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Users, Trophy, Handshake, UserCheck, UserPlus, Info, ArrowRight, PartyPopper, Check, HardHat } from 'lucide-react';
import MatchDayDrawResults from '@/components/match-day/MatchDayDrawResults';
import MatchDayPlayerGrid from '@/components/match-day/MatchDayPlayerGrid';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function MatchDayPage() {
    const [event, setEvent] = useState<MatchDayEvent | null>(null);
    const [inscriptions, setInscriptions] = useState<MatchDayInscription[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userInscription, setUserInscription] = useState<MatchDayInscription | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, startTransition] = useTransition();
    const { toast } = useToast();
    const [allCourts, setAllCourts] = useState<PadelCourt[]>([]);


    const loadEventData = useCallback(async () => {
        setLoading(true);
        try {
            const [user, courts] = await Promise.all([
                getMockCurrentUser(),
                getMockPadelCourts()
            ]);
            setCurrentUser(user);
            setAllCourts(courts);
            
            const activeEvents = await fetchActiveMatchDayEvents('club-1');
            const nextEvent = activeEvents.sort((a,b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())[0] || null;
            setEvent(nextEvent);

            if (nextEvent) {
                const eventInscriptions = await getMatchDayInscriptions(nextEvent.id);
                setInscriptions(eventInscriptions);

                if (user) {
                    const userInscr = eventInscriptions.find(i => i.userId === user.id) || null;
                    setUserInscription(userInscr);
                }

                if (nextEvent.matchesGenerated) {
                    const allMatches = await getMockMatches();
                    setMatches(allMatches.filter(m => m.eventId === nextEvent.id));
                }
            }

        } catch (error) {
            console.error("Error loading event details:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadEventData();
    }, [loadEventData]);

    const handleSignUp = () => {
        if (!event || !currentUser) return;
        startTransition(async () => {
            const result = await addMatchDayInscription(event.id, currentUser.id);
            if ('error' in result) {
                toast({ title: "Error al Inscribirse", description: result.error, variant: "destructive" });
            } else {
                toast({ title: `¡Inscripción Confirmada!`, description: `Te has apuntado al ${event.name}. Estado: ${result.status === 'main' ? 'Lista Principal' : 'Lista de Reserva'}`});
                loadEventData();
            }
        });
    };
    
    const handleCancelInscription = () => {
        if (!event || !userInscription) return;
        startTransition(async () => {
            const result = await cancelMatchDayInscription(event.id, userInscription.userId);
            if ('error' in result) {
                toast({ title: "Error al Cancelar", description: result.error, variant: "destructive" });
            } else {
                toast({ title: "Inscripción Cancelada", description: "Has cancelado tu inscripción al evento." });
                loadEventData();
            }
        });
    };

    const handleSelectPartner = (partnerId: string) => {
        if (!currentUser || !event) return;
        startTransition(async () => {
             const result = await selectPreferredPartner(currentUser.id, event.id, partnerId);
             if ('error' in result) {
                 toast({ title: 'Error', description: result.error, variant: 'destructive' });
             } else {
                toast({ 
                    title: 'Preferencia Guardada', 
                    description: 'Tu elección será una preferencia en el sorteo. Si tu compañero también te elige, ¡seréis pareja asegurada!',
                    className: 'bg-primary text-primary-foreground',
                    duration: 6000
                });
                loadEventData();
             }
        });
    };

    if (loading) {
        return (
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <Skeleton className="h-10 w-2/3" />
                <Skeleton className="h-6 w-1/3" />
                <div className="grid md:grid-cols-1 gap-6">
                    <Skeleton className="h-96 w-full" />
                </div>
            </div>
        );
    }
    
    if (!event) {
       return (
             <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 items-center justify-center">
                <Card className="w-full max-w-lg text-center shadow-lg border-2 border-dashed border-muted-foreground/30">
                    <CardHeader>
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <PartyPopper className="h-8 w-8" />
                        </div>
                        <CardTitle className="mt-4 font-headline text-2xl">Eventos Match-Day</CardTitle>
                        <CardDescription>
                            No hay eventos Match-Day programados por el momento. ¡Vuelve pronto para más diversión y competición!
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }
    
    const reservedCourtNumbers = event.courtIds.map(id => allCourts.find(c => c.id === id)?.courtNumber).filter(Boolean).join(', ');
    const mainListFull = inscriptions.filter(i => i.status === 'main').length >= event.maxPlayers;

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
            <header>
                <h1 className="font-headline text-3xl font-semibold">{event.name}</h1>
                 <p className="text-muted-foreground flex items-center gap-4 flex-wrap">
                    <span className="flex items-center"><Calendar className="mr-1.5 h-4 w-4"/>{format(new Date(event.eventDate), "PPPP 'a las' HH:mm'h'", { locale: es })}</span>
                    <span className="flex items-center"><Users className="mr-1.5 h-4 w-4"/>{event.maxPlayers} Plazas (+{event.reservePlayers} reservas)</span>
                    {reservedCourtNumbers && <span className="flex items-center"><HardHat className="mr-1.5 h-4 w-4"/>Pistas: {reservedCourtNumbers}</span>}
                </p>
            </header>
            <main className="grid grid-cols-1 gap-6">
                   
                   <MatchDayPlayerGrid 
                        event={event}
                        inscriptions={inscriptions}
                        currentUser={currentUser}
                        onSelectPartner={handleSelectPartner}
                        onSignUp={handleSignUp}
                        isSubmitting={isSubmitting}
                   />
                   
                   <MatchDayDrawResults matches={matches} />
            </main>
        </div>
    );
}
