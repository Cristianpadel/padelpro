"use client";

import { addHours, setHours, setMinutes, startOfDay, format, isSameDay, addDays, addMinutes, eachMinuteOfInterval, isEqual, areIntervalsOverlapping, parseISO, getDay, parse, differenceInHours } from 'date-fns';
import { es } from 'date-fns/locale';
import type { TimeSlot, PadelCategoryForSlot, Booking, MatchPadelLevel, ClassPadelLevel, PadelLevelRange, User, Club, UserDB, ClubLevelRange, Instructor, DayOfWeek, TimeRange } from '@/types';
import { padelCategoryForSlotOptions, matchPadelLevels, daysOfWeek as dayOfWeekArray, numericMatchPadelLevels } from '@/types';
import * as state from '../state';
import * as config from '../config';
import * as mockUtils from '../utils';
import { addUserPointsAndAddTransaction, recalculateAndSetBlockedBalances, confirmAndAwardPendingPoints, deductCredit, addCreditToStudent } from './users';
import { calculatePricePerPerson } from '../utils';
import { _classifyLevelAndCategoryForSlot } from '../mockDataSources/classProposals';
import { removeBookingFromTimeSlotInState } from '../state';
import { calculateActivityPrice, getInstructorRate } from './clubs';


export const bookClass = async (
    userId: string,
    slotId: string,
    groupSize: 1 | 2 | 3 | 4,
    spotIndexToBook: number | undefined // The visual index of the spot being clicked
): Promise<{ booking: Booking, updatedSlot: TimeSlot } | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const studentUser = state.getMockUserDatabase().find(u => u.id === userId);
    if (!studentUser) return { error: 'Usuario no encontrado.' };

    const slotIndex = state.getMockTimeSlots().findIndex(s => s.id === slotId);
    if (slotIndex === -1) return { error: 'Clase no encontrada.' };

    let slotToBook = JSON.parse(JSON.stringify(state.getMockTimeSlots()[slotIndex]));
    const club = state.getMockClubs().find(c => c.id === slotToBook.clubId);
    if (!club) return { error: 'Club no encontrado para esta clase.' };
    
    const instructor = state.getMockInstructors().find(i => i.id === slotToBook.instructorId);
    if (!instructor) return { error: 'Instructor no encontrado para esta clase.' };

    const price = calculateActivityPrice(club, new Date(slotToBook.startTime)) + getInstructorRate(instructor, new Date(slotToBook.startTime));
    slotToBook.totalPrice = price; // Ensure totalPrice is up-to-date

    // Check if the user is already booked in the *specific* groupSize option of this slot
    if ((slotToBook.bookedPlayers || []).some(p => p.userId === userId && p.groupSize === groupSize)) {
        return { error: 'Ya estás inscrito en esta opción de la clase.' };
    }
    if (mockUtils.hasAnyConfirmedActivityForDay(userId, new Date(slotToBook.startTime), slotId, 'class')) {
        return { error: 'Ya tienes otra actividad confirmada para este día.' };
    }

    const { newLevel, newCategory } = _classifyLevelAndCategoryForSlot(slotToBook, studentUser as User, club);
    if (!mockUtils.isUserLevelCompatibleWithActivity(newLevel, studentUser.level)) {
        return { error: 'Tu nivel de juego no es compatible con el de esta clase.' };
    }

    slotToBook.level = newLevel;
    slotToBook.category = newCategory;


    const isGratisBooking = slotToBook.designatedGratisSpotPlaceholderIndexForOption?.[groupSize] === spotIndexToBook;
    
    // For 1-person classes, the cost is the total price. For others, it's per person.
    const priceToPay = groupSize === 1 ? price : calculatePricePerPerson(price, groupSize);

    if (isGratisBooking) {
        const pointsCost = calculatePricePerPerson(price, 1);
        if ((studentUser.loyaltyPoints ?? 0) < pointsCost) {
            return { error: `No tienes suficientes puntos para canjear esta plaza gratis. Necesitas ${pointsCost} y tienes ${(studentUser.loyaltyPoints ?? 0)}.` };
        }
    } else {
        if ((studentUser.credit ?? 0) < priceToPay) {
            return { error: `Saldo insuficiente. Necesitas ${priceToPay.toFixed(2)}€.` };
        }
    }

    const newBooking: Booking = {
        id: `booking-${slotId}-${userId}-${groupSize}-${Date.now()}`,
        userId,
        activityId: slotId,
        activityType: 'class',
        groupSize,
        spotIndex: spotIndexToBook!,
        status: 'pending',
        bookedWithPoints: isGratisBooking,
        amountBlocked: isGratisBooking ? calculatePricePerPerson(price, 1) : undefined,
    };

    if (slotToBook.designatedGratisSpotPlaceholderIndexForOption?.[groupSize] === spotIndexToBook) {
        slotToBook.designatedGratisSpotPlaceholderIndexForOption[groupSize] = null;
    }

    slotToBook.bookedPlayers.push({ userId, groupSize });
    state.addUserBookingToState(newBooking);

    await recalculateAndSetBlockedBalances(userId);

    // If it's a 1-person booking, it's a private class and confirms immediately.
    const isPrivateClassConfirmation = groupSize === 1;
    const { completed, size } = mockUtils.isSlotEffectivelyCompleted(slotToBook);

    if ((completed && size !== null) || isPrivateClassConfirmation) {
        const finalConfirmedSize = isPrivateClassConfirmation ? 1 : size!;
        const confirmedSlot = { ...slotToBook, status: isPrivateClassConfirmation ? 'confirmed_private' : 'confirmed', confirmedPrivateSize: isPrivateClassConfirmation ? 1 : undefined, organizerId: isPrivateClassConfirmation ? userId : undefined };

        if(!isGratisBooking) {
            if (isPrivateClassConfirmation) {
                // Charge the full price for the private class
                deductCredit(userId, price, confirmedSlot, 'Clase');
            }
            const clubSettings = state.getMockClubs().find(c => c.id === slotToBook.clubId)?.pointSettings;
            const pointsToAward = clubSettings?.firstToJoinClass ?? 0;
            if (pointsToAward > 0) {
                 await confirmAndAwardPendingPoints(userId, slotToBook.clubId);
            }
        }

        mockUtils._annulConflictingActivities(confirmedSlot);

        for (const player of confirmedSlot.bookedPlayers) {
            if (player.groupSize !== finalConfirmedSize) {
                const bookingToRemove = state.getMockUserBookings().find(b => b.userId === player.userId && b.slotId === slotId && b.groupSize !== finalConfirmedSize);
                if (bookingToRemove) {
                    await cancelBooking(player.userId, bookingToRemove.id);
                }
            } else {
                await mockUtils.removeUserPreInscriptionsForDay(player.userId, new Date(slotToBook.startTime), slotId, 'class');
            }
        }

        const availableCourt = mockUtils.findAvailableCourt(slotToBook.clubId, new Date(slotToBook.startTime), new Date(slotToBook.endTime));
        if (availableCourt) {
            confirmedSlot.courtNumber = availableCourt.courtNumber;
        } else {
            console.error(`CRITICAL: No court available for confirmed class ${slotId}.`);
            confirmedSlot.courtNumber = 99; // Indicate an issue
        }

        state.updateTimeSlotInState(slotId, confirmedSlot);
        return { booking: newBooking, updatedSlot: confirmedSlot };
    } else {
        // Not yet confirmed, just update the state.
        state.updateTimeSlotInState(slotId, slotToBook);
    }

    return { booking: newBooking, updatedSlot: slotToBook };
};


