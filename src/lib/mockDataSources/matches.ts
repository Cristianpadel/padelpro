// src/lib/mockDataSources/matches.ts
"use client";

import { addHours, setHours, setMinutes, startOfDay, format, isSameDay, addDays, addMinutes, areIntervalsOverlapping, getDay, parse, differenceInHours, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Match, MatchPadelLevel, PadelCategoryForSlot, MatchBooking, User, Club, DayOfWeek, TimeRange, Instructor, TimeSlot } from '@/types'; // Changed PadelCategory to PadelCategoryForSlot
import { matchPadelLevels, padelCategoryForSlotOptions, daysOfWeek as dayOfWeekArray } from '@/types'; // Use padelCategoryForSlotOptions
import * as state from './index';
import * as config from '../config';
import * as mockUtils from './utils';
import { getPlaceholderUserName } from './utils';
import { calculatePricePerPerson } from '@/lib/utils';
import { addUserPointsAndAddTransaction, deductCredit, addCreditToStudent, recalculateAndSetBlockedBalances, confirmAndAwardPendingPoints } from './users';
import { getMockStudents } from './state'; // Import getMockStudents directly from state
import { _classifyLevelAndCategoryForSlot } from './classProposals';
import { findAvailableCourt, _annulConflictingActivities, removeUserPreInscriptionsForDay, isUserLevelCompatibleWithActivity as isUserLevelCompatible } from './utils';
import { calculateActivityPrice } from './clubs';


export const fetchMatches = async (clubId?: string): Promise<Match[]> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    let matchesToReturn = JSON.parse(JSON.stringify(state.getMockMatches())) as Match[];
    if (clubId) {
        matchesToReturn = matchesToReturn.filter(match => match.clubId === clubId);
    }
    return matchesToReturn.map(match => ({
        ...match,
        startTime: new Date(match.startTime),
        endTime: new Date(match.endTime),
        level: match.level || matchPadelLevels[0],
        category: match.category || 'abierta', // Default to 'abierta'
        bookedPlayers: (match.bookedPlayers || []).map(p => ({ userId: p.userId, name: p.name || getPlaceholderUserName(p.userId, state.getMockCurrentUser()?.id, state.getMockCurrentUser()?.name) })),
        isPlaceholder: match.isPlaceholder === undefined ? false : match.isPlaceholder,
        status: match.status || 'forming',
        organizerId: match.organizerId,
        privateShareCode: match.privateShareCode,
        confirmedPrivateSize: match.confirmedPrivateSize,
        durationMinutes: match.durationMinutes || 90,
    }));
};

export const bookMatch = async (
    userId: string,
    matchId: string,
    usePoints: boolean = false
): Promise<{ newBooking: MatchBooking, updatedMatch: Match } | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const user = state.getMockUserDatabase().find(u => u.id === userId);
    if (!user) return { error: "Usuario no encontrado." };

    const matchIndex = state.getMockMatches().findIndex(m => m.id === matchId);
    if (matchIndex === -1) return { error: "Partida no encontrada." };

    let match = { ...state.getMockMatches()[matchIndex] };
    const club = state.getMockClubs().find(c => c.id === match.clubId);
    if (!club) return { error: "Club no encontrado para esta partida." };

    if ((match.bookedPlayers || []).length >= 4) return { error: "Esta partida ya está completa." };
    if ((match.bookedPlayers || []).some(p => p.userId === userId)) return { error: "Ya estás inscrito en esta partida." };
    if (mockUtils.hasAnyConfirmedActivityForDay(userId, new Date(match.startTime), matchId, 'match')) {
        return { error: 'Ya tienes otra actividad confirmada para este día.' };
    }
    
    // Check level compatibility only if the match is not a placeholder ('abierto')
    if (match.level !== 'abierto' && !isUserLevelCompatible(match.level, user.level, match.isPlaceholder)) {
        return { error: 'Tu nivel de juego no es compatible con el de esta partida.' };
    }

    const pricePerPlayer = calculatePricePerPerson(calculateActivityPrice(club, new Date(match.startTime)), 4);
    
    // Recalculate match total fee just in case it's not set
    if (match.totalCourtFee === undefined || match.totalCourtFee === 0) {
        match.totalCourtFee = calculateActivityPrice(club, new Date(match.startTime));
    }

    const pointsCost = match.isPointsOnlyBooking 
        ? (calculatePricePerPerson(match.totalCourtFee, 4) || 20)
        : calculatePricePerPerson(match.totalCourtFee, 4);

    if (usePoints) {
        if ((user.loyaltyPoints ?? 0) < pointsCost) {
            return { error: `No tienes suficientes puntos para unirte a esta partida. Necesitas ${pointsCost} y tienes ${user.loyaltyPoints ?? 0}.` };
        }
    } else {
        if ((user.credit ?? 0) < pricePerPlayer) {
            return { error: `Saldo insuficiente. Necesitas ${pricePerPlayer.toFixed(2)}€.` };
        }
    }

    if ((match.isPlaceholder || match.isProMatch) && (match.bookedPlayers || []).length === 0) {
      match.isPlaceholder = false; 
      if (match.level === 'abierto' || match.isProMatch) {
          match.level = user.level || '1.0';
      }
      if (match.category === 'abierta' || match.isProMatch) {
           match.category = user.genderCategory === 'femenino' ? 'chica' : user.genderCategory === 'masculino' ? 'chico' : 'abierta';
      }
    }

    match.bookedPlayers.push({ userId: user.id, name: user.name });

    const newBooking: MatchBooking = {
        id: `matchbooking-${matchId}-${userId}-${Date.now()}`,
        userId,
        activityId: matchId,
        activityType: 'match',
        bookedAt: new Date(),
        bookedWithPoints: usePoints,
        matchDetails: { ...match }
    };

    state.addUserMatchBookingToState(newBooking);

    if (match.bookedPlayers.length === 4) {
        match.status = 'confirmed';
        const court = findAvailableCourt(match.clubId, new Date(match.startTime), new Date(match.endTime));
        if (court) {
            match.courtNumber = court.courtNumber;
        } else {
            console.error(`CRITICAL: No court available for confirmed match ${matchId}.`);
            match.courtNumber = 99; // Indicate an issue
        }
        _annulConflictingActivities(match);
        for (const player of match.bookedPlayers) {
            await removeUserPreInscriptionsForDay(player.userId, new Date(match.startTime), match.id, 'match');
        }
    }

    state.updateMatchInState(matchId, match);

    // After booking, recalculate blocked credit for the user
    await recalculateAndSetBlockedBalances(userId);

    return { newBooking, updatedMatch: match };
};


