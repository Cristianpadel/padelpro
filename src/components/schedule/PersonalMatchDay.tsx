"use client";

import React, { useState, useEffect } from 'react';
import type { User, MatchDayInscription, MatchDayEvent, Match, MatchBooking } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { fetchUserMatchDayInscriptions, fetchUserMatchBookings, getMockMatches, getMockMatchDayEvents } from '@/lib/mockData';
import { PartyPopper, Calendar, Users, ArrowRight, Info, Euro, Swords, Hash, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '../ui/badge';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface PersonalMatchDayProps {
  currentUser: User;
  onBookingActionSuccess?: () => void;
}

const PersonalMatchDay: React.FC<PersonalMatchDayProps> = ({ currentUser, onBookingActionSuccess }) => {
  const [inscriptions, setInscriptions] = useState<(MatchDayInscription & { eventDetails?: MatchDayEvent })[]>([]);
  const [eventMatches, setEventMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
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
    };

    loadData();
  }, [currentUser, toast, onBookingActionSuccess]);

  if (loading) {
    return (
        <div className="space-y-3">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-24 w-full" />
        </div>
    );
  }

  if (inscriptions.length === 0 && eventMatches.length === 0) {
    return null;
  }
  
  const allEventIds = new Set([...inscriptions.map(i => i.eventId), ...eventMatches.map(m => m.eventId!)]);

  if (allEventIds.size === 0) {
    return null; // Nothing to render
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3 text-orange-600 flex items-center"><PartyPopper className="mr-2 h-5 w-5" /> Eventos Match-Day</h3>
        <div className="space-y-4">
        {Array.from(allEventIds).map(eventId => {
            const inscription = inscriptions.find(i => i.eventId === eventId);
            const matchesForThisEvent = eventMatches.filter(m => m.eventId === eventId);
            const eventDetails = inscription?.eventDetails || getMockMatchDayEvents().find(e => e.id === eventId);

            if (!eventDetails) return null;

            return (
                <div key={eventId} className="p-3 bg-secondary/30 rounded-lg border">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                      <div>
                        <p className="font-semibold text-foreground">{eventDetails.name}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(eventDetails.eventDate), "EEEE, d MMM", { locale: es })}</p>
                      </div>
                       <Link href={`/match-day/${eventDetails.id}`} passHref>
                          <Button variant="ghost" size="sm" className="h-8 text-primary self-start sm:self-center mt-1 sm:mt-0">
                            Ir al Evento <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                    </div>

                    {matchesForThisEvent.length > 0 ? (
                        <div className="space-y-2">
                           {matchesForThisEvent.map(match => {
                                const team1 = match.bookedPlayers.slice(0, 2);
                                const team2 = match.bookedPlayers.slice(2, 4);

                                return (
                                <div key={match.id} className="p-2 border rounded-md bg-background">
                                    <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
                                        <span className="flex items-center"><Clock className="mr-1 h-3 w-3"/>{format(new Date(match.startTime), "HH:mm")}h</span>
                                        <span className="flex items-center"><Hash className="mr-1 h-3 w-3"/>Pista {match.courtNumber}</span>
                                    </div>
                                    <div className="flex items-center justify-around">
                                        <div className="flex items-center gap-2">
                                            {team1.map(p => <Avatar key={p.userId} className="h-7 w-7"><AvatarImage src={`https://randomuser.me/api/portraits/${getInitials(p.name || 'U') % 2 === 0 ? 'men' : 'women'}/${getInitials(p.name || 'U').charCodeAt(0)}.jpg`} /><AvatarFallback className="text-[10px]">{getInitials(p.name || 'U')}</AvatarFallback></Avatar>)}
                                        </div>
                                        <Swords className="h-4 w-4 text-destructive mx-2"/>
                                        <div className="flex items-center gap-2">
                                            {team2.map(p => <Avatar key={p.userId} className="h-7 w-7"><AvatarImage src={`https://randomuser.me/api/portraits/${getInitials(p.name || 'U') % 2 === 0 ? 'men' : 'women'}/${getInitials(p.name || 'U').charCodeAt(0)}.jpg`} /><AvatarFallback className="text-[10px]">{getInitials(p.name || 'U')}</AvatarFallback></Avatar>)}
                                        </div>
                                    </div>
                                </div>
                                );
                           })}
                        </div>
                    ) : inscription ? (
                         <div className="flex items-center space-x-2">
                             <Badge variant={inscription.status === 'main' ? 'default' : 'secondary'} className={inscription.status === 'main' ? "bg-green-600 hover:bg-green-700" : ""}>
                                {inscription.status === 'main' ? 'Inscrito' : 'En Reserva'}
                            </Badge>
                            <span className="text-sm text-muted-foreground">Esperando sorteo...</span>
                        </div>
                    ) : null }
                </div>
            )
        })}
        </div>
    </div>
  );
};

export default PersonalMatchDay;
