// lib/state.ts
import type { TimeSlot, Club, Instructor, PadelCourt, CourtGridBooking, PointTransaction, User, Match, MatchDayEvent, Product, Booking, MatchBooking, DealOfTheDaySettings, UserDB, MatchDayInscription, Review, Transaction } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { startOfDay, addHours, addMinutes, subDays } from 'date-fns';
import { isSlotEffectivelyCompleted as isSlotEffectivelyCompletedInternal } from './utils'; // Import the internal utility

// --- Internal State Variables (not exported directly) ---
let _mockStudents: User[] = [];
let _mockCurrentUser: User | null = null;
let _mockAdminUser: User = {} as User;
let _mockSuperAdminUser: User = {} as User;
let _mockInstructors: Instructor[] = [];
let _mockClubs: Club[] = [];
let _mockPadelCourts: PadelCourt[] = [];
let _mockUserBookings: Booking[] = [];
let _mockUserMatchBookings: MatchBooking[] = [];
let _mockTimeSlots: TimeSlot[] = [];
let _mockMatches: Match[] = [];
let _mockUserDatabase: UserDB[] = [];
let _mockReviews: Review[] = [];
let _mockTransactions: Transaction[] = [];
let _mockPointTransactions: PointTransaction[] = [];
let _mockMatchDayEvents: MatchDayEvent[] = [];
let _mockMatchDayInscriptions: MatchDayInscription[] = [];
let _mockMatchDayCancelledInscriptions: MatchDayInscription[] = []; // New state
let _mockShopProducts: Product[] = [];


let _hasNewGratisSpotNotification = false;
let _hasNewSpecialOfferNotification = true; // New state for shop offer notification
let _chargedUsersForThisConfirmation = new Set<string>();
let _semiFullMatchCount = 0;

// --- Getters ---
export const getMockStudents = (): User[] => [..._mockStudents];
export const getMockCurrentUser = (): User | null => _mockCurrentUser;
export const getMockAdminUser = (): User => ({ ..._mockAdminUser });
export const getMockSuperAdminUser = (): User => ({ ..._mockSuperAdminUser });
export const getMockInstructors = (): Instructor[] => [..._mockInstructors];
export const getMockClubs = (): Club[] => [..._mockClubs];
export const getMockPadelCourts = (): PadelCourt[] => [..._mockPadelCourts];
export const getMockUserBookings = (): Booking[] => _mockUserBookings.map(b => ({...b}));
export const getMockUserMatchBookings = (): MatchBooking[] => _mockUserMatchBookings.map(b => ({...b}));
export const getMockTimeSlots = (): TimeSlot[] => _mockTimeSlots.map(ts => ({...ts}));
export const getMockMatches = (): Match[] => _mockMatches.map(m => ({...m}));
export const getMockUserDatabase = (): UserDB[] => [..._mockUserDatabase];
export const getMockReviews = (): Review[] => [..._mockReviews];
export const getMockTransactions = (): typeof _mockTransactions => [..._mockTransactions];
export const getMockPointTransactions = (): PointTransaction[] => [..._mockPointTransactions];
export const getMockMatchDayEvents = (): MatchDayEvent[] => _mockMatchDayEvents.map(e => ({...e}));
export const getMockMatchDayInscriptions = (): MatchDayInscription[] => _mockMatchDayInscriptions.map(i => ({...i}));
export const getMockMatchDayCancelledInscriptions = (): MatchDayInscription[] => _mockMatchDayCancelledInscriptions.map(i => ({...i})); // New getter
export const getMockShopProducts = (): Product[] => [..._mockShopProducts];


export const getHasNewGratisSpotNotification = (): boolean => _hasNewGratisSpotNotification;
export const getHasNewSpecialOfferNotification = (): boolean => _hasNewSpecialOfferNotification; // New getter
export const getChargedUsersForThisConfirmation = (): Set<string> => new Set(_chargedUsersForThisConfirmation);
export const getSemiFullMatchCount = (): number => _semiFullMatchCount;

