

"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

import ClassDisplay from '@/components/classfinder/ClassDisplay';
import MatchDisplay from '@/components/classfinder/MatchDisplay'; // Import MatchDisplay
import { getMockTimeSlots, getMockCurrentUser, getUserActivityStatusForDay, fetchMatches, fetchMatchDayEventsForDate, createMatchesForDay, getMockClubs, countUserUnconfirmedInscriptions } from '@/lib/mockData';
import type { TimeSlot, User, MatchPadelLevel, SortOption, UserActivityStatusForDay, Match, MatchDayEvent, TimeOfDayFilterType } from '@/types';
import { startOfDay, addDays, isSameDay, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal, Star, Zap, User as UserIcon, Check, Activity as ActivityIcon, Users as UsersIcon } from 'lucide-react';
import PageSkeleton from '@/components/layout/PageSkeleton';
import { useActivityFilters } from '@/hooks/useActivityFilters';
import ActiveFiltersDisplay from '@/components/layout/ActiveFiltersDisplay';
import { MobileFiltersSheet } from '@/components/layout/MobileFiltersSheet';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import DesktopSidebar from '@/components/layout/DesktopSidebar';
import LogoutConfirmationDialog from '@/components/layout/LogoutConfirmationDialog';
import ProfessionalAccessDialog from '@/components/layout/ProfessionalAccessDialog';

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
    const [unconfirmedCount, setUnconfirmedCount] = useState(0);
    const [isMobileFilterSheetOpen, setIsMobileFilterSheetOpen] = useState(false);
    const [isLogoutConfimOpen, setIsLogoutConfirmOpen] = React.useState(false);
    const [isProfessionalAccessOpen, setIsProfessionalAccessOpen] = React.useState(false);

    const {
        activeView,
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

    const handleBookingSuccess = useCallback(async () => {
        triggerRefresh();
        const updatedUser = await getMockCurrentUser();
        setCurrentUser(updatedUser);
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
    
    useEffect(() => {
        const fetchCount = async () => {
            if (currentUser) {
                const count = await countUserUnconfirmedInscriptions(currentUser.id);
                setUnconfirmedCount(count);
            }
        };
        fetchCount();
        const intervalId = setInterval(fetchCount, 5000); // Poll every 5 seconds
        return () => clearInterval(intervalId);
    }, [currentUser, refreshKey]);

    const onViewPrefChange = (date: Date, pref: 'myInscriptions' | 'myConfirmed', type: 'class' | 'match') => {
        handleDateChange(date); // Set the date first
        // Then handle the preference change, which now reads the latest date state
        handleViewPrefChange(pref, type); 
    };
    
      const handleConfirmLogout = () => {
        console.log("Logout Confirmed");
        toast({ title: "Sesión Cerrada" });
        setIsLogoutConfirmOpen(false);
        router.push('/');
      }

    return (
        <div className="flex h-full">
            <DesktopSidebar
                currentUser={currentUser}
                clubInfo={getMockClubs()[0]} // Pass club info
                onProfessionalAccessClick={() => setIsProfessionalAccessOpen(true)}
                onLogoutClick={() => setIsLogoutConfirmOpen(true)}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="p-4 md:px-6 md:pt-6 md:pb-4 space-y-3 shrink-0">
                     <div className="flex justify-between items-center">
                        <h1 className="font-headline text-2xl md:text-3xl font-semibold">Actividades Disponibles</h1>
                        <Button onClick={() => setIsMobileFilterSheetOpen(true)} variant="outline" size="sm" className="md:hidden">
                            <SlidersHorizontal className="mr-2 h-4 w-4" />
                            Filtros
                        </Button>
                    </div>
                     <div className="flex gap-2 items-center justify-center">
                        <Link href="/activities?filter=liberadas" passHref>
                             <Button size="sm" variant={filterByLiberadasOnly ? "default" : "ghost"} className={cn(filterByLiberadasOnly ? "bg-purple-600 text-white" : "text-purple-600 hover:bg-purple-100 hover:text-purple-700")}>
                                <Zap className="mr-2 h-4 w-4" />Liberadas
                            </Button>
                        </Link>
                         <Link href="/activities?filter=puntos" passHref>
                             <Button size="sm" variant={filterByPuntosOnly ? "default" : "ghost"} className={cn(filterByPuntosOnly ? "bg-amber-600 text-white" : "text-amber-600 hover:bg-amber-100 hover:text-amber-700")}>
                                <Star className="mr-2 h-4 w-4" />Pagar con Puntos
                            </Button>
                        </Link>
                     </div>
                      <div className="min-h-[2rem]">
                        <ActiveFiltersDisplay
                            activeView={activeView}
                            timeSlotFilter={timeSlotFilter}
                            selectedLevel={selectedLevel}
                            viewPreference={viewPreference}
                            filterByFavorites={filterByFavorites}
                            onClearFilters={clearAllFilters}
                        />
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
                            onViewPrefChange={(pref, type) => onViewPrefChange(selectedDate!, pref, type)}
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
                            onViewPrefChange={(pref, type) => onViewPrefChange(selectedDate!, pref, type)}
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
                 <MobileFiltersSheet
                    isOpen={isMobileFilterSheetOpen}
                    onOpenChange={setIsMobileFilterSheetOpen}
                    timeSlotFilter={timeSlotFilter}
                    selectedLevel={selectedLevel}
                    viewPreference={viewPreference}
                    filterByFavorites={filterByFavorites}
                    showPointsBonus={showPointsBonus}
                    onTimeFilterChange={handleTimeFilterChange}
                    onLevelChange={handleLevelChange}
                    onViewPreferenceChange={(pref) => handleViewPrefChange(pref, activeView)}
                    onFavoritesClick={() => updateUrlFilter('favorites', !filterByFavorites)}
                    onTogglePointsBonus={handleTogglePointsBonus}
                    onClearFilters={clearAllFilters}
                 />
                 <LogoutConfirmationDialog
                    isOpen={isLogoutConfimOpen}
                    onOpenChange={setIsLogoutConfirmOpen}
                    onConfirm={handleConfirmLogout}
                />
                <ProfessionalAccessDialog 
                    isOpen={isProfessionalAccessOpen}
                    onOpenChange={setIsProfessionalAccessOpen}
                />
            </div>
        </div>
    );
}
