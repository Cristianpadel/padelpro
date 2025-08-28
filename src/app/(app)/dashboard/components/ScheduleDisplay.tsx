"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { TimeSlot, User, Booking, MatchPadelLevel, Instructor, ClassPadelLevel, NumericMatchPadelLevel } from '@/types';
import { matchPadelLevels } from '@/types';
import TimeSlotCard from './TimeSlotCard';
import InstructorPanel from '@/app/(app)/instructor/components/InstructorPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchTimeSlots, fetchInstructors, updateUserFavoriteInstructors, isSlotEffectivelyCompleted, getMockInstructors } from '@/lib/mockData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SlidersHorizontal, Loader2, Heart, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import ManageFavoriteInstructorsDialog from '@/components/schedule/ManageFavoriteInstructorsDialog';
import OpenClassesDialog from '@/components/schedule/OpenClassesDialog';

interface ScheduleDisplayProps {
  currentUser: User;
  onBookingSuccess: (newBooking: Booking, updatedSlot: TimeSlot) => void;
}

const ITEMS_PER_PAGE = 9;

type LocalSortOption = 'date' | 'price' | 'active';

const ScheduleDisplay: React.FC<ScheduleDisplayProps> = ({ currentUser: initialCurrentUser, onBookingSuccess }) => {
  const [allTimeSlots, setAllTimeSlots] = useState<TimeSlot[]>([]);
  const [displayedTimeSlots, setDisplayedTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [canLoadMore, setCanLoadMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentUser, setCurrentUser] = useState<User>(initialCurrentUser);

  const [availableInstructors, setAvailableInstructors] = useState<Instructor[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<MatchPadelLevel | 'all'>("all");
  const [filterByFavoriteInstructors, setFilterByFavoriteInstructors] = useState(false);
  const [sortBy, setSortBy] = useState<LocalSortOption>('date');
  const [isManageFavoritesDialogOpen, setIsManageFavoritesDialogOpen] = useState(false);
  const [isOpenClassesDialogOpen, setIsOpenClassesDialogOpen] = useState(false);
  const [selectedGroupSizeFilter, setSelectedGroupSizeFilter] = useState<'all' | 1 | 2 | 3 | 4>('all');

  const isInstructor = !!getMockInstructors().find((inst: Instructor) => inst.id === currentUser.id);

  useEffect(() => {
    const loadAvailableInstructors = async () => {
      const instructors = await fetchInstructors();
      setAvailableInstructors(instructors);
    };
    if (!isInstructor) {
      loadAvailableInstructors();
    }
  }, [isInstructor]);

  const applyFiltersAndSort = useCallback((slotsToFilter: TimeSlot[]): TimeSlot[] => {
    let filteredSlots = [...slotsToFilter];

    if (!isInstructor) {
      if (selectedLevel !== 'all') {
        filteredSlots = filteredSlots.filter(slot => {
          const lvl = slot.level as ClassPadelLevel | undefined;
          if (!lvl) return false;
          if (lvl === 'abierto') return true;
          const sel = selectedLevel as NumericMatchPadelLevel;
          if (typeof lvl === 'object' && 'min' in lvl && 'max' in lvl) {
            const selNum = parseFloat(sel);
            return selNum >= parseFloat(lvl.min) && selNum <= parseFloat(lvl.max);
          }
          return false;
        });
      }
      if (filterByFavoriteInstructors && currentUser.favoriteInstructorIds && currentUser.favoriteInstructorIds.length > 0) {
        const favoriteInstructorNames = availableInstructors
          .filter(inst => currentUser.favoriteInstructorIds!.includes(inst.id))
          .map(inst => inst.name);
        filteredSlots = filteredSlots.filter(slot => favoriteInstructorNames.includes(slot.instructorName));
      }
      if (selectedGroupSizeFilter !== 'all') {
        filteredSlots = filteredSlots.filter(slot => {
          const { completed: isCompleted, size: completedSize } = isSlotEffectivelyCompleted(slot);
          if (isCompleted && completedSize !== selectedGroupSizeFilter) {
            return false;
          }
          const bookedForThisOption = (slot.bookedPlayers || []).filter(p => p.groupSize === selectedGroupSizeFilter);
          return bookedForThisOption.length < selectedGroupSizeFilter;
        });
      }

    } else {
      const instructorData = getMockInstructors().find((inst: Instructor) => inst.id === currentUser.id);
      if (instructorData) {
        filteredSlots = filteredSlots.filter(slot => slot.instructorName === instructorData.name);
      } else {
        filteredSlots = [];
      }
    }

    let sortedSlots = [...filteredSlots];
    if (sortBy === 'date') {
      sortedSlots.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    } else if (sortBy === 'price') {
      sortedSlots.sort((a, b) => (a.totalPrice || 0) - (b.totalPrice || 0));
    } else if (sortBy === 'active') {
      sortedSlots.sort((a, b) => {
        const aIsFull = isSlotEffectivelyCompleted(a).completed;
        const bIsFull = isSlotEffectivelyCompleted(b).completed;
        if (aIsFull && !bIsFull) return 1;
        if (!aIsFull && bIsFull) return -1;
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      });
    }
    return sortedSlots;
  }, [currentUser, isInstructor, selectedLevel, sortBy, filterByFavoriteInstructors, availableInstructors, selectedGroupSizeFilter]);


  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const now = new Date();
      let fetchedSlots = (await fetchTimeSlots()).filter(slot => new Date(slot.endTime) > now);
      setAllTimeSlots(fetchedSlots);

      const processedSlots = applyFiltersAndSort(fetchedSlots);
      setDisplayedTimeSlots(processedSlots.slice(0, ITEMS_PER_PAGE));
      setCanLoadMore(processedSlots.length > ITEMS_PER_PAGE);
      setCurrentPage(1);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch time slots:", err);
      setError("No se pudieron cargar las clases disponibles.");
    } finally {
      setLoading(false);
    }
  }, [applyFiltersAndSort]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (!loading) {
      const processedSlots = applyFiltersAndSort(allTimeSlots);
      setDisplayedTimeSlots(processedSlots.slice(0, currentPage * ITEMS_PER_PAGE));
      setCanLoadMore(processedSlots.length > currentPage * ITEMS_PER_PAGE);
    }
  }, [selectedLevel, sortBy, filterByFavoriteInstructors, allTimeSlots, loading, applyFiltersAndSort, currentPage, currentUser.favoriteInstructorIds, selectedGroupSizeFilter]);


  const handleLoadMore = () => {
    if (!canLoadMore || isLoadingMore) return;

    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    const processedSlots = applyFiltersAndSort(allTimeSlots);
    const newSlots = processedSlots.slice(0, nextPage * ITEMS_PER_PAGE);

    setDisplayedTimeSlots(newSlots);
    setCurrentPage(nextPage);
    setCanLoadMore(processedSlots.length > newSlots.length);
    setIsLoadingMore(false);
  };


  const handleLocalBookingUpdate = (newBooking: Booking, updatedSlot: TimeSlot) => {
    if (!newBooking || !newBooking.activityId) {
      console.warn("handleLocalBookingUpdate called with invalid newBooking:", newBooking);
      return;
    }
    setAllTimeSlots(prevSlots => {
      return prevSlots.map(slot =>
        slot.id === updatedSlot.id ? updatedSlot : slot
      );
    });
    onBookingSuccess(newBooking, updatedSlot);
  };


  const handleApplyFavoriteInstructors = (favoriteIds: string[]) => {
    setCurrentUser(prevUser => ({ ...prevUser, favoriteInstructorIds: favoriteIds }));
    setFilterByFavoriteInstructors(favoriteIds.length > 0);
    setIsManageFavoritesDialogOpen(false);
  };


  if (loading && !isInstructor) {
    return (
      <div className="space-y-8">
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
          <Skeleton className="h-9 w-32 rounded-full" />
          <Skeleton className="h-9 w-32 rounded-full" />
          <Skeleton className="h-9 w-40 rounded-full" />
          <Skeleton className="h-9 w-48 rounded-full" />
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-24 rounded-full" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
            <Card key={i} className="w-full flex flex-col overflow-hidden">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="flex flex-col items-start text-base font-normal px-1.5">
                  <div className="flex items-center justify-between w-full">
                    <Skeleton className="h-5 w-3/5" />
                    <Skeleton className="ml-auto h-5 w-16" />
                  </div>
                  <Skeleton className="h-4 w-1/2 mt-1" />
                </CardTitle>
                <div className="flex items-center space-x-2 pt-1 text-xs px-1.5">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex flex-col space-y-1">
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="ml-auto h-8 w-8 rounded-full" />
                </div>
              </CardHeader>
              <CardContent className="flex-grow pt-2 pb-3 px-1.5 grid grid-cols-2 gap-1.5">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="border rounded-md p-1.5 flex flex-col items-center text-center relative min-h-[130px] justify-between">
                    <Skeleton className="h-4 w-12 mt-1" />
                    <div className={cn(
                      "flex flex-wrap justify-center items-start gap-x-0.5 gap-y-0.5 mt-0.5 mb-0.5 min-h-[60px]",
                    )}>
                      {[...Array(j + 1)].map((_, k) => (
                        <Skeleton key={k} className="h-12 w-12 rounded-full" />
                      ))}
                    </div>
                    <Skeleton className="h-3 w-16 mb-1" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  if (loading && isInstructor) {
    return (
      <Card>
        <CardHeader> <CardTitle><Skeleton className="h-6 w-48" /></CardTitle> </CardHeader>
        <CardContent> <Skeleton className="h-64 w-full" /></CardContent>
      </Card>
    )
  }


  if (error) {
    return <div className="text-destructive text-center p-6 bg-destructive/10 rounded-md">{error}</div>;
  }

  const groupSizeOptions: {value: 'all' | 1 | 2 | 3 | 4, label: string}[] = [
    { value: 'all', label: 'Todas' },
    { value: 1, label: 'Clase de 1p' },
    { value: 2, label: 'Clase de 2p' },
    { value: 3, label: 'Clase de 3p' },
    { value: 4, label: 'Clase de 4p' },
  ];

  return (
    <div className="space-y-8">
      {isInstructor && (
        <InstructorPanel
          instructor={currentUser as Instructor}
        />
      )}
      {!isInstructor && (
        <>
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-wrap items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
              <Select
                value={selectedLevel}
                onValueChange={(value: MatchPadelLevel | 'all') => setSelectedLevel(value)}
              >
                <SelectTrigger className="w-auto rounded-full bg-primary text-primary-foreground border-transparent px-4 py-1.5 text-sm h-auto hover:bg-primary/90 focus:ring-ring focus:ring-offset-0 focus:ring-2 font-semibold">
                  <SelectValue placeholder="Nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Niveles</SelectItem>
                  {matchPadelLevels.map(lvl => (
                    <SelectItem key={lvl} value={lvl} className="capitalize">
                      {lvl === 'abierto' ? 'Nivel Abierto' : `Nivel ${lvl}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={sortBy}
                onValueChange={(value: LocalSortOption) => setSortBy(value)}
              >
                <SelectTrigger className="w-auto rounded-full bg-primary text-primary-foreground border-transparent px-4 py-1.5 text-sm h-auto hover:bg-primary/90 focus:ring-ring focus:ring-offset-0 focus:ring-2 font-semibold">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Fecha</SelectItem>
                  <SelectItem value="active">Disponibilidad</SelectItem>
                  <SelectItem value="price">Precio</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => setIsManageFavoritesDialogOpen(true)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm h-auto font-semibold",
                  filterByFavoriteInstructors
                    ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                    : "bg-background text-foreground border-border hover:bg-primary/10"
                )}
                aria-pressed={filterByFavoriteInstructors}
              >
                <Heart className={cn("mr-1.5 h-4 w-4", filterByFavoriteInstructors && "fill-current")} />
                Instructores
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsOpenClassesDialogOpen(true)}
                className="rounded-full px-4 py-1.5 text-sm h-auto bg-background text-foreground border-border hover:bg-primary/10 font-semibold"
              >
                <CheckCircle className="mr-1.5 h-4 w-4 text-green-600" />
                Ver Clases Confirmadas
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-muted-foreground mr-1">Plazas:</span>
              {groupSizeOptions.map(option => (
                <Button
                  key={option.value}
                  variant={selectedGroupSizeFilter === option.value ? "default" : "outline"}
                  onClick={() => setSelectedGroupSizeFilter(option.value)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs h-auto font-medium",
                    selectedGroupSizeFilter === option.value
                      ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                      : "bg-background text-foreground border-border hover:bg-primary/10"
                  )}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {displayedTimeSlots.length === 0 ? (
            <p className="text-muted-foreground text-center py-8 italic">No hay clases disponibles con los filtros seleccionados.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedTimeSlots.map((slot) => (
                <TimeSlotCard key={slot.id} slot={slot} currentUser={currentUser} onBookingSuccess={handleLocalBookingUpdate} />
              ))}
            </div>
          )}
          {canLoadMore && !isLoadingMore && (
            <div className="flex justify-center mt-8">
              <Button onClick={handleLoadMore} variant="outline">
                Cargar Más Clases
              </Button>
            </div>
          )}
          {isLoadingMore && (
            <div className="flex justify-center mt-8">
              <Button variant="outline" disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cargando...
              </Button>
            </div>
          )}
        </>
      )}
      <ManageFavoriteInstructorsDialog
        isOpen={isManageFavoritesDialogOpen}
        onOpenChange={setIsManageFavoritesDialogOpen}
        currentUser={currentUser}
        onApplyFavorites={handleApplyFavoriteInstructors}
      />
      <OpenClassesDialog
        isOpen={isOpenClassesDialogOpen}
        onOpenChange={setIsOpenClassesDialogOpen}
        allTimeSlots={allTimeSlots}
        currentUser={currentUser}
      />
    </div>
  );
};

export default ScheduleDisplay;