// src/components/match-day/MatchDayPlayerGrid.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import type { MatchDayEvent, MatchDayInscription, User, PadelCourt, Match } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getInitials } from '@/lib/utils';
import { UserPlus, CheckCircle, Handshake, Dices, Swords, HardHat, RefreshCw, Clock, Loader2, Euro, Info, PartyPopper, Rocket, PiggyBank, Star, ThumbsUp, Lock, Scissors, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { getMockPadelCourts } from '@/lib/mockData';
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

type SimulatedPlayer = MatchDayInscription | { id: string; userName: string; userLevel: string; userProfilePictureUrl?: string; isEmptySlot?: boolean; userId: string; };

type SimulatedTeam = {
  players: SimulatedPlayer[];
  teamLevel: number;
};

interface MatchDayPlayerGridProps {
    event: MatchDayEvent;
    inscriptions: MatchDayInscription[];
    currentUser: User | null;
    onSelectPartner: (partnerId: string) => void;
    onSignUp: () => void;
    isSubmitting: boolean;
}

const MatchDayPlayerGrid: React.FC<MatchDayPlayerGridProps> = ({ event, inscriptions, currentUser, onSelectPartner, onSignUp, isSubmitting }) => {
    const mainList = inscriptions.filter(i => i.status === 'main');
    const reserveList = inscriptions.filter(i => i.status === 'reserve');
    const userInscription = inscriptions.find(i => i.userId === currentUser?.id);
    const userPreferredPartnerId = userInscription?.preferredPartnerId;
    const { toast } = useToast();
    const [eventCourts, setEventCourts] = useState<PadelCourt[]>([]);
    const [simulatedMatches, setSimulatedMatches] = useState<SimulatedTeam[][]>([]);
    const [isSimulating, setIsSimulating] = useState(false);
    const simulationResetTimer = useRef<NodeJS.Timeout | null>(null);
    const [countdown, setCountdown] = useState(30);
    const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);


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

    // Cleanup timer on component unmount
    useEffect(() => {
        return () => {
            if (simulationResetTimer.current) {
                clearTimeout(simulationResetTimer.current);
            }
             if (countdownTimerRef.current) {
                clearInterval(countdownTimerRef.current);
            }
        };
    }, []);

    const isMainListFull = mainList.length >= event.maxPlayers;
    
    const handleSimulateDraw = () => {
        const emptySlotsCount = event.maxPlayers - mainList.length;
        const emptySlots: SimulatedPlayer[] = Array.from({ length: emptySlotsCount }, (_, i) => ({
            id: `empty-slot-${i}`,
            userId: `empty-${i}`,
            userName: 'Plaza Libre',
            userLevel: '0.0', 
            isEmptySlot: true,
            userProfilePictureUrl: '/avatar-placeholder.png'
        }));
        
        let playersToProcess: SimulatedPlayer[] = [...mainList, ...emptySlots];
        let mutualPairs: SimulatedTeam[] = [];
        let singles: SimulatedPlayer[] = [];
        const processedUserIds = new Set<string>();

        // 1. Process mutual pairs first
        for (const playerA of playersToProcess) {
            if (processedUserIds.has(playerA.userId) || ('isEmptySlot' in playerA && playerA.isEmptySlot)) continue;
            
            const partnerId = (playerA as MatchDayInscription).preferredPartnerId;
            if (!partnerId) continue;
            
            const playerB = playersToProcess.find(p => p.userId === partnerId) as MatchDayInscription | undefined;

            if (playerB && !('isEmptySlot' in playerB) && playerB.preferredPartnerId === playerA.userId) {
                const levelA = parseFloat(playerA.userLevel);
                const levelB = parseFloat(playerB.userLevel);
                const teamLevel = Math.min(isNaN(levelA) ? 99 : levelA, isNaN(levelB) ? 99 : levelB);
                
                mutualPairs.push({ players: [playerA, playerB], teamLevel });
                processedUserIds.add(playerA.userId);
                processedUserIds.add(playerB.userId);
            }
        }
        
        // 2. Collect all remaining single players
        singles = playersToProcess.filter(p => !processedUserIds.has(p.userId));

        // 3. Sort singles by level (descending)
        singles.sort((a, b) => {
             const levelA = parseFloat(a.userLevel);
             const levelB = parseFloat(b.userLevel);
             return (isNaN(levelB) ? 0 : levelB) - (isNaN(levelA) ? 0 : levelA);
        });

        // 4. Form pairs from sorted singles
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
                const playerA = singles[i];
                 const levelA = parseFloat(playerA.userLevel);
                 singlePairs.push({ players: [playerA, {id: 'empty-single', userName: 'Plaza Libre', userLevel: '0.0', isEmptySlot: true, userProfilePictureUrl: '/avatar-placeholder.png', userId:'empty-single-user'}], teamLevel: isNaN(levelA) ? 0 : levelA });
            }
        }

        // 5. Combine all pairs and sort them by level (descending)
        let allPairs = [...mutualPairs, ...singlePairs];
        allPairs.sort((a, b) => b.teamLevel - a.teamLevel);

        // 6. Form matches by taking two pairs at a time
        const finalMatches: SimulatedTeam[][] = [];
        for (let i = 0; i < allPairs.length; i += 2) {
            if (allPairs[i+1]) {
                finalMatches.push([allPairs[i], allPairs[i+1]]);
            } else {
                const placeholderTeam: SimulatedTeam = {
                    players: [
                        { id: 'empty-team-1', userName: 'Plaza Libre', userLevel: '0.0', isEmptySlot: true, userProfilePictureUrl: '/avatar-placeholder.png', userId: 'empty-team-user-1'},
                        { id: 'empty-team-2', userName: 'Plaza Libre', userLevel: '0.0', isEmptySlot: true, userProfilePictureUrl: '/avatar-placeholder.png', userId: 'empty-team-user-2'}
                    ],
                    teamLevel: 0
                };
                finalMatches.push([allPairs[i], placeholderTeam]);
            }
        }
        
        setSimulatedMatches(finalMatches);
    };

    const handleStartSimulation = () => {
        if (!userInscription) {
            toast({
                title: "Inscripción Requerida",
                description: "Debes estar inscrito para simular el sorteo.",
                variant: "destructive",
            });
            return;
        }

        handleSimulateDraw();
        setIsSimulating(true);

        simulationResetTimer.current = setTimeout(() => {
            handleResetSimulation();
        }, 30000);
        
        setCountdown(30);
        countdownTimerRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };


    const handleResetSimulation = () => {
        if (simulationResetTimer.current) {
            clearTimeout(simulationResetTimer.current);
            simulationResetTimer.current = null;
        }
        if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
        }
        setSimulatedMatches([]);
        setIsSimulating(false);
    }
    
    const availableCredit = (currentUser?.credit ?? 0) - (currentUser?.blockedCredit ?? 0);

    return (
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
                            {event.drawTime && !event.matchesGenerated && (
                                <Badge variant="secondary" className="mt-2 text-xs">
                                    <Clock className="mr-1.5 h-3 w-3"/>
                                    Sorteo: {format(new Date(event.drawTime), "dd MMM, HH:mm'h'", { locale: es })}
                                </Badge>
                            )}
                             {event.matchesGenerated && (
                                 <Badge variant="destructive" className="mt-2 text-xs">
                                    ¡Sorteo Realizado!
                                </Badge>
                             )}
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
                                    <div key={inscription.id} className="flex flex-col text-center space-y-1.5">
                                         <div className="p-3 border rounded-lg flex flex-col items-center justify-start bg-background shadow-md h-40">
                                            <div className="flex flex-col items-center gap-1 overflow-hidden flex-grow">
                                                <div className="relative">
                                                    <Avatar className={cn(
                                                        "h-16 w-16 p-0 overflow-hidden shadow-inner",
                                                        isCurrentUser ? "border-[3px] border-primary shadow-lg" : "border-gray-300"
                                                    )}>
                                                        <AvatarImage src={inscription.userProfilePictureUrl} data-ai-hint="player avatar"/>
                                                        <AvatarFallback className="text-xl">{getInitials(inscription.userName)}</AvatarFallback>
                                                    </Avatar>
                                                </div>
                                                <div className="space-y-1 mt-1">
                                                    <p className="font-medium text-sm truncate">{inscription.userName}</p>
                                                    <Badge variant="outline" className="text-xs">N: {inscription.userLevel}</Badge>
                                                </div>
                                            </div>
                                        </div>
                                        {!isCurrentUser && userInscription && (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                     <Button
                                                        variant={isPreferredPartner ? "default" : "outline"}
                                                        size="sm"
                                                        className={cn(
                                                            "w-full h-7 text-xs shadow-md transition-all duration-200",
                                                            isPreferredPartner
                                                            ? "bg-green-600 hover:bg-green-700 text-white"
                                                            : "bg-white hover:bg-gray-100"
                                                        )}
                                                    >
                                                        {isPreferredPartner ? <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> : <Handshake className="mr-1.5 h-3.5 w-3.5" />}
                                                        {isPreferredPartner ? "Seleccionado" : "Compañero"}
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle className="text-2xl font-bold flex items-center justify-center">
                                                            <Handshake className="h-8 w-8 mr-3 text-blue-500" />
                                                            ¡Elige a tu compi!
                                                        </AlertDialogTitle>
                                                    </AlertDialogHeader>
                                                    <AlertDialogDescription asChild>
                                                        <div className="text-center text-lg text-foreground space-y-4 py-4">
                                                            <p>Has elegido a <span className="font-bold">{inscription.userName}</span> como tu pareja ideal.</p>
                                                        </div>
                                                    </AlertDialogDescription>
                                                     <div className="text-sm bg-blue-50 text-blue-800 p-3 rounded-lg space-y-2">
                                                        <p className="font-bold text-center">¡Así funciona!</p>
                                                        <ul className="space-y-1.5">
                                                            <li className="flex items-start"><ThumbsUp className="h-4 w-4 mr-2 mt-0.5 text-blue-500 flex-shrink-0" /><span>Tu elección es una preferencia para el sorteo.</span></li>
                                                            <li className="flex items-start"><Lock className="h-4 w-4 mr-2 mt-0.5 text-blue-500 flex-shrink-0" /><span>Si os elegís mutuamente, ¡jugaréis juntos seguro!</span></li>
                                                            <li className="flex items-start"><Scissors className="h-4 w-4 mr-2 mt-0.5 text-blue-500 flex-shrink-0" /><span>Puedes cambiar de opinión cuando quieras antes del sorteo.</span></li>
                                                        </ul>
                                                    </div>
                                                    <AlertDialogFooter className="grid grid-cols-2 gap-2 mt-4">
                                                        <AlertDialogCancel className="h-12 text-base">Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => onSelectPartner(inscription.userId)} className="h-12 text-base bg-green-600 text-white hover:bg-green-700">Confirmar Elección</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        )}
                                    </div>
                                );
                            }
                            // Render empty slot
                            return (
                                 <AlertDialog key={`empty-${index}`}>
                                    <AlertDialogTrigger asChild>
                                        <button disabled={isMainListFull || !!userInscription || isSubmitting} className="p-3 border rounded-lg flex flex-col items-center justify-start bg-background shadow-md h-40 group disabled:cursor-not-allowed disabled:opacity-50">
                                            <div className="flex flex-col items-center gap-1 overflow-hidden flex-grow justify-center">
                                                 <Avatar className="h-16 w-16 p-0 overflow-hidden border-[3px] border-dashed border-green-400 bg-slate-100 group-hover:border-green-500 transition-colors shadow-inner">
                                                    <AvatarFallback className="bg-transparent flex items-center justify-center">
                                                        {isSubmitting ? <Loader2 className="h-8 w-8 animate-spin" /> : <Plus className="h-8 w-8 text-green-600 opacity-60 stroke-[3]" />}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="space-y-1 mt-1 text-center">
                                                    <p className="font-medium text-sm text-muted-foreground">Plaza Libre</p>
                                                     <Badge variant="outline" className="text-xs bg-white">{event.price?.toFixed(2)}€</Badge>
                                                </div>
                                            </div>
                                        </button>
                                    </AlertDialogTrigger>
                                     <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle className="text-2xl font-bold flex items-center justify-center">
                                                <Rocket className="h-8 w-8 mr-3 text-blue-500" /> ¡Casi dentro!
                                            </AlertDialogTitle>
                                        </AlertDialogHeader>
                                        <AlertDialogDescription asChild>
                                            <div className="text-center text-lg text-foreground space-y-4 py-4">
                                                <div className="space-y-1">
                                                    <div>Te apuntas al evento: <br/><span className="font-semibold">{event.name}</span></div>
                                                    <div className="flex items-center justify-center text-3xl font-bold">
                                                        <Euro className="h-7 w-7 mr-1" /> {event.price?.toFixed(2)}
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-center gap-2 p-2 bg-slate-100 rounded-md">
                                                    <PiggyBank className="h-6 w-6 text-slate-500" />
                                                    <span className="text-sm">Tu hucha tiene:</span>
                                                    <span className="font-bold text-slate-800">{availableCredit.toFixed(2)}€</span>
                                                    <span className="text-slate-400">/</span>
                                                    <Star className="h-5 w-5 text-amber-500"/>
                                                    <span className="font-bold text-slate-800">{currentUser?.loyaltyPoints ?? 0}</span>
                                                </div>
                                            </div>
                                        </AlertDialogDescription>
                                        <div className="text-sm bg-blue-50 text-blue-800 p-3 rounded-lg space-y-2">
                                            <p className="font-bold text-center">¡Recuerda las reglas del juego!</p>
                                            <ul className="space-y-1.5">
                                                <li className="flex items-start"><ThumbsUp className="h-4 w-4 mr-2 mt-0.5 text-blue-500 flex-shrink-0" /><span>Cuando llegue la hora del sorteo, se formarán las partidas.</span></li>
                                                <li className="flex items-start"><Lock className="h-4 w-4 mr-2 mt-0.5 text-blue-500 flex-shrink-0" /><span>Tu saldo será bloqueado hasta que se juegue el evento.</span></li>
                                                <li className="flex items-start"><Scissors className="h-4 w-4 mr-2 mt-0.5 text-blue-500 flex-shrink-0" /><span>**Si este evento se confirma**, tus otras inscripciones del día se anularán solas.</span></li>
                                            </ul>
                                        </div>
                                        <AlertDialogFooter className="grid grid-cols-2 gap-2 mt-4">
                                            <AlertDialogCancel className="h-12 text-base" disabled={isSubmitting}>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={onSignUp} disabled={isSubmitting} className="h-12 text-base bg-green-600 text-white hover:bg-green-700">
                                                {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : "Sí, ¡Me apunto!"}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
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
                                        className={cn("p-3 border rounded-lg flex flex-col items-center justify-start text-center bg-background shadow-md h-40 relative",  isCurrentUser && "bg-blue-50 border-blue-300 ring-2 ring-blue-400")}
                                        >
                                            <div className="absolute top-1 left-2 text-xs font-bold text-muted-foreground">#{index + 1}</div>
                                             <div className="flex flex-col items-center gap-1 overflow-hidden flex-grow">
                                                <div className="relative">
                                                     <Avatar className={cn(
                                                        "h-16 w-16 p-0 overflow-hidden shadow-inner border-gray-300",
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
                                     <AlertDialog key={`empty-reserve-${index}`}>
                                        <AlertDialogTrigger asChild>
                                            <button 
                                                className={cn(
                                                    "p-3 border rounded-lg flex flex-col items-center justify-start bg-background shadow-md h-40 group",
                                                    !isMainListFull && "opacity-50 cursor-not-allowed"
                                                )}
                                                disabled={!isMainListFull}
                                            >
                                                <div className="flex flex-col items-center gap-1 overflow-hidden flex-grow justify-center">
                                                     <Avatar className="h-16 w-16 p-0 overflow-hidden border-[3px] border-dashed border-green-400 bg-slate-100 group-hover:border-green-500 transition-colors shadow-inner">
                                                        <AvatarFallback className="bg-transparent flex items-center justify-center">
                                                            <Plus className="h-8 w-8 text-green-600 opacity-60 stroke-[3]" />
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="space-y-1 mt-1 text-center">
                                                        <p className="font-medium text-sm text-muted-foreground">Reserva</p>
                                                        <Badge variant="outline" className="text-xs bg-white">{event.price?.toFixed(2)}€</Badge>
                                                    </div>
                                                </div>
                                            </button>
                                        </AlertDialogTrigger>
                                         <AlertDialogContent>
                                            <AlertDialogHeader>
                                            <AlertDialogTitle>Confirmar Inscripción en Reserva</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                {isMainListFull 
                                                    ? `La lista principal está llena. Te inscribirás en la lista de reserva para el evento "${event.name}". Se te notificará si se libera una plaza.`
                                                    : 'Debes esperar a que la lista principal se llene para poder apuntarte en la reserva.'
                                                }
                                            </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
                                            {isMainListFull && (
                                                <AlertDialogAction onClick={onSignUp} disabled={isSubmitting}>
                                                    {isSubmitting ? <Loader2 className="animate-spin" /> : "Confirmar en Reserva"}
                                                </AlertDialogAction>
                                            )}
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                );
                            })}
                        </div>
                    </div>
                )}
                 
                 {!event.matchesGenerated && eventCourts.length > 0 && (
                    <div className="mt-6">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-4">
                                <h4 className="font-semibold flex items-center"><Swords className="mr-2 h-5 w-5"/>Pistas Reservadas para el Evento</h4>
                                {event.drawTime && (
                                    <Badge variant="outline" className="text-xs">
                                        <Clock className="mr-1.5 h-3 w-3"/>
                                        Sorteo: {format(new Date(event.drawTime), "dd MMM, HH:mm'h'", { locale: es })}
                                    </Badge>
                                )}
                            </div>
                             <div className="flex items-center gap-2">
                                {isSimulating ? (
                                    <Button variant="ghost" size="sm" onClick={handleResetSimulation}>
                                        <RefreshCw className="mr-2 h-4 w-4" /> Resetear ({countdown})
                                    </Button>
                                ) : (
                                    <Button onClick={handleStartSimulation} size="lg" className="bg-purple-600 text-white hover:bg-purple-700" disabled={!userInscription}>
                                        <Dices className="mr-2 h-4 w-4" />
                                        Simular Sorteo
                                    </Button>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-wrap justify-center gap-4">
                           {eventCourts.map((court, index) => {
                                const match = simulatedMatches[index];
                                return (
                                    <div key={court.id} className="p-3 border rounded-lg flex flex-col justify-between bg-secondary/20 shadow-sm min-h-[18rem] w-full max-w-xs">
                                        <div>
                                            <div className="flex justify-between items-center">
                                                <p className="font-semibold text-sm truncate">{court.name}</p>
                                                <Badge variant="outline" className="text-xs">
                                                    <Clock className="mr-1 h-3 w-3" />
                                                    {format(new Date(event.eventDate), "HH:mm'h'", { locale: es })}
                                                </Badge>
                                            </div>
                                             <p className="text-xs text-muted-foreground">Pista #{court.courtNumber}</p>
                                        </div>
                                        <div className="flex-grow flex items-center justify-center">
                                            {match ? (
                                                <div className="w-full max-w-[200px] aspect-[10/14] bg-green-500 rounded-md p-2 flex flex-col justify-between items-center relative shadow-lg border-2 border-white/50">
                                                    {/* Top side players */}
                                                    <div className="w-full flex justify-around">
                                                        {match[0].players.map(p => (
                                                            <div key={p.id} className="flex flex-col items-center text-center">
                                                                <Avatar className="h-12 w-12 border-2 border-white"><AvatarImage src={p.userProfilePictureUrl} data-ai-hint="player avatar"/><AvatarFallback>{getInitials(p.userName || '')}</AvatarFallback></Avatar>
                                                                <p className="text-[10px] text-white font-semibold mt-0.5 truncate w-14">{p.userName}</p>
                                                                <p className="text-[9px] text-white/80">N: {p.userLevel}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {/* Net */}
                                                    <div className="h-0.5 w-full bg-white/50 my-1"></div>
                                                    {/* Bottom side players */}
                                                    <div className="w-full flex justify-around">
                                                         {match[1].players.map(p => (
                                                            <div key={p.id} className="flex flex-col items-center text-center">
                                                                <Avatar className="h-12 w-12 border-2 border-white"><AvatarImage src={p.userProfilePictureUrl} data-ai-hint="player avatar"/><AvatarFallback>{getInitials(p.userName || '')}</AvatarFallback></Avatar>
                                                                <p className="text-[10px] text-white font-semibold mt-0.5 truncate w-14">{p.userName}</p>
                                                                <p className="text-[9px] text-white/80">N: {p.userLevel}</p>
                                                            </div>
                                                        ))}
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
    );
}

export default MatchDayPlayerGrid;
