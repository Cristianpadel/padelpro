// lib/mockDataSources/init.ts
"use client";

import {
  initializeMockStudents,
  initializeMockCurrentUser,
  initializeMockAdminUser,
  initializeMockSuperAdminUser,
  initializeMockInstructors,
  initializeMockClubs,
  initializeMockPadelCourts,
  initializeMockUserBookings,
  initializeMockUserMatchBookings,
  initializeMockTimeSlots,
  initializeMockMatches,
  initializeMockUserDatabase,
  initializeMockReviews,
  initializeMockPointTransactions,
  initializeMockMatchDayEvents,
  initializeMockMatchDayInscriptions,
  initializeMockMatchDayCancelledInscriptions,
  initializeMockShopProducts,
  getMockClubs as clubs,
  getMockPadelCourts as padelCourts,
  getMockUserDatabase as userDatabase,
  getMockInstructors as instructors,
  getMockTimeSlots as timeSlots,
  getMockMatches as matches,
  getMockMatchDayEvents as matchDayEvents,
  getMockMatchDayInscriptions as matchDayInscriptions,
  getMockShopProducts as shopProducts,
} from './state';
import { generateDynamicTimeSlots, generateDynamicMatches, simulateBookings } from './system';
import { startOfDay, addDays, setHours, setMinutes, addMinutes, nextSunday } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { defaultPointSettings } from '../config';
import { bookClass, bookMatch } from './index';

let isInitialized = false;

