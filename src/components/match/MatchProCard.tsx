// src/components/match/MatchProCard.tsx
"use client";

import React, { useState, useEffect } from 'react';
import type { User, Match } from '@/types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, Plus, Loader2, BarChartHorizontal, Users2, Hash } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getInitials } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getMockStudents, bookMatch } from '@/lib/mockData';
import { Badge } from '@/components/ui/badge';

interface MatchProCardProps {
    match: Match;
    currentUser: User;
    onBookingSuccess: () => void;
}

const MatchProCard: React.FC<MatchProCardProps> = ({ match, currentUser, onBookingSuccess }) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(false);
    const players = match.bookedPlayers || [];
    const isUserBooked = players.some(p => p.userId === currentUser.id);
    const isFull = players.length >= 4;
    
    // Get full student details for avatars
    const allStudents = getMockStudents();
    const getPlayerDetails = (userId: string): User | undefined => {
        return allStudents.find(s => s.id === userId);
    };


    const handleJoin = (index: number) => {
        if (isFull || isUserBooked || isLoading) return;
        
        setIsLoading(true);
        bookMatch(currentUser.id, match.id)
            .then(result => {
                if ('error' in result) {
                    toast({ title: "Error", description: result.error, variant: 'destructive' });
                } else {
                    toast({
                        title: "¡Inscrito en Matchpro!",
                        description: "Te has apuntado a la partida."
                    });
                    onBookingSuccess();
                }
            })
            .finally(() => setIsLoading(false));
    };

    const isLevelAssigned = match.level !== 'abierto';
    const isCategoryAssigned = match.category !== 'abierta';
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Matchpro</span>
                    <span className="text-sm font-normal text-muted-foreground flex items-center">
                        <Clock className="mr-1.5 h-4 w-4"/>
                        {format(new Date(match.startTime), "HH:mm", { locale: es })}
                    </span>
                </CardTitle>
                <div className="flex justify-start items-center gap-1.5 pt-1">
                    <Badge variant={isLevelAssigned ? "default" : "outline"} className="text-xs">
                        <BarChartHorizontal className="mr-1.5 h-3 w-3 -rotate-90" /> {isLevelAssigned ? `Nivel ${match.level}` : 'Nivel Abierto'}
                    </Badge>
                     <Badge variant={isCategoryAssigned ? "default" : "outline"} className="text-xs">
                        <Users2 className="mr-1.5 h-3 w-3" /> {isCategoryAssigned ? match.category.charAt(0).toUpperCase() + match.category.slice(1) : 'Categoría Abierta'}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-4 gap-2">
                    {Array.from({ length: 4 }).map((_, index) => {
                        const player = players[index];
                        const playerDetails = player ? getPlayerDetails(player.userId) : null;
                        const canClickToJoin = !player && !isFull && !isUserBooked && !isLoading;

                        return (
                            <div key={index} className="flex flex-col items-center space-y-1">
                                <button
                                    onClick={() => canClickToJoin ? handleJoin(index) : undefined}
                                    disabled={!canClickToJoin}
                                    className={cn("rounded-full", canClickToJoin && "cursor-pointer hover:opacity-80 transition-opacity")}
                                    aria-label={player ? player.name : "Unirse a la partida"}
                                >
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={playerDetails?.profilePictureUrl} data-ai-hint="player photo"/>
                                        <AvatarFallback>
                                            {isLoading && !player ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : playerDetails ? (
                                                getInitials(playerDetails.name || '')
                                            ) : (
                                                <Plus className="h-5 w-5" />
                                            )}
                                        </AvatarFallback>
                                    </Avatar>
                                </button>
                                <span className="text-xs text-muted-foreground truncate w-full text-center">
                                    {playerDetails ? playerDetails.name?.split(' ')[0] : 'Libre'}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
             {(!isUserBooked && !isFull) && (
                <CardFooter>
                    <Button className="w-full" onClick={() => handleJoin(players.length)} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Inscribirse
                    </Button>
                </CardFooter>
            )}
            {isUserBooked && (
                <CardFooter>
                    <Button className="w-full" disabled variant="secondary">Inscrito</Button>
                </CardFooter>
            )}
            {isFull && !isUserBooked && (
                <CardFooter>
                    <Button className="w-full" disabled variant="outline">Completo</Button>
                </CardFooter>
            )}
        </Card>
    );
}

export default MatchProCard;
