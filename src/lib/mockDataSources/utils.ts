
// src/lib/mockDataSources/utils.ts
"use client";

import { isSameDay, areIntervalsOverlapping as dateFnsAreIntervalsOverlapping, startOfDay, format, differenceInDays, getDay } from 'date-fns';
import type { TimeSlot, Booking, Match, MatchBooking, User, PadelCourt, PadelCategoryForSlot, MatchPadelLevel, ClassPadelLevel, UserActivityStatusForDay, Club } from '@/types';
import { daysOfWeek } from '@/types';
import * as state from './index'; // Import state module
import { setGlobalCurrentUser } from './state';
import { recalculateAndSetBlockedBalances } from './users';


export const calculatePricePerPerson = (totalPrice: number | undefined, groupSize: number): number => {
    if (totalPrice === undefined || totalPrice === null || groupSize <= 0) return 0;
    const validGroupSize = [1, 2, 3, 4].includes(groupSize) ? groupSize : 4;
    return totalPrice / validGroupSize;
};

export const isSlotEffectivelyCompleted = (slot: TimeSlot | undefined | null, specificGroupSize?: (1 | 2 | 3 | 4)): { completed: boolean, size: (1 | 2 | 3 | 4) | null } => {
    if (!slot || !slot.bookedPlayers) return { completed: false, size: null };

    // --- NEW LOGIC ---
    // If a class has been explicitly confirmed (either as private or regular),
    // it remains 'completed' in terms of its core state, even if a spot opens up.
    if (slot.status === 'confirmed' || slot.status === 'confirmed_private') {
        let determinedSize: (1 | 2 | 3 | 4) | null = null;
        if (slot.status === 'confirmed_private') {
            determinedSize = slot.confirmedPrivateSize || null;
        } else { // status is 'confirmed'
            // For a regular confirmed class, all players should have the same group size.
            // We can infer this from the remaining players or the designated gratis spot.
            const allPresentGroupSizes = new Set<1|2|3|4>();
            if (slot.bookedPlayers.length > 0) {
                slot.bookedPlayers.forEach(p => allPresentGroupSizes.add(p.groupSize));
            }
            if (slot.designatedGratisSpotPlaceholderIndexForOption) {
                Object.keys(slot.designatedGratisSpotPlaceholderIndexForOption).forEach(key => {
                    if (slot.designatedGratisSpotPlaceholderIndexForOption![Number(key) as (1|2|3|4)] !== null) {
                        allPresentGroupSizes.add(Number(key) as (1|2|3|4));
                    }
                });
            }
            if (allPresentGroupSizes.size > 0) {
                // In a confirmed (non-private) class, there should only ever be ONE group size.
                determinedSize = allPresentGroupSizes.values().next().value;
            }
        }
        return { completed: true, size: determinedSize };
    }
    // --- END NEW LOGIC ---

    // (Original logic for pre_registration follows)
    const bookingsByGroupSize: Record<number, { userId: string; groupSize: number }[]> = { 1: [], 2: [], 3: [], 4: [] };
    slot.bookedPlayers.forEach(p => {
        const validGroupSize = [1, 2, 3, 4].includes(p.groupSize) ? p.groupSize : null;
        if (validGroupSize && bookingsByGroupSize[validGroupSize]) {
            bookingsByGroupSize[validGroupSize].push(p);
        }
    });
    const sizesToCheck = specificGroupSize ? [specificGroupSize] : ([1, 2, 3, 4] as const);
    for (const size of sizesToCheck) {
        if (bookingsByGroupSize[size]?.length >= size) {
            return { completed: true, size: size };
        }
    }
    return { completed: false, size: null };
};

export const hasAnyConfirmedActivityForDay = (userId: string, date: Date, ignoreActivityId?: string, ignoreActivityType?: 'class' | 'match'): boolean => {
    return countUserConfirmedActivitiesForDay(userId, date, ignoreActivityId, ignoreActivityType) > 0;
};

export const countUserConfirmedActivitiesForDay = (userId: string, date: Date, ignoreActivityId?: string, ignoreActivityType?: 'class' | 'match'): number => {
    const todayStart = startOfDay(date);
    let count = 0;

    // Check confirmed classes for the day
    for (const slot of state.getMockTimeSlots()) {
        if (slot.id === ignoreActivityId && ignoreActivityType === 'class') continue;
        if (!isSameDay(new Date(slot.startTime), todayStart)) continue;
        
        if (slot.status === 'confirmed' || slot.status === 'confirmed_private') {
            if ((slot.bookedPlayers || []).some(p => p.userId === userId)) {
                count++;
            }
        }
    }

    // Check confirmed matches for the day
    for (const match of state.getMockMatches()) {
        if (match.id === ignoreActivityId && ignoreActivityType === 'match') continue;
        if (!isSameDay(new Date(match.startTime), todayStart)) continue;

        if (match.status === 'confirmed' || match.status === 'confirmed_private') {
             if ((match.bookedPlayers || []).some(p => p.userId === userId)) {
                count++;
            }
        }
    }

    return count;
};

