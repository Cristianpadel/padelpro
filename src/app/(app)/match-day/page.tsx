// src/app/(app)/match-day/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Trophy, Calendar, Users, ArrowRight, UserCheck, Handshake, Info, Ticket } from "lucide-react";
import { getMockCurrentUser, fetchActiveMatchDayEvents, getMatchDayInscriptions, addMatchDayInscription, cancelMatchDayInscription } from '@/lib/mockData';
import type { MatchDayEvent, User, MatchDayInscription } from '@/types';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import MatchDayInscriptionList from '@/components/match-day/MatchDayInscriptionList';
import MatchDayPartnerSelectionDialog from '@/components/match-day/MatchDayPartnerSelectionDialog';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function MatchDayPage() {
    const [event, setEvent] = useState<MatchDayEvent | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [inscriptions, setInscriptions] = useState<MatchDayInscription[]>([]);
    const [userInscription, setUserInscription] = useState<MatchDayInscription | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, startTransition] = useTransition();

    const [isPartnerDialogOpen, setIsPartnerDialogOpen] = useState(false);

    const { toast } = useToast();

    const loadEventData = useCallback(async () => {
        setLoading(true);
        try {
            const user = await getMockCurrentUser();
            setCurrentUser(user);

            const activeEvents = await fetchActiveMatchDayEvents('club-1'); // Assuming a single club for now
            const nextEvent = activeEvents.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())[0] || null;
            setEvent(nextEvent);

            if (nextEvent && user) {
                const eventInscriptions = await getMatchDayInscriptions(nextEvent.id);
                setInscriptions(eventInscriptions);
                const userInscr = eventInscriptions.find(i => i.userId === user.id) || null;
                setUserInscription(userInscr);
            }
        } catch (error) {
            console.error("Error loading Match-Day data", error);
            toast({ title: "Error", description: "No se pudo cargar la información del evento.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

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
                loadEventData(); // Refresh data
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
                loadEventData(); // Refresh data
            }
        });
    };
    
    if (loading) {
        return <Skeleton className="h-[500px] w-full max-w-lg mx-auto" />;
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
    
    const timeToEvent = formatDistanceToNowStrict(new Date(event.eventDate), { locale: es, addSuffix: true });
    const mainListFull = inscriptions.filter(i => i.status === 'main').length >= event.maxPlayers;
    const reserveListFull = event.reservePlayers ? inscriptions.filter(i => i.status === 'reserve').length >= event.reservePlayers : true;
    const canSignUp = !mainListFull || !reserveListFull;
    
    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 items-center justify-center">
            <Card className="w-full max-w-lg text-center shadow-2xl border-2 border-amber-300/50 bg-amber-50/20">
              <CardHeader>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 border-4 border-white shadow-md">
                  <Trophy className="h-8 w-8" />
                </div>
                <CardTitle className="mt-4 font-headline text-3xl text-amber-900">{event.name}</CardTitle>
                <CardDescription className="text-amber-800/80">
                  Apúntate al evento social. Se crearán partidas por sorteo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm font-semibold text-amber-900/90 flex items-center justify-center gap-4">
                    <span className="flex items-center"><Calendar className="mr-1.5 h-4 w-4"/>{format(new Date(event.eventDate), "eeee, d MMMM, HH:mm'h'", { locale: es })}</span>
                    <span className="flex items-center"><Ticket className="mr-1.5 h-4 w-4"/>{event.price ? `${event.price.toFixed(2)}€` : 'Gratis'}</span>
                </div>
                
                 {userInscription ? (
                    <div className="p-4 rounded-lg bg-green-100 border border-green-300 text-green-800 space-y-3">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12 border-2 border-white">
                                <AvatarImage src={currentUser?.profilePictureUrl} />
                                <AvatarFallback>{getInitials(currentUser?.name || '')}</AvatarFallback>
                            </Avatar>
                            <div className="text-left">
                                <p className="font-bold text-lg">¡Estás dentro!</p>
                                <Badge variant={userInscription.status === 'main' ? 'default' : 'secondary'} className={userInscription.status === 'main' ? 'bg-green-600' : ''}>
                                    {userInscription.status === 'main' ? 'Lista Principal' : 'Lista de Reserva'}
                                </Badge>
                            </div>
                        </div>
                         <Button onClick={handleCancelInscription} variant="destructive" size="sm" className="w-full" disabled={isSubmitting}>Cancelar Inscripción</Button>
                    </div>
                ) : (
                    <>
                        <p className="font-bold text-lg text-amber-900">El evento empieza {timeToEvent}</p>
                        <Button onClick={handleSignUp} size="lg" className="w-full bg-amber-600 hover:bg-amber-700 text-white shadow-lg" disabled={isSubmitting || !canSignUp}>
                            {isSubmitting ? "Procesando..." : (!canSignUp ? "Evento Completo" : "¡Apúntame!")}
                        </Button>
                    </>
                 )}

                 <div className="flex justify-center gap-2 pt-2">
                     <Dialog>
                         <DialogTrigger asChild>
                             <Button variant="outline" size="sm"><Users className="mr-2 h-4 w-4" /> Ver Inscritos ({inscriptions.length})</Button>
                         </DialogTrigger>
                         <DialogContent>
                             <DialogHeader>
                                 <DialogTitle>Inscritos en {event.name}</DialogTitle>
                                 <DialogDescription>Lista de jugadores apuntados al evento.</DialogDescription>
                             </DialogHeader>
                             <MatchDayInscriptionList inscriptions={inscriptions} />
                         </DialogContent>
                     </Dialog>
                    <Button variant="outline" size="sm" onClick={() => setIsPartnerDialogOpen(true)}><Handshake className="mr-2 h-4 w-4" /> Pareja</Button>
                 </div>
              </CardContent>
              <CardFooter className="flex-col gap-2 text-xs text-amber-900/70">
                 <p className="flex items-center gap-1.5"><Info className="h-4 w-4"/> El sorteo de partidas es automático.</p>
                 <Link href={`/match-day/${event.id}`} passHref><Button variant="link" size="sm" className="text-amber-700">Ver detalles del evento</Button></Link>
              </CardFooter>
            </Card>

             <MatchDayPartnerSelectionDialog
                isOpen={isPartnerDialogOpen}
                onOpenChange={setIsPartnerDialogOpen}
            />
        </div>
    );
}
