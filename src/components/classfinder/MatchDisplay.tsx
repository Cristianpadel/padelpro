

// src/components/classfinder/MatchDisplay.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Match, User, MatchBooking, MatchPadelLevel, PadelCategoryForSlot, SortOption, TimeOfDayFilterType, MatchDayEvent, UserActivityStatusForDay, ViewPreference } from '@/types';
import { matchPadelLevels, timeSlotFilterOptions } from '@/types';
import MatchCard from '@/components/match/MatchCard';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchMatches, getMockClubs, findAvailableCourt, fetchMatchDayEventsForDate, getUserActivityStatusForDay, getMatchDayInscriptions, isUserLevelCompatibleWithActivity, isMatchBookableWithPoints } from '@/lib/mockData';
import { Loader2, SearchX, CalendarDays, Plus, CheckCircle, PartyPopper, ArrowRight, Users, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { format, isSameDay, addDays, startOfDay, addMinutes, getDay, parse, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Import Tabs
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface MatchDisplayProps {
  currentUser: User | null;
  onBookingSuccess: () => void;
  filterByClubId?: string | null;
  filterByGratisOnly?: boolean;
  filterByLiberadasOnly?: boolean;
  filterByPuntosOnly?: boolean; // New prop
  onDeactivateGratisFilter?: () => void;
  matchShareCode?: string | null;
  matchIdFilter?: string | null;
  // Shared filter props
  selectedDate: Date | null;
  onDateChange: (date: Date) => void;
  timeSlotFilter: TimeOfDayFilterType;
  selectedLevel: MatchPadelLevel | 'all';
  sortBy: SortOption;
  filterAlsoConfirmedMatches: boolean;
  viewPreference: ViewPreference;
  proposalView: 'join' | 'propose';
  refreshKey: number;
  allMatches: Match[];
  isLoading: boolean;
  matchDayEvents: MatchDayEvent[]; // Changed to array
  dateStripIndicators: Record<string, UserActivityStatusForDay>;
  dateStripDates: Date[];
  onViewPrefChange: (pref: ViewPreference, type: 'class' | 'match' | 'event', eventId?: string) => void;
  showPointsBonus: boolean;
}

const ITEMS_PER_PAGE = 9;

const MatchDisplay: React.FC<MatchDisplayProps> = ({
    currentUser, onBookingSuccess, filterByClubId, filterByGratisOnly, filterByLiberadasOnly, onDeactivateGratisFilter, matchShareCode,
    matchIdFilter, selectedDate, onDateChange, timeSlotFilter, selectedLevel, sortBy,
    filterAlsoConfirmedMatches, viewPreference, proposalView, refreshKey, allMatches, isLoading,
    matchDayEvents, filterByPuntosOnly, dateStripIndicators, dateStripDates, onViewPrefChange, showPointsBonus
}) => {
  const [filteredMatches, setFilteredMatches] = useState<(Match | (MatchDayEvent & { isEventCard: true, inscriptionCount?: number }))[]>([]);
  const [displayedMatches, setDisplayedMatches] = useState<(Match | (MatchDayEvent & { isEventCard: true, inscriptionCount?: number }))[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [canLoadMore, setCanLoadMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreMatchesRef = useRef<HTMLDivElement>(null);
  
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const handleProposalViewChange = (newView: 'join' | 'propose') => {
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.set('subview', newView);
        router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
    };

  
  const applyMatchFilters = useCallback(async () => {
    if (!currentUser) {
        setFilteredMatches([]);
        return;
    }
    
    let finalMatches: (Match | (MatchDayEvent & { isEventCard: true, inscriptionCount?: number }))[] = [];

    if (matchIdFilter) {
        const singleMatch = allMatches.find(m => m.id === matchIdFilter);
        finalMatches = singleMatch ? [singleMatch] : [];
    } else if (matchShareCode) {
        const singleMatch = allMatches.find(m => m.privateShareCode === matchShareCode);
        finalMatches = singleMatch ? [singleMatch] : [];
    } else {
        let workingMatches: (Match | (MatchDayEvent & { isEventCard: true, inscriptionCount?: number }))[] = [...allMatches];

        // Add MatchDayEvent as special cards if it exists for the date.
        if (selectedDate && matchDayEvents.length > 0) {
            const eventCardsWithCounts = await Promise.all(matchDayEvents.map(async (event) => {
                const inscriptions = await getMatchDayInscriptions(event.id);
                return {
                    ...event,
                    id: `${event.id}`, // Use the original event ID
                    isEventCard: true,
                    inscriptionCount: inscriptions.length
                };
            }));
            workingMatches.push(...eventCardsWithCounts);
        }

        workingMatches = workingMatches.filter((match) => {
            if ('isEventCard' in match && match.isEventCard) return true; // Always include event cards for the selected date
            const regularMatch = match as Match;
            if (regularMatch.status === 'confirmed_private') return regularMatch.organizerId === currentUser.id;
            return true;
        });

        if (filterByClubId) {
            workingMatches = workingMatches.filter(match => match.clubId === filterByClubId);
        }
        
        // --- View Preference Filter (has priority) ---
        if (viewPreference === 'myInscriptions') {
            workingMatches = workingMatches.filter(match => {
                if ('isEventCard' in match) return false;
                const regularMatch = match as Match;
                return (regularMatch.bookedPlayers || []).some(p => p.userId === currentUser.id) && regularMatch.status !== 'confirmed' && regularMatch.status !== 'confirmed_private';
            });
        } else if (viewPreference === 'myConfirmed') {
             workingMatches = workingMatches.filter(match => {
                if ('isEventCard' in match) return false;
                const regularMatch = match as Match;
                const isUserInMatch = (regularMatch.bookedPlayers || []).some(p => p.userId === currentUser.id);
                if (!isUserInMatch) return false;
                return regularMatch.status === 'confirmed' || regularMatch.status === 'confirmed_private';
            });
        } else if (viewPreference === 'withPlayers') {
            workingMatches = workingMatches.filter(match => {
                if ('isEventCard' in match) return false;
                const regularMatch = match as Match;
                const hasPlayers = (regularMatch.bookedPlayers || []).length > 0;
                const isFull = (regularMatch.bookedPlayers || []).length >= 4;
                return hasPlayers && !isFull;
            });
        }
        
        // --- Special Filters (Gratis, Liberadas, Puntos) ---
        if (filterByLiberadasOnly) {
            workingMatches = workingMatches.filter(match => {
                if ('isEventCard' in match && match.isEventCard) return false;
                const regularMatch = match as Match;
                const isLiberada = (regularMatch.status === 'confirmed' || regularMatch.status === 'confirmed_private') && regularMatch.gratisSpotAvailable && (regularMatch.bookedPlayers || []).length === 3;
                if (!isLiberada) return false;
                return isUserLevelCompatibleWithActivity(regularMatch.level, currentUser?.level, false);
            });
        } else if (filterByGratisOnly) {
            workingMatches = workingMatches.filter(match => {
                 if ('isEventCard' in match && match.isEventCard) return false;
                const regularMatch = match as Match;
                const isGratis = regularMatch.gratisSpotAvailable && (regularMatch.bookedPlayers || []).length === 3;
                if (!isGratis) return false;
                return isUserLevelCompatibleWithActivity(regularMatch.level, currentUser?.level, false);
            });
        } else if (filterByPuntosOnly) {
            const club = getMockClubs().find(c => c.id === filterByClubId);
            workingMatches = workingMatches.filter(match => {
                if ('isEventCard' in match) return false;
                const regularMatch = match as Match;
                return isMatchBookableWithPoints(regularMatch, club);
            });
        } else { // Standard filters if no special filter is active
            if (!selectedDate) {
                workingMatches = [];
            } else {
                workingMatches = workingMatches.filter(match => isSameDay(new Date('isEventCard' in match ? match.eventDate : match.startTime), selectedDate));
            }

            if (timeSlotFilter !== 'all') {
                workingMatches = workingMatches.filter(match => {
                    const matchHour = new Date('isEventCard' in match ? match.eventDate : match.startTime).getHours();
                    if (timeSlotFilter === 'morning') return matchHour >= 8 && matchHour < 13;
                    if (timeSlotFilter === 'midday') return matchHour >= 13 && matchHour < 18;
                    if (timeSlotFilter === 'evening') return matchHour >= 18 && matchHour <= 22;
                    return true;
                });
            }

            if (selectedLevel !== 'all') {
                if (selectedLevel === 'abierto') {
                    workingMatches = workingMatches.filter(match => !('isEventCard' in match) && (match as Match).level === 'abierto');
                } else {
                    workingMatches = workingMatches.filter(match => !('isEventCard' in match) && ((match as Match).level === selectedLevel || (match as Match).level === 'abierto'));
                }
            }
        }
        
        workingMatches.sort((a, b) => {
            const isUserInA = !('isEventCard' in a) && (a as Match).bookedPlayers?.some(p => p.userId === currentUser.id);
            const isUserInB = !('isEventCard' in b) && (b as Match).bookedPlayers?.some(p => p.userId === currentUser.id);
            if (isUserInA && !isUserInB) return -1;
            if (!isUserInA && isUserInB) return 1;

            const aHasPlayers = !('isEventCard' in a) && (a as Match).bookedPlayers && (a as Match).bookedPlayers.length > 0;
            const bHasPlayers = !('isEventCard' in b) && (b as Match).bookedPlayers && (b as Match).bookedPlayers.length > 0;
            if (aHasPlayers && !bHasPlayers) return -1;
            if (!bHasPlayers && aHasPlayers) return 1;

            const dateA = new Date('isEventCard' in a ? a.eventDate : a.startTime).getTime();
            const dateB = new Date('isEventCard' in b ? b.eventDate : b.startTime).getTime();
            if (dateA !== dateB) return dateA - dateB;

            if ('isEventCard' in a && !('isEventCard' in b)) return -1;
            if (!('isEventCard' in a) && 'isEventCard' in b) return 1;

            if (!('isEventCard' in a) && !('isEventCard' in b)) {
                const aRegular = a as Match;
                const bRegular = b as Match;
                const aOccupancy = (aRegular.bookedPlayers || []).length;
                const bOccupancy = (bRegular.bookedPlayers || []).length;
                if (bOccupancy !== aOccupancy) return bOccupancy - aOccupancy;
            }

            return 0; // Keep original order if all else is equal
        });
        
        finalMatches = workingMatches;
    }
    
    setFilteredMatches(finalMatches); 
    setCurrentPage(1); // Reset page when filters change
  }, [allMatches, currentUser, filterByClubId, filterByGratisOnly, filterByLiberadasOnly, filterByPuntosOnly, selectedDate, timeSlotFilter, selectedLevel, viewPreference, matchIdFilter, matchShareCode, matchDayEvents]);
  
  useEffect(() => {
    applyMatchFilters();
  }, [applyMatchFilters, refreshKey, selectedDate]);

  useEffect(() => {
    setDisplayedMatches(filteredMatches.slice(0, ITEMS_PER_PAGE * currentPage));
    setCanLoadMore(filteredMatches.length > ITEMS_PER_PAGE * currentPage);
  }, [filteredMatches, currentPage]);

  const handleLoadMore = useCallback(() => {
    if (!canLoadMore || isLoadingMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
        const nextPage = currentPage + 1;
        setDisplayedMatches(filteredMatches.slice(0, ITEMS_PER_PAGE * nextPage));
        setCurrentPage(nextPage);
        setCanLoadMore(filteredMatches.length > ITEMS_PER_PAGE * nextPage);
        setIsLoadingMore(false);
    }, 300);
  }, [canLoadMore, isLoadingMore, currentPage, filteredMatches]);

  useEffect(() => {
    if (!canLoadMore || isLoadingMore || !loadMoreMatchesRef.current) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) handleLoadMore();
    }, { threshold: 0.1 });
    const currentRef = loadMoreMatchesRef.current;
    if (currentRef) observer.observe(currentRef);
    return () => { if (currentRef) observer.unobserve(currentRef); observer.disconnect(); };
  }, [canLoadMore, isLoadingMore, handleLoadMore]);

  const handleLocalMatchBookingUpdate = (updatedMatch: Match) => {
    onBookingSuccess();
  };
  
  const findNextAvailableDay = (): Date | null => {
        const today = startOfDay(new Date());
        let currentDateToCheck = selectedDate ? addDays(selectedDate, 1) : today;
        const limit = addDays(today, 30); // Search up to 30 days in the future

        while (currentDateToCheck <= limit) {
             const hasActivity = allMatches.some(match => {
                if (isSameDay(new Date(match.startTime), currentDateToCheck)) {
                    if (viewPreference === 'myInscriptions') {
                        return (match.bookedPlayers || []).some(p => p.userId === currentUser?.id);
                    }
                    return true;
                }
                return false;
            });

            if (hasActivity) {
                return currentDateToCheck;
            }
            currentDateToCheck = addDays(currentDateToCheck, 1);
        }
        return null;
    };

    const handleNextAvailableClick = () => {
        const nextDay = findNextAvailableDay();
        if (nextDay) {
            onDateChange(nextDay);
        } else {
            toast({
                title: viewPreference === 'myInscriptions' ? "No tienes más inscripciones" : "No hay partidas futuras",
                description: viewPreference === 'myInscriptions' ? "No estás apuntado a más partidas en los próximos 30 días." : "No se encontraron partidas disponibles en los próximos 30 días.",
            });
        }
    };

  if (isLoading) return <div className="space-y-4"> <Skeleton className="h-10 w-full" /> <div className="grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-6"><Skeleton className="h-64 w-full" /><Skeleton className="h-64 w-full" /><Skeleton className="h-64 w-full" /></div></div>

  const clubName = filterByClubId ? getMockClubs().find(c => c.id === filterByClubId)?.name : "Todos los Clubes";

  return (
    <div>
       {(!matchIdFilter && !matchShareCode && !filterByGratisOnly && !filterByLiberadasOnly && !filterByPuntosOnly) && (
            <div className="relative z-10 py-1">
                <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex space-x-2">
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
                                    onClick={() => onDateChange(day)}
                                >
                                    <span className="font-bold text-[10px] uppercase">{format(day, "EEE", { locale: es }).slice(0, 3)}</span>
                                    <span className="text-sm font-bold">{format(day, "d", { locale: es })}</span>
                                    <span className="text-[9px] text-muted-foreground capitalize -mt-0.5">{format(day, "MMM", { locale: es }).slice(0,3)}</span>
                                </Button>

                                 {/* INDICATOR SECTION */}
                                 <div className="h-10 w-8 flex flex-col items-center justify-center relative space-y-0.5">
                                        {indicators.activityStatus === 'confirmed' && (
                                             <button onClick={() => onViewPrefChange('myConfirmed', indicators.activityType || 'match')} title="Ver actividad confirmada" className="h-6 w-6 flex items-center justify-center bg-destructive text-destructive-foreground rounded-md font-bold text-xs leading-none cursor-pointer hover:scale-110 transition-transform">R</button>
                                        )}
                                        {indicators.activityStatus === 'inscribed' && (
                                             <button onClick={() => onViewPrefChange('myInscriptions', indicators.activityType || 'match', indicators.eventId)} title="Ver pre-inscripción" className="h-6 w-6 flex items-center justify-center bg-blue-500 text-white rounded-md font-bold text-xs leading-none cursor-pointer hover:scale-110 transition-transform">I</button>
                                        )}
                                        {indicators.hasEvent && indicators.activityStatus === 'none' && (
                                            <Link href={`/match-day/${indicators.eventId}`} passHref>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md bg-primary/10 hover:bg-primary/20 animate-pulse-blue border border-primary/50">
                                                     <Plus className="h-4 w-4 text-primary" />
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                            </div>
                            );
                        })}
                    </div>
                    <ScrollBar orientation="horizontal" className="h-2 mt-1" />
                </ScrollArea>
            </div>
        )}

      <div className="mt-2">
        {((!selectedDate && !filterByGratisOnly && !filterByLiberadasOnly && !filterByPuntosOnly && !matchIdFilter && !matchShareCode)) && (
            <div className="text-center py-16">
                <CalendarDays className="h-20 w-20 text-muted-foreground mx-auto mb-6 opacity-50" />
                <h2 className="text-2xl font-semibold text-foreground mb-3">Selecciona una fecha</h2>
                <p className="text-muted-foreground max-w-md mx-auto">Elige un día para ver las partidas disponibles.</p>
            </div>
        )}

        {((selectedDate || filterByGratisOnly || filterByLiberadasOnly || filterByPuntosOnly || matchIdFilter || matchShareCode)) && displayedMatches.length === 0 && !isLoading && (
            <div className="text-center py-16">
                <SearchX className="h-20 w-20 text-muted-foreground mx-auto mb-6 opacity-50" />
                <h2 className="text-2xl font-semibold text-foreground mb-3">
                    {viewPreference === 'myInscriptions' ? 'No tienes próximas partidas' : 'No se encontraron partidas'}
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                    {viewPreference === 'myInscriptions' ? "No estás apuntado/a a ninguna partida para este día." : "Prueba a cambiar las fechas o ajusta los filtros."}
                </p>
                <Button onClick={handleNextAvailableClick} className="mt-4">
                    {viewPreference === 'myInscriptions' ? 'Próximo día con inscripciones' : 'Próximo día con partidas'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        )}

        {((selectedDate || filterByGratisOnly || filterByLiberadasOnly || filterByPuntosOnly || matchIdFilter || matchShareCode)) && displayedMatches.length > 0 && currentUser && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] justify-center gap-6">
            {displayedMatches.map((activity) => {
               if ('isEventCard' in activity && activity.isEventCard) {
                   const isFull = (activity.inscriptionCount ?? 0) >= activity.maxPlayers;
                   return (
                        <Link key={activity.id} href={`/match-day/${activity.id}`}>
                            <div className="border-l-4 border-orange-500 bg-orange-50 rounded-lg p-4 h-full flex flex-col justify-between cursor-pointer hover:bg-orange-100 transition-colors shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div className="flex-grow">
                                        <div className="font-bold text-orange-800 flex items-center">
                                            <PartyPopper className="h-5 w-5 mr-2"/>
                                            {activity.name}
                                        </div>
                                        <p className="text-sm text-muted-foreground font-semibold">
                                            {`${format(new Date(activity.eventDate), "HH:mm'h'")} - ${format(activity.eventEndTime ? new Date(activity.eventEndTime) : addMinutes(new Date(activity.eventDate), 180), "HH:mm'h'")}`}
                                        </p>
                                    </div>
                                    <Badge variant={isFull ? 'secondary' : 'default'} className={cn(isFull ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800")}>
                                        {isFull ? "Completo" : "Plazas Libres"}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-end mt-2">
                                    <div className="text-sm font-medium text-muted-foreground">
                                        {activity.inscriptionCount ?? 0} / {activity.maxPlayers} inscritos
                                    </div>
                                     <Button variant="link" size="sm" className="h-auto p-0 text-orange-600">
                                        Ver Evento
                                        <ArrowRight className="ml-1 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </Link>
                    )
               }
               const match = activity as Match;
               return (
                <div key={match.id} className="w-full max-w-sm mx-auto">
                    <MatchCard
                        match={match}
                        currentUser={currentUser}
                        onBookingSuccess={onBookingSuccess}
                        onMatchUpdate={handleLocalMatchBookingUpdate}
                        matchShareCode={matchShareCode}
                        showPointsBonus={showPointsBonus}
                    />
                </div>
               )
            })}
          </div>
        )}
      </div>

      {canLoadMore && displayedMatches.length > 0 && (
          <div ref={loadMoreMatchesRef} className="h-10 flex justify-center items-center text-muted-foreground mt-6">
            {isLoadingMore && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          </div>
        )}
    </div>
  );
};

export default MatchDisplay;
