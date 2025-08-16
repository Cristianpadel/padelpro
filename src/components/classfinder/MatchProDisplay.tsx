// src/app/(app)/classfinder/MatchProDisplay.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import type { User, Match } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import MatchCard from '@/components/match/MatchCard'; // Changed from MatchProCard to MatchCard
import { fetchMatches, getMockCurrentUser } from '@/lib/mockData';
import { isSameDay, startOfDay } from 'date-fns';

interface MatchProDisplayProps {
    currentUser: User | null;
    onBookingSuccess: () => void;
    selectedDate: Date | null;
    onDateChange: (date: Date) => void;
}

const MatchProDisplay: React.FC<MatchProDisplayProps> = ({ currentUser, onBookingSuccess, selectedDate, onDateChange }) => {

    const [matchProGames, setMatchProGames] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [localCurrentUser, setLocalCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        const loadMatchesAndUser = async () => {
            setLoading(true);
            try {
                const [allMatches, user] = await Promise.all([
                    fetchMatches('club-1'), // Assuming a single club for now
                    getMockCurrentUser()
                ]);

                let proMatches = allMatches.filter(m => m.isProMatch);

                // Filter by selectedDate if it exists
                if (selectedDate) {
                    proMatches = proMatches.filter(m => isSameDay(new Date(m.startTime), selectedDate));
                }

                setMatchProGames(proMatches);
                setLocalCurrentUser(user);

            } catch (error) {
                console.error("Error fetching pro matches or user", error);
            } finally {
                setLoading(false);
            }
        };
        loadMatchesAndUser();
    }, [selectedDate]); // Refetch if date changes

    const handleMatchUpdate = (updatedMatch: Match) => {
        setMatchProGames(prev => prev.map(m => m.id === updatedMatch.id ? updatedMatch : m));
        onBookingSuccess();
    };

    
    if (loading) {
         return (
            <div className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Skeleton className="h-[280px] w-full" />
                    <Skeleton className="h-[280px] w-full" />
                 </div>
            </div>
         );
    }
    
    if (!localCurrentUser) {
        return <Skeleton className="h-96 w-full" />
    }

    return (
        <div className="space-y-4">
            {matchProGames.length > 0 ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] justify-center gap-6">
                    {matchProGames.map(match => (
                        <MatchCard 
                            key={match.id} 
                            match={match} 
                            currentUser={localCurrentUser} 
                            onBookingSuccess={onBookingSuccess}
                            onMatchUpdate={handleMatchUpdate}
                            showPointsBonus={false} // Match Pro games don't award points by default
                        />
                    ))}
                </div>
            ) : (
                <p className="text-center text-muted-foreground p-8">No hay partidas Matchpro programadas para el día seleccionado.</p>
            )}
        </div>
    );
}

export default MatchProDisplay;