// types/index.ts

// --- Core Enums & Constants ---

export const numericMatchPadelLevels = [
    "1.0", "1.5", "2.0", "2.5", "3.0", "3.5", "4.0", "4.5", "5.0", "5.5", "6.0", "6.5", "7.0"
] as const;

export type NumericMatchPadelLevel = typeof numericMatchPadelLevels[number];
export const matchPadelLevels: NumericMatchPadelLevel[] = [...numericMatchPadelLevels];

export type MatchPadelLevel = 'abierto' | NumericMatchPadelLevel;


export const userGenderCategories: UserGenderCategory[] = ['femenino', 'masculino', 'otro', 'no_especificado'];
export type UserGenderCategory = 'femenino' | 'masculino' | 'otro' | 'no_especificado';

export type PadelCategoryForSlot = 'abierta' | 'chica' | 'chico';
export const padelCategoryForSlotOptions: { value: PadelCategoryForSlot, label: string }[] = [
    { value: 'abierta', label: 'Abierta (Mixto)' },
    { value: 'chica', label: 'Chicas' },
    { value: 'chico', label: 'Chicos' },
];

export const daysOfWeek: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export const dayOfWeekLabels: Record<DayOfWeek, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
};

export type PointTransactionType = 
    | 'cancelacion_clase' 
    | 'cancelacion_clase_confirmada' 
    | 'cancelacion_partida' 
    | 'invitar_amigo' 
    | 'primero_en_clase' 
    | 'primero_en_partida'
    | 'canje_plaza_gratis'
    | 'reserva_pista_puntos'
    | 'penalizacion_cancelacion_no_confirmada'
    | 'penalizacion_cancelacion_confirmada'
    | 'ajuste_manual'
    | 'reembolso_error_reserva'
    | 'devolucion_cancelacion_anticipada'
    | 'bonificacion_preinscripcion'
    | 'compra_tienda'
    | 'conversion_saldo';

export type ProductCategory = 'pala' | 'pelotas' | 'ropa' | 'accesorios';
export const productCategories: { value: ProductCategory, label: string }[] = [
    { value: 'pala', label: 'Palas' },
    { value: 'pelotas', label: 'Pelotas' },
    { value: 'ropa', label: 'Ropa' },
    { value: 'accesorios', label: 'Accesorios' },
];

export type PadelCourtStatus = 'disponible' | 'reservada' | 'mantenimiento' | 'desactivada' | 'bloqueo_provisional' | 'proceso_inscripcion';

// --- Filtering & Sorting ---

export type SortOption = 'time' | 'occupancy' | 'level';
export type PadelGameType = 'clases' | 'partidas' | 'ambas';

export type TimeOfDayFilterType = 'all' | 'morning' | 'midday' | 'evening';
export const timeSlotFilterOptions: { value: TimeOfDayFilterType, label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'morning', label: 'Mañanas (8-13h)' },
    { value: 'midday', label: 'Mediodía (13-18h)' },
    { value: 'evening', label: 'Tardes (18-22h)' },
];

export type ViewPreference = 'normal' | 'myInscriptions' | 'myConfirmed' | 'withPlayers' | 'completed';

export type ActivityViewType = 'clases' | 'partidas' | 'matchpro';

// --- Interfaces & Rich Types ---

export interface PadelLevelRange {
  min: NumericMatchPadelLevel;
  max: NumericMatchPadelLevel;
}

export type ClassPadelLevel = 'abierto' | PadelLevelRange;

export interface TimeRange {
  start: string; // "HH:mm"
  end: string;   // "HH:mm"
}

export interface User {
    id: string;
    name: string;
    email?: string;
    level?: MatchPadelLevel;
    credit?: number;
    blockedCredit?: number;
    loyaltyPoints?: number;
    blockedLoyaltyPoints?: number;
    pendingBonusPoints?: number;
    preferredGameType?: PadelGameType;
    favoriteInstructorIds?: string[];
    profilePictureUrl?: string;
    genderCategory?: UserGenderCategory;
    isPro?: boolean;
    currentClubId?: string;
}

export interface InstructorRateTier {
  id: string;
  days: DayOfWeek[];
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  rate: number;
}

