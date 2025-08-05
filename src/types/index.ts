// types/index.ts

export type PadelCategoryForSlot = 'abierta' | 'chica' | 'chico';

export const padelCategoryForSlotOptions: { value: PadelCategoryForSlot, label: string }[] = [
    { value: 'abierta', label: 'Abierta (Mixto)' },
    { value: 'chica', label: 'Chicas' },
    { value: 'chico', label: 'Chicos' },
];

export const numericMatchPadelLevels = [
    "1.0", "1.5", "2.0", "2.5", "3.0", "3.5", "4.0", "4.5", "5.0", "5.5", "6.0", "6.5", "7.0"
] as const;

export type NumericMatchPadelLevel = typeof numericMatchPadelLevels[number];

export const matchPadelLevels: NumericMatchPadelLevel[] = [...numericMatchPadelLevels];

export type PadelLevelRange = {
    min: NumericMatchPadelLevel;
    max: NumericMatchPadelLevel;
};

export type ClassPadelLevel = 'abierto' | PadelLevelRange;
export type MatchPadelLevel = 'abierto' | NumericMatchPadelLevel | PadelLevelRange;

export const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const;
export type DayOfWeek = typeof daysOfWeek[number];


export interface Club {
    id: string;
    name: string;
    // other club properties
}

export interface Instructor {
    id: string;
    name: string;
    isAvailable: boolean;
    assignedClubId: string;
    assignedCourtNumber?: number;
    // other instructor properties
}

export interface PadelCourt {
    id: string;
    name: string;
    clubId: string;
    courtNumber: number;
    // other court properties
}

export interface TimeSlot {
    id: string;
    clubId: string;
    startTime: Date;
    durationMinutes: number;
    instructorId: string;
    maxPlayers: number;
    courtNumber: number;
    level: ClassPadelLevel;
    category: PadelCategoryForSlot;
    // other slot properties
}