// --- Setters / Initializers (to be called by mockData.ts or specific modules) ---
export const initializeMockStudents = (data: User[]): void => { _mockStudents = [...data]; };
export const initializeMockCurrentUser = (data: User | null): void => { _mockCurrentUser = data ? { ...data } : null; };
export const initializeMockAdminUser = (data: User): void => { _mockAdminUser = { ...data }; };
export const initializeMockSuperAdminUser = (data: User): void => { _mockSuperAdminUser = { ...data }; };
export const initializeMockInstructors = (data: Instructor[]): void => { _mockInstructors = [...data]; };
export const initializeMockClubs = (data: Club[]): void => { _mockClubs = [...data]; };
export const initializeMockPadelCourts = (data: PadelCourt[]): void => { _mockPadelCourts = [...data]; };
export const initializeMockUserBookings = (data: Booking[]): void => { _mockUserBookings = data.map(b => ({...b})); };
export const initializeMockUserMatchBookings = (data: MatchBooking[]): void => { _mockUserMatchBookings = data.map(b => ({...b})); };
export const initializeMockTimeSlots = (data: TimeSlot[]): void => { _mockTimeSlots = data.map(ts => ({...ts})); };
export const initializeMockMatches = (data: Match[]): void => { _mockMatches = data.map(m => ({...m})); };
export const initializeMockUserDatabase = (data: UserDB[]): void => { _mockUserDatabase = [...data]; };
export const initializeMockReviews = (data: Review[]): void => { _mockReviews = [...data]; };
export const initializeMockPointTransactions = (data: PointTransaction[]): void => { _mockPointTransactions = [...data]; };
export const initializeMockMatchDayEvents = (data: MatchDayEvent[]): void => { _mockMatchDayEvents = data.map(e => ({...e})); };
export const initializeMockMatchDayInscriptions = (data: MatchDayInscription[]): void => { _mockMatchDayInscriptions = data.map(i => ({...i})); };
export const initializeMockMatchDayCancelledInscriptions = (data: MatchDayInscription[]): void => { _mockMatchDayCancelledInscriptions = data.map(i => ({...i})); }; // New setter
export const initializeMockShopProducts = (data: Product[]): void => { _mockShopProducts = data.map(p => ({...p})); };


export const setHasNewGratisSpotNotificationState = (value: boolean): void => { _hasNewGratisSpotNotification = value; };
export const setHasNewSpecialOfferNotificationState = (value: boolean): void => { _hasNewSpecialOfferNotification = value; }; // New setter
export const addChargedUserForConfirmation = (key: string): void => { _chargedUsersForThisConfirmation.add(key); };
export const clearChargedUsersForConfirmation = (): void => { _chargedUsersForThisConfirmation.clear(); };
export const resetSemiFullMatchCountState = (): void => { _semiFullMatchCount = 0; };
export const incrementSemiFullMatchCountState = (): void => { _semiFullMatchCount++; };

// --- Modifiers (examples, more can be added as needed by other modules) ---
export const addStudentToState = (student: User): void => {
  const index = _mockStudents.findIndex(s => s.id === student.id);
  if (index !== -1) {
    _mockStudents[index] = { ...student };
  } else {
    _mockStudents.push({ ...student });
  }
};

export const addInstructorToState = (instructor: Instructor): void => {
  const index = _mockInstructors.findIndex(i => i.id === instructor.id);
  if (index !== -1) {
    _mockInstructors[index] = { ...instructor };
  } else {
    _mockInstructors.push({ ...instructor });
  }
};

export const updateClubInState = (club: Club): void => {
  const index = _mockClubs.findIndex(c => c.id === club.id);
  if (index !== -1) {
    _mockClubs[index] = { ...club };
  } else {
    _mockClubs.push({ ...club });
  }
};

export const addClubToState = (club: Club): void => {
  _mockClubs.push({ ...club });
};

export const removeClubFromState = (clubId: string): void => {
  _mockClubs = _mockClubs.filter(c => c.id !== clubId);
  _mockPadelCourts = _mockPadelCourts.filter(pc => pc.clubId !== clubId);
  _mockTimeSlots = _mockTimeSlots.filter(ts => ts.clubId !== clubId);
  _mockMatches = _mockMatches.filter(m => m.clubId !== clubId);
};


export const addUserToUserDatabaseState = (userDb: UserDB): void => {
    const index = _mockUserDatabase.findIndex(u => u.id === userDb.id);
    if (index !== -1) {
        _mockUserDatabase[index] = { ...userDb };
    } else {
        _mockUserDatabase.push({ ...userDb });
    }
};

export const updateUserInUserDatabaseState = (userId: string, updates: Partial<UserDB>): void => {
    const index = _mockUserDatabase.findIndex(u => u.id === userId);
    if (index !== -1) {
        _mockUserDatabase[index] = { ..._mockUserDatabase[index], ...updates };
    }
};

export const removeUserFromUserDatabaseState = (userId: string): void => {
    _mockUserDatabase = _mockUserDatabase.filter(u => u.id !== userId);
};


export const addPadelCourtToState = (court: PadelCourt): void => {
    _mockPadelCourts.push({ ...court });
};

