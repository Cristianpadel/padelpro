// lib/actions/init.ts
"use client";

import type { User, Instructor, Club, PadelCourt, Product, DayOfWeek, CourtRateTier } from '@/types';

// --- Static Data Generation Functions ---

export const generateInitialStudents = (): User[] => [
    {
        id: 'user-current',
        name: 'Cristian Parra',
        email: 'cristian.parra@ejemplo.com',
        password: 'password123',
        level: '4.5',
        credit: 150.50,
        loyaltyPoints: 125,
        pendingBonusPoints: 0,
        preferredGameType: 'partidas',
        favoriteInstructorIds: ['instructor-javier-gomez'],
        profilePictureUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
        genderCategory: 'masculino'
    },
    {
        id: 'student-2',
        name: 'Elena García',
        email: 'elena.garcia@ejemplo.com',
        password: 'password123',
        level: '3.0',
        credit: 75,
        loyaltyPoints: 40,
        pendingBonusPoints: 0,
        preferredGameType: 'clases',
        favoriteInstructorIds: ['instructor-sofia-martin', 'instructor-javier-gomez'],
        profilePictureUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
        genderCategory: 'femenino'
    },
    {
        id: 'student-3',
        name: 'David Martínez',
        email: 'david.martinez@ejemplo.com',
        password: 'password123',
        level: '4.0',
        credit: 200,
        loyaltyPoints: 250,
        pendingBonusPoints: 0,
        preferredGameType: 'ambas',
        favoriteInstructorIds: [],
        profilePictureUrl: 'https://randomuser.me/api/portraits/men/46.jpg',
        genderCategory: 'masculino'
    },
     {
        id: 'student-4',
        name: 'Laura Fernández',
        email: 'laura.fernandez@ejemplo.com',
        password: 'password123',
        level: '2.5',
        credit: 50,
        loyaltyPoints: 10,
        pendingBonusPoints: 0,
        preferredGameType: 'clases',
        favoriteInstructorIds: ['instructor-sofia-martin'],
        profilePictureUrl: 'https://randomuser.me/api/portraits/women/50.jpg',
        genderCategory: 'femenino'
    },
];

export const generateInitialInstructors = (): Instructor[] => [
    {
        id: 'instructor-javier-gomez',
        name: 'Javier Gómez',
        email: 'javier.gomez@ejemplo.com',
        level: '6.5',
        isBlocked: false,
        profilePictureUrl: `https://randomuser.me/api/portraits/men/68.jpg`,
        assignedClubId: 'club-padelestrella',
        assignedCourtNumber: 1,
        isAvailable: true,
        defaultRatePerHour: 28,
        unavailableHours: {
            monday: [{ start: '14:00', end: '16:00' }],
            saturday: [{ start: '08:00', end: '22:00' }],
            sunday: [{ start: '08:00', end: '22:00' }],
        },
        rateTiers: [
            { id: 'jg-finde', days: ['saturday', 'sunday'], startTime: '09:00', endTime: '22:00', rate: 65 }
        ],
        experience: ["Entrenador Nacional Nivel III", "Ex-jugador profesional WPT", "+10 años de experiencia"],
        languages: ["Español", "Inglés"],
    },
    {
        id: 'instructor-sofia-martin',
        name: 'Sofía Martín',
        email: 'sofia.martin@ejemplo.com',
        level: '5.5',
        isBlocked: false,
        profilePictureUrl: `https://randomuser.me/api/portraits/women/68.jpg`,
        assignedClubId: 'club-padelestrella',
        isAvailable: true,
        defaultRatePerHour: 28,
        unavailableHours: {
            tuesday: [{ start: '12:00', end: '15:00' }],
            thursday: [{ start: '12:00', end: '15:00' }],
        },
        rateTiers: [],
        experience: ["Monitora Nacional de Pádel", "Especialista en iniciación"],
        languages: ["Español", "Catalán"],
    },
];

