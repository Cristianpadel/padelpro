// lib/mockData.ts
import type { TimeSlot, Club, Instructor, PadelCourt, CourtGridBooking, PointTransaction, User, Match, ClubLevelRange, MatchDayEvent, CourtRateTier, DynamicPricingTier } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { startOfDay, addHours, addMinutes, subDays } from 'date-fns';

export let clubs: Club[] = [
    { 
        id: 'club-1', 
        name: 'Padel Club Madrid Centro', 
        pointSettings: { cancellationPointPerEuro: 1, inviteFriend: 5, firstToJoinClass: 2, firstToJoinMatch: 2, pointsCostForCourt: 20 },
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
        ]
    },
    { id: 'club-2', name: 'Padel Club Pozuelo' },
];

export let instructors: Instructor[] = [
    { id: 'inst-1', name: 'Carlos López', isAvailable: true, assignedClubId: 'club-1', assignedCourtNumber: 1, email: 'carlos.lopez@example.com', profilePictureUrl: 'https://i.pravatar.cc/150?u=inst-1' },
    { id: 'inst-2', name: 'Ana García', isAvailable: true, assignedClubId: 'club-1', email: 'ana.garcia@example.com', profilePictureUrl: 'https://i.pravatar.cc/150?u=inst-2' },
    { id: 'inst-3', name: 'Javier Fernández', isAvailable: false, assignedClubId: 'club-2', email: 'javier.fernandez@example.com', profilePictureUrl: 'https://i.pravatar.cc/150?u=inst-3' },
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
    { id: 'user-1', name: 'Alex García', loyaltyPoints: 1250, level: '3.5', profilePictureUrl: 'https://i.pravatar.cc/150?u=user-1' },
    { id: 'user-2', name: 'Beatriz Reyes', loyaltyPoints: 800, level: '4.0', profilePictureUrl: 'https://i.pravatar.cc/150?u=user-2' },
    { id: 'user-3', name: 'Carlos Sainz', loyaltyPoints: 2400, level: '5.0', profilePictureUrl: 'https://i.pravatar.cc/150?u=user-3' },
    { id: 'user-4', name: 'Daniela Vega', loyaltyPoints: 300, level: '2.5', profilePictureUrl: 'https://i.pravatar.cc/150?u=user-4' },
    { id: 'user-5', name: 'Esteban Ocon', loyaltyPoints: 950, level: '4.5', profilePictureUrl: 'https://i.pravatar.cc/150?u=user-5' },
    { id: 'user-6', name: 'Fernanda Alonso', loyaltyPoints: 1100, level: '6.0', profilePictureUrl: 'https://i.pravatar.cc/150?u=user-6' },
];
let matchDayEvents: MatchDayEvent[] = [];


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
    const dayBookings = courtBookings.filter(b => b.clubId === clubId && b.startTime.toDateString() === date.toDateString());
    const dayTimeSlots = timeSlots.filter(ts => ts.clubId === clubId && ts.startTime.toDateString() === date.toDateString() && ts.status === 'confirmed');
    const dayMatches = matches.filter(m => m.clubId === clubId && m.startTime.toDateString() === date.toDateString() && m.status === 'confirmed');

    const activityBookings: CourtGridBooking[] = [
        ...dayTimeSlots.map(ts => ({
            id: `ts-booking-${ts.id}`,
            clubId: ts.clubId,
            courtNumber: ts.courtNumber,
            startTime: ts.startTime,
            endTime: ts.endTime,
            title: `Clase con ${ts.instructorName}`,
            type: 'clase' as const,
            status: 'reservada' as const,
            activityStatus: ts.status,
            participants: ts.bookedPlayers.length,
            maxParticipants: ts.maxPlayers
        })),
        ...dayMatches.map(m => ({
            id: `match-booking-${m.id}`,
            clubId: m.clubId,
            courtNumber: m.courtNumber,
            startTime: m.startTime,
            endTime: m.endTime,
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
    return { completed: false, size: null };
};

export const calculateActivityPrice = (club: Club, startTime: Date): number => {
    // This is a placeholder. A real implementation would check club-specific rate tiers.
    const hour = startTime.getHours();
    if (hour >= 18) {
        return 28; // Peak time
    }
    return 20; // Off-peak
}

// --- Points & Students ---
export const fetchPointTransactions = async (clubId: string): Promise<PointTransaction[]> => {
     await new Promise(res => setTimeout(res, 600));
    return pointTransactions.filter(t => t.clubId === clubId);
}
export const getMockStudents = async (): Promise<User[]> => {
    await new Promise(res => setTimeout(res, 200));
    return students;
}


export const addTimeSlot = async (slotData: Omit<TimeSlot, 'id' | 'instructorName' | 'status' | 'bookedPlayers' | 'endTime'>): Promise<TimeSlot | { error: string }> => {
  // Simulate API delay
  await new Promise(res => setTimeout(res, 500));

  // Basic validation for conflicts
  const newSlotEnd = new Date(slotData.startTime.getTime() + slotData.durationMinutes * 60000);
  const conflict = timeSlots.find(slot => 
    slot.courtNumber === slotData.courtNumber &&
    slot.clubId === slotData.clubId &&
    slot.startTime < newSlotEnd &&
    new Date(slot.startTime.getTime() + slot.durationMinutes * 60000) > slotData.startTime
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
  };
  timeSlots.push(newTimeSlot);
  return newTimeSlot;
};

export const addMatch = async (matchData: Omit<Match, 'id' | 'status'>): Promise<Match | { error: string }> => {
  await new Promise(res => setTimeout(res, 500));
  
  const newMatch: Match = {
      id: uuidv4(),
      ...matchData,
      status: (matchData.bookedPlayers?.length || 0) === 4 ? 'confirmed' : 'forming',
  };
  matches.push(newMatch);

  // Add some more matches for testing
  matches.push({ ...newMatch, id: uuidv4(), courtNumber: 3, startTime: addHours(newMatch.startTime, 1), endTime: addHours(newMatch.endTime, 1) });
  matches.push({ ...newMatch, id: uuidv4(), courtNumber: 4, level: '4.5', startTime: addHours(newMatch.startTime, 2), endTime: addHours(newMatch.endTime, 2) });


  return newMatch;
};


export const addInstructor = async (instructorData: Omit<Instructor, 'id' | 'isAvailable' | 'isBlocked' | 'assignedClubId' | 'assignedCourtNumber' | 'profilePictureUrl' | 'defaultRatePerHour' | 'rateTiers' | 'email'> & { email?: string }): Promise<Instructor | { error: string }> => {
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
export const getMockTimeSlots = async (clubId: string): Promise<TimeSlot[]> => {
    await new Promise(res => setTimeout(res, 250));
    return timeSlots.filter(ts => ts.clubId === clubId);
};

export const fetchMatches = async (clubId: string): Promise<Match[]> => {
    await new Promise(res => setTimeout(res, 250));
    return matches.filter(m => m.clubId === clubId);
};

export const fetchMatchDayEventsForDate = async (date: Date, clubId: string): Promise<MatchDayEvent[]> => {
    await new Promise(res => setTimeout(res, 250));
    return matchDayEvents.filter(e => e.clubId === clubId && e.eventDate.toDateString() === date.toDateString());
}

export const getMockInstructors = async (): Promise<Instructor[]> => {
    await new Promise(res => setTimeout(res, 100));
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


// Initial mock data
const today = startOfDay(new Date());

const initialTimeSlot = addTimeSlot({ clubId: 'club-1', startTime: addHours(today, 10), durationMinutes: 60, instructorId: 'inst-2', maxPlayers: 4, courtNumber: 1, level: 'abierto', category: 'abierta'});
const initialMatch = addMatch({ clubId: 'club-1', startTime: addHours(today, 11), endTime: addMinutes(addHours(today, 11), 90), durationMinutes: 90, courtNumber: 2, level: '3.0', category: 'abierta', bookedPlayers: [{userId: 'user-1', name: 'Alex García'}, {userId: 'user-2', name: 'Beatriz Reyes'}]});

courtBookings.push(
    { id: 'booking-3', clubId: 'club-1', courtNumber: 1, startTime: addHours(today, 18), endTime: addHours(today, 19), title: "Bloqueo Pista", type: 'reserva_manual', status: 'reservada' },
);

    
