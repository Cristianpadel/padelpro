// src/components/schedule/PersonalMatchDay.tsx
"use client";

import React, { useState, useEffect, useTransition } from 'react';
import type { User, MatchDayInscription, MatchDayEvent, Match, MatchBooking } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { fetchUserMatchDayInscriptions, fetchUserMatchBookings, getMockMatches, getMockMatchDayEvents, cancelMatchDayInscription } from '@/lib/mockData';
import { PartyPopper, Calendar, Users, ArrowRight, Info, Euro, Swords, Hash, Clock, Ban, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '../ui/badge';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';
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

interface PersonalMatchDayProps {
  currentUser: User;
  onBookingActionSuccess?: () => void;
}

const PersonalMatchDay: React.FC<PersonalMatchDayProps> = ({ currentUser, onBookingActionSuccess }) => {
  const [inscriptions, setInscriptions] = useState<(MatchDayInscription & { eventDetails?: MatchDayEvent })[]>([]);
  const [eventMatches, setEventMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();

  const loadData = React.useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [fetchedInscriptions, userMatchBookings, allMatches] = await Promise.all([
        fetchUserMatchDayInscriptions(currentUser.id),
        fetchUserMatchBookings(currentUser.id),
        getMockMatches()
      ]);
      setInscriptions(fetchedInscriptions);
      
      const userEventMatchIds = userMatchBookings
          .filter(b => b.matchDetails?.eventId)
          .map(b => b.activityId);
          
      const matchesForUser = allMatches.filter(m => userEventMatchIds.includes(m.id));
      setEventMatches(matchesForUser);
      
    } catch (error) {
      console.error("Error fetching match-day data:", error);
      toast({ title: "Error", description: "No se pudieron cargar tus datos de eventos.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [currentUser, toast]);

  useEffect(() => {
    loadData();
  }, [loadData, onBookingActionSuccess]);

  const handleCancel = (eventId: string, userId: string) => {
    setProcessingId(eventId);
    startTransition(async () => {
        const result = await cancelMatchDayInscription(eventId, userId);
        if ('error' in result) {
            toast({ title: "Error al cancelar", description: result.error, variant: 'destructive' });
        } else {
            toast({ title: "Inscripción Cancelada", description: "Te has dado de baja del evento." });
            if (onBookingActionSuccess) onBookingActionSuccess();
        }
        setProcessingId(null);
    });
  }


  if (loading) {
    return (
        <div className="space-y-3">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-48 w-full" />
        </div>
    );
  }

  if (inscriptions.length === 0 && eventMatches.length === 0) {
    return null;
  }
  
  const allEventIds = new Set([...inscriptions.map(i => i.eventId), ...eventMatches.map(m => m.eventId!)]);

  if (allEventIds.size === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3 text-orange-600 flex items-center"><PartyPopper className="mr-2 h-5 w-5" /> Eventos Match-Day</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from(allEventIds).map(eventId => {
            const inscription = inscriptions.find(i => i.eventId === eventId);
            const matchesForThisEvent = eventMatches.filter(m => m.eventId === eventId);
            const eventDetails = inscription?.eventDetails || getMockMatchDayEvents().find(e => e.id === eventId);

            if (!eventDetails) return null;
            const isEventDrawn = eventDetails.matchesGenerated;

            return (
                <Card key={eventId} className="flex flex-col shadow-lg overflow-hidden w-full max-w-xs mx-auto">
                    <CardHeader className="p-3 bg-muted/50">
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="text-base">{eventDetails.name}</CardTitle>
                                <CardDescription className="text-xs">{format(new Date(eventDetails.eventDate), "eeee, d MMM HH:mm'h'", { locale: es })}</CardDescription>
                            </div>
                            <Link href={`/match-day/${eventDetails.id}`} passHref>
                                <Button variant="ghost" size="icon" className="h-7 w-7"><ArrowRight className="h-4 w-4"/></Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent className="p-3 flex-grow flex flex-col items-center justify-center">
                         <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                            <AvatarImage src={currentUser.profilePictureUrl} alt={currentUser.name} />
                            <AvatarFallback className="text-3xl">{getInitials(currentUser.name)}</AvatarFallback>
                        </Avatar>
                        <p className="font-semibold mt-2">{currentUser.name}</p>
                        {inscription && !isEventDrawn && (
                             <Badge variant={inscription.status === 'main' ? 'default' : 'secondary'} className={cn("mt-2", inscription.status === 'main' ? "bg-green-600 hover:bg-green-700" : "")}>
                                {inscription.status === 'main' ? 'Inscrito en Lista Principal' : 'En Lista de Reserva'}
                            </Badge>
                        )}
                        {isEventDrawn && (
                            <Badge className="mt-2" variant="destructive">¡Sorteo Realizado!</Badge>
                        )}
                    </CardContent>
                    <CardFooter className="p-2 border-t">
                        {inscription && !isEventDrawn ? (
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm" className="w-full" disabled={isProcessing}>
                                        {isProcessing && processingId === eventId ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <Ban className="mr-2 h-4 w-4"/>}
                                        Cancelar
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>¿Cancelar inscripción?</AlertDialogTitle><AlertDialogDescription>Se te devolverá el saldo bloqueado para esta inscripción.</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter><AlertDialogCancel>Volver</AlertDialogCancel><AlertDialogAction onClick={() => handleCancel(eventId, currentUser.id)}>Confirmar Cancelación</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                             </AlertDialog>
                        ) : (
                             <Button variant="outline" size="sm" className="w-full" asChild>
                                 <Link href={`/match-day/${eventDetails.id}`}>
                                    Ver Partidas
                                </Link>
                             </Button>
                        )}
                    </CardFooter>
                </Card>
            )
        })}
        </div>
    </div>
  );
};

export default PersonalMatchDay;
