// src/components/classfinder/MatchProDisplay.tsx
"use client";

import React from 'react';
import type { User, Match } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import MatchProCard from '@/components/match/MatchProCard';

interface MatchProDisplayProps {
    currentUser: User | null;
    onBookingSuccess: () => void;
    selectedDate: Date | null;
    onDateChange: (date: Date) => void;
}

const MatchProDisplay: React.FC<MatchProDisplayProps> = ({ currentUser, onBookingSuccess, selectedDate, onDateChange }) => {

    // Mock data for MatchPro games. In a real app, this would be fetched.
    const mockMatchProGames: Match[] = [
        // This data can be expanded to be dynamic later
    ];
    
    if (!currentUser) {
        return <Skeleton className="h-96 w-full" />
    }

    return (
        <div className="space-y-4">
             <Card>
                <CardHeader>
                    <CardTitle>Partidas Matchpro</CardTitle>
                    <CardDescription>Eventos especiales sin nivel ni categoría. ¡Solo por la diversión de jugar!</CardDescription>
                </CardHeader>
                <CardContent>
                    {mockMatchProGames.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {mockMatchProGames.map(match => (
                                <MatchProCard key={match.id} match={match} currentUser={currentUser} onBookingSuccess={onBookingSuccess} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground p-8">No hay partidas Matchpro programadas por el momento.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default MatchProDisplay;
