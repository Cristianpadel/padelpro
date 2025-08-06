"use client";

import { addHours, setHours, setMinutes, startOfDay, format, isSameDay, addDays, addMinutes, areIntervalsOverlapping, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { TimeSlot, Booking, User, Instructor, ClassPadelLevel, PadelCategoryForSlot } from '@/types';
import * as state from './index';
import * as config from '../config';
import { _classifyLevelAndCategoryForSlot } from './classProposals';
import { _annulConflictingActivities, findAvailableCourt, removeUserPreInscriptionsForDay, isUserLevelCompatibleWithActivity } from './utils';
import { addUserPointsAndAddTransaction, deductCredit, recalculateAndSetBlockedBalances, confirmAndAwardPendingPoints } from './users';
import { calculatePricePerPerson } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

export const addTimeSlot = async (
  slotData: Omit<TimeSlot, 'id' | 'status' | 'bookedPlayers' | 'endTime' | 'instructorName'>
): Promise<TimeSlot | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    
    if (!slotData.clubId || !slotData.instructorId || !slotData.startTime) {
        return { error: 'Faltan datos esenciales para crear la clase.' };
    }

    const instructor = state.getMockInstructors().find(i => i.id === slotData.instructorId);
    if (!instructor) return { error: `Instructor con ID ${slotData.instructorId} no encontrado.` };

    const startTime = new Date(slotData.startTime);
    const endTime = addMinutes(startTime, slotData.durationMinutes || 60);

    // Conflict checking
    const conflictingSlot = state.getMockTimeSlots().find(
        existingSlot => existingSlot.instructorId === slotData.instructorId &&
        existingSlot.status !== 'cancelled' &&
        areIntervalsOverlapping(
            { start: startTime, end: endTime },
            { start: new Date(existingSlot.startTime), end: new Date(existingSlot.endTime) },
            { inclusive: false }
        )
    );

    if (conflictingSlot) {
        return { error: `El instructor ya tiene una clase de ${format(new Date(conflictingSlot.startTime), 'HH:mm')} a ${format(new Date(conflictingSlot.endTime), 'HH:mm')} en Pista ${conflictingSlot.courtNumber}.` };
    }
    
    // Conflict check for court
    if (slotData.courtNumber) {
        const existingBlockingActivity = findAvailableCourt(slotData.clubId, startTime, endTime);
        if (existingBlockingActivity && existingBlockingActivity.courtNumber === slotData.courtNumber) {
             const activityType = 'instructorName' in existingBlockingActivity ? 'clase' : 'partida';
             return { error: `La Pista ${slotData.courtNumber} ya está reservada por una ${activityType} confirmada a esta hora.` };
        }
    }


    const newSlot: TimeSlot = {
        ...slotData,
        id: `ts-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        status: 'pre_registration',
        bookedPlayers: [],
        endTime: endTime,
        instructorName: instructor.name || 'Instructor Desconocido',
        totalPrice: slotData.totalPrice || 0,
    };
    
    state.addTimeSlotToState(newSlot);
    return { ...newSlot };
};


export const bookClass = async (
  userId: string,
  slotId: string,
  groupSize: 1 | 2 | 3 | 4,
  spotIndexPlaceholder: number // Visual index of the spot clicked
): Promise<{ booking: Booking, updatedSlot: TimeSlot } | { error: string }> => {
  await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));

  const student = state.getMockUserDatabase().find(s => s.id === userId);
  if (!student) return { error: "Usuario no encontrado." };

  const slotIndex = state.getMockTimeSlots().findIndex(s => s.id === slotId);
  if (slotIndex === -1) return { error: "Clase no encontrada." };

  let slot = { ...state.getMockTimeSlots()[slotIndex] };
  const club = state.getMockClubs().find(c => c.id === slot.clubId);
  if (!club) return { error: "Club no encontrado." };

  if ((slot.bookedPlayers || []).some(p => p.userId === userId)) {
    return { error: "Ya estás inscrito en esta clase." };
  }
  if (!isUserLevelCompatibleWithActivity(slot.level, student.level)) {
    return { error: 'Tu nivel de juego no es compatible con el de esta clase.' };
  }
  
  if (state.hasAnyConfirmedActivityForDay(userId, new Date(slot.startTime), slotId, 'class')) {
      return { error: 'Ya tienes otra actividad confirmada para este día.' };
  }

  const isGratisSpot = slot.designatedGratisSpotPlaceholderIndexForOption?.[groupSize] === spotIndexPlaceholder;
  const pricePerPerson = calculatePricePerPerson(slot.totalPrice, groupSize);
  const pointsCostForGratis = calculatePricePerPerson(slot.totalPrice, 1);

  if (isGratisSpot) {
      if ((student.loyaltyPoints ?? 0) < pointsCostForGratis) {
          return { error: `No tienes suficientes puntos (${pointsCostForGratis}) para esta plaza.` };
      }
      await addUserPointsAndAddTransaction(
          userId,
          -pointsCostForGratis,
          'canje_plaza_gratis',
          `Canje de plaza en clase con ${slot.instructorName}`,
          slot.id,
          slot.clubId
      );
  } else {
      if ((student.credit ?? 0) < pricePerPerson) {
          return { error: `Saldo insuficiente. Necesitas ${pricePerPerson.toFixed(2)}€.` };
      }
  }

  const { newLevel, newCategory } = _classifyLevelAndCategoryForSlot(slot, student, club);
  slot.level = newLevel;
  slot.category = newCategory;
  
  slot.bookedPlayers.push({ userId, groupSize, name: student.name });

  const { completed, size: completedSize } = state.isSlotEffectivelyCompleted(slot);
  if (completed) {
      slot.status = 'confirmed';
      const court = findAvailableCourt(slot.clubId, new Date(slot.startTime), new Date(slot.endTime));
      if (court) {
        slot.courtNumber = court.courtNumber;
      } else {
        console.error(`CRITICAL: No court available for confirmed class ${slot.id}.`);
        slot.courtNumber = 99; // Indicate an issue
      }
      
      const chargeKey = `${userId}-${slot.id}`;
      if (!state.getChargedUsersForThisConfirmation().has(chargeKey)) {
        if (!isGratisSpot) {
            deductCredit(userId, pricePerPerson, slot, 'Clase');
        }
        await confirmAndAwardPendingPoints(userId, slot.clubId);
        state.addChargedUserForConfirmation(chargeKey);
      }
      
      _annulConflictingActivities(slot);
       await removeUserPreInscriptionsForDay(userId, new Date(slot.startTime), slot.id, 'class');
  } else {
      await recalculateAndSetBlockedBalances(userId);
  }

  const newBooking: Booking = {
    id: `booking-${slotId}-${userId}-${Date.now()}`,
    userId,
    activityId: slotId,
    activityType: 'class',
    groupSize,
    spotIndex: spotIndexPlaceholder,
    status: completed ? 'confirmed' : 'pending',
    bookedWithPoints: isGratisSpot,
    bookedAt: new Date()
  };
  
  state.addUserBookingToState(newBooking);
  state.updateTimeSlotInState(slot.id, slot);
  
  return { booking: newBooking, updatedSlot: slot };
};

export const cancelBooking = async (userId: string, bookingId: string): Promise<{ success: true; message?: string, pointsAwarded?: number, penaltyApplied?: boolean } | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const booking = state.getMockUserBookings().find(b => b.id === bookingId);
    if (!booking) return { error: "Reserva no encontrada." };
    if (booking.userId !== userId && userId !== 'system-cancellation') return { error: "No puedes cancelar la reserva de otro usuario." };

    const slot = state.getMockTimeSlots().find(s => s.id === booking.activityId);
    if (!slot) return { error: "Clase asociada no encontrada." };
    
    const club = state.getMockClubs().find(c => c.id === slot.clubId);
    if(!club) return { error: "Club no encontrado."};

    const updatedSlot = state.removeBookingFromTimeSlotInState(booking.activityId, userId, booking.groupSize);
    if (!updatedSlot) return { error: "Error al actualizar la clase." };

    state.removeUserBookingFromState(bookingId);
    await recalculateAndSetBlockedBalances(userId);
    
    let message = "Tu inscripción ha sido cancelada.";
    let pointsAwarded = 0;
    let penaltyApplied = false;

    // Handle refunds and penalties
    if (booking.status === 'confirmed') {
        const pricePaid = calculatePricePerPerson(slot.totalPrice, booking.groupSize);
        const basePointsToAward = Math.round(pricePaid * (club.pointSettings?.cancellationPointPerEuro || 0));
        pointsAwarded = basePointsToAward;
        
        const hoursDifference = differenceInHours(new Date(slot.startTime), new Date());
        const penaltyTiers = club.pointSettings?.cancellationPenaltyTiers?.sort((a,b) => a.hoursBefore - b.hoursBefore) || [];
        const applicableTier = penaltyTiers.find(tier => hoursDifference < tier.hoursBefore);

        if (applicableTier) {
            const penaltyAmount = Math.round(basePointsToAward * (applicableTier.penaltyPercentage / 100));
            pointsAwarded -= penaltyAmount;
            message = `Cancelación Bonificada: Tu plaza se liberará como "Gratis". Has recibido ${pointsAwarded} puntos. Se ha aplicado una penalización del ${applicableTier.penaltyPercentage}% por cancelación tardía.`;
            penaltyApplied = true;
        } else {
             message = `Cancelación Bonificada: Tu plaza se liberará como "Gratis". Has recibido ${pointsAwarded} puntos.`;
        }
        
        if (pointsAwarded > 0) {
           await addUserPointsAndAddTransaction(userId, pointsAwarded, 'cancelacion_clase_confirmada', 'Bonificación por cancelación de clase confirmada', slot.id, slot.clubId);
        }

    } else if (booking.status === 'pending') {
        const penaltyPoints = club.pointSettings?.unconfirmedCancelPenaltyPoints ?? 1;
        await addUserPointsAndAddTransaction(userId, -penaltyPoints, 'penalizacion_cancelacion_no_confirmada', 'Penalización por cancelación de clase no confirmada', slot.id, slot.clubId);
        message += ` Se ha aplicado una penalización de ${penaltyPoints} punto(s).`;
        penaltyApplied = true;
    }
    
    return { success: true, message, pointsAwarded: pointsAwarded > 0 ? pointsAwarded : undefined, penaltyApplied };
};


export const cancelClassByInstructor = async (slotId: string): Promise<{ success: true; message: string; refundedUsers: string[] } | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const slot = state.getMockTimeSlots().find(s => s.id === slotId);
    if (!slot) return { error: 'Clase no encontrada.' };

    const refundedUsers: string[] = [];
    const bookings = state.getMockUserBookings().filter(b => b.activityId === slotId);

    for (const booking of bookings) {
        // Logic to refund users
        const user = state.getMockUserDatabase().find(u => u.id === booking.userId);
        if (user) {
            const price = calculatePricePerPerson(slot.totalPrice, booking.groupSize);
            if (booking.bookedWithPoints) {
                 const pointsToRefund = calculatePricePerPerson(slot.totalPrice, 1);
                 await addUserPointsAndAddTransaction(booking.userId, pointsToRefund, 'reembolso_error_reserva', `Reembolso por cancelación de clase (Instructor)`, slot.id, slot.clubId);
            } else {
                await state.addCreditToStudent(booking.userId, price, `Reembolso por clase cancelada por instructor.`);
            }
            refundedUsers.push(user.name);
        }
    }
    
    state.removeTimeSlotFromState(slotId);
    state.removeUserBookingsBySlotIdFromState(slotId);

    const refundMessage = refundedUsers.length > 0 ? `Se ha reembolsado a: ${refundedUsers.join(', ')}.` : '';
    return { success: true, message: `Clase cancelada. ${refundMessage}`, refundedUsers };
};

export const makeClassPublic = async (userId: string, slotId: string): Promise<{ success: true, updatedSlot: TimeSlot } | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const slotIndex = state.getMockTimeSlots().findIndex(s => s.id === slotId);
    if (slotIndex === -1) return { error: "Clase no encontrada." };

    let slot = state.getMockTimeSlots()[slotIndex];
    if (slot.organizerId !== userId) return { error: "Solo el organizador puede hacer pública la clase." };
    if (slot.status !== 'confirmed_private') return { error: "Esta clase no es privada o ya es pública." };

    slot.status = 'forming'; 
    slot.organizerId = undefined;
    slot.privateShareCode = undefined;
    slot.confirmedPrivateSize = undefined;
    
    state.updateTimeSlotInState(slot.id, slot);
    return { success: true, updatedSlot: slot };
};

export const confirmClassAsPrivate = async (
    organizerUserId: string,
    slotId: string,
    confirmedSize: 1 | 2 | 3 | 4
): Promise<{ updatedSlot: TimeSlot; shareLink: string } | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const organizerUser = state.getMockUserDatabase().find(u => u.id === organizerUserId);
    if (!organizerUser) return { error: "Usuario organizador no encontrado." };

    const slotIndex = state.getMockTimeSlots().findIndex(s => s.id === slotId);
    if (slotIndex === -1) return { error: "Clase no encontrada." };

    let slot = { ...state.getMockTimeSlots()[slotIndex] };

    if (slot.status !== 'pre_registration' || (slot.bookedPlayers && slot.bookedPlayers.length > 0)) {
        return { error: "Solo se pueden confirmar como privadas las clases nuevas sin alumnos." };
    }
    
    if (slot.totalPrice === undefined || slot.totalPrice === null) {
        return { error: "No se pudo determinar el precio de la clase." };
    }

    if ((organizerUser.credit ?? 0) < slot.totalPrice) {
        return { error: `Saldo insuficiente. Necesitas ${slot.totalPrice.toFixed(2)}€ y tienes ${(organizerUser.credit ?? 0).toFixed(2)}€.` };
    }

    const availableCourt = findAvailableCourt(slot.clubId, new Date(slot.startTime), new Date(slot.endTime));
    if (!availableCourt) {
        return { error: "No hay pistas disponibles en este momento para confirmar la clase." };
    }

    // Deduct credit, update status, and assign court
    deductCredit(organizerUserId, slot.totalPrice, slot, 'Clase');

    const privateShareCode = `privclass-${slotId.slice(-6)}-${Date.now().toString().slice(-6)}`;

    slot.status = 'confirmed_private';
    slot.organizerId = organizerUserId;
    slot.privateShareCode = privateShareCode;
    slot.confirmedPrivateSize = confirmedSize;
    slot.courtNumber = availableCourt.courtNumber;
    slot.bookedPlayers.push({ userId: organizerUserId, groupSize: confirmedSize, name: organizerUser.name });
    
    state.updateTimeSlotInState(slot.id, slot);

    // Create the organizer's booking record
    const newOrganizerBooking: Booking = {
        id: `privbooking-${slotId}-${organizerUserId}-${Date.now()}`,
        userId: organizerUserId,
        activityId: slotId,
        activityType: 'class',
        groupSize: confirmedSize,
        spotIndex: 0,
        status: 'confirmed',
        isOrganizerBooking: true,
        bookedAt: new Date()
    };
    state.addUserBookingToState(newOrganizerBooking);

    _annulConflictingActivities(slot);
    await recalculateAndSetBlockedBalances(organizerUserId);

    const shareLink = `/?view=clases&code=${privateShareCode}`;
    return { updatedSlot: slot, shareLink };
};

export const joinPrivateClass = async (
    inviteeUserId: string,
    slotId: string,
    shareCode: string
): Promise<{ newBooking: Booking; updatedSlot: TimeSlot; organizerRefundAmount: number } | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const inviteeUser = state.getMockUserDatabase().find(u => u.id === inviteeUserId);
    if (!inviteeUser) return { error: "Usuario no encontrado." };

    const slotIndex = state.getMockTimeSlots().findIndex(s => s.id === slotId && s.privateShareCode === shareCode);
    if (slotIndex === -1) return { error: "Clase privada no encontrada o código incorrecto." };

    let slot = { ...state.getMockTimeSlots()[slotIndex] };
    if (slot.status !== 'confirmed_private' || !slot.confirmedPrivateSize) return { error: "Esta clase no es privada." };
    if ((slot.bookedPlayers || []).length >= slot.confirmedPrivateSize) return { error: "Esta clase privada ya está completa." };
    if ((slot.bookedPlayers || []).some(p => p.userId === inviteeUserId)) return { error: "Ya estás en esta clase." };

    const pricePerPerson = calculatePricePerPerson(slot.totalPrice, slot.confirmedPrivateSize);
    
    if ((inviteeUser.credit ?? 0) < pricePerPerson) {
        return { error: `Saldo insuficiente. Necesitas ${pricePerPerson.toFixed(2)}€.` };
    }

    deductCredit(inviteeUserId, pricePerPerson, slot, 'Clase');
    
    if (slot.organizerId) {
        state.addCreditToStudent(slot.organizerId, pricePerPerson, `Reembolso por invitado: ${inviteeUser.name}`);
    }

    slot.bookedPlayers.push({ userId: inviteeUserId, groupSize: slot.confirmedPrivateSize, name: inviteeUser.name });
    state.updateTimeSlotInState(slotId, slot);

    const newBooking: Booking = {
        id: `booking-${slotId}-${inviteeUserId}-${Date.now()}`,
        userId: inviteeUserId,
        activityId: slotId,
        activityType: 'class',
        groupSize: slot.confirmedPrivateSize,
        spotIndex: slot.bookedPlayers.length - 1,
        status: 'confirmed',
        amountPaidByInvitee: pricePerPerson,
        bookedAt: new Date()
    };
    state.addUserBookingToState(newBooking);
    
    return { newBooking, updatedSlot: slot, organizerRefundAmount: pricePerPerson };
};