const weekdays: DayOfWeek[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export const generateInitialClubs = (): Club[] => [
    {
        id: 'club-padelestrella',
        name: 'PadelEstrella',
        location: 'Madrid, España',
        logoUrl: 'https://padelclubmallorca.com/wp-content/uploads/2022/03/LOGO_PADEL_CLUB_MALLORCA_400_glow.png',
        showClassesTabOnFrontend: true,
        showMatchesTabOnFrontend: true,
        isMatchDayEnabled: true,
        adminEmail: 'admin@padelestrella.com',
        adminPassword: 'password123',
        pointSettings: {
            cancellationPointPerEuro: 1,
            inviteFriend: 10,
            firstToJoinClass: 1,
            firstToJoinMatch: 1,
            unconfirmedCancelPenaltyPoints: 1,
            pointsCostForCourt: 25,
            cancellationPenaltyTiers: [
                { hoursBefore: 2, penaltyPercentage: 50 },
                { hoursBefore: 1, penaltyPercentage: 100 }
            ],
            inscriptionBonusPoints: 0.5,
        },
        levelRanges: [
            { name: "Iniciación", min: '1.0', max: '2.0', color: 'hsl(142.1 76.2% 36.3%)' },
            { name: "Intermedio", min: '2.5', max: '4.0', color: 'hsl(210 100% 56%)' },
            { name: "Avanzado", min: '4.5', max: '7.0', color: 'hsl(346.8 77.2% 49.8%)' },
        ],
        courtRateTiers: [
            { id: 'all-day', name: 'Tarifa General', days: weekdays, startTime: '08:00', endTime: '23:00', rate: 32 }
        ],
        dynamicPricingEnabled: false,
        dynamicPricingTiers: [],
        unavailableMatchHours: {
            saturday: [{ start: '14:00', end: '16:00' }],
            sunday: [{ start: '14:00', end: '16:00' }]
        },
        pointBookingSlots: {
            saturday: [{ start: '10:00', end: '12:00' }],
            sunday: [{ start: '10:00', end: '12:00' }]
        },
        shopReservationFee: 1.5,
        cardShadowEffect: {
            enabled: true,
            color: '#a855f7',
            intensity: 0.7,
        }
    },
];

export const generateInitialPadelCourts = (): PadelCourt[] => [
    { id: 'court-1-club-1', clubId: 'club-padelestrella', courtNumber: 1, name: 'Pista Central', isActive: true },
    { id: 'court-2-club-1', clubId: 'club-padelestrella', courtNumber: 2, name: 'Pista 2', isActive: true },
    { id: 'court-3-club-1', clubId: 'club-padelestrella', courtNumber: 3, name: 'Pista 3 (Cristal)', isActive: true },
    { id: 'court-4-club-1', clubId: 'club-padelestrella', courtNumber: 4, name: 'Pista 4', isActive: true },
    { id: 'court-5-club-1', clubId: 'club-padelestrella', courtNumber: 5, name: 'Pista 5', isActive: true },
    { id: 'court-6-club-1', clubId: 'club-padelestrella', courtNumber: 6, name: 'Pista 6', isActive: true },
    { id: 'court-7-club-1', clubId: 'club-padelestrella', courtNumber: 7, name: 'Pista 7', isActive: true },
    { id: 'court-8-club-1', clubId: 'club-padelestrella', courtNumber: 8, name: 'Pista 8', isActive: true },
];

export const generateInitialShopProducts = (): Product[] => [
    {
        id: 'prod-bullpadel-vertex-04',
        clubId: 'club-padelestrella',
        name: 'Bullpadel Vertex 04 Hybrid',
        images: ['https://www.padelnuestro.com/images/products/bullpadel-vertex-04-hybrid-24-1-original.jpg'],
        officialPrice: 299.95,
        offerPrice: 189.95,
        status: 'in-stock',
        category: 'pala',
        aiHint: 'padel racket'
    },
    {
        id: 'prod-nox-at10-18k',
        clubId: 'club-padelestrella',
        name: 'Nox AT10 Genius 18K By Agustin Tapia',
        images: ['https://www.padelnuestro.com/images/products/nox-at10-genius-18k-by-agustin-tapia-24-1-original.jpg'],
        officialPrice: 310.00,
        offerPrice: 219.95,
        status: 'in-stock',
        category: 'pala',
        aiHint: 'padel racket'
    },
    {
        id: 'prod-head-motion-pro',
        clubId: 'club-padelestrella',
        name: 'Zapatillas Head Motion Pro Padel',
        images: ['https://cdn.grupoelcorteingles.es/SGFM/dctm/MEDIA03/202303/13/00118648301149____1__640x640.jpg'],
        officialPrice: 150.00,
        offerPrice: 119.99,
        status: 'in-stock',
        category: 'zapatilla',
        aiHint: 'padel shoes'
    },
];
