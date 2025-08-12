// src/components/match/MatchProCard.tsx
"use client";

import React from 'react';
import type { Match, User } from '@/types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, Plus, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getInitials } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getMockStudents } from '@/lib/mockData'; // Import students data source

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


    const handleJoin = () => {
        if (isFull || isUserBooked || isLoading) return;
        
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            // This is where you would call the actual booking logic
            toast({
                title: "¡Inscrito en Matchpro!",
                description: "Te has apuntado a la partida."
            });
            onBookingSuccess();
            setIsLoading(false);
        }, 1000);
    };

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
                                    onClick={canClickToJoin ? handleJoin : undefined}
                                    disabled={!canClickToJoin}
                                    className={cn("rounded-full", canClickToJoin && "cursor-pointer hover:opacity-80 transition-opacity")}
                                    aria-label={player ? player.name : "Unirse a la partida"}
                                >
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={playerDetails?.profilePictureUrl} data-ai-hint="player photo"/>
                                        <AvatarFallback>
                                            {isLoading && !player ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : player ? (
                                                getInitials(player.name || '')
                                            ) : (
                                                <Plus className="h-5 w-5" />
                                            )}
                                        </AvatarFallback>
                                    </Avatar>
                                </button>
                                <span className="text-xs text-muted-foreground truncate w-full text-center">
                                    {player ? player.name?.split(' ')[0] : 'Libre'}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
            <CardFooter>
                 {!isUserBooked && !isFull && (
                    <Button className="w-full" onClick={handleJoin} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Inscribirse
                    </Button>
                )}
                 {isUserBooked && (
                     <Button className="w-full" disabled variant="secondary">Inscrito</Button>
                 )}
                 {isFull && !isUserBooked && (
                    <Button className="w-full" disabled variant="outline">Completo</Button>
                 )}
            </CardFooter>
        </Card>
    );
}

export default MatchProCard;
