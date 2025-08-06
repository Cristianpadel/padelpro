// lib/mockData.ts
import type { TimeSlot, Club, Instructor, PadelCourt, CourtGridBooking, PointTransaction, User, Match, ClubLevelRange, MatchDayEvent, CourtRateTier, DynamicPricingTier, PenaltyTier, DayOfWeek, Product, CardShadowEffectSettings, UserActivityStatusForDay, Booking } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { startOfDay, addHours, addMinutes, subDays, getDay, isSameDay, differenceInDays, addDays, format } from 'date-fns';
import { daysOfWeek as daysOfWeekArray } from '@/types';

export let clubs: Club[] = [
    { 
        id: 'club-1', 
        name: 'Padel Club Madrid Centro', 
        logoUrl: 'https://placehold.co/100x100.png',
        location: 'Calle Ficticia 123, Madrid',
        pointSettings: { 
            cancellationPointPerEuro: 1, 
            inviteFriend: 5, 
            firstToJoinClass: 2, 
            firstToJoinMatch: 2, 
            pointsCostForCourt: 20,
            cancellationPenaltyTiers: [
                { hoursBefore: 2, penaltyPercentage: 100 },
                { hoursBefore: 6, penaltyPercentage: 50 },
                { hoursBefore: 12, penaltyPercentage: 25 },
            ]
        },
        levelRanges: [
            { name: "Iniciación", min: '1.0', max: '2.0', color: 'hsl(210 100% 56%)' },
            { name: "Intermedio", min: '2.5', max: '3.5', color: 'hsl(142.1 76.2% 36.3%)' },
            { name: "Avanzado", min: '4.0', max: '5.5', color: 'hsl(24.6 95% 53.1%)' },
            { name: "Competición", min: '6.0', max: '7.0', color: 'hsl(346.8 77.2% 49.8%)' },
        ],
        unavailableMatchHours: {
            'Sábado': [{start: '14:00', end: '16:00'}],
            'Domingo': [{start: '14:00', end: '16:00'}],
        },
        pointBookingSlots: {
             'Sábado': [{start: '20:00', end: '22:00'}],
             'Domingo': [{start: '20:00', end: '22:00'}],
        },
        dynamicPricingEnabled: false,
        courtRateTiers: [
            { id: 'rate-1', name: 'Tarifa General', days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'], startTime: '09:00', endTime: '18:00', rate: 20 },
            { id: 'rate-2', name: 'Horas Punta (Tardes)', days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'], startTime: '18:00', endTime: '22:00', rate: 28 },
            { id: 'rate-3', name: 'Fin de Semana', days: ['Sábado', 'Domingo'], startTime: '09:00', endTime: '22:00', rate: 30 },
        ],
        shopReservationFee: 1.0,
        cardShadowEffect: {
            enabled: true,
            color: '#a855f7',
            intensity: 0.5,
        }
    },
    { id: 'club-2', name: 'Padel Club Pozuelo' },
];

export let instructors: (Instructor & User)[] = [
    { id: 'inst-1', name: 'Carlos López', isAvailable: true, assignedClubId: 'club-1', assignedCourtNumber: 1, email: 'carlos.lopez@example.com', profilePictureUrl: 'https://i.pravatar.cc/150?u=inst-1', defaultRatePerHour: 30, loyaltyPoints: 0, credit: 0 },
    { id: 'inst-2', name: 'Ana García', isAvailable: true, assignedClubId: 'club-1', email: 'ana.garcia@example.com', profilePictureUrl: 'https://i.pravatar.cc/150?u=inst-2', defaultRatePerHour: 35, loyaltyPoints: 0, credit: 0, unavailableHours: { 'Sábado': [{ start: '08:00', end: '14:00' }], 'Domingo': [{ start: '08:00', end: '14:00' }] } },
    { id: 'inst-3', name: 'Javier Fernández', isAvailable: false, assignedClubId: 'club-2', email: 'javier.fernandez@example.com', profilePictureUrl: 'https://i.pravatar.cc/150?u=inst-3', defaultRatePerHour: 28, loyaltyPoints: 0, credit: 0 },
];

export let padelCourts: PadelCourt[] = [
    { id: 'court-1-1', clubId: 'club-1', name: 'Pista Central', courtNumber: 1, isActive: true },
    { id: 'court-1-2', clubId: 'club-1', name: 'Pista 2', courtNumber: 2, isActive: true },
    { id: 'court-1-3', clubId: 'club-1', name: 'Pista 3', courtNumber: 3, isActive: true },
    { id: 'court-1-4', clubId: 'club-1', name: 'Pista 4', courtNumber: 4, isActive: true },
    { id: 'court-2-1', clubId: 'club-2', name: 'Pista VIP', courtNumber: 1, isActive: true },
    { id: 'court-2-2', clubId: 'club-2', name: 'Pista 3', courtNumber: 3, isActive: false },
];

let timeSlots: TimeSlot[] = [];
let matches: Match[] = [];
let courtBookings: CourtGridBooking[] = [];
let pointTransactions: PointTransaction[] = [
    { id: 'txn-1', clubId: 'club-1', userId: 'user-1', points: 5, description: "Invitación de amigo", date: new Date() },
    { id: 'txn-2', clubId: 'club-1', userId: 'user-2', points: -20, description: "Reserva de pista", date: subDays(new Date(), 1) },
    { id: 'txn-3', clubId: 'club-1', userId: 'user-1', points: 2, description: "Primero en unirse a clase", date: subDays(new Date(), 2) },
];
let students: User[] = [
    { id: 'user-1', name: 'Alex García', loyaltyPoints: 1250, level: '3.5', credit: 100, blockedCredit: 0, profilePictureUrl: 'https://i.pravatar.cc/150?u=user-1', favoriteInstructorIds: ['inst-2'] },
    { id: 'user-2', name: 'Beatriz Reyes', loyaltyPoints: 800, level: '4.0', credit: 50, blockedCredit: 0, profilePictureUrl: 'https://i.pravatar.cc/150?u=user-2' },
    { id: 'user-3', name: 'Carlos Sainz', loyaltyPoints: 2400, level: '5.0', credit: 200, blockedCredit: 0, profilePictureUrl: 'https://i.pravatar.cc/150?u=user-3' },
    { id: 'user-4', name: 'Daniela Vega', loyaltyPoints: 300, level: '2.5', credit: 20, blockedCredit: 0, profilePictureUrl: 'https://i.pravatar.cc/150?u=user-4' },
    { id: 'user-5', name: 'Esteban Ocon', loyaltyPoints: 950, level: '4.5', credit: 75, blockedCredit: 0, profilePictureUrl: 'https://i.pravatar.cc/150?u=user-5' },
    { id: 'user-6', name: 'Fernanda Alonso', loyaltyPoints: 1100, level: '6.0', credit: 150, blockedCredit: 0, profilePictureUrl: 'https://i.pravatar.cc/150?u=user-6' },
];
let matchDayEvents: MatchDayEvent[] = [];
let products: Product[] = [
    { id: 'prod-1', clubId: 'club-1', name: 'Bullpadel Vertex 04', category: 'pala', status: 'in-stock', officialPrice: 280, offerPrice: 250, images: ['https://placehold.co/600x400.png'], aiHint: 'padel racket', isDealOfTheDay: true },
    { id: 'prod-2', clubId: 'club-1', name: 'Head Pro S Balls (3-pack)', category: 'pelotas', status: 'in-stock', officialPrice: 6, offerPrice: 5, images: ['https://placehold.co/600x400.png'], aiHint: 'padel balls' },
];
let globalCurrentUser: User | null = null;
let hasNewGratisSpot = false;
let userBookings: Booking[] = [];
let userMatchBookings: Booking[] = [];
let userReservedProducts: { userId: string, productId: string }[] = [];

// --- Instructors ---
export const fetchInstructors = async (): Promise<Instructor[]> => {
    await new Promise(res => setTimeout(res, 300));
    return instructors;
}

export const updateInstructor = async (id: string, data: Partial<Instructor>): Promise<Instructor | {error: string}> => {
    await new Promise(res => setTimeout(res, 500));
    const index = instructors.findIndex(i => i.id === id);
    if(index === -1) return {error: 'Instructor no encontrado'};
    instructors[index] = { ...instructors[index], ...data };
    return instructors[index];
}

export const deleteInstructor = async (id: string): Promise<{success: boolean} | {error: string}> => {
    await new Promise(res => setTimeout(res, 500));
    const index = instructors.findIndex(i => i.id === id);
    if(index === -1) return {error: 'Instructor no encontrado'};
    instructors.splice(index, 1);
    return {success: true};
}


// --- Clubs ---
export const getMockClubs = (): Club[] => {
    return clubs;
}

export const updateClub = async (id: string, data: Partial<Club>): Promise<Club | {error: string}> => {
     await new Promise(res => setTimeout(res, 400));
    const index = clubs.findIndex(c => c.id === id);
    if(index === -1) return {error: 'Club no encontrado'};
    clubs[index] = { ...clubs[index], ...data };
    return clubs[index];
}


// --- Courts ---
export const fetchPadelCourtsByClub = async (clubId: string): Promise<PadelCourt[]> => {
     await new Promise(res => setTimeout(res, 300));
    return padelCourts.filter(c => c.clubId === clubId);
}

export const getMockPadelCourts = (): PadelCourt[] => {
    return padelCourts;
}

export const addPadelCourt = async (courtData: Omit<PadelCourt, 'id' | 'isActive'>): Promise<PadelCourt | { error: string }> => {
    await new Promise(res => setTimeout(res, 500));
    const existing = padelCourts.find(c => c.clubId === courtData.clubId && c.courtNumber === courtData.courtNumber);
    if(existing) return { error: `Ya existe una pista con el número ${courtData.courtNumber} en este club.`};
    const newCourt: PadelCourt = { ...courtData, id: uuidv4(), isActive: true };
    padelCourts.push(newCourt);
    return newCourt;
};

export const updatePadelCourt = async (id: string, data: Partial<Omit<PadelCourt, 'id' | 'clubId'>>): Promise<PadelCourt | { error: string }> => {
    await new Promise(res => setTimeout(res, 400));
    const index = padelCourts.findIndex(c => c.id === id);
    if(index === -1) return { error: 'Pista no encontrada' };
    const originalCourt = padelCourts[index];

    // Check for court number conflict if it's being changed
    if(data.courtNumber && data.courtNumber !== originalCourt.courtNumber) {
        const existing = padelCourts.find(c => c.clubId === originalCourt.clubId && c.courtNumber === data.courtNumber);
        if(existing) return { error: `Ya existe una pista con el número ${data.courtNumber} en este club.`};
    }

    padelCourts[index] = { ...originalCourt, ...data };
    return padelCourts[index];
};

export const deletePadelCourt = async (id: string): Promise<{ success: true } | { error: string }> => {
    await new Promise(res => setTimeout(res, 600));
    const index = padelCourts.findIndex(c => c.id === id);
    if(index === -1) return { error: 'Pista no encontrada' };
    padelCourts.splice(index, 1);
    return { success: true };
}


// --- Bookings & TimeSlots ---
export const fetchCourtBookingsForDay = async (clubId: string, date: Date): Promise<CourtGridBooking[]> => {
    await new Promise(res => setTimeout(res, 500));
    const dayBookings = courtBookings.filter(b => b.clubId === clubId && isSameDay(new Date(b.startTime), date));
    
    const dayTimeSlots = timeSlots.filter(ts => ts.clubId === clubId && isSameDay(new Date(ts.startTime), date));
    const dayMatches = matches.filter(m => m.clubId === clubId && isSameDay(new Date(m.startTime), date));

    const activityBookings: CourtGridBooking[] = [
        ...dayTimeSlots
            .filter(ts => ts.status === 'confirmed' || ts.status === 'confirmed_private')
            .map(ts => ({
                id: `ts-booking-${ts.id}`,
                clubId: ts.clubId,
                courtNumber: ts.courtNumber,
                startTime: new Date(ts.startTime),
                endTime: new Date(ts.endTime),
                title: `Clase con ${ts.instructorName}`,
                type: 'clase' as const,
                status: 'reservada' as const,
                activityStatus: ts.status,
                participants: ts.bookedPlayers.length,
                maxParticipants: ts.maxPlayers
        })),
        ...dayMatches
            .filter(m => m.status === 'confirmed' || m.status === 'confirmed_private')
            .map(m => ({
                id: `match-booking-${m.id}`,
                clubId: m.clubId,
                courtNumber: m.courtNumber,
                startTime: new Date(m.startTime),
                endTime: new Date(m.endTime),
                title: `Partida Nivel ${m.level}`,
                type: 'partida' as const,
                status: 'reservada' as const,
                activityStatus: m.status,
                participants: m.bookedPlayers?.length,
                maxParticipants: 4
        }))
    ];
    
    return [...dayBookings, ...activityBookings];
}

export const addManualCourtBooking = async (clubId: string, bookingData: Omit<CourtGridBooking, 'id' | 'status'>): Promise<CourtGridBooking | { error: string }> => {
    await new Promise(res => setTimeout(res, 500));
     const newBooking: CourtGridBooking = {
        id: uuidv4(),
        ...bookingData,
        status: 'reservada'
    };
    courtBookings.push(newBooking);
    return newBooking;
}

export const isSlotEffectivelyCompleted = (slot: TimeSlot | Match): { completed: boolean, size: number | null } => {
    if (slot.status === 'confirmed' || slot.status === 'confirmed_private') {
        const bookedCount = slot.bookedPlayers?.length || 0;
        const maxPlayers = 'maxPlayers' in slot ? slot.maxPlayers : 4; // Default to 4 for matches
        if (slot.status === 'confirmed_private' || bookedCount === maxPlayers) {
            return { completed: true, size: bookedCount };
        }
    }
    
    // Check individual group sizes for classes
    if ('maxPlayers' in slot && slot.bookedPlayers) {
        const groups: Record<number, number> = {};
        slot.bookedPlayers.forEach(p => {
            groups[p.groupSize] = (groups[p.groupSize] || 0) + 1;
        });
        for(const sizeStr in groups) {
            const size = parseInt(sizeStr);
            if(groups[size] === size) {
                return { completed: true, size: size };
            }
        }
    }

    return { completed: false, size: null };
};


// --- Points & Students ---
export const fetchPointTransactions = async (clubId: string): Promise<PointTransaction[]> => {
     await new Promise(res => setTimeout(res, 600));
    return pointTransactions.filter(t => t.clubId === clubId);
}
export const getMockStudents = async (): Promise<User[]> => {
    await new Promise(res => setTimeout(res, 200));
    return students;
}
export const fetchStudents = async (): Promise<User[]> => {
    await new Promise(res => setTimeout(res, 200));
    return students;
};

export const addCreditToStudent = async (studentId: string, amount: number): Promise<{ newBalance: number } | { error: string }> => {
    await new Promise(res => setTimeout(res, 400));
    const studentIndex = students.findIndex(s => s.id === studentId);
    if (studentIndex === -1) {
        return { error: "Alumno no encontrado." };
    }
    const currentCredit = students[studentIndex].credit ?? 0;
    const newBalance = currentCredit + amount;
    students[studentIndex].credit = newBalance;
    return { newBalance };
};

export const simulateInviteFriend = async (userId: string, clubId: string): Promise<{ pointsAwarded: number } | { error: string }> => {
    const club = clubs.find(c => c.id === clubId);
    if (!club) return { error: "Club no encontrado." };
    
    const pointsToAdd = club.pointSettings?.inviteFriend || 5;
    
    const userIndex = students.findIndex(s => s.id === userId);
    if (userIndex === -1) return { error: "Usuario no encontrado." };

    students[userIndex].loyaltyPoints = (students[userIndex].loyaltyPoints || 0) + pointsToAdd;
    
    pointTransactions.push({
        id: uuidv4(),
        clubId: clubId,
        userId: userId,
        points: pointsToAdd,
        description: "Invitación de amigo",
        date: new Date(),
    });

    return { pointsAwarded: pointsToAdd };
}

export const convertEurosToPoints = async (userId: string, euros: number, pointsPerEuro: number): Promise<{ newCreditBalance: number; newLoyaltyPoints: number; } | { error: string }> => {
    await new Promise(res => setTimeout(res, 500));
    const userIndex = students.findIndex(s => s.id === userId);
    if (userIndex === -1) {
        return { error: "Usuario no encontrado." };
    }
    const student = students[userIndex];
    if ((student.credit ?? 0) < euros) {
        return { error: "Saldo insuficiente." };
    }
    
    const pointsToAdd = Math.floor(euros * pointsPerEuro);
    
    student.credit = (student.credit ?? 0) - euros;
    student.loyaltyPoints = (student.loyaltyPoints ?? 0) + pointsToAdd;

    students[userIndex] = student;
    
    pointTransactions.unshift({
        id: uuidv4(),
        clubId: student.currentClubId || 'club-1',
        userId: userId,
        points: pointsToAdd,
        description: `Conversión de ${euros.toFixed(2)}€ a puntos`,
        date: new Date(),
    });

    return { newCreditBalance: student.credit, newLoyaltyPoints: student.loyaltyPoints };
};


export const addTimeSlot = async (slotData: Omit<TimeSlot, 'id' | 'instructorName' | 'status' | 'bookedPlayers' | 'endTime'>): Promise<TimeSlot | { error: string }> => {
  // Simulate API delay
  await new Promise(res => setTimeout(res, 500));

  // Basic validation for conflicts
  const newSlotEnd = new Date(slotData.startTime.getTime() + slotData.durationMinutes * 60000);
  const conflict = timeSlots.find(slot => 
    slot.courtNumber === slotData.courtNumber &&
    slot.clubId === slotData.clubId &&
    slot.startTime < newSlotEnd &&
    new Date(slot.startTime.getTime() + slot.durationMinutes * 60000) > slot.startTime
  );

  if (conflict) {
    return { error: 'Ya existe una clase en esta pista a la misma hora.' };
  }
  
  const instructor = instructors.find(i => i.id === slotData.instructorId);

  const newTimeSlot: TimeSlot = {
    id: uuidv4(),
    ...slotData,
    instructorName: instructor?.name || 'Unknown',
    status: 'forming',
    bookedPlayers: [],
    endTime: newSlotEnd,
    totalPrice: ('totalPrice' in slotData ? slotData.totalPrice : calculateActivityPrice(clubs.find(c => c.id === slotData.clubId)!, slotData.startTime) + getInstructorRate(instructor!, slotData.startTime)),
  };
  timeSlots.push(newTimeSlot);
  return newTimeSlot;
};

export const addMatch = async (matchData: Omit<Match, 'id' | 'status' | 'durationMinutes'>): Promise<Match | { error: string }> => {
  await new Promise(res => setTimeout(res, 500));
  
  const newMatch: Match = {
      id: uuidv4(),
      ...matchData,
      status: (matchData.bookedPlayers?.length || 0) === 4 ? 'confirmed' : 'forming',
      durationMinutes: 90,
  };
  matches.push(newMatch);

  // Add some more matches for testing
  matches.push({ ...newMatch, id: uuidv4(), courtNumber: 3, startTime: addHours(newMatch.startTime, 1), endTime: addHours(newMatch.endTime, 1) });
  matches.push({ ...newMatch, id: uuidv4(), courtNumber: 4, level: '4.5', startTime: addHours(newMatch.startTime, 2), endTime: addHours(newMatch.endTime, 2) });


  return newMatch;
};


export const addInstructor = async (instructorData: Omit<Instructor, 'id' | 'isAvailable' | 'isBlocked' | 'assignedClubId' | 'assignedCourtNumber' | 'profilePictureUrl' | 'defaultRatePerHour' | 'rateTiers' | 'email' | 'unavailableHours'> & { email?: string }): Promise<Instructor | { error: string }> => {
  await new Promise(res => setTimeout(res, 500));

  const existingInstructor = instructors.find(inst => inst.name.toLowerCase() === instructorData.name.toLowerCase());
  if (existingInstructor) {
    return { error: 'Ya existe un instructor con este nombre.' };
  }

  const newId = uuidv4();
  const newInstructor: Instructor = {
    id: newId,
    name: instructorData.name,
    email: instructorData.email,
    isAvailable: true, // Default value
    profilePictureUrl: `https://i.pravatar.cc/150?u=${newId}`,
    isBlocked: false,
    assignedClubId: 'all',
  };
  instructors.push(newInstructor);
  return newInstructor;
};

export const deleteMatch = async (matchId: string): Promise<{ message: string } | { error: string }> => {
    await new Promise(res => setTimeout(res, 500));
    const index = matches.findIndex(m => m.id === matchId);
    if(index === -1) return { error: "Partida no encontrada." };
    matches.splice(index, 1);
    return { message: "La partida ha sido cancelada." };
};

export const removePlayerFromMatch = async (matchId: string, playerId: string): Promise<{ message: string } | { error: string }> => {
    await new Promise(res => setTimeout(res, 500));
    const matchIndex = matches.findIndex(m => m.id === matchId);
    if(matchIndex === -1) return { error: "Partida no encontrada." };
    
    const playerIndex = matches[matchIndex].bookedPlayers.findIndex(p => p.userId === playerId);
    if(playerIndex === -1) return { error: "Jugador no encontrado en esta partida." };

    matches[matchIndex].bookedPlayers.splice(playerIndex, 1);
    
    // If removing a player makes it 'forming' again
    if (matches[matchIndex].bookedPlayers.length < 4) {
        matches[matchIndex].status = 'forming';
    }

    return { message: "Jugador eliminado de la partida." };
}

// --- Calendar Specific Data Fetchers ---
export const getMockTimeSlots = async (clubId?: string): Promise<TimeSlot[]> => {
    await new Promise(res => setTimeout(res, 250));
    if (clubId) {
      return timeSlots.filter(ts => ts.clubId === clubId);
    }
    return timeSlots;
};

export const fetchMatches = async (clubId: string): Promise<Match[]> => {
    await new Promise(res => setTimeout(res, 250));
    return matches.filter(m => m.clubId === clubId);
};

export const getMockMatches = async (): Promise<Match[]> => {
    return matches;
}


export const fetchMatchDayEventsForDate = async (date: Date, clubId: string): Promise<MatchDayEvent[]> => {
    await new Promise(res => setTimeout(res, 250));
    return matchDayEvents.filter(e => e.clubId === clubId && isSameDay(new Date(e.eventDate), date));
}

export const getMockInstructors = (): (Instructor & User)[] => {
    return instructors;
}

export const updateClubAdminPassword = async (clubId: string, currentPassword: string, newPassword: string): Promise<{ success: true } | { error: string }> => {
    await new Promise(res => setTimeout(res, 500));
    // In a real app, you'd verify the clubId and currentPassword against a secure database.
    // For this mock, we'll just pretend the current password is 'password123' for any club.
    if (currentPassword !== 'password123') {
        return { error: 'La contraseña actual es incorrecta.' };
    }
    if (newPassword.length < 6) {
        return { error: 'La nueva contraseña es demasiado corta.' };
    }
    console.log(`Password for club ${clubId} changed to ${newPassword}`);
    return { success: true };
};

// --- Match-Day Specific Mock Functions ---

export const createMatchDayEvent = async (eventData: Omit<MatchDayEvent, 'id'>): Promise<MatchDayEvent | { error: string }> => {
  await new Promise(res => setTimeout(res, 500));
  // Check for conflicts? For now, we'll keep it simple.
  const newEvent: MatchDayEvent = {
    ...eventData,
    id: uuidv4(),
    inscriptions: [],
    matchesGenerated: false,
  };
  matchDayEvents.push(newEvent);
  return newEvent;
};

export const fetchActiveMatchDayEvents = async (clubId: string): Promise<MatchDayEvent[]> => {
    await new Promise(res => setTimeout(res, 300));
    const now = new Date();
    return matchDayEvents
        .filter(e => e.clubId === clubId && new Date(e.eventDate) >= now)
        .sort((a,b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
}

export const getMatchDayInscriptions = async (eventId: string): Promise<string[]> => {
    await new Promise(res => setTimeout(res, 150));
    const event = matchDayEvents.find(e => e.id === eventId);
    return event?.inscriptions || [];
}

export const deleteMatchDayEvent = async (eventId: string): Promise<{success: true} | {error: string}> => {
    await new Promise(res => setTimeout(res, 400));
    const index = matchDayEvents.findIndex(e => e.id === eventId);
    if(index === -1) return { error: "Evento no encontrado." };
    matchDayEvents.splice(index, 1);
    return { success: true };
}

export const manuallyTriggerMatchDayDraw = async (eventId: string): Promise<{ matchesCreated: number } | { error: string }> => {
    await new Promise(res => setTimeout(res, 1000));
    const eventIndex = matchDayEvents.findIndex(e => e.id === eventId);
    if(eventIndex === -1) return { error: "Evento no encontrado." };
    
    const event = matchDayEvents[eventIndex];
    if(event.matchesGenerated) return { error: "El sorteo para este evento ya se ha realizado." };
    
    const inscriptions = event.inscriptions || [];
    if(inscriptions.length < 4) return { error: "No hay suficientes jugadores inscritos para el sorteo." };

    const matchesToCreate = Math.floor(inscriptions.length / 4);
    
    // This is a super simplified draw logic. A real one would be much more complex.
    console.log(`Generating ${matchesToCreate} matches for event ${eventId}`);
    matchDayEvents[eventIndex].matchesGenerated = true;

    return { matchesCreated: matchesToCreate };
}

// --- Simulation Functions ---
export const simulateBookings = async (options: {
    clubId: string,
    activityType: 'clases' | 'partidas',
    days: DayOfWeek[],
    timeRanges: ('morning' | 'midday' | 'evening')[],
    studentCount: number,
    density: number
}): Promise<{ message: string }> => {
    await new Promise(res => setTimeout(res, 1000));
    const { activityType, days, timeRanges, studentCount, density, clubId } = options;
    const allStudents = await getMockStudents();
    let inscriptionsMade = 0;

    const timeRangeMap = {
        morning: { start: 8, end: 13 },
        midday: { start: 13, end: 18 },
        evening: { start: 18, end: 22 },
    };

    const targetActivities = activityType === 'clases' ? timeSlots : matches;

    for (const activity of targetActivities) {
        if (activity.clubId !== clubId) continue;
        if (activity.status !== 'forming') continue;

        const activityDate = new Date(activity.startTime);
        const activityDay = daysOfWeekArray[getDay(activityDate) === 0 ? 6 : getDay(activityDate) - 1];
        const activityHour = activityDate.getHours();

        const isInDay = days.includes(activityDay);
        const isInTimeRange = timeRanges.some(range => {
            const { start, end } = timeRangeMap[range];
            return activityHour >= start && activityHour < end;
        });
        
        const shouldProcess = Math.random() * 100 < density;

        if (isInDay && isInTimeRange && shouldProcess) {
            const availableSlots = ('maxPlayers' in activity ? activity.maxPlayers : 4) - activity.bookedPlayers.length;
            const playersToAddCount = Math.min(availableSlots, studentCount);

            if (playersToAddCount > 0) {
                const currentBookedIds = new Set(activity.bookedPlayers.map(p => p.userId));
                const availableStudents = allStudents.filter(s => !currentBookedIds.has(s.id));
                
                // Shuffle and pick students
                const shuffledStudents = availableStudents.sort(() => 0.5 - Math.random());
                const playersToAdd = shuffledStudents.slice(0, playersToAddCount);

                for (const player of playersToAdd) {
                    activity.bookedPlayers.push({ userId: player.id, name: player.name, isSimulated: true, groupSize: 4 });
                    inscriptionsMade++;
                }
            }
        }
    }

    return { message: `Simulación completada. Se realizaron ${inscriptionsMade} inscripciones.` };
};

export const clearSimulatedBookings = async (clubId: string): Promise<{ message: string }> => {
    await new Promise(res => setTimeout(res, 500));
    let playersRemoved = 0;

    const clearInArray = (arr: (TimeSlot | Match)[]) => {
        for (const activity of arr) {
            if (activity.clubId === clubId) {
                const originalCount = activity.bookedPlayers.length;
                activity.bookedPlayers = activity.bookedPlayers.filter(p => !p.isSimulated);
                playersRemoved += originalCount - activity.bookedPlayers.length;
            }
        }
    };

    clearInArray(timeSlots);
    clearInArray(matches);

    return { message: `Limpieza completada. Se eliminaron ${playersRemoved} inscripciones simuladas.` };
};

// --- Shop Functions ---
export const fetchProductsByClub = async (clubId: string): Promise<Product[]> => {
    await new Promise(res => setTimeout(res, 400));
    return products.filter(p => p.clubId === clubId);
};

export const addProduct = async (productData: Omit<Product, 'id'>): Promise<Product | { error: string }> => {
    await new Promise(res => setTimeout(res, 500));
    const newProduct: Product = { ...productData, id: uuidv4() };
    products.push(newProduct);
    return newProduct;
};

export const updateProduct = async (productId: string, updateData: Partial<Product>): Promise<Product | { error: string }> => {
    await new Promise(res => setTimeout(res, 500));
    const index = products.findIndex(p => p.id === productId);
    if (index === -1) return { error: "Producto no encontrado." };
    products[index] = { ...products[index], ...updateData };
    return products[index];
};

export const deleteProduct = async (productId: string): Promise<{ success: true } | { error: string }> => {
    await new Promise(res => setTimeout(res, 500));
    const index = products.findIndex(p => p.id === productId);
    if (index === -1) return { error: "Producto no encontrado." };
    products.splice(index, 1);
    return { success: true };
};

export const getMockUserBookings = async (userId: string): Promise<Booking[]> => {
  return userBookings.filter(b => b.userId === userId);
};

export const getMockUserMatchBookings = async (userId: string): Promise<Booking[]> => {
    return userMatchBookings.filter(b => b.userId === userId);
}

export const getHasNewGratisSpotNotification = (): boolean => {
    return hasNewGratisSpot;
}

export const setHasNewGratisSpotNotificationState = (state: boolean) => {
    hasNewGratisSpot = state;
}

export const countConfirmedLiberadasSpots = (clubId?: string): { classes: number; matches: number; total: number } => {
    let classesCount = 0;
    let matchesCount = 0;

    const now = new Date();
    
    // Count "liberadas" from classes
    timeSlots.forEach(slot => {
        if ((!clubId || slot.clubId === clubId) && new Date(slot.startTime) > now && isSlotGratisAndAvailable(slot)) {
            classesCount++;
        }
    });

    // In a real app, you would also count "liberadas" from matches if that's a feature.
    // For now, we'll assume it's only for classes.
    // matchesCount = ...

    return {
        classes: classesCount,
        matches: matchesCount,
        total: classesCount + matchesCount,
    };
};

export const getHasNewSpecialOfferNotification = async (): Promise<boolean> => {
    // In a real app, you'd check for new, unread offers for the user
    return products.some(p => p.isDealOfTheDay);
};


export const countUserReservedProducts = async (userId: string): Promise<number> => {
    return userReservedProducts.filter(r => r.userId === userId).length;
}



export const bookClass = async (userId: string, slotId: string, groupSize: 1 | 2 | 3 | 4, spotIndex: number): Promise<{ booking: Booking; updatedSlot: TimeSlot; } | { error: string; }> => {
    console.log(`Booking request for user ${userId} in slot ${slotId} for group ${groupSize}`);
    const slotIndex = timeSlots.findIndex(s => s.id === slotId);
    if (slotIndex === -1) {
        return { error: 'Class slot not found.' };
    }
    
    const newBooking: Booking = { id: uuidv4(), userId, activityId: slotId, activityType: 'class', groupSize, spotIndex, status: 'pending' };
    timeSlots[slotIndex].bookedPlayers.push({ userId, groupSize: groupSize, name: students.find(s => s.id === userId)?.name || 'Unknown' });

    return { booking: newBooking, updatedSlot: timeSlots[slotIndex] };
}

export const hasAnyConfirmedActivityForDay = (userId: string, date: Date, excludingSlotId?: string, activityType?: 'class' | 'match'): boolean => {
    return false; // Simplified
}

export const makeClassPublic = async (slotId: string): Promise<TimeSlot | { error: string }> => {
    const slotIndex = timeSlots.findIndex(s => s.id === slotId);
    if (slotIndex === -1) return { error: 'Slot not found' };
    // Logic to make class public
    return timeSlots[slotIndex];
}

export const getInstructorRate = (instructor: Instructor, date: Date): number => {
    // A real implementation would check instructor.rateTiers
    return instructor.defaultRatePerHour || 30; // Simplified
}

export const calculateActivityPrice = (club: Club, startTime: Date): number => {
    if (club.courtRateTiers) {
        const dayIndex = getDay(startTime);
        const dayOfWeek = daysOfWeekArray[dayIndex === 0 ? 6 : dayIndex - 1]; // Adjust for locale (Sunday is 0)
        const time = format(startTime, 'HH:mm');

        const matchingTier = club.courtRateTiers.find(tier =>
            tier.days.includes(dayOfWeek) &&
            time >= tier.startTime &&
            time < tier.endTime
        );
        if (matchingTier) {
            return matchingTier.rate;
        }
    }
    // Fallback price
    const hour = startTime.getHours();
    if (hour >= 18) {
        return 28; // Peak time
    }
    return 20; // Off-peak
}


export const getCourtAvailabilityForInterval = async (clubId: string, startTime: Date, endTime: Date): Promise<{available: PadelCourt[], occupied: PadelCourt[], total: number}> => {
    const allClubCourts = padelCourts.filter(c => c.clubId === clubId && c.isActive);
    return { available: allClubCourts, occupied: [], total: allClubCourts.length }; // Simplified
}

export function getMockCurrentUser(): User | null {
    if (globalCurrentUser) {
      return globalCurrentUser;
    }
    // Return a default user if no user is set
    return students.find(s => s.id === 'user-1') || null;
}


export const setGlobalCurrentUser = (user: User | null) => {
    globalCurrentUser = user;
}


export const isSlotGratisAndAvailable = (slot: TimeSlot): boolean => {
    if (!slot.designatedGratisSpotPlaceholderIndexForOption) return false;
    for (const [size, index] of Object.entries(slot.designatedGratisSpotPlaceholderIndexForOption)) {
        if (index !== null && index !== undefined) {
             const bookingInSpot = (slot.bookedPlayers || []).find((p, idx) => p.groupSize === parseInt(size) && idx === index);
             if (!bookingInSpot) return true;
        }
    }
    return false;
}

export const confirmClassAsPrivate = async (userId: string, slotId: string, size: 1|2|3|4): Promise<{updatedSlot: TimeSlot, shareLink: string} | {error: string}> => {
    const slotIndex = timeSlots.findIndex(s => s.id === slotId);
    if (slotIndex === -1) return { error: 'Slot not found' };
    timeSlots[slotIndex].status = 'confirmed_private';
    timeSlots[slotIndex].organizerId = userId;
    timeSlots[slotIndex].confirmedPrivateSize = size;
    const shareCode = uuidv4().slice(0, 8);
    timeSlots[slotIndex].privateShareCode = shareCode;
    
    return {
        updatedSlot: timeSlots[slotIndex],
        shareLink: `https://example.com/clases/${slotId}?code=${shareCode}`
    }
}

export const joinPrivateClass = async (userId: string, slotId: string, shareCode: string): Promise<{ organizerRefundAmount: number } | { error: string }> => {
    const slot = timeSlots.find(s => s.id === slotId);
    if (!slot || slot.status !== 'confirmed_private' || slot.privateShareCode !== shareCode) {
        return { error: 'Invalid private class link' };
    }
    if ((slot.bookedPlayers || []).length >= (slot.confirmedPrivateSize || 4)) {
        return { error: 'This private class is already full.' };
    }
    slot.bookedPlayers.push({ userId, groupSize: slot.confirmedPrivateSize as (1|2|3|4) });
    return { organizerRefundAmount: (slot.totalPrice || 60) / (slot.confirmedPrivateSize || 4) };
}

export const isProposalSlot = (slot: TimeSlot) => {
    return slot.status === 'forming' && slot.bookedPlayers.length === 0;
};

export const findAvailableCourt = (clubId: string, date: Date): number | null => {
    return 1;
}

export const getUserActivityStatusForDay = (userId: string, day: Date, allTimeSlots: TimeSlot[], allMatches: Match[]): UserActivityStatusForDay => {
    const today = startOfDay(new Date());
    const anticipationPoints = differenceInDays(day, today);

    const userActivitiesToday = [
        ...allTimeSlots.filter(ts => ts.bookedPlayers.some(p => p.userId === userId) && isSameDay(new Date(ts.startTime), day)),
        ...allMatches.filter(m => m.bookedPlayers.some(p => p.userId === userId) && isSameDay(new Date(m.startTime), day))
    ];

    if (userActivitiesToday.length === 0) {
        return { activityStatus: 'none', hasEvent: false, anticipationPoints: Math.max(0, anticipationPoints) };
    }
    
    const isConfirmed = userActivitiesToday.some(act => isSlotEffectivelyCompleted(act).completed);
    
    return {
        activityStatus: isConfirmed ? 'confirmed' : 'inscribed',
        hasEvent: false, // Placeholder for match-day events
        anticipationPoints: Math.max(0, anticipationPoints)
    };
};

export const cancelTimeSlot = async (slotId: string): Promise<{ success: boolean } | { error: string }> => {
  const index = timeSlots.findIndex(s => s.id === slotId);
  if (index === -1) return { error: "Clase no encontrada." };
  timeSlots.splice(index, 1);
  return { success: true };
};

export const toggleGratisSpot = async (slotId: string, optionSize: 1 | 2 | 3 | 4, spotIndex: number): Promise<TimeSlot | { error: string }> => {
  const index = timeSlots.findIndex(s => s.id === slotId);
  if (index === -1) return { error: "Clase no encontrada." };

  const slot = timeSlots[index];
  if (!slot.designatedGratisSpotPlaceholderIndexForOption) {
    slot.designatedGratisSpotPlaceholderIndexForOption = {};
  }

  const currentGratisIndex = slot.designatedGratisSpotPlaceholderIndexForOption[optionSize];

  if (currentGratisIndex === spotIndex) {
    // If clicking the same spot, toggle it off
    delete slot.designatedGratisSpotPlaceholderIndexForOption[optionSize];
  } else {
    // Otherwise, set it to the new spot
    slot.designatedGratisSpotPlaceholderIndexForOption[optionSize] = spotIndex;
  }
  
  timeSlots[index] = slot;
  return slot;
};

export const removePlayerFromClass = async (slotId: string, userId: string, groupSize: 1|2|3|4): Promise<TimeSlot | { error: string }> => {
    const index = timeSlots.findIndex(s => s.id === slotId);
    if (index === -1) return { error: "Clase no encontrada." };

    const slot = timeSlots[index];
    const playerIndex = slot.bookedPlayers.findIndex(p => p.userId === userId && p.groupSize === groupSize);

    if (playerIndex === -1) return { error: "Jugador no encontrado en esta opción de clase." };
    
    slot.bookedPlayers.splice(playerIndex, 1);
    timeSlots[index] = slot;
    return slot;
};

export const cancelClassByInstructor = async (slotId: string): Promise<{ message: string } | { error: string }> => {
    const index = timeSlots.findIndex(s => s.id === slotId);
    if (index === -1) return { error: "Clase no encontrada." };
    timeSlots.splice(index, 1);
    // In a real app, you would also handle refunds and notifications here.
    return { message: "La clase ha sido cancelada con éxito." };
};

export const updateTimeSlotInState = async (slotId: string, updateData: Partial<TimeSlot>): Promise<TimeSlot | { error: string }> => {
    const index = timeSlots.findIndex(s => s.id === slotId);
    if (index === -1) return { error: "Clase no encontrada." };
    timeSlots[index] = { ...timeSlots[index], ...updateData };
    return timeSlots[index];
};

export const removeBookingFromTimeSlotInState = async (slotId: string, userId: string, groupSize: 1 | 2 | 3 | 4): Promise<TimeSlot | { error: string }> => {
    const slotIndex = timeSlots.findIndex(s => s.id === slotId);
    if (slotIndex === -1) return { error: "Clase no encontrada." };
    const playerIndex = timeSlots[slotIndex].bookedPlayers.findIndex(p => p.userId === userId && p.groupSize === groupSize);
    if (playerIndex === -1) return { error: "Jugador no encontrado en la clase." };
    timeSlots[slotIndex].bookedPlayers.splice(playerIndex, 1);
    return timeSlots[slotIndex];
};


// Initial mock data
const today = startOfDay(new Date());

const initialTimeSlot = addTimeSlot({ clubId: 'club-1', startTime: addHours(today, 10), durationMinutes: 60, instructorId: 'inst-2', maxPlayers: 4, courtNumber: 1, level: 'abierto', category: 'abierta'});
const initialMatch = addMatch({ clubId: 'club-1', startTime: addHours(today, 11), endTime: addMinutes(addHours(today, 11), 90), totalCourtFee: 28, courtNumber: 2, level: '3.0', category: 'abierta', bookedPlayers: [{userId: 'user-1', name: 'Alex García', groupSize: 4}, {userId: 'user-2', name: 'Beatriz Reyes', groupSize: 4}]});

courtBookings.push(
    { id: 'booking-3', clubId: 'club-1', courtNumber: 1, startTime: addHours(today, 18), endTime: addHours(today, 19), title: "Bloqueo Pista", type: 'reserva_manual', status: 'reservada' },
);

// Add a confirmed class for testing
const confirmedSlot: TimeSlot = {
    id: uuidv4(),
    clubId: 'club-1',
    startTime: addHours(today, 15),
    endTime: addHours(today, 16),
    durationMinutes: 60,
    instructorId: 'inst-1',
    instructorName: 'Carlos López',
    maxPlayers: 2,
    courtNumber: 3,
    level: {min: '3.0', max: '4.0'},
    category: 'abierta',
    status: 'confirmed',
    bookedPlayers: [
        { userId: 'user-1', name: 'Alex García', groupSize: 2 },
        { userId: 'user-2', name: 'Beatriz Reyes', groupSize: 2 },
    ],
    totalPrice: 48,
};
timeSlots.push(confirmedSlot);

const preinscribedSlot: TimeSlot = {
    id: uuidv4(),
    clubId: 'club-1',
    startTime: addHours(today, 17),
    endTime: addHours(today, 18),
    durationMinutes: 60,
    instructorId: 'inst-2',
    instructorName: 'Ana García',
    maxPlayers: 4,
    courtNumber: 4,
    level: 'abierto',
    category: 'abierta',
    status: 'pre_registration',
    bookedPlayers: [],
    promotionEndTime: addDays(new Date(), 1),
    totalPrice: 50,
};
timeSlots.push(preinscribedSlot);
