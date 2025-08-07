// src/lib/mockDataSources/clubs.ts
"use client";
import type { Club, DayOfWeek, TimeRange, CourtRateTier, Instructor } from '@/types';
import * as state from './index';
import { daysOfWeek } from '@/types';
import { getDay, parse, format } from 'date-fns';

export const calculateActivityPrice = (club: Club, startTime: Date): number => {
    if (club.dynamicPricingEnabled) {
        // Dynamic pricing logic would go here
        // For now, let's use a simplified version of the fixed tiers
        const dayOfWeek = daysOfWeek[getDay(startTime)];
        const time = format(startTime, 'HH:mm');
        const matchingTier = club.dynamicPricingTiers?.find(tier =>
            tier.days.includes(dayOfWeek) && time >= tier.startTime && time < tier.endTime
        );
        return matchingTier ? matchingTier.startPrice : 20; // Default to 20 if no tier matches
    }

    const dayOfWeek = daysOfWeek[getDay(startTime)];
    const time = format(startTime, 'HH:mm');
    const matchingTier = club.courtRateTiers?.find(tier =>
        tier.days.includes(dayOfWeek) && time >= tier.startTime && time < tier.endTime
    );
    return matchingTier ? matchingTier.rate : 20; // Default to 20 if no tier matches
};

export const getInstructorRate = (instructor: Instructor, startTime: Date): number => {
    if (!instructor.rateTiers || instructor.rateTiers.length === 0) {
        return instructor.defaultRatePerHour || 0;
    }
    const dayOfWeek = daysOfWeek[getDay(startTime)];
    const time = format(startTime, 'HH:mm');
    const matchingTier = instructor.rateTiers.find(tier =>
        tier.days.includes(dayOfWeek) && time >= tier.startTime && time < tier.endTime
    );
    return matchingTier ? matchingTier.rate : (instructor.defaultRatePerHour || 0);
};

export const updateClub = async (clubId: string, updates: Partial<Club>): Promise<Club | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const clubIndex = state.getMockClubs().findIndex(c => c.id === clubId);
    if (clubIndex === -1) {
        return { error: 'Club no encontrado.' };
    }
    const updatedClub = { ...state.getMockClubs()[clubIndex], ...updates };
    state.updateClubInState(updatedClub);
    return updatedClub;
};

export const updateClubAdminPassword = async (clubId: string, currentPasswordInForm: string, newPasswordInForm: string): Promise<{ success: true } | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const club = state.getMockClubs().find(c => c.id === clubId);
    if (!club) {
        return { error: "Club no encontrado." };
    }

    // Check if the current password is correct
    if (club.adminPassword !== currentPasswordInForm) {
        return { error: "La contraseña actual es incorrecta." };
    }
    
    // Update to the new password
    club.adminPassword = newPasswordInForm;
    state.updateClubInState(club);
    
    return { success: true };
};
