// src/lib/actions/match-day.ts
"use client";

import type { MatchDayEvent, MatchDayInscription, User, Match } from '@/types';
import * as state from '../state';
import * as config from '../config';
import { startOfDay, isSameDay } from 'date-fns';

export const createMatchDayEvent = async (eventData: Omit<MatchDayEvent, 'id' | 'matchesGenerated'>): Promise<MatchDayEvent | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const newEvent: MatchDayEvent = {
        ...eventData,
        id: `mde-${Date.now()}`,
        matchesGenerated: false,
    };
    const events = state.getMockMatchDayEvents();
    state.initializeMockMatchDayEvents([...events, newEvent]);
    return newEvent;
};

export const fetchActiveMatchDayEvents = async (clubId: string): Promise<MatchDayEvent[]> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const now = new Date();
    return state.getMockMatchDayEvents().filter(event =>
        event.clubId === clubId && new Date(event.eventDate) >= now
    ).sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
};

export const fetchMatchDayEventsForDate = async (date: Date, clubId?: string): Promise<MatchDayEvent[]> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    return state.getMockMatchDayEvents().filter(event =>
        (!clubId || event.clubId === clubId) && isSameDay(new Date(event.eventDate), startOfDay(date))
    );
};


export const getMatchDayInscriptions = async (eventId: string): Promise<MatchDayInscription[]> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    return state.getMockMatchDayInscriptions().filter(i => i.eventId === eventId);
};

export const deleteMatchDayEvent = async (eventId: string): Promise<{ success: true } | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const events = state.getMockMatchDayEvents().filter(e => e.id !== eventId);
    state.initializeMockMatchDayEvents(events);
    // Also remove related inscriptions
    const inscriptions = state.getMockMatchDayInscriptions().filter(i => i.eventId !== eventId);
    state.initializeMockMatchDayInscriptions(inscriptions);
    return { success: true };
};

export const manuallyTriggerMatchDayDraw = async (eventId: string): Promise<{ success: true, matchesCreated: number } | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const event = state.getMockMatchDayEvents().find(e => e.id === eventId);
    if (!event) {
        return { error: 'Evento no encontrado.' };
    }
    if (event.matchesGenerated) {
        return { error: 'El sorteo para este evento ya ha sido realizado.' };
    }

    const inscriptions = await getMatchDayInscriptions(eventId);
    const mainList = inscriptions.filter(i => i.status === 'main');
    
    if (mainList.length < 4) {
        return { error: 'No hay suficientes jugadores en la lista principal para crear al menos una partida.' };
    }

    // Simple shuffling logic
    const shuffledPlayers = [...mainList].sort(() => 0.5 - Math.random());

    let matchesCreated = 0;
    const allMatches = state.getMockMatches();

    for (let i = 0; i < Math.floor(shuffledPlayers.length / 4); i++) {
        const playersForMatch = shuffledPlayers.slice(i * 4, (i * 4) + 4);
        if (playersForMatch.length < 4) continue;

        const courtId = event.courtIds[i % event.courtIds.length];
        const court = state.getMockPadelCourts().find(c => c.id === courtId);
        if (!court) continue;

        const newMatch: Match = {
            id: `match-mde-${eventId}-${i}`,
            clubId: event.clubId,
            startTime: event.eventDate,
            endTime: new Date(new Date(event.eventDate).getTime() + 90 * 60000), // Assume 90 min matches
            durationMinutes: 90,
            courtNumber: court.courtNumber,
            level: 'abierto', // Level is mixed in match-day
            category: 'abierta',
            status: 'confirmed',
            bookedPlayers: playersForMatch.map(p => ({ userId: p.userId, name: p.userName })),
            isPlaceholder: false,
            totalCourtFee: 0, // Match-day is pre-paid
            eventId: eventId,
        };
        allMatches.push(newMatch);
        matchesCreated++;
    }
    
    state.initializeMockMatches(allMatches);
    event.matchesGenerated = true;
    state.updateMatchDayEventInState(event.id, event);

    return { success: true, matchesCreated };
};
