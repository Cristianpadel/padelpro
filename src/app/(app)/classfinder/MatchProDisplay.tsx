// src/app/(app)/classfinder/MatchProDisplay.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import type { User, Match, Club, TimeOfDayFilterType, ViewPreference } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import MatchCard from '@/components/match/MatchCard';
import { fetchMatches, getMockCurrentUser } from '@/lib/mockData';
import { isSameDay, startOfDay } from 'date-fns';
import { Trophy } from 'lucide-react';

interface MatchProDisplayProps {
    currentUser: User | null;
    clubInfo: Club | null;
    onBookingSuccess: () => void;
    selectedDate: Date | null;
    onDateChange: (date: Date) => void;
    timeSlotFilter: TimeOfDayFilterType;
    viewPreference: ViewPreference;
}

const MatchProDisplay: React.FC<MatchProDisplayProps> = ({ currentUser, clubInfo, onBookingSuccess, selectedDate, onDateChange, timeSlotFilter, viewPreference }) => {

    const [allMatchProGames, setAllMatchProGames] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [localCurrentUser, setLocalCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        if (!clubInfo?.isMatchProEnabled) {
            setLoading(false);
            return;
        }

        const loadMatchesAndUser = async () => {
            setLoading(true);
            try {
                const [allMatches, user] = await Promise.all([
                    fetchMatches('club-1'), // Assuming a single club for now
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
        loadMatchesAndUser();
    }, [clubInfo]);

    const filteredAndSortedMatches = useMemo(() => {
        if (!selectedDate || !localCurrentUser) return [];

        let matches = allMatchProGames.filter(m => isSameDay(new Date(m.startTime), selectedDate));

        if (timeSlotFilter !== 'all') {
            matches = matches.filter(match => {
                const matchHour = new Date(match.startTime).getHours();
                if (timeSlotFilter === 'morning') return matchHour >= 8 && matchHour < 13;
                if (timeSlotFilter === 'midday') return matchHour >= 13 && matchHour < 18;
                if (timeSlotFilter === 'evening') return matchHour >= 18 && matchHour <= 22;
                return true;
            });
        }
        
        if (viewPreference === 'myInscriptions') {
            matches = matches.filter(match => (match.bookedPlayers || []).some(p => p.userId === localCurrentUser.id));
        } else if (viewPreference === 'myConfirmed') {
            matches = matches.filter(match => (match.bookedPlayers || []).some(p => p.userId === localCurrentUser.id) && (match.bookedPlayers || []).length === 4);
        } else if (viewPreference === 'withPlayers') {
            matches = matches.filter(match => (match.bookedPlayers || []).length > 0 && (match.bookedPlayers || []).length < 4);
        } else if (viewPreference === 'completed') {
            matches = matches.filter(match => (match.bookedPlayers || []).length === 4);
        }
        
        matches.sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

        return matches;
    }, [allMatchProGames, selectedDate, timeSlotFilter, localCurrentUser, viewPreference]);


    const handleMatchUpdate = (updatedMatch: Match) => {
        setAllMatchProGames(prev => prev.map(m => m.id === updatedMatch.id ? updatedMatch : m));
        onBookingSuccess();
    };

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