export const cancelBooking = async (
    userId: string,
    bookingId: string
): Promise<{ success: true, updatedSlot: TimeSlot, message?: string, pointsAwarded?: number, penaltyApplied?: boolean } | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const bookingIndex = state.getMockUserBookings().findIndex(b => b.id === bookingId && b.userId === userId);
    if (bookingIndex === -1) return { error: "Reserva no encontrada." };

    const booking = state.getMockUserBookings()[bookingIndex];
    const slotIndex = state.getMockTimeSlots().findIndex(s => s.id === booking.activityId);
    if (slotIndex === -1) {
        state.removeUserBookingFromState(booking.id);
        return { success: true, updatedSlot: {} as TimeSlot, message: 'Tu inscripción para una clase ya cancelada ha sido eliminada.' };
    }

    const slot = JSON.parse(JSON.stringify(state.getMockTimeSlots()[slotIndex])) as TimeSlot;
    const club = state.getMockClubs().find(c => c.id === slot.clubId);
    const instructor = state.getMockInstructors().find(i => i.id === slot.instructorId);
    const price = calculateActivityPrice(club!, new Date(slot.startTime)) + getInstructorRate(instructor!, new Date(slot.startTime));
    slot.totalPrice = price; // Ensure latest price is used for calculations


    let message = 'Inscripción cancelada.';
    let pointsAwarded = 0;
    let penaltyApplied = false;

    if (booking.bookedWithPoints) {
        // Do not refund points for cancelling a gratis spot. Just reopen it.
        if (booking.spotIndex !== undefined) {
             if (!slot.designatedGratisSpotPlaceholderIndexForOption) slot.designatedGratisSpotPlaceholderIndexForOption = {};
             slot.designatedGratisSpotPlaceholderIndexForOption[booking.groupSize] = booking.spotIndex;
        }
        message = 'Inscripción con puntos cancelada. La plaza vuelve a estar disponible.';
    } else if (slot.status === 'confirmed' || slot.status === 'confirmed_private') {
        const pricePaid = calculatePricePerPerson(price, booking.groupSize);
        const basePointsToAward = Math.round(pricePaid * (club?.pointSettings?.cancellationPointPerEuro || 0));
        pointsAwarded = basePointsToAward;
        penaltyApplied = false;

        const hoursDifference = differenceInHours(new Date(slot.startTime), new Date());
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
            await addUserPointsAndAddTransaction(userId, pointsAwarded, 'cancelacion_clase_confirmada', `Bonificación por cancelación de clase confirmada`, booking.activityId, slot.clubId);
        }

        message = `Cancelación Bonificada: Tu plaza se liberará como "Gratis". Has recibido ${pointsAwarded} puntos.${penaltyMessage}`;

        if (!slot.designatedGratisSpotPlaceholderIndexForOption) slot.designatedGratisSpotPlaceholderIndexForOption = {};
        slot.designatedGratisSpotPlaceholderIndexForOption[booking.groupSize] = booking.spotIndex;

        state.setHasNewGratisSpotNotificationState(true);
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('gratisSpotsUpdated'));
    } else { // Pre-registration cancellation
        const penaltyPoints = club?.pointSettings?.unconfirmedCancelPenaltyPoints ?? 1;
        await addUserPointsAndAddTransaction(userId, -penaltyPoints, 'penalizacion_cancelacion_no_confirmada', 'Penalización por cancelación de pre-inscripción', booking.activityId, slot.clubId);
        message += ` Se ha aplicado una penalización de ${penaltyPoints} punto(s).`;
        penaltyApplied = true;
    }

    const updatedSlot = removeBookingFromTimeSlotInState(slot.id, userId, booking.groupSize);
    state.removeUserBookingFromState(booking.id);
    await recalculateAndSetBlockedBalances(userId);

    return { success: true, updatedSlot: JSON.parse(JSON.stringify(updatedSlot)), message, pointsAwarded: pointsAwarded > 0 ? pointsAwarded : undefined, penaltyApplied };
};


