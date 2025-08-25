// src/components/classfinder/EventsDisplay.tsx
"use client";

import React, { useMemo } from 'react';
import type { Match, TimeSlot, User } from '@/types';
import { isSameDay } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import MatchCard from '@/components/match/MatchCard';
import ClassCard from '@/components/class/ClassCard';

interface EventsDisplayProps {
  currentUser: User | null;
  selectedDate: Date | null;
  allMatches: Match[];
  allClasses: TimeSlot[];
  isLoading: boolean;
}

const EventsDisplay: React.FC<EventsDisplayProps> = ({ currentUser, selectedDate, allMatches, allClasses, isLoading }) => {
  const mixedItems = useMemo(() => {
    if (!selectedDate || !currentUser) return [] as Array<{ type: 'match' | 'class'; data: Match | TimeSlot; time: number }>;

    const matchesWithPlayers = (allMatches || [])
      .filter(m => isSameDay(new Date(m.startTime), selectedDate))
      .filter(m => (m.bookedPlayers || []).length > 0)
      .map(m => ({ type: 'match' as const, data: m, time: new Date(m.startTime).getTime() }));

    const classesWithPlayers = (allClasses || [])
      .filter(c => isSameDay(new Date(c.startTime), selectedDate))
      .filter(c => (c.bookedPlayers || []).length > 0)
      .map(c => ({ type: 'class' as const, data: c, time: new Date(c.startTime).getTime() }));

    return [...matchesWithPlayers, ...classesWithPlayers].sort((a, b) => a.time - b.time);
  }, [allMatches, allClasses, selectedDate, currentUser]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!selectedDate) return null;

  if (mixedItems.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-2xl font-semibold text-foreground mb-3">No hay actividades con inscritos</p>
        <p className="text-muted-foreground max-w-md mx-auto">Prueba con otro día.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] justify-center gap-6">
      {mixedItems.map(item => (
        <div key={(item.data as any).id} className="w-full max-w-sm mx-auto">
          {item.type === 'match' ? (
            <MatchCard match={item.data as Match} currentUser={currentUser} onBookingSuccess={() => {}} onMatchUpdate={() => {}} showPointsBonus={false} />
          ) : (
            <ClassCard classData={item.data as TimeSlot} currentUser={currentUser} onBookingSuccess={() => {}} showPointsBonus={false} />
          )}
        </div>
      ))}
    </div>
  );
};

export default EventsDisplay;