export function performInitialization() {
  if (isInitialized) {
    return;
  }
  isInitialized = true;

  // --- Initialize Clubs ---
  const initialClubs = [
    {
        id: 'club-1',
        name: 'Padel Estrella',
        location: 'Madrid, España',
        logoUrl: '/logo-padel-estrella.png',
        showClassesTabOnFrontend: true,
        showMatchesTabOnFrontend: true,
        isMatchDayEnabled: true,
        pointSettings: defaultPointSettings,
        adminEmail: 'admin@padelestrella.com',
        adminPassword: 'adminpassword',
        levelRanges: [
            { name: "Iniciación", min: '1.0', max: '2.0', color: 'hsl(142.1 76.2% 36.3%)' },
            { name: "Intermedio", min: '2.5', max: '3.5', color: 'hsl(210 100% 56%)' },
            { name: "Avanzado", min: '4.0', max: '5.5', color: 'hsl(24.6 95% 53.1%)' },
            { name: "Competición", min: '6.0', max: '7.0', color: 'hsl(346.8 77.2% 49.8%)' },
        ],
        courtRateTiers: [
          { id: uuidv4(), name: "Valle", days: ["monday", "tuesday", "wednesday", "thursday", "friday"], startTime: "09:00", endTime: "18:00", rate: 20 },
          { id: uuidv4(), name: "Punta", days: ["monday", "tuesday", "wednesday", "thursday", "friday"], startTime: "18:00", endTime: "22:00", rate: 28 },
          { id: uuidv4(), name: "Fines de Semana", days: ["saturday", "sunday"], startTime: "09:00", endTime: "22:00", rate: 30 }
        ],
        pointBookingSlots: {
            saturday: [{ start: "14:00", end: "17:00" }],
            sunday: [{ start: "14:00", end: "17:00" }],
        },
        cardShadowEffect: {
            enabled: true,
            color: '#808080',
            intensity: 0.7,
        },
        shopReservationFee: 1, // Add default reservation fee
    },
    // ... other clubs
  ];
  initializeMockClubs(initialClubs);

  // --- Initialize Padel Courts ---
  const initialPadelCourts = [
      { id: 'court-1', clubId: 'club-1', courtNumber: 1, name: 'Pista Central', isActive: true },
      { id: 'court-2', clubId: 'club-1', courtNumber: 2, name: 'Pista 2', isActive: true },
      { id: 'court-3', clubId: 'club-1', courtNumber: 3, name: 'Pista 3 (Cristal)', isActive: true },
      { id: 'court-4', clubId: 'club-1', courtNumber: 4, name: 'Pista 4', isActive: true },
      { id: 'court-5', clubId: 'club-1', courtNumber: 5, name: 'Pista 5', isActive: false },
  ];
  initializeMockPadelCourts(initialPadelCourts);

  // --- Initialize Users ---
  const initialUserDatabase = [
    {
      id: 'user-current',
      name: 'Alex García',
      email: 'alex.garcia@email.com',
      hashedPassword: 'hashed_password123',
      level: '4.0',
      credit: 125.50,
      blockedCredit: 0,
      loyaltyPoints: 50,
      pendingBonusPoints: 0,
      blockedLoyaltyPoints: 0,
      preferredGameType: 'partidas',
      favoriteInstructorIds: ['inst-1', 'inst-2'],
      profilePictureUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
      genderCategory: 'masculino',
      createdAt: new Date(),
      clubId: 'club-1',
    },
     { id: 'user-2', name: 'Beatriz López', email: 'beatriz.lopez@email.com', hashedPassword: 'hashed_password123', level: '3.5', credit: 80.00, loyaltyPoints: 450, profilePictureUrl: 'https://randomuser.me/api/portraits/women/44.jpg', genderCategory: 'femenino', createdAt: new Date(), clubId: 'club-1', },
     { id: 'user-3', name: 'Carlos Fernández', email: 'carlos.fernandez@email.com', hashedPassword: 'hashed_password123', level: '4.5', credit: 25.00, loyaltyPoints: 800, profilePictureUrl: 'https://randomuser.me/api/portraits/men/45.jpg', genderCategory: 'masculino', createdAt: new Date(), clubId: 'club-1', },
     { id: 'user-4', name: 'Diana Martínez', email: 'diana.martinez@email.com', hashedPassword: 'hashed_password123', level: '2.5', credit: 150.00, loyaltyPoints: 120, profilePictureUrl: 'https://randomuser.me/api/portraits/women/46.jpg', genderCategory: 'femenino', createdAt: new Date(), clubId: 'club-1', },
     { id: 'user-5', name: 'Eduardo Ruiz', email: 'eduardo.ruiz@email.com', hashedPassword: 'hashed_password123', level: '3.0', credit: 10.00, loyaltyPoints: 300, profilePictureUrl: 'https://randomuser.me/api/portraits/men/47.jpg', genderCategory: 'masculino', createdAt: new Date(), clubId: 'club-1', },
     { id: 'user-6', name: 'Fátima Jiménez', email: 'fatima.jimenez@email.com', hashedPassword: 'hashed_password123', level: '2.0', credit: 200.00, loyaltyPoints: 50, profilePictureUrl: 'https://randomuser.me/api/portraits/women/48.jpg', genderCategory: 'femenino', createdAt: new Date(), clubId: 'club-1', },
     { id: 'user-7', name: 'Gustavo Herrero', email: 'gustavo.herrero@email.com', hashedPassword: 'hashed_password123', level: '5.0', credit: 5.00, loyaltyPoints: 1000, profilePictureUrl: 'https://randomuser.me/api/portraits/men/49.jpg', genderCategory: 'masculino', createdAt: new Date(), clubId: 'club-1', },
     { id: 'user-8', name: 'Helena Moreno', email: 'helena.moreno@email.com', hashedPassword: 'hashed_password123', level: '4.0', credit: 55.00, loyaltyPoints: 220, profilePictureUrl: 'https://randomuser.me/api/portraits/women/50.jpg', genderCategory: 'femenino', createdAt: new Date(), clubId: 'club-1', },
     { id: 'user-9', name: 'Iván Navarro', email: 'ivan.navarro@email.com', hashedPassword: 'hashed_password123', level: '3.5', credit: 75.00, loyaltyPoints: 150, profilePictureUrl: 'https://randomuser.me/api/portraits/men/51.jpg', genderCategory: 'masculino', createdAt: new Date(), clubId: 'club-1', },
     { id: 'user-10', name: 'Juana Peña', email: 'juana.pena@email.com', hashedPassword: 'hashed_password123', level: '1.5', credit: 120.00, loyaltyPoints: 75, profilePictureUrl: 'https://randomuser.me/api/portraits/women/52.jpg', genderCategory: 'femenino', createdAt: new Date(), clubId: 'club-1', },
     { id: 'user-11', name: 'Kevin Sáez', email: 'kevin.saez@email.com', hashedPassword: 'hashed_password123', level: '4.5', credit: 30.00, loyaltyPoints: 400, profilePictureUrl: 'https://randomuser.me/api/portraits/men/53.jpg', genderCategory: 'masculino', createdAt: new Date(), clubId: 'club-1', },
     { id: 'user-12', name: 'Laura Vidal', email: 'laura.vidal@email.com', hashedPassword: 'hashed_password123', level: '3.0', credit: 90.00, loyaltyPoints: 180, profilePictureUrl: 'https://randomuser.me/api/portraits/women/54.jpg', genderCategory: 'femenino', createdAt: new Date(), clubId: 'club-1', },
     { id: 'user-13', name: 'Marcos Ibáñez', email: 'marcos.ibanez@email.com', hashedPassword: 'hashed_password123', level: '2.5', credit: 40.00, loyaltyPoints: 90, profilePictureUrl: 'https://randomuser.me/api/portraits/men/55.jpg', genderCategory: 'masculino', createdAt: new Date(), clubId: 'club-1', },
     { id: 'user-14', name: 'Nerea Campos', email: 'nerea.campos@email.com', hashedPassword: 'hashed_password123', level: '4.0', credit: 60.00, loyaltyPoints: 330, profilePictureUrl: 'https://randomuser.me/api/portraits/women/56.jpg', genderCategory: 'femenino', createdAt: new Date(), clubId: 'club-1', },
     { id: 'user-15', name: 'Óscar Romero', email: 'oscar.romero@email.com', hashedPassword: 'hashed_password123', level: '5.5', credit: 15.00, loyaltyPoints: 600, profilePictureUrl: 'https://randomuser.me/api/portraits/men/57.jpg', genderCategory: 'masculino', createdAt: new Date(), clubId: 'club-1', },
     { id: 'user-16', name: 'Patricia Soler', email: 'patricia.soler@email.com', hashedPassword: 'hashed_password123', level: '3.5', credit: 85.00, loyaltyPoints: 250, profilePictureUrl: 'https://randomuser.me/api/portraits/women/58.jpg', genderCategory: 'femenino', createdAt: new Date(), clubId: 'club-1', },
     { id: 'user-17', name: 'Rubén Pascual', email: 'ruben.pascual@email.com', hashedPassword: 'hashed_password123', level: '4.0', credit: 45.00, loyaltyPoints: 190, profilePictureUrl: 'https://randomuser.me/api/portraits/men/59.jpg', genderCategory: 'masculino', createdAt: new Date(), clubId: 'club-1', },
     { id: 'user-18', name: 'Sara Fuentes', email: 'sara.fuentes@email.com', hashedPassword: 'hashed_password123', level: '2.5', credit: 110.00, loyaltyPoints: 110, profilePictureUrl: 'https://randomuser.me/api/portraits/women/60.jpg', genderCategory: 'femenino', createdAt: new Date(), clubId: 'club-1', },
  ];
  initializeMockUserDatabase(initialUserDatabase);
  
  const initialStudents = initialUserDatabase
    .filter(u => u.email && !u.email.includes('@padelestrella.com') && !u.email.includes('@padelapp.com') && !u.id.startsWith('instructor-'))
    .map(u => ({
        id: u.id, name: u.name, email: u.email, level: u.level, credit: u.credit,
        blockedCredit: u.blockedCredit, loyaltyPoints: u.loyaltyPoints,
        pendingBonusPoints: u.pendingBonusPoints, blockedLoyaltyPoints: u.blockedLoyaltyPoints,
        preferredGameType: u.preferredGameType, favoriteInstructorIds: u.favoriteInstructorIds,
        profilePictureUrl: u.profilePictureUrl, genderCategory: u.genderCategory
    }));
  initializeMockStudents(initialStudents);

  const currentUserData = initialUserDatabase.find(u => u.id === 'user-current');
  initializeMockCurrentUser(currentUserData ? {
      id: currentUserData.id, name: currentUserData.name, email: currentUserData.email, level: currentUserData.level,
      credit: currentUserData.credit, blockedCredit: currentUserData.blockedCredit, loyaltyPoints: currentUserData.loyaltyPoints,
      pendingBonusPoints: currentUserData.pendingBonusPoints, blockedLoyaltyPoints: currentUserData.blockedLoyaltyPoints,
      preferredGameType: currentUserData.preferredGameType, favoriteInstructorIds: currentUserData.favoriteInstructorIds,
      profilePictureUrl: currentUserData.profilePictureUrl, genderCategory: currentUserData.genderCategory,
  } : null);

  // --- Initialize Instructors ---
  const initialInstructors = [
      { id: 'inst-1', name: 'Carlos Santana', email: 'carlos.santana@padelestrella.com', profilePictureUrl: 'https://randomuser.me/api/portraits/men/1.jpg', level: '6.0', genderCategory: 'masculino', assignedClubId: 'club-1', isAvailable: true, defaultRatePerHour: 35, clubId: 'club-1' },
      { id: 'inst-2', name: 'Ana García', email: 'ana.garcia@padelestrella.com', profilePictureUrl: 'https://randomuser.me/api/portraits/women/2.jpg', level: '5.5', genderCategory: 'femenino', assignedClubId: 'club-1', isAvailable: true, defaultRatePerHour: 30, assignedCourtNumber: 2, clubId: 'club-1' },
  ];
  initializeMockInstructors(initialInstructors);
  
  initialInstructors.forEach(inst => {
      const dbEntry = initialUserDatabase.find(u => u.id === inst.id);
      if (!dbEntry) {
        initialUserDatabase.push({
          id: inst.id, name: inst.name, email: inst.email!, hashedPassword: `hashed_${inst.name}`, createdAt: new Date(), ...inst
        });
      }
  });

  // --- Initialize Shop Products ---
  const initialShopProducts = [
      { id: 'prod-1', clubId: 'club-1', name: 'Pala Bullpadel Vertex 04', images: ['/vertex-04.webp'], officialPrice: 280, offerPrice: 220, stock: 5, status: 'in-stock', category: 'pala', aiHint: 'Bullpadel Vertex racket' },
      { id: 'prod-2', clubId: 'club-1', name: 'Cajón de Pelotas Head Pro', images: ['/head-pro-balls.webp'], officialPrice: 85, offerPrice: 75, stock: 20, status: 'in-stock', category: 'pelotas', aiHint: 'Head Pro balls' },
      { id: 'prod-3', clubId: 'club-1', name: 'Zapatillas Joma T.SLAM', images: ['/joma-slam.webp'], officialPrice: 90, offerPrice: 70, stock: 12, status: 'in-stock', category: 'ropa', aiHint: 'Joma padel shoes' },
      { id: 'prod-4', clubId: 'club-1', name: 'Paletero Siux', images: ['/siux-bag.webp'], officialPrice: 70, offerPrice: 60, stock: 8, status: 'in-stock', category: 'accesorios', aiHint: 'Siux padel bag' },
  ];
  initializeMockShopProducts(initialShopProducts);


  // --- Initialize Activities ---
  const initialTimeSlots = generateDynamicTimeSlots();
  initializeMockTimeSlots(initialTimeSlots);
  const initialMatches = generateDynamicMatches();
  
  // Create some mock MatchPro games
  const today = startOfDay(new Date());
  const proMatch1 = {
      id: 'match-pro-1',
      clubId: 'club-1',
      startTime: setMinutes(setHours(today, 19), 30),
      endTime: setMinutes(setHours(today, 21), 0),
      durationMinutes: 90,
      courtNumber: 1,
      level: 'abierto',
      category: 'abierta',
      isProMatch: true,
      status: 'forming',
      bookedPlayers: [
          { userId: 'user-7', name: 'Gustavo Herrero' },
          { userId: 'user-15', name: 'Óscar Romero' },
      ],
  };
  const proMatch2 = {
      id: 'match-pro-2',
      clubId: 'club-1',
      startTime: setMinutes(setHours(addDays(today, 1), 20), 0),
      endTime: setMinutes(setHours(addDays(today, 1), 21), 30),
      durationMinutes: 90,
      courtNumber: 2,
      level: 'abierto',
      category: 'abierta',
      isProMatch: true,
      status: 'forming',
      bookedPlayers: [],
  };
  initialMatches.push(proMatch1, proMatch2);
  initializeMockMatches(initialMatches);

  // --- Initialize Bookings ---
  initializeMockUserBookings([]);
  initializeMockUserMatchBookings([]);

  // --- Initialize Match-Day Event ---
  const nextSundayDate = nextSunday(new Date());
  const eventStartTime = setMinutes(setHours(nextSundayDate, 10), 30);
  const eventEndTime = setMinutes(setHours(nextSundayDate, 12), 0);
  
  const matchDayEventId = 'match-day-event-1';
  const initialMatchDayEvents = [
    {
      id: matchDayEventId,
      name: "Sunday Match-Day Special",
      clubId: 'club-1',
      eventDate: eventStartTime,
      eventEndTime: eventEndTime,
      courtIds: ['court-1', 'court-2', 'court-3', 'court-4'],
      maxPlayers: 16,
      reservePlayers: 4,
      price: 5,
      matchesGenerated: false,
    },
  ];
  initializeMockMatchDayEvents(initialMatchDayEvents);
  
  // --- Initialize Match-Day Inscriptions ---
  const inscribedUsers = initialUserDatabase.slice(0, 14); // Inscribe 14 users to leave 2 spots
  const initialMatchDayInscriptions = inscribedUsers.map((user, index) => {
      // All 14 are on the main list
      return {
          id: `md-insc-${user.id}`,
          eventId: matchDayEventId,
          userId: user.id,
          userName: user.name || 'Unknown',
          userLevel: user.level || 'abierto',
          userProfilePictureUrl: user.profilePictureUrl,
          status: 'main',
          inscriptionTime: addMinutes(new Date(), index),
          amountBlocked: 5.00,
      };
  });
  initializeMockMatchDayInscriptions(initialMatchDayInscriptions);

  // ... Initialize other states ...
  initializeMockPointTransactions([]);
  
  

  // --- Simulate some initial activity to make the app look alive ---
  const simulateInitialData = async () => {
    const clubId = 'club-1';
    
    // Simulate some class bookings
    const openClassSlots = timeSlots().filter(s => s.clubId === clubId && s.status === 'pre_registration' && (!s.bookedPlayers || s.bookedPlayers.length === 0));
    const students = userDatabase().filter(u => u.id.startsWith('user-'));

    if (openClassSlots.length > 0 && students.length > 2) {
      await bookClass(students[1].id, openClassSlots[0].id, 4, 0);
    }
     if (openClassSlots.length > 2 && students.length > 4) {
      await bookClass(students[2].id, openClassSlots[2].id, 2, 0);
      await bookClass(students[3].id, openClassSlots[2].id, 2, 1);
    }

    // Simulate some match bookings
    const openMatches = matches().filter(m => m.clubId === clubId && m.isPlaceholder);
    if (openMatches.length > 1 && students.length > 5) {
        await bookMatch(students[4].id, openMatches[1].id);
    }
     if (openMatches.length > 3 && students.length > 8) {
        await bookMatch(students[5].id, openMatches[3].id);
        await bookMatch(students[6].id, openMatches[3].id);
        await bookMatch(students[7].id, openMatches[3].id);
    }

    // Simulate a full match
     if (openMatches.length > 5 && students.length > 12) {
        const matchToFill = openMatches[5];
        await bookMatch(students[8].id, matchToFill.id);
        await bookMatch(students[9].id, matchToFill.id);
        await bookMatch(students[10].id, matchToFill.id);
        await bookMatch(students[11].id, matchToFill.id);
    }
  };

  simulateInitialData();
}
