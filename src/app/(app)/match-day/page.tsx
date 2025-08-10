// src/app/(app)/match-day/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getMockCurrentUser, fetchActiveMatchDayEvents, getMatchDayInscriptions, getMockMatches, addMatchDayInscription, cancelMatchDayInscription } from '@/lib/mockData';
import type { MatchDayEvent, User, MatchDayInscription, Match } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Users, Trophy, Handshake, UserCheck, UserPlus, Info, ArrowRight } from 'lucide-react';
import MatchDayInscriptionList from '@/components/match-day/MatchDayInscriptionList';
import MatchDayDrawResults from '@/components/match-day/MatchDayDrawResults';
import MatchDayPartnerSelectionDialog from '@/components/match-day/MatchDayPartnerSelectionDialog';
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
    const [isPartnerDialogOpen, setIsPartnerDialogOpen] = useState(false);
    const { toast } = useToast();

    const loadEventData = useCallback(async () => {
        setLoading(true);
        try {
            const [user] = await Promise.all([
                getMockCurrentUser()
            ]);
            setCurrentUser(user);
            
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


    if (loading) {
        return (
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <Skeleton className="h-10 w-2/3" />
                <Skeleton className="h-6 w-1/3" />
                <div className="grid md:grid-cols-2 gap-6">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        );
    }
    
    if (!event) {
       return (
             <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 items-center justify-center">
                <Card className="w-full max-w-lg text-center shadow-lg">
                    <CardHeader>
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Trophy className="h-6 w-6" />
                        </div>
                        <CardTitle className="mt-4 font-headline text-2xl">Match-Day</CardTitle>
                        <CardDescription>
                            No hay eventos Match-Day programados por el momento. ¡Vuelve pronto!
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    const mainListFull = inscriptions.filter(i => i.status === 'main').length >= event.maxPlayers;

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
            <header>
                <h1 className="font-headline text-3xl font-semibold">{event.name}</h1>
                <p className="text-muted-foreground flex items-center gap-4">
                    <span className="flex items-center"><Calendar className="mr-1.5 h-4 w-4"/>{format(new Date(event.eventDate), "PPPP 'a las' HH:mm'h'", { locale: es })}</span>
                    <span className="flex items-center"><Users className="mr-1.5 h-4 w-4"/>{event.maxPlayers} Plazas (+{event.reservePlayers} reservas)</span>
                </p>
            </header>
            <main className="grid md:grid-cols-3 gap-8">
               <div className="md:col-span-2 space-y-6">
                   <Card>
                       <CardHeader>
                           <CardTitle>Estado del Evento</CardTitle>
                       </CardHeader>
                       <CardContent>
                            {event.matchesGenerated ? (
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                                    <p className="font-bold flex items-center"><Trophy className="mr-2 h-4 w-4"/>¡Sorteo Realizado!</p>
                                    <p className="text-sm mt-1">Las partidas para el evento han sido generadas. ¡Busca la tuya abajo!</p>
                                </div>
                            ) : userInscription ? (
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
                                    <p className="font-bold flex items-center"><UserCheck className="mr-2 h-4 w-4"/>Estás Inscrito</p>
                                    <div className="text-sm mt-1">Tu estado es: <Badge className={userInscription.status === 'main' ? "bg-blue-600" : ""}>{userInscription.status === 'main' ? 'Lista Principal' : 'Reserva'}</Badge></div>
                                     <Button onClick={handleCancelInscription} variant="link" className="text-destructive h-auto p-0 mt-2 text-xs" disabled={isSubmitting}>Cancelar inscripción</Button>
                                </div>
                            ) : (
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
                                    <p className="font-bold flex items-center"><UserPlus className="mr-2 h-4 w-4"/>Inscripciones Abiertas</p>
                                    <p className="text-sm mt-1">{mainListFull ? 'La lista principal está llena, pero aún puedes apuntarte a la lista de reserva.' : '¡Todavía hay plazas disponibles!'}</p>
                                    <Button onClick={handleSignUp} className="mt-2" size="sm" disabled={isSubmitting}>Apuntarme</Button>
                                </div>
                            )}
                       </CardContent>
                   </Card>
                   
                   <MatchDayDrawResults matches={matches} />
               </div>
               <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Inscritos ({inscriptions.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <MatchDayInscriptionList inscriptions={inscriptions} />
                        </CardContent>
                         <CardFooter>
                           <Button variant="outline" className="w-full" onClick={() => setIsPartnerDialogOpen(true)}>
                               <Handshake className="mr-2 h-4 w-4"/> Indicar Pareja
                           </Button>
                        </CardFooter>
                    </Card>
               </div>
            </main>
            <MatchDayPartnerSelectionDialog isOpen={isPartnerDialogOpen} onOpenChange={setIsPartnerDialogOpen} />
        </div>
    );
}