export const addMatch = async (matchData: Omit<Match, 'id' | 'status' | 'confirmedPrivateSize' | 'organizerId' | 'privateShareCode'> & { creatorId?: string }): Promise<Match | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    if (!matchData.clubId) return { error: "Se requiere el ID del club." };
    if (!matchData.startTime || !matchData.endTime || new Date(matchData.startTime) >= new Date(matchData.endTime)) {
        return { error: 'La hora de inicio debe ser anterior a la hora de fin.' };
    }
    const startTimeDate = new Date(matchData.startTime);
    const endTimeDate = new Date(matchData.endTime);

    // Conflict check for creator (instructor)
    if (matchData.creatorId) {
        const creator = state.getMockInstructors().find(inst => inst.id === matchData.creatorId);
        if (creator) {
            if (creator.isAvailable === false) {
                return { error: `El creador (${creator.name}) no está disponible actualmente (configuración general).` };
            }
            const dayKey = dayOfWeekArray[getDay(startTimeDate)];
            const creatorUnavailableRanges = creator.unavailableHours?.[dayKey] || [];
            for (const unavailableRange of creatorUnavailableRanges) {
                const unavailableStart = parse(unavailableRange.start, 'HH:mm', startTimeDate);
                const unavailableEnd = parse(unavailableRange.end, 'HH:mm', startTimeDate);
                if (areIntervalsOverlapping(
                    { start: startTimeDate, end: endTimeDate },
                    { start: unavailableStart, end: unavailableEnd },
                    { inclusive: false }
                )) {
                    return { error: `El creador (${creator.name}) no está disponible de ${unavailableRange.start} a ${unavailableRange.end} los ${format(startTimeDate, 'eeee', { locale: es })}.` };
                }
            }
             const instructorIsAlreadyBookedWithClass = state.getMockTimeSlots().find(
                existingSlot => existingSlot.instructorId === creator.id &&
                                existingSlot.clubId === matchData.clubId &&
                                existingSlot.status !== 'cancelled' &&
                                areIntervalsOverlapping(
                                    { start: startTimeDate, end: endTimeDate },
                                    { start: new Date(existingSlot.startTime), end: new Date(existingSlot.endTime) },
                                    { inclusive: false }
                                )
            );
            if (instructorIsAlreadyBookedWithClass) {
                return { error: `El creador (${creator.name}) ya tiene una clase en ${instructorIsAlreadyBookedWithClass.clubId} Pista ${instructorIsAlreadyBookedWithClass.courtNumber} de ${format(new Date(instructorIsAlreadyBookedWithClass.startTime), 'HH:mm')} a ${format(new Date(instructorIsAlreadyBookedWithClass.endTime), 'HH:mm')}.` };
            }
        }
    }

    // Conflict check for court
    if (matchData.courtNumber) {
        const existingBlockingActivity = mockUtils.findConflictingConfirmedActivity({
            startTime: startTimeDate,
            endTime: endTimeDate,
            clubId: matchData.clubId,
            courtNumber: matchData.courtNumber,
        } as TimeSlot, state.getMockTimeSlots(), state.getMockMatches());

        if (existingBlockingActivity) {
            const activityType = 'instructorName' in existingBlockingActivity ? 'clase' : 'partida';
            return { error: `La Pista ${matchData.courtNumber} ya está reservada por una ${activityType} confirmada a esta hora.` };
        }
    }


    const newMatch: Match = {
        id: (matchData as Match).id || `match-${Date.now()}-${Math.random().toString(36).substring(7)}`, // Use provided ID if exists (for updates), else generate
        clubId: matchData.clubId,
        startTime: startTimeDate,
        endTime: endTimeDate,
        courtNumber: (matchData.bookedPlayers || []).length === 4 ? matchData.courtNumber : undefined,
        level: matchData.level || matchPadelLevels[0],
        category: matchData.category || 'abierta',
        bookedPlayers: matchData.bookedPlayers || [],
        gratisSpotAvailable: matchData.gratisSpotAvailable || false,
        isPlaceholder: matchData.isPlaceholder || false,
        status: (matchData.bookedPlayers || []).length === 4 ? 'confirmed' : 'forming',
        organizerId: undefined,
        privateShareCode: undefined,
        confirmedPrivateSize: undefined,
        eventId: matchData.eventId,
        totalCourtFee: matchData.totalCourtFee,
        durationMinutes: matchData.durationMinutes || 90,
        isProMatch: matchData.isProMatch || false,
    };
    state.addMatchToState(newMatch);

    if (matchData.bookedPlayers && matchData.bookedPlayers.length > 0) {
        matchData.bookedPlayers.forEach(player => {
            const student = getMockStudents().find(s => s.id === player.userId) || (state.getMockCurrentUser()?.id === player.userId ? state.getMockCurrentUser() : { name: 'Jugador Desc.' });
            state.addUserMatchBookingToState({
                id: `matchbooking-${newMatch.id}-${player.userId}-${Date.now()}-${Math.random()}`,
                userId: player.userId,
                activityId: newMatch.id,
                activityType: 'match',
                bookedAt: new Date(),
                matchDetails: { ...newMatch, clubId: newMatch.clubId, startTime: new Date(newMatch.startTime), endTime: new Date(newMatch.endTime), bookedPlayers: newMatch.bookedPlayers.map(p => ({ userId: p.userId, name: p.name || (p.userId === player.userId ? student?.name : undefined) })) }
            });
        });
    }

    if (!newMatch.isPlaceholder) {
        _annulConflictingActivities(newMatch);
    }

    return { ...newMatch };
};

