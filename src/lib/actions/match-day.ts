"use client";

import { isSameDay, startOfDay, addMinutes, differenceInMinutes, getDay, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import type { MatchDayEvent, MatchDayInscription, User, Match } from '@/types';
import { matchPadelLevels } from '@/types';
import * as state from '../state';
import * as config from '../config';
import { addUserPointsAndAddTransaction, recalculateAndSetBlockedBalances, deductCredit } from './users';
import { getInitials } from '@/lib/utils';
import { addMatch, removePlayerFromMatch } from './matches';

export const createMatchDayEvent = async (
    eventData: Omit<MatchDayEvent, 'id' | 'drawTime'>
): Promise<MatchDayEvent | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const drawTime = new Date(eventData.eventDate);
    drawTime.setDate(drawTime.getDate() - 1);
    drawTime.setHours(20, 0, 0, 0);

    const newEvent: MatchDayEvent = {
        ...eventData,
        id: `mde-${eventData.clubId}-${Date.now().toString().slice(-6)}`,
        drawTime,
        eventEndTime: eventData.eventEndTime || addMinutes(new Date(eventData.eventDate), 180),
    };
    
    const events = state.getMockMatchDayEvents();
    state.initializeMockMatchDayEvents([...events, newEvent]);
    return newEvent;
};

export const updateMatchDayEvent = async (
    eventId: string,
    updateData: Partial<Omit<MatchDayEvent, 'id' | 'clubId'>>
): Promise<MatchDayEvent | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const events = state.getMockMatchDayEvents();
    const eventIndex = events.findIndex(e => e.id === eventId);
    if (eventIndex === -1) return { error: "Evento no encontrado." };

    // Prevent reducing maxPlayers below current inscription count
    const inscriptions = state.getMockMatchDayInscriptions().filter(i => i.eventId === eventId && i.status === 'main');
    if (updateData.maxPlayers && updateData.maxPlayers < inscriptions.length) {
        return { error: `No se puede reducir el número de plazas por debajo de los ${inscriptions.length} jugadores ya inscritos.` };
    }

    const updatedEvent = { ...events[eventIndex], ...updateData };
    
    // Recalculate drawTime if eventDate changes
    if (updateData.eventDate) {
        const newDrawTime = new Date(updateData.eventDate);
        newDrawTime.setDate(newDrawTime.getDate() - 1);
        newDrawTime.setHours(20, 0, 0, 0);
        updatedEvent.drawTime = newDrawTime;
    }

    if (updateData.eventDate && !updateData.eventEndTime) {
         updatedEvent.eventEndTime = addMinutes(new Date(updateData.eventDate), 180);
    }

    events[eventIndex] = updatedEvent;
    state.initializeMockMatchDayEvents(events);
    return updatedEvent;
};

export const deleteMatchDayEvent = async (eventId: string): Promise<{ success: true } | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    
    // TODO: In a real app, handle refunds for inscribed users.
    const inscriptions = state.getMockMatchDayInscriptions();
    state.initializeMockMatchDayInscriptions(inscriptions.filter(i => i.eventId !== eventId));

    const events = state.getMockMatchDayEvents();
    const updatedEvents = events.filter(e => e.id !== eventId);
    if (events.length === updatedEvents.length) {
        return { error: "Evento no encontrado." };
    }
    state.initializeMockMatchDayEvents(updatedEvents);
    return { success: true };
};


export const getMatchDayEvent = async (eventId: string): Promise<MatchDayEvent | null> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const event = state.getMockMatchDayEvents().find(e => e.id === eventId);
    if (!event) return null;

    const cancelledInscriptions = state.getMockMatchDayCancelledInscriptions().filter(i => i.eventId === eventId);
    return { ...JSON.parse(JSON.stringify(event)), cancelledInscriptions };
};

export const fetchActiveMatchDayEvents = async (clubId: string): Promise<MatchDayEvent[]> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const today = startOfDay(new Date());
    const events = state.getMockMatchDayEvents()
        .filter(e => e.clubId === clubId && new Date(e.eventDate) >= today)
        .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
    return JSON.parse(JSON.stringify(events));
};


export const fetchMatchDayEventsForDate = async (date: Date, clubId?: string): Promise<MatchDayEvent[]> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const events = state.getMockMatchDayEvents();
    const foundEvents = events.filter(event => {
        return isSameDay(new Date(event.eventDate), startOfDay(date)) &&
        (!clubId || event.clubId === clubId)
    });
    return foundEvents.map(e => ({ ...JSON.parse(JSON.stringify(e)), eventId: e.id }));
};

export const getMatchDayInscriptions = async (eventId: string): Promise<MatchDayInscription[]> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    return state.getMockMatchDayInscriptions()
        .filter(i => i.eventId === eventId)
        .sort((a, b) => new Date(a.inscriptionTime).getTime() - new Date(b.inscriptionTime).getTime());
};

