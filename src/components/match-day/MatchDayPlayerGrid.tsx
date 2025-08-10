// src/components/match-day/MatchDayPlayerGrid.tsx
"use client";

import React, { useState, useEffect } from 'react';
import type { MatchDayEvent, MatchDayInscription, User, PadelCourt, Match } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getInitials } from '@/lib/utils';
import { UserPlus, PlusCircle, CheckCircle, Hourglass, Handshake, Dices, Swords, HardHat, RefreshCw } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { getMockPadelCourts } from '@/lib/mockData';


interface MatchDayPlayerGridProps {
    event: MatchDayEvent;
    inscriptions: MatchDayInscription[];
    currentUser: User | null;
    onSelectPartner: (partnerId: string) => void;
}

const MatchDayPlayerGrid: React.FC<MatchDayPlayerGridProps> = ({ event, inscriptions, currentUser, onSelectPartner }) => {
    const mainList = inscriptions.filter(i => i.status === 'main');
    const reserveList = inscriptions.filter(i => i.status === 'reserve');
    const userInscription = inscriptions.find(i => i.userId === currentUser?.id);
    const userPreferredPartnerId = userInscription?.preferredPartnerId;
    const { toast } = useToast();
    const [eventCourts, setEventCourts] = useState<PadelCourt[]>([]);
    const [simulatedMatches, setSimulatedMatches] = useState<Match[]>([]);


    useEffect(() => {
        const fetchCourts = async () => {
            if (event) {
                const allCourts = await getMockPadelCourts();
                const courtsForEvent = allCourts.filter(c => event.courtIds.includes(c.id));
                setEventCourts(courtsForEvent);
            }
        };
        fetchCourts();
    }, [event]);

    const isMainListFull = mainList.length >= event.maxPlayers;
    
    const handleSimulateDraw = () => {
        if (!userInscription) {
            toast({
                title: "Inscripción Requerida",
                description: "Debes estar inscrito para simular el sorteo.",
                variant: "destructive",
            });
            return;
        }

        const emptySlotsCount = event.maxPlayers - mainList.length;
        const emptySlots: MatchDayInscription[] = Array.from({ length: emptySlotsCount }, (_, i) => ({
            id: `empty-slot-${i}`,
            eventId: event.id,
            userId: `empty-${i}`,
            userName: 'Plaza Libre',
            userLevel: 'abierto',
            status: 'main', 
            inscriptionTime: new Date(),
        }));
        
        let playersToShuffle = [...mainList, ...emptySlots];
        
        for (let i = playersToShuffle.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [playersToShuffle[i], playersToShuffle[j]] = [playersToShuffle[j], playersToShuffle[i]];
        }
        
        const generatedMatches: Match[] = [];
        let courtIndex = 0;

        for (let i = 0; i < playersToShuffle.length; i += 4) {
            if (courtIndex >= eventCourts.length) break; 

            const matchPlayers = playersToShuffle.slice(i, i + 4);
            if (matchPlayers.length === 4) {
                const court = eventCourts[courtIndex];
                generatedMatches.push({
                    id: `sim-match-${court.id}`,
                    clubId: event.clubId,
                    startTime: event.eventDate,
                    endTime: event.eventEndTime || event.eventDate,
                    durationMinutes: 90,
                    courtNumber: court.courtNumber,
                    level: 'abierto',
                    category: 'abierta',
                    status: 'confirmed',
                    bookedPlayers: matchPlayers.map(p => ({
                        userId: p.userId, 
                        name: p.userName,
                        profilePictureUrl: p.userProfilePictureUrl 
                    })),
                });
                courtIndex++;
            }
        }
        
        setSimulatedMatches(generatedMatches);
    };

    const handleResetSimulation = () => {
        setSimulatedMatches([]);
    }

    return (
        <>
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between gap-4">
                     <div className="flex items-start gap-4">
                         <div className="flex-shrink-0 text-center font-bold bg-white p-2 rounded-lg w-auto shadow-lg border border-border/20">
                            <p className="text-xs uppercase text-muted-foreground">{format(new Date(event.eventDate), "EEEE", { locale: es })}</p>
                            <p className="text-5xl leading-none text-black font-bold">{format(new Date(event.eventDate), "d")}</p>
                            <p className="text-xs uppercase text-muted-foreground">{format(new Date(event.eventDate), "MMMM", { locale: es })}</p>
                        </div>
                        <div className="flex-grow pt-1">
                            <CardTitle>Jugadores Inscritos</CardTitle>
                            <CardDescription>Aquí puedes ver quién se ha apuntado y elegir tu pareja preferida para el sorteo.</CardDescription>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h4 className="font-semibold mb-3">Lista Principal ({mainList.length} / {event.maxPlayers})</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {Array.from({ length: event.maxPlayers }).map((_, index) => {
                            const inscription = mainList[index];
                            if (inscription) {
                                const isCurrentUser = inscription.userId === currentUser?.id;
                                const isPreferredPartner = userPreferredPartnerId === inscription.userId;
                                
                                const PlayerCardWrapper = isCurrentUser || !userInscription ? 'div' : 'button';

                                return (
                                    <PlayerCardWrapper
                                        key={inscription.id}
                                        onClick={!isCurrentUser && userInscription ? () => onSelectPartner(inscription.userId) : undefined}
                                        className={cn(
                                            "p-3 border rounded-lg flex flex-col items-center justify-center text-center bg-background shadow-md transition-all h-40 relative focus:outline-none focus:ring-2 focus:ring-offset-2",
                                            !isCurrentUser && userInscription ? "hover:bg-muted/80 cursor-pointer focus:ring-purple-500" : "cursor-default"
                                        )}
                                    >
                                        {isPreferredPartner && (
                                            <div className="absolute top-1 right-1 h-7 w-7 flex items-center justify-center rounded-full shadow-md bg-purple-600 text-white">
                                                <CheckCircle className="h-4 w-4"/>
                                            </div>
                                        )}
                                        <div className="flex flex-col items-center gap-1 overflow-hidden">
                                             <div className="relative">
                                                 <Avatar className={cn(
                                                    "h-16 w-16 p-0 overflow-hidden shadow-[inset_0_3px_6px_0_rgba(0,0,0,0.4)]",
                                                    isCurrentUser ? "border-[3px] border-primary shadow-lg" : "border-gray-300"
                                                )}>
                                                    <AvatarImage src={inscription.userProfilePictureUrl} data-ai-hint="player avatar"/>
                                                    <AvatarFallback className="text-xl">{getInitials(inscription.userName)}</AvatarFallback>
                                                </Avatar>
                                             </div>
                                            <div className="flex-1 overflow-hidden mt-1">
                                                <p className="font-medium text-sm truncate">{inscription.userName}</p>
                                                <Badge variant="outline" className="text-xs">N: {inscription.userLevel}</Badge>
                                            </div>
                                        </div>
                                    </PlayerCardWrapper>
                                );
                            }
                            // Render empty slot
                            return (
                                <div key={`empty-${index}`} className="p-3 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground bg-secondary/30 h-40 shadow-sm">
                                    <div className="relative inline-flex items-center justify-center h-16 w-16 rounded-full border-[3px] border-dashed border-gray-400 bg-white/50 shadow-inner">
                                        <UserPlus className="h-8 w-8" />
                                    </div>
                                    <p className="text-xs font-medium mt-2">Plaza Libre</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {event.reservePlayers > 0 && (
                    <div>
                        <h4 className="font-semibold mb-3">Lista de Reserva ({reserveList.length} / {event.reservePlayers})</h4>
                         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {Array.from({ length: event.reservePlayers }).map((_, index) => {
                                const inscription = reserveList[index];
                                if (inscription) {
                                     const isCurrentUser = inscription.userId === currentUser?.id;
                                    return (
                                        <div 
                                        key={inscription.id} 
                                        className={cn("p-3 border rounded-lg flex flex-col items-center justify-center text-center bg-background shadow-md h-40 relative",  isCurrentUser && "bg-blue-50 border-blue-300 ring-2 ring-blue-400")}
                                        >
                                            <div className="absolute top-1 left-2 text-xs font-bold text-muted-foreground">#{index + 1}</div>
                                             <div className="flex flex-col items-center gap-1 overflow-hidden">
                                                <div className="relative">
                                                     <Avatar className={cn(
                                                        "h-16 w-16 p-0 overflow-hidden shadow-[inset_0_3px_6px_0_rgba(0,0,0,0.2)] border-gray-300",
                                                         isCurrentUser && "border-[3px] border-primary shadow-lg"
                                                    )}>
                                                        <AvatarImage src={inscription.userProfilePictureUrl} data-ai-hint="player avatar"/>
                                                        <AvatarFallback className="text-xl">{getInitials(inscription.userName)}</AvatarFallback>
                                                    </Avatar>
                                                </div>
                                                <div className="flex-1 overflow-hidden mt-1">
                                                    <p className="font-medium text-sm truncate">{inscription.userName}</p>
                                                    <Badge variant="outline" className="text-xs">N: {inscription.userLevel}</Badge>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                                // Render empty reserve slot
                                return (
                                     <div key={`empty-reserve-${index}`} className={cn("p-3 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground h-40 shadow-sm", isMainListFull ? "bg-secondary/30" : "bg-gray-100 opacity-60")}>
                                        <div className="relative inline-flex items-center justify-center h-16 w-16 rounded-full border-[3px] border-dashed border-gray-400 bg-white/50 shadow-inner">
                                            <Hourglass className="h-8 w-8" />
                                        </div>
                                        <p className="text-xs font-medium mt-2">Plaza Reserva</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
                 
                 {!event.matchesGenerated && eventCourts.length > 0 && (
                    <div className="mt-6">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold">Pistas Reservadas para el Evento</h4>
                            <div className="flex items-center gap-2">
                                {simulatedMatches.length > 0 && (
                                    <Button variant="ghost" size="sm" onClick={handleResetSimulation}>
                                        <RefreshCw className="mr-2 h-4 w-4" /> Resetear
                                    </Button>
                                )}
                                <Button onClick={handleSimulateDraw} size="lg" className="bg-purple-600 text-white hover:bg-purple-700 sm:w-auto" disabled={!userInscription}>
                                    <Dices className="mr-2 h-4 w-4" />
                                    Simular Sorteo
                                </Button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {eventCourts.map((court, index) => {
                                const simulatedMatch = simulatedMatches[index];
                                return (
                                    <div key={court.id} className="p-3 border rounded-lg flex flex-col justify-between bg-background shadow-md min-h-40">
                                        <div>
                                            <p className="font-semibold text-sm truncate">{court.name}</p>
                                            <Badge variant="outline" className="text-xs">Pista #{court.courtNumber}</Badge>
                                        </div>
                                        <div className="flex-grow flex items-center justify-center">
                                            {simulatedMatch ? (
                                                <div className="grid grid-cols-2 gap-2 mt-2">
                                                    {simulatedMatch.bookedPlayers.map(player => (
                                                        <div key={player.userId} className="flex flex-col items-center text-center">
                                                             <Avatar className="h-10 w-10">
                                                                <AvatarImage src={player.profilePictureUrl} data-ai-hint="player avatar small" />
                                                                <AvatarFallback>{getInitials(player.name || '')}</AvatarFallback>
                                                            </Avatar>
                                                            <p className="text-[10px] mt-1 truncate max-w-[50px]">{player.name}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="relative inline-flex items-center justify-center h-16 w-16 rounded-full border-2 border-gray-300 bg-gray-100 shadow-inner">
                                                    <HardHat className="h-8 w-8 text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
        </>
    );
};

export default MatchDayPlayerGrid;
