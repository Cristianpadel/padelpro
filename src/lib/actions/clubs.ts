"use client";

import type { Club, ClubFormData, PadelCourt, TimeSlot, Match, CourtGridBooking, PadelCourtStatus, ClubLevelRange, DayOfWeek, TimeRange, Product, MatchDayEvent, DynamicPricingTier, InstructorRateTier, Instructor } from '@/types';
import * as state from '../state';
import * as config from '../config';
import { startOfDay, isSameDay, areIntervalsOverlapping, getDay, parse, differenceInHours, addMinutes, format } from 'date-fns';
import { daysOfWeek as dayOfWeekArray } from '@/types'; // Import daysOfWeek array

// --- NEW CENTRALIZED PRICE CALCULATION FUNCTION ---
// This function now SOLELY calculates the price of THE COURT for a given time.
export const calculateActivityPrice = (club: Club, startTime: Date): number => {
    const defaultPrice = 0; // Default fallback price is now 0
    if (!club) return defaultPrice;

    const dayOfWeek = dayOfWeekArray[getDay(startTime)];
    const timeStr = format(startTime, 'HH:mm');
    
    // **PRIORITY**: Check for dynamic pricing first if it's enabled.
    if (club.dynamicPricingEnabled && club.dynamicPricingTiers) {
        const matchingTier = club.dynamicPricingTiers.find(tier =>
            tier.days.includes(dayOfWeek) &&
            timeStr >= tier.startTime &&
            timeStr < tier.endTime // The end time is exclusive.
        );
        if (matchingTier) {
            return matchingTier.startPrice;
        }
    }
    
    // **FALLBACK**: If dynamic pricing is disabled or no dynamic tier matches, check fixed rates.
    if (club.courtRateTiers) {
        const matchingTier = club.courtRateTiers.find(tier =>
            tier.days.includes(dayOfWeek) &&
            timeStr >= tier.startTime &&
            timeStr < tier.endTime // Corrected to be exclusive for consistency
        );
        if (matchingTier) {
            return matchingTier.rate;
        }
    }

    // **ULTIMATE FALLBACK**: If no tier matches at all.
    return defaultPrice;
};

// ** NEW: Centralized function to get an INSTRUCTOR's rate for a given time **
export const getInstructorRate = (instructor: Instructor, startTime: Date): number => {
    if (!instructor) return 0; // Fallback to 0 if no instructor

    const dayOfWeek = dayOfWeekArray[getDay(startTime)];
    const timeStr = format(startTime, 'HH:mm');

    // Check special rate tiers first
    if (instructor.rateTiers) {
        const matchingTier = instructor.rateTiers.find(tier =>
            tier.days.includes(dayOfWeek) &&
            timeStr >= tier.startTime &&
            timeStr < tier.endTime
        );
        if (matchingTier) {
            return matchingTier.rate;
        }
    }

    // Fallback to default rate, which can be 0 or undefined.
    return instructor.defaultRatePerHour || 0;
}


export const fetchClubs = async (): Promise<Club[]> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    return JSON.parse(JSON.stringify(state.getMockClubs()));
};

export const addClub = async (clubData: Omit<Club, 'id' | 'adminPassword' | 'adminEmail' | 'levelRanges' | 'unavailableMatchHours'>): Promise<Club | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    if (state.getMockClubs().find(club => club.name.toLowerCase() === clubData.name.toLowerCase())) {
        return { error: 'Ya existe un club con este nombre.' };
    }
    const newId = `club-${clubData.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString().slice(-4)}`;
    const newClub: Club = {
        id: newId,
        name: clubData.name,
        location: clubData.location,
        logoUrl: clubData.logoUrl || `https://picsum.photos/seed/${newId}/64/48`,
        showClassesTabOnFrontend: clubData.showClassesTabOnFrontend ?? true,
        showMatchesTabOnFrontend: clubData.showMatchesTabOnFrontend ?? true,
        isMatchDayEnabled: true,
        adminEmail: `admin@${clubData.name.toLowerCase().replace(/\s+/g, '')}.com`,
        adminPassword: "password123",
        pointSettings: { ...(config.defaultPointSettings || {}), ...(clubData.pointSettings || {}) },
        levelRanges: [],
        unavailableMatchHours: {},
        courtRateTiers: [],
        dynamicPricingEnabled: false,
        dynamicPricingTiers: [],
    };
    state.addClubToState(newClub);
    return { ...newClub };
};

