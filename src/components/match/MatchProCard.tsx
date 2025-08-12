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

    const handleJoin = () => {
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
                        return (
                            <div key={index} className="flex flex-col items-center space-y-1">
                                <Avatar>
                                    <AvatarImage src={player ? `https://avatar.vercel.sh/${player.userId}.png` : ''} />
                                    <AvatarFallback>
                                        {player ? getInitials(player.name || '') : <Plus className="h-4 w-4" />}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-muted-foreground truncate w-full text-center">
                                    {player ? player.name?.split(' ')[0] : 'Libre'}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
            <CardFooter>
                <Button className="w-full" onClick={handleJoin} disabled={isFull || isUserBooked || isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    {isUserBooked ? 'Inscrito' : (isFull ? 'Completo' : 'Inscribirse')}
                </Button>
            </CardFooter>
        </Card>
    );
}

export default MatchProCard;
