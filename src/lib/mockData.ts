// lib/mockData.ts
import type { TimeSlot, Club, Instructor, PadelCourt, CourtGridBooking, PointTransaction, User, Match } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { startOfDay, addHours } from 'date-fns';

export let clubs: Club[] = [
    { id: 'club-1', name: 'Padel Club Madrid Centro', pointSettings: { cancellationPointPerEuro: 1, inviteFriend: 5, firstToJoinClass: 2, firstToJoinMatch: 2, pointsCostForCourt: 20 } },
    { id: 'club-2', name: 'Padel Club Pozuelo' },
];

export let instructors: Instructor[] = [
    { id: 'inst-1', name: 'Carlos López', isAvailable: true, assignedClubId: 'club-1', assignedCourtNumber: 1, email: 'carlos.lopez@example.com' },
    { id: 'inst-2', name: 'Ana García', isAvailable: true, assignedClubId: 'club-1', email: 'ana.garcia@example.com' },
    { id: 'inst-3', name: 'Javier Fernández', isAvailable: false, assignedClubId: 'club-2', email: 'javier.fernandez@example.com' },
];

export let padelCourts: PadelCourt[] = [
    { id: 'court-1-1', clubId: 'club-1', name: 'Pista Central', courtNumber: 1, isActive: true },
    { id: 'court-1-2', clubId: 'club-1', name: 'Pista 2', courtNumber: 2, isActive: true },
    { id: 'court-2-1', clubId: 'club-2', name: 'Pista VIP', courtNumber: 1, isActive: true },
    { id: 'court-2-2', clubId: 'club-2', name: 'Pista 3', courtNumber: 3, isActive: false },
];

let timeSlots: TimeSlot[] = [];
let matches: Match[] = [];
let courtBookings: CourtGridBooking[] = [];
let pointTransactions: PointTransaction[] = [];
let students: User[] = [
    { id: 'user-1', name: 'Alex García', loyaltyPoints: 1250, level: '3.5' },
    { id: 'user-2', name: 'Beatriz Reyes', loyaltyPoints: 800, level: '4.0' },
];


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
    return courtBookings.filter(b => b.clubId === clubId && b.startTime.toDateString() === date.toDateString());
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

export const isSlotEffectivelyCompleted = (slot: TimeSlot | Match): boolean => {
    if (!slot.status) return false;
    const confirmedStatuses: (TimeSlot['status'] | Match['status'])[] = ['confirmed', 'confirmed_private'];
    return confirmedStatuses.includes(slot.status);
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


export const addTimeSlot = async (slotData: Omit<TimeSlot, 'id'>): Promise<TimeSlot | { error: string }> => {
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

  const newTimeSlot: TimeSlot = {
    id: uuidv4(),
    ...slotData,
  };
  timeSlots.push(newTimeSlot);
  return newTimeSlot;
};

export const addMatch = async (matchData: Omit<Match, 'id'>): Promise<Match | { error: string }> => {
  await new Promise(res => setTimeout(res, 500));
  
  const newMatch: Match = {
      id: uuidv4(),
      ...matchData,
      status: 'forming', // Default status
  };
  matches.push(newMatch);
  
  // Also create a corresponding court booking
  const newBooking: CourtGridBooking = {
      id: uuidv4(),
      clubId: newMatch.clubId,
      courtNumber: newMatch.courtNumber,
      startTime: newMatch.startTime,
      endTime: newMatch.endTime,
      title: `Partida Nivel ${newMatch.level}`,
      type: 'partida',
      status: 'proceso_inscripcion',
      activityStatus: newMatch.status,
      participants: newMatch.bookedPlayers?.length || 0,
      maxParticipants: 4,
  };
  courtBookings.push(newBooking);

  return newMatch;
};


export const addInstructor = async (instructorData: Omit<Instructor, 'id' | 'isAvailable' | 'assignedClubId' | 'assignedCourtNumber'>): Promise<Instructor | { error: string }> => {
  await new Promise(res => setTimeout(res, 500));

  const existingInstructor = instructors.find(inst => inst.name.toLowerCase() === instructorData.name.toLowerCase());
  if (existingInstructor) {
    return { error: 'Ya existe un instructor con este nombre.' };
  }

  const newInstructor: Instructor = {
    id: uuidv4(),
    ...instructorData,
    isAvailable: true, // Default value
  };
  instructors.push(newInstructor);
  return newInstructor;
};

// Initial mock data
const today = startOfDay(new Date());
courtBookings.push(
    { id: 'booking-1', clubId: 'club-1', courtNumber: 1, startTime: addHours(today, 10), endTime: addHours(today, 11), title: "Clase Ana García", type: 'clase', status: 'proceso_inscripcion', activityStatus: 'forming' },
    { id: 'booking-2', clubId: 'club-1', courtNumber: 2, startTime: addHours(today, 11), endTime: addHours(today, 12.5), title: "Partida Nivel 3.0", type: 'partida', status: 'reservada', activityStatus: 'confirmed' },
    { id: 'booking-3', clubId: 'club-1', courtNumber: 1, startTime: addHours(today, 18), endTime: addHours(today, 19), title: "Bloqueo Pista", type: 'reserva_manual', status: 'reservada' },
);