export const deleteMatch = async (matchId: string): Promise<{ success: true, message: string } | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const matchToDelete = state.getMockMatches().find(m => m.id === matchId);
    if (!matchToDelete) return { error: 'Partida no encontrada.' };

    let refundMessage = "";
    let playersRefundedCount = 0;

    if (!matchToDelete.isPlaceholder) {
        const club = state.getMockClubs().find(c => c.id === matchToDelete.clubId);
        const price = club ? calculateActivityPrice(club, new Date(matchToDelete.startTime)) : 0;
        for (const player of (matchToDelete.bookedPlayers || [])) {
            const booking = state.getMockUserMatchBookings().find(b => b.activityId === matchId && b.userId === player.userId);
            if (booking) {
                if (booking.bookedWithPoints) {
                    const pointsToRefund = calculatePricePerPerson(price || 0, 4);
                    await addUserPointsAndAddTransaction(player.userId, pointsToRefund, 'reembolso_error_reserva', `Devolución puntos por cancelación de partida (Admin)`, matchId, matchToDelete.clubId);
                    refundMessage += ` ${player.name || player.userId.slice(0,6)} (+${pointsToRefund} pts).`;
                } else if (matchToDelete.clubId) {
                    const creditToRefund = calculatePricePerPerson(price, 4);
                    await addCreditToStudent(player.userId, creditToRefund, `Reembolso partida cancelada por admin ${format(new Date(matchToDelete.startTime), "dd/MM")}`);
                    refundMessage += ` ${player.name || player.userId.slice(0,6)} (+${creditToRefund.toFixed(2)}€).`;
                }
                playersRefundedCount++;
            }
        }
    }

    state.removeMatchFromState(matchId);
    state.removeUserMatchBookingFromStateByMatch(matchId);

    const mainMessage = `Partida ${matchToDelete.isPlaceholder ? 'placeholder ' : ''}cancelada exitosamente.`;
    const finalMessage = (playersRefundedCount > 0 && !matchToDelete.isPlaceholder) ? `${mainMessage} ${refundMessage}` : `${mainMessage} ${matchToDelete.isPlaceholder ? '' : 'No había jugadores con coste para reembolsar.'}`;

    return { success: true, message: finalMessage };
};