export interface Instructor extends User {
    isBlocked?: boolean;
    assignedClubId?: string;
    assignedCourtNumber?: number;
    isAvailable: boolean;
    unavailableHours?: Partial<Record<DayOfWeek, TimeRange[]>>;
    defaultRatePerHour?: number;
    rateTiers?: InstructorRateTier[];
    experience?: string[];
    languages?: string[];
}

export interface UserDB extends User, Partial<Omit<Instructor, 'id' | 'name' | 'email' | 'level' | 'profilePictureUrl' | 'genderCategory'>> {
  hashedPassword?: string;
  createdAt: Date;
  clubId?: string; // For general club association
}

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
    unconfirmedCancelPenaltyPoints?: number;
    unconfirmedCancelPenaltyEuros?: number;
    cancellationPenaltyTiers?: PenaltyTier[];
    inscriptionBonusPoints?: number;
}

export interface ClubLevelRange {
    name: string;
    min: NumericMatchPadelLevel;
    max: NumericMatchPadelLevel;
    color?: string;
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
  endTime: string;   // "HH:mm"
  minPrice: number;
  startPrice: number;
  maxPrice: number;
}

export interface CardShadowEffectSettings {
    enabled: boolean;
    color: string;
    intensity: number; // Stored as 0 to 1
}

export interface Club {
    id: string;
    name: string;
    logoUrl?: string;
    location?: string;
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
    adminEmail?: string;
    adminPassword?: string;
}

export interface ClubFormData {
  name: string;
  location: string;
  logoUrl?: string;
  adminEmail: string;
  adminPassword?: string;
  showClassesTabOnFrontend: boolean;
  showMatchesTabOnFrontend: boolean;
  unavailableMatchHours: Partial<Record<DayOfWeek, TimeRange[]>>;
}

export interface PadelCourt {
    id: string;
    name: string;
    clubId: string;
    courtNumber: number;
    isActive: boolean;
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
    courtNumber?: number;
    level: ClassPadelLevel;
    category: PadelCategoryForSlot;
    status: 'pre_registration' | 'forming' | 'confirmed' | 'confirmed_private' | 'cancelled';
    bookedPlayers: { userId: string, name?: string, isSimulated?: boolean, groupSize: 1|2|3|4 }[];
    designatedGratisSpotPlaceholderIndexForOption?: { [key in 1 | 2 | 3 | 4]?: number | null };
    organizerId?: string;
    privateShareCode?: string;
    confirmedPrivateSize?: 1 | 2 | 3 | 4;
    totalPrice?: number;
    promotionEndTime?: Date;
}

export interface Booking {
    id: string;
    userId: string;
    activityId: string;
    activityType: 'class';
    groupSize: 1 | 2 | 3 | 4;
    spotIndex: number;
    status: 'pending' | 'confirmed' | 'cancelled';
    bookedWithPoints?: boolean;
    amountBlocked?: number;
    isOrganizerBooking?: boolean;
    amountPaidByInvitee?: number;
    slotDetails?: TimeSlot;
    bookedAt?: Date;
    isSimulated?: boolean;
}

export interface Match {
    id: string;
    clubId: string;
    startTime: Date;
    endTime: Date;
    durationMinutes: number;
    courtNumber?: number;
    level: MatchPadelLevel;
    category: PadelCategoryForSlot;
    status: 'forming' | 'confirmed' | 'confirmed_private' | 'cancelled';
    bookedPlayers: { userId: string, name?: string, isSimulated?: boolean }[];
    isPlaceholder?: boolean;
    isProMatch?: boolean;
    isProvisional?: boolean;
    provisionalForUserId?: string;
    provisionalExpiresAt?: Date;
    totalCourtFee?: number;
    creatorId?: string;
    gratisSpotAvailable?: boolean;
    isPointsOnlyBooking?: boolean;
    organizerId?: string;
    privateShareCode?: string;
    isRecurring?: boolean;
    nextRecurringMatchId?: string;
    eventId?: string;
}

export interface MatchBookingMatchDetails {
    id: string;
    startTime: Date;
    endTime: Date;
    courtNumber?: number;
    level: MatchPadelLevel;
    category: PadelCategoryForSlot;
    bookedPlayers: { userId: string, name?: string }[];
    totalCourtFee?: number;
    clubId: string;
    status: Match['status'];
    organizerId?: string;
    privateShareCode?: string;
    isRecurring?: boolean;
    nextRecurringMatchId?: string;
    eventId?: string;
    durationMinutes: number;
}

