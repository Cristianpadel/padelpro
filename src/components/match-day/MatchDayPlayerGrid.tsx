// src/components/match-day/MatchDayPlayerGrid.tsx
"use client";

import React, { useState, useEffect } from 'react';
import type { MatchDayEvent, MatchDayInscription, User, PadelCourt, Match } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getInitials } from '@/lib/utils';
import { UserPlus, CheckCircle, Handshake, Dices, Swords, HardHat, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { getMockPadelCourts } from '@/lib/mockData';

type SimulatedTeam = {
  players: (MatchDayInscription | { id: string; userName: string; userLevel: string; userProfilePictureUrl?: string, isEmptySlot?: boolean })[];
  teamLevel: number;
};

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
    const [simulatedMatches, setSimulatedMatches] = useState<SimulatedTeam[][]>([]);


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
            userLevel: '0.0', // Assign lowest level
            status: 'main', 
            inscriptionTime: new Date(),
        }));
        
        let playersToProcess = [...mainList, ...emptySlots];
        let mutualPairs: SimulatedTeam[] = [];
        let singles: (MatchDayInscription | { id: string; userName: string; userLevel: string; userProfilePictureUrl?: string, isEmptySlot?: boolean })[] = [];

        const processedUserIds = new Set<string>();

        // 1. Find mutual pairs first
        for (const playerA of playersToProcess) {
            if (processedUserIds.has(playerA.userId) || playerA.userName === 'Plaza Libre') continue;
            
            const partnerId = playerA.preferredPartnerId;
            if (!partnerId) continue;
            
            const playerB = playersToProcess.find(p => p.userId === partnerId);

            if (playerB && playerB.preferredPartnerId === playerA.userId) {
                const levelA = parseFloat(playerA.userLevel);
                const levelB = parseFloat(playerB.userLevel);
                const teamLevel = Math.min(isNaN(levelA) ? 99 : levelA, isNaN(levelB) ? 99 : levelB);
                
                mutualPairs.push({ players: [playerA, playerB], teamLevel });
                processedUserIds.add(playerA.userId);
                processedUserIds.add(playerB.userId);
            }
        }
        
        // 2. The rest are singles
        singles = playersToProcess.filter(p => !processedUserIds.has(p.userId));

        // 3. Sort singles by level (descending)
        singles.sort((a, b) => {
             const levelA = parseFloat(a.userLevel);
             const levelB = parseFloat(b.userLevel);
             return (isNaN(levelB) ? 0 : levelB) - (isNaN(levelA) ? 0 : levelA);
        });

        // 4. Form pairs from singles
        let singlePairs: SimulatedTeam[] = [];
        for (let i = 0; i < singles.length; i += 2) {
             if (singles[i+1]) {
                const playerA = singles[i];
                const playerB = singles[i+1];
                const levelA = parseFloat(playerA.userLevel);
                const levelB = parseFloat(playerB.userLevel);
                const teamLevel = Math.min(isNaN(levelA) ? 99 : levelA, isNaN(levelB) ? 99 : levelB);
                singlePairs.push({ players: [playerA, playerB], teamLevel });
            } else {
                // Odd one out - create a pair with an empty slot
                const playerA = singles[i];
                 const levelA = parseFloat(playerA.userLevel);
                 singlePairs.push({ players: [playerA, {id: 'empty-single', userName: 'Plaza Libre', userLevel: '0.0', isEmptySlot: true}], teamLevel: isNaN(levelA) ? 0 : levelA });
            }
        }

        // 5. Combine all pairs and sort by team level
        let allPairs = [...mutualPairs, ...singlePairs];
        allPairs.sort((a, b) => b.teamLevel - a.teamLevel);

        // 6. Form matches
        const finalMatches: SimulatedTeam[][] = [];
        for (let i = 0; i < allPairs.length; i += 2) {
            if (allPairs[i+1]) {
                finalMatches.push([allPairs[i], allPairs[i+1]]);
            } else {
                // Handle the case of an odd number of pairs if necessary
                finalMatches.push([allPairs[i]]);
            }
        }
        
        setSimulatedMatches(finalMatches);
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
                                
                                return (
                                    <button
                                        key={inscription.id}
                                        onClick={!isCurrentUser && userInscription ? () => onSelectPartner(inscription.userId) : undefined}
                                        disabled={isCurrentUser || !userInscription}
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
                                    </button>
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
                                            <UserPlus className="h-8 w-8 opacity-50" />
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
                                <Button onClick={handleSimulateDraw} size="lg" className="w-full bg-purple-600 text-white hover:bg-purple-700 sm:w-auto" disabled={!userInscription}>
                                    <Dices className="mr-2 h-4 w-4" />
                                    Simular Sorteo
                                </Button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {eventCourts.map((court, index) => {
                                const match = simulatedMatches[index];
                                return (
                                    <div key={court.id} className="p-3 border rounded-lg flex flex-col justify-between bg-secondary/20 shadow-sm min-h-40">
                                        <div>
                                            <p className="font-semibold text-sm truncate">{court.name}</p>
                                            <Badge variant="outline" className="text-xs">Pista #{court.courtNumber}</Badge>
                                        </div>
                                        <div className="flex-grow flex items-center justify-center">
                                            {match ? (
                                                <div className="w-full max-w-[150px] aspect-[2/3] bg-green-500 rounded-md p-2 flex flex-col justify-between items-center relative shadow-lg border-2 border-white/50">
                                                    {/* Top side players */}
                                                    <div className="w-full flex justify-around">
                                                       {match[0].players.map(p => <Avatar key={p.id} className="h-8 w-8 border-2 border-white"><AvatarImage src={p.userProfilePictureUrl} data-ai-hint="player avatar"/><AvatarFallback>{getInitials(p.userName || '')}</AvatarFallback></Avatar>)}
                                                    </div>
                                                    {/* Net */}
                                                    <div className="h-0.5 w-full bg-white/50 my-1"></div>
                                                    {/* Bottom side players */}
                                                    <div className="w-full flex justify-around">
                                                         {match[1].players.map(p => <Avatar key={p.id} className="h-8 w-8 border-2 border-white"><AvatarImage src={p.userProfilePictureUrl} data-ai-hint="player avatar"/><AvatarFallback>{getInitials(p.userName || '')}</AvatarFallback></Avatar>)}
                                                    </div>
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
