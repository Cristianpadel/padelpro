"use client";

import type { PadelCourt } from '@/types';
import * as state from './index';

export const fetchPadelCourtsByClub = async (clubId: string): Promise<PadelCourt[]> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    return state.getMockPadelCourts().filter(court => court.clubId === clubId);
};

export const addPadelCourt = async (courtData: Omit<PadelCourt, 'id' | 'isActive'>): Promise<PadelCourt | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const existingCourt = state.getMockPadelCourts().find(c => c.clubId === courtData.clubId && c.courtNumber === courtData.courtNumber);
    if (existingCourt) {
        return { error: 'Ya existe una pista con ese número en este club.' };
    }
    const newCourt: PadelCourt = {
        ...courtData,
        id: `court-${Date.now()}`,
        isActive: true,
    };
    state.addPadelCourtToState(newCourt);
    return newCourt;
};

export const updatePadelCourt = async (courtId: string, updates: Partial<PadelCourt>): Promise<PadelCourt | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const updatedCourt = state.updatePadelCourtInState(courtId, updates);
    if (!updatedCourt) {
        return { error: 'Pista no encontrada.' };
    }
    return updatedCourt;
};

export const deletePadelCourt = async (courtId: string): Promise<{ success: true } | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const success = state.removePadelCourtFromState(courtId);
    if (!success) {
        return { error: 'Pista no encontrada.' };
    }
    return { success: true };
};
