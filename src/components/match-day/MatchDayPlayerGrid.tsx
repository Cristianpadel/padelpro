// src/components/match-day/MatchDayPlayerGrid.tsx
"use client";

import React from 'react';
import type { MatchDayEvent, MatchDayInscription, User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getInitials } from '@/lib/utils';
import { UserPlus, PlusCircle, CheckCircle, Hourglass, Handshake, Dices } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

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
    
    const isMainListFull = mainList.length >= event.maxPlayers;

    const handleSimulateDraw = () => {
        if (!currentUser || !userInscription) {
            toast({
                title: "Inscripción Requerida",
                description: "Debes estar inscrito para simular el sorteo.",
                variant: "destructive",
            });
            return;
        }
        
        const otherPlayers = mainList.filter(p => p.userId !== currentUser.id);
        if (otherPlayers.length === 0) {
             toast({
                title: "Faltan Jugadores",
                description: "No hay otros jugadores para simular el sorteo.",
            });
            return;
        }

        const shuffledPlayers = [...otherPlayers].sort(() => 0.5 - Math.random());
        const simulatedPartner = shuffledPlayers[0];

        toast({
            title: "Simulación de Sorteo",
            description: `En el sorteo, tu compañero sería ${simulatedPartner.userName}.`,
        });
    };


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
                             <Button onClick={handleSimulateDraw} variant="outline" size="sm" className="mt-2" disabled={!userInscription}>
                                <Dices className="mr-2 h-4 w-4" />
                                Simular Sorteo
                            </Button>
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
                                            isCurrentUser ? "bg-blue-50 border-blue-300 ring-2 ring-blue-400" :
                                            isPreferredPartner ? "bg-purple-50 border-purple-300" :
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
            </CardContent>
        </Card>
    );
};

export default MatchDayPlayerGrid;
