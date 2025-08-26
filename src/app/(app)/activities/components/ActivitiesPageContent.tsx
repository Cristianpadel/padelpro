// src/app/(app)/activities/components/ActivitiesPageContent.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import ClassDisplay from '@/components/classfinder/ClassDisplay';
import MatchDisplay from '@/components/classfinder/MatchDisplay';
import MatchProDisplay from '@/components/classfinder/MatchProDisplay';
import { getMockTimeSlots, fetchMatches, fetchMatchDayEventsForDate, createMatchesForDay, getMockClubs } from '@/lib/mockData';
import type { TimeSlot, User, Match, MatchDayEvent, Club, ActivityViewType } from '@/types';
import { addDays, isSameDay, format } from 'date-fns';
import { es } from 'date-fns/locale';
import PageSkeleton from '@/components/layout/PageSkeleton';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import ActivityTypeSelectionDialog from './ActivityTypeSelectionDialog';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Plus } from 'lucide-react';
import { useActivityFilters } from '@/hooks/useActivityFilters';

interface ActivitiesPageContentProps {
    currentUser: User | null;
    onCurrentUserUpdate: (newFavoriteIds: string[]) => void;
}

export default function ActivitiesPageContent({ currentUser, onCurrentUserUpdate }: ActivitiesPageContentProps) {
    const router = useRouter();
    const { toast } = useToast();
    
    const activityFilters = useActivityFilters(currentUser, onCurrentUserUpdate);
    
    const {
        activeView,
        selectedDate,
        handleDateChange,
        triggerRefresh,
        dateStripIndicators,
        dateStripDates,
        showPointsBonus,
        handleViewPrefChange,
        ...restOfFilters
    } = activityFilters;
    
    const [currentClub, setCurrentClub] = useState<Club | null>(null);
    const [allTimeSlots, setAllTimeSlots] = useState<TimeSlot[]>([]);
    const [allMatches, setAllMatches] = useState<Match[]>([]);
    const [matchDayEvents, setMatchDayEvents] = useState<MatchDayEvent[]>([]);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    const [activitySelection, setActivitySelection] = useState<{
        isOpen: boolean;
        date: Date | null;
        preference: any | null;
        types: ('class' | 'match')[];
    }>({ isOpen: false, date: null, preference: null, types: [] });

    // Guard against disabled sections based on club settings
    useEffect(() => {
        if (!currentClub) return;
        const isClassesEnabled = currentClub.showClassesTabOnFrontend ?? true;
        const isMatchesEnabled = currentClub.showMatchesTabOnFrontend ?? true;
        const isMatchProEnabled = currentClub.isMatchProEnabled ?? false;
        if ((activityFilters.activeView === 'clases' && !isClassesEnabled) ||
            (activityFilters.activeView === 'partidas' && !isMatchesEnabled) ||
            (activityFilters.activeView === 'matchpro' && !isMatchProEnabled)) {
            const fallback: ActivityViewType = isClassesEnabled ? 'clases' : (isMatchesEnabled ? 'partidas' : (isMatchProEnabled ? 'matchpro' : 'clases'));
            if (activityFilters.activeView !== fallback) {
                toast({ title: 'Sección deshabilitada', description: 'Esta actividad no está disponible en tu club.', variant: 'default' });
                activityFilters.handleViewPrefChange(activityFilters.viewPreference, fallback);
            }
        }
    }, [currentClub, activityFilters.activeView, activityFilters.viewPreference]);


    const handleBookingSuccess = useCallback(async () => {
        if (currentClub) {
            setIsInitialLoading(true);
            try {
                const matches = await fetchMatches(currentClub.id);
                // Generate proposals first, then append fetched matches so fetched overwrite proposals on duplicate ids
                let combinedMatches: Match[] = [];
                for (let i = 0; i < 7; i++) {
                    const date = addDays(new Date(), i);
                    combinedMatches = [...combinedMatches, ...createMatchesForDay(currentClub, date)];
                }
                combinedMatches = [...combinedMatches, ...matches];
                const uniqueMatches = Array.from(new Map(combinedMatches.map(item => [item['id'], item])).values());
                setAllMatches(uniqueMatches);
            } catch (error) {
                console.error("Error refreshing matches after booking", error);
            } finally {
                setIsInitialLoading(false);
                // Force refresh of date strip indicators and other derived data
                triggerRefresh();
            }
        } else {
            triggerRefresh();
        }
    }, [currentClub, triggerRefresh]);
    
    useEffect(() => {
        const loadInitialData = async () => {
            setIsInitialLoading(true);
            try {
                const clubs = await getMockClubs();
                const club = clubs[0];
                setCurrentClub(club);
                
                let slots: TimeSlot[] = [];
                let existingMatches: Match[] = [];

                if (club) {
                    const [allSlots, fetchedMatches] = await Promise.all([
                        Promise.resolve(getMockTimeSlots()),
                        fetchMatches(club.id),
                    ]);
                    slots = allSlots.filter(s => s.clubId === club.id);
                    existingMatches = fetchedMatches;
                }

                setAllTimeSlots(slots);
                
                // Generate proposals first, then append fetched matches so fetched overwrite proposals on duplicate ids
                let combinedMatches: Match[] = [];
                if (club) {
                    for (let i = 0; i < 7; i++) {
                        const date = addDays(new Date(), i);
                        combinedMatches = [...combinedMatches, ...createMatchesForDay(club, date)];
                    }
                }
                combinedMatches = [...combinedMatches, ...existingMatches];
                const uniqueMatches = Array.from(new Map(combinedMatches.map(item => [item['id'], item])).values());
                setAllMatches(uniqueMatches);

            } catch (error) {
                console.error("Error fetching initial data", error);
                toast({ title: "Error", description: "No se pudieron cargar las actividades.", variant: "destructive" });
            } finally {
                setIsInitialLoading(false);
            }
        };
        loadInitialData();
    }, [activityFilters.refreshKey, toast]);

    useEffect(() => {
        const fetchEventsForDate = async () => {
            if (selectedDate && currentClub) {
                const events = await fetchMatchDayEventsForDate(selectedDate, currentClub.id);
                setMatchDayEvents(events);
            } else {
                setMatchDayEvents([]);
            }
        };
        fetchEventsForDate();
    }, [selectedDate, currentClub]);
    

    // Helper to map dialog types to ActivityViewType used in URL/state
    const toActivityViewType = (t: 'class' | 'match' | 'clases' | 'partidas'): ActivityViewType => {
        if (t === 'class') return 'clases';
        if (t === 'match') return 'partidas';
        return t as ActivityViewType;
    };

    // Accept either a single type string or an array (defensive), and normalize.
    const onViewPrefChange = (
        date: Date,
        pref: any,
        types: ('class' | 'match' | 'event')[] | 'class' | 'match' | 'clases' | 'partidas',
        eventId?: string
    ) => {
        const arr = Array.isArray(types) ? types : [types];
        // Normalize any 'clases'/'partidas' inputs into 'class'/'match' for internal branching
        const normalized = arr.map((t) => (t === 'clases' ? 'class' : t === 'partidas' ? 'match' : t)) as ('class'|'match'|'event')[];
        const relevantTypes = normalized.filter(t => t !== 'event') as ('class' | 'match')[];

        if (relevantTypes.length > 1) {
            setActivitySelection({ isOpen: true, date, preference: pref, types: relevantTypes });
        } else if (relevantTypes.length === 1) {
            // IMPORTANT: handleViewPrefChange expects (pref, type, date)
            handleViewPrefChange(pref, toActivityViewType(relevantTypes[0]), date);
        } else if (normalized.includes('event') && eventId) {
            router.push(`/match-day/${eventId}`);
        } else {
            handleViewPrefChange(pref, activeView, date);
        }
    };

    // Prop-compatible wrapper to match child components' expected signature
    const onViewPrefChangeCompat = (
        date: Date,
        pref: any,
        type: 'class' | 'match' | 'event',
        eventId?: string
    ) => {
        if (type === 'event') {
            if (eventId) router.push(`/match-day/${eventId}`);
            return;
        }
        const mapped: ActivityViewType = type === 'class' ? 'clases' : 'partidas';
        handleViewPrefChange(pref, mapped, date);
    };
    
    const handleActivityTypeSelect = (type: 'class' | 'match') => {
        if (activitySelection.date && activitySelection.preference) {
            // Map to ActivityViewType and call with correct parameter order
            handleViewPrefChange(activitySelection.preference, toActivityViewType(type), activitySelection.date);
        }
        setActivitySelection({ isOpen: false, date: null, preference: null, types: [] });
    };

    // Pre-filter classes by favorites as an extra safety net (top-level to respect Hooks rules)
    const preFilteredClasses = useMemo(() => {
        const favoritesActive = activityFilters.filterByFavorites || ((currentUser?.favoriteInstructorIds?.length || 0) > 0);
        if (!favoritesActive) return allTimeSlots;
        const favIds = currentUser?.favoriteInstructorIds || [];
        if (!favIds.length) return [];
        return allTimeSlots.filter(cls => favIds.includes(cls.instructorId || ''));
    }, [activityFilters.filterByFavorites, allTimeSlots, currentUser?.favoriteInstructorIds]);

    const renderContent = () => {
        if (isInitialLoading) return <PageSkeleton />;
        
        switch(activeView) {
            case 'clases':
                return <ClassDisplay
                            {...restOfFilters}
                            currentUser={currentUser}
                            onBookingSuccess={handleBookingSuccess}
                            selectedDate={selectedDate}
                            onDateChange={handleDateChange}
                            filterByFavoriteInstructors={activityFilters.filterByFavorites}
                            allClasses={preFilteredClasses}
                            isLoading={isInitialLoading}
                            dateStripIndicators={dateStripIndicators}
                            dateStripDates={dateStripDates}
                            onViewPrefChange={onViewPrefChangeCompat}
                            selectedLevelsSheet={[]}
                            sortBy={'time'}
                            filterAlsoConfirmedClasses={false}
                            proposalView={'join'}
                            showPointsBonus={showPointsBonus}
                        />;
            case 'partidas':
                 return <MatchDisplay
                            {...restOfFilters}
                            currentUser={currentUser}
                            onBookingSuccess={handleBookingSuccess}
                            selectedDate={selectedDate}
                            onDateChange={handleDateChange}
                            allMatches={allMatches}
                            isLoading={isInitialLoading}
                            matchDayEvents={matchDayEvents}
                            dateStripIndicators={dateStripIndicators}
                            dateStripDates={dateStripDates}
                            onViewPrefChange={onViewPrefChangeCompat}
                            sortBy={'time'}
                            filterAlsoConfirmedMatches={false}
                            proposalView={'join'}
                            showPointsBonus={showPointsBonus}
                        />;
            case 'matchpro':
                return (
                    <MatchProDisplay
                        currentUser={currentUser}
                        onBookingSuccess={handleBookingSuccess}
                        selectedDate={selectedDate}
                        onDateChange={handleDateChange}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <main className="flex-1 overflow-y-auto px-4 md:px-6 pb-6 space-y-4 pt-4">
            <div className="relative z-10 pt-2">
                <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex space-x-2 py-1">
                        {dateStripDates.map(day => {
                            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                            const dateKey = format(day, 'yyyy-MM-dd');
                            const indicators = dateStripIndicators[dateKey] || { activityStatus: 'none', hasEvent: false, anticipationPoints: 0 };
                            
                            return (
                            <div key={day.toISOString()} className="flex flex-col items-center space-y-1 relative pt-4">
                                {indicators.anticipationPoints > 0 && showPointsBonus && (
                                    <div
                                    className="absolute top-0 left-1/2 -translate-x-1/2 z-10 flex h-auto items-center justify-center rounded-full bg-amber-400 px-2 py-0.5 text-white shadow"
                                    title={`+${indicators.anticipationPoints} puntos por reservar con antelación`}
                                    >
                                    <span className="text-[10px] font-bold">+{indicators.anticipationPoints}</span>
                                    </div>
                                )}
                                <Button variant={isSelected ? "default" : "outline"} size="sm"
                                    className={cn(
                                        "h-auto px-1.5 py-1 flex flex-col items-center justify-center leading-tight shadow-sm w-10",
                                        isSameDay(day, new Date()) && !isSelected && "border-primary text-primary font-semibold",
                                        isSelected && "shadow-md"
                                    )}
                                    onClick={() => handleDateChange(day)}
                                >
                                    <span className="font-bold text-[10px] uppercase">{format(day, "EEE", { locale: es }).slice(0, 3)}</span>
                                    <span className="text-sm font-bold">{format(day, "d", { locale: es })}</span>
                                    <span className="text-[9px] text-muted-foreground capitalize -mt-0.5">{format(day, "MMM", { locale: es }).slice(0,3)}</span>
                                </Button>

                                <div className="h-10 w-8 flex flex-col items-center justify-center relative space-y-0.5">
                                    <TooltipProvider delayDuration={150}>
                                                                                                                        {indicators.activityStatus === 'confirmed' && (
                                                                                                                                <Tooltip>
                                                                                                                                    <TooltipTrigger asChild>
                                                                                                                                        <button
                                                                                                                                            onClick={() => onViewPrefChangeCompat(day, 'myConfirmed', indicators.activityTypes.includes('class') ? 'class' : 'match')}
                                                                                                                                            className="h-6 w-6 flex items-center justify-center bg-destructive text-destructive-foreground rounded-md font-bold text-xs leading-none cursor-pointer hover:scale-110 transition-transform"
                                                                                                                                        >
                                                                                                                                            R
                                                                                                                                        </button>
                                                                                                                                    </TooltipTrigger>
                                                                                                                                    <TooltipContent><p>Ver mis reservas</p></TooltipContent>
                                                                                                                                </Tooltip>
                                                                                                                        )}
                                                                                                                                                                {indicators.activityStatus === 'inscribed' && (
                                                                                                                                                                        <Tooltip>
                                                                                                                                                                            <TooltipTrigger asChild>
                                                                                                                                                                                {indicators.activityTypes.includes('event') && indicators.eventId ? (
                                                                                                                                                                                    <Link href={`/match-day/${indicators.eventId}`} passHref>
                                                                                                                                                                                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md bg-blue-500 text-white hover:bg-blue-600">I</Button>
                                                                                                                                                                                    </Link>
                                                                                                                                                                                ) : (
                                                                                                                                                                                    <button
                                                                                                                                                                                        onClick={() => onViewPrefChangeCompat(day, 'myInscriptions', indicators.activityTypes.includes('class') ? 'class' : 'match')}
                                                                                                                                                                                        className="h-6 w-6 flex items-center justify-center bg-blue-500 text-white rounded-md font-bold text-xs leading-none cursor-pointer hover:scale-110 transition-transform"
                                                                                                                                                                                    >
                                                                                                                                                                                        I
                                                                                                                                                                                    </button>
                                                                                                                                                                                )}
                                                                                                                                                                            </TooltipTrigger>
                                                                                                                                                                            <TooltipContent><p>Ver mis inscripciones</p></TooltipContent>
                                                                                                                                                                        </Tooltip>
                                                                                                                                                                )}
                                        {indicators.hasEvent && indicators.activityStatus === 'none' && (
                                            <Tooltip><TooltipTrigger asChild><Link href={`/match-day/${indicators.eventId}`} passHref><Button variant="ghost" size="icon" className="h-6 w-6 rounded-md bg-primary/10 hover:bg-primary/20 animate-pulse-blue border border-primary/50"><Plus className="h-4 w-4 text-primary" /></Button></Link></TooltipTrigger><TooltipContent><p>¡Apúntate al Match-Day!</p></TooltipContent></Tooltip>
                                        )}
                                    </TooltipProvider>
                                </div>
                            </div>
                            );
                        })}
                    </div>
                    <ScrollBar orientation="horizontal" className="h-2 mt-1" />
                </ScrollArea>
            </div>
                {renderContent()}
            </main>
            <ActivityTypeSelectionDialog
                isOpen={activitySelection.isOpen}
                onOpenChange={(isOpen) => setActivitySelection(prev => ({ ...prev, isOpen }))}
                onSelect={handleActivityTypeSelect}
            />
        </div>
    );
}