export const registerNewClub = async (
    clubData: Omit<ClubFormData, 'adminPassword'>,
    adminPasswordInput: string
): Promise<Club | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    if (state.getMockClubs().some(club => club.adminEmail?.toLowerCase() === clubData.adminEmail?.toLowerCase())) {
        return { error: 'Este correo electrónico de administrador ya está en uso por otro club.' };
    }
    if (state.getMockClubs().some(club => club.name.toLowerCase() === clubData.name.toLowerCase())) {
        return { error: 'Ya existe un club con este nombre.' };
    }
    const newId = `club-${clubData.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString().slice(-4)}`;
    const newClub: Club = {
        id: newId,
        name: clubData.name,
        location: clubData.location,
        logoUrl: clubData.logoUrl || `https://picsum.photos/seed/${newId}/64/48`,
        showClassesTabOnFrontend: clubData.showClassesTabOnFrontend ?? true,
        showMatchesTabOnFrontend: clubData.showMatchesTabOnFrontend ?? true,
        adminEmail: clubData.adminEmail,
        adminPassword: adminPasswordInput,
        pointSettings: { ...(config.defaultPointSettings || {}) },
        levelRanges: [],
        unavailableMatchHours: clubData.unavailableMatchHours || {},
    };
    state.addClubToState(newClub);
    return { ...newClub };
};

export const updateClub = async (clubId: string, updatedData: Partial<Omit<Club, 'id'>>): Promise<Club | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const clubIndex = state.getMockClubs().findIndex(club => club.id === clubId);
    if (clubIndex === -1) return { error: 'Club no encontrado.' };

    if (updatedData.name && state.getMockClubs().find(club => club.id !== clubId && club.name.toLowerCase() === updatedData.name!.toLowerCase())) {
        return { error: 'Ya existe otro club con este nombre.' };
    }

    let clubToUpdate = { ...state.getMockClubs()[clubIndex] };

    if (updatedData.pointSettings) {
        clubToUpdate.pointSettings = { ...(clubToUpdate.pointSettings || (config.defaultPointSettings || {})), ...updatedData.pointSettings };
    }

    if (updatedData.levelRanges !== undefined) {
        if (Array.isArray(updatedData.levelRanges) && updatedData.levelRanges.every(range => typeof range.min === 'string' && typeof range.max === 'string')) {
            clubToUpdate.levelRanges = updatedData.levelRanges;
        } else if (updatedData.levelRanges === null) {
             clubToUpdate.levelRanges = [];
        } else {
            console.warn("Invalid levelRanges format provided in updateClub:", updatedData.levelRanges);
        }
    }
    

    const oldUnavailableMatchHours = clubToUpdate.unavailableMatchHours;
    if (updatedData.unavailableMatchHours !== undefined) {
        clubToUpdate.unavailableMatchHours = updatedData.unavailableMatchHours;
    }

    // Handle new pricing models
    if (updatedData.dynamicPricingEnabled !== undefined) {
      clubToUpdate.dynamicPricingEnabled = updatedData.dynamicPricingEnabled;
    }
     if (updatedData.dynamicPricingTiers !== undefined) {
      clubToUpdate.dynamicPricingTiers = updatedData.dynamicPricingTiers;
    }
    if (updatedData.courtRateTiers !== undefined) {
      clubToUpdate.courtRateTiers = updatedData.courtRateTiers;
    }


    const { pointSettings, levelRanges, unavailableMatchHours, dynamicPricingEnabled, dynamicPricingTiers, courtRateTiers, ...otherUpdates } = updatedData;
    clubToUpdate = { ...clubToUpdate, ...otherUpdates };

    if (otherUpdates.hasOwnProperty('logoUrl') && otherUpdates.logoUrl === '') {
        clubToUpdate.logoUrl = undefined;
    }
    
    state.updateClubInState(clubToUpdate);

    // After updating the club, check and remove conflicting placeholder matches
    if (updatedData.unavailableMatchHours && JSON.stringify(updatedData.unavailableMatchHours) !== JSON.stringify(oldUnavailableMatchHours)) {
        const currentMatches = state.getMockMatches();
        const matchesToKeep: Match[] = [];
        let cancelledPlaceholderCount = 0;

        currentMatches.forEach(match => {
            if (match.clubId === clubId && match.isPlaceholder === true && match.status === 'forming') {
                const matchStartTime = new Date(match.startTime);
                const matchEndTime = new Date(match.endTime);
                const dayOfWeek = dayOfWeekArray[getDay(matchStartTime)];
                const clubUnavailableRanges = clubToUpdate.unavailableMatchHours?.[dayOfWeek] || [];
                let isConflicting = false;

                for (const unavailableRange of clubUnavailableRanges) {
                    const unavailableStart = parse(unavailableRange.start, 'HH:mm', matchStartTime);
                    const unavailableEnd = parse(unavailableRange.end, 'HH:mm', matchStartTime);
                    if (areIntervalsOverlapping(
                        { start: matchStartTime, end: matchEndTime },
                        { start: unavailableStart, end: unavailableEnd },
                        { inclusive: false }
                    )) {
                        isConflicting = true;
                        break;
                    }
                }
                if (isConflicting) {
                    state.removeUserMatchBookingFromStateByMatch(match.id);
                    cancelledPlaceholderCount++;
                } else {
                    matchesToKeep.push(match);
                }
            } else {
                matchesToKeep.push(match);
            }
        });
        state.initializeMockMatches(matchesToKeep);
        if (cancelledPlaceholderCount > 0) {
            console.log(`[MockData] Club ${clubId} updated unavailableMatchHours. ${cancelledPlaceholderCount} placeholder match cards auto-cancelled.`);
        }
    }

    return { ...clubToUpdate };
};