export const countUserUnconfirmedInscriptions = (userId: string): number => {
    let unconfirmedCount = 0;
    const now = new Date();

    // Check unconfirmed class bookings
    for (const booking of state.getMockUserBookings()) {
        if (booking.userId !== userId) continue;
        const slot = state.getMockTimeSlots().find(s => s.id === booking.activityId);
        if (slot && new Date(slot.startTime) > now && slot.status === 'pre_registration') {
            unconfirmedCount++;
        }
    }

    // Check unconfirmed match bookings
    for (const booking of state.getMockUserMatchBookings()) {
        if (booking.userId !== userId) continue;
        const match = state.getMockMatches().find(m => m.id === booking.activityId);
        if (match && new Date(match.startTime) > now && match.status === 'forming') {
            unconfirmedCount++;
        }
    }

    return unconfirmedCount;
};


export const getPlaceholderUserName = (userId: string | undefined, currentUserId: string | undefined, currentUserName?: string): string => {
  if (!userId) return 'Desconocido';
  if (userId === currentUserId) {
    return `${currentUserName || 'Usuario'} (Tú)`;
  }
  // In a real app, you'd fetch this from mockStudents or similar data source if needed.
  // For simplicity, we'll just use a generic placeholder if not the current user.
  const student = state.getMockStudents().find(s => s.id === userId);
  return student?.name || `Jugador ${userId.substring(userId.length - 4)}`;
};

export const findAvailableCourt = (clubId: string, startTime: Date, endTime: Date): PadelCourt | undefined => {
    const allClubCourts = state.getMockPadelCourts().filter(c => c.clubId === clubId && c.isActive);
    if (allClubCourts.length === 0) return undefined;

    const occupiedCourtNumbers = new Set<number>();
    
    const checkAndAdd = (activity: { startTime: Date, endTime: Date, courtNumber?: number }) => {
        if (activity.courtNumber && dateFnsAreIntervalsOverlapping({ start: startTime, end: endTime }, { start: new Date(activity.startTime), end: new Date(activity.endTime) }, { inclusive: false })) {
            occupiedCourtNumbers.add(activity.courtNumber);
        }
    };
    
    state.getMockTimeSlots()
        .filter(s => s.clubId === clubId && (s.status === 'confirmed' || s.status === 'confirmed_private'))
        .forEach(checkAndAdd);

    state.getMockMatches()
        .filter(m => m.clubId === clubId && (m.status === 'confirmed' || m.status === 'confirmed_private'))
        .forEach(checkAndAdd);
    
    // Add Match-Day event bookings
    state.getMockMatchDayEvents()
        .filter(e => e.clubId === clubId && dateFnsAreIntervalsOverlapping({start:startTime, end:endTime}, {start: new Date(e.eventDate), end: new Date(e.eventEndTime || e.eventDate)}, {inclusive: false}))
        .forEach(e => {
            e.courtIds.forEach(courtId => {
                const court = allClubCourts.find(c => c.id === courtId);
                if(court) occupiedCourtNumbers.add(court.courtNumber);
            })
        });


    for (const court of allClubCourts) {
        if (!occupiedCourtNumbers.has(court.courtNumber)) {
            return court;
        }
    }
    return undefined;
};


