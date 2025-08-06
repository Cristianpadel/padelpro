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

export const isUserLevelCompatibleWithActivity = (activityLevel: ClassPadelLevel | MatchPadelLevel, userLevel: MatchPadelLevel | undefined): boolean => {
    if (!userLevel || userLevel === 'abierto' || activityLevel === 'abierto') {
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