export const cancelMatchBooking = async (
    userId: string,
    bookingId: string
): Promise<{ success: true, updatedMatch: Match, message?: string, pointsAwarded?: number, penaltyApplied?: boolean } | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const bookingIndex = state.getMockUserMatchBookings().findIndex(b => b.id === bookingId && b.userId === userId);
    if (bookingIndex === -1) return { error: "Reserva de partida no encontrada." };

    const booking = state.getMockUserMatchBookings()[bookingIndex];
    const match = state.getMockMatches().find(m => m.id === booking.activityId);

    if (!match) {
        state.removeUserMatchBookingFromState(booking.id);
        return { success: true, updatedMatch: {} as Match, message: 'Tu inscripción para una partida ya eliminada ha sido borrada.' };
    }

    const club = state.getMockClubs().find(c => c.id === match.clubId);
    const price = club ? calculateActivityPrice(club, new Date(match.startTime)) : 0;
    let message = 'Inscripción cancelada.';
    let pointsAwarded = 0;
    let penaltyApplied = false;

    if (match.status === 'confirmed' || match.status === 'confirmed_private') {
        const pricePaid = calculatePricePerPerson(price || 0, 4);
        const basePointsToAward = Math.round(pricePaid * (club?.pointSettings?.cancellationPointPerEuro || 0));
        pointsAwarded = basePointsToAward;
        
        const hoursDifference = differenceInHours(new Date(match.startTime), new Date());
        const penaltyTiers = club?.pointSettings?.cancellationPenaltyTiers?.sort((a,b) => a.hoursBefore - b.hoursBefore) || [];
        const applicableTier = penaltyTiers.find(tier => hoursDifference < tier.hoursBefore);
        let penaltyMessage = "";

        if (applicableTier) {
            const penaltyAmount = Math.round(basePointsToAward * (applicableTier.penaltyPercentage / 100));
            pointsAwarded -= penaltyAmount;
            penaltyMessage = ` Se ha aplicado una penalización del ${applicableTier.penaltyPercentage}% por cancelación tardía.`;
            penaltyApplied = true;
        }

        if (pointsAwarded > 0) {
            await addUserPointsAndAddTransaction(userId, pointsAwarded, 'cancelacion_partida', `Bonificación por cancelación de partida confirmada`, booking.activityId, match.clubId);
        }
        message = `Cancelación Bonificada: Tu plaza se liberará como "Gratis". Has recibido ${pointsAwarded} puntos.${penaltyMessage}`;

    } else { // Pre-registration cancellation ('forming')
        const penaltyPoints = club?.pointSettings?.unconfirmedCancelPenaltyPoints ?? 1;
        await addUserPointsAndAddTransaction(userId, -penaltyPoints, 'penalizacion_cancelacion_no_confirmada', 'Penalización por cancelación de partida no confirmada', booking.activityId, match.clubId);
        message += ` Se ha aplicado una penalización de ${penaltyPoints} punto(s).`;
        penaltyApplied = true;
    }

    const removalResult = await removePlayerFromMatch(match.id, userId, true);
    if ('error' in removalResult) return removalResult;

    return {
        success: true,
        updatedMatch: removalResult.updatedMatch,
        message,
        pointsAwarded: pointsAwarded > 0 ? pointsAwarded : undefined,
        penaltyApplied
    };
};

export const removePlayerFromMatch = async (matchId: string, userId: string, isSystemRemoval: boolean = false): Promise<{ success: true, updatedMatch: Match, message: string } | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const matchIndex = state.getMockMatches().findIndex(m => m.id === matchId);
    if (matchIndex === -1) return { error: 'Partida no encontrada.' };

    const originalMatch = JSON.parse(JSON.stringify(state.getMockMatches()[matchIndex])) as Match;
    const playerBooking = state.getMockUserMatchBookings().find(b => b.activityId === matchId && b.userId === userId);
    let message = "";

    if (!originalMatch.bookedPlayers.some(p => p.userId === userId)) return { error: 'Jugador no encontrado en esta partida.' };
    if (originalMatch.isPlaceholder && !isSystemRemoval) return { error: "No se pueden eliminar jugadores de una tarjeta de partida abierta placeholder."};

    if (!isSystemRemoval) {
        const club = state.getMockClubs().find(c => c.id === originalMatch.clubId);
        if (!club) return { error: "Club no encontrado" };
        const price = calculateActivityPrice(club, new Date(originalMatch.startTime));
        if (playerBooking?.bookedWithPoints) {
            const pointsToRefund = calculatePricePerPerson(price || 0, 4);
            await addUserPointsAndAddTransaction(userId, pointsToRefund, 'reembolso_error_reserva', `Devolución puntos por eliminación de partida (Admin)`, matchId, originalMatch.clubId);
            message = `Jugador eliminado. ${pointsToRefund} puntos devueltos.`;
        } else if (originalMatch.clubId) {
            const creditToRefund = calculatePricePerPerson(price, 4);
            await addCreditToStudent(userId, creditToRefund, `Reembolso partida cancelada por admin ${format(new Date(originalMatch.startTime), "dd/MM")}`);
            message = `Jugador eliminado. ${creditToRefund.toFixed(2)}€ devueltos.`;
        } else {
            message = "Jugador eliminado de la partida.";
        }
    } else {
        message = "Has sido eliminado de la partida por saldo insuficiente."; // Simple message for system removal
    }


    const updatedBookedPlayers = originalMatch.bookedPlayers.filter(p => p.userId !== userId);
    let newGratisSpotAvailable = originalMatch.gratisSpotAvailable;

    const wasConfirmed = originalMatch.bookedPlayers.length === 4;
    const isNowNotConfirmed = updatedBookedPlayers.length < 4;

    if (wasConfirmed && isNowNotConfirmed) {
        if (!originalMatch.gratisSpotAvailable) {
            newGratisSpotAvailable = true;
        }
    } else if (updatedBookedPlayers.length < 3) {
        newGratisSpotAvailable = false;
    }

    const updatedMatch: Match = {
        ...originalMatch,
        bookedPlayers: updatedBookedPlayers,
        gratisSpotAvailable: newGratisSpotAvailable,
        status: (originalMatch.status === 'confirmed_private' || originalMatch.status === 'confirmed') ? 'confirmed' : 'forming',
    };
    state.updateMatchInState(originalMatch.id, updatedMatch);
    state.removeUserMatchBookingFromStateByMatchAndUser(matchId, userId);

    if (originalMatch.status === 'confirmed' && updatedMatch.status === 'forming') {
        const hasOpenPlaceholder = state.getMockMatches().some(m =>
            m.clubId === updatedMatch.clubId &&
            m.courtNumber === updatedMatch.courtNumber &&
            new Date(m.startTime).getTime() === new Date(updatedMatch.startTime).getTime() &&
            m.isPlaceholder === true
        );
        if (!hasOpenPlaceholder) {
            const newPlaceholder: Match = {
                id: `match-open-${updatedMatch.clubId}-${updatedMatch.courtNumber}-${format(new Date(updatedMatch.startTime), 'yyyyMMddHHmm')}-reopened-${Date.now().toString().slice(-4)}`,
                clubId: updatedMatch.clubId,
                startTime: new Date(updatedMatch.startTime),
                endTime: new Date(updatedMatch.endTime),
                courtNumber: undefined,
                level: 'abierto',
                category: 'abierta',
                bookedPlayers: [],
                gratisSpotAvailable: false,
                isPlaceholder: true,
                status: 'forming',
                durationMinutes: updatedMatch.durationMinutes,
            };
            state.addMatchToState(newPlaceholder);
        }
    }

    await recalculateAndSetBlockedBalances(userId);

    return { success: true, updatedMatch: JSON.parse(JSON.stringify(updatedMatch)), message };
};

export function createMatchesForDay(club: Club, date: Date): Match[] {
    const matchesForDay: Match[] = [];
    const startHour = 9;
    const endHour = 22;
    const matchDurationMinutes = 90;
    const timeSlotIntervalMinutes = 30; // Check every 30 minutes for a potential start

    const dayKey = dayOfWeekArray[getDay(date)];
    const clubUnavailableRanges = club.unavailableMatchHours?.[dayKey] || [];
    
    // Check only for confirmed activities that would block a slot
    const confirmedActivitiesToday = [
        ...state.getMockTimeSlots().filter(s => isSameDay(new Date(s.startTime), date) && s.clubId === club.id && s.courtNumber !== undefined && (s.status === 'confirmed' || s.status === 'confirmed_private')),
        ...state.getMockMatches().filter(m => isSameDay(new Date(m.startTime), date) && m.clubId === club.id && m.courtNumber !== undefined && (m.status === 'confirmed' || m.status === 'confirmed_private')),
    ];

    let currentTimeSlotStart = setMinutes(setHours(date, startHour), 0);
    const endOfDayOperations = setHours(date, endHour);

    while (currentTimeSlotStart < endOfDayOperations) {
        const matchStartTime = new Date(currentTimeSlotStart);

        // Check against unavailable blocks defined in club settings
        const isUnavailableBlock = clubUnavailableRanges.some(range => {
            const unavailableStart = parse(range.start, 'HH:mm', matchStartTime);
            const unavailableEnd = parse(range.end, 'HH:mm', matchStartTime);
            return matchStartTime >= unavailableStart && matchStartTime < unavailableEnd;
        });

        if (isUnavailableBlock) {
            currentTimeSlotStart = addMinutes(currentTimeSlotStart, timeSlotIntervalMinutes);
            continue;
        }
        
       const hasConfirmedConflict = confirmedActivitiesToday.some(activity => 
             areIntervalsOverlapping(
                { start: matchStartTime, end: addMinutes(matchStartTime, matchDurationMinutes) },
                { start: new Date(activity.startTime), end: new Date('endTime' in activity ? activity.endTime : addMinutes(new Date(activity.startTime), 90)) },
                { inclusive: false }
            )
        );

        if (hasConfirmedConflict) {
             currentTimeSlotStart = addMinutes(currentTimeSlotStart, timeSlotIntervalMinutes);
            continue;
        }

        const existingIdenticalProposal = matchesForDay.find(m =>
            new Date(m.startTime).getTime() === matchStartTime.getTime()
        );

        if (existingIdenticalProposal) {
            currentTimeSlotStart = addMinutes(currentTimeSlotStart, timeSlotIntervalMinutes);
            continue;
        }
        
        const newMatch: Match = {
            id: `match-ph-${club.id}-${format(matchStartTime, 'yyyyMMddHHmm')}`,
            clubId: club.id,
            startTime: matchStartTime,
            endTime: addMinutes(matchStartTime, matchDurationMinutes),
            level: 'abierto',
            category: 'abierta',
            bookedPlayers: [],
            isPlaceholder: true,
            status: 'forming',
            durationMinutes: matchDurationMinutes,
        };

        matchesForDay.push(newMatch);
        currentTimeSlotStart = addMinutes(currentTimeSlotStart, timeSlotIntervalMinutes);
    }
    return matchesForDay;
}