export const _annulConflictingActivities = (confirmedActivity: TimeSlot | Match) => {
    const slotsToKeep: TimeSlot[] = [];
    const classBookingsToKeep: Booking[] = [];
    const cancelledSlotIds: string[] = [];

    const matchesToKeep: Match[] = [];
    const matchBookingsToKeep: MatchBooking[] = [];
    const cancelledMatchIds: string[] = [];

    const confirmedStartTime = new Date(confirmedActivity.startTime);
    const confirmedEndTime = new Date(confirmedActivity.endTime);

    const isConfirmedActivityAClass = 'instructorName' in confirmedActivity;
    const confirmedInstructorName = isConfirmedActivityAClass ? (confirmedActivity as TimeSlot).instructorName : null;

    // Annul conflicting TimeSlots (classes)
    state.getMockTimeSlots().forEach(slot => {
        if (isConfirmedActivityAClass && slot.id === confirmedActivity.id) {
            slotsToKeep.push(slot); // Keep the confirmed slot itself
            return;
        }

        const isOverlapping = dateFnsAreIntervalsOverlapping(
            { start: new Date(slot.startTime), end: new Date(slot.endTime) },
            { start: confirmedStartTime, end: confirmedEndTime },
            { inclusive: false }
        );

        let shouldCancel = false;
        if (isOverlapping && slot.status === 'pre_registration') {
            // Scenario 1: Conflict on the same court
            if (confirmedActivity.courtNumber !== undefined && slot.clubId === confirmedActivity.clubId && slot.courtNumber === confirmedActivity.courtNumber) {
                shouldCancel = true;
            }
            // Scenario 2: Same instructor is now busy
            if (confirmedInstructorName && slot.instructorName === confirmedInstructorName) {
                shouldCancel = true;
            }
        }

        if (shouldCancel) {
            cancelledSlotIds.push(slot.id);
        } else {
            slotsToKeep.push(slot);
        }
    });

    state.getMockUserBookings().forEach(b => {
        if (!cancelledSlotIds.includes(b.activityId)) {
            classBookingsToKeep.push(b);
        }
    });
    
    state.initializeMockTimeSlots(slotsToKeep);
    state.initializeMockUserBookings(classBookingsToKeep);

    // Annul conflicting Matches (placeholders or forming)
    state.getMockMatches().forEach(match => {
        if (!isConfirmedActivityAClass && match.id === confirmedActivity.id) {
            matchesToKeep.push(match); // Keep the confirmed match itself
            return;
        }

        const isOverlapping = dateFnsAreIntervalsOverlapping(
            { start: new Date(match.startTime), end: new Date(match.endTime) },
            { start: confirmedStartTime, end: confirmedEndTime },
            { inclusive: false }
        );
        
        let shouldCancel = false;
        if (isOverlapping && (match.isPlaceholder === true || match.status === 'forming')) {
            // Annul placeholder/forming matches on the same court
            if (confirmedActivity.courtNumber !== undefined && match.clubId === confirmedActivity.clubId && match.courtNumber === confirmedActivity.courtNumber) {
                 shouldCancel = true;
            }
            // Annul any placeholder for the same time slot, as a court is now taken
            if (match.isPlaceholder) {
                const availableCourtAfterConfirmation = findAvailableCourt(match.clubId, new Date(match.startTime), new Date(match.endTime));
                if (!availableCourtAfterConfirmation) {
                    shouldCancel = true;
                }
            }
        }

        if (shouldCancel) {
            cancelledMatchIds.push(match.id);
        } else {
            matchesToKeep.push(match);
        }
    });

    state.getMockUserMatchBookings().forEach(b => {
        if (!cancelledMatchIds.includes(b.activityId)) {
            matchBookingsToKeep.push(b);
        }
    });
    state.initializeMockMatches(matchesToKeep);
    state.initializeMockUserMatchBookings(matchBookingsToKeep);
    
    if (cancelledSlotIds.length > 0 || cancelledMatchIds.length > 0) {
        console.log(`[MockData] Confirmed activity ${confirmedActivity.id}. Annulled ${cancelledSlotIds.length} conflicting class slots and ${cancelledMatchIds.length} conflicting match cards.`);
    }
};


export const isSlotGratisAndAvailable = (slot: TimeSlot): boolean => {
    if (!slot || !slot.designatedGratisSpotPlaceholderIndexForOption) {
        return false;
    }
    
    const bookings = state.getMockUserBookings();

    for (const [groupSizeStr, designatedSpotIdx] of Object.entries(slot.designatedGratisSpotPlaceholderIndexForOption)) {
        const optionSize = parseInt(groupSizeStr) as (1 | 2 | 3 | 4);
        
        if (designatedSpotIdx !== null && designatedSpotIdx !== undefined) {
             const bookingInSpot = bookings.find(b =>
                b.activityId === slot.id &&
                b.groupSize === optionSize &&
                b.spotIndex === designatedSpotIdx
            );
            if (!bookingInSpot) {
                return true;
            }
        }
    }
    return false;
};

