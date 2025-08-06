"use client";

import { initializeMockStudents, initializeMockInstructors, initializeMockClubs, initializeMockPadelCourts, initializeMockShopProducts, initializeMockUserDatabase, initializeMockTimeSlots, initializeMockMatches, initializeMockUserBookings, initializeMockUserMatchBookings, initializeMockPointTransactions, initializeMockMatchDayEvents, initializeMockMatchDayInscriptions, initializeMockMatchDayCancelledInscriptions, initializeMockCurrentUser } from '../state';
import { generateInitialStudents, generateInitialInstructors, generateInitialClubs, generateInitialPadelCourts, generateInitialShopProducts } from './init-data';
import { generateDynamicTimeSlots, generateDynamicMatches } from './system';
import { processInitialBookings, processInitialMatchBookings } from './initial-bookings';
import type { MatchDayEvent, MatchDayInscription, PadelCourt } from '@/types';
import { addDays, startOfDay } from 'date-fns';


let isInitialized = false;

export const performInitialization = () => {
    if (isInitialized) {
        return;
    }

    // 1. Initialize static base data
    const initialStudents = generateInitialStudents();
    const initialInstructors = generateInitialInstructors();
    const initialClubs = generateInitialClubs();
    const initialPadelCourts = generateInitialPadelCourts();
    const initialShopProducts = generateInitialShopProducts();

    initializeMockStudents(initialStudents);
    initializeMockInstructors(initialInstructors);
    initializeMockClubs(initialClubs);
    initializeMockPadelCourts(initialPadelCourts);
    initializeMockShopProducts(initialShopProducts);
    
    // 2. Populate the UserDB (Source of Truth) from static data
    const allUsers = [...initialStudents, ...initialInstructors];
    const userDbData = allUsers.map(u => ({
        ...u,
        id: u.id,
        name: u.name,
        email: u.email!,
        hashedPassword: `hashed_password123`,
        createdAt: new Date(),
        credit: u.credit || 100,
        blockedCredit: 0,
        loyaltyPoints: u.loyaltyPoints || 50,
        pendingBonusPoints: 0,
        isBlocked: (u as any).isBlocked || false,
        favoriteInstructorIds: u.favoriteInstructorIds || [],
        profilePictureUrl: u.profilePictureUrl || `https://avatar.vercel.sh/${u.id}.png?size=96`,
        genderCategory: u.genderCategory || 'abierta',
        assignedClubId: (u as any).assignedClubId,
        assignedCourtNumber: (u as any).assignedCourtNumber,
        isAvailable: (u as any).isAvailable,
        unavailableHours: (u as any).unavailableHours,
        rateTiers: (u as any).rateTiers,
    }));
    initializeMockUserDatabase(userDbData);
    initializeMockCurrentUser(initialStudents.find(s => s.id === 'user-current') || null);


    // 3. Generate dynamic activities
    const initialTimeSlots = generateDynamicTimeSlots();
    const initialMatches = generateDynamicMatches();
    initializeMockTimeSlots(initialTimeSlots);
    initializeMockMatches(initialMatches);

    // 4. Process initial bookings which depends on users and activities
    const { bookings: initialBookings, transactions: classTransactions, pointTransactions: classPointTransactions } = processInitialBookings(initialStudents, initialTimeSlots);
    const { bookings: initialMatchBookings, transactions: matchTransactions, pointTransactions: matchPointTransactions } = processInitialMatchBookings(initialStudents, initialMatches);
    initializeMockUserBookings(initialBookings);
    initializeMockUserMatchBookings(initialMatchBookings);

    // 5. Initialize logs and other states
    initializeMockPointTransactions([...classPointTransactions, ...matchPointTransactions]);

    // --- NEW: Create a populated Match-Day Event ---
    const today = new Date();
    const daysUntilSunday = 7 - today.getDay();
    const nextSunday = addDays(startOfDay(today), daysUntilSunday);
    nextSunday.setHours(10, 0, 0, 0); // Set time to 10:00 AM

    const drawTime = new Date(nextSunday);
    drawTime.setDate(drawTime.getDate() - 1); // Saturday
    drawTime.setHours(20, 0, 0, 0); // At 8 PM

    const clubPadelEstrella = initialClubs.find(c => c.id === 'club-padelestrella');
    const clubCourts = initialPadelCourts.filter(c => c.clubId === clubPadelEstrella?.id);

    const matchDayEvent: MatchDayEvent = {
        id: 'mde-domingo-1',
        clubId: 'club-padelestrella',
        name: 'Domingo Match-Day',
        eventDate: nextSunday,
        eventEndTime: new Date(nextSunday.getTime() + 180 * 60 * 1000), // 3 hours duration
        drawTime: drawTime,
        maxPlayers: 24,
        reservePlayers: 4,
        courtIds: clubCourts.slice(0, 4).map(c => c.id), // Use first 4 courts
        price: 5,
        matchesGenerated: false,
    };
    initializeMockMatchDayEvents([matchDayEvent]);
    
    // Inscribe 21 players
    const playersToInscribe = initialStudents.slice(0, 21);
    const matchDayInscriptions: MatchDayInscription[] = playersToInscribe.map((player, index) => ({
        id: `mdi-${matchDayEvent.id}-${player.id}`,
        eventId: matchDayEvent.id,
        userId: player.id,
        userName: player.name || `User ${player.id}`,
        userLevel: player.level || 'abierto',
        userProfilePictureUrl: player.profilePictureUrl,
        status: 'main', // All are in the main list
        inscriptionTime: new Date(new Date().getTime() - (21 - index) * 60000), // Stagger inscription times
        amountBlocked: matchDayEvent.price,
    }));
    initializeMockMatchDayInscriptions(matchDayInscriptions);

    initializeMockMatchDayCancelledInscriptions([]);

    isInitialized = true;
};
