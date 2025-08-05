// lib/mockData.ts
import type { TimeSlot, Club, Instructor, PadelCourt } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export const clubs: Club[] = [
    { id: 'club-1', name: 'Padel Club Madrid Centro' },
    { id: 'club-2', name: 'Padel Club Pozuelo' },
];

export const instructors: Instructor[] = [
    { id: 'inst-1', name: 'Carlos López', isAvailable: true, assignedClubId: 'club-1', assignedCourtNumber: 1 },
    { id: 'inst-2', name: 'Ana García', isAvailable: true, assignedClubId: 'club-1' },
    { id: 'inst-3', name: 'Javier Fernández', isAvailable: false, assignedClubId: 'club-2' },
];

export const padelCourts: PadelCourt[] = [
    { id: 'court-1-1', clubId: 'club-1', name: 'Pista Central', courtNumber: 1 },
    { id: 'court-1-2', clubId: 'club-1', name: 'Pista 2', courtNumber: 2 },
    { id: 'court-2-1', clubId: 'club-2', name: 'Pista VIP', courtNumber: 1 },
];

let timeSlots: TimeSlot[] = [];

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