export const bookCourtForMatchWithPoints = async (
    userId: string,
    matchId: string,
): Promise<{ updatedMatch: Match } | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    
    const user = state.getMockUserDatabase().find(u => u.id === userId);
    if (!user) return { error: "Usuario no encontrado." };

    const matchIndex = state.getMockMatches().findIndex(m => m.id === matchId);
    if (matchIndex === -1) return { error: "Partida no encontrada." };

    const match = { ...state.getMockMatches()[matchIndex] };
    if (!match.isPlaceholder) {
        return { error: "Esta partida ya ha sido iniciada por otro jugador." };
    }

    const club = state.getMockClubs().find(c => c.id === match.clubId);
    if (!club) return { error: "Club no encontrado para esta partida." };

    const pointsCost = club.pointSettings?.pointsCostForCourt ?? 0;
    if ((user.loyaltyPoints ?? 0) < pointsCost) {
        return { error: `Puntos insuficientes. Se requieren ${pointsCost} puntos.` };
    }

    // Deduct points
    await addUserPointsAndAddTransaction(
        userId,
        -pointsCost,
        'reserva_pista_puntos',
        `Reserva de pista con puntos para partida`,
        matchId,
        club.id
    );

    const privateShareCode = `privmatch-${matchId.slice(-6)}-${Date.now().toString().slice(-6)}`;
    
    // Update the match
    match.isPlaceholder = false;
    match.status = 'confirmed_private';
    match.organizerId = userId;
    match.bookedPlayers = [{ userId: user.id, name: user.name }];
    match.confirmedPrivateSize = 4;
    match.privateShareCode = privateShareCode;
    match.totalCourtFee = 0; // It's a points-based booking

    state.updateMatchInState(matchId, match);

    // Create a booking for the organizer
    const newBooking: MatchBooking = {
        id: `matchbooking-${matchId}-${userId}-${Date.now()}`,
        userId,
        activityId: matchId,
        activityType: 'match',
        bookedAt: new Date(),
        bookedWithPoints: true,
        isOrganizerBooking: true,
        matchDetails: { ...match }
    };
    state.addUserMatchBookingToState(newBooking);

    return { updatedMatch: match };
};


export const confirmMatchAsPrivate = async (
    organizerUserId: string,
    matchId: string,
    isRecurring: boolean // Added for future use, not yet implemented in state
): Promise<{ updatedMatch: Match; shareLink: string } | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const organizerUser = state.getMockUserDatabase().find(u => u.id === organizerUserId);
    if (!organizerUser) return { error: "Usuario organizador no encontrado." };

    const matchIndex = state.getMockMatches().findIndex(m => m.id === matchId);
    if (matchIndex === -1) return { error: "Partida no encontrada." };

    let matchToConfirm = JSON.parse(JSON.stringify(state.getMockMatches()[matchIndex])) as Match;

    if (matchToConfirm.isPlaceholder !== true) {
        return { error: "Solo se puede confirmar como privada una partida abierta (placeholder)." };
    }

    if ((matchToConfirm.bookedPlayers || []).length > 0) {
        return { error: "No se puede confirmar como privada, esta partida ya tiene jugadores." };
    }
    
    const club = state.getMockClubs().find(c => c.id === matchToConfirm.clubId);
    if (!club) return { error: "Club no encontrado para esta partida." };
    
    const totalPrice = calculateActivityPrice(club, new Date(matchToConfirm.startTime));

    if ((organizerUser.credit ?? 0) < totalPrice) {
        return { error: `Saldo insuficiente. Necesitas ${totalPrice.toFixed(2)}€ y tienes ${(organizerUser.credit ?? 0).toFixed(2)}€.` };
    }

    const availableCourt = findAvailableCourt(matchToConfirm.clubId, new Date(matchToConfirm.startTime), new Date(matchToConfirm.endTime));
    if (!availableCourt) {
        return { error: "No hay pistas disponibles en este momento para confirmar la partida." };
    }

    deductCredit(organizerUserId, totalPrice, matchToConfirm, 'Partida');

    const privateShareCode = `privmatch-${matchId.slice(-6)}-${Date.now().toString().slice(-6)}`;

    matchToConfirm.status = 'confirmed_private';
    matchToConfirm.organizerId = organizerUserId;
    matchToConfirm.privateShareCode = privateShareCode;
    matchToConfirm.confirmedPrivateSize = 4;
    matchToConfirm.courtNumber = availableCourt.courtNumber;
    matchToConfirm.bookedPlayers = [{ userId: organizerUserId, name: organizerUser.name }];
    matchToConfirm.isPlaceholder = false; // It's no longer a placeholder
    matchToConfirm.isRecurring = isRecurring;
    matchToConfirm.totalCourtFee = totalPrice;

    state.updateMatchInState(matchId, matchToConfirm);

    // Create the organizer's booking record
    const newOrganizerBooking: MatchBooking = {
        id: `privmatchbooking-${matchId}-${organizerUserId}-${Date.now()}`,
        userId: organizerUserId,
        activityId: matchId,
        activityType: 'match',
        bookedAt: new Date(),
        isOrganizerBooking: true,
        matchDetails: { ...matchToConfirm }
    };
    state.addUserMatchBookingToState(newOrganizerBooking);

    _annulConflictingActivities(matchToConfirm);
    await recalculateAndSetBlockedBalances(organizerUserId);

    const shareLink = `/?view=partidas&code=${privateShareCode}`;
    return { updatedMatch: JSON.parse(JSON.stringify(matchToConfirm)), shareLink };
};

