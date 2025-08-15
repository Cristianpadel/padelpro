// src/lib/mockData.ts
"use client";

// This file is the main public-facing API for mock data interactions.
// It re-exports functions from the individual modules within mockDataSources.
// It also contains composite functions that orchestrate calls to multiple modules.

import { isSameDay, addMinutes } from 'date-fns';
import type { CourtGridBooking, DayOfWeek, PadelCourt } from '@/types';
import * as state from './mockDataSources/state';
import { isMatchBookableWithPoints as isMatchBookableWithPointsFromUtils, getCourtAvailabilityForInterval as getCourtAvailabilityForIntervalFromUtils } from './mockDataSources/utils';


// Re-export all functions from the index
export * from './mockDataSources';
export const getCourtAvailabilityForInterval = getCourtAvailabilityForIntervalFromUtils;
export const isMatchBookableWithPoints = isMatchBookableWithPointsFromUtils;


// --- New composite functions ---

export const fetchCourtBookingsForDay = async (clubId: string, date: Date): Promise<CourtGridBooking[]> => {
    const confirmedSlots = state.getMockTimeSlots().filter(s => s.clubId === clubId && (s.status === 'confirmed' || s.status === 'confirmed_private') && isSameDay(new Date(s.startTime), date));
    const confirmedMatches = state.getMockMatches().filter(m => m.clubId === clubId && (m.status === 'confirmed' || m.status === 'confirmed_private') && isSameDay(new Date(m.startTime), date));
    const matchDayEvents = state.getMockMatchDayEvents().filter(e => e.clubId === clubId && isSameDay(new Date(e.eventDate), date));

    const bookings: CourtGridBooking[] = [];

    confirmedSlots.forEach(slot => {
        if(slot.courtNumber) {
             bookings.push({
                id: slot.id,
                clubId: slot.clubId,
                courtNumber: slot.courtNumber,
                startTime: new Date(slot.startTime),
                endTime: new Date(slot.endTime),
                title: `Clase con ${slot.instructorName}`,
                type: 'clase',
                status: 'reservada',
                activityStatus: slot.status,
                participants: slot.bookedPlayers.length,
                maxParticipants: slot.maxPlayers,
            });
        }
    });

    confirmedMatches.forEach(match => {
        if(match.courtNumber) {
            bookings.push({
                id: match.id,
                clubId: match.clubId,
                courtNumber: match.courtNumber,
                startTime: new Date(match.startTime),
                endTime: new Date(match.endTime),
                title: `Partida Nivel ${match.level}`,
                type: 'partida',
                status: 'reservada',
                activityStatus: match.status,
                participants: match.bookedPlayers.length,
                maxParticipants: 4,
            });
        }
    });
    
    matchDayEvents.forEach(event => {
        const eventStart = new Date(event.eventDate);
        const eventEnd = event.eventEndTime ? new Date(event.eventEndTime) : addMinutes(eventStart, 180);
        event.courtIds.forEach(courtId => {
            const court = state.getMockPadelCourts().find(c => c.id === courtId);
            if (court) {
                bookings.push({
                    id: `event-${event.id}-${court.id}`,
                    clubId: event.clubId,
                    courtNumber: court.courtNumber,
                    startTime: eventStart,
                    endTime: eventEnd,
                    title: event.name,
                    type: 'match-day',
                    status: 'reservada',
                });
            }
        });
    });


    return bookings;
};
