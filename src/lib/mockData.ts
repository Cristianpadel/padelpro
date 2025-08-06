// lib/mockData.ts
import type { TimeSlot, Club, Instructor, PadelCourt, CourtGridBooking, PointTransaction, User, Match, ClubLevelRange, MatchDayEvent, CourtRateTier, DynamicPricingTier, PenaltyTier, DayOfWeek, Product, CardShadowEffectSettings, UserActivityStatusForDay, Booking, MatchBooking, UserGenderCategory, MatchPadelLevel } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { startOfDay, addHours, addMinutes, subDays, getDay, isSameDay, differenceInDays, addDays, format, areIntervalsOverlapping, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { daysOfWeek as daysOfWeekArray } from '@/types';
import * as state from './state';
import * as mockUtils from './utils';
import { calculatePricePerPerson } from './utils';
import { addTimeSlot, bookClass, cancelBooking, cancelClassByInstructor, confirmClassAsPrivate, countAvailableGratisSpots, fetchUserBookings, joinPrivateClass, makeClassPublic } from './actions/classActions';
import { fetchClubs, addClub, registerNewClub, updateClub, deleteClub, updateClubAdminPassword, fetchAdminClubDetails, fetchPadelCourtsByClub, addPadelCourt, updatePadelCourt, deletePadelCourt, fetchCourtBookingsForDay, addManualCourtBooking, updateDealOfTheDay, fetchProductsByClub, addProduct, updateProduct, deleteProduct, countSpecialOfferItems, countUserReservedProducts } from './actions/clubs';
import { addCreditToStudent, addUserPointsAndAddTransaction, convertEurosToPoints, deductCredit, recalculateAndSetBlockedBalances } from './actions/users';
import { calculateActivityPrice, getInstructorRate } from './actions/clubs';

// --- Instructors ---
export const fetchInstructors = async (): Promise<Instructor[]> => {
    await new Promise(res => setTimeout(res, 300));
    return state.getMockInstructors();
}

export const updateInstructor = async (id: string, data: Partial<Instructor>): Promise<Instructor | {error: string}> => {
    await new Promise(res => setTimeout(res, 500));
    const instructors = state.getMockInstructors();
    const index = instructors.findIndex(i => i.id === id);
    if(index === -1) return {error: 'Instructor no encontrado'};
    instructors[index] = { ...instructors[index], ...data };
    return instructors[index];
}

export const deleteInstructor = async (id: string): Promise<{success: boolean} | {error: string}> => {
    await new Promise(res => setTimeout(res, 500));
    const instructors = state.getMockInstructors();
    const index = instructors.findIndex(i => i.id === id);
    if(index === -1) return {error: 'Instructor no encontrado'};
    instructors.splice(index, 1);
    return {success: true};
}


// --- Clubs ---
export const getMockClubs = (): Club[] => {
    return state.getMockClubs();
}


// --- Bookings & TimeSlots ---
export const isSlotEffectivelyCompleted = (slot: TimeSlot | Match): { completed: boolean, size: number | null } => {
    if (slot.status === 'confirmed' || slot.status === 'confirmed_private') {
        const bookedCount = slot.bookedPlayers?.length || 0;
        const maxPlayers = 'maxPlayers' in slot ? slot.maxPlayers : 4; // Default to 4 for matches
        if (slot.status === 'confirmed_private' || bookedCount === maxPlayers) {
            return { completed: true, size: bookedCount };
        }
    }
    
    // Check individual group sizes for classes
    if ('maxPlayers' in slot && slot.bookedPlayers) {
        const groups: Record<number, number> = {};
        slot.bookedPlayers.forEach(p => {
            groups[p.groupSize] = (groups[p.groupSize] || 0) + 1;
        });
        for(const sizeStr in groups) {
            const size = parseInt(sizeStr);
            if(groups[size] === size) {
                return { completed: true, size: size };
            }
        }
    }

    return { completed: false, size: null };
};


// --- Points & Students ---
export const fetchPointTransactions = async (clubId?: string, userId?: string): Promise<PointTransaction[]> => {
     await new Promise(res => setTimeout(res, 600));
    let results = state.getMockPointTransactions();
    if (clubId) {
        results = results.filter(t => t.clubId === clubId);
    }
    if (userId) {
        results = results.filter(t => t.userId === userId);
    }
    return results.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
export const getMockStudents = async (): Promise<User[]> => {
    await new Promise(res => setTimeout(res, 200));
    return state.getMockStudents();
}
export const fetchStudents = async (): Promise<User[]> => {
    await new Promise(res => setTimeout(res, 200));
    return state.getMockStudents();
};

export const simulateInviteFriend = async (userId: string, clubId: string): Promise<{ pointsAwarded: number } | { error: string }> => {
    const club = state.getMockClubs().find(c => c.id === clubId);
    if (!club) return { error: "Club no encontrado." };
    
    const pointsToAdd = club.pointSettings?.inviteFriend || 5;
    
    const userIndex = state.getMockStudents().findIndex(s => s.id === userId);
    if (userIndex === -1) return { error: "Usuario no encontrado." };

    state.getMockStudents()[userIndex].loyaltyPoints = (state.getMockStudents()[userIndex].loyaltyPoints || 0) + pointsToAdd;
    
    state.addPointTransaction({
        id: uuidv4(),
        clubId: clubId,
        userId: userId,
        points: pointsToAdd,
        type: 'invitar_amigo',
        description: "Invitación de amigo",
        date: new Date(),
    });

    return { pointsAwarded: pointsToAdd };
}


export const addInstructor = async (instructorData: Omit<Instructor, 'id' | 'isAvailable' | 'isBlocked' | 'assignedClubId' | 'assignedCourtNumber' | 'profilePictureUrl' | 'defaultRatePerHour' | 'rateTiers' | 'email' | 'unavailableHours'> & { email?: string }): Promise<Instructor | { error: string }> => {
  await new Promise(res => setTimeout(res, 500));
  const instructors = state.getMockInstructors();
  const existingInstructor = instructors.find(inst => inst.name.toLowerCase() === instructorData.name.toLowerCase());
  if (existingInstructor) {
    return { error: 'Ya existe un instructor con este nombre.' };
  }

  const newId = uuidv4();
  const newInstructor: Instructor = {
    id: newId,
    name: instructorData.name,
    email: instructorData.email,
    isAvailable: true, // Default value
    profilePictureUrl: `https://i.pravatar.cc/150?u=${newId}`,
    isBlocked: false,
    assignedClubId: 'all',
  };
  instructors.push(newInstructor);
  return newInstructor;
};

export const deleteMatch = async (matchId: string): Promise<{ message: string } | { error: string }> => {
    await new Promise(res => setTimeout(res, 500));
    const matches = state.getMockMatches();
    const index = matches.findIndex(m => m.id === matchId);
    if(index === -1) return { error: "Partida no encontrada." };
    matches.splice(index, 1);
    return { message: "La partida ha sido cancelada." };
};

export const removePlayerFromMatch = async (matchId: string, playerId: string): Promise<{ message: string } | { error: string }> => {
    await new Promise(res => setTimeout(res, 500));
    const matches = state.getMockMatches();
    const matchIndex = matches.findIndex(m => m.id === matchId);
    if(matchIndex === -1) return { error: "Partida no encontrada." };
    
    const playerIndex = matches[matchIndex].bookedPlayers.findIndex(p => p.userId === playerId);
    if(playerIndex === -1) return { error: "Jugador no encontrado en esta partida." };

    matches[matchIndex].bookedPlayers.splice(playerIndex, 1);
    
    // If removing a player makes it 'forming' again
    if (matches[matchIndex].bookedPlayers.length < 4) {
        matches[matchIndex].status = 'forming';
    }

    return { message: "Jugador eliminado de la partida." };
}

// --- Calendar Specific Data Fetchers ---
export const fetchTimeSlots = async (clubId?: string): Promise<TimeSlot[]> => {
    await new Promise(res => setTimeout(res, 250));
    if (clubId) {
      return state.getMockTimeSlots().filter(ts => ts.clubId === clubId);
    }
    return state.getMockTimeSlots();
};

export const fetchMatches = async (clubId: string): Promise<Match[]> => {
    await new Promise(res => setTimeout(res, 250));
    return state.getMockMatches().filter(m => m.clubId === clubId);
};

export const getMockMatches = async (): Promise<Match[]> => {
    return state.getMockMatches();
}


export const fetchMatchDayEventsForDate = async (date: Date, clubId?: string): Promise<MatchDayEvent[]> => {
    await new Promise(res => setTimeout(res, 250));
    return state.getMockMatchDayEvents().filter(e => (!clubId || e.clubId === clubId) && isSameDay(new Date(e.eventDate), date));
}

export const getMockInstructors = (): (Instructor & User)[] => {
    return state.getMockInstructors();
}

// --- Match-Day Specific Mock Functions ---

export const createMatchDayEvent = async (eventData: Omit<MatchDayEvent, 'id'>): Promise<MatchDayEvent | { error: string }> => {
  await new Promise(res => setTimeout(res, 500));
  // Check for conflicts? For now, we'll keep it simple.
  const newEvent: MatchDayEvent = {
    ...eventData,
    id: uuidv4(),
    inscriptions: [],
    matchesGenerated: false,
  };
  state.getMockMatchDayEvents().push(newEvent);
  return newEvent;
};

export const fetchActiveMatchDayEvents = async (clubId: string): Promise<MatchDayEvent[]> => {
    await new Promise(res => setTimeout(res, 300));
    const now = new Date();
    return state.getMockMatchDayEvents()
        .filter(e => e.clubId === clubId && new Date(e.eventDate) >= now)
        .sort((a,b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
}

export const getMatchDayInscriptions = async (eventId: string): Promise<string[]> => {
    await new Promise(res => setTimeout(res, 150));
    const event = state.getMockMatchDayEvents().find(e => e.id === eventId);
    return event?.inscriptions || [];
}

export const deleteMatchDayEvent = async (eventId: string): Promise<{success: true} | {error: string}> => {
    await new Promise(res => setTimeout(res, 400));
    const matchDayEvents = state.getMockMatchDayEvents();
    const index = matchDayEvents.findIndex(e => e.id === eventId);
    if(index === -1) return { error: "Evento no encontrado." };
    matchDayEvents.splice(index, 1);
    return { success: true };
}

export const manuallyTriggerMatchDayDraw = async (eventId: string): Promise<{ matchesCreated: number } | { error: string }> => {
    await new Promise(res => setTimeout(res, 1000));
    const matchDayEvents = state.getMockMatchDayEvents();
    const eventIndex = matchDayEvents.findIndex(e => e.id === eventId);
    if(eventIndex === -1) return { error: "Evento no encontrado." };
    
    const event = matchDayEvents[eventIndex];
    if(event.matchesGenerated) return { error: "El sorteo para este evento ya se ha realizado." };
    
    const inscriptions = event.inscriptions || [];
    if(inscriptions.length < 4) return { error: "No hay suficientes jugadores inscritos para el sorteo." };

    const matchesToCreate = Math.floor(inscriptions.length / 4);
    
    // This is a super simplified draw logic. A real one would be much more complex.
    console.log(`Generating ${matchesToCreate} matches for event ${eventId}`);
    matchDayEvents[eventIndex].matchesGenerated = true;

    return { matchesCreated: matchesToCreate };
}

// --- Simulation Functions ---
export const simulateBookings = async (options: {
    clubId: string,
    activityType: 'clases' | 'partidas',
    days: DayOfWeek[],
    timeRanges: ('morning' | 'midday' | 'evening')[],
    studentCount: number,
    density: number
}): Promise<{ message: string }> => {
    await new Promise(res => setTimeout(res, 1000));
    const { activityType, days, timeRanges, studentCount, density, clubId } = options;
    const allStudents = await getMockStudents();
    let inscriptionsMade = 0;

    const timeRangeMap = {
        morning: { start: 8, end: 13 },
        midday: { start: 13, end: 18 },
        evening: { start: 18, end: 22 },
    };

    const targetActivities = activityType === 'clases' ? state.getMockTimeSlots() : state.getMockMatches();

    for (const activity of targetActivities) {
        if (activity.clubId !== clubId) continue;
        if (activity.status !== 'forming') continue;

        const activityDate = new Date(activity.startTime);
        const activityDay = daysOfWeekArray[getDay(activityDate) === 0 ? 6 : getDay(activityDate) - 1];
        const activityHour = activityDate.getHours();

        const isInDay = days.includes(activityDay);
        const isInTimeRange = timeRanges.some(range => {
            const { start, end } = timeRangeMap[range];
            return activityHour >= start && activityHour < end;
        });
        
        const shouldProcess = Math.random() * 100 < density;

        if (isInDay && isInTimeRange && shouldProcess) {
            const availableSlots = ('maxPlayers' in activity ? activity.maxPlayers : 4) - activity.bookedPlayers.length;
            const playersToAddCount = Math.min(availableSlots, studentCount);

            if (playersToAddCount > 0) {
                const currentBookedIds = new Set(activity.bookedPlayers.map(p => p.userId));
                const availableStudents = allStudents.filter(s => !currentBookedIds.has(s.id));
                
                // Shuffle and pick students
                const shuffledStudents = availableStudents.sort(() => 0.5 - Math.random());
                const playersToAdd = shuffledStudents.slice(0, playersToAddCount);

                for (const player of playersToAdd) {
                    activity.bookedPlayers.push({ userId: player.id, name: player.name, isSimulated: true, groupSize: 4 });
                    inscriptionsMade++;
                }
            }
        }
    }

    return { message: `Simulación completada. Se realizaron ${inscriptionsMade} inscripciones.` };
};

export const clearSimulatedBookings = async (clubId: string): Promise<{ message: string }> => {
    await new Promise(res => setTimeout(res, 500));
    let playersRemoved = 0;

    const clearInArray = (arr: (TimeSlot | Match)[]) => {
        for (const activity of arr) {
            if (activity.clubId === clubId) {
                const originalCount = activity.bookedPlayers.length;
                activity.bookedPlayers = activity.bookedPlayers.filter(p => !p.isSimulated);
                playersRemoved += originalCount - activity.bookedPlayers.length;
            }
        }
    };

    clearInArray(state.getMockTimeSlots());
    clearInArray(state.getMockMatches());

    return { message: `Limpieza completada. Se eliminaron ${playersRemoved} inscripciones simuladas.` };
};

export const getMockUserMatchBookings = async (userId: string): Promise<MatchBooking[]> => {
    const userMatchBookingsData = state.getMockUserMatchBookings().filter(b => b.userId === userId);
    return userMatchBookingsData.map(booking => {
        const matchDetails = state.getMockMatches().find(m => m.id === booking.activityId);
        return { ...booking, matchDetails };
    });
};

export const countUserConfirmedMatchesForDay = (userId: string, date: Date): number => {
    const userMatches = state.getMockUserMatchBookings().filter(b => b.userId === userId);
    let count = 0;
    for (const booking of userMatches) {
        const match = state.getMockMatches().find(m => m.id === booking.activityId);
        if (match && isSameDay(new Date(match.startTime), date) && (match.bookedPlayers?.length || 0) === 4) {
            count++;
        }
    }
    return count;
};

export const countConfirmedLiberadasSpots = (clubId?: string): { classes: number; matches: number; total: number } => {
    let classesCount = 0;
    let matchesCount = 0;

    const now = new Date();
    
    // Count "liberadas" from classes
    state.getMockTimeSlots().forEach(slot => {
        if ((!clubId || slot.clubId === clubId) && new Date(slot.startTime) > now && mockUtils.isSlotGratisAndAvailable(slot)) {
            classesCount++;
        }
    });

    // In a real app, you would also count "liberadas" from matches if that's a feature.
    // For now, we'll assume it's only for classes.
    // matchesCount = ...

    return {
        classes: classesCount,
        matches: matchesCount,
        total: classesCount + matchesCount,
    };
};

export const getHasNewSpecialOfferNotification = async (): Promise<boolean> => {
    // In a real app, you'd check for new, unread offers for the user
    return state.getMockProducts().some(p => p.isDealOfTheDay);
};

export const hasAnyConfirmedActivityForDay = (userId: string, date: Date, excludingId?: string, type?: 'class' | 'match'): boolean => {
    return mockUtils.hasAnyConfirmedActivityForDay(userId, date, excludingId, type);
}

export const makeMatchPublic = async (organizerUserId: string, matchId: string): Promise<{ success: true, updatedMatch: Match } | { error: string }> => {
    const matches = state.getMockMatches();
    const matchIndex = matches.findIndex(m => m.id === matchId);
    if (matchIndex === -1) return { error: "Partida no encontrada." };
    if (matches[matchIndex].organizerId !== organizerUserId) return { error: "No tienes permiso para modificar esta partida." };
    matches[matchIndex].status = 'forming';
    matches[matchIndex].organizerId = undefined;
    matches[matchIndex].privateShareCode = undefined;
    return { success: true, updatedMatch: matches[matchIndex] };
};

export const bookMatch = async (userId: string, matchId: string, usePoints?: boolean): Promise<{ booking: MatchBooking, updatedMatch: Match } | { error: string }> => {
    const matches = state.getMockMatches();
    const matchIndex = matches.findIndex(m => m.id === matchId);
    if (matchIndex === -1) return { error: 'Partida no encontrada.' };
    const match = matches[matchIndex];
    if ((match.bookedPlayers || []).length >= 4) return { error: 'La partida ya está llena.' };
    
    const newBooking: MatchBooking = { id: uuidv4(), userId, activityId: matchId, activityType: 'match', bookedWithPoints: usePoints };
    match.bookedPlayers.push({ userId, name: state.getMockStudents().find(s => s.id === userId)?.name || 'Unknown' });
    state.getMockUserMatchBookings().push(newBooking);

    if (match.bookedPlayers.length === 4) {
        match.status = 'confirmed';
    }
    
    return { booking: newBooking, updatedMatch: match };
};

export const bookCourtForMatchWithPoints = async (userId: string, matchId: string): Promise<{ success: true, updatedMatch: Match } | { error: string }> => {
    return { error: 'Not implemented' };
}

export const confirmMatchAsPrivate = async (userId: string, matchId: string, isRecurring: boolean): Promise<{ shareLink: string } | { error: string }> => {
    const matchIndex = state.getMockMatches().findIndex(m => m.id === matchId);
    if (matchIndex === -1) return { error: 'Partida no encontrada.' };
    const match = state.getMockMatches()[matchIndex];
    match.status = 'confirmed_private';
    match.organizerId = userId;
    match.isRecurring = isRecurring;
    match.privateShareCode = `privmatch-${uuidv4().slice(0, 4)}`;
    match.bookedPlayers = [{ userId, name: state.getMockStudents().find(s => s.id === userId)?.name || 'Unknown' }];
    return { shareLink: `https://example.com/partidas/${matchId}?code=${match.privateShareCode}` };
};

export const joinPrivateMatch = async (userId: string, matchId: string, shareCode: string): Promise<{ organizerRefundAmount: number } | { error: string }> => {
    const match = state.getMockMatches().find(m => m.id === matchId);
    if (!match || match.status !== 'confirmed_private' || match.privateShareCode !== shareCode) return { error: 'Enlace de partida privada inválido.' };
    if ((match.bookedPlayers || []).length >= 4) return { error: 'Esta partida privada ya está llena.' };
    match.bookedPlayers.push({ userId, name: state.getMockStudents().find(s => s.id === userId)?.name || 'Unknown' });
    return { organizerRefundAmount: (match.totalCourtFee || 20) / 4 };
};

export const cancelMatchBooking = async (userId: string, bookingId: string): Promise<{ message: string, pointsAwarded?: number, penaltyApplied?: boolean } | { error: string }> => {
    return { message: "Cancelado" };
};

export const cancelPrivateMatchAndReofferWithPoints = async (userId: string, matchId: string): Promise<{ success: true } | { error: string }> => {
    return { error: "No implementado" };
};

export const renewRecurringMatch = async (userId: string, completedMatchId: string): Promise<{ newMatch: Match } | { error: string }> => {
    return { error: "No implementado" };
}

export const updateUserLevel = async (userId: string, level: MatchPadelLevel): Promise<User | {error: string}> => {
    const userIndex = state.getMockStudents().findIndex(u => u.id === userId);
    if (userIndex === -1) return { error: "Usuario no encontrado." };
    state.getMockStudents()[userIndex].level = level;
    return state.getMockStudents()[userIndex];
};

export const updateUserGenderCategory = async (userId: string, genderCategory: UserGenderCategory): Promise<User | {error: string}> => {
    const userIndex = state.getMockStudents().findIndex(u => u.id === userId);
    if (userIndex === -1) return { error: "Usuario no encontrado." };
    state.getMockStudents()[userIndex].genderCategory = genderCategory;
    return state.getMockStudents()[userIndex];
};

export const getMockTimeSlots = (): TimeSlot[] => {
    return state.getMockTimeSlots();
}

export const getMockUserBookings = async (userId: string): Promise<Booking[]> => {
    return state.getMockUserBookings().filter(b => b.userId === userId);
}

export const getUserActivityStatusForDay = async (userId: string, date: Date): Promise<UserActivityStatusForDay> => {
    const userBookings = await fetchUserBookings(userId);
    const userMatchBookings = await getMockUserMatchBookings(userId);
    const now = new Date();

    const hasConfirmedClass = userBookings.some(b => {
        const slot = state.getMockTimeSlots().find(s => s.id === b.activityId);
        return slot && new Date(slot.startTime) > now && isSameDay(new Date(slot.startTime), date) && isSlotEffectivelyCompleted(slot).completed;
    });

    const hasConfirmedMatch = userMatchBookings.some(b => {
        const match = state.getMockMatches().find(m => m.id === b.activityId);
        return match && new Date(match.startTime) > now && isSameDay(new Date(match.startTime), date) && (match.bookedPlayers?.length || 0) >= 4;
    });

    if (hasConfirmedClass || hasConfirmedMatch) {
        return { activityStatus: 'confirmed', hasEvent: false, anticipationPoints: 0 };
    }

    const hasInscription = userBookings.some(b => {
        const slot = state.getMockTimeSlots().find(s => s.id === b.activityId);
        return slot && new Date(slot.startTime) > now && isSameDay(new Date(slot.startTime), date);
    }) || userMatchBookings.some(b => {
        const match = state.getMockMatches().find(m => m.id === b.activityId);
        return match && new Date(match.startTime) > now && isSameDay(new Date(match.startTime), date);
    });

    if (hasInscription) {
        return { activityStatus: 'inscribed', hasEvent: false, anticipationPoints: 0 };
    }

    return { activityStatus: 'none', hasEvent: false, anticipationPoints: 0 };
};

// Also re-export functions from modules
export {
    addTimeSlot,
    bookClass,
    cancelBooking,
    cancelClassByInstructor,
    confirmClassAsPrivate,
    countAvailableGratisSpots,
    joinPrivateClass,
    makeClassPublic,
    addCreditToStudent,
    convertEurosToPoints,
    calculateActivityPrice,
    getInstructorRate
};

// Initial mock data
const today = startOfDay(new Date());
addTimeSlot({ clubId: 'club-1', startTime: addHours(today, 10), durationMinutes: 60, instructorId: 'inst-2', maxPlayers: 4, courtNumber: 1, level: 'abierto', category: 'abierta'});
const initialMatch = { id: uuidv4(), clubId: 'club-1', startTime: addHours(today, 11), endTime: addMinutes(addHours(today, 11), 90), totalCourtFee: 28, courtNumber: 2, level: '3.0', category: 'abierta', bookedPlayers: [{userId: 'user-1', name: 'Alex García', groupSize: 4}, {userId: 'user-2', name: 'Beatriz Reyes', groupSize: 4}], status: 'forming' as const, durationMinutes: 90 };
state.addMatchToState(initialMatch);

state.getMockCourtBookings().push(
    { id: 'booking-3', clubId: 'club-1', courtNumber: 1, startTime: addHours(today, 18), endTime: addHours(today, 19), title: "Bloqueo Pista", type: 'reserva_manual', status: 'reservada' },
);

// Add a confirmed class for testing
const confirmedSlot: TimeSlot = {
    id: uuidv4(),
    clubId: 'club-1',
    startTime: addHours(today, 15),
    endTime: addHours(today, 16),
    durationMinutes: 60,
    instructorId: 'inst-1',
    instructorName: 'Carlos López',
    maxPlayers: 2,
    courtNumber: 3,
    level: {min: '3.0', max: '4.0'},
    category: 'abierta',
    status: 'confirmed',
    bookedPlayers: [
        { userId: 'user-1', name: 'Alex García', groupSize: 2 },
        { userId: 'user-2', name: 'Beatriz Reyes', groupSize: 2 },
    ],
    totalPrice: 48,
};
state.addTimeSlotToState(confirmedSlot);

const preinscribedSlot: TimeSlot = {
    id: uuidv4(),
    clubId: 'club-1',
    startTime: addHours(today, 17),
    endTime: addHours(today, 18),
    durationMinutes: 60,
    instructorId: 'inst-2',
    instructorName: 'Ana García',
    maxPlayers: 4,
    courtNumber: 4,
    level: 'abierto',
    category: 'abierta',
    status: 'pre_registration',
    bookedPlayers: [],
    promotionEndTime: addDays(new Date(), 1),
    totalPrice: 40
};
state.addTimeSlotToState(preinscribedSlot);