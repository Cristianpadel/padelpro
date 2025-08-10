// src/app/(app)/match-day/[id]/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { notFound, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getMockCurrentUser, getMatchDayEventById, getMatchDayInscriptions, getMockMatches, addMatchDayInscription, cancelMatchDayInscription, selectPreferredPartner, getMockPadelCourts } from '@/lib/mockData';
import type { MatchDayEvent, User, MatchDayInscription, Match, PadelCourt } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Users, Trophy, Handshake, UserCheck, UserPlus, Info, PartyPopper, ArrowRight, Check, HardHat } from 'lucide-react';
import MatchDayDrawResults from '@/components/match-day/MatchDayDrawResults';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
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


export default function MatchDayDetailPage() {
    const params = useParams();
    const id = params.id as string;

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
            const [eventData, user, courts] = await Promise.all([
                getMatchDayEventById(id),
                getMockCurrentUser(),
                getMockPadelCourts()
            ]);
            setAllCourts(courts);

            if (!eventData) {
                setEvent(null);
                return;
            }
            setEvent(eventData);
            setCurrentUser(user);
            
            const eventInscriptions = await getMatchDayInscriptions(id);
            setInscriptions(eventInscriptions);

            if(user) {
                const userInscr = eventInscriptions.find(i => i.userId === user.id) || null;
                setUserInscription(userInscr);
            }

            if (eventData.matchesGenerated) {
                const allMatches = await getMockMatches();
                setMatches(allMatches.filter(m => m.eventId === id));
            }

        } catch (error) {
            console.error("Error loading event details:", error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if(id) loadEventData();
    }, [id, loadEventData]);

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
                toast({ title: 'Preferencia Guardada', description: 'Has seleccionado a tu compañero preferido.', className: 'bg-primary text-primary-foreground' });
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
        notFound();
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
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                             <Button variant="link" className="text-destructive h-auto p-0 mt-2 text-xs" disabled={isSubmitting}>Cancelar inscripción</Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader><AlertDialogTitle>¿Confirmar Cancelación?</AlertDialogTitle><AlertDialogDescription>Si cancelas tu inscripción, tu plaza podría ser ocupada por alguien en la lista de reserva.</AlertDialogDescription></AlertDialogHeader>
                                            <AlertDialogFooter><AlertDialogCancel>Volver</AlertDialogCancel><AlertDialogAction onClick={handleCancelInscription} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Sí, Cancelar</AlertDialogAction></AlertDialogFooter>
                                        </AlertDialogContent>
                                     </AlertDialog>
                                </div>
                            ) : (
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
                                    <p className="font-bold flex items-center"><UserPlus className="mr-2 h-4 w-4"/>Inscripciones Abiertas</p>
                                    <p className="text-sm mt-1">{mainListFull ? 'La lista principal está llena, pero aún puedes apuntarte a la lista de reserva.' : '¡Todavía hay plazas disponibles!'}</p>
                                    <Button onClick={handleSignUp} className="mt-2" size="sm" disabled={isSubmitting}>
                                       {isSubmitting ? <Check className="animate-spin" /> : null} Apuntarme
                                    </Button>
                                </div>
                            )}
                    </CardContent>
                </Card>

                <MatchDayPlayerGrid 
                    event={event}
                    inscriptions={inscriptions}
                    currentUser={currentUser}
                    onSelectPartner={handleSelectPartner}
                />
                   
                <MatchDayDrawResults matches={matches} />
            </main>
        </div>
    );
}