export const updatePadelCourtInState = (courtId: string, updates: Partial<PadelCourt>): PadelCourt | null => {
    const index = _mockPadelCourts.findIndex(c => c.id === courtId);
    if (index !== -1) {
        _mockPadelCourts[index] = { ..._mockPadelCourts[index], ...updates };
        return { ..._mockPadelCourts[index] };
    }
    return null;
};

export const removePadelCourtFromState = (courtId: string): boolean => {
    const initialLength = _mockPadelCourts.length;
    _mockPadelCourts = _mockPadelCourts.filter(c => c.id !== courtId);
    return _mockPadelCourts.length < initialLength;
};


export const addTimeSlotToState = (slot: TimeSlot): void => {
    _mockTimeSlots.push({ ...slot });
    _mockTimeSlots.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
};

export const updateTimeSlotInState = (slotId: string, updatedSlotData: TimeSlot): void => {
    const index = _mockTimeSlots.findIndex(s => s.id === slotId);
    if (index !== -1) {
        _mockTimeSlots[index] = { ...updatedSlotData };
    }
};

export const removeTimeSlotFromState = (slotId: string): boolean => {
    const initialLength = _mockTimeSlots.length;
    _mockTimeSlots = _mockTimeSlots.filter(slot => slot.id !== slotId);
    return _mockTimeSlots.length < initialLength;
};

export const removeTimeSlotsFromStateByInstructor = (instructorName: string): void => {
    _mockTimeSlots = _mockTimeSlots.filter(slot => slot.instructorName !== instructorName);
};

export const removeBookingFromTimeSlotInState = (slotId: string, userId: string, groupSize: 1 | 2 | 3 | 4): TimeSlot | null => {
    const slotIndex = _mockTimeSlots.findIndex(s => s.id === slotId);
    if (slotIndex !== -1) {
        const slot = { ..._mockTimeSlots[slotIndex] };
        slot.bookedPlayers = (slot.bookedPlayers || []).filter(p => !(p.userId === userId && p.groupSize === groupSize));

        if (slot.status === 'confirmed' && !isSlotEffectivelyCompletedInternal(slot).completed) {
            slot.status = 'pre_registration';
        }

        const bookingThatWasRemoved = getMockUserBookings().find(b => b.activityId === slotId && b.userId === userId && b.groupSize === groupSize);
        if (bookingThatWasRemoved?.bookedWithPoints &&
            bookingThatWasRemoved.spotIndex !== undefined &&
            slot.designatedGratisSpotPlaceholderIndexForOption &&
            slot.designatedGratisSpotPlaceholderIndexForOption[groupSize] === bookingThatWasRemoved.spotIndex) {

            slot.designatedGratisSpotPlaceholderIndexForOption[groupSize] = null;
        }

        _mockTimeSlots[slotIndex] = slot;
        return slot;
    }
    return null;
};


export const addMatchToState = (match: Match): void => {
    _mockMatches.push({ ...match });
    _mockMatches.sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
};

export const updateMatchInState = (matchId: string, updatedMatchData: Match): void => {
    const index = _mockMatches.findIndex(m => m.id === matchId);
    if (index !== -1) {
        _mockMatches[index] = { ...updatedMatchData };
    }
};

export const removeMatchFromState = (matchId: string): boolean => {
    const initialLength = _mockMatches.length;
    _mockMatches = _mockMatches.filter(m => m.id !== matchId);
    return _mockMatches.length < initialLength;
};

export const removePlayerFromMatchInState = (matchId: string, userId: string): Match | null => {
    const matchIndex = _mockMatches.findIndex(m => m.id === matchId);
    if (matchIndex !== -1) {
        const match = { ..._mockMatches[matchIndex] };
        match.bookedPlayers = (match.bookedPlayers || []).filter(p => p.userId !== userId);
        
        if (match.status === 'confirmed' && match.bookedPlayers.length < 4) {
            match.status = 'forming';
        }

        _mockMatches[matchIndex] = match;
        return match;
    }
    return null;
};


export const addUserBookingToState = (booking: Booking): void => {
    _mockUserBookings = _mockUserBookings.filter(b => !(b.userId === booking.userId && b.activityId === booking.activityId && b.groupSize === booking.groupSize && b.spotIndex === booking.spotIndex));
    _mockUserBookings.push({ ...booking });
};

export const updateUserBookingInState = (bookingId: string, updatedBookingData: Partial<Booking>): void => {
    const index = _mockUserBookings.findIndex(b => b.id === bookingId);
    if (index !== -1) {
        _mockUserBookings[index] = { ..._mockUserBookings[index], ...updatedBookingData };
    }
};

