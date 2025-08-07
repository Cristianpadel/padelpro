// This file re-exports all necessary functions and state variables
// from the individual modules within the mockDataSources directory.

export * from './state';
export * from './init';
export * from './utils';
export * from './users';
export * from './classActions';
export * from './classProposals';
export * from './matches';
export * from './matchDay';
export * from './system';
export * from './clubs';
export * from './courts';
export * from './shop';


// --- New composite functions ---
import { isSameDay, addMinutes } from 'date-fns';
import type { CourtGridBooking } from '@/types';
import { getMockTimeSlots, getMockMatches, getMockMatchDayEvents, getMockPadelCourts } from './state';

export const fetchCourtBookingsForDay = async (clubId: string, date: Date): Promise<CourtGridBooking[]> => {
    const confirmedSlots = getMockTimeSlots().filter(s => s.clubId === clubId && (s.status === 'confirmed' || s.status === 'confirmed_private') && isSameDay(new Date(s.startTime), date));
    const confirmedMatches = getMockMatches().filter(m => m.clubId === clubId && (m.status === 'confirmed' || m.status === 'confirmed_private') && isSameDay(new Date(m.startTime), date));
    const matchDayEvents = getMockMatchDayEvents().filter(e => e.clubId === clubId && isSameDay(new Date(e.eventDate), date));

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
            const court = getMockPadelCourts().find(c => c.id === courtId);
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
