
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
                const nextVal = allPresentGroupSizes.values().next().value;
                determinedSize = (nextVal === undefined ? null : nextVal);
            }
        }
        return { completed: true, size: determinedSize };
    }
    // --- END NEW LOGIC ---

    // (Original logic for pre_registration follows)
    const bookingsByGroupSize: Record<number, { userId: string; groupSize: number }[]> = { 1: [], 2: [], 3: [], 4: [] };
    slot.bookedPlayers.forEach(p => {
        // Only consider players with a valid groupSize property
        if ('groupSize' in p && [1, 2, 3, 4].includes(Number(p.groupSize))) {
            const validGroupSize = Number(p.groupSize) as 1 | 2 | 3 | 4;
            if (bookingsByGroupSize[validGroupSize]) {
                bookingsByGroupSize[validGroupSize].push(p as any);
            }
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

export const hasAnyActivityForDay = (userId: string, targetStartTime: Date, targetEndTime: Date, ignoreActivityId?: string, ignoreActivityType?: 'class' | 'match'): boolean => {
    // DEBUG: Log de actividades que causan conflicto
    const debugConflicts: string[] = [];
    const debugDetails: string[] = [];
    const targetInterval = { start: targetStartTime, end: targetEndTime };

    // Check class bookings for overlaps, but only if the class is confirmed
    const hasClassConflict = state.getMockUserBookings().some(b => {
        if (b.userId !== userId) return false;
        const slot = state.getMockTimeSlots().find(s => s.id === b.activityId);
        if (!slot || (ignoreActivityType === 'class' && slot.id === ignoreActivityId)) return false;
        if (slot.status !== 'confirmed' && slot.status !== 'confirmed_private') return false;
        const overlap = dateFnsAreIntervalsOverlapping(targetInterval, { start: new Date(slot.startTime), end: new Date(slot.endTime) }, { inclusive: false });
        if (overlap) {
            debugConflicts.push(`Clase: ${slot.id} ${slot.startTime} - ${slot.endTime}`);
            debugDetails.push(`Clase conflict: slotId=${slot.id}, start=${slot.startTime}, end=${slot.endTime}, ignoreActivityId=${ignoreActivityId}, ignoreActivityType=${ignoreActivityType}`);
        }
        return overlap;
    });
    if (hasClassConflict) {
        console.warn('Solapamiento detectado (clase):', debugConflicts.length ? debugConflicts : '(ninguno)');
        console.warn('Detalles de conflicto (clase):', debugDetails.length ? debugDetails : '(ninguno)');
        return true;
    }

    // Check match bookings for overlaps, including forming matches for the same slot (para evitar doble inscripción en partidas "hermanas")
    const hasMatchConflict = state.getMockUserMatchBookings().some(b => {
        if (b.userId !== userId) return false;
        const match = state.getMockMatches().find(m => m.id === b.activityId);
        if (!match || (ignoreActivityType === 'match' && match.id === ignoreActivityId)) return false;
        // Bloquear si la otra partida está confirmada o si es forming y coincide club, fecha y horario
        const overlap = dateFnsAreIntervalsOverlapping(targetInterval, { start: new Date(match.startTime), end: new Date(match.endTime) }, { inclusive: false });
        const isSameClub = match.clubId && match.clubId === (state.getMockMatches().find(m => m.id === ignoreActivityId)?.clubId);
        const isSameSlot = isSameClub && new Date(match.startTime).getTime() === targetStartTime.getTime() && new Date(match.endTime).getTime() === targetEndTime.getTime();
        if (
            overlap && (
                match.status === 'confirmed' || match.status === 'confirmed_private' ||
                (match.status === 'forming' && isSameSlot)
            )
        ) {
            debugConflicts.push(`Partida: ${match.id} ${match.startTime} - ${match.endTime}`);
            debugDetails.push(`Match conflict: matchId=${match.id}, start=${match.startTime}, end=${match.endTime}, ignoreActivityId=${ignoreActivityId}, ignoreActivityType=${ignoreActivityType}`);
            return true;
        }
        return false;
    });
    if (hasMatchConflict) {
        console.warn('Solapamiento detectado (partida):', debugConflicts.length ? debugConflicts : '(ninguno)');
        console.warn('Detalles de conflicto (partida):', debugDetails.length ? debugDetails : '(ninguno)');
        return true;
    }
    
    // NOTE: Match-Day events se dejan independientes: no bloquean ni cuentan como conflicto.

    return false;
};


export const countUserConfirmedActivitiesForDay = (userId: string, date: Date, ignoreActivityId?: string, ignoreActivityType?: 'class' | 'match'): number => {
    const todayStart = startOfDay(date);
    let count = 0;

    // Check confirmed classes for the day
    for (const slot of state.getMockTimeSlots()) {
        if (slot.id === ignoreActivityId && ignoreActivityType === 'class') continue;
        if (!isSameDay(new Date(slot.startTime), todayStart)) continue;
        
        const userIsBookedInClass = (slot.bookedPlayers || []).some(p => p.userId === userId);
        if (!userIsBookedInClass) continue;

        // Count when the class is confirmed OR it's effectively completed (group complete) even if still pre_registration
        const isConfirmedClass = slot.status === 'confirmed' || slot.status === 'confirmed_private';
        const isEffectivelyCompleted = isSlotEffectivelyCompleted(slot).completed === true;
        if (isConfirmedClass || isEffectivelyCompleted) {
            count++;
        }
    }

    // Check confirmed matches for the day
    for (const match of state.getMockMatches()) {
        if (match.id === ignoreActivityId && ignoreActivityType === 'match') continue;
        if (!isSameDay(new Date(match.startTime), todayStart)) continue;
        // Ignore Match Day events (independent rule)
        if ((match as any).eventId) continue;

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

/**
 * Removes open proposal classes (pre_registration with 0 players) for the same instructor
 * that overlap the given confirmed slot's interval. Returns number of proposals removed.
 */
export const removeOverlappingInstructorProposalsForSlot = (confirmedSlot: TimeSlot): number => {
    if (!confirmedSlot || !confirmedSlot.instructorId) return 0;
    const start = new Date(confirmedSlot.startTime);
    const end = new Date(confirmedSlot.endTime);
    let removed = 0;

    // Collect candidates to avoid mutating while iterating original array
    const candidates = state.getMockTimeSlots().filter(s =>
        s.id !== confirmedSlot.id &&
        s.instructorId === confirmedSlot.instructorId &&
        s.status === 'pre_registration' &&
        (!s.bookedPlayers || s.bookedPlayers.length === 0) &&
        // Non-inclusive boundaries: proposals that start exactly when the class ends or end exactly when it starts are allowed
        dateFnsAreIntervalsOverlapping({ start, end }, { start: new Date(s.startTime), end: new Date(s.endTime) }, { inclusive: false })
    );

    for (const c of candidates) {
        state.removeTimeSlotFromState(c.id);
        removed++;
    }
    if (removed > 0) {
        console.log(`[Proposals] Removed ${removed} overlapping proposals for instructor ${confirmedSlot.instructorId} due to confirmed class ${confirmedSlot.id}.`);
    }
    return removed;
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
        .filter(m => m.clubId === clubId && (
            m.status === 'confirmed' || m.status === 'confirmed_private' || ((m as any).isProvisional === true && !!m.courtNumber)
        ))
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
    const confirmedStartTime = new Date(confirmedActivity.startTime);
    const confirmedEndTime = new Date(confirmedActivity.endTime);
    const confirmedUserIds = new Set<string>();
    if ('bookedPlayers' in confirmedActivity && Array.isArray(confirmedActivity.bookedPlayers)) {
        confirmedActivity.bookedPlayers.forEach(p => { if (p?.userId) confirmedUserIds.add(p.userId); });
    }

    if (confirmedUserIds.size === 0) return; // No users to process

    let totalCancellations = 0;

    confirmedUserIds.forEach((uid) => {
        const bookingsToCancel: (Booking | MatchBooking)[] = [];

        // Conflicting class pre-registrations for this user (same day)
        state.getMockUserBookings().forEach(booking => {
            if (booking.userId !== uid) return;
            const slot = state.getMockTimeSlots().find(s => s.id === booking.activityId);
            if (!slot || slot.id === confirmedActivity.id) return;
            if (slot.status === 'pre_registration' && isSameDay(new Date(slot.startTime), confirmedStartTime)) {
                bookingsToCancel.push(booking);
            }
        });

        // Conflicting match pre-registrations for this user (same day)
        state.getMockUserMatchBookings().forEach(booking => {
            if (booking.userId !== uid) return;
            const match = state.getMockMatches().find(m => m.id === booking.activityId);
            if (!match || match.id === confirmedActivity.id) return;
            if (match.status === 'forming' && isSameDay(new Date(match.startTime), confirmedStartTime)) {
                bookingsToCancel.push(booking);
            }
        });

        // Cancel identified bookings for this user
        bookingsToCancel.forEach(b => {
            if ('groupSize' in b) {
                state.removeBookingFromTimeSlotInState(b.activityId, b.userId, b.groupSize);
                state.removeUserBookingFromState(b.id);
            } else {
                state.removePlayerFromMatchInState(b.activityId, b.userId);
                state.removeUserMatchBookingFromState(b.id);
            }
        });

        // Recalculate per user
        recalculateAndSetBlockedBalances(uid);
        totalCancellations += bookingsToCancel.length;
    });

    if (totalCancellations > 0) {
        console.log(`[MockData] Confirmed activity ${confirmedActivity.id}. Annulled ${totalCancellations} conflicting pre-inscriptions for confirmed users on the same day.`);
    }
};



export const isSlotGratisAndAvailable = (slot: TimeSlot): boolean => {
    if (!slot.designatedGratisSpotPlaceholderIndexForOption) {
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

export const removeUserPreInscriptionsForDay = async (userId: string, date: Date, excludingId: string, type: 'class' | 'match') => {
    const todayStart = startOfDay(date);

    // Cancel class pre-inscriptions
    const classBookingsToCancel = state.getMockUserBookings().filter(b => {
        if (b.userId !== userId || (type === 'class' && b.activityId === excludingId)) return false;
        const slot = state.getMockTimeSlots().find(s => s.id === b.activityId);
        return slot && slot.status === 'pre_registration' && isSameDay(new Date(slot.startTime), todayStart);
    });

    for (const booking of classBookingsToCancel) {
        state.removeBookingFromTimeSlotInState(booking.activityId, booking.userId, booking.groupSize);
        state.removeUserBookingFromState(booking.id);
    }
    
    // Cancel match pre-inscriptions
    const matchBookingsToCancel = state.getMockUserMatchBookings().filter(b => {
        if (b.userId !== userId || (type === 'match' && b.activityId === excludingId)) return false;
        const match = state.getMockMatches().find(m => m.id === b.activityId);
        return match && match.status === 'forming' && isSameDay(new Date(match.startTime), todayStart);
    });

    for (const booking of matchBookingsToCancel) {
        state.removePlayerFromMatchInState(booking.activityId, booking.userId);
        state.removeUserMatchBookingFromState(booking.id);
    }

    // Recalculate blocked balances after cancellations
    await recalculateAndSetBlockedBalances(userId);
    
    console.log(`[Annulment] Cancelled ${classBookingsToCancel.length} class and ${matchBookingsToCancel.length} match pre-inscriptions for user ${userId} on ${format(date, 'yyyy-MM-dd')}.`);
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
        .filter(m => m.clubId === clubId && (
            m.status === 'confirmed' || m.status === 'confirmed_private' || ((m as any).isProvisional === true && !!m.courtNumber)
        ))
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

