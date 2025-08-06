"use client";

import type { User, TimeSlot, Match, Booking, MatchBooking, PointTransaction } from '@/types';
import { _classifyLevelAndCategoryForSlot } from './classProposals';
import { getMockClubs } from './clubs';
import { isUserLevelCompatibleWithActivity } from '../utils';

// This function simulates some initial class bookings for demonstration purposes.
export const processInitialBookings = (students: User[], timeSlots: TimeSlot[]): { bookings: Booking[], transactions: any[], pointTransactions: PointTransaction[] } => {
    const bookings: Booking[] = [];
    const pointTransactions: PointTransaction[] = [];
    const club = getMockClubs()[0]; // Assume all bookings are for the first club for simplicity

    if (!timeSlots || timeSlots.length === 0 || !students || students.length === 0) {
        return { bookings, transactions: [], pointTransactions };
    }

    // Example 1: Elena Garcia books a spot in an early class
    const elena = students.find(s => s.id === 'student-2');
    const firstClass = timeSlots.find(ts => new Date(ts.startTime).getHours() < 12 && ts.bookedPlayers.length === 0 && !ts.isPointsOnlyBooking);
    if (elena && firstClass && club) {
        const { newLevel, newCategory } = _classifyLevelAndCategoryForSlot(firstClass, elena, club);
        firstClass.level = newLevel;
        firstClass.category = newCategory;

        if (isUserLevelCompatibleWithActivity(firstClass.level, elena.level)) {
            const newBooking: Booking = {
                id: `booking-init-1-${elena.id}`,
                userId: elena.id,
                activityId: firstClass.id,
                activityType: 'class',
                groupSize: 2,
                spotIndex: 0,
                status: 'pending',
                bookedAt: new Date(),
            };
            firstClass.bookedPlayers.push({ userId: elena.id, groupSize: 2 });
            bookings.push(newBooking);
        }
    }

    // Example 2: David Martinez books a spot in a different class
    const david = students.find(s => s.id === 'student-3');
    const secondClass = timeSlots.find(ts => ts.id !== firstClass?.id && ts.bookedPlayers.length === 0 && !ts.isPointsOnlyBooking);
    if (david && secondClass && club) {
         const { newLevel, newCategory } = _classifyLevelAndCategoryForSlot(secondClass, david, club);
        secondClass.level = newLevel;
        secondClass.category = newCategory;
        if (isUserLevelCompatibleWithActivity(secondClass.level, david.level)) {
            const newBooking: Booking = {
                id: `booking-init-2-${david.id}`,
                userId: david.id,
                activityId: secondClass.id,
                activityType: 'class',
                groupSize: 4,
                spotIndex: 0,
                status: 'pending',
                bookedAt: new Date(),
            };
            secondClass.bookedPlayers.push({ userId: david.id, groupSize: 4 });
            bookings.push(newBooking);
        }
    }

    return { bookings, transactions: [], pointTransactions };
};

// This function simulates some initial match bookings.
export const processInitialMatchBookings = (students: User[], matches: Match[]): { bookings: MatchBooking[], transactions: any[], pointTransactions: PointTransaction[] } => {
    const bookings: MatchBooking[] = [];
    const pointTransactions: PointTransaction[] = [];

    if (!matches || matches.length === 0 || !students || students.length === 0) {
        return { bookings, transactions: [], pointTransactions };
    }
    
    const alex = students.find(s => s.id === 'user-current');
    const david = students.find(s => s.id === 'student-3');
    
    const firstMatch = matches.find(m => !m.isPlaceholder && m.bookedPlayers.length === 0);

    if (alex && firstMatch && isUserLevelCompatibleWithActivity(firstMatch.level, alex.level)) {
        firstMatch.bookedPlayers.push({ userId: alex.id, name: alex.name });
        bookings.push({ id: `matchbooking-init-1-${alex.id}`, userId: alex.id, activityId: firstMatch.id, activityType: 'match' });
    }
    
    if (david && firstMatch && isUserLevelCompatibleWithActivity(firstMatch.level, david.level)) {
       firstMatch.bookedPlayers.push({ userId: david.id, name: david.name });
       bookings.push({ id: `matchbooking-init-2-${david.id}`, userId: david.id, activityId: firstMatch.id, activityType: 'match' });
    }

    return { bookings, transactions: [], pointTransactions };
};
