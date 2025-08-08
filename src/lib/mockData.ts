"use client";

import type { TimeSlot, Booking, User, Instructor, Club, ClassPadelLevel, MatchPadelLevel, BookingSlotDetails, ClubFormData, UserDB, Match, MatchBooking, PadelGameType, SortOption, PadelCourt, CourtGridBooking, PadelCourtStatus, Review, CreateMatchFormData, PointTransaction, PointTransactionType, Transaction } from '../types';
import { classPadelLevels, matchPadelLevels, padelCategories } from '../types';
import { addHours, setHours, setMinutes, startOfDay, format, isSameDay, addDays, addMinutes, eachMinuteOfInterval, isEqual, areIntervalsOverlapping, parseISO, differenceInHours, differenceInMinutes, getDay, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import * as state from './mockDataSources';
import { performInitialization as initializeMockData } from './mockDataSources';
import { calculatePricePerPerson } from './mockDataSources/utils';

initializeMockData();

// Re-export all functions from the index
export * from './mockDataSources';


export const getCourtAvailabilityForInterval = async (clubId: string, startTime: Date, endTime: Date): Promise<{ available: PadelCourt[], occupied: PadelCourt[], total: number }> => {
    const allClubCourts = await state.fetchPadelCourtsByClub(clubId);
    const activeCourts = allClubCourts.filter(c => c.isActive);
    
    if (activeCourts.length === 0) {
        return { available: [], occupied: [], total: 0 };
    }

    const confirmedActivities = [
        ...state.getMockTimeSlots().filter(s => s.clubId === clubId && (s.status === 'confirmed' || s.status === 'confirmed_private')),
        ...state.getMockMatches().filter(m => m.clubId === clubId && (m.status === 'confirmed' || m.status === 'confirmed_private')),
        ...state.getMockMatchDayEvents().filter(e => e.clubId === clubId)
    ];

    const occupiedCourtNumbers = new Set<number>();

    confirmedActivities.forEach(activity => {
        const activityStart = new Date('eventDate' in activity ? activity.eventDate : activity.startTime);
        const activityEnd = new Date('eventEndTime' in activity && activity.eventEndTime ? activity.eventEndTime : ('endTime' in activity ? activity.endTime : addMinutes(new Date('eventDate' in activity ? activity.eventDate : activity.startTime), 90)));
        
        if (areIntervalsOverlapping({ start: startTime, end: endTime }, { start: activityStart, end: activityEnd }, { inclusive: false })) {
            if ('courtNumber' in activity && activity.courtNumber) {
                occupiedCourtNumbers.add(activity.courtNumber);
            } else if ('courtIds' in activity && Array.isArray(activity.courtIds)) {
                activity.courtIds.forEach(courtId => {
                    const court = allClubCourts.find(c => c.id === courtId);
                    if (court) occupiedCourtNumbers.add(court.courtNumber);
                });
            }
        }
    });

    const available: PadelCourt[] = [];
    const occupied: PadelCourt[] = [];

    activeCourts.forEach(court => {
        if (occupiedCourtNumbers.has(court.courtNumber)) {
            occupied.push(court);
        } else {
            available.push(court);
        }
    });

    return { available, occupied, total: activeCourts.length };
};

export const isMatchBookableWithPoints = (match: Match, club?: Club | null): boolean => {
    if (!match.isPlaceholder || !club?.pointBookingSlots) {
        return false;
    }
    const matchStartTime = new Date(match.startTime);
    const dayOfWeek = dayOfWeekArray[getDay(matchStartTime)];
    const pointBookingSlotsToday = club.pointBookingSlots?.[dayOfWeek as keyof typeof club.pointBookingSlots];
    if (pointBookingSlotsToday) {
        return pointBookingSlotsToday.some(range => {
            const rangeStart = parse(range.start, 'HH:mm', matchStartTime);
            const rangeEnd = parse(range.end, 'HH:mm', matchStartTime);
            return matchStartTime >= rangeStart && matchStartTime < rangeEnd;
        });
    }
    return false;
};

const dayOfWeekArray: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