export const addTimeSlot = async (
    slotData: Omit<TimeSlot, 'id' | 'bookedPlayers' | 'promotionEndTime' | 'designatedGratisSpotPlaceholderIndexForOption' | 'startTime' | 'endTime' | 'status' | 'instructorName'> & { instructorId: string, clubId: string; level: ClassPadelLevel, startTime: Date, courtNumber?: number, category?: PadelCategoryForSlot, durationMinutes?: number }
): Promise<(TimeSlot | { error: string })[]> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const addedSlots: TimeSlot[] = [];
    const errors: { error: string }[] = [];

    const instructor = state.getMockInstructors().find(inst => inst.id === slotData.instructorId);
    if (!instructor) {
        errors.push({error: `Instructor con ID ${slotData.instructorId} no encontrado.`});
        return errors;
    }

    const club = state.getMockClubs().find(c => c.id === slotData.clubId);
    if (!club) {
        errors.push({ error: "Se requiere un club válido para crear una clase." });
        return errors;
    }

    const startTimeDate = new Date(slotData.startTime);
    const durationMinutes = slotData.durationMinutes || 60;
    const endTimeDate = addMinutes(startTimeDate, durationMinutes);

    if (instructor.isAvailable === false) {
        errors.push({ error: `El instructor ${instructor.name} no está disponible actualmente (configuración general).` });
        return errors;
    }

    const dayKey = dayOfWeekArray[getDay(startTimeDate)];
    const instructorUnavailableRangesToday = instructor.unavailableHours?.[dayKey] || [];
    for (const unavailableRange of instructorUnavailableRangesToday) {
        const unavailableStart = parse(unavailableRange.start, 'HH:mm', startTimeDate);
        const unavailableEnd = parse(unavailableRange.end, 'HH:mm', startTimeDate);
        if (areIntervalsOverlapping(
            { start: startTimeDate, end: endTimeDate },
            { start: unavailableStart, end: unavailableEnd },
            { inclusive: false }
        )) {
            errors.push({ error: `El instructor ${instructor.name} no está disponible de ${unavailableRange.start} a ${unavailableRange.end} los ${format(startTimeDate, 'eeee', {locale: es})}.` });
            return errors;
        }
    }

    const instructorHasConflict = state.getMockTimeSlots().some(
        existingSlot => existingSlot.instructorId === instructor.id &&
                        existingSlot.status !== 'cancelled' &&
                        (existingSlot.status === 'confirmed' || existingSlot.status === 'confirmed_private') &&
                        areIntervalsOverlapping(
                            { start: startTimeDate, end: endTimeDate },
                            { start: new Date(existingSlot.startTime), end: new Date(existingSlot.endTime) },
                            { inclusive: false }
                        )
    );
    if (instructorHasConflict) {
        errors.push({ error: `El instructor ${instructor.name} ya tiene una clase confirmada en este horario.` });
        return errors;
    }

    if (slotData.courtNumber === undefined) {
         errors.push({ error: `Para una creación manual, se debe especificar una pista.` });
        return errors;
    }

    const existingConfirmedActivityOnCourt = mockUtils.findConflictingConfirmedActivity({
        startTime: startTimeDate,
        endTime: endTimeDate,
        clubId: slotData.clubId,
        courtNumber: slotData.courtNumber,
    } as TimeSlot, state.getMockTimeSlots(), state.getMockMatches());

    if (existingConfirmedActivityOnCourt) {
        const activityType = 'instructorName' in existingConfirmedActivityOnCourt ? 'clase' : 'partida';
        errors.push({ error: `La Pista ${slotData.courtNumber} ya está reservada por una ${activityType} confirmada a esta hora.` });
        return errors;
    }
    
    // Calculate the dynamic price here
    const courtPrice = calculateActivityPrice(club, startTimeDate);
    const instructorRate = getInstructorRate(instructor, startTimeDate);
    const calculatedTotalPrice = courtPrice + instructorRate;

    const newSlot: TimeSlot = {
        startTime: startTimeDate, endTime: endTimeDate,
        instructorName: instructor.name, instructorId: instructor.id,
        maxPlayers: slotData.maxPlayers,
        courtNumber: slotData.courtNumber,
        id: `slot-${Date.now()}-${Math.random().toString(36).substring(7)}-${slotData.clubId}`,
        clubId: slotData.clubId, bookedPlayers: [], level: slotData.level, category: slotData.category || 'abierta',
        designatedGratisSpotPlaceholderIndexForOption: {}, status: 'pre_registration',
        totalPrice: calculatedTotalPrice,
        durationMinutes
    };
    state.addTimeSlotToState(newSlot);
    addedSlots.push(newSlot);
    mockUtils._annulConflictingActivities(newSlot);

    return [...errors, ...addedSlots.map(s => ({ ...s }))];
};