export const fetchUserMatchDayInscriptions = async (userId: string): Promise<(MatchDayInscription & { eventDetails?: MatchDayEvent })[]> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const allEvents = state.getMockMatchDayEvents();
    const userInscriptions = state.getMockMatchDayInscriptions()
        .filter(i => i.userId === userId)
        .map(inscription => {
            const eventDetails = allEvents.find(e => e.id === inscription.eventId);
            // Filter out inscriptions for events that have already passed
            if (eventDetails && new Date(eventDetails.eventDate) >= startOfDay(new Date())) {
                return { ...inscription, eventDetails };
            }
            return null;
        })
        .filter((i): i is MatchDayInscription & { eventDetails: MatchDayEvent } => i !== null)
        .sort((a, b) => new Date(a.eventDetails!.eventDate).getTime() - new Date(b.eventDetails!.eventDate).getTime());
    
    return JSON.parse(JSON.stringify(userInscriptions));
};

export const inscribeInMatchDay = async (
    userId: string,
    eventId: string
): Promise<{ inscription: MatchDayInscription } | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));

    const event = state.getMockMatchDayEvents().find(e => e.id === eventId);
    if (!event) return { error: "Evento no encontrado." };

    const inscriptions = state.getMockMatchDayInscriptions().filter(i => i.eventId === eventId);
    if (inscriptions.some(i => i.userId === userId)) return { error: "Ya estás inscrito en este evento." };

    const user = state.getMockUserDatabase().find(s => s.id === userId);
    if (!user) return { error: "Usuario no encontrado." };
    
    const inscriptionPrice = event.price || 0;
    if ((user.credit ?? 0) < inscriptionPrice) {
        return { error: `Saldo insuficiente. Necesitas ${inscriptionPrice.toFixed(2)}€.` };
    }

    const mainListCount = inscriptions.filter(i => i.status === 'main').length;
    const reserveListCount = inscriptions.filter(i => i.status === 'reserve').length;

    let status: 'main' | 'reserve' = 'reserve';
    if (mainListCount < event.maxPlayers) {
        status = 'main';
    } else if (reserveListCount >= (event.reservePlayers || 0)) {
        return { error: "La lista de inscritos y reservas está completa." };
    }

    const newInscription: MatchDayInscription = {
        id: `mdi-${eventId}-${userId}`,
        eventId,
        userId,
        userName: user.name || `Usuario ${userId.slice(-4)}`,
        userLevel: user.level || 'abierto',
        userProfilePictureUrl: user.profilePictureUrl,
        status,
        inscriptionTime: new Date(),
        amountBlocked: inscriptionPrice,
    };

    state.initializeMockMatchDayInscriptions([...inscriptions, newInscription]);
    
    // Recalculate and block balance
    await recalculateAndSetBlockedBalances(userId);

    return { inscription: newInscription };
};

export const withdrawFromMatchDay = async (
    userId: string,
    eventId: string
): Promise<{ success: true; message: string; penaltyApplied?: boolean; promotedUser?: User } | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));

    let allInscriptions = state.getMockMatchDayInscriptions();
    const event = state.getMockMatchDayEvents().find(e => e.id === eventId);
    if (!event) return { error: "Evento no encontrado." };

    const inscriptionIndex = allInscriptions.findIndex(i => i.eventId === eventId && i.userId === userId);
    if (inscriptionIndex === -1) return { error: "No estabas inscrito en este evento." };
    
    const inscriptionToRemove = allInscriptions[inscriptionIndex];
    
    let message = "";
    if (event.matchesGenerated) {
        const pointsToRefund = Math.round(inscriptionToRemove.amountBlocked || 0);
        await addUserPointsAndAddTransaction(
            userId,
            pointsToRefund,
            'devolucion_cancelacion_anticipada',
            `Reembolso en puntos por cancelación post-sorteo`,
            eventId,
            event.clubId
        );
        message = `Te has dado de baja tras el sorteo. Se han reembolsado ${pointsToRefund} puntos a tu cuenta.`;

        // Find the match the user was in and remove them
        const matchTheUserWasIn = state.getMockMatches().find(m => m.eventId === eventId && (m.bookedPlayers || []).some(p => p.userId === userId));
        if (matchTheUserWasIn) {
            await removePlayerFromMatch(matchTheUserWasIn.id, userId, true); // System removal, no double refund
        }

    } else {
        message = `Te has dado de baja del evento. Tu saldo bloqueado será liberado.`;
    }

    let updatedInscriptions = allInscriptions.filter(i => i.id !== inscriptionToRemove.id);
    let promotedUser: User | undefined = undefined;

    if (inscriptionToRemove.status === 'main' && !event.matchesGenerated) {
        const reserveList = updatedInscriptions
            .filter(i => i.eventId === eventId && i.status === 'reserve')
            .sort((a, b) => new Date(a.inscriptionTime).getTime() - new Date(b.inscriptionTime).getTime());

        if (reserveList.length > 0) {
            const promotedUserInscription = reserveList[0];
            const promotedUserId = promotedUserInscription.userId;
            
            const promotedUserDB = state.getMockUserDatabase().find(u => u.id === promotedUserId);
            const price = event?.price || 0;
            if (promotedUserDB && (promotedUserDB.credit ?? 0) >= price) {
                 updatedInscriptions = updatedInscriptions.map(insc => {
                    if (insc.userId === promotedUserId && insc.eventId === eventId) {
                        return { ...insc, status: 'main', amountBlocked: price };
                    }
                    return insc;
                });
                await recalculateAndSetBlockedBalances(promotedUserId);
                promotedUser = { id: promotedUserDB.id, name: promotedUserDB.name };
                 if (promotedUser) {
                    message += ` El jugador ${promotedUser.name} ha sido promovido de la lista de reserva.`;
                }
            } else {
                updatedInscriptions = updatedInscriptions.filter(i => i.id !== promotedUserInscription.id);
                promotedUser = undefined;
            }
        }
    }
    
    state.initializeMockMatchDayInscriptions(updatedInscriptions);
    await recalculateAndSetBlockedBalances(userId); // Unblocks credit for the canceller
    
    return { success: true, message, penaltyApplied: false, promotedUser };
};


