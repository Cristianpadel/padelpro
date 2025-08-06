// lib/state.ts
import type { TimeSlot, Club, Instructor, PadelCourt, CourtGridBooking, PointTransaction, User, Match, MatchDayEvent, Product, Booking, MatchBooking, DealOfTheDaySettings, UserDB, MatchDayInscription } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { startOfDay, addHours, addMinutes, subDays } from 'date-fns';

export let clubs: Club[] = [];

export let instructors: (Instructor & User)[] = [];

export let padelCourts: PadelCourt[] = [];

let timeSlots: TimeSlot[] = [];
let matches: Match[] = [];
let courtBookings: CourtGridBooking[] = [];
let pointTransactions: PointTransaction[] = [];
let students: User[] = [];
let matchDayEvents: MatchDayEvent[] = [];
let matchDayInscriptions: MatchDayInscription[] = [];
let matchDayCancelledInscriptions: MatchDayInscription[] = [];
let products: Product[] = [];
let globalCurrentUser: User | null = null;
let hasNewGratisSpot = false;
let userBookings: Booking[] = [];
let userMatchBookings: MatchBooking[] = [];
let userReservedProducts: { userId: string, productId: string }[] = [];
let userDb: UserDB[] = [];


// Getters for mock data
export const getMockClubs = () => clubs;
export const getMockInstructors = () => instructors;
export const getMockPadelCourts = () => padelCourts;
export const getMockTimeSlots = () => timeSlots;
export const getMockMatches = () => matches;
export const getMockCourtBookings = () => courtBookings;
export const getMockPointTransactions = () => pointTransactions;
export const getMockStudents = () => students;
export const getMockUserDatabase = () => userDb;
export const getMockMatchDayEvents = () => matchDayEvents;
export const getMockMatchDayInscriptions = () => matchDayInscriptions;
export const getMockMatchDayCancelledInscriptions = () => matchDayCancelledInscriptions;
export const getMockProducts = () => products;
export const getMockCurrentUser = () => globalCurrentUser;
export const getHasNewGratisSpotNotification = () => hasNewGratisSpot;
export const getMockUserBookings = () => userBookings;
export const getMockUserMatchBookings = () => userMatchBookings;
export const getMockUserReservedProducts = () => userReservedProducts;
export const getMockShopProducts = () => products;


// Setters / Updaters for mock data
export const initializeMockStudents = (data: User[]) => { students = data; };
export const initializeMockInstructors = (data: (Instructor & User)[]) => { instructors = data; };
export const initializeMockClubs = (data: Club[]) => { clubs = data; };
export const initializeMockPadelCourts = (data: PadelCourt[]) => { padelCourts = data; };
export const initializeMockShopProducts = (data: Product[]) => { products = data; };
export const initializeMockUserDatabase = (data: UserDB[]) => { userDb = data; };
export const initializeMockTimeSlots = (data: TimeSlot[]) => { timeSlots = data; };
export const initializeMockMatches = (data: Match[]) => { matches = data; };
export const initializeMockUserBookings = (data: Booking[]) => { userBookings = data; };
export const initializeMockUserMatchBookings = (data: MatchBooking[]) => { userMatchBookings = data; };
export const initializeMockPointTransactions = (data: PointTransaction[]) => { pointTransactions = data; };
export const initializeMockMatchDayEvents = (data: MatchDayEvent[]) => { matchDayEvents = data; };
export const initializeMockMatchDayInscriptions = (data: MatchDayInscription[]) => { matchDayInscriptions = data; };
export const initializeMockMatchDayCancelledInscriptions = (data: MatchDayInscription[]) => { matchDayCancelledInscriptions = data; };
export const initializeMockCurrentUser = (user: User | null) => { globalCurrentUser = user; };


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
export const addClubToState = (club: Club) => { clubs.push(club); };
export const updateClubInState = (updatedClub: Club) => {
    const index = clubs.findIndex(c => c.id === updatedClub.id);
    if (index !== -1) {
        clubs[index] = updatedClub;
    }
};
export const updateMatchDayEventInState = (eventId: string, updatedEvent: MatchDayEvent) => {
    const index = matchDayEvents.findIndex(e => e.id === eventId);
    if (index !== -1) {
        matchDayEvents[index] = updatedEvent;
    }
};
export const removeClubFromState = (clubId: string) => {
    clubs = clubs.filter(c => c.id !== clubId);
};
export const addPadelCourtToState = (court: PadelCourt) => { padelCourts.push(court); };
export const updatePadelCourtInState = (courtId: string, updatedCourt: PadelCourt) => {
    const index = padelCourts.findIndex(c => c.id === courtId);
    if (index !== -1) {
        padelCourts[index] = updatedCourt;
    }
};
export const removePadelCourtFromState = (courtId: string): boolean => {
    const initialLength = padelCourts.length;
    padelCourts = padelCourts.filter(c => c.id !== courtId);
    return padelCourts.length < initialLength;
};
export const addMatchToState = (match: Match) => { matches.push(match); };
export const removeUserMatchBookingFromStateByMatch = (matchId: string) => {
    userMatchBookings = userMatchBookings.filter(b => b.activityId !== matchId);
};
export const addProductToState = (product: Product) => { products.push(product); };
export const updateProductInState = (productId: string, updates: Partial<Product>): Product | null => {
    const index = products.findIndex(p => p.id === productId);
    if (index !== -1) {
        products[index] = { ...products[index], ...updates };
        return products[index];
    }
    return null;
};
export const removeProductFromState = (productId: string): boolean => {
    const initialLength = products.length;
    products = products.filter(p => p.id !== productId);
    return products.length < initialLength;
};
