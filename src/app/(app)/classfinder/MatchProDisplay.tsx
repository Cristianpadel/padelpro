// src/app/(app)/classfinder/MatchProDisplay.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import type { User, Match, Club, TimeOfDayFilterType, ViewPreference } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import MatchCard from '@/components/match/MatchCard';
import { fetchMatches, getMockCurrentUser, getMockClubs } from '@/lib/mockData';
import { isSameDay, startOfDay } from 'date-fns';
import { Trophy } from 'lucide-react';

interface MatchProDisplayProps {
    currentUser: User | null;
    onBookingSuccess: () => void;
    selectedDate: Date | null;
    onDateChange: (date: Date) => void;
}

const MatchProDisplay: React.FC<MatchProDisplayProps> = ({ currentUser, onBookingSuccess, selectedDate, onDateChange }) => {
    const [allMatchProGames, setAllMatchProGames] = useState<Match[]>([]);
    const [clubInfo, setClubInfo] = useState<Club | null>(null);
    const [loading, setLoading] = useState(true);
    const [localCurrentUser, setLocalCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                const clubs = await getMockClubs();
                const currentClub = clubs[0]; // Assuming a single club for now
                setClubInfo(currentClub);

                if (!currentClub?.isMatchProEnabled) {
                    setLoading(false);
                    return;
                }

                const [allMatches, user] = await Promise.all([
                    fetchMatches('club-1'),
                    getMockCurrentUser()
                ]);

                const proMatches = allMatches.filter(m => m.isProMatch);
                setAllMatchProGames(proMatches);
                setLocalCurrentUser(user);

            } catch (error) {
                console.error("Error fetching pro matches or user", error);
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, []);

    const filteredAndSortedMatches = useMemo(() => {
        if (!selectedDate || !localCurrentUser) return [];
        let matches = allMatchProGames.filter(m => isSameDay(new Date(m.startTime), selectedDate));
        matches.sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        return matches;
    }, [allMatchProGames, selectedDate, localCurrentUser]);

    const handleMatchUpdate = (updatedMatch: Match) => {
        setAllMatchProGames(prev => prev.map(m => m.id === updatedMatch.id ? updatedMatch : m));
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
    
    if (!clubInfo?.isMatchProEnabled) {
        return (
            <Card>
                <CardHeader className="items-center text-center">
                    <Trophy className="h-12 w-12 text-muted-foreground" />
                    <CardTitle>Matchpro Desactivado</CardTitle>
                    <CardDescription>
                        Esta funcionalidad no está activada para tu club en este momento.
                    </CardDescription>
                </CardHeader>
            </Card>
        )
    }

    if (!localCurrentUser) {
        return <Skeleton className="h-96 w-full" />
    }

    return (
        <div className="space-y-4">
            {filteredAndSortedMatches.length > 0 ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] justify-center gap-6">
                    {filteredAndSortedMatches.map(match => (
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
                <p className="text-center text-muted-foreground p-8">No hay partidas Matchpro programadas para los filtros seleccionados.</p>
            )}
        </div>
    );
}

export default MatchProDisplay;