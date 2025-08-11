

"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, SearchX, CalendarDays, Plus, CheckCircle, Eye, Users, Sparkles, ArrowRight } from 'lucide-react';
import ClassCard from '@/components/class/ClassCard';
import { isProposalSlot as checkIsProposalSlot } from '@/lib/mockDataSources/classProposals';
import PageSkeleton from '@/components/layout/PageSkeleton';
import { fetchTimeSlots, getMockCurrentUser, isSlotEffectivelyCompleted, findAvailableCourt, isSlotGratisAndAvailable, fetchMatchDayEventsForDate, getUserActivityStatusForDay, getMockClubs } from '@/lib/mockData';
import type { TimeSlot, User, Booking, MatchPadelLevel, SortOption, Instructor, MatchDayEvent, UserActivityStatusForDay, ViewPreference } from '@/types';
import { format, isSameDay, addDays, startOfDay, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn, isUserLevelCompatibleWithActivity } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';


interface ClassDisplayProps {
  currentUser: User | null;
  onBookingSuccess: () => void;
  filterByClubId?: string | null;
  filterByGratisOnly?: boolean;
  filterByLiberadasOnly?: boolean;
  onDeactivateGratisFilter?: () => void;
  // Shared filter props
  selectedDate: Date | null;
  onDateChange: (date: Date) => void;
  timeSlotFilter: string;
  selectedLevelsSheet: MatchPadelLevel[];
  sortBy: SortOption;
  filterAlsoConfirmedClasses: boolean;
  filterByFavoriteInstructors: boolean;
  viewPreference: ViewPreference;
  proposalView: 'join' | 'propose';
  refreshKey: number;
  allClasses: TimeSlot[];
  isLoading: boolean;
  dateStripIndicators: Record<string, UserActivityStatusForDay>;
  dateStripDates: Date[];
  onViewPrefChange: (date: Date, pref: ViewPreference, type: 'class' | 'match' | 'event', eventId?: string) => void;
  showPointsBonus: boolean; // New prop for visibility
}

const ITEMS_PER_PAGE = 9;