export const selectPreferredPartner = async (
    userId: string,
    eventId: string,
    partnerId: string | null
): Promise<{ success: true } | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    
    const inscriptions = state.getMockMatchDayInscriptions();
    const userInscriptionIndex = inscriptions.findIndex(i => i.eventId === eventId && i.userId === userId);
    if (userInscriptionIndex === -1) return { error: "Debes estar inscrito para elegir un compañero." };

    if (partnerId && !inscriptions.some(i => i.eventId === eventId && i.userId === partnerId)) {
        return { error: "El compañero seleccionado no está inscrito en este evento." };
    }
    
    inscriptions[userInscriptionIndex].preferredPartnerId = partnerId || undefined;
    state.initializeMockMatchDayInscriptions(inscriptions);
    
    return { success: true };
};

export const manuallyTriggerMatchDayDraw = async (
  eventId: string
): Promise<{ success: true; matchesCreated: number; createdMatches: Match[], playersOnReserve: MatchDayInscription[] } | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));

    const eventIndex = state.getMockMatchDayEvents().findIndex(e => e.id === eventId);
    if (eventIndex === -1) return { error: "Evento no encontrado." };
    let event = state.getMockMatchDayEvents()[eventIndex];

    if (event.matchesGenerated) return { error: "El sorteo para este evento ya ha sido realizado." };

    let allInscriptionsForEvent = await getMatchDayInscriptions(eventId);
    // Sort by inscription time to fairly determine who is left out
    allInscriptionsForEvent.sort((a,b) => new Date(a.inscriptionTime).getTime() - new Date(b.inscriptionTime).getTime());
        
    let mainListInscriptions = allInscriptionsForEvent.filter(i => i.status === 'main');
    const reserveListInscriptions = allInscriptionsForEvent.filter(i => i.status === 'reserve');

    if (mainListInscriptions.length < 3) {
        return { error: "Se necesitan al menos 3 jugadores en la lista principal para realizar el sorteo." };
    }
    
    // --- PAYMENT PROCESSING ---
    for (const inscription of mainListInscriptions) {
        const user = state.getMockUserDatabase().find(u => u.id === inscription.userId);
        const cost = inscription.amountBlocked || 0;
        if (user && cost > 0) {
            // This is the actual charge moment. The credit was already blocked.
            deductCredit(user.id, cost, { ...event, startTime: event.eventDate, endTime: event.eventEndTime || event.eventDate } as any, 'Partida');
             await recalculateAndSetBlockedBalances(user.id);
        }
    }
    // --- END PAYMENT PROCESSING ---

    const getNumericLevel = (level: string) => level === 'abierto' ? 1.0 : parseFloat(level);

    type Pairing = { p1: MatchDayInscription, p2: MatchDayInscription, teamLevel: number };
    let pairings: Pairing[] = [];
    let singles = [...mainListInscriptions];
    const handledUserIds = new Set<string>();

    // 1. Honor mutual preferences first
    for (const p1 of mainListInscriptions) {
        if (handledUserIds.has(p1.userId) || !p1.preferredPartnerId) continue;
        const p2 = mainListInscriptions.find(p => p.userId === p1.preferredPartnerId);
        if (p2 && p2.preferredPartnerId === p1.userId && !handledUserIds.has(p2.userId)) {
            const p1Level = getNumericLevel(p1.userLevel);
            const p2Level = getNumericLevel(p2.userLevel);
            pairings.push({ p1, p2, teamLevel: Math.min(p1Level, p2Level) });
            handledUserIds.add(p1.userId);
            handledUserIds.add(p2.userId);
        }
    }

    // 2. Pair up remaining singles by level
    singles = singles.filter(s => !handledUserIds.has(s.userId));
    singles.sort((a, b) => getNumericLevel(a.userLevel) - getNumericLevel(b.userLevel));
    
    while (singles.length >= 2) {
        const p1 = singles.shift()!;
        let bestPartnerIndex = -1;
        let smallestDiff = Infinity;
        
        for (let i = 0; i < singles.length; i++) {
            const diff = Math.abs(getNumericLevel(p1.userLevel) - getNumericLevel(singles[i].userLevel));
            if (diff < smallestDiff) {
                smallestDiff = diff;
                bestPartnerIndex = i;
            }
        }
        
        const p2 = singles.splice(bestPartnerIndex, 1)[0];
        const p1Level = getNumericLevel(p1.userLevel);
        const p2Level = getNumericLevel(p2.userLevel);
        pairings.push({ p1, p2, teamLevel: Math.min(p1Level, p2Level) });
    }
    
    // 3. Create matches by pairing teams with similar team levels
    pairings.sort((a, b) => a.teamLevel - b.teamLevel);

    const createdMatches: Match[] = [];
    while (pairings.length >= 2) {
        const pairing1 = pairings.shift()!;
        const pairing2 = pairings.shift()!;
        
        const allFourPlayers = [pairing1.p1, pairing1.p2, pairing2.p1, pairing2.p2];
        const totalLevel = allFourPlayers.reduce((sum, p) => sum + getNumericLevel(p.userLevel), 0);
        const matchAvgLevel = totalLevel / 4;
        
        const closestLevel = [...matchPadelLevels].filter(l => l !== 'abierto').sort((a, b) => 
            Math.abs(parseFloat(a) - matchAvgLevel) - Math.abs(parseFloat(b) - matchAvgLevel)
        )[0];
        
        const newMatchData: Omit<Match, 'id'> = {
            clubId: event.clubId,
            startTime: event.eventDate,
            endTime: event.eventEndTime || addMinutes(event.eventDate, 90),
            level: closestLevel,
            category: 'abierta',
            bookedPlayers: allFourPlayers.map(p => ({ userId: p.userId, name: p.userName })),
            totalCourtFee: event.price ? event.price * 4 : 0,
            eventId: event.id,
            isPlaceholder: false,
            status: 'confirmed',
            durationMinutes: 90,
        };

        const result = await addMatch(newMatchData);
        if (!('error' in result)) {
            createdMatches.push(result);
        }
    }

    let playersLeftOver = [...singles];
    if (pairings.length === 1) {
        playersLeftOver.push(pairings[0].p1, pairings[0].p2);
    }
    
    // Handle case where exactly 3 players are left to form an incomplete match
    if (playersLeftOver.length === 3) {
        const threePlayers = playersLeftOver;
        playersLeftOver = []; // Clear the leftovers as they are now in a match

        const totalLevel = threePlayers.reduce((sum, p) => sum + getNumericLevel(p.userLevel), 0);
        const matchAvgLevel = totalLevel / 3;
         const closestLevel = [...matchPadelLevels].filter(l => l !== 'abierto').sort((a, b) => 
            Math.abs(parseFloat(a) - matchAvgLevel) - Math.abs(parseFloat(b) - matchAvgLevel)
        )[0];

        const newIncompleteMatchData: Omit<Match, 'id'> = {
            clubId: event.clubId,
            startTime: event.eventDate,
            endTime: event.eventEndTime || addMinutes(event.eventDate, 90),
            level: closestLevel,
            category: 'abierta',
            bookedPlayers: threePlayers.map(p => ({ userId: p.userId, name: p.userName })),
            totalCourtFee: event.price ? event.price * 4 : 0,
            eventId: event.id,
            isPlaceholder: false,
            status: 'forming', // It's not confirmed yet
            durationMinutes: 90,
        };

         const result = await addMatch(newIncompleteMatchData);
        if (!('error' in result)) {
            createdMatches.push(result);
        }
    }

    // Any remaining players (1 or 2) become reserves, along with the original reserve list
    const playersOnReserve = [...playersLeftOver, ...reserveListInscriptions];


    event.matchesGenerated = true;
    state.updateMatchDayEventInState(eventId, event);

    return { success: true, matchesCreated: createdMatches.length, createdMatches, playersOnReserve };
};
