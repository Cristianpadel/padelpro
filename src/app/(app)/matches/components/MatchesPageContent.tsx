"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { Match, User, Club } from '@/types';
import { addDays, format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { getMockClubs, fetchMatches, createMatchesForDay } from '@/lib/mockData';
import MatchDisplay from '@/components/classfinder/MatchDisplay';
import PageSkeleton from '@/components/layout/PageSkeleton';
import { useActivityFilters } from '@/hooks/useActivityFilters';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Plus } from 'lucide-react';

interface Props {
  currentUser: User | null;
}

export default function MatchesPageContent({ currentUser }: Props) {
  const activityFilters = useActivityFilters(currentUser, () => {});
  const { selectedDate, handleDateChange, dateStripDates, dateStripIndicators, refreshKey, showPointsBonus, viewPreference, ...rest } = activityFilters;

  const [currentClub, setCurrentClub] = useState<Club | null>(null);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    const clubs = await getMockClubs();
    const club = clubs[0];
    setCurrentClub(club);
    let combined: Match[] = [];
    if (club) {
      for (let i = 0; i < 7; i++) combined = [...combined, ...createMatchesForDay(club, addDays(new Date(), i))];
      const fetched = await fetchMatches(club.id);
      combined = [...combined, ...fetched];
    }
    const unique = Array.from(new Map(combined.map(m => [m.id, m])).values());
    setAllMatches(unique);
    setIsLoading(false);
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <main className="flex-1 overflow-y-auto px-4 md:px-6 pb-6 space-y-4 pt-4">
        <div className="relative z-10 pt-2">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex space-x-2 py-1">
              {dateStripDates.map((day) => {
                const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                const dateKey = format(day, 'yyyy-MM-dd');
                const indicators = (dateStripIndicators as any)[dateKey] || { activityStatus: 'none', hasEvent: false, anticipationPoints: 0, activityTypes: [] };
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
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "h-auto px-1.5 py-1 flex flex-col items-center justify-center leading-tight shadow-sm w-10",
                        isSameDay(day, new Date()) && !isSelected && "border-primary text-primary font-semibold",
                        isSelected && "shadow-md"
                      )}
                      onClick={() => handleDateChange(day)}
                    >
                      <span className="font-bold text-[10px] uppercase">{format(day, "EEE", { locale: es }).slice(0, 3)}</span>
                      <span className="text-sm font-bold">{format(day, "d", { locale: es })}</span>
                      <span className="text-[9px] text-muted-foreground capitalize -mt-0.5">{format(day, "MMM", { locale: es }).slice(0, 3)}</span>
                    </Button>
                    <div className="h-10 w-8 flex flex-col items-center justify-center relative space-y-0.5">
                      <TooltipProvider delayDuration={150}>
                        {indicators.activityStatus === 'confirmed' && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => activityFilters.handleViewPrefChange('myConfirmed', 'partidas', day)}
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
                              <button
                                onClick={() => activityFilters.handleViewPrefChange('myInscriptions', 'partidas', day)}
                                className="h-6 w-6 flex items-center justify-center bg-blue-500 text-white rounded-md font-bold text-xs leading-none cursor-pointer hover:scale-110 transition-transform"
                              >
                                I
                              </button>
                            </TooltipTrigger>
                            <TooltipContent><p>Ver mis inscripciones</p></TooltipContent>
                          </Tooltip>
                        )}
                        {indicators.hasEvent && indicators.activityStatus === 'none' && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link href={`/match-day/${indicators.eventId}`} passHref>
                                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md bg-primary/10 hover:bg-primary/20 animate-pulse-blue border border-primary/50">
                                  <Plus className="h-4 w-4 text-primary" />
                                </Button>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent><p>¡Apúntate al Match-Day!</p></TooltipContent>
                          </Tooltip>
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
        <MatchDisplay
          {...rest}
          currentUser={currentUser}
          onBookingSuccess={() => load()}
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          viewPreference={viewPreference}
          refreshKey={refreshKey}
          allMatches={allMatches}
          isLoading={false}
          matchDayEvents={[]}
          dateStripIndicators={dateStripIndicators}
          dateStripDates={dateStripDates}
          onViewPrefChange={() => {}}
          sortBy={'time'}
          filterAlsoConfirmedMatches={false}
          proposalView={'join'}
          showPointsBonus={showPointsBonus}
          allClasses={[]}
          excludeFixedMatches={true}
        />
      </main>
    </div>
  );
}