const ClassDisplay: React.FC<ClassDisplayProps> = ({
    currentUser, onBookingSuccess, filterByClubId, filterByGratisOnly, filterByLiberadasOnly, onDeactivateGratisFilter,
    selectedDate, onDateChange, timeSlotFilter, selectedLevelsSheet: selectedLevelsFromParent, sortBy,
    filterAlsoConfirmedClasses, filterByFavoriteInstructors, viewPreference, proposalView, refreshKey,
    allClasses, isLoading, dateStripIndicators, dateStripDates, onViewPrefChange, showPointsBonus
}) => {
    const { toast } = useToast();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [filteredClasses, setFilteredClasses] = useState<TimeSlot[]>([]);
    const [displayedClasses, setDisplayedClasses] = useState<TimeSlot[]>([]);
    
    const [currentPage, setCurrentPage] = useState(1);
    const [canLoadMore, setCanLoadMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const loadMoreRef = useRef<HTMLDivElement>(null);
    
    const selectedLevel = searchParams.get('level') as MatchPadelLevel | 'all' || 'all';

    const calculateOptionOccupancy = (slot: TimeSlot): number => {
        if (!slot.bookedPlayers || slot.bookedPlayers.length === 0) return 0;
        const maxOccupancy = Math.max(0, ...slot.bookedPlayers.map(p => {
             const groupBookings = slot.bookedPlayers.filter(bp => bp.groupSize === p.groupSize);
             return groupBookings.length / p.groupSize;
        }));
        return maxOccupancy;
    };

    const applyClassFilters = useCallback((classesToFilter: TimeSlot[]) => {
        if (!currentUser) {
            setFilteredClasses([]);
            return;
        }

        let workingClasses = [...classesToFilter];
        
        if (filterByLiberadasOnly) {
            workingClasses = workingClasses.filter(cls => {
                const isLiberada = (cls.status === 'confirmed' || cls.status === 'confirmed_private') && isSlotGratisAndAvailable(cls);
                if (!isLiberada) return false;
                return isUserLevelCompatibleWithActivity(cls.level, currentUser?.level);
            });
        } else if (filterByGratisOnly) {
            workingClasses = workingClasses.filter(cls => {
                const isGratis = isSlotGratisAndAvailable(cls);
                if (!isGratis) return false;
                return isUserLevelCompatibleWithActivity(cls.level, currentUser?.level);
            });
        } else {
             if (selectedDate) {
                 workingClasses = workingClasses.filter(cls =>
                    isSameDay(new Date(cls.startTime), selectedDate)
                );
            } else {
                 setFilteredClasses([]);
                 return;
            }
            
            if (timeSlotFilter !== 'all') {
                workingClasses = workingClasses.filter(cls => {
                    const classHour = new Date(cls.startTime).getHours();
                    if (timeSlotFilter === 'morning') return classHour >= 8 && classHour < 13;
                    if (timeSlotFilter === 'midday') return classHour >= 13 && classHour < 18;
                    if (timeSlotFilter === 'evening') return classHour >= 18 && classHour <= 22;
                    return true;
                });
            }
            
            if (filterByFavoriteInstructors && currentUser?.favoriteInstructorIds?.length > 0) {
                const favoriteInstructorIds = currentUser.favoriteInstructorIds;
                workingClasses = workingClasses.filter(cls => favoriteInstructorIds.includes(cls.instructorId || ''));
            }

            if (selectedLevel && selectedLevel !== 'all') {
                const club = getMockClubs().find(c => c.id === filterByClubId);
                const range = club?.levelRanges?.find(r => r.name === selectedLevel);
                
                workingClasses = workingClasses.filter(cls => {
                    if (cls.level === 'abierto') {
                        return selectedLevel === 'abierto';
                    }
                    if (range && typeof cls.level === 'object' && 'min' in cls.level && 'max' in cls.level) {
                        return parseFloat(cls.level.min) >= parseFloat(range.min) && parseFloat(cls.level.max) <= parseFloat(range.max);
                    }
                    return false;
                });
            }
            
            if (viewPreference === 'myInscriptions') {
                workingClasses = workingClasses.filter(cls => 
                    (cls.bookedPlayers || []).some(p => p.userId === currentUser.id) && !isSlotEffectivelyCompleted(cls).completed
                );
            } else if (viewPreference === 'myConfirmed') {
                workingClasses = workingClasses.filter(cls => {
                    const isUserInSlot = (cls.bookedPlayers || []).some(p => p.userId === currentUser.id);
                    if (!isUserInSlot) return false;
                    
                    const { completed } = isSlotEffectivelyCompleted(cls);
                    return completed;
                });
            } else if (viewPreference === 'withPlayers') {
                workingClasses = workingClasses.filter(cls => {
                    const hasPlayers = (cls.bookedPlayers || []).length > 0;
                    const { completed } = isSlotEffectivelyCompleted(cls);
                    return hasPlayers && !completed;
                });
            } else if (viewPreference === 'completed') {
                workingClasses = workingClasses.filter(cls => {
                    const { completed } = isSlotEffectivelyCompleted(cls);
                    return completed;
                });
            } else { 
                 if (!filterAlsoConfirmedClasses) {
                    workingClasses = workingClasses.filter(cls => {
                         const { completed } = isSlotEffectivelyCompleted(cls);
                         if (completed) {
                             return isSlotGratisAndAvailable(cls);
                         }
                         return true;
                    });
                }
            }
        }
        
        // Sorting logic with user's bookings first
        workingClasses.sort((a, b) => {
            const isUserInA = (a.bookedPlayers || []).some(p => p.userId === currentUser.id);
            const isUserInB = (b.bookedPlayers || []).some(p => p.userId === currentUser.id);
            if (isUserInA && !isUserInB) return -1;
            if (!isUserInA && isUserInB) return 1;

            const aHasPlayers = (a.bookedPlayers || []).length > 0;
            const bHasPlayers = (b.bookedPlayers || []).length > 0;
            if (aHasPlayers && !bHasPlayers) return -1;
            if (!bHasPlayers && aHasPlayers) return 1;

            const dateA = new Date(a.startTime).getTime();
            const dateB = new Date(b.startTime).getTime();
            if (dateA !== dateB) return dateA - dateB;

            const aOccupancy = calculateOptionOccupancy(a);
            const bOccupancy = calculateOptionOccupancy(b);
            return bOccupancy - aOccupancy;
        });


        setFilteredClasses(workingClasses);
    }, [filterByGratisOnly, filterByLiberadasOnly, selectedDate, timeSlotFilter, selectedLevel, filterByFavoriteInstructors, filterAlsoConfirmedClasses, sortBy, currentUser, viewPreference, filterByClubId]);
    
    useEffect(() => {
        if (!isLoading) {
            applyClassFilters(allClasses);
        }
    }, [applyClassFilters, refreshKey, selectedDate, selectedLevel, allClasses, isLoading, viewPreference, timeSlotFilter, filterByFavoriteInstructors, filterAlsoConfirmedClasses]);

     // Effect to reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filteredClasses]);

    // Effect to update the displayed list based on pagination
    useEffect(() => {
        setDisplayedClasses(filteredClasses.slice(0, ITEMS_PER_PAGE * currentPage));
        setCanLoadMore(filteredClasses.length > ITEMS_PER_PAGE * currentPage);
    }, [filteredClasses, currentPage]);

    const handleClassBookingSuccess = () => {
        onBookingSuccess();
    };
    
    const handleLoadMore = useCallback(() => {
        if (!canLoadMore || isLoadingMore) return;
        setIsLoadingMore(true);
        setTimeout(() => {
            const nextPage = currentPage + 1;
            setDisplayedClasses(prev => [...prev, ...filteredClasses.slice(prev.length, prev.length + ITEMS_PER_PAGE)]);
            setCurrentPage(nextPage);
            setIsLoadingMore(false);
        }, 300);
    }, [canLoadMore, isLoadingMore, currentPage, filteredClasses]);
    
    useEffect(() => {
        if (!canLoadMore || isLoadingMore || !loadMoreRef.current) return;
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) handleLoadMore();
        }, { threshold: 0.1 });
        const currentRef = loadMoreRef.current;
        if (currentRef) observer.observe(currentRef);
        return () => { if (currentRef) observer.unobserve(currentRef); observer.disconnect(); };
    }, [canLoadMore, isLoadingMore, handleLoadMore]);
    
    if (isLoading) return <div className="space-y-4"> <Skeleton className="h-10 w-full" /> <div className="grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-6"><Skeleton className="h-96 w-full" /><Skeleton className="h-96 w-full" /><Skeleton className="h-96 w-full" /></div></div>

    const handleBackToAvailable = () => {
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.set('viewPref', 'normal');
        router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
    };

    const findNextAvailableDay = (): Date | null => {
        const today = startOfDay(new Date());
        let currentDateToCheck = selectedDate ? addDays(selectedDate, 1) : today;
        const limit = addDays(today, 30); // Search up to 30 days in the future

        while (currentDateToCheck <= limit) {
            const hasClasses = allClasses.some(cls => isSameDay(new Date(cls.startTime), currentDateToCheck));
            if (hasClasses) {
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
                title: "No hay clases futuras",
                description: "No se encontraron clases disponibles en los próximos 30 días.",
            });
        }
    };


    return (
        <div>
            {!filterByGratisOnly && !filterByLiberadasOnly && (
                <div className="relative z-10">
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
                                        onClick={() => onDateChange(day)}
                                    >
                                        <span className="font-bold text-[10px] uppercase">{format(day, "EEE", { locale: es }).slice(0, 3)}</span>
                                        <span className="text-sm font-bold">{format(day, "d", { locale: es })}</span>
                                        <span className="text-[9px] text-muted-foreground capitalize -mt-0.5">{format(day, "MMM", { locale: es }).slice(0,3)}</span>
                                    </Button>

                                    {/* INDICATOR SECTION */}
                                    <div className="h-10 w-8 flex flex-col items-center justify-center relative space-y-0.5">
                                        <TooltipProvider delayDuration={150}>
                                            {indicators.activityStatus === 'confirmed' && (
                                                <Tooltip><TooltipTrigger asChild><button onClick={() => onViewPrefChange(day, 'myConfirmed', indicators.activityType || 'class')} className="h-6 w-6 flex items-center justify-center bg-destructive text-destructive-foreground rounded-md font-bold text-xs leading-none cursor-pointer hover:scale-110 transition-transform">R</button></TooltipTrigger><TooltipContent><p>Ver mis reservas</p></TooltipContent></Tooltip>
                                            )}
                                            {indicators.activityStatus === 'inscribed' && (
                                                 <Tooltip><TooltipTrigger asChild><button onClick={() => onViewPrefChange(day, 'myInscriptions', indicators.activityType || 'class', indicators.eventId)} className="h-6 w-6 flex items-center justify-center bg-blue-500 text-white rounded-md font-bold text-xs leading-none cursor-pointer hover:scale-110 transition-transform">I</button></TooltipTrigger><TooltipContent><p>Ver mis inscripciones</p></TooltipContent></Tooltip>
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
            )}
            
            <div className="mt-2">
                
                {((!selectedDate && !filterByGratisOnly && !filterByLiberadasOnly)) && (
                    <div className="text-center py-16">
                        <CalendarDays className="h-20 w-20 text-muted-foreground mx-auto mb-6 opacity-50" />
                        <h2 className="text-2xl font-semibold text-foreground mb-3">Selecciona una fecha</h2>
                        <p className="text-muted-foreground max-w-md mx-auto">Elige un día para ver las clases disponibles.</p>
                    </div>
                )}
                {((selectedDate || filterByGratisOnly || filterByLiberadasOnly)) && displayedClasses.length === 0 && !isLoading && (
                    <div className="text-center py-16">
                        <SearchX className="h-20 w-20 text-muted-foreground mx-auto mb-6 opacity-50" />
                         <h2 className="text-2xl font-semibold text-foreground mb-3">
                            {viewPreference === 'myInscriptions' ? "No tienes inscripciones" : 
                             viewPreference === 'myConfirmed' ? "Aquí no tienes reservas hechas" : 
                             viewPreference === 'completed' ? "No hay clases completas" : 
                             "No se encontraron clases"}
                        </h2>
                        <p className="text-muted-foreground max-w-md mx-auto">
                             {viewPreference === 'myInscriptions' ? "No estás apuntado/a a ninguna clase para este día." :
                             viewPreference === 'myConfirmed' ? "No tienes clases confirmadas para este día." :
                             viewPreference === 'completed' ? "No hay clases completas que mostrar para este día." :
                             filterByLiberadasOnly ? "No hay plazas liberadas en clases confirmadas por ahora." : 
                             "Prueba a cambiar las fechas o ajusta los filtros."}
                        </p>
                         {(viewPreference === 'myInscriptions' || viewPreference === 'myConfirmed' || viewPreference === 'completed') && (
                            <Button onClick={handleBackToAvailable} className="mt-4">
                                <Eye className="mr-2 h-4 w-4"/> Ver Disponibles
                            </Button>
                        )}
                        {viewPreference === 'normal' && (
                            <Button onClick={handleNextAvailableClick} className="mt-4">
                                Próximo día con clases <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        )}
                    </div>
                )}
                {displayedClasses.length > 0 && currentUser && (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] justify-center gap-6">
                        {displayedClasses.map((classData) => (
                            <div key={classData.id} className="w-full max-w-sm mx-auto">
                                <ClassCard classData={classData} currentUser={currentUser} onBookingSuccess={handleClassBookingSuccess} showPointsBonus={showPointsBonus} />
                            </div>
                        ))}
                    </div>
                )}
                {canLoadMore && displayedClasses.length > 0 && (
                    <div ref={loadMoreRef} className="h-10 flex justify-center items-center text-muted-foreground mt-6">
                        {isLoadingMore && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ClassDisplay;


