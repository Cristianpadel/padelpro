// lib/state.ts
import type { TimeSlot, Club, Instructor, PadelCourt, CourtGridBooking, PointTransaction, User, Match, MatchDayEvent, Product, Booking, MatchBooking } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { startOfDay, addHours, addMinutes, subDays } from 'date-fns';

export let clubs: Club[] = [
    { 
        id: 'club-1', 
        name: 'Padel Club Madrid Centro', 
        logoUrl: 'https://placehold.co/100x100.png',
        location: 'Calle Ficticia 123, Madrid',
        pointSettings: { 
            cancellationPointPerEuro: 1, 
            inviteFriend: 5, 
            firstToJoinClass: 2, 
            firstToJoinMatch: 2, 
            pointsCostForCourt: 20,
            unconfirmedCancelPenaltyPoints: 1,
            unconfirmedCancelPenaltyEuros: 1,
            cancellationPenaltyTiers: [
                { hoursBefore: 2, penaltyPercentage: 100 },
                { hoursBefore: 6, penaltyPercentage: 50 },
                { hoursBefore: 12, penaltyPercentage: 25 },
            ]
        },
        levelRanges: [
            { name: "Iniciación", min: '1.0', max: '2.0', color: 'hsl(210 100% 56%)' },
            { name: "Intermedio", min: '2.5', max: '3.5', color: 'hsl(142.1 76.2% 36.3%)' },
            { name: "Avanzado", min: '4.0', max: '5.5', color: 'hsl(24.6 95% 53.1%)' },
            { name: "Competición", min: '6.0', max: '7.0', color: 'hsl(346.8 77.2% 49.8%)' },
        ],
        unavailableMatchHours: {
            'Sábado': [{start: '14:00', end: '16:00'}],
            'Domingo': [{start: '14:00', end: '16:00'}],
        },
        pointBookingSlots: {
             'Sábado': [{start: '20:00', end: '22:00'}],
             'Domingo': [{start: '20:00', end: '22:00'}],
        },
        dynamicPricingEnabled: false,
        courtRateTiers: [
            { id: 'rate-1', name: 'Tarifa General', days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'], startTime: '09:00', endTime: '18:00', rate: 20 },
            { id: 'rate-2', name: 'Horas Punta (Tardes)', days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'], startTime: '18:00', endTime: '22:00', rate: 28 },
            { id: 'rate-3', name: 'Fin de Semana', days: ['Sábado', 'Domingo'], startTime: '09:00', endTime: '22:00', rate: 30 },
        ],
        shopReservationFee: 1.0,
        cardShadowEffect: {
            enabled: true,
            color: '#a855f7',
            intensity: 0.5,
        }
    },
    { id: 'club-2', name: 'Padel Club Pozuelo' },
];

export let instructors: (Instructor & User)[] = [
    { id: 'inst-1', name: 'Carlos López', isAvailable: true, assignedClubId: 'club-1', assignedCourtNumber: 1, email: 'carlos.lopez@example.com', profilePictureUrl: 'https://i.pravatar.cc/150?u=inst-1', defaultRatePerHour: 30, loyaltyPoints: 0, credit: 0 },
    { id: 'inst-2', name: 'Ana García', isAvailable: true, assignedClubId: 'club-1', email: 'ana.garcia@example.com', profilePictureUrl: 'https://i.pravatar.cc/150?u=inst-2', defaultRatePerHour: 35, loyaltyPoints: 0, credit: 0, unavailableHours: { 'Sábado': [{ start: '08:00', end: '14:00' }], 'Domingo': [{ start: '08:00', end: '14:00' }] } },
    { id: 'inst-3', name: 'Javier Fernández', isAvailable: false, assignedClubId: 'club-2', email: 'javier.fernandez@example.com', profilePictureUrl: 'https://i.pravatar.cc/150?u=inst-3', defaultRatePerHour: 28, loyaltyPoints: 0, credit: 0 },
];

export let padelCourts: PadelCourt[] = [
    { id: 'court-1-1', clubId: 'club-1', name: 'Pista Central', courtNumber: 1, isActive: true },
    { id: 'court-1-2', clubId: 'club-1', name: 'Pista 2', courtNumber: 2, isActive: true },
    { id: 'court-1-3', clubId: 'club-1', name: 'Pista 3', courtNumber: 3, isActive: true },
    { id: 'court-1-4', clubId: 'club-1', name: 'Pista 4', courtNumber: 4, isActive: true },
    { id: 'court-2-1', clubId: 'club-2', name: 'Pista VIP', courtNumber: 1, isActive: true },
    { id: 'court-2-2', clubId: 'club-2', name: 'Pista 3', courtNumber: 3, isActive: false },
];

let timeSlots: TimeSlot[] = [];
let matches: Match[] = [];
let courtBookings: CourtGridBooking[] = [];
let pointTransactions: PointTransaction[] = [
    { id: 'txn-1', clubId: 'club-1', userId: 'user-1', points: 5, type: 'invitar_amigo', description: "Invitación de amigo", date: new Date() },
    { id: 'txn-2', clubId: 'club-1', userId: 'user-2', points: -20, type: 'reserva_pista_puntos', description: "Reserva de pista", date: subDays(new Date(), 1) },
    { id: 'txn-3', clubId: 'club-1', userId: 'user-1', points: 2, type: 'primero_en_clase', description: "Primero en unirse a clase", date: subDays(new Date(), 2) },
];
let students: User[] = [
    { id: 'user-1', name: 'Alex García', loyaltyPoints: 1250, level: '3.5', credit: 100, blockedCredit: 0, profilePictureUrl: 'https://i.pravatar.cc/150?u=user-1', favoriteInstructorIds: ['inst-2'], email: 'alex.garcia@email.com', genderCategory: 'masculino', preferredGameType: 'clases' },
    { id: 'user-2', name: 'Beatriz Reyes', loyaltyPoints: 800, level: '4.0', credit: 50, blockedCredit: 0, profilePictureUrl: 'https://i.pravatar.cc/150?u=user-2', email: 'beatriz.reyes@email.com', genderCategory: 'femenino', preferredGameType: 'partidas' },
    { id: 'user-3', name: 'Carlos Sainz', loyaltyPoints: 2400, level: '5.0', credit: 200, blockedCredit: 0, profilePictureUrl: 'https://i.pravatar.cc/150?u=user-3', email: 'carlos.sainz@email.com', genderCategory: 'masculino' },
    { id: 'user-4', name: 'Daniela Vega', loyaltyPoints: 300, level: '2.5', credit: 20, blockedCredit: 0, profilePictureUrl: 'https://i.pravatar.cc/150?u=user-4', email: 'daniela.vega@email.com', genderCategory: 'femenino' },
    { id: 'user-5', name: 'Esteban Ocon', loyaltyPoints: 950, level: '4.5', credit: 75, blockedCredit: 0, profilePictureUrl: 'https://i.pravatar.cc/150?u=user-5', email: 'esteban.ocon@email.com', genderCategory: 'masculino' },
    { id: 'user-6', name: 'Fernanda Alonso', loyaltyPoints: 1100, level: '6.0', credit: 150, blockedCredit: 0, profilePictureUrl: 'https://i.pravatar.cc/150?u=user-6', email: 'fernanda.alonso@email.com', genderCategory: 'femenino' },
];
let matchDayEvents: MatchDayEvent[] = [];
let products: Product[] = [
    { id: 'prod-1', clubId: 'club-1', name: 'Bullpadel Vertex 04', category: 'pala', status: 'in-stock', officialPrice: 280, offerPrice: 250, images: ['https://placehold.co/600x400.png'], aiHint: 'padel racket', isDealOfTheDay: true },
    { id: 'prod-2', clubId: 'club-1', name: 'Head Pro S Balls (3-pack)', category: 'pelotas', status: 'in-stock', officialPrice: 6, offerPrice: 5, images: ['https://placehold.co/600x400.png'], aiHint: 'padel balls' },
];
let globalCurrentUser: User | null = null;
let hasNewGratisSpot = false;
let userBookings: Booking[] = [];
let userMatchBookings: MatchBooking[] = [];
let userReservedProducts: { userId: string, productId: string }[] = [];

// Getters for mock data
export const getMockClubs = () => clubs;
export const getMockInstructors = () => instructors;
export const getMockPadelCourts = () => padelCourts;
export const getMockTimeSlots = () => timeSlots;
export const getMockMatches = () => matches;
export const getMockCourtBookings = () => courtBookings;
export const getMockPointTransactions = () => pointTransactions;
export const getMockStudents = () => students;
export const getMockUserDatabase = () => [...students, ...instructors];
export const getMockMatchDayEvents = () => matchDayEvents;
export const getMockProducts = () => products;
export const getMockCurrentUser = () => globalCurrentUser || students.find(s => s.id === 'user-1');
export const getHasNewGratisSpotNotification = () => hasNewGratisSpot;
export const getMockUserBookings = () => userBookings;
export const getMockUserMatchBookings = () => userMatchBookings;
export const getMockUserReservedProducts = () => userReservedProducts;


// Setters / Updaters for mock data
export const setGlobalCurrentUser = (user: User | null) => { globalCurrentUser = user; };
export const setHasNewGratisSpotNotificationState = (state: boolean) => { hasNewGratisSpot = state; };
export const addTimeSlotToState = (slot: TimeSlot) => { timeSlots.push(slot); };
export const removeTimeSlotFromState = (slotId: string) => { timeSlots = timeSlots.filter(s => s.id !== slotId); };
export const updateTimeSlotInState = (slotId: string, updatedSlot: TimeSlot) => {
    const index = timeSlots.findIndex(s => s.id === slotId);
    if (index !== -1) {
        timeSlots[index] = updatedSlot;
    }
};
export const addUserBookingToState = (booking: Booking) => { userBookings.push(booking); };
export const removeUserBookingFromState = (bookingId: string) => { userBookings = userBookings.filter(b => b.id !== bookingId); };
export const removeUserBookingsBySlotIdFromState = (slotId: string) => { userBookings = userBookings.filter(b => b.activityId !== slotId); };
export const removeBookingFromTimeSlotInState = (slotId: string, userId: string, groupSize: 1 | 2 | 3 | 4) => {
    const slotIndex = timeSlots.findIndex(s => s.id === slotId);
    if (slotIndex > -1) {
        const playerIndex = timeSlots[slotIndex].bookedPlayers.findIndex(p => p.userId === userId && p.groupSize === groupSize);
        if (playerIndex > -1) {
            timeSlots[slotIndex].bookedPlayers.splice(playerIndex, 1);
        }
        return timeSlots[slotIndex];
    }
    return null;
}
export const addPointTransaction = (transaction: PointTransaction) => { pointTransactions.unshift(transaction); };