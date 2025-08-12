// src/components/classfinder/MatchProDisplay.tsx
"use client";

import React, { useState, useEffect } from 'react';
import type { User, Match } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import MatchProCard from '@/components/match/MatchProCard';
import { fetchMatches } from '@/lib/mockData';

interface MatchProDisplayProps {
    currentUser: User | null;
    onBookingSuccess: () => void;
    selectedDate: Date | null;
    onDateChange: (date: Date) => void;
}

const MatchProDisplay: React.FC<MatchProDisplayProps> = ({ currentUser, onBookingSuccess, selectedDate, onDateChange }) => {

    const [matchProGames, setMatchProGames] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadMatches = async () => {
            setLoading(true);
            try {
                const allMatches = await fetchMatches('club-1'); // Assuming a single club for now
                const proMatches = allMatches.filter(m => m.isProMatch);
                setMatchProGames(proMatches);
            } catch (error) {
                console.error("Error fetching pro matches", error);
            } finally {
                setLoading(false);
            }
        };
        loadMatches();
    }, [selectedDate]); // Refetch if date changes, for future compatibility
    
    if (loading) {
         return (
            <div className="space-y-4">
                 <Card>
                    <CardHeader>
                        <CardTitle><Skeleton className="h-6 w-48" /></CardTitle>
                        <CardDescription><Skeleton className="h-4 w-64" /></CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-48 w-full" />
                    </CardContent>
                </Card>
            </div>
         );
    }
    
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
                    {matchProGames.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {matchProGames.map(match => (
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