export const deleteClub = async (clubId: string): Promise<{ success: true } | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const initialLength = state.getMockClubs().length;
    state.removeClubFromState(clubId);
    if (state.getMockClubs().length === initialLength) return { error: "Club no encontrado o no se pudo eliminar." };
    return { success: true };
};

export const updateClubAdminPassword = async (clubId: string, currentPasswordInForm: string, newPasswordInForm: string): Promise<{ success: true } | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const clubs = state.getMockClubs();
    const clubIndex = clubs.findIndex(c => c.id === clubId);
    if (clubIndex === -1) return { error: 'Club no encontrado.' };

    const clubToUpdate = clubs[clubIndex];
    if (clubToUpdate.adminPassword !== currentPasswordInForm) throw new Error('La contraseña actual es incorrecta.');
    if (!newPasswordInForm || newPasswordInForm.length < 6) throw new Error('La nueva contraseña debe tener al menos 6 caracteres.');

    state.updateClubInState({ ...clubToUpdate, adminPassword: newPasswordInForm });
    return { success: true };
};

export const fetchAdminClubDetails = async (clubId: string): Promise<Club | null> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const club = state.getMockClubs().find(c => c.id === clubId);
    return club ? { ...club } : null;
};

export const fetchPadelCourtsByClub = async (clubId: string): Promise<PadelCourt[]> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    return JSON.parse(JSON.stringify(state.getMockPadelCourts().filter(court => court.clubId === clubId)));
};

export const addPadelCourt = async (courtData: Omit<PadelCourt, 'id' | 'isActive'>): Promise<PadelCourt | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    if (state.getMockPadelCourts().find(c => c.clubId === courtData.clubId && c.courtNumber === courtData.courtNumber)) {
        return { error: `La Pista número ${courtData.courtNumber} ya existe en este club.` };
    }
    const newCourt: PadelCourt = { id: `court-${courtData.clubId}-${courtData.courtNumber}-${Date.now().toString().slice(-4)}`, ...courtData, isActive: true };
    state.addPadelCourtToState(newCourt);
    return { ...newCourt };
};

export const updatePadelCourt = async (courtId: string, updates: Partial<PadelCourt>): Promise<PadelCourt | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));

    const courts = state.getMockPadelCourts();
    const courtIndex = courts.findIndex(c => c.id === courtId);
    if (courtIndex === -1) return { error: 'Pista no encontrada.' };

    const currentCourt = courts[courtIndex];
    if (updates.courtNumber !== undefined && updates.courtNumber !== currentCourt.courtNumber) {
        if (courts.find(otherCourt => otherCourt.id !== courtId && otherCourt.clubId === currentCourt.clubId && otherCourt.courtNumber === updates.courtNumber)) {
            return { error: `La Pista número ${updates.courtNumber} ya existe en este club.` };
        }
    }
    const updatedCourt = { ...currentCourt, ...updates };
    state.updatePadelCourtInState(courtId, updatedCourt);
    return { ...updatedCourt };
};

