// src/app/(app)/classfinder/MatchProDisplay.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import type { User, Match, Club, ViewPreference, MatchPadelLevel, TimeOfDayFilterType } from '@/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import MatchCard from '@/components/match/MatchCard';
import { fetchMatches, getMockCurrentUser, getMockClubs, createFixedPlaceholdersForDay, addMatch, getCourtAvailabilityForInterval } from '@/lib/mockData';
import { isSameDay, startOfDay } from 'date-fns';
import { Trophy } from 'lucide-react';

interface MatchProDisplayProps {
    currentUser: User | null;
    onBookingSuccess: () => void;
    selectedDate: Date | null;
    onDateChange: (date: Date) => void;
    viewPreference: ViewPreference; // Added prop
    // Filters from useActivityFilters
    timeSlotFilter: TimeOfDayFilterType;
    selectedLevel: MatchPadelLevel | 'all';
}

const MatchProDisplay: React.FC<MatchProDisplayProps> = ({ currentUser, onBookingSuccess, selectedDate, onDateChange, viewPreference, timeSlotFilter, selectedLevel }) => {
    const [panelMatches, setPanelMatches] = useState<Match[]>([]);
    const [clubInfo, setClubInfo] = useState<Club | null>(null);
    const [loading, setLoading] = useState(true);
    const [localCurrentUser, setLocalCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        const loadDataForDate = async () => {
            setLoading(true);
            try {
                const clubs = await getMockClubs();
                const currentClub = clubs[0];
                setClubInfo(currentClub);

                if (!currentClub?.isMatchProEnabled) {
                    setLoading(false);
                    return;
                }

                const targetDate = selectedDate ? new Date(selectedDate) : new Date();

                // 1) Generate fixed placeholders for the day (every 30 min) and persist only the new ones
                const generated = createFixedPlaceholdersForDay(currentClub, targetDate);
                for (const ph of generated) {
                    // Persist using addMatch (keeps id if provided)
                    await addMatch({
                        ...(ph as any),
                        creatorId: undefined,
                    });
                }

                // 2) Fetch all matches and user, then show only fixed ones (existing + placeholders)
                const [allMatches, fetchedUser] = await Promise.all([
                    fetchMatches(currentClub.id),
                    getMockCurrentUser()
                ]);

                                // Show only fixed matches.
                                const fixedOnly = allMatches.filter(m => m.isFixedMatch === true);
                                // For placeholders: keep at most one open card per 30-min slot, but always include the user's enrolled matches.
                                const slotKey = (d: Date) => {
                                    const dd = new Date(d);
                                    dd.setSeconds(0,0);
                                    const minutes = dd.getMinutes();
                                    const normalized = minutes < 30 ? 0 : 30;
                                    dd.setMinutes(normalized);
                                    return `${dd.getFullYear()}-${dd.getMonth()}-${dd.getDate()}-${dd.getHours()}-${normalized}`;
                                };
                                const seenPlaceholderBySlot = new Set<string>();
                                                const filtered: Match[] = [];
                                                const current = fetchedUser;
                                                if (!current) {
                                                    setPanelMatches([]);
                                                    setLocalCurrentUser(null);
                                                    setLoading(false);
                                                    return;
                                                }
                                for (const m of fixedOnly) {
                                                        const isUserIn = (m.bookedPlayers || []).some(p => p.userId === current.id);
                                        if (!m.isPlaceholder) {
                                                // Always include actual matches, especially the user's own
                                                filtered.push(m);
                                                continue;
                                        }
                                        // For placeholders, include at most one per slot if there is availability
                                        const availability = await getCourtAvailabilityForInterval(m.clubId, new Date(m.startTime), new Date(m.endTime));
                                        if (availability.available.length <= 0) continue;
                                        const key = slotKey(new Date(m.startTime));
                                        if (seenPlaceholderBySlot.has(key)) continue;
                                        seenPlaceholderBySlot.add(key);
                                        filtered.push(m);
                                }
                                const combined = filtered.sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
                setPanelMatches(combined);
                setLocalCurrentUser(current);
            } catch (error) {
                console.error('Error loading fixed matches', error);
            } finally {
                setLoading(false);
            }
        };
        loadDataForDate();
    }, [selectedDate]);

    const filteredAndSortedMatches = useMemo(() => {
        if (!selectedDate || !localCurrentUser) return [];
        let matches = panelMatches.filter(m => isSameDay(new Date(m.startTime), selectedDate));

        // View preference: limit to user's matches if requested
        if (viewPreference === 'myInscriptions' || viewPreference === 'myConfirmed') {
            matches = matches.filter(m => (m.bookedPlayers || []).some(p => p.userId === localCurrentUser.id));
        }

        // Time of day filter
        if (timeSlotFilter && timeSlotFilter !== 'all') {
            matches = matches.filter(m => {
                const hour = new Date(m.startTime).getHours();
                if (timeSlotFilter === 'morning') return hour >= 8 && hour < 13;
                if (timeSlotFilter === 'midday') return hour >= 13 && hour < 18;
                if (timeSlotFilter === 'evening') return hour >= 18 && hour <= 22;
                return true;
            });
        }

        // Level filter (uses club ranges to translate range name into numeric bounds)
        if (selectedLevel && selectedLevel !== 'all') {
            const range = clubInfo?.levelRanges?.find(r => r.name === selectedLevel);
            matches = matches.filter(m => {
                // If Match level is 'abierto', only include when selected specifically
                if (m.level === 'abierto') return selectedLevel === 'abierto';
                const matchNum = parseFloat(m.level as string);
                if (!isFinite(matchNum)) return false;
                if (selectedLevel === 'abierto') return false;
                if (!range) return false;
                return matchNum >= parseFloat(range.min) && matchNum <= parseFloat(range.max);
            });
        }

        matches.sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        return matches;
    }, [panelMatches, selectedDate, localCurrentUser, viewPreference, timeSlotFilter, selectedLevel, clubInfo?.levelRanges]);

    const handleMatchUpdate = (updatedMatch: Match) => {
        setPanelMatches((prev: Match[]) => prev.map((m: Match) => m.id === updatedMatch.id ? updatedMatch : m));
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
                    <CardTitle>Partidas fijas desactivadas</CardTitle>
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
                showPointsBonus={false}
                allowCreateFixedWeekly={match.isPlaceholder === true}
                        />
                    ))}
                </div>
            ) : (
                <p className="text-center text-muted-foreground p-8">No hay partidas fijas programadas para los filtros seleccionados.</p>
            )}
        </div>
    );
}

export default MatchProDisplay;
