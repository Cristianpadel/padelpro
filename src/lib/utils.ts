import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

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