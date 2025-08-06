import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { ClassPadelLevel, MatchPadelLevel } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getInitials = (name: string) => {
    if (!name) return '??';
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

export const getPlaceholderUserName = (userId: string, currentUserId?: string, currentUserName?: string) => {
    if (userId === currentUserId) return currentUserName || "Tú";
    return `Jugador ${userId.substring(0,4)}`;
}

export const calculatePricePerPerson = (totalPrice: number, groupSize: number): number => {
    if (groupSize <= 0) return totalPrice;
    return totalPrice / groupSize;
};

export const isUserLevelCompatibleWithActivity = (activityLevel: ClassPadelLevel | MatchPadelLevel, userLevel: MatchPadelLevel | undefined, isPlaceholder?: boolean): boolean => {
    if (!userLevel || userLevel === 'abierto' || activityLevel === 'abierto' || isPlaceholder) {
        return true;
    }

    if (typeof activityLevel === 'object' && 'min' in activityLevel) { // It's a ClassPadelLevel range
        const classMin = parseFloat(activityLevel.min);
        const classMax = parseFloat(activityLevel.max);
        const playerLvlNum = parseFloat(userLevel);
        if (!isNaN(playerLvlNum) && !isNaN(classMin) && !isNaN(classMax)) {
            return playerLvlNum >= classMin && playerLvlNum <= classMax;
        }
    } else if (typeof activityLevel === 'string') { // It's a MatchPadelLevel
        return userLevel === activityLevel;
    }
    
    return false; // Default to not compatible
}


export const hasAnyConfirmedActivityForDay = (userId: string, date: Date, excludingId?: string, type?: 'class' | 'match'): boolean => {
    // This is a placeholder for a more complex check against the user's full schedule.
    // For now, it returns false to allow booking.
    return false;
};

export const findAvailableCourt = (clubId: string, startTime: Date, endTime: Date): PadelCourt | null => {
    // This is a placeholder. A real implementation would check for court availability.
    const courts = getMockPadelCourts().filter(c => c.clubId === clubId && c.isActive);
    return courts.length > 0 ? courts[0] : null;
};

export const isSlotGratisAndAvailable = (slot: TimeSlot): boolean => {
    if (!slot.designatedGratisSpotPlaceholderIndexForOption) return false;
    for (const [size, index] of Object.entries(slot.designatedGratisSpotPlaceholderIndexForOption)) {
        if (index !== null && index !== undefined) {
             const bookingInSpot = (slot.bookedPlayers || []).find((p, idx) => p.groupSize === parseInt(size) && idx === index);
             if (!bookingInSpot) return true;
        }
    }
    return false;
};

// Annul conflicting pre-registrations
export const _annulConflictingActivities = (confirmedActivity: TimeSlot | Match) => {
    // Placeholder for a more complex logic
};

export const removeUserPreInscriptionsForDay = async (userId: string, date: Date, excludingId: string, type: 'class' | 'match') => {
    // Placeholder
};

export const findConflictingConfirmedActivity = (activity: TimeSlot, allTimeSlots: TimeSlot[], allMatches: Match[]): TimeSlot | Match | null => {
    // Placeholder
    return null;
}