
"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import ClassDisplay from '@/components/classfinder/ClassDisplay';
import MatchDisplay from '@/components/classfinder/MatchDisplay'; // Import MatchDisplay
import MatchProDisplay from '@/components/classfinder/MatchProDisplay'; // Import MatchProDisplay
import { getMockTimeSlots, getMockCurrentUser, getUserActivityStatusForDay, fetchMatches, fetchMatchDayEventsForDate, createMatchesForDay, getMockClubs, countUserUnconfirmedInscriptions } from '@/lib/mockData';
import type { TimeSlot, User, MatchPadelLevel, SortOption, UserActivityStatusForDay, Match, MatchDayEvent, TimeOfDayFilterType, ViewPreference, ActivityViewType, Club } from '@/types';
import { startOfDay, addDays, isSameDay, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal, Star, Zap, User as UserIcon, Check, Activity as ActivityIcon, Users as UsersIcon, Trophy, Plus, CalendarDays } from 'lucide-react';
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
import ActivityTypeSelectionDialog from './components/ActivityTypeSelectionDialog';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

function ActivitiesPageContent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [currentClub, setCurrentClub] = useState<Club | null>(null);
    const [allTimeSlots, setAllTimeSlots] = useState<TimeSlot[]>([]);
    const [allMatches, setAllMatches] = useState<Match[]>([]);
    const [matchDayEvents, setMatchDayEvents] = useState<MatchDayEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [unconfirmedCount, setUnconfirmedCount] = useState(0);
    const [isMobileFilterSheetOpen, setIsMobileFilterSheetOpen] = useState(false);
    const [isLogoutConfimOpen, setIsLogoutConfirmOpen] = React.useState(false);
    const [isProfessionalAccessOpen, setIsProfessionalAccessOpen] = React.useState(false);

    // New state for the activity type selection dialog
    const [activitySelection, setActivitySelection] = useState<{
        isOpen: boolean;
        date: Date | null;
        preference: ViewPreference | null;
        types: ('class' | 'match')[];
    }>({ isOpen: false, date: null, preference: null, types: [] });

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
        filterByProOnly,
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
                setCurrentClub(clubs.length > 0 ? clubs[0] : null);
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

    const onViewPrefChange = (date: Date, pref: ViewPreference, types: ('class' | 'match' | 'event')[], eventId?: string) => {
        const relevantTypes = types.filter(t => t !== 'event') as ('class' | 'match')[];
    
        if (relevantTypes.length > 1) {
            setActivitySelection({ isOpen: true, date, preference: pref, types: relevantTypes });
        } else if (relevantTypes.length === 1) {
            // Directly navigate if only one type
            handleViewPrefChange(pref, relevantTypes[0] as ActivityViewType, date);
        } else if (types.includes('event') && eventId) {
            router.push(`/match-day/${eventId}`);
        } else {
            // Fallback for cases with no specific type, maybe from a general button
            handleViewPrefChange(pref, activeView, date);
        }
    };
    
      const handleConfirmLogout = () => {
        console.log("Logout Confirmed");
        toast({ title: "Sesión Cerrada" });
        setIsLogoutConfirmOpen(false);
        router.push('/');
      }

    const handleActivityTypeSelect = (type: 'class' | 'match') => {
        if (activitySelection.date && activitySelection.preference) {
            handleViewPrefChange(activitySelection.preference, type, activitySelection.date);
        }
        setActivitySelection({ isOpen: false, date: null, preference: null, types: [] });
    };

    const renderContent = () => {
        if (isLoading) return <PageSkeleton />;
        
        switch(activeView) {
            case 'clases':
                return <ClassDisplay
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
                        />;
            case 'partidas':
                 return <MatchDisplay
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
                            filterByProOnly={filterByProOnly}
                            matchShareCode={matchShareCode}
                            matchIdFilter={matchIdFilter}
                        />;
            case 'matchpro':
                 return <MatchProDisplay
                            currentUser={currentUser}
                            clubInfo={currentClub}
                            onBookingSuccess={handleBookingSuccess}
                            selectedDate={selectedDate}
                            onDateChange={handleDateChange}
                            timeSlotFilter={timeSlotFilter}
                            viewPreference={viewPreference}
                        />;
            default:
                return null;
        }
    };

    return (
        <div className="flex h-full bg-muted/50">
            <DesktopSidebar
                currentUser={currentUser}
                clubInfo={currentClub} // Pass club info
                onProfessionalAccessClick={() => setIsProfessionalAccessOpen(true)}
                onLogoutClick={() => setIsLogoutConfirmOpen(true)}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="p-4 md:px-6 md:pt-6 md:pb-4 space-y-3 shrink-0 bg-card border-b">
                    <div className="flex justify-end md:justify-between items-center">
                        <div className="hidden md:flex items-center gap-1 p-1 bg-muted rounded-full">
                            <Button size="sm" variant={activeView === 'clases' ? 'secondary' : 'ghost'} className="rounded-full" onClick={() => updateUrlFilter('view', 'clases')}><ActivityIcon className="mr-2 h-4 w-4" />Clases</Button>
                            <Button size="sm" variant={activeView === 'partidas' ? 'secondary' : 'ghost'} className="rounded-full" onClick={() => updateUrlFilter('view', 'partidas')}><UsersIcon className="mr-2 h-4 w-4" />Partidas</Button>
                        </div>
                        <Button onClick={() => setIsMobileFilterSheetOpen(true)} variant="outline" size="sm" className="md:hidden">
                            <SlidersHorizontal className="mr-2 h-4 w-4" />
                            Filtros
                        </Button>
                    </div>
                     <div className="flex gap-2 items-center justify-center">
                        <Link href="/activities?view=partidas&filter=liberadas" passHref>
                             <Button size="sm" variant={filterByLiberadasOnly ? "default" : "ghost"} className={cn(filterByLiberadasOnly ? "bg-purple-600 text-white" : "text-purple-600 hover:bg-purple-100 hover:text-purple-700")}>
                                <Zap className="mr-2 h-4 w-4" />Liberadas
                            </Button>
                        </Link>
                         <Link href="/activities?view=partidas&filter=puntos" passHref>
                             <Button size="sm" variant={filterByPuntosOnly ? "default" : "ghost"} className={cn(filterByPuntosOnly ? "bg-amber-600 text-white" : "text-amber-700")}>
                                <Star className="mr-2 h-4 w-4" />Pagar con Puntos
                            </Button>
                        </Link>
                         {(currentClub?.isMatchProEnabled ?? false) && (
                            <Link href="/activities?view=partidas&filter=pro" passHref>
                                <Button size="sm" variant={filterByProOnly ? "default" : "ghost"} className={cn(filterByProOnly ? "bg-slate-800 text-white" : "text-slate-700")}>
                                    <Trophy className="mr-2 h-4 w-4" />Matchpro
                                </Button>
                            </Link>
                         )}
                     </div>
                      <div className="min-h-[2rem]">
                        <ActiveFiltersDisplay
                            activeView={activeView as 'clases' | 'partidas'}
                            timeSlotFilter={timeSlotFilter}
                            selectedLevel={selectedLevel}
                            viewPreference={viewPreference}
                            filterByFavorites={filterByFavorites}
                            onClearFilters={clearAllFilters}
                        />
                     </div>
                </header>
                 <main className="flex-1 overflow-y-auto px-4 md:px-6 pb-6 space-y-4">
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

                                        {/* INDICATOR SECTION */}
                                        <div className="h-10 w-8 flex flex-col items-center justify-center relative space-y-0.5">
                                            <TooltipProvider delayDuration={150}>
                                                {indicators.activityStatus === 'confirmed' && (
                                                    <Tooltip><TooltipTrigger asChild><button onClick={() => onViewPrefChange(day, 'myConfirmed', indicators.activityType || ['class'])} className="h-6 w-6 flex items-center justify-center bg-destructive text-destructive-foreground rounded-md font-bold text-xs leading-none cursor-pointer hover:scale-110 transition-transform">R</button></TooltipTrigger><TooltipContent><p>Ver mis reservas</p></TooltipContent></Tooltip>
                                                )}
                                                {indicators.activityStatus === 'inscribed' && (
                                                    <Tooltip><TooltipTrigger asChild><button onClick={() => onViewPrefChange(day, 'myInscriptions', indicators.activityType || ['class'], indicators.eventId)} className="h-6 w-6 flex items-center justify-center bg-blue-500 text-white rounded-md font-bold text-xs leading-none cursor-pointer hover:scale-110 transition-transform">I</button></TooltipTrigger><TooltipContent><p>Ver mis inscripciones</p></TooltipContent></Tooltip>
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
                    onViewPreferenceChange={(pref) => handleViewPrefChange(pref, activeView, selectedDate || new Date())}
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
                <ActivityTypeSelectionDialog
                    isOpen={activitySelection.isOpen}
                    onOpenChange={(isOpen) => setActivitySelection(prev => ({ ...prev, isOpen }))}
                    onSelect={handleActivityTypeSelect}
                />
            </div>
        </div>
    );
}

export default function ActivitiesPage() {
    return (
        <Suspense fallback={<PageSkeleton />}>
            <ActivitiesPageContent />
        </Suspense>
    );
}
