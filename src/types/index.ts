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
export type MatchPadelLevel = 'abierto' | NumericMatchPadelLevel;

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

export interface PenaltyTier {
    hoursBefore: number;
    penaltyPercentage: number;
}

export interface PointSettings {
    cancellationPointPerEuro?: number;
    inviteFriend?: number;
    firstToJoinClass?: number;
    firstToJoinMatch?: number;
    pointsCostForCourt?: number;
    cancellationPenaltyTiers?: PenaltyTier[];
}

export interface ClubLevelRange {
    name: string;
    min: NumericMatchPadelLevel;
    max: NumericMatchPadelLevel;
    color?: string;
}

export interface TimeRange {
    start: string; // "HH:mm"
    end: string;   // "HH:mm"
}

export interface CourtRateTier {
  id: string;
  name: string;
  days: DayOfWeek[];
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  rate: number; // price per hour
}

export interface DynamicPricingTier {
  id: string;
  days: DayOfWeek[];
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  minPrice: number;
  startPrice: number;
  maxPrice: number;
}

export type ProductCategory = 'pala' | 'pelotas' | 'ropa' | 'accesorios';

export const productCategories: { value: ProductCategory, label: string }[] = [
    { value: 'pala', label: 'Palas' },
    { value: 'pelotas', label: 'Pelotas' },
    { value: 'ropa', label: 'Ropa' },
    { value: 'accesorios', label: 'Accesorios' },
];

export interface Product {
    id: string;
    clubId: string;
    name: string;
    category: ProductCategory;
    status: 'in-stock' | 'on-order';
    officialPrice: number;
    offerPrice: number;
    images: string[];
    aiHint: string;
    isDealOfTheDay?: boolean;
}

export interface CardShadowEffectSettings {
    enabled: boolean;
    color: string;
    intensity: number; // Stored as 0 to 1
}


export interface Club {
    id: string;
    name: string;
    showClassesTabOnFrontend?: boolean;
    showMatchesTabOnFrontend?: boolean;
    isMatchDayEnabled?: boolean;
    pointSettings?: PointSettings;
    levelRanges?: ClubLevelRange[];
    unavailableMatchHours?: Partial<Record<DayOfWeek, TimeRange[]>>;
    pointBookingSlots?: Partial<Record<DayOfWeek, TimeRange[]>>;
    dynamicPricingEnabled?: boolean;
    courtRateTiers?: CourtRateTier[];
    dynamicPricingTiers?: DynamicPricingTier[];
    shopReservationFee?: number;
    cardShadowEffect?: CardShadowEffectSettings;
}

export interface Instructor {
    id: string;
    name: string;
    email?: string;
    profilePictureUrl?: string;
    isAvailable: boolean;
    isBlocked?: boolean;
    assignedClubId: string | 'all';
    assignedCourtNumber?: number;
    defaultRatePerHour?: number;
    rateTiers?: InstructorRateTier[];
}

export interface PadelCourt {
    id: string;
    name: string;
    clubId: string;
    courtNumber: number;
    isActive: boolean;
    // other court properties
}

export interface Booking {
    id: string;
    userId: string;
    activityId: string;
    activityType: 'class' | 'match';
    groupSize: 1 | 2 | 3 | 4;
    spotIndex: number;
    status: 'pending' | 'confirmed' | 'cancelled';
}

export interface TimeSlot {
    id: string;
    clubId: string;
    startTime: Date;
    endTime: Date;
    durationMinutes: number;
    instructorId: string;
    instructorName: string;
    maxPlayers: number;
    courtNumber: number;
    level: ClassPadelLevel;
    category: PadelCategoryForSlot;
    status: 'pre_registration' | 'forming' | 'confirmed' | 'confirmed_private' | 'cancelled';
    bookedPlayers: { userId: string, name?: string, isSimulated?: boolean, groupSize: 1|2|3|4 }[];
    designatedGratisSpotPlaceholderIndexForOption?: { [key in 1 | 2 | 3 | 4]?: number };
    organizerId?: string;
    privateShareCode?: string;
    confirmedPrivateSize?: 1 | 2 | 3 | 4;
    totalPrice?: number;
}

export interface Match {
    id: string;
    clubId: string;
    startTime: Date;
    endTime: Date;
    durationMinutes: number;
    courtNumber: number;
    level: MatchPadelLevel;
    category: PadelCategoryForSlot;
    status: 'forming' | 'confirmed' | 'confirmed_private' | 'cancelled';
    bookedPlayers: { userId: string, name?: string, isSimulated?: boolean }[];
    isPlaceholder?: boolean;
    isProvisional?: boolean;
    provisionalForUserId?: string;
    provisionalExpiresAt?: Date;
    totalCourtFee?: number;
}

export interface PointTransaction {
    id: string;
    clubId: string;
    userId: string;
    points: number;
    description: string;
    date: Date;
}

export interface User {
    id: string;
    name: string;
    loyaltyPoints?: number;
    level?: NumericMatchPadelLevel;
    profilePictureUrl?: string;
    credit?: number;
    blockedCredit?: number;
    favoriteInstructorIds?: string[];
}

export interface MatchDayEvent {
    id: string;
    name: string;
    clubId: string;
    eventDate: Date;
    eventEndTime?: Date;
    courtIds: string[];
    maxPlayers: number;
    reservePlayers?: number;
    price?: number;
    inscriptions?: string[]; // Array of user IDs
    matchesGenerated?: boolean;
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

export type SortOption = 'time' | 'occupancy' | 'level';

export type TimeOfDayFilterType = 'all' | 'morning' | 'midday' | 'evening';
export const timeSlotFilterOptions: { value: TimeOfDayFilterType, label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'morning', label: 'Mañanas' },
    { value: 'midday', label: 'Mediodía' },
    { value: 'evening', label: 'Tardes' },
];

export interface UserActivityStatusForDay {
    activityStatus: 'confirmed' | 'inscribed' | 'none';
    hasEvent: boolean;
    eventId?: string;
    anticipationPoints: number;
}


// --- Display Helpers ---
export const displayClassLevel = (level: ClassPadelLevel, short = false): string => {
    if (level === 'abierto') return short ? 'Abre' : 'Abierto';
    return `${level.min}-${level.max}`;
}

export const displayClassCategory = (category: PadelCategoryForSlot, short = false): string => {
    const option = padelCategoryForSlotOptions.find(o => o.value === category);
    if (!option) return category;
    if (short) {
        if (option.value === 'abierta') return 'Mixto';
        if (option.value === 'chica') return 'Chicas';
        if (option.value === 'chico') return 'Chicos';
    }
    return option.label;
}

export const displayActivityStatusWithDetails = (
    activity: { rawActivity: TimeSlot | Match, status?: TimeSlot['status'] | Match['status']},
    instructor?: Instructor
): string => {
    switch(activity.status) {
        case 'forming': return 'Formándose';
        case 'pre_registration': return 'Pre-inscripción';
        case 'confirmed': return 'Confirmada';
        case 'confirmed_private': return 'Privada';
        case 'cancelled': return 'Cancelada';
        default: return 'Desconocido';
    }
}
