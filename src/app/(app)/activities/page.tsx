
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

import ClassDisplay from '@/components/classfinder/ClassDisplay';
import MatchDisplay from '@/components/classfinder/MatchDisplay'; // Import MatchDisplay
import { getMockTimeSlots, getMockCurrentUser, getUserActivityStatusForDay, fetchMatches, fetchMatchDayEventsForDate, createMatchesForDay, getMockClubs } from '@/lib/mockData';
import type { TimeSlot, User, MatchPadelLevel, SortOption, UserActivityStatusForDay, Match, MatchDayEvent, TimeOfDayFilterType } from '@/types';
import { startOfDay, addDays, isSameDay, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal, Star, Zap, User as UserIcon, Check, Activity as ActivityIcon, Users as UsersIcon } from 'lucide-react';
import ActivityFilterSheet from '@/components/classfinder/ActivityFilterSheet';
import PageSkeleton from '@/components/layout/PageSkeleton';
import { useActivityFilters } from '@/hooks/useActivityFilters';
import ActiveFiltersDisplay from '@/components/layout/ActiveFiltersDisplay';
import { MobileFiltersSheet } from '@/components/layout/MobileFiltersSheet';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function ActivitiesPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [allTimeSlots, setAllTimeSlots] = useState<TimeSlot[]>([]);
    const [allMatches, setAllMatches] = useState<Match[]>([]);
    const [matchDayEvents, setMatchDayEvents] = useState<MatchDayEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
    
    // Use the new hook for filter management
    const {
        activeView,
        setActiveView,
        selectedDate,
        setSelectedDate,
        timeSlotFilter,
        selectedLevel,
        filterByFavorites,
        viewPreference,
        proposalView,
        matchShareCode,
        matchIdFilter,
        filterByGratisOnly,
        filterByLiberadasOnly,
        filterByPuntosOnly,
        isUpdatingFavorites,
        dateStripIndicators,
        dateStripDates,
        refreshKey,
        showPointsBonus,
        handleTimeFilterChange,
        handleLevelChange,
        handleFavoritesClick,
        handleDateChange,
        handleViewPrefChange,
        clearAllFilters,
        triggerRefresh,
        handleTogglePointsBonus,
        updateUrlFilter,
    } = useActivityFilters(currentUser, (newFavorites) => {
        if (currentUser) {
            setCurrentUser({ ...currentUser, favoriteInstructorIds: newFavorites });
        }
    });

    const handleBookingSuccess = useCallback(() => {
        triggerRefresh(); // Use the hook's refresh trigger
    }, [triggerRefresh]);
    
    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            try {
                const [user, slots, existingMatches, clubs] = await Promise.all([
                    getMockCurrentUser(),
                    getMockTimeSlots('club-1'),
                    fetchMatches('club-1'),
                    getMockClubs(),
                ]);
                setCurrentUser(user);
                setAllTimeSlots(slots);
                
                // Generate placeholder matches for the next 7 days and combine with existing ones
                const club = clubs[0];
                let generatedMatches: Match[] = [];
                if (club) {
                    for (let i = 0; i < 7; i++) {
                        const date = addDays(new Date(), i);
                        generatedMatches.push(...createMatchesForDay(club, date));
                    }
                }
                const combined = [...existingMatches, ...generatedMatches];
                const uniqueMatches = Array.from(new Map(combined.map(item => [item['id'], item])).values());
                setAllMatches(uniqueMatches);


                if (selectedDate) {
                    const events = await fetchMatchDayEventsForDate(selectedDate, 'club-1');
                    setMatchDayEvents(events);
                } else {
                    setMatchDayEvents([]);
                }
            } catch (error) {
                console.error("Error fetching initial data", error);
                toast({ title: "Error", description: "No se pudieron cargar las actividades.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, [refreshKey, selectedDate, toast]);
    
    const onViewPrefChange = (date: Date, pref: 'myInscriptions' | 'myConfirmed') => {
        handleDateChange(date);
        handleViewPrefChange(pref);
    };

    return (
        <div className="flex h-full flex-col">
            <header className="p-4 md:px-6 md:pt-6 md:pb-4 space-y-3">
                 <div className="flex justify-between items-center">
                    <h1 className="font-headline text-2xl md:text-3xl font-semibold">Actividades Disponibles</h1>
                    <Button onClick={() => setIsFilterSheetOpen(true)} variant="outline" size="sm">
                        <SlidersHorizontal className="mr-2 h-4 w-4" />
                        Filtros
                    </Button>
                </div>
                 <Tabs value={activeView} onValueChange={(v) => updateUrlFilter('view', v)} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 h-auto">
                        <TabsTrigger value="clases"><ActivityIcon className="mr-2 h-4 w-4" />Clases</TabsTrigger>
                        <TabsTrigger value="partidas"><UsersIcon className="mr-2 h-4 w-4" />Partidas</TabsTrigger>
                    </TabsList>
                </Tabs>
                 <div className="flex gap-2 items-center justify-center">
                    <Link href="/activities?filter=liberadas" passHref>
                         <Button size="sm" variant={filterByLiberadasOnly ? "default" : "ghost"} className={cn(filterByLiberadasOnly ? "bg-purple-600 text-white" : "text-purple-600 hover:bg-purple-100 hover:text-purple-700")}>
                            <Zap className="mr-2 h-4 w-4" />Liberadas
                        </Button>
                    </Link>
                     <Link href="/reservar" passHref>
                         <Button size="sm" variant="ghost" className="text-amber-600 hover:bg-amber-100 hover:text-amber-700">
                            <Star className="mr-2 h-4 w-4" />Reservar con Puntos
                        </Button>
                    </Link>
                 </div>
            </header>
            <main className="flex-1 overflow-y-auto bg-background px-4 md:px-6 pb-6">
                {isLoading ? (
                    <PageSkeleton />
                ) : activeView === 'clases' ? (
                    <ClassDisplay
                        currentUser={currentUser}
                        onBookingSuccess={handleBookingSuccess}
                        selectedDate={selectedDate}
                        onDateChange={handleDateChange}
                        timeSlotFilter={timeSlotFilter}
                        selectedLevelsSheet={selectedLevel === 'all' ? [] : [selectedLevel]}
                        sortBy={'time'}
                        filterAlsoConfirmedClasses={false}
                        filterByFavoriteInstructors={filterByFavorites}
                        viewPreference={viewPreference}
                        proposalView={'join'}
                        refreshKey={refreshKey}
                        allClasses={allTimeSlots}
                        isLoading={isLoading}
                        dateStripIndicators={dateStripIndicators}
                        dateStripDates={dateStripDates}
                        onViewPrefChange={onViewPrefChange}
                        showPointsBonus={showPointsBonus}
                        filterByGratisOnly={filterByGratisOnly}
                        filterByLiberadasOnly={filterByLiberadasOnly}
                    />
                ) : (
                    <MatchDisplay
                        currentUser={currentUser}
                        onBookingSuccess={handleBookingSuccess}
                        selectedDate={selectedDate}
                        onDateChange={handleDateChange}
                        timeSlotFilter={timeSlotFilter}
                        selectedLevel={selectedLevel}
                        sortBy={'time'}
                        filterAlsoConfirmedMatches={false}
                        viewPreference={viewPreference}
                        proposalView={'join'}
                        refreshKey={refreshKey}
                        allMatches={allMatches}
                        isLoading={isLoading}
                        dateStripIndicators={dateStripIndicators}
                        dateStripDates={dateStripDates}
                        onViewPrefChange={onViewPrefChange}
                        showPointsBonus={showPointsBonus}
                        matchDayEvents={matchDayEvents}
                        filterByGratisOnly={filterByGratisOnly}
                        filterByLiberadasOnly={filterByLiberadasOnly}
                        filterByPuntosOnly={filterByPuntosOnly}
                        matchShareCode={matchShareCode}
                        matchIdFilter={matchIdFilter}
                    />
                )}
            </main>
             <ActivityFilterSheet
                isOpen={isFilterSheetOpen}
                onOpenChange={setIsFilterSheetOpen}
                selectedLevels={selectedLevel === 'all' ? [] : [selectedLevel]}
                setSelectedLevels={(updater) => {
                    const newLevels = typeof updater === 'function' ? updater(selectedLevel === 'all' ? [] : [selectedLevel]) : updater;
                    handleLevelChange(newLevels.length > 0 ? newLevels[0] : 'all');
                 }}
                sortBy={'time'}
                setSortBy={() => {}}
                filterAlsoConfirmed={false}
                setFilterAlsoConfirmed={() => {}}
                filterByFavorite={filterByFavorites}
                setFilterByFavorite={(val) => updateUrlFilter('favorites', val ? 'true' : 'false')}
                showPointsBonus={showPointsBonus}
                setShowPointsBonus={handleTogglePointsBonus}
             />
        </div>
    );
}