export interface MatchBooking {
    id: string;
    userId: string;
    activityId: string;
    activityType: 'match';
    bookedAt: Date;
    bookedWithPoints?: boolean;
    isOrganizerBooking?: boolean;
    amountPaidByInvitee?: number; // For private matches
    matchDetails?: MatchBookingMatchDetails;
    amountBlocked?: number;
    isSimulated?: boolean;
}

export interface PointTransaction {
    id: string;
    userId: string;
    clubId?: string;
    date: Date;
    type: PointTransactionType;
    points: number;
    description: string;
    relatedEntityId?: string; // ID of the class, match, or booking
}

export interface Transaction {
    id: string;
    userId: string;
    date: Date;
    type: 'Recarga' | 'Reserva Clase' | 'Reserva Partida' | 'Reembolso Clase' | 'Reembolso Partida' | 'Penalización Cancelación' | 'Compra Producto';
    amount: number;
    description: string;
}

export interface MatchDayEvent {
    id: string;
    name: string;
    clubId: string;
    eventDate: Date;
    eventEndTime?: Date;
    drawTime?: Date;
    courtIds: string[];
    maxPlayers: number;
    reservePlayers?: number;
    price?: number;
    inscriptions?: string[]; // Array of user IDs
    matchesGenerated?: boolean;
    cancelledInscriptions?: MatchDayInscription[];
}

export interface MatchDayInscription {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userLevel: MatchPadelLevel;
  userProfilePictureUrl?: string;
  status: 'main' | 'reserve' | 'cancelled';
  inscriptionTime: Date;
  preferredPartnerId?: string;
  amountBlocked?: number;
  cancelledAt?: Date;
  eventDetails?: MatchDayEvent;
}

export interface Product {
  id: string;
  clubId: string;
  name: string;
  images: string[];
  officialPrice: number;
  offerPrice: number;
  stock?: number;
  status: 'in-stock' | 'on-order';
  aiHint: string;
  category: ProductCategory;
  isDealOfTheDay?: boolean;
  discountPercentage?: number;
}

export interface Review {
    id: string;
    activityId: string;
    activityType: 'class' | 'match';
    userId: string;
    rating: number;
    comment?: string;
    createdAt: Date;
    instructorId?: string;
}

export interface CourtGridBooking {
    id: string;
    clubId: string;
    courtNumber: number;
    startTime: Date;
    endTime: Date;
    title: string;
    type: 'clase' | 'partida' | 'mantenimiento' | 'reserva_manual' | 'bloqueo_provisional' | 'match-day';
    status?: PadelCourtStatus;
    activityStatus?: TimeSlot['status'] | Match['status'];
    provisionalExpiresAt?: Date;
    participants?: number;
    maxParticipants?: number;
}

export interface UserActivityStatusForDay {
    activityStatus: 'confirmed' | 'inscribed' | 'none';
    activityTypes: ('class' | 'match' | 'event')[];
    hasEvent: boolean;
    eventId?: string;
    anticipationPoints: number;
}

// --- Display Helpers ---
export const displayClassLevel = (level: ClassPadelLevel | undefined, short = false): string => {
    if (level === 'abierto' || !level) return short ? 'Nivel' : 'Nivel Abierto';
    if (typeof level === 'object' && 'min' in level && 'max' in level) {
      if (level.min === level.max) return `${level.min}`;
      return `${level.min}-${level.max}`;
    }
    return String(level);
};

export const displayClassCategory = (category: PadelCategoryForSlot, short = false): string => {
    const option = padelCategoryForSlotOptions.find(o => o.value === category);
    if (!option) return 'Categoría';
    if (category === 'abierta') return short ? 'Cat.' : 'Categoría';

    if (short) {
        if (option.value === 'chica') return 'Chicas';
        if (option.value === 'chico') return 'Chicos';
        return 'Cat.';
    }
    return option.label.replace(' (Mixto)', '');
};


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
        default: return activity.status || 'Desconocido';
    }
};