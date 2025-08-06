// lib/actions/classProposals.ts
import type { TimeSlot, User, Club, ClassPadelLevel, PadelCategoryForSlot, MatchPadelLevel, Instructor } from '@/types';
import { matchPadelLevels, numericMatchPadelLevels, daysOfWeek } from '@/types';
import { isUserLevelCompatibleWithActivity } from '../utils';
import * as state from '../state';
import { addMinutes, areIntervalsOverlapping, getDay, setHours, setMinutes, parse } from 'date-fns';
import { calculateActivityPrice, getInstructorRate } from './clubs';


/**
 * Determines the final level and category of a slot when a player joins.
 * If the slot is 'abierto', it adopts the player's level/category.
 * @param slot The TimeSlot being joined.
 * @param student The User who is joining.
 * @param club The Club where the class is held.
 * @returns An object with the newLevel and newCategory for the slot.
 */
export const _classifyLevelAndCategoryForSlot = (
    slot: TimeSlot,
    student: User,
    club: Club
): { newLevel: ClassPadelLevel, newCategory: PadelCategoryForSlot } => {
    let newLevel = slot.level;
    let newCategory = slot.category;

    // Only classify if it's the first player joining an open slot
    if ((slot.bookedPlayers || []).length === 0 && slot.level === 'abierto') {
        const studentLevel = student.level;
        if (studentLevel && studentLevel !== 'abierto') {
            const studentNumericLevel = parseFloat(studentLevel);
            const foundRange = (club.levelRanges || []).find(range => {
                const min = parseFloat(range.min);
                const max = parseFloat(range.max);
                return studentNumericLevel >= min && studentNumericLevel <= max;
            });
            if (foundRange) {
                newLevel = { min: foundRange.min, max: foundRange.max };
            } else {
                // Fallback: create a narrow range around the player's level
                const levelIndex = numericMatchPadelLevels.indexOf(studentLevel);
                const minIndex = Math.max(0, levelIndex - 1);
                const maxIndex = Math.min(numericMatchPadelLevels.length - 1, levelIndex + 1);
                newLevel = {
                    min: numericMatchPadelLevels[minIndex],
                    max: numericMatchPadelLevels[maxIndex]
                };
            }
        }
    }
    
    // Set category based on first player if it's 'abierta'
    if ((slot.bookedPlayers || []).length === 0 && slot.category === 'abierta') {
        if (student.genderCategory === 'femenino') {
            newCategory = 'chica';
        } else if (student.genderCategory === 'masculino') {
            newCategory = 'chico';
        }
    }

    return { newLevel, newCategory };
};

/**
 * Checks if a TimeSlot is a "proposal slot".
 * A proposal slot is one that is in the 'forming' state and has no booked players.
 * @param slot The TimeSlot to check.
 * @returns True if the slot is a proposal slot, false otherwise.
 */
export const isProposalSlot = (slot: TimeSlot): boolean => {
    return slot.status === 'pre_registration' && (!slot.bookedPlayers || slot.bookedPlayers.length === 0);
};

export const createProposedClassesForDay = (club: Club, date: Date): TimeSlot[] => {
    const slotsForDay: TimeSlot[] = [];
    const clubInstructors = state.getMockInstructors().filter(i => i.assignedClubId === club.id && i.isAvailable);

    if (!clubInstructors.length) return [];

    const startHour = 8;
    const endHour = 22;
    const slotDuration = 60; // minutes

    for (let hour = startHour; hour < endHour; hour++) {
        for (const instructor of clubInstructors) {
            const startTime = setMinutes(setHours(date, hour), 0);
            const endTime = addMinutes(startTime, slotDuration);
            const dayOfWeek = daysOfWeek[getDay(startTime)];

            // Check if instructor is available at this time
            const isUnavailable = instructor.unavailableHours?.[dayOfWeek]?.some(range =>
                areIntervalsOverlapping(
                    { start: startTime, end: endTime },
                    { start: parse(range.start, 'HH:mm', date), end: parse(range.end, 'HH:mm', date) },
                    { inclusive: false }
                )
            );

            if (isUnavailable) {
                continue;
            }

            // Calculate price based on court and instructor rates
            const courtPrice = calculateActivityPrice(club, startTime);
            const instructorRate = getInstructorRate(instructor, startTime);
            const totalPrice = courtPrice + instructorRate;

            const newProposal: TimeSlot = {
                id: `ts-proposal-${club.id}-${instructor.id}-${date.toISOString().slice(0, 10)}-${hour}`,
                clubId: club.id,
                startTime: startTime,
                endTime: endTime,
                durationMinutes: slotDuration,
                instructorId: instructor.id,
                instructorName: instructor.name,
                maxPlayers: 4,
                level: 'abierto',
                category: 'abierta',
                status: 'pre_registration',
                bookedPlayers: [],
                designatedGratisSpotPlaceholderIndexForOption: {},
                totalPrice,
            };
            slotsForDay.push(newProposal);
        }
    }
    return slotsForDay;
};