export const deletePadelCourt = async (courtId: string): Promise<{ success: true } | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const success = state.removePadelCourtFromState(courtId);
    if (!success) return { error: "Pista no encontrada." };
    return { success: true };
};

export const fetchCourtBookingsForDay = async (clubId: string, date: Date): Promise<CourtGridBooking[]> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const bookingsForDay: CourtGridBooking[] = [];
    const dayStart = startOfDay(date);

    state.getMockTimeSlots()
        .filter(slot => {
            const court = state.getMockPadelCourts().find(c => c.courtNumber === slot.courtNumber && c.clubId === clubId);
            return court && court.isActive && slot.clubId === clubId && isSameDay(new Date(slot.startTime), dayStart);
        })
        .map(slot => ({
            id: slot.id,
            clubId: slot.clubId,
            courtNumber: slot.courtNumber!,
            startTime: new Date(slot.startTime),
            endTime: new Date(slot.endTime),
            type: 'clase' as 'clase',
            title: `Clase (${slot.instructorName.split(' ')[0]})(${new Set(slot.bookedPlayers.map(p => p.userId)).size}/${slot.maxPlayers})`,
            status: slot.status === 'confirmed' || slot.status === 'confirmed_private' ? 'reservada' : 'proceso_inscripcion' as PadelCourtStatus,
            activityStatus: slot.status,
            participants: new Set(slot.bookedPlayers.map(p => p.userId)).size,
            maxParticipants: slot.maxPlayers,
        }))
        .forEach(booking => bookingsForDay.push(booking));

    state.getMockMatches()
        .filter(match => {
            if (match.clubId !== clubId || !isSameDay(new Date(match.startTime), dayStart)) return false;
            if ((match.status === 'confirmed' || match.status === 'confirmed_private') && match.courtNumber !== undefined) {
                const court = state.getMockPadelCourts().find(c => c.courtNumber === match.courtNumber && c.clubId === clubId);
                return court && court.isActive;
            }
            if (match.isProvisional && match.courtNumber !== undefined) {
                const court = state.getMockPadelCourts().find(c => c.courtNumber === match.courtNumber && c.clubId === clubId);
                return court && court.isActive;
            }
            if (match.status === 'forming' && match.courtNumber !== undefined) {
                 const court = state.getMockPadelCourts().find(c => c.courtNumber === match.courtNumber && c.clubId === clubId);
                return court && court.isActive;
            }
            return false;
        })
        .map(match => {
            if (match.isProvisional) {
                const provisionalUser = state.getMockStudents().find(s => s.id === match.provisionalForUserId);
                return {
                    id: match.id,
                    clubId: match.clubId,
                    courtNumber: match.courtNumber!,
                    startTime: new Date(match.startTime),
                    endTime: new Date(match.endTime),
                    type: 'bloqueo_provisional' as any,
                    title: `Bloqueo para ${provisionalUser?.name || 'Usuario'}`,
                    status: 'bloqueo_provisional' as const,
                    provisionalForUserName: provisionalUser?.name,
                    provisionalExpiresAt: match.provisionalExpiresAt
                };
            }
            return ({
                id: match.id,
                clubId: match.clubId,
                courtNumber: match.courtNumber!,
                startTime: new Date(match.startTime),
                endTime: new Date(match.endTime),
                type: 'partida' as 'partida',
                title: `Partida (${(match.bookedPlayers || []).length}/4)`,
                status: ((match.bookedPlayers || []).length >= 4 && match.status === 'confirmed') || match.status === 'confirmed_private' ? 'reservada' : 'proceso_inscripcion' as PadelCourtStatus,
                activityStatus: match.status,
                participants: (match.bookedPlayers || []).length,
                maxParticipants: 4,
            })
        }).forEach(booking => bookingsForDay.push(booking as CourtGridBooking));
    
    // Add MatchDay events to the grid bookings
    state.getMockMatchDayEvents()
        .filter(event => event.clubId === clubId && isSameDay(new Date(event.eventDate), dayStart))
        .forEach(event => {
            event.courtIds.forEach(courtId => {
                const court = state.getMockPadelCourts().find(c => c.id === courtId);
                if (court && court.isActive) {
                    bookingsForDay.push({
                        id: `mde-grid-${event.id}-${court.id}`,
                        clubId: event.clubId,
                        courtNumber: court.courtNumber,
                        startTime: new Date(event.eventDate),
                        endTime: new Date(event.eventEndTime || addMinutes(new Date(event.eventDate), 180)),
                        type: 'reserva_manual', // Treat as a manual block for grid display purposes
                        title: event.name,
                        status: 'reservada',
                        activityStatus: 'confirmed',
                    });
                }
            });
        });


    const uniqueBookings = Array.from(new Map(bookingsForDay.map(item => [item.id, item])).values());
    return uniqueBookings.sort((a, b) => a.startTime.getTime() - b.startTime.getTime() || a.courtNumber - b.courtNumber);
};


