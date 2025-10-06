// src/lib/mockDataSources/matchDay.ts

import { addHours, setHours, setMinutes, startOfDay, format, isSameDay, addDays, addMinutes, areIntervalsOverlapping, parseISO, differenceInHours, differenceInMinutes, getDay, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import type { MatchDayEvent, User, MatchDayInscription, PadelCourt, Match } from '@/types';
import * as state from './index';
import { v4 as uuidv4 } from 'uuid';
import { deductCredit, recalculateAndSetBlockedBalances, addUserPointsAndAddTransaction } from './users';
import { addMatch } from './matches';


export const createMatchDayEvent = async (
  eventData: Omit<MatchDayEvent, 'id' | 'matchesGenerated'>
): Promise<MatchDayEvent | { error: string }> => {
  // Simple validation
  if (!eventData.name || !eventData.eventDate || !eventData.courtIds || eventData.courtIds.length === 0) {
    return { error: 'Datos del evento incompletos.' };
  }

  const newEvent: MatchDayEvent = {
    ...eventData,
    id: uuidv4(),
    matchesGenerated: false,
    drawTime: eventData.drawTime,
  };

  state.addMatchDayEventToState(newEvent);
  return newEvent;
};

export const fetchActiveMatchDayEvents = async (clubId: string): Promise<MatchDayEvent[]> => {
  const now = new Date();
  return state.getMockMatchDayEvents().filter(event => 
    event.clubId === clubId && 
    new Date(event.eventDate) > now
  ).sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
};

export const getMatchDayEventById = async (eventId: string): Promise<MatchDayEvent | undefined> => {
    return state.getMockMatchDayEvents().find(e => e.id === eventId);
}

export const addMatchDayInscription = async (eventId: string, userId: string): Promise<MatchDayInscription | { error: string }> => {
    const event = state.getMockMatchDayEvents().find(e => e.id === eventId);
    if (!event) return { error: "Evento no encontrado." };
    
    const user = state.getMockUserDatabase().find(u => u.id === userId);
    if (!user) return { error: "Usuario no encontrado." };

    const existingInscription = state.getMockMatchDayInscriptions().find(i => i.eventId === eventId && i.userId === userId);
    if (existingInscription) return { error: "Ya estás inscrito en este evento." };

    const mainInscriptions = state.getMockMatchDayInscriptions().filter(i => i.eventId === eventId && i.status === 'main');
    const reserveInscriptions = state.getMockMatchDayInscriptions().filter(i => i.eventId === eventId && i.status === 'reserve');
    
    let status: 'main' | 'reserve' = 'main';
    if(mainInscriptions.length >= event.maxPlayers) {
        if(event.reservePlayers && reserveInscriptions.length < event.reservePlayers) {
            status = 'reserve';
        } else {
            return { error: "El evento y la lista de reserva están completos." };
        }
    }
    
    // Block credit if there is a price
    if(event.price && event.price > 0) {
        const availableCredit = (user.credit ?? 0) - (user.blockedCredit ?? 0);
        if(availableCredit < event.price) {
            return { error: `Saldo insuficiente. Necesitas ${event.price.toFixed(2)}€.`};
        }
    }

    const newInscription: MatchDayInscription = {
        id: uuidv4(),
        eventId,
        userId,
        userName: user.name || 'Desconocido',
        userLevel: user.level || 'abierto',
        userProfilePictureUrl: user.profilePictureUrl,
        status,
        inscriptionTime: new Date(),
        amountBlocked: event.price
    };

    state.addMatchDayInscriptionToState(newInscription);
    
    // After adding, recalculate blocked credit for the user
    await recalculateAndSetBlockedBalances(userId);

    return newInscription;
}

export const getMatchDayInscriptions = async (eventId: string): Promise<MatchDayInscription[]> => {
    return state.getMockMatchDayInscriptions().filter(i => i.eventId === eventId);
}

export const cancelMatchDayInscription = async (eventId: string, userId: string): Promise<{ success: true, refundedAmount?: number } | { error: string }> => {
    const inscription = state.getMockMatchDayInscriptions().find(i => i.eventId === eventId && i.userId === userId);
    if (!inscription) return { error: "Inscripción no encontrada." };

    const event = state.getMockMatchDayEvents().find(e => e.id === eventId);
    if (event?.matchesGenerated) return { error: "No se puede cancelar la inscripción, las partidas ya han sido sorteadas." };

    // Mark as cancelled and move to cancelled list
    const cancelledInscription = { ...inscription, cancelledAt: new Date(), status: 'cancelled' as const };
    state.addCancelledInscription(cancelledInscription);
    
    // Remove from active inscriptions
    state.removeMatchDayInscriptionFromState(inscription.id);

    // Promote a reserve player if needed
    if (inscription.status === 'main') {
        const reserveList = state.getMockMatchDayInscriptions()
            .filter(i => i.eventId === eventId && i.status === 'reserve')
            .sort((a, b) => new Date(a.inscriptionTime).getTime() - new Date(b.inscriptionTime).getTime());
        
        if (reserveList.length > 0) {
            const promotedPlayerInscription = reserveList[0];
            state.updateMatchDayInscriptionInState(promotedPlayerInscription.id, { ...promotedPlayerInscription, status: 'main' });
        }
    }
    
    await recalculateAndSetBlockedBalances(userId);

    return { success: true };
};


export const deleteMatchDayEvent = async (eventId: string): Promise<{ success: true } | { error: string }> => {
    state.removeMatchDayEventFromState(eventId);
    // Optionally, handle refunds for all inscribed users. This logic can be complex.
    // For now, we'll just remove the inscriptions associated with the event.
    const inscriptionsToRemove = state.getMockMatchDayInscriptions().filter(i => i.eventId === eventId);
    inscriptionsToRemove.forEach(i => state.removeMatchDayInscriptionFromState(i.id));

    return { success: true };
};


export const manuallyTriggerMatchDayDraw = async (eventId: string): Promise<{ success: true, matchesCreated: number } | { error: string }> => {
    const event = state.getMockMatchDayEvents().find(e => e.id === eventId);
    if (!event) return { error: 'Evento no encontrado.' };
    if (event.matchesGenerated) return { error: 'El sorteo para este evento ya se ha realizado.' };

    const mainInscriptions = state.getMockMatchDayInscriptions().filter(i => i.eventId === eventId && i.status === 'main');
    if (mainInscriptions.length < 4) return { error: 'No hay suficientes jugadores inscritos para realizar el sorteo.' };
    
    let players = [...mainInscriptions];
    let matchesCreatedCount = 0;
    
    // Simple shuffle
    for (let i = players.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [players[i], players[j]] = [players[j], players[i]];
    }

    const availableCourts = event.courtIds;
    let courtIndex = 0;
    
    for (let i = 0; i < players.length; i += 4) {
        const matchPlayers = players.slice(i, i + 4);
        if (matchPlayers.length === 4) {
            const courtId = availableCourts[courtIndex % availableCourts.length];
            const court = state.getMockPadelCourts().find(c => c.id === courtId);
            if (!court) continue; // Skip if court not found

            const newMatch: Omit<Match, 'id'> = {
                clubId: event.clubId,
                startTime: new Date(event.eventDate),
                endTime: event.eventEndTime ? new Date(event.eventEndTime) : addMinutes(new Date(event.eventDate), 90),
                durationMinutes: event.eventEndTime ? (new Date(event.eventEndTime).getTime() - new Date(event.eventDate).getTime()) / 60000 : 90,
                courtNumber: court.courtNumber,
                level: 'abierto',
                category: 'abierta',
                bookedPlayers: matchPlayers.map(p => ({ userId: p.userId, name: p.userName })),
                status: 'confirmed',
                totalCourtFee: event.price,
                eventId: event.id,
            };
            await addMatch(newMatch);
            matchesCreatedCount++;
            courtIndex++;
        }
    }

    // Mark event as drawn
    state.updateMatchDayEventInState(eventId, { ...event, matchesGenerated: true });
    
    return { success: true, matchesCreated: matchesCreatedCount };
};

export const fetchMatchDayEventsForDate = async (date: Date, clubId?: string): Promise<MatchDayEvent[]> => {
    const events = state.getMockMatchDayEvents().filter(event =>
        isSameDay(new Date(event.eventDate), date)
    );
    if(clubId){
        return events.filter(e => e.clubId === clubId)
    }
    return events;
};

export const fetchUserMatchDayInscriptions = async (userId: string): Promise<(MatchDayInscription & { eventDetails?: MatchDayEvent })[]> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const inscriptions = state.getMockMatchDayInscriptions().filter(i => i.userId === userId);
    const events = state.getMockMatchDayEvents();
    
    return inscriptions.map(inscription => {
        const eventDetails = events.find(e => e.id === inscription.eventId);
        return {
            ...inscription,
            eventDetails: eventDetails ? { ...eventDetails } : undefined,
        };
    }).sort((a, b) => new Date(a.eventDetails?.eventDate || 0).getTime() - new Date(b.eventDetails?.eventDate || 0).getTime());
};

export const selectPreferredPartner = async (userId: string, eventId: string, partnerId: string): Promise<{ success: true } | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const inscriptions = state.getMockMatchDayInscriptions();
    const userInscriptionIndex = inscriptions.findIndex(i => i.eventId === eventId && i.userId === userId);

    if (userInscriptionIndex === -1) {
        return { error: 'Debes estar inscrito para seleccionar un compañero.' };
    }
    
    const currentUserInscription = inscriptions[userInscriptionIndex];

    // If clicking on the same partner, deselect them
    if (currentUserInscription.preferredPartnerId === partnerId) {
        inscriptions[userInscriptionIndex].preferredPartnerId = undefined;
    } else {
        inscriptions[userInscriptionIndex].preferredPartnerId = partnerId;
    }

    state.initializeMockMatchDayInscriptions(inscriptions);
    
    return { success: true };
};