export const removeUserBookingFromState = (bookingId: string): void => {
    _mockUserBookings = _mockUserBookings.filter(b => b.id !== bookingId);
};

export const removeUserBookingsBySlotIdFromState = (slotId: string): void => {
    _mockUserBookings = _mockUserBookings.filter(b => b.activityId !== slotId);
};


export const addUserMatchBookingToState = (booking: MatchBooking): void => {
    _mockUserMatchBookings.push({ ...booking });
};

export const updateUserMatchBookingInState = (bookingId: string, updatedBookingData: Partial<MatchBooking>): void => {
    const index = _mockUserMatchBookings.findIndex(b => b.id === bookingId);
    if (index !== -1) {
        _mockUserMatchBookings[index] = { ..._mockUserMatchBookings[index], ...updatedBookingData };
    }
};

export const removeUserMatchBookingFromState = (bookingId: string): void => {
    _mockUserMatchBookings = _mockUserMatchBookings.filter(b => b.id !== bookingId);
};

export const removeUserMatchBookingFromStateByMatch = (matchId: string): void => {
    _mockUserMatchBookings = _mockUserMatchBookings.filter(b => b.activityId !== matchId);
};

export const removeUserMatchBookingFromStateByMatchAndUser = (matchId: string, userId: string): void => {
    _mockUserMatchBookings = _mockUserMatchBookings.filter(b => !(b.activityId === matchId && b.userId === userId));
};


export const addReviewToState = (review: Review): void => {
    _mockReviews.push({ ...review });
};

export const addTransactionToState = (transaction: typeof _mockTransactions[0]): void => {
    _mockTransactions.unshift({ ...transaction });
    _mockTransactions = _mockTransactions.slice(0, 200);
    _mockTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const addPointTransactionToState = (transaction: PointTransaction): void => {
    _mockPointTransactions.unshift({ ...transaction });
    _mockPointTransactions = _mockPointTransactions.slice(0, 200);
    _mockPointTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const addProductToState = (product: Product): void => {
    _mockShopProducts.push({ ...product });
};

export const updateProductInState = (productId: string, updates: Partial<Product>): Product | null => {
    const index = _mockShopProducts.findIndex(p => p.id === productId);
    if (index !== -1) {
        _mockShopProducts[index] = { ..._mockShopProducts[index], ...updates };
        return { ..._mockShopProducts[index] };
    }
    return null;
};

export const removeProductFromState = (productId: string): boolean => {
    const initialLength = _mockShopProducts.length;
    _mockShopProducts = _mockShopProducts.filter(p => p.id !== productId);
    return _mockShopProducts.length < initialLength;
};
    
export const setGlobalCurrentUser = (user: User | null): void => {
    _mockCurrentUser = user ? { ...user } : null;

    if (user) {
        const userDbIndex = _mockUserDatabase.findIndex(u => u.id === user.id);
        if (userDbIndex !== -1) {
            _mockUserDatabase[userDbIndex] = { 
                ..._mockUserDatabase[userDbIndex],
                name: user.name,
                email: user.email!,
                level: user.level,
                credit: user.credit,
                blockedCredit: user.blockedCredit,
                loyaltyPoints: user.loyaltyPoints,
                pendingBonusPoints: user.pendingBonusPoints,
                preferredGameType: user.preferredGameType,
                favoriteInstructorIds: user.favoriteInstructorIds,
                profilePictureUrl: user.profilePictureUrl,
                genderCategory: user.genderCategory,
                assignedClubId: (user as Instructor).assignedClubId,
                assignedCourtNumber: (user as Instructor).assignedCourtNumber,
                isAvailable: (user as Instructor).isAvailable,
                unavailableHours: (user as Instructor).unavailableHours, 
            };
        }
        
        const studentIndex = _mockStudents.findIndex(s => s.id === user.id);
        if (studentIndex !== -1) {
             _mockStudents[studentIndex] = { ..._mockStudents[studentIndex], ...user };
        }
    }
};

export const updateMatchDayEventInState = (eventId: string, updatedEventData: MatchDayEvent): void => {
    const index = _mockMatchDayEvents.findIndex(e => e.id === eventId);
    if (index !== -1) {
        _mockMatchDayEvents[index] = { ...updatedEventData };
    }
};

// New function to add a cancelled inscription
export const addCancelledInscription = (inscription: MatchDayInscription): void => {
    _mockMatchDayCancelledInscriptions.push({ ...inscription });
};