export const addManualCourtBooking = async (
    clubId: string,
    bookingData: Omit<CourtGridBooking, 'id' | 'status'>
): Promise<CourtGridBooking | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const courtFromDb = state.getMockPadelCourts().find(c => c.courtNumber === bookingData.courtNumber && c.clubId === clubId);
    if (!courtFromDb || !courtFromDb.isActive) return { error: "Pista no encontrada o no está activa." };

    const existingBookingsForCourtAndDay = (await fetchCourtBookingsForDay(clubId, bookingData.startTime))
        .filter(b => b.courtNumber === bookingData.courtNumber);

    const newBookingInterval = { start: new Date(bookingData.startTime), end: new Date(bookingData.endTime) };
    if (existingBookingsForCourtAndDay.some(existing => areIntervalsOverlapping(
        newBookingInterval,
        { start: new Date(existing.startTime), end: new Date(existing.endTime) },
        { inclusive: false }
    ))) {
        return { error: `La Pista ${bookingData.courtNumber} ya está reservada o tiene un conflicto de horario.` };
    }

    const newBooking: CourtGridBooking = {
        ...bookingData,
        clubId: clubId,
        startTime: new Date(bookingData.startTime),
        endTime: new Date(bookingData.endTime),
        id: `manual-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        status: bookingData.type === 'mantenimiento' ? 'desactivada' : 'reservada',
    };

    if (newBooking.type === 'clase') {
        const slotEquivalent: TimeSlot = {
            id: newBooking.id,
            clubId: clubId,
            startTime: newBooking.startTime,
            endTime: newBooking.endTime,
            instructorName: 'Admin',
            maxPlayers: newBooking.maxParticipants || 4,
            bookedPlayers: [],
            totalPrice: 0,
            level: 'abierto',
            courtNumber: newBooking.courtNumber,
            category: 'abierta',
            designatedGratisSpotPlaceholderIndexForOption: {},
            status: 'confirmed', // Manual bookings are confirmed by default
            durationMinutes: differenceInMinutes(newBooking.endTime, newBooking.startTime),
        };
        state.addTimeSlotToState(slotEquivalent);
    } else if (newBooking.type === 'partida') {
        const matchEquivalent: Match = {
            id: newBooking.id,
            clubId: clubId,
            startTime: newBooking.startTime,
            endTime: newBooking.endTime,
            courtNumber: newBooking.courtNumber,
            level: 'abierto',
            category: 'abierta',
            bookedPlayers: [],
            totalCourtFee: 20,
            gratisSpotAvailable: false,
            isPlaceholder: false,
            status: 'confirmed',
            durationMinutes: differenceInMinutes(newBooking.endTime, newBooking.startTime),
        };
        state.addMatchToState(matchEquivalent);
    }
    return newBooking;
};


// --- Product Functions ---

export const updateDealOfTheDay = (clubId: string): Club | null => {
    const clubIndex = state.getMockClubs().findIndex(c => c.id === clubId);
    if (clubIndex === -1) return null;

    let club = state.getMockClubs()[clubIndex];
    const dealSettings = club.dealOfTheDay;

    if (!dealSettings || !dealSettings.enabled || dealSettings.productIds.length === 0) {
        if (dealSettings && dealSettings.currentDealProductId) {
             club.dealOfTheDay!.currentDealProductId = undefined;
             club.dealOfTheDay!.currentDealSetAt = undefined;
             state.updateClubInState(club);
        }
        return club;
    }

    const now = new Date();
    const lastSet = dealSettings.currentDealSetAt ? new Date(dealSettings.currentDealSetAt) : null;
    const hoursSinceLastSet = lastSet ? differenceInHours(now, lastSet) : 25;

    if (hoursSinceLastSet >= 24) {
        const eligibleProductIds = dealSettings.productIds;
        const currentDealIndex = dealSettings.currentDealProductId ? eligibleProductIds.indexOf(dealSettings.currentDealProductId) : -1;
        const nextDealIndex = (currentDealIndex + 1) % eligibleProductIds.length;
        const nextDealProductId = eligibleProductIds[nextDealIndex];

        club.dealOfTheDay!.currentDealProductId = nextDealProductId;
        club.dealOfTheDay!.currentDealSetAt = now.toISOString();
        state.updateClubInState(club);
    }

    return club;
};


export const fetchProductsByClub = async (clubId: string): Promise<Product[]> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    
    // Rotate the deal of the day if necessary
    const clubWithPotentiallyUpdatedDeal = updateDealOfTheDay(clubId);
    
    const clubProducts = state.getMockShopProducts().filter(product => product.clubId === clubId);
    
    // Apply the deal of the day discount
    if (clubWithPotentiallyUpdatedDeal?.dealOfTheDay?.enabled && clubWithPotentiallyUpdatedDeal.dealOfTheDay.currentDealProductId) {
        const dealProductId = clubWithPotentiallyUpdatedDeal.dealOfTheDay.currentDealProductId;
        const discountPercentage = clubWithPotentiallyUpdatedDeal.dealOfTheDay.discountPercentage;
        const discount = discountPercentage / 100;

        return clubProducts.map(p => {
            if (p.id === dealProductId) {
                return {
                    ...p,
                    offerPrice: p.officialPrice * (1 - discount),
                    isDealOfTheDay: true,
                    discountPercentage: discountPercentage,
                };
            }
            return { ...p, isDealOfTheDay: false, discountPercentage: undefined };
        });
    }

    return clubProducts.map(p => ({ ...p, isDealOfTheDay: false, discountPercentage: undefined }));
};


export const addProduct = async (productData: Omit<Product, 'id'>): Promise<Product | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const newProduct: Product = {
        id: `prod-${productData.clubId}-${Date.now().toString().slice(-6)}`,
        ...productData,
    };
    state.addProductToState(newProduct);
    return { ...newProduct };
};

export const updateProduct = async (productId: string, updates: Partial<Omit<Product, 'id' | 'clubId'>>): Promise<Product | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const updatedProduct = state.updateProductInState(productId, updates);
    if (!updatedProduct) return { error: 'Producto no encontrado.' };
    return { ...updatedProduct };
};

export const deleteProduct = async (productId: string): Promise<{ success: true } | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const success = state.removeProductFromState(productId);
    if (!success) return { error: "Producto no encontrado." };
    // Also remove from deal of the day list if present
    state.getMockClubs().forEach(club => {
        if (club.dealOfTheDay?.productIds.includes(productId)) {
            const updatedSettings = {
                ...club.dealOfTheDay,
                productIds: club.dealOfTheDay.productIds.filter(id => id !== productId)
            };
            if(updatedSettings.currentDealProductId === productId){
                updatedSettings.currentDealProductId = undefined;
            }
            updateClub(club.id, { dealOfTheDay: updatedSettings });
        }
    });

    return { success: true };
};

export const countSpecialOfferItems = async (clubId?: string | null): Promise<number> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    let productsToCheck = state.getMockShopProducts();
    if (clubId) {
        productsToCheck = productsToCheck.filter(p => p.clubId === clubId);
    }
    // The special offer is hardcoded for this product ID for now, as requested.
    const specialOfferCount = productsToCheck.filter(p => p.id === 'prod-estrella-pala-1').length;
    return specialOfferCount;
};

export const countUserReservedProducts = async (userId: string): Promise<number> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const transactions = state.getMockPointTransactions();
    // In a real app, this would be a database query on a 'reservations' table.
    // Here, we simulate it by looking at the transaction log.
    return transactions.filter(t => t.userId === userId && t.type === 'compra_tienda' && t.points < 0).length;
};