export const cancelClassByInstructor = async (slotId: string): Promise<{ success: true, message: string } | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const slotToCancel = state.getMockTimeSlots().find(s => s.id === slotId);
    if (!slotToCancel) return { error: 'Clase no encontrada.' };
    
    const club = state.getMockClubs().find(c => c.id === slotToCancel.clubId);
    const instructor = state.getMockInstructors().find(i => i.id === slotToCancel.instructorId);
    if(!club || !instructor) return { error: "Datos del club o instructor no encontrados."};
    
    const price = slotToCancel.totalPrice;


    let refundMessage = "Alumnos reembolsados: ";
    let studentsRefunded = 0;

    const bookingsForThisSlot = state.getMockUserBookings().filter(b => b.activityId === slotId);

    for (const booking of bookingsForThisSlot) {
        const student = state.getMockStudents().find(s => s.id === booking.userId);
        if (!student) continue;

        if (booking.bookedWithPoints) {
            const pointsToRefund = calculatePricePerPerson(price || 0, 1);
            await addUserPointsAndAddTransaction(booking.userId, pointsToRefund, 'reembolso_error_reserva', `Reembolso puntos por clase cancelada por instructor: ${slotToCancel.instructorName}`, slotId, slotToCancel.clubId);
            refundMessage += `${student.name} (+${pointsToRefund} pts), `;
        } else {
            const creditToRefund = calculatePricePerPerson(price, booking.groupSize);
            if (creditToRefund > 0) {
                 await addCreditToStudent(booking.userId, creditToRefund, `Reembolso clase cancelada: ${slotToCancel.instructorName} ${format(new Date(slotToCancel.startTime as any), 'dd/MM')}`);
                refundMessage += `${student.name} (+${creditToRefund.toFixed(2)}€), `;
            }
        }
        studentsRefunded++;
    }

    state.removeUserBookingsBySlotIdFromState(slotId);
    state.removeTimeSlotFromState(slotId);

    refundMessage = studentsRefunded > 0 ? refundMessage.slice(0, -2) + "." : "No había alumnos inscritos.";

    return { success: true, message: `Clase cancelada exitosamente. ${refundMessage}` };
};


