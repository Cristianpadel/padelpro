

"use client";

import { useState, useEffect, useCallback, useTransition, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { startOfDay, format, isSameDay, addDays, differenceInDays } from 'date-fns';
import type { User, MatchPadelLevel, TimeOfDayFilterType, MatchDayEvent, UserActivityStatusForDay, ViewPreference } from '@/types';
import { updateUserFavoriteInstructors, getUserActivityStatusForDay, fetchMatchDayEventsForDate } from '@/lib/mockData';

export function useActivityFilters(
  currentUser: User | null,
  onCurrentUserUpdate: (newFavoriteIds: string[]) => void
) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [refreshKey, setRefreshKey] = useState(0); // Internal refresh trigger

  // --- Filter State (driven by URL params) ---
  const timeSlotFilter = (searchParams.get('time') as TimeOfDayFilterType) || 'all';
  const selectedLevel = (searchParams.get('level') as MatchPadelLevel | 'all') || 'all';
  const filterByFavorites = searchParams.get('favorites') === 'true';
  const viewPreference = (searchParams.get('viewPref') as ViewPreference) || 'normal';
  const matchShareCode = searchParams.get('code');
  const matchIdFilter = searchParams.get('matchId');
  const filterByGratisOnly = searchParams.get('filter') === 'gratis';
  const filterByLiberadasOnly = searchParams.get('filter') === 'liberadas';
  const filterByPuntosOnly = searchParams.get('filter') === 'puntos';
  const showPointsBonus = searchParams.get('showPoints') === 'true';


  // --- Local State ---
  const activeView = (searchParams.get('view') as 'clases' | 'partidas') || 'clases';
  const selectedDateParam = searchParams.get('date');
  const initialDate = selectedDateParam ? startOfDay(new Date(selectedDateParam)) : startOfDay(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate);
  const [isUpdatingFavorites, startFavoritesTransition] = useTransition();

  // --- NEW: Centralized state for date strip indicators ---
  const [dateStripIndicators, setDateStripIndicators] = useState<Record<string, UserActivityStatusForDay>>({});
  const dateStripDates = useMemo(() => Array.from({ length: 15 }, (_, i) => addDays(startOfDay(new Date()), i)), []);
  
  const triggerRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    const fetchIndicators = async () => {
      if (!currentUser) return;
      const newIndicators: Record<string, UserActivityStatusForDay> = {};
      const clubIdFromParams = searchParams.get('clubId');
      const today = startOfDay(new Date());

      for (const date of dateStripDates) {
        const dateKey = format(date, 'yyyy-MM-dd');
        const statusResult = await getUserActivityStatusForDay(currentUser.id, date);
        const anticipationPoints = differenceInDays(date, today);

        newIndicators[dateKey] = {
          ...statusResult,
          anticipationPoints: Math.max(0, anticipationPoints)
        };
      }
      setDateStripIndicators(newIndicators);
    };

    fetchIndicators();
  }, [currentUser, dateStripDates, searchParams, refreshKey]);


  // --- URL Update Logic ---
  const updateUrlFilter = useCallback((key: string, value: string | boolean | null) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all' && value !== false && value !== 'normal') {
      newSearchParams.set(key, String(value));
    } else {
      newSearchParams.delete(key);
    }
    router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
  }, [searchParams, router, pathname]);
  
  const setUrlFilters = useCallback((filters: Record<string, string | boolean | null>) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    for(const key in filters) {
        const value = filters[key];
        if (value && value !== 'all' && value !== false && value !== 'normal') {
            newSearchParams.set(key, String(value));
        } else {
            newSearchParams.delete(key);
        }
    }
    router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
  },[searchParams, router, pathname]);

  const clearAllFilters = useCallback(() => {
    const newSearchParams = new URLSearchParams();
    newSearchParams.set('view', activeView); // Keep the current view
    router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
  }, [router, pathname, activeView]);

  // --- Event Handlers ---
  const handleTimeFilterChange = (value: TimeOfDayFilterType) => updateUrlFilter('time', value);
  const handleLevelChange = (value: MatchPadelLevel | 'all') => updateUrlFilter('level', value);
  
  const handleDateChange = useCallback((date: Date) => {
      setSelectedDate(startOfDay(date));
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set('date', format(date, 'yyyy-MM-dd'));
      newSearchParams.delete('viewPref'); 
      router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
  }, [router, pathname, searchParams]);
  
  const handleTogglePointsBonus = () => updateUrlFilter('showPoints', !showPointsBonus);

  const handleApplyFavorites = (newFavoriteIds: string[]) => {
    if (currentUser) {
      startFavoritesTransition(async () => {
        await updateUserFavoriteInstructors(currentUser.id, newFavoriteIds);
        onCurrentUserUpdate(newFavoriteIds); // Notify parent to update its state
        updateUrlFilter('favorites', newFavoriteIds.length > 0);
      });
    }
  };
  
  const handleFavoritesClick = (openManagementDialog: () => void) => {
    if (filterByFavorites) {
        updateUrlFilter('favorites', false);
    } else {
        openManagementDialog();
    }
  };
  
  const handleViewPrefChange = useCallback((
    pref: ViewPreference,
    type: 'class' | 'match',
    date?: Date,
  ) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('view', type);
    newSearchParams.set('viewPref', pref);

    if (date) {
        newSearchParams.set('date', format(date, 'yyyy-MM-dd'));
        setSelectedDate(startOfDay(date));
    }
    
    router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
  }, [router, pathname, searchParams]);



  // --- Effects to Sync State with URL/User ---
  useEffect(() => {
    const clubLevelRanges = currentUser && (currentUser as any).club?.levelRanges; // A bit of a hack to check for club data
    if (!currentUser?.level && !clubLevelRanges && !searchParams.has('level')) {
        updateUrlFilter('level', 'all'); // Default to all if no user level and no ranges
    } else if (currentUser?.level && !searchParams.has('level') && clubLevelRanges) {
        const userRange = clubLevelRanges.find((r: any) => parseFloat(currentUser.level!) >= parseFloat(r.min) && parseFloat(currentUser.level!) <= parseFloat(r.max));
        updateUrlFilter('level', userRange ? userRange.name : 'all');
    } else if (!searchParams.has('level')) {
        updateUrlFilter('level', 'all');
    }
  }, [currentUser, searchParams, updateUrlFilter]);


  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (filterByGratisOnly || filterByLiberadasOnly || filterByPuntosOnly || matchIdFilter || matchShareCode) {
      setSelectedDate(null);
    } else if (dateParam) {
        const newDate = startOfDay(new Date(dateParam));
        if (!selectedDate || newDate.getTime() !== selectedDate.getTime()) {
           setSelectedDate(newDate);
        }
    } else {
        if (!selectedDate) {
           setSelectedDate(startOfDay(new Date()));
        }
    }
  }, [searchParams, filterByGratisOnly, filterByLiberadasOnly, filterByPuntosOnly, matchIdFilter, matchShareCode, selectedDate]);


  return {
    activeView,
    selectedDate,
    setSelectedDate,
    timeSlotFilter,
    selectedLevel,
    filterByFavorites,
    viewPreference,
    proposalView: 'join', 
    matchShareCode,
    matchIdFilter,
    filterByGratisOnly,
    filterByLiberadasOnly,
    filterByPuntosOnly, 
    isUpdatingFavorites,
    dateStripIndicators, 
    dateStripDates,      
    refreshKey,
    showPointsBonus, // Expose new state
    handleTimeFilterChange,
    handleLevelChange,
    handleApplyFavorites,
    handleDateChange,
    handleViewPrefChange,
    clearAllFilters,
    triggerRefresh,
    handleTogglePointsBonus, // Expose new handler
    updateUrlFilter, // Expose the raw update function
  };
}