export const joinPrivateMatch = async (
    inviteeUserId: string,
    matchId: string,
    shareCode: string
): Promise<{ newBooking: MatchBooking; updatedMatch: Match; organizerRefundAmount: number } | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const inviteeUser = state.getMockUserDatabase().find(u => u.id === inviteeUserId);
    if (!inviteeUser) return { error: "Usuario no encontrado." };

    const matchIndex = state.getMockMatches().findIndex(m => m.id === matchId && m.privateShareCode === shareCode);
    if (matchIndex === -1) return { error: "Partida privada no encontrada o código incorrecto." };

    let match = { ...state.getMockMatches()[matchIndex] };
    if (match.status !== 'confirmed_private') return { error: "Esta partida no es privada." };
    if ((match.bookedPlayers || []).length >= 4) return { error: "Esta partida privada ya está completa." };
    if ((match.bookedPlayers || []).some(p => p.userId === inviteeUserId)) return { error: "Ya estás en esta partida." };
    
    const club = state.getMockClubs().find(c => c.id === match.clubId);
    if (!club) return { error: "Club no encontrado."};

    const pricePerPerson = calculatePricePerPerson(calculateActivityPrice(club, new Date(match.startTime)), 4);
    
    if ((inviteeUser.credit ?? 0) < pricePerPerson) {
        return { error: `Saldo insuficiente. Necesitas ${pricePerPerson.toFixed(2)}€.` };
    }

    deductCredit(inviteeUserId, pricePerPerson, match, 'Partida');
    
    if (match.organizerId) {
        addCreditToStudent(match.organizerId, pricePerPerson, `Reembolso por invitado: ${inviteeUser.name}`);
    }

    match.bookedPlayers.push({ userId: inviteeUserId, name: inviteeUser.name });
    state.updateMatchInState(matchId, match);

    const newBooking: MatchBooking = {
        id: `matchbooking-${matchId}-${inviteeUserId}-${Date.now()}`,
        userId: inviteeUserId,
        activityId: matchId,
        activityType: 'match',
        bookedAt: new Date(),
        amountPaidByInvitee: pricePerPerson,
        matchDetails: { ...match }
    };
    state.addUserMatchBookingToState(newBooking);
    
    return { newBooking, updatedMatch: match, organizerRefundAmount: pricePerPerson };
};

export const makeMatchPublic = async (
    organizerUserId: string,
    matchId: string
): Promise<{ success: true, updatedMatch: Match } | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const matchIndex = state.getMockMatches().findIndex(m => m.id === matchId);
    if (matchIndex === -1) return { error: "Partida no encontrada." };
    
    let match = { ...state.getMockMatches()[matchIndex] };
    if (match.organizerId !== organizerUserId) return { error: "Solo el organizador puede hacer pública la partida." };
    if (match.status !== 'confirmed_private') return { error: "Esta partida ya es pública o está en otro estado." };

    match.status = 'forming';
    match.organizerId = undefined;
    match.privateShareCode = undefined;
    match.confirmedPrivateSize = undefined;
    // Don't modify bookedPlayers or fees, as payments are managed manually from this point.
    
    state.updateMatchInState(matchId, match);
    return { success: true, updatedMatch: match };
};

export const countAvailableGratisMatches = (clubId?: string | null): number => {
    const matchesToCheck = clubId ? state.getMockMatches().filter(m => m.clubId === clubId) : state.getMockMatches();
    return matchesToCheck.filter(match => 
        !match.eventId && // Exclude match-day matches
        (match.status === 'confirmed' || match.status === 'confirmed_private') &&
        match.gratisSpotAvailable &&
        (match.bookedPlayers || []).length === 3
    ).length;
};

export const cancelPrivateMatchAndReofferWithPoints = async (organizerUserId: string, matchId: string): Promise<{ success: true, newPlaceholderMatch: Match } | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const matchIndex = state.getMockMatches().findIndex(m => m.id === matchId);
    if (matchIndex === -1) return { error: "Partida no encontrada." };

    const match = state.getMockMatches()[matchIndex];
    if (match.organizerId !== organizerUserId || match.status !== 'confirmed_private') {
        return { error: "No tienes permiso para realizar esta acción o la partida no es privada." };
    }

    const club = state.getMockClubs().find(c => c.id === match.clubId);
    if (!club) return { error: "Club no encontrado." };

    // 1. Refund the organizer
    const refundAmount = match.totalCourtFee || 0;
    if (refundAmount > 0) {
        await addCreditToStudent(organizerUserId, refundAmount, `Reembolso por cancelación de partida privada y oferta por puntos.`);
    }

    // 2. Remove the private match and its bookings
    state.removeMatchFromState(matchId);
    state.removeUserMatchBookingFromStateByMatch(matchId);

    // 3. Create a new placeholder match that can only be booked with points
    const pointsCost = club.pointSettings?.pointsCostForCourt || 20;
    const newPlaceholder: Match = {
        id: `match-ph-points-${match.clubId}-${format(new Date(match.startTime), 'yyyyMMddHHmm')}`,
        clubId: match.clubId,
        startTime: match.startTime,
        endTime: match.endTime,
        level: 'abierto',
        category: 'abierta',
        bookedPlayers: [],
        isPlaceholder: true,
        status: 'forming',
        totalCourtFee: 0, // No direct euro cost
        isPointsOnlyBooking: true, // Custom flag to identify this type of match
        durationMinutes: match.durationMinutes,
    };
    state.addMatchToState(newPlaceholder);

    return { success: true, newPlaceholderMatch: newPlaceholder };
};
    