export const countAvailableGratisSpots = (clubId?: string | null): number => {
    const slotsToCheck = clubId ? state.getMockTimeSlots().filter(s => s.clubId === clubId) : state.getMockTimeSlots();
    return slotsToCheck.filter(mockUtils.isSlotGratisAndAvailable).length;
};

export const fetchUserBookings = async (userId: string): Promise<Booking[]> => {
  await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
  const userBookingsData = state.getMockUserBookings().filter(booking => booking.userId === userId);
  return userBookingsData.map(booking => {
    const slot = state.getMockTimeSlots().find(s => s.id === booking.activityId);
    return {
      ...booking,
      slotDetails: slot ? {
        clubId: slot.clubId,
        startTime: new Date(slot.startTime),
        endTime: new Date(slot.endTime),
        instructorName: slot.instructorName,
        instructorId: slot.instructorId,
        level: slot.level,
        maxPlayers: slot.maxPlayers,
        courtNumber: slot.courtNumber,
        category: slot.category,
        totalPrice: slot.totalPrice, // Pass totalPrice
        status: slot.status,
        organizerId: slot.organizerId,
        confirmedPrivateSize: slot.confirmedPrivateSize,
        privateShareCode: slot.privateShareCode,
        bookedPlayers: JSON.parse(JSON.stringify(slot.bookedPlayers || [])),
        designatedGratisSpotPlaceholderIndexForOption: slot.designatedGratisSpotPlaceholderIndexForOption,
      } : booking.slotDetails
    };
  });
};

