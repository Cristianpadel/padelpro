// lib/mockData.ts
import type { TimeSlot, Club, Instructor, PadelCourt, CourtGridBooking, PointTransaction, User, Match } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { startOfDay, addHours } from 'date-fns';

export let clubs: Club[] = [
    { id: 'club-1', name: 'Padel Club Madrid Centro' },
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
let courtBookings: CourtGridBooking[] = [];
let pointTransactions: PointTransaction[] = [];
let students: User[] = [
    { id: 'user-1', name: 'Alex García', loyaltyPoints: 1250 },
    { id: 'user-2', name: 'Beatriz Reyes', loyaltyPoints: 800 },
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

// --- Bookings & TimeSlots ---
export const fetchCourtBookingsForDay = async (clubId: string, date: Date): Promise<CourtGridBooking[]> => {
    await new Promise(res => setTimeout(res, 500));
    return courtBookings.filter(b => b.clubId === clubId && b.startTime.toDateString() === date.toDateString());
}

export const addManualCourtBooking = async (clubId: string, bookingData: Omit<CourtGridBooking, 'id'>): Promise<CourtGridBooking | { error: string }> => {
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

export const addInstructor = async (instructorData: Omit<Instructor, 'id' | 'isAvailable' | 'assignedClubId' | 'assignedCourtNumber'>): Promise<Instructor | { error: string }> => {
  await new Promise(res => setTimeout(res, 500));

  const existingInstructor = instructors.find(inst => inst.name.toLowerCase() === instructorData.name.toLowerCase());
  if (existingInstructor) {
    return { error: 'Ya existe un instructor con este nombre.' };
  }

  const newInstructor: Instructor = {
    id: uuidv4(),
    name: instructorData.name,
    isAvailable: true, // Default value
    assignedClubId: 'club-1', // Default value
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
