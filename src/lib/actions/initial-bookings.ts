"use client";

import type { User, TimeSlot, Match, Booking, MatchBooking, PointTransaction } from '@/types';
import { calculatePricePerPerson } from '@/lib/utils';
import { isSlotEffectivelyCompleted } from '../utils';

// This file contains the logic to create the initial state of bookings for the mock data.
// It simulates users having already booked some classes and matches.

export const processInitialBookings = (students: User[], timeSlots: TimeSlot[]): { bookings: Booking[], transactions: any[], pointTransactions: PointTransaction[] } => {
    const bookings: Booking[] = [];
    const transactions: any[] = [];
    const pointTransactions: PointTransaction[] = [];

    const studentCristian = students.find(s => s.id === 'user-current');
    const studentElena = students.find(s => s.id === 'student-2');
    
    // Scenario 1: A confirmed class to show court occupation
    const classToConfirm = timeSlots.find(s => s.instructorName === 'Javier Gómez' && new Date(s.startTime).getHours() === 10 && !isSlotEffectivelyCompleted(s).completed);
    if (classToConfirm) {
        const otherStudents = students.filter(s => s.id !== 'user-current' && s.id !== 'student-2');
        if (otherStudents.length >= 4) {
            for (let i = 0; i < 4; i++) {
                const student = otherStudents[i];
                const price = calculatePricePerPerson(classToConfirm.totalPrice || 0, 4);
                bookings.push({
                    id: `booking-init-${i + 1}`,
                    userId: student.id,
                    activityId: classToConfirm.id,
                    activityType: 'class',
                    groupSize: 4,
                    spotIndex: i,
                    status: 'confirmed',
                    bookedAt: new Date(),
                });
                classToConfirm.bookedPlayers.push({ userId: student.id, groupSize: 4 });
                 transactions.push({
                    id: `txn-init-${i + 1}`,
                    userId: student.id,
                    date: new Date(),
                    type: 'Reserva Clase',
                    amount: -price,
                    description: `Clase con ${classToConfirm.instructorName}`,
                });
            }
            // Now the class is full, update its status
            classToConfirm.status = 'confirmed';
            classToConfirm.courtNumber = 2; // Assign a specific court for testing
        }
    }
    
    // Scenario 2: Cristian books a different class
    const classForCristian = timeSlots.find(s => s.instructorName === 'Sofía Martín' && new Date(s.startTime).getHours() === 11 && !isSlotEffectivelyCompleted(s).completed);
     if (classForCristian && studentCristian) {
        const price = calculatePricePerPerson(classForCristian.totalPrice || 0, 4);
        bookings.push({
            id: `booking-init-cristian`,
            userId: studentCristian.id,
            activityId: classForCristian.id,
            activityType: 'class',
            groupSize: 4,
            spotIndex: 0,
            status: 'pending',
            bookedAt: new Date(),
        });
        classForCristian.bookedPlayers.push({ userId: studentCristian.id, groupSize: 4 });
        transactions.push({
            id: `txn-init-cristian`,
            userId: studentCristian.id,
            date: new Date(),
            type: 'Reserva Clase',
            amount: -price,
            description: `Clase con ${classForCristian.instructorName}`,
        });
    }


    return { bookings, transactions, pointTransactions };
};


export const processInitialMatchBookings = (students: User[], matches: Match[]): { bookings: MatchBooking[], transactions: any[], pointTransactions: PointTransaction[] } => {
    const bookings: MatchBooking[] = [];
    const transactions: any[] = [];
    const pointTransactions: PointTransaction[] = [];
    
    // Find a placeholder match to populate at 10:00
    const matchToPopulate = matches.find(m => m.isPlaceholder && m.status === 'forming' && new Date(m.startTime).getHours() === 10);
    
    if (matchToPopulate) {
        const playersToJoin = students.slice(0, 4); // Get first 4 students to confirm it
        
        for (const player of playersToJoin) {
            const price = calculatePricePerPerson(matchToPopulate.totalCourtFee || 0, 4);
            matchToPopulate.bookedPlayers.push({ userId: player.id, name: player.name });
            bookings.push({
                id: `matchbooking-init-${player.id}`,
                userId: player.id,
                activityId: matchToPopulate.id,
                activityType: 'match',
                bookedAt: new Date(),
            });
             transactions.push({
                id: `matchtxn-init-${player.id}`,
                userId: player.id,
                date: new Date(),
                type: 'Reserva Partida',
                amount: -price,
                description: `Partida Nivel ${matchToPopulate.level}`,
            });
        }
        // Update the placeholder match to be a real, confirmed match
        matchToPopulate.isPlaceholder = false;
        matchToPopulate.status = 'confirmed';
        matchToPopulate.courtNumber = 3; // Assign a court
        if(students[0].level) matchToPopulate.level = students[0].level;
    }


    return { bookings, transactions, pointTransactions };
};
