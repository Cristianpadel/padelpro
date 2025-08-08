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
import { startOfDay, addDays, setHours, setMinutes, addMinutes } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { defaultPointSettings } from '../config';

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
            color: '#a855f7',
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
    },
     { id: 'user-2', name: 'Beatriz López', email: 'beatriz.lopez@email.com', hashedPassword: 'hashed_password123', level: '3.5', credit: 80.00, loyaltyPoints: 450, profilePictureUrl: 'https://randomuser.me/api/portraits/women/44.jpg', genderCategory: 'femenino', createdAt: new Date(), },
     { id: 'user-3', name: 'Carlos Fernández', email: 'carlos.fernandez@email.com', hashedPassword: 'hashed_password123', level: '4.5', credit: 25.00, loyaltyPoints: 800, profilePictureUrl: 'https://randomuser.me/api/portraits/men/45.jpg', genderCategory: 'masculino', createdAt: new Date(), },
     { id: 'user-4', name: 'Diana Martínez', email: 'diana.martinez@email.com', hashedPassword: 'hashed_password123', level: '2.5', credit: 150.00, loyaltyPoints: 120, profilePictureUrl: 'https://randomuser.me/api/portraits/women/46.jpg', genderCategory: 'femenino', createdAt: new Date(), },
     { id: 'user-5', name: 'Eduardo Ruiz', email: 'eduardo.ruiz@email.com', hashedPassword: 'hashed_password123', level: '3.0', credit: 10.00, loyaltyPoints: 300, profilePictureUrl: 'https://randomuser.me/api/portraits/men/47.jpg', genderCategory: 'masculino', createdAt: new Date(), },
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
      { id: 'inst-1', name: 'Carlos Santana', email: 'carlos.santana@padelestrella.com', profilePictureUrl: 'https://randomuser.me/api/portraits/men/1.jpg', level: '6.0', genderCategory: 'masculino', assignedClubId: 'club-1', isAvailable: true, defaultRatePerHour: 35 },
      { id: 'inst-2', name: 'Ana García', email: 'ana.garcia@padelestrella.com', profilePictureUrl: 'https://randomuser.me/api/portraits/women/2.jpg', level: '5.5', genderCategory: 'femenino', assignedClubId: 'club-1', isAvailable: true, defaultRatePerHour: 30, assignedCourtNumber: 2 },
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
  initializeMockMatches(initialMatches);

  // --- Initialize Bookings ---
  initializeMockUserBookings([]);
  initializeMockUserMatchBookings([]);

  // ... Initialize other states ...
  initializeMockPointTransactions([]);
  initializeMockMatchDayEvents([]);
  initializeMockMatchDayInscriptions([]);
  

  // --- Simulate some initial activity to make the app look alive ---
  simulateBookings({
    clubId: 'club-1',
    activityType: 'partidas',
    days: ['monday', 'wednesday', 'friday', 'saturday'],
    timeRanges: ['evening'],
    studentCount: 3,
    density: 20, // 20% of evening matches on these days
  });
   simulateBookings({
    clubId: 'club-1',
    activityType: 'clases',
    days: ['tuesday', 'thursday'],
    timeRanges: ['morning', 'midday'],
    studentCount: 2,
    density: 15, // 15% of morning/midday classes on these days
  });

}