export const confirmClassAsPrivate = async (
    organizerUserId: string,
    slotId: string,
    groupSize: 1 | 2 | 3 | 4
): Promise<{ updatedSlot: TimeSlot; shareLink: string } | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const organizerUser = state.getMockUserDatabase().find(u => u.id === organizerUserId);
    if (!organizerUser) return { error: "Usuario organizador no encontrado." };

    const slotIndex = state.getMockTimeSlots().findIndex(s => s.id === slotId);
    if (slotIndex === -1) return { error: "Clase no encontrada." };

    let slotToConfirm = JSON.parse(JSON.stringify(state.getMockTimeSlots()[slotIndex])) as TimeSlot;

    if (slotToConfirm.status !== 'pre_registration') return { error: "Esta clase no se puede confirmar como privada en su estado actual."};

    const existingPlayers = slotToConfirm.bookedPlayers || [];
    if (existingPlayers.length > 1 || (existingPlayers.length === 1 && existingPlayers[0].userId !== organizerUserId)) {
        return { error: "No se puede confirmar como privada, ya hay otros jugadores inscritos." };
    }
    
    const club = state.getMockClubs().find(c => c.id === slotToConfirm.clubId);
    const instructor = state.getMockInstructors().find(i => i.id === slotToConfirm.instructorId);
    if (!club || !instructor) return { error: "Datos de club o instructor no encontrados." };
    
    const totalPrice = calculateActivityPrice(club, new Date(slotToConfirm.startTime)) + getInstructorRate(instructor, new Date(slotToConfirm.startTime));
    slotToConfirm.totalPrice = totalPrice;

    if ((organizerUser.credit ?? 0) < totalPrice) {
        return { error: `Saldo insuficiente. Necesitas ${totalPrice.toFixed(2)}€ y tienes ${(organizerUser.credit ?? 0).toFixed(2)}€.` };
    }

    const availableCourt = mockUtils.findAvailableCourt(slotToConfirm.clubId, new Date(slotToConfirm.startTime), new Date(slotToConfirm.endTime));
    if (!availableCourt) {
        return { error: "No hay pistas disponibles en este momento para confirmar la clase." };
    }

    deductCredit(organizerUserId, totalPrice, slotToConfirm, 'Clase');

    const privateShareCode = `privclass-${slotId.slice(-6)}-${Date.now().toString().slice(-6)}`;

    slotToConfirm.status = 'confirmed_private';
    slotToConfirm.organizerId = organizerUserId;
    slotToConfirm.privateShareCode = privateShareCode;
    slotToConfirm.confirmedPrivateSize = groupSize;
    slotToConfirm.courtNumber = availableCourt.courtNumber;
    slotToConfirm.bookedPlayers = [{ userId: organizerUserId, groupSize }];

    state.updateTimeSlotInState(slotId, slotToConfirm);

    // Remove any existing pre-registration booking the user might have had
    const preExistingBooking = state.getMockUserBookings().find(b => b.userId === organizerUserId && b.activityId === slotId);
    if (preExistingBooking) {
        state.removeUserBookingFromState(preExistingBooking.id);
    }

    const newOrganizerBooking: Booking = {
        id: `privbooking-${slotId}-${organizerUserId}-${Date.now()}`,
        userId: organizerUserId,
        activityId: slotId,
        activityType: 'class',
        groupSize: groupSize,
        spotIndex: 0,
        status: 'confirmed',
    };
    state.addUserBookingToState(newOrganizerBooking);

    mockUtils._annulConflictingActivities(slotToConfirm);
    await recalculateAndSetBlockedBalances(organizerUserId);

    const shareLink = `/?code=${privateShareCode}`;
    return { updatedSlot: JSON.parse(JSON.stringify(slotToConfirm)), shareLink };
};

export const joinPrivateClass = async (
    inviteeUserId: string,
    slotId: string,
    shareCode: string
): Promise<{ newBooking: Booking; updatedSlot: TimeSlot; organizerRefundAmount: number } | { error: string }> => {
    // This function logic is complex and involves multiple state updates (invitee credit, organizer credit, bookings, slot).
    // Placeholder for now.
    return { error: "La funcionalidad para unirse a clases privadas está en desarrollo." };
};

export const makeClassPublic = async (
    organizerUserId: string,
    slotId: string
): Promise<{ success: true, updatedSlot: TimeSlot }