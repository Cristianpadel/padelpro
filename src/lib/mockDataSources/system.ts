// src/lib/mockDataSources/system.ts

import { isSameDay, format, addDays } from 'date-fns';
import type { User, Booking, MatchBooking, TimeSlot, Match } from '@/types';
import * as state from './state';
import * as config from '../config';
import { calculatePricePerPerson } from '@/lib/utils';
import { cancelBooking, bookClass } from './classActions';
import { bookMatch, createMatchesForDay } from './matches';
import { recalculateAndSetBlockedBalances } from './users';
import { createProposedClassesForDay } from './classProposals';
import { removePlayerFromMatch } from './matches';


export const verifyAndCleanUserInscriptions = async (userId: string): Promise<{
    removedClasses: { slotId: string, instructorName?: string }[],
    removedMatches: { matchId: string, level?: string }[]
}> => {
    const user = state.getMockUserDatabase().find(u => u.id === userId);
    if (!user) return { removedClasses: [], removedMatches: [] };

    const userCredit = user.credit ?? 0;
    const removedClasses: { slotId: string, instructorName?: string }[] = [];
    const removedMatches: { matchId: string, level?: string }[] = [];

    // --- Check Class Bookings ---
    // Create a copy to iterate over, as the underlying state will be modified
    const userClassBookings = [...state.getMockUserBookings().filter(b => b.userId === userId)];
    for (const booking of userClassBookings) {
        if (booking.bookedWithPoints) continue; // Ignore gratis bookings

        const slot = state.getMockTimeSlots().find(s => s.id === booking.activityId);
        // Only check unconfirmed pre-registrations
        if (!slot || slot.status !== 'pre_registration') {
            continue;
        }

        const price = calculatePricePerPerson(slot.totalPrice, booking.groupSize);
        if (price > userCredit) {
            // Use the correct cancelBooking function which takes the bookingId
            await cancelBooking(userId, booking.id);
            removedClasses.push({ slotId: booking.activityId, instructorName: slot.instructorName });
        }
    }

    // --- Check Match Bookings ---
    const userMatchBookings = [...state.getMockUserMatchBookings().filter(b => b.userId === userId)];
    for (const booking of userMatchBookings) {
        if (booking.bookedWithPoints) continue;

        const match = state.getMockMatches().find(m => m.id === booking.activityId);
        // Only check unconfirmed matches (forming and not private)
        if (!match || match.status !== 'forming') {
            continue;
        }

        const price = calculatePricePerPerson(match.totalCourtFee, 4);
        if (price > userCredit) {
            // Pass true for `isSystemRemoval` to prevent refunds/penalties
            await removePlayerFromMatch(booking.activityId, userId, true);
            removedMatches.push({ matchId: booking.activityId, level: match.level });
        }
    }
    
    // After cleaning up, recalculate the blocked credit
    await recalculateAndSetBlockedBalances(userId);
    
    return { removedClasses, removedMatches };
};

export const simulateBookings = async (options: {
    clubId: string;
    activityType: 'clases' | 'partidas';
    days: string[];
    timeRanges: ('morning' | 'midday' | 'evening')[];
    studentCount: number;
    density: number;
}): Promise<{ bookingsCreated: number; message: string }> => {
    const { clubId, activityType, days, timeRanges, studentCount, density } = options;

    const dayIndexes = days.map(day => ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(day));

    const timeSlotFilters = {
        morning: (h: number) => h >= 8 && h < 13,
        midday: (h: number) => h >= 13 && h < 18,
        evening: (h: number) => h >= 18 && h <= 22,
    };

    let targetActivities: (TimeSlot | Match)[] = [];

    if (activityType === 'clases') {
        targetActivities = state.getMockTimeSlots().filter(slot => {
            if (slot.clubId !== clubId) return false;
            // IMPORTANT FIX: Only target proposal slots (empty pre-registration)
            if (slot.status !== 'pre_registration' || (slot.bookedPlayers && slot.bookedPlayers.length > 0)) {
                return false;
            }
            const slotDate = new Date(slot.startTime);
            const slotDay = slotDate.getDay();
            const slotHour = slotDate.getHours();
            return dayIndexes.includes(slotDay) && timeRanges.some(range => timeSlotFilters[range](slotHour));
        });
    } else {
        targetActivities = state.getMockMatches().filter(match => {
            if (match.clubId !== clubId || !match.isPlaceholder) return false;
            const matchDate = new Date(match.startTime);
            const matchDay = matchDate.getDay();
            const matchHour = matchDate.getHours();
            return dayIndexes.includes(matchDay) && timeRanges.some(range => timeSlotFilters[range](matchHour));
        });
    }
    
    const activitiesToBook = targetActivities
        .sort(() => 0.5 - Math.random()) // Shuffle
        .slice(0, Math.ceil(targetActivities.length * (density / 100)));

    let bookingsCreated = 0;
    const allStudents = state.getMockStudents().filter(s => s.id !== 'user-1');

    for (const activity of activitiesToBook) {
        const studentsAlreadyBooked = 'bookedPlayers' in activity ? (activity.bookedPlayers || []).map(p => p.userId) : [];
        const availableStudents = allStudents.filter(s => !studentsAlreadyBooked.includes(s.id));
        const studentsToBook = availableStudents.sort(() => 0.5 - Math.random()).slice(0, studentCount);

        for (const student of studentsToBook) {
            let result;
            if (activityType === 'clases') {
                const groupSize = [1,2,3,4][Math.floor(Math.random()*4)] as 1|2|3|4;
                result = await bookClass(student.id, activity.id, groupSize, 0); // spotIndex needs to be valid
            } else {
                result = await bookMatch(student.id, activity.id);
            }

            if (result && 'error' in result) {
                // console.log(`Simulation could not book ${student.name} in ${activity.id}: ${result.error}`);
            } else if (result) {
                 bookingsCreated++;
                const bookingId = 'booking' in result ? result.booking.id : ('newBooking' in result && result.newBooking ? result.newBooking.id : '');
                if (!bookingId) continue;
                // Mark as simulated
                if(activityType === 'clases'){
                    const bookingIndex = state.getMockUserBookings().findIndex(b => b.id === bookingId);
                    if(bookingIndex !== -1){
                         state.getMockUserBookings()[bookingIndex].isSimulated = true;
                    }
                } else {
                     const bookingIndex = state.getMockUserMatchBookings().findIndex(b => b.id === bookingId);
                    if(bookingIndex !== -1){
                         state.getMockUserMatchBookings()[bookingIndex].isSimulated = true;
                    }
                }
            }
        }
    }
    
    return { bookingsCreated, message: `Simulación completada. Se crearon ${bookingsCreated} inscripciones.` };
};

export const clearSimulatedBookings = async (clubId: string): Promise<{ bookingsRemoved: number; message: string }> => {
    let bookingsRemoved = 0;

    const simulatedClassBookings = state.getMockUserBookings().filter(b => b.isSimulated && b.slotDetails?.clubId === clubId);
    const simulatedMatchBookings = state.getMockUserMatchBookings().filter(b => b.isSimulated && b.matchDetails?.clubId === clubId);

    bookingsRemoved += simulatedClassBookings.length + simulatedMatchBookings.length;

    // Remove players from slots
    for (const booking of simulatedClassBookings) {
        await cancelBooking(booking.userId, booking.id);
    }

    // Remove players from matches
    for (const booking of simulatedMatchBookings) {
        await removePlayerFromMatch(booking.activityId, booking.userId, true);
    }
    
    return { bookingsRemoved, message: `Se han eliminado ${bookingsRemoved} inscripciones simuladas.` };
};


// --- Dynamic Data Generation ---

export const generateDynamicTimeSlots = (): TimeSlot[] => {
    let slots: TimeSlot[] = [];
    const clubs = state.getMockClubs();
    for (let i = 0; i < 7; i++) { // Generate for the next 7 days
        const date = addDays(new Date(), i);
        for (const club of clubs) {
            slots = [...slots, ...createProposedClassesForDay(club, date)];
        }
    }
    return slots;
};

export const generateDynamicMatches = (): Match[] => {
    let matches: Match[] = [];
    const clubs = state.getMockClubs();
    for (let i = 0; i < 7; i++) { // Generate for the next 7 days
        const date = addDays(new Date(), i);
        for (const club of clubs) {
            matches = [...matches, ...createMatchesForDay(club, date)];
        }
    }
    return matches;
};
