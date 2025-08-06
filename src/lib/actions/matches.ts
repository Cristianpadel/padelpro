
"use client";

import type { Match, User, MatchPadelLevel, PadelCategoryForSlot, PadelCourt } from '@/types';
import { getMockStudents, getMockClubs, getMockPadelCourts } from '@/lib/mockData';
import { calculatePricePerPerson, isUserLevelCompatibleWithActivity } from '@/lib/utils';
import * as state from '../state';
import * as config from '../config';
import { addUserPointsAndAddTransaction, deductCredit, recalculateAndSetBlockedBalances } from './users';
import { format } from 'date-fns';

export const addMatch = async (matchData: Omit<Match, 'id'>): Promise<Match | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const newMatch: Match = {
        ...matchData,
        id: `match-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        status: matchData.status || 'forming',
        bookedPlayers: matchData.bookedPlayers || [],
    };
    state.addMatchToState(newMatch);
    return { ...newMatch };
};

export const deleteMatch = async (matchId: string): Promise<{ success: true, message: string } | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const match = state.getMockMatches().find(m => m.id === matchId);
    if (!match) return { error: "Partida no encontrada." };

    // Placeholder for refunding players
    for (const player of match.bookedPlayers) {
        // In a real app, refund logic would be here.
    }
    
    state.removeUserMatchBookingFromStateByMatch(matchId);
    const success = state.getMockMatches().filter(m => m.id !== matchId);
    state.initializeMockMatches(success);

    return { success: true, message: "La partida ha sido cancelada." };
};

export const removePlayerFromMatch = async (matchId: string, playerId: string, systemRemoval: boolean = false): Promise<{ success: true, message: string } | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const matchIndex = state.getMockMatches().findIndex(m => m.id === matchId);
    if (matchIndex === -1) return { error: "Partida no encontrada." };

    let match = state.getMockMatches()[matchIndex];
    const playerIndex = match.bookedPlayers.findIndex(p => p.userId === playerId);
    if (playerIndex === -1) return { error: "El jugador no estaba en esta partida." };

    match.bookedPlayers.splice(playerIndex, 1);
    
    if (!systemRemoval) {
        // Placeholder for refund logic
    }
    
    state.initializeMockMatches([...state.getMockMatches()]); // Trigger update
    return { success: true, message: "Jugador eliminado de la partida." };
};


export const bookMatch = async (userId: string, matchId: string, usePoints: boolean = false): Promise<Match | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const user = getMockStudents().find(s => s.id === userId);
    if (!user) return { error: 'Usuario no encontrado.' };
    
    const matchIndex = state.getMockMatches().findIndex(m => m.id === matchId);
    if (matchIndex === -1) return { error: 'Partida no encontrada.' };

    const match = state.getMockMatches()[matchIndex];
    if ((match.bookedPlayers || []).length >= 4) return { error: 'La partida ya está completa.' };
    if ((match.bookedPlayers || []).some(p => p.userId === userId)) return { error: 'Ya estás inscrito en esta partida.' };

    if (!isUserLevelCompatibleWithActivity(match.level, user.level, match.isPlaceholder)) {
        return { error: 'Tu nivel no es compatible con el de esta partida.' };
    }

    const price = calculatePricePerPerson(match.totalCourtFee || 0, 4);

    if (usePoints) {
        const pointsCost = price; // Example: 1 euro = 1 point
        if ((user.loyaltyPoints ?? 0) < pointsCost) {
            return { error: 'No tienes suficientes puntos para unirte.' };
        }
    } else {
        if ((user.credit ?? 0) < price) {
            return { error: `Saldo insuficiente. Necesitas ${price.toFixed(2)}€.` };
        }
    }
    
    match.bookedPlayers.push({ userId: user.id, name: user.name });

    if (match.bookedPlayers.length === 4) {
        match.status = 'confirmed';
    }

    state.initializeMockMatches([...state.getMockMatches()]);
    return { ...match };
};

export const bookCourtForMatchWithPoints = async (userId: string, matchId: string): Promise<Match | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const user = getMockStudents().find(s => s.id === userId);
    const match = state.getMockMatches().find(m => m.id === matchId);
    const club = getMockClubs().find(c => c.id === match?.clubId);

    if (!user || !match || !club) return { error: "Datos no encontrados." };
    
    const pointsCost = club.pointSettings?.pointsCostForCourt ?? 20;
    if ((user.loyaltyPoints ?? 0) < pointsCost) return { error: "Puntos insuficientes." };

    await addUserPointsAndAddTransaction(userId, -pointsCost, 'reserva_pista_puntos', `Reserva de pista en ${club.name}`, match.id, club.id);

    match.isPlaceholder = false;
    match.isPointsOnlyBooking = true;
    match.creatorId = userId;
    match.totalCourtFee = 0; // The court is paid with points
    match.bookedPlayers = [{ userId: user.id, name: user.name }];
    state.initializeMockMatches([...state.getMockMatches()]);
    return { ...match };
}

export const confirmMatchAsPrivate = async (organizerId: string, matchId: string, isRecurring: boolean): Promise<{ updatedMatch: Match, shareLink: string } | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const matchIndex = state.getMockMatches().findIndex(m => m.id === matchId);
    if (matchIndex === -1) return { error: "Partida no encontrada." };

    const match = state.getMockMatches()[matchIndex];
    if (match.bookedPlayers.length > 0) return { error: "No se puede confirmar como privada si ya hay jugadores." };
    
    const organizer = getMockStudents().find(s => s.id === organizerId);
    if (!organizer) return { error: "Organizador no encontrado." };

    const price = match.totalCourtFee || 0;
    if ((organizer.credit ?? 0) < price) return { error: `Saldo insuficiente. Necesitas ${price.toFixed(2)}€`};

    deductCredit(organizerId, price, match, 'Partida');

    match.status = 'confirmed_private';
    match.organizerId = organizerId;
    match.isRecurring = isRecurring;
    match.privateShareCode = `priv-${matchId.slice(-4)}-${Date.now().toString().slice(-5)}`;
    match.bookedPlayers.push({ userId: organizerId, name: organizer.name });

    state.initializeMockMatches([...state.getMockMatches()]);
    const shareLink = `/?view=partidas&code=${match.privateShareCode}`;
    return { updatedMatch: { ...match }, shareLink };
};

export const joinPrivateMatch = async (userId: string, matchId: string, shareCode: string): Promise<{ success: true, organizerRefundAmount: number } | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const matchIndex = state.getMockMatches().findIndex(m => m.id === matchId && m.privateShareCode === shareCode);
    if (matchIndex === -1) return { error: "Partida privada no encontrada o código incorrecto." };
    
    const match = state.getMockMatches()[matchIndex];
    if (match.bookedPlayers.length >= 4) return { error: "Esta partida privada ya está completa." };
    
    const invitee = getMockStudents().find(s => s.id === userId);
    if (!invitee) return { error: "Usuario no encontrado." };

    const pricePerPlayer = calculatePricePerPerson(match.totalCourtFee || 0, 4);
    if ((invitee.credit ?? 0) < pricePerPlayer) return { error: "Saldo insuficiente." };
    
    deductCredit(userId, pricePerPlayer, match, 'Partida');
    
    // Refund the organizer
    if (match.organizerId) {
        addCreditToStudent(match.organizerId, pricePerPlayer, `Reembolso por amigo unido: ${invitee.name}`);
    }
    
    match.bookedPlayers.push({ userId: userId, name: invitee.name });
    state.initializeMockMatches([...state.getMockMatches()]);
    return { success: true, organizerRefundAmount: pricePerPlayer };
};

export const makeMatchPublic = async (userId: string, matchId: string): Promise<Match | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const matchIndex = state.getMockMatches().findIndex(m => m.id === matchId);
    if (matchIndex === -1) return { error: "Partida no encontrada." };
    
    const match = state.getMockMatches()[matchIndex];
    if (match.organizerId !== userId) return { error: "Solo el organizador puede hacer pública la partida." };

    match.status = 'forming';
    match.privateShareCode = undefined;
    
    state.initializeMockMatches([...state.getMockMatches()]);
    return { ...match };
};


export const renewRecurringMatch = async (userId: string, completedMatchId: string): Promise<{ success: true, newMatch: Match } | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    
    const completedMatch = state.getMockMatches().find(m => m.id === completedMatchId);
    if (!completedMatch || !completedMatch.nextRecurringMatchId) {
        return { error: "No hay una reserva provisional para renovar." };
    }
    
    const provisionalMatchIndex = state.getMockMatches().findIndex(m => m.id === completedMatch.nextRecurringMatchId);
    if (provisionalMatchIndex === -1) {
        return { error: "La reserva provisional ha expirado o no se encontró." };
    }
    
    let provisionalMatch = state.getMockMatches()[provisionalMatchIndex];
    
    if (provisionalMatch.provisionalForUserId !== userId) {
        return { error: "No tienes permiso para renovar esta reserva." };
    }

    provisionalMatch.isProvisional = false;
    provisionalMatch.status = 'confirmed_private';
    
    const price = provisionalMatch.totalCourtFee || 0;
    const user = getMockStudents().find(s => s.id === userId);
    if (!user || (user.credit ?? 0) < price) {
        return { error: "Saldo insuficiente para renovar la reserva." };
    }
    
    deductCredit(userId, price, provisionalMatch, 'Partida');
    
    state.initializeMockMatches([...state.getMockMatches()]);
    return { success: true, newMatch: { ...provisionalMatch } };
};

// Placeholder for a function that might be needed
export const countConfirmedLiberadasSpots = async (clubId?: string): Promise<{ classes: number; matches: number; }> => {
    return { classes: 0, matches: 0 };
};
