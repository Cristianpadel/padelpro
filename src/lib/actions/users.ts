"use client";

import type { User, Booking, PointTransactionType, TimeSlot, Match } from '@/types';
import * as state from '../state';
import * as config from '../config';

export const addCreditToStudent = async (userId: string, amount: number, description?: string): Promise<{ newBalance: number } | { error: string }> => {
    await new Promise(res => setTimeout(res, config.MINIMAL_DELAY));
    const userDb = state.getMockUserDatabase();
    const userIndex = userDb.findIndex(u => u.id === userId);
    if (userIndex === -1) return { error: "Usuario no encontrado." };
    userDb[userIndex].credit = (userDb[userIndex].credit ?? 0) + amount;
    return { newBalance: userDb[userIndex].credit! };
};

export const deductCredit = async (userId: string, amount: number, activity: TimeSlot | Match, activityType: 'Clase' | 'Partida'): Promise<boolean> => {
    const userDb = state.getMockUserDatabase();
    const userIndex = userDb.findIndex(u => u.id === userId);
    if (userIndex === -1) return false;
    userDb[userIndex].credit = (userDb[userIndex].credit ?? 0) - amount;
    return true;
};

export const addUserPointsAndAddTransaction = async (userId: string, points: number, type: PointTransactionType, description: string, activityId: string, clubId: string) => {
    const userDb = state.getMockUserDatabase();
    const userIndex = userDb.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
        userDb[userIndex].loyaltyPoints = (userDb[userIndex].loyaltyPoints ?? 0) + points;
        state.addPointTransaction({
            id: `txn-${Date.now()}`,
            userId,
            clubId,
            points,
            type,
            description: `${description} (Actividad: ${activityId})`,
            date: new Date(),
        });
    }
};

export const confirmAndAwardPendingPoints = async (userId: string, clubId: string) => {
    // In a real system, this would look for pending points related to the user and activity and confirm them.
    // For now, we'll just add some points as a simulation.
    const club = state.getMockClubs().find(c => c.id === clubId);
    if (club?.pointSettings?.inscriptionBonusPoints) {
        await addUserPointsAndAddTransaction(userId, club.pointSettings.inscriptionBonusPoints, 'bonificacion_preinscripcion', 'Bonificación por pre-inscribirte a una clase', 'n/a', clubId);
    }
};

export const recalculateAndSetBlockedBalances = async (userId: string) => {
    const userBookings = state.getMockUserBookings().filter(b => b.userId === userId && b.status === 'pending');
    let totalBlocked = 0;
    for (const booking of userBookings) {
        if (booking.amountBlocked) {
            totalBlocked += booking.amountBlocked;
        }
    }
    const userDb = state.getMockUserDatabase();
    const userIndex = userDb.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
        userDb[userIndex].blockedCredit = totalBlocked;
    }
};

export const convertEurosToPoints = async (
    userId: string,
    eurosToConvert: number,
    pointsPerEuro: number
): Promise<{ newCreditBalance: number, newLoyaltyPoints: number } | { error: string }> => {
    await new Promise(res => setTimeout(res, config.MINIMAL_DELAY));
    const userDb = state.getMockUserDatabase();
    const userIndex = userDb.findIndex(u => u.id === userId);
    if (userIndex === -1) return { error: "Usuario no encontrado." };

    const currentUser = userDb[userIndex];
    if ((currentUser.credit ?? 0) < eurosToConvert) {
        return { error: `Saldo insuficiente para convertir ${eurosToConvert.toFixed(2)}€.` };
    }

    const pointsToAdd = eurosToConvert * pointsPerEuro;
    currentUser.credit = (currentUser.credit ?? 0) - eurosToConvert;
    currentUser.loyaltyPoints = (currentUser.loyaltyPoints ?? 0) + pointsToAdd;
    
    state.addPointTransaction({
        id: `txn-convert-${Date.now()}`,
        userId: userId,
        clubId: currentUser.currentClubId || 'club-1',
        points: pointsToAdd,
        type: 'conversion_saldo',
        description: `Conversión de ${eurosToConvert.toFixed(2)}€ a puntos.`,
        date: new Date(),
    });

    return { newCreditBalance: currentUser.credit, newLoyaltyPoints: currentUser.loyaltyPoints };
};