export const findConflictingConfirmedActivity = (
    activityDetails: { startTime: Date; endTime: Date; clubId: string; courtNumber: number },
    allSlotsToCheck: TimeSlot[], // Pass these in, could be a subset or all
    allMatchesToCheck: Match[]   // Pass these in
): TimeSlot | Match | undefined => {
    // Check against confirmed classes
    const conflictingSlot = allSlotsToCheck.find(
        s => s.clubId === activityDetails.clubId &&
             s.courtNumber === activityDetails.courtNumber &&
             (s.status === 'confirmed' || s.status === 'confirmed_private') &&
             dateFnsAreIntervalsOverlapping(
                 { start: activityDetails.startTime, end: activityDetails.endTime },
                 { start: new Date(s.startTime), end: new Date(s.endTime) },
                 { inclusive: false }
             )
    );
    if (conflictingSlot) return conflictingSlot;

    // Check against confirmed matches (non-placeholder)
    const conflictingMatch = allMatchesToCheck.find(
        m => m.clubId === activityDetails.clubId &&
             m.courtNumber === activityDetails.courtNumber &&
             m.status === 'confirmed' && // Only truly confirmed matches
             m.isPlaceholder === false &&
             dateFnsAreIntervalsOverlapping(
                 { start: activityDetails.startTime, end: activityDetails.endTime },
                 { start: new Date(m.startTime), end: new Date(m.endTime) },
                 { inclusive: false }
             )
    );
    if (conflictingMatch) return conflictingMatch;

    return undefined;
};

export const isUserLevelCompatibleWithActivity = (
  activityLevel: ClassPadelLevel | MatchPadelLevel | undefined,
  userLevel: MatchPadelLevel | undefined,
  isPlaceholder?: boolean
): boolean => {
  // If user has no level or activity is open to all, it's compatible
  if (!userLevel || userLevel === 'abierto' || !activityLevel || activityLevel === 'abierto' || isPlaceholder) {
    return true;
  }

  const userNumeric = parseFloat(userLevel);
  if (isNaN(userNumeric)) return true; // User with invalid level string is allowed anywhere

  // Case 1: Activity level is a range object (like some classes)
  if (typeof activityLevel === 'object' && 'min' in activityLevel && 'max' in activityLevel) {
    const min = parseFloat(activityLevel.min);
    const max = parseFloat(activityLevel.max);
    if (isNaN(min) || isNaN(max)) return true; // Invalid range, allow user in
    return userNumeric >= min && userNumeric <= max;
  }

  // Case 2: Activity level is a single string (like matches or some classes)
  if (typeof activityLevel === 'string') {
    const activityNumeric = parseFloat(activityLevel);
    if (isNaN(activityNumeric)) return true; // Invalid activity level string, allow user in

    // For single-level activities, allow a +/- 0.5 range
    const minAllowed = Math.max(0.5, activityNumeric - 0.5);
    const maxAllowed = activityNumeric + 0.5;
    return userNumeric >= minAllowed && userNumeric <= maxAllowed;
  }

  return true; // Default to compatible if type is unexpected
};

export const removeUserPreInscriptionsForDay = async (userId: string, confirmedActivityDate: Date, ignoreActivityId?: string, ignoreActivityType?: 'class' | 'match') => {
    const userClassBookings = state.getMockUserBookings().filter(b => b.userId === userId);
    const userMatchBookings = state.getMockUserMatchBookings().filter(b => b.userId === userId);
    
    // --- Cancel Class Pre-inscriptions ---
    const classBookingsToRemove = userClassBookings.filter(b => {
        if (b.activityId === ignoreActivityId && ignoreActivityType === 'class') return false;
        const slot = state.getMockTimeSlots().find(s => s.id === b.activityId);
        return slot && isSameDay(new Date(slot.startTime), confirmedActivityDate) && slot.status === 'pre_registration';
    });
    
    for (const booking of classBookingsToRemove) {
        const slot = state.getMockTimeSlots().find(s => s.id === booking.activityId);
        if (slot) {
            slot.bookedPlayers = slot.bookedPlayers.filter(p => !(p.userId === userId && p.groupSize === booking.groupSize));
            state.updateTimeSlotInState(slot.id, slot);
        }
        state.removeUserBookingFromState(booking.id);
    }

    // --- Cancel Match Pre-inscriptions ---
    const matchBookingsToRemove = userMatchBookings.filter(b => {
        if (b.activityId === ignoreActivityId && ignoreActivityType === 'match') return false;
        const match = state.getMockMatches().find(m => m.id === b.activityId);
        return match && isSameDay(new Date(match.startTime), confirmedActivityDate) && match.status === 'forming';
    });

    for (const booking of matchBookingsToRemove) {
        const match = state.getMockMatches().find(m => m.id === booking.activityId);
        if (match) {
            match.bookedPlayers = match.bookedPlayers.filter(p => p.userId !== userId);
             state.updateMatchInState(match.id, match);
        }
        state.removeUserMatchBookingFromState(booking.id);
    }

    if (classBookingsToRemove.length > 0 || matchBookingsToRemove.length > 0) {
        console.log(`[MockData] User ${userId} confirmed an activity. Removed ${classBookingsToRemove.length} class pre-inscriptions and ${matchBookingsToRemove.length} match pre-inscriptions for ${format(confirmedActivityDate, 'yyyy-MM-dd')}.`);
    }

    await recalculateAndSetBlockedBalances(userId);
};


export const countConfirmedLiberadasSpots = (clubId?: string | null): { classes: number, matches: number, matchDay: number } => {
    const slotsToCheck = clubId ? state.getMockTimeSlots().filter(s => s.clubId === clubId) : state.getMockTimeSlots();
    const matchesToCheck = clubId ? state.getMockMatches().filter(m => m.clubId === clubId) : state.getMockMatches();

    const gratisConfirmedClasses = slotsToCheck.filter(slot =>
        (slot.status === 'confirmed' || slot.status === 'confirmed_private') && isSlotGratisAndAvailable(slot)
    ).length;

    const gratisConfirmedRegularMatches = matchesToCheck.filter(match =>
        !match.eventId && // Exclude match-day matches
        (match.status === 'confirmed' || match.status === 'confirmed_private') &&
        match.gratisSpotAvailable &&
        (match.bookedPlayers || []).length === 3
    ).length;

    const gratisMatchDayMatches = matchesToCheck.filter(match =>
        !!match.eventId && // Only include match-day matches
        match.gratisSpotAvailable &&
        (match.bookedPlayers || []).length === 3
    ).length;

    return { classes: gratisConfirmedClasses, matches: gratisConfirmedRegularMatches, matchDay: gratisMatchDayMatches };
};

export const findPadelCourtById = async (courtId: string): Promise<PadelCourt | undefined> => {
    return state.getMockPadelCourts().find(c => c.id === courtId);
};

export const getCourtAvailabilityForInterval = (
    clubId: string,
    startTime: Date,
    endTime: Date
): { available: PadelCourt[], occupied: PadelCourt[], total: number } => {
    const allClubCourts = state.getMockPadelCourts().filter(c => c.clubId === clubId && c.isActive);
    const occupiedCourtNumbers = new Set<number>();

    const checkAndAdd = (activity: { startTime: Date, endTime: Date, courtNumber?: number }) => {
        if (activity.courtNumber && dateFnsAreIntervalsOverlapping({ start: startTime, end: endTime }, { start: new Date(activity.startTime), end: new Date(activity.endTime) }, { inclusive: false })) {
            occupiedCourtNumbers.add(activity.courtNumber);
        }
    };

    state.getMockTimeSlots()
        .filter(s => s.clubId === clubId && (s.status === 'confirmed' || s.status === 'confirmed_private'))
        .forEach(checkAndAdd);
    state.getMockMatches()
        .filter(m => m.clubId === clubId && (m.status === 'confirmed' || m.status === 'confirmed_private'))
        .forEach(checkAndAdd);
    
    // Add Match-Day event bookings
    state.getMockMatchDayEvents()
        .filter(e => e.clubId === clubId && dateFnsAreIntervalsOverlapping({start:startTime, end:endTime}, {start: new Date(e.eventDate), end: new Date(e.eventEndTime || e.eventDate)}, {inclusive: false}))
        .forEach(e => {
            e.courtIds.forEach(courtId => {
                const court = allClubCourts.find(c => c.id === courtId);
                if(court) occupiedCourtNumbers.add(court.courtNumber);
            })
        });

    const available = allClubCourts.filter(c => !occupiedCourtNumbers.has(c.courtNumber));
    const occupied = allClubCourts.filter(c => occupiedCourtNumbers.has(c.courtNumber));

    return { available, occupied, total: allClubCourts.length };
};

export const isMatchBookableWithPoints = (match: Match, club: Club | null | undefined): boolean => {
    if (!club || !club.pointBookingSlots || !match.isPlaceholder) {
        return false;
    }
    const dayKey = daysOfWeek[getDay(new Date(match.startTime))];
    const allowedRanges = club.pointBookingSlots[dayKey];
    if (!allowedRanges) {
        return false;
    }
    const matchTime = format(new Date(match.startTime), 'HH:mm');
    return allowedRanges.some(range => matchTime >= range.start && matchTime < range.end);
};