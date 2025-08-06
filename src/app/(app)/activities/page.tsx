"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import ClassDisplay from './components/ClassDisplay';
import { getMockTimeSlots, getMockCurrentUser, getUserActivityStatusForDay } from '@/lib/mockData';
import type { TimeSlot, User, MatchPadelLevel, SortOption, UserActivityStatusForDay } from '@/types';
import { startOfDay, addDays, isSameDay, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal, Star, Zap, User as UserIcon, Check } from 'lucide-react';
import ActivityFilterSheet from './components/ActivityFilterSheet';
import PageSkeleton from '@/components/ui/PageSkeleton';

const dateStripDates = Array.from({ length: 22 }, (_, i) => addDays(startOfDay(new Date()), i));

export default function ActivitiesPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [allTimeSlots, setAllTimeSlots] = useState<TimeSlot[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
    
    // Filter states
    const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
        const dateParam = searchParams.get('date');
        return dateParam ? startOfDay(parseISO(dateParam)) : startOfDay(new Date());
    });
    const [timeSlotFilter, setTimeSlotFilter] = useState(() => searchParams.get('time') || 'all');
    const [selectedLevels, setSelectedLevels] = useState<MatchPadelLevel[]>([]);
    const [sortBy, setSortBy] = useState<SortOption>(() => (searchParams.get('sort') as SortOption) || 'time');
    const [filterAlsoConfirmed, setFilterAlsoConfirmed] = useState(false);
    const [filterByFavorite, setFilterByFavorite] = useState(false);
    const [showPointsBonus, setShowPointsBonus] = useState(true);
    const [viewPreference, setViewPreference] = useState<'normal' | 'myInscriptions' | 'myConfirmed'>(
        () => (searchParams.get('viewPref') as 'normal' | 'myInscriptions' | 'myConfirmed') || 'normal'
    );
     const [proposalView, setProposalView] = useState<'join' | 'propose'>('join');


    const [dateStripIndicators, setDateStripIndicators] = useState<Record<string, UserActivityStatusForDay>>({});

    const handleBookingSuccess = useCallback(() => {
        setRefreshKey(prev => prev + 1);
    }, []);

    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            try {
                const [slots, user] = await Promise.all([
                    getMockTimeSlots('club-1'),
                    getMockCurrentUser()
                ]);
                setAllTimeSlots(slots);
                setCurrentUser(user);
            } catch (error) {
                console.error("Error fetching initial data", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, [refreshKey]);

     useEffect(() => {
        if (currentUser && allTimeSlots.length > 0) {
            const indicators: Record<string, UserActivityStatusForDay> = {};
            dateStripDates.forEach(day => {
                const dateKey = format(day, 'yyyy-MM-dd');
                indicators[dateKey] = getUserActivityStatusForDay(currentUser.id, day, allTimeSlots, []);
            });
            setDateStripIndicators(indicators);
        }
    }, [currentUser, allTimeSlots, dateStripDates]);

    const handleDateChange = (date: Date) => {
        setSelectedDate(date);
        const current = new URLSearchParams(Array.from(searchParams.entries()));
        current.set('date', format(date, 'yyyy-MM-dd'));
        current.set('viewPref', 'normal'); // Reset view preference on date change
        setViewPreference('normal');
        router.replace(`${pathname}?${current.toString()}`, { scroll: false });
    };
    
    const onViewPrefChange = (date: Date, pref: 'myInscriptions' | 'myConfirmed') => {
        setSelectedDate(date);
        setViewPreference(pref);
        const current = new URLSearchParams(Array.from(searchParams.entries()));
        current.set('date', format(date, 'yyyy-MM-dd'));
        current.set('viewPref', pref);
        router.replace(`${pathname}?${current.toString()}`, { scroll: false });
    };

    return (
        <div className="flex h-full flex-col">
            <header className="p-4 md:px-6 md:pt-6 md:pb-4 space-y-3">
                 <div className="flex justify-between items-center">
                    <h1 className="font-headline text-2xl md:text-3xl font-semibold">Clases Disponibles</h1>
                    <Button onClick={() => setIsFilterSheetOpen(true)} variant="outline" size="sm">
                        <SlidersHorizontal className="mr-2 h-4 w-4" />
                        Filtros
                    </Button>
                </div>

                <Tabs value={timeSlotFilter} onValueChange={setTimeSlotFilter} className="w-full">
                    <TabsList className="grid w-full grid-cols-4 h-auto">
                        <TabsTrigger value="all" className="text-xs sm:text-sm">Todos</TabsTrigger>
                        <TabsTrigger value="morning" className="text-xs sm:text-sm">Mañanas</TabsTrigger>
                        <TabsTrigger value="midday" className="text-xs sm:text-sm">Mediodía</TabsTrigger>
                        <TabsTrigger value="evening" className="text-xs sm:text-sm">Tardes</TabsTrigger>
                    </TabsList>
                </Tabs>
                
                 <div className="flex gap-2 items-center justify-center">
                    <Button size="sm" variant="ghost" className="text-amber-600 hover:bg-amber-100 hover:text-amber-700">
                        <Star className="mr-2 h-4 w-4" />Gratis
                    </Button>
                     <Button size="sm" variant="ghost" className="text-green-600 hover:bg-green-100 hover:text-green-700">
                        <Zap className="mr-2 h-4 w-4" />Liberadas
                    </Button>
                 </div>
            </header>
            <main className="flex-1 overflow-y-auto bg-background px-4 md:px-6 pb-6">
                {isLoading ? (
                    <PageSkeleton />
                ) : (
                    <ClassDisplay
                        currentUser={currentUser}
                        onBookingSuccess={handleBookingSuccess}
                        selectedDate={selectedDate}
                        onDateChange={handleDateChange}
                        timeSlotFilter={timeSlotFilter}
                        selectedLevelsSheet={selectedLevels}
                        sortBy={sortBy}
                        filterAlsoConfirmedClasses={filterAlsoConfirmed}
                        filterByFavoriteInstructors={filterByFavorite}
                        viewPreference={viewPreference}
                        proposalView={proposalView}
                        refreshKey={refreshKey}
                        allClasses={allTimeSlots}
                        isLoading={isLoading}
                        dateStripIndicators={dateStripIndicators}
                        dateStripDates={dateStripDates}
                        onViewPrefChange={onViewPrefChange}
                        showPointsBonus={showPointsBonus}
                    />
                )}
            </main>
             <ActivityFilterSheet
                isOpen={isFilterSheetOpen}
                onOpenChange={setIsFilterSheetOpen}
                selectedLevels={selectedLevels}
                setSelectedLevels={setSelectedLevels}
                sortBy={sortBy}
                setSortBy={setSortBy}
                filterAlsoConfirmed={filterAlsoConfirmed}
                setFilterAlsoConfirmed={setFilterAlsoConfirmed}
                filterByFavorite={filterByFavorite}
                setFilterByFavorite={setFilterByFavorite}
                showPointsBonus={showPointsBonus}
                setShowPointsBonus={setShowPointsBonus}
             />
        </div>
    );
}