export const renewRecurringMatch = async (userId: string, completedMatchId: string): Promise<{ success: true, newMatch: Match } | { error: string }> => {
  await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
  
  const completedMatch = state.getMockMatches().find(m => m.id === completedMatchId);
  if (!completedMatch || completedMatch.organizerId !== userId || !completedMatch.isRecurring) {
    return { error: "Partida no válida para renovación." };
  }
  
  const provisionalMatch = state.getMockMatches().find(m => m.id === completedMatch.nextRecurringMatchId);
  if (!provisionalMatch || !provisionalMatch.isProvisional) {
    return { error: "No se encontró la reserva provisional para renovar." };
  }
  
  if (new Date(provisionalMatch.provisionalExpiresAt!) < new Date()) {
    return { error: "El tiempo para renovar esta reserva ha expirado." };
  }
  
  // This essentially confirms the provisional match, turning it into a real private match.
  const result = await confirmMatchAsPrivate(userId, provisionalMatch.id, true);
  
  if ('error' in result) {
    return result;
  }
  
  return { success: true, newMatch: result.updatedMatch };
};

export const fetchUserMatchBookings = async (userId: string): Promise<MatchBooking[]> => {
  await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
  const userBookingsData = state.getMockUserMatchBookings().filter(booking => booking.userId === userId);
  return userBookingsData.map(booking => {
    const match = state.getMockMatches().find(m => m.id === booking.activityId);
    return {
      ...booking,
      bookedAt: new Date(booking.bookedAt),
      matchDetails: match ? {
        id: match.id,
        clubId: match.clubId,
        startTime: new Date(match.startTime),
        endTime: new Date(match.endTime),
        courtNumber: match.courtNumber,
        level: match.level,
        category: match.category,
        bookedPlayers: JSON.parse(JSON.stringify(match.bookedPlayers || [])),
        totalCourtFee: match.totalCourtFee,
        status: match.status,
        organizerId: match.organizerId,
        privateShareCode: match.privateShareCode,
        isRecurring: match.isRecurring,
        nextRecurringMatchId: match.nextRecurringMatchId,
        eventId: match.eventId,
        durationMinutes: match.durationMinutes,
      } : booking.matchDetails
    };
  });
};

export const fillMatchAndMakePrivate = async (userId: string, matchId: string): Promise<{ updatedMatch: Match; cost: number } | { error: string }> => {
  await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));

  const user = state.getMockUserDatabase().find(u => u.id === userId);
  if (!user) return { error: "Usuario no encontrado." };

  const matchIndex = state.getMockMatches().findIndex(m => m.id === matchId);
  if (matchIndex === -1) return { error: "Partida no encontrada." };

  let match = { ...state.getMockMatches()[matchIndex] };
  const club = state.getMockClubs().find(c => c.id === match.clubId);
  if (!club) return { error: "Club no encontrado." };

  if (match.status !== 'forming') {
    return { error: "Solo se pueden hacer privadas las partidas en formación." };
  }

  const playersInMatch = match.bookedPlayers || [];
  if (!playersInMatch.some(p => p.userId === userId)) {
    return { error: "Debes estar inscrito en la partida para hacerla privada." };
  }
  
  const emptySpots = 4 - playersInMatch.length;
  if (emptySpots <= 0) {
    return { error: "La partida ya está llena." };
  }
  
  const pricePerPlayer = calculatePricePerPerson(calculateActivityPrice(club, new Date(match.startTime)), 4);
  const totalCost = emptySpots * pricePerPlayer;

  if (((user.credit ?? 0) - (user.blockedCredit ?? 0)) < totalCost) {
    return { error: `Saldo insuficiente. Necesitas ${totalCost.toFixed(2)}€.` };
  }
  
  const availableCourt = findAvailableCourt(match.clubId, new Date(match.startTime), new Date(match.endTime));
    if (!availableCourt) {
        return { error: "No hay pistas disponibles en este momento para confirmar la partida." };
    }

  // Deduct credit for the remaining spots
  deductCredit(userId, totalCost, match, 'Partida');

  // Update match state
  match.status = 'confirmed_private';
  match.organizerId = userId; // The user who pays becomes the organizer
  match.privateShareCode = `privmatch-${matchId.slice(-6)}-${Date.now().toString().slice(-6)}`;
  match.courtNumber = availableCourt.courtNumber;
  
  state.updateMatchInState(matchId, match);
  _annulConflictingActivities(match);

  return { updatedMatch: match, cost: totalCost };
};
    
