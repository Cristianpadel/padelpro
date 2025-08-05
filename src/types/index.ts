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
export const dayOfWeekLabels: Record<DayOfWeek, string> = {
    Lunes: 'Lunes',
    Martes: 'Martes',
    Miércoles: 'Miércoles',
    Jueves: 'Jueves',
    Viernes: 'Viernes',
    Sábado: 'Sábado',
    Domingo: 'Domingo',
};


export interface Club {
    id: string;
    name: string;
    showClassesTabOnFrontend?: boolean;
    showMatchesTabOnFrontend?: boolean;
    isMatchDayEnabled?: boolean;
    // other club properties
}

export interface Instructor {
    id: string;
    name: string;
    email?: string;
    isAvailable: boolean;
    isBlocked?: boolean;
    assignedClubId: string;
    assignedCourtNumber?: number;
    defaultRatePerHour?: number;
    rateTiers?: InstructorRateTier[];
    // other instructor properties
}

export interface PadelCourt {
    id: string;
    name: string;
    clubId: string;
    courtNumber: number;
    isActive?: boolean;
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
    status?: 'forming' | 'confirmed' | 'confirmed_private' | 'cancelled';
    // other slot properties
}

export interface Match {
    id: string;
    clubId: string;
    startTime: Date;
    durationMinutes: number;
    courtNumber: number;
    level: MatchPadelLevel;
    category: PadelCategoryForSlot;
    status?: 'forming' | 'confirmed' | 'cancelled';
}

export interface PointTransaction {
    id: string;
    clubId: string;
    studentId: string;
    amount: number;
    reason: string;
    date: Date;
}

export interface User {
    id: string;
    name: string;
    loyaltyPoints?: number;
}

export interface ClubLevelRange {
    min: number;
    max: number;
}

export interface MatchDayEvent {
    id: string;
    name: string;
    clubId: string;
    date: Date;
}

export interface CourtGridBooking {
    id: string;
    clubId: string;
    courtNumber: number;
    startTime: Date;
    endTime: Date;
    title: string;
    type: 'clase' | 'partida' | 'mantenimiento' | 'reserva_manual' | 'bloqueo_provisional';
    status?: PadelCourtStatus;
    activityStatus?: TimeSlot['status'] | Match['status'];
    provisionalExpiresAt?: Date;
    participants?: number;
    maxParticipants?: number;
}

export type PadelCourtStatus = 'disponible' | 'reservada' | 'mantenimiento' | 'desactivada' | 'bloqueo_provisional' | 'proceso_inscripcion';

export interface InstructorRateTier {
  id: string;
  days: DayOfWeek[];
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  rate: number;
}
