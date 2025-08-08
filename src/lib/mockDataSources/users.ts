// src/lib/mockDataSources/users.ts
"use client";

import type { User, Booking, PointTransactionType, TimeSlot, Match, Product, Instructor, UserDB, MatchPadelLevel, UserGenderCategory, DayOfWeek, TimeRange, InstructorRateTier, MatchBooking, Review, Transaction, MatchDayEvent } from '@/types';
import * as state from './index'; 
import * as config from '../config';
import { areIntervalsOverlapping, parse, getDay, format, differenceInDays, startOfDay } from 'date-fns';
import { calculatePricePerPerson } from '@/lib/utils';
import { cancelBooking } from './classActions';


export const addUserPointsAndAddTransaction = async (
    userId: string,
    points: number,
    type: PointTransactionType,
    description: string,
    relatedEntityId?: string,
    clubId?: string
): Promise<void> => {
    const user = state.getMockUserDatabase().find(u => u.id === userId);
    if (user) {
        const newPoints = (user.loyaltyPoints || 0) + points;
        state.updateUserInUserDatabaseState(userId, { loyaltyPoints: newPoints });
        
        const currentUser = state.getMockCurrentUser();
        if (currentUser?.id === userId) {
            state.initializeMockCurrentUser({ ...currentUser, loyaltyPoints: newPoints });
        }

        state.addPointTransactionToState({
            id: `ptxn-${Date.now()}-${userId.slice(-4)}`,
            userId,
            clubId,
            date: new Date(),
            type,
            points,
            description,
            relatedEntityId,
        });
    }
};

export const deductCredit = (userId: string, amount: number, activity: TimeSlot | Match | MatchDayEvent, type: 'Clase' | 'Partida' | 'Evento Match-Day'): void => {
    const key = `${userId}-${activity.id}`;
    if (state.getChargedUsersForThisConfirmation().has(key)) return;

    const user = state.getMockUserDatabase().find(u => u.id === userId);
    if (!user) return;

    const newCredit = (user.credit ?? 0) - amount;
    state.updateUserInUserDatabaseState(userId, { credit: newCredit });

    const currentUser = state.getMockCurrentUser();
    if (currentUser?.id === userId) {
        state.initializeMockCurrentUser({ ...currentUser, credit: newCredit });
    }
    
    const activityDate = 'eventDate' in activity ? activity.eventDate : activity.startTime;

    state.addTransactionToState({
        id: `txn-deduct-${Date.now()}-${userId.slice(-4)}`,
        userId,
        date: new Date(),
        type: `Reserva ${type}`,
        amount: -amount,
        description: `${type} con ${'instructorName' in activity ? activity.instructorName : 'varios'} el ${format(new Date(activityDate), "dd/MM")}`,
    });
    
    state.addChargedUserForConfirmation(key);
};

export const addCreditToStudent = async (userId: string, amount: number, description?: string): Promise<{ newBalance: number } | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const userIndex = state.getMockUserDatabase().findIndex(u => u.id === userId);
    if (userIndex === -1) return { error: 'Usuario no encontrado.' };

    const user = { ...state.getMockUserDatabase()[userIndex] };
    const newBalance = (user.credit || 0) + amount;
    state.updateUserInUserDatabaseState(userId, { credit: newBalance });

    if (state.getMockCurrentUser()?.id === userId) {
        const currentUser = state.getMockCurrentUser();
        if (currentUser) {
            state.initializeMockCurrentUser({ ...currentUser, credit: newBalance });
        }
    }
    
    state.addTransactionToState({
        id: `txn-add-${Date.now()}-${userId.slice(-4)}`,
        userId: userId,
        date: new Date(),
        type: 'Recarga',
        amount: amount,
        description: description || 'Recarga de saldo',
    });
    
    return { newBalance };
};

export const recalculateAndSetBlockedBalances = async (userId: string) => {
    await new Promise(resolve => setTimeout(resolve, 5)); // Simulate async operation
    const user = state.getMockUserDatabase().find(u => u.id === userId);
    if (!user) return;

    let totalBlockedCredit = 0;
    let totalBlockedPoints = 0;
    let maxPendingBonusPoints = 0;

    const classBookings = state.getMockUserBookings().filter(b => b.userId === userId);
    const matchBookings = state.getMockUserMatchBookings().filter(b => b.userId === userId);
    const clubSettings = state.getMockClubs()[0]?.pointSettings; // Assuming single club for now for simplicity

    // Blocked credit and pending points from class bookings
    classBookings.forEach(booking => {
        const slot = state.getMockTimeSlots().find(s => s.id === booking.activityId);
        if (slot && (slot.status === 'pre_registration' || (booking.isOrganizerBooking && slot.status === 'confirmed_private'))) {
             if (booking.bookedWithPoints) {
                totalBlockedPoints += calculatePricePerPerson(slot.totalPrice, 1);
            } else if (booking.isOrganizerBooking) {
                 const pointsBaseValues: { [key in 1 | 2 | 3 | 4]: number[] } = { 1: [10], 2: [8, 7], 3: [5, 4, 3], 4: [3, 2, 1, 0] };
                 const basePoints = (pointsBaseValues[booking.groupSize] || [])[booking.spotIndex] ?? 0;
                 const daysInAdvance = differenceInDays(startOfDay(new Date(slot.startTime)), startOfDay(new Date()));
                 const anticipationPoints = Math.max(0, daysInAdvance);
                 const potentialBonus = basePoints + anticipationPoints;
                  if (potentialBonus > maxPendingBonusPoints) {
                    maxPendingBonusPoints = potentialBonus;
                }
            } else { // Regular pre-inscription
                totalBlockedCredit += calculatePricePerPerson(slot.totalPrice, booking.groupSize);
                 const pointsBaseValues: { [key in 1 | 2 | 3 | 4]: number[] } = { 1: [10], 2: [8, 7], 3: [5, 4, 3], 4: [3, 2, 1, 0] };
                 const basePoints = (pointsBaseValues[booking.groupSize] || [])[booking.spotIndex] ?? 0;
                 const daysInAdvance = differenceInDays(startOfDay(new Date(slot.startTime)), startOfDay(new Date()));
                 const anticipationPoints = Math.max(0, daysInAdvance);
                 const potentialBonus = basePoints + anticipationPoints;
                  if (potentialBonus > maxPendingBonusPoints) {
                    maxPendingBonusPoints = potentialBonus;
                }
            }
        }
    });

    // Blocked credit and pending points from match bookings
    matchBookings.forEach(booking => {
        const match = state.getMockMatches().find(m => m.id === booking.activityId);
        if (match && match.status === 'forming') {
            if (booking.bookedWithPoints) {
                totalBlockedPoints += calculatePricePerPerson(match.totalCourtFee, 4);
            } else {
                totalBlockedCredit += calculatePricePerPerson(match.totalCourtFee, 4);

                // Calculate potential bonus points for matches
                const firstToJoinBonus = clubSettings?.firstToJoinMatch || 0;
                if (match.bookedPlayers.length === 1 && match.bookedPlayers[0].userId === userId) {
                     if (firstToJoinBonus > maxPendingBonusPoints) {
                        maxPendingBonusPoints = firstToJoinBonus;
                    }
                }
            }
        }
    });
        
     // Blocked credit from Match-Day inscriptions
    state.getMockMatchDayInscriptions()
        .filter(i => i.userId === userId)
        .forEach(inscription => {
            const event = state.getMockMatchDayEvents().find(e => e.id === inscription.eventId);
            if(event && !event.matchesGenerated) {
                totalBlockedCredit += inscription.amountBlocked || 0;
            }
        });


    state.updateUserInUserDatabaseState(userId, { 
        blockedCredit: totalBlockedCredit, 
        blockedLoyaltyPoints: totalBlockedPoints,
        pendingBonusPoints: maxPendingBonusPoints,
    });
    
    if (state.getMockCurrentUser()?.id === userId) {
        const currentUser = state.getMockCurrentUser();
        if (currentUser) {
            state.initializeMockCurrentUser({ ...currentUser, blockedCredit: totalBlockedCredit, blockedLoyaltyPoints: totalBlockedPoints, pendingBonusPoints: maxPendingBonusPoints });
        }
    }
};


export const confirmAndAwardPendingPoints = async (userId: string, clubId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 5));
    const user = state.getMockUserDatabase().find(u => u.id === userId);
    if (!user || !user.pendingBonusPoints || user.pendingBonusPoints <= 0) {
        return;
    }

    const pointsToAward = user.pendingBonusPoints;
    await addUserPointsAndAddTransaction(
        userId,
        pointsToAward,
        'bonificacion_preinscripcion',
        'Bonificación por pre-inscripción en actividad confirmada',
        undefined,
        clubId
    );

    // Reset pending points
    state.updateUserInUserDatabaseState(userId, { pendingBonusPoints: 0 });
    const currentUser = state.getMockCurrentUser();
    if (currentUser?.id === userId) {
       state.initializeMockCurrentUser({ ...currentUser, pendingBonusPoints: 0 });
    }
};

export const convertEurosToPoints = async (userId: string, euros: number, pointsPerEuro: number): Promise<{ newCreditBalance: number, newLoyaltyPoints: number } | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const user = state.getMockUserDatabase().find(u => u.id === userId);
    if (!user) return { error: "Usuario no encontrado." };
    
    const availableCredit = (user.credit ?? 0) - (user.blockedCredit ?? 0);
    if (availableCredit < euros) return { error: "Saldo disponible insuficiente." };
    
    const pointsToAdd = euros * pointsPerEuro;
    const newCredit = (user.credit ?? 0) - euros;
    const newPoints = (user.loyaltyPoints ?? 0) + pointsToAdd;

    state.updateUserInUserDatabaseState(userId, { credit: newCredit, loyaltyPoints: newPoints });

    const currentUser = state.getMockCurrentUser();
    if (currentUser?.id === userId) {
        state.initializeMockCurrentUser({ ...currentUser, credit: newCredit, loyaltyPoints: newPoints });
    }

    state.addTransactionToState({
        id: `txn-convert-${Date.now()}`,
        userId,
        date: new Date(),
        type: 'Recarga', // Treat as a negative recharge
        amount: -euros,
        description: `Conversión de ${euros}€ a ${pointsToAdd} puntos`,
    });
    
    await addUserPointsAndAddTransaction(userId, pointsToAdd, 'conversion_saldo', `Conversión de ${euros}€ a puntos`);
    
    return { newCreditBalance: newCredit, newLoyaltyPoints: newPoints };
};

export const addUserToDB = async (userData: Partial<Omit<UserDB, 'id' | 'createdAt' | 'hashedPassword'>> & { password?: string, id?: string }): Promise<UserDB | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    if (userData.email && state.getMockUserDatabase().some(u => u.email === userData.email)) {
        return { error: 'El correo electrónico ya está registrado.' };
    }
    const newId = userData.id || `user-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const newUser: UserDB = {
        id: newId,
        name: userData.name,
        email: userData.email,
        hashedPassword: `hashed_${userData.password || 'default_password'}`,
        createdAt: new Date(),
        credit: userData.credit ?? 0,
        blockedCredit: 0,
        loyaltyPoints: userData.loyaltyPoints ?? 0,
        pendingBonusPoints: 0,
        blockedLoyaltyPoints: 0,
        preferredGameType: userData.preferredGameType ?? 'clases',
        isBlocked: userData.isBlocked ?? false,
        favoriteInstructorIds: userData.favoriteInstructorIds ?? [],
        profilePictureUrl: userData.profilePictureUrl || `https://picsum.photos/seed/${newId}/96/96`,
        genderCategory: userData.genderCategory,
        assignedClubId: userData.assignedClubId,
        assignedCourtNumber: userData.assignedCourtNumber,
        isAvailable: userData.isAvailable ?? true, 
        unavailableHours: userData.unavailableHours || {},
        rateTiers: userData.rateTiers || [],
        clubId: userData.clubId,
    };
    state.addUserToUserDatabaseState(newUser);


    if (newUser.email && !newUser.email.includes('@padelestrella.com') && !newUser.email.includes('@padelapp.com') && !newUser.id.startsWith('inst-') && !newUser.id.startsWith('admin-') && !newUser.id.startsWith('super-admin-')) {
        const studentUser: User = {
            id: newId,
            name: newUser.name,
            email: newUser.email,
            level: newUser.level,
            credit: newUser.credit,
            blockedCredit: newUser.blockedCredit,
            loyaltyPoints: newUser.loyaltyPoints,
            pendingBonusPoints: newUser.pendingBonusPoints,
            blockedLoyaltyPoints: newUser.blockedLoyaltyPoints,
            preferredGameType: newUser.preferredGameType,
            favoriteInstructorIds: newUser.favoriteInstructorIds,
            profilePictureUrl: newUser.profilePictureUrl,
            genderCategory: newUser.genderCategory, 
        };
        state.addStudentToState(studentUser);
    }
    return { ...newUser, hashedPassword: '***' };
};

export const registerStudent = async (
    userData: { name: string; email: string; password?: string }
): Promise<User | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    
    if (state.getMockUserDatabase().some(u => u.email === userData.email)) {
        return { error: 'El correo electrónico ya está registrado.' };
    }

    const newId = `student-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    const newUserDbEntry: UserDB = {
        id: newId,
        name: userData.name,
        email: userData.email,
        hashedPassword: `hashed_${userData.password || 'default_password'}`,
        createdAt: new Date(),
        level: '1.0', // Default level for new students
        credit: 0,    // Start with 0 credit
        blockedCredit: 0,
        loyaltyPoints: 0,
        preferredGameType: 'clases',
        isBlocked: false,
        favoriteInstructorIds: [],
        profilePictureUrl: `https://avatar.vercel.sh/${newId}.png?size=96`,
        genderCategory: 'abierta', // Default gender
        pendingBonusPoints: 0,
        blockedLoyaltyPoints: 0,
    };

    state.addUserToUserDatabaseState(newUserDbEntry);
    
    const newStudent: User = {
        id: newUserDbEntry.id,
        name: newUserDbEntry.name,
        email: newUserDbEntry.email,
        level: newUserDbEntry.level,
        credit: newUserDbEntry.credit,
        blockedCredit: newUserDbEntry.blockedCredit,
        loyaltyPoints: newUserDbEntry.loyaltyPoints,
        pendingBonusPoints: newUserDbEntry.pendingBonusPoints,
        blockedLoyaltyPoints: newUserDbEntry.blockedLoyaltyPoints,
        preferredGameType: newUserDbEntry.preferredGameType,
        favoriteInstructorIds: newUserDbEntry.favoriteInstructorIds,
        profilePictureUrl: newUserDbEntry.profilePictureUrl,
        genderCategory: newUserDbEntry.genderCategory,
    };
    
    state.addStudentToState(newStudent);

    return { ...newStudent };
};


export const findUserByEmail = async (email: string): Promise<UserDB | null> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const user = state.getMockUserDatabase().find(u => u.email === email);
    return user ? { ...user } : null;
};

export const findUserById = async (id: string): Promise<UserDB | null> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const user = state.getMockUserDatabase().find(u => u.id === id);
    return user ? { ...user } : null;
};

export const fetchStudents = async (): Promise<User[]> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const studentsFromDB = state.getMockUserDatabase()
        .filter(u => u.email && !u.email.includes('@padelestrella.com') && !u.email.includes('@padelapp.com') && !u.id.startsWith('inst-') && !u.id.startsWith('admin-') && !u.id.startsWith('super-admin-'))
        .map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            level: user.level,
            credit: user.credit,
            blockedCredit: user.blockedCredit,
            loyaltyPoints: user.loyaltyPoints,
            preferredGameType: user.preferredGameType,
            favoriteInstructorIds: user.favoriteInstructorIds ?? [],
            profilePictureUrl: user.profilePictureUrl,
            genderCategory: user.genderCategory,
        }));
    state.initializeMockStudents(studentsFromDB);
    return JSON.parse(JSON.stringify(studentsFromDB));
};

export const fetchUserBookings = async (userId: string): Promise<Booking[]> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const userBookingsData = state.getMockUserBookings().filter(booking => booking.userId === userId);

    return userBookingsData.map(booking => {
        const slot = state.getMockTimeSlots().find(s => s.id === booking.activityId);
        return {
            ...booking,
            bookedAt: new Date(booking.bookedAt!),
            slotDetails: slot ? {
                id: slot.id,
                clubId: slot.clubId,
                startTime: new Date(slot.startTime),
                endTime: new Date(slot.endTime),
                instructorId: slot.instructorId,
                instructorName: slot.instructorName,
                courtNumber: slot.courtNumber,
                level: slot.level,
                category: slot.category,
                bookedPlayers: JSON.parse(JSON.stringify(slot.bookedPlayers || [])),
                totalPrice: slot.totalPrice,
                status: slot.status,
                organizerId: slot.organizerId,
                privateShareCode: slot.privateShareCode,
                confirmedPrivateSize: slot.confirmedPrivateSize,
                maxPlayers: slot.maxPlayers,
                designatedGratisSpotPlaceholderIndexForOption: slot.designatedGratisSpotPlaceholderIndexForOption,
                durationMinutes: slot.durationMinutes,
            } : booking.slotDetails
        };
    });
};


export const fetchReviewsForInstructor = async (instructorId: string): Promise<Review[]> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    return JSON.parse(JSON.stringify(
        state.getMockReviews()
            .filter(r => r.instructorId === instructorId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    ));
};

export const updateUserLevel = async (userId: string, newLevel: MatchPadelLevel): Promise<{ success: true; updatedUser: User } | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    
    const userDb = state.getMockUserDatabase().find(u => u.id === userId);
    if (!userDb) return { error: 'Usuario no encontrado.' };

    const updatedUserDb: UserDB = { ...userDb, level: newLevel };
    state.updateUserInUserDatabaseState(userId, { level: newLevel });

    const studentIndex = state.getMockStudents().findIndex(s => s.id === userId);
    if (studentIndex !== -1) {
        const updatedStudents = state.getMockStudents();
        updatedStudents[studentIndex] = { ...updatedStudents[studentIndex], level: newLevel };
        state.initializeMockStudents(updatedStudents);
    }

    if (state.getMockCurrentUser()?.id === userId) {
        const currentUser = state.getMockCurrentUser();
        if (currentUser) {
            state.initializeMockCurrentUser({ ...currentUser, level: newLevel });
        }
    }
    return {
        success: true, updatedUser: {
            id: updatedUserDb.id, name: updatedUserDb.name, email: updatedUserDb.email!, level: newLevel, credit: updatedUserDb.credit, loyaltyPoints: updatedUserDb.loyaltyPoints, preferredGameType: updatedUserDb.preferredGameType, favoriteInstructorIds: updatedUserDb.favoriteInstructorIds, profilePictureUrl: updatedUserDb.profilePictureUrl, genderCategory: updatedUserDb.genderCategory,
        }
    };
};

export const updateUserFavoriteInstructors = async (userId: string, favoriteInstructorIds: string[]): Promise<{ success: true; updatedUser: User } | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const userDb = state.getMockUserDatabase().find(u => u.id === userId);
    if (!userDb) return { error: 'Usuario no encontrado.' };

    const updatedUserDb: UserDB = { ...userDb, favoriteInstructorIds };
    state.updateUserInUserDatabaseState(userId, { favoriteInstructorIds });
    
    if (state.getMockCurrentUser()?.id === userId) {
        const currentUser = state.getMockCurrentUser();
        if (currentUser) {
            state.initializeMockCurrentUser({ ...currentUser, favoriteInstructorIds });
        }
    }
    
    const studentIndex = state.getMockStudents().findIndex(s => s.id === userId);
    if (studentIndex !== -1) {
        const updatedStudents = state.getMockStudents();
        updatedStudents[studentIndex] = { ...updatedStudents[studentIndex], favoriteInstructorIds };
        state.initializeMockStudents(updatedStudents);
    }
    
    return {
        success: true, updatedUser: {
            id: updatedUserDb.id, name: updatedUserDb.name, email: updatedUserDb.email!, level: updatedUserDb.level, credit: updatedUserDb.credit, loyaltyPoints: updatedUserDb.loyaltyPoints, preferredGameType: updatedUserDb.preferredGameType, favoriteInstructorIds: updatedUserDb.favoriteInstructorIds, profilePictureUrl: updatedUserDb.profilePictureUrl, genderCategory: updatedUserDb.genderCategory,
        }
    };
};

export const updateUserGenderCategory = async (userId: string, genderCategory: UserGenderCategory): Promise<{ success: true; updatedUser: User } | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const userDb = state.getMockUserDatabase().find(u => u.id === userId);
    if (!userDb) return { error: 'Usuario no encontrado.' };

    state.updateUserInUserDatabaseState(userId, { genderCategory });
    
    const currentUser = state.getMockCurrentUser();
    if (currentUser?.id === userId) {
        state.initializeMockCurrentUser({ ...currentUser, genderCategory });
    }
    
    const studentIndex = state.getMockStudents().findIndex(s => s.id === userId);
    if (studentIndex !== -1) {
        const updatedStudents = state.getMockStudents();
        updatedStudents[studentIndex] = { ...updatedStudents[studentIndex], genderCategory };
        state.initializeMockStudents(updatedStudents);
    }
    
    const updatedUserFromDB = state.getMockUserDatabase().find(u => u.id === userId);
    if (!updatedUserFromDB) return { error: 'Error al recuperar usuario actualizado.' };

    return {
        success: true, updatedUser: {
            id: updatedUserFromDB.id, name: updatedUserFromDB.name, email: updatedUserFromDB.email!, level: updatedUserFromDB.level, credit: updatedUserFromDB.credit, loyaltyPoints: updatedUserFromDB.loyaltyPoints, preferredGameType: updatedUserFromDB.preferredGameType, favoriteInstructorIds: updatedUserFromDB.favoriteInstructorIds, profilePictureUrl: updatedUserFromDB.profilePictureUrl, genderCategory: updatedUserFromDB.genderCategory,
        }
    };
};

export const updateUserPassword = async (userId: string, currentPasswordInForm: string, newPasswordInForm: string): Promise<{ success: true } | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const userDb = state.getMockUserDatabase().find(u => u.id === userId);
    if (!userDb) return { error: 'Usuario no encontrado.' };

    // Super Admin has a specific password
    if (userDb.email === 'superadmin@padelapp.com') {
        if (currentPasswordInForm !== 'superadminpass') {
            return { error: 'La contraseña actual es incorrecta.' };
        }
    } else {
        // For all other users (students, instructors, club admins), we use 'password123' for simplicity
        // This mirrors the login pages.
        // A more robust mock would check the dynamically set password for registered users.
        const userPassword = userDb.hashedPassword?.startsWith('hashed_') ? userDb.hashedPassword.substring(7) : 'password123';
        if (currentPasswordInForm !== userPassword && currentPasswordInForm !== 'password123') {
             return { error: 'La contraseña actual es incorrecta.' };
        }
    }

    if (!newPasswordInForm || newPasswordInForm.length < 6) {
        return { error: 'La nueva contraseña debe tener al menos 6 caracteres.' };
    }
    
    const newHashedPassword = `hashed_${newPasswordInForm}`;
    state.updateUserInUserDatabaseState(userId, { hashedPassword: newHashedPassword });

    return { success: true };
};


export const addInstructor = async (instructorData: Partial<Omit<Instructor, 'id' | 'profilePictureUrl' | 'level'>>): Promise<Instructor | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    if (!instructorData.name) return { error: "El nombre del instructor es requerido."};
    if (state.getMockInstructors().find(inst => inst.name?.toLowerCase() === instructorData.name!.toLowerCase())) {
        return { error: 'Ya existe un instructor con este nombre.' };
    }
    const newId = `inst-${instructorData.name?.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString().slice(-4)}`;
    const newInstructor: Instructor = {
        id: newId,
        name: instructorData.name,
        email: instructorData.email,
        isBlocked: instructorData.isBlocked || false,
        profilePictureUrl: `https://picsum.photos/seed/${newId}/96/96`,
        level: '5.0', 
        genderCategory: 'otro',
        assignedClubId: instructorData.assignedClubId,
        assignedCourtNumber: instructorData.assignedCourtNumber,
        isAvailable: instructorData.isAvailable ?? true,
        unavailableHours: instructorData.unavailableHours || {},
        rateTiers: instructorData.rateTiers,
    };
    state.addInstructorToState(newInstructor);
    addUserToDB({ 
        id: newInstructor.id,
        name: newInstructor.name,
        email: newInstructor.email!,
        password: `pass_inst_${newInstructor.name?.toLowerCase().split(' ')[0]}`,
        isBlocked: newInstructor.isBlocked,
        profilePictureUrl: newInstructor.profilePictureUrl,
        level: newInstructor.level as MatchPadelLevel,
        genderCategory: newInstructor.genderCategory,
        assignedClubId: newInstructor.assignedClubId,
        assignedCourtNumber: newInstructor.assignedCourtNumber,
        isAvailable: newInstructor.isAvailable,
        unavailableHours: newInstructor.unavailableHours, 
        rateTiers: newInstructor.rateTiers,
    });
    return { ...newInstructor };
};

export const fetchInstructors = async (): Promise<Instructor[]> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    
    const instructorsFromDB = state.getMockUserDatabase()
        .filter(u => u.id.startsWith('inst-'))
        .map(userDb => {
            // All data should come from the single source of truth: UserDB.
            return {
                id: userDb.id,
                name: userDb.name,
                email: userDb.email,
                level: userDb.level,
                profilePictureUrl: userDb.profilePictureUrl,
                genderCategory: userDb.genderCategory,
                isBlocked: userDb.isBlocked,
                assignedClubId: userDb.assignedClubId,
                assignedCourtNumber: userDb.assignedCourtNumber,
                isAvailable: userDb.isAvailable ?? true,
                unavailableHours: userDb.unavailableHours || {},
                experience: userDb.experience || [],
                languages: userDb.languages || [],
                rateTiers: userDb.rateTiers,
                defaultRatePerHour: userDb.defaultRatePerHour
            } as Instructor;
        });
    
    return JSON.parse(JSON.stringify(instructorsFromDB));
};


const daysMap: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];


export const updateInstructor = async (instructorId: string, updatedData: Partial<Omit<Instructor, 'id'>>): Promise<Instructor | { error: string; cancelledClasses?: string[] }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    
    const currentInstructors = state.getMockInstructors();
    const instructorIndex = currentInstructors.findIndex(inst => inst.id === instructorId);
    if (instructorIndex === -1) return { error: 'Instructor no encontrado.' };

    if (updatedData.name && currentInstructors.find(i => i.id !== instructorId && i.name?.toLowerCase() === updatedData.name!.toLowerCase())) {
        return { error: 'Ya existe otro instructor con este nombre.' };
    }
    
    const updatedInstructor = { ...currentInstructors[instructorIndex], ...updatedData };
    
    if (updatedData.hasOwnProperty('isAvailable') && typeof updatedData.isAvailable !== 'boolean') {
        updatedInstructor.isAvailable = !!updatedData.isAvailable; 
    } else if (!updatedData.hasOwnProperty('isAvailable') && typeof updatedInstructor.isAvailable === 'undefined') {
         updatedInstructor.isAvailable = true;
    }
    
    currentInstructors[instructorIndex] = updatedInstructor;
    state.initializeMockInstructors(currentInstructors); 

    const userDbUpdates: Partial<UserDB> = { ...updatedData };
    if (updatedData.name) userDbUpdates.name = updatedData.name;
    if (updatedData.email) userDbUpdates.email = updatedData.email;
    if (updatedData.isBlocked !== undefined) userDbUpdates.isBlocked = updatedData.isBlocked;
    if (updatedData.assignedClubId !== undefined) userDbUpdates.assignedClubId = updatedData.assignedClubId;
    if (updatedData.assignedCourtNumber !== undefined) userDbUpdates.assignedCourtNumber = updatedData.assignedCourtNumber;
    if (updatedData.isAvailable !== undefined) userDbUpdates.isAvailable = updatedInstructor.isAvailable;
    if (updatedData.unavailableHours !== undefined) userDbUpdates.unavailableHours = updatedData.unavailableHours;
    if (updatedData.rateTiers !== undefined) userDbUpdates.rateTiers = updatedData.rateTiers;
    if (updatedData.defaultRatePerHour !== undefined) userDbUpdates.defaultRatePerHour = updatedData.defaultRatePerHour;


    state.updateUserInUserDatabaseState(instructorId, userDbUpdates);
    
    const currentUser = state.getMockCurrentUser();
    if (currentUser?.id === instructorId) {
        const updatedCurrentUser = { ...currentUser, ...updatedData } as User; 
        if (updatedData.hasOwnProperty('isAvailable') && typeof updatedData.isAvailable !== 'boolean') {
            (updatedCurrentUser as Instructor).isAvailable = !!updatedData.isAvailable;
        } else if (!updatedData.hasOwnProperty('isAvailable') && typeof (updatedCurrentUser as Instructor).isAvailable === 'undefined') {
             (updatedCurrentUser as Instructor).isAvailable = true;
        }
        if (updatedData.unavailableHours !== undefined) {
            (updatedCurrentUser as Instructor).unavailableHours = updatedData.unavailableHours;
        }
        if (updatedData.defaultRatePerHour !== undefined) {
             (updatedCurrentUser as Instructor).defaultRatePerHour = updatedData.defaultRatePerHour;
        }
        state.initializeMockCurrentUser(updatedCurrentUser);
    }

    const cancelledClasses: string[] = [];
    if (updatedData.unavailableHours) {
        const allSlots = state.getMockTimeSlots();
        for (const slot of allSlots) {
            if (slot.instructorName === updatedInstructor.name && slot.status === 'pre_registration') {
                const slotStartTime = new Date(slot.startTime);
                const slotEndTime = new Date(slot.endTime);
                const dayOfWeek = daysMap[getDay(slotStartTime)];
                
                const unavailableRangesForDay = updatedData.unavailableHours[dayOfWeek];
                if (unavailableRangesForDay) {
                    for (const unavailableRange of unavailableRangesForDay) {
                        const unavailableStart = parse(unavailableRange.start, 'HH:mm', slotStartTime);
                        const unavailableEnd = parse(unavailableRange.end, 'HH:mm', slotStartTime);
                        
                        if (areIntervalsOverlapping(
                            { start: slotStartTime, end: slotEndTime },
                            { start: unavailableStart, end: unavailableEnd },
                            { inclusive: false } // Consider inclusive for exact matches or partial overlaps
                        )) {
                            // This would be a circular dependency if imported at the top level
                            // await cancelBooking('system-cancellation', 'some-booking-id'); // Fictional user for system action
                            cancelledClasses.push(`Clase ${format(slotStartTime, "dd/MM HH:mm")} en Pista ${slot.courtNumber}`);
                            break; 
                        }
                    }
                }
            }
        }
    }
    
    return { ...updatedInstructor, cancelledClasses: cancelledClasses.length > 0 ? cancelledClasses : undefined };
};

export const deleteInstructor = async (instructorId: string): Promise<{ success: true } | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const currentInstructors = state.getMockInstructors();
    const instructorName = currentInstructors.find(i => i.id === instructorId)?.name;
    const initialLength = currentInstructors.length;
    
    const updatedInstructors = currentInstructors.filter(inst => inst.id !== instructorId);
    if (updatedInstructors.length === initialLength) return { error: 'Instructor no encontrado.' };
    state.initializeMockInstructors(updatedInstructors);

    state.removeUserFromUserDatabaseState(instructorId);
    if (instructorName) { 
        state.removeTimeSlotsFromStateByInstructor(instructorName);
    }
    return { success: true };
};

export const simulateInviteFriend = async (userId: string, clubId: string): Promise<{ success: true; pointsAwarded: number } | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const club = state.getMockClubs().find(c => c.id === clubId);
    if (!club) {
        return { error: 'Club no encontrado.' };
    }
    const pointsToAward = club.pointSettings?.inviteFriend ?? 10;
    await addUserPointsAndAddTransaction(
        userId,
        pointsToAward,
        'invitar_amigo',
        'Bonificación por invitar a un amigo',
        undefined,
        clubId
    );
    return { success: true, pointsAwarded };
};

export const reserveProductWithCredit = async (userId: string, productId: string): Promise<{ success: true, newBalance: number } | { error: string }> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    const user = state.getMockUserDatabase().find(u => u.id === userId);
    if (!user) return { error: "Usuario no encontrado." };
    
    const product = state.getMockShopProducts().find(p => p.id === productId);
    if (!product) return { error: "Producto no encontrado." };
    
    const club = state.getMockClubs().find(c => c.id === product.clubId);
    const reservationFee = club?.shopReservationFee ?? 1.0;

    if ((user.credit ?? 0) < reservationFee) {
        return { error: `Saldo insuficiente. Necesitas ${reservationFee.toFixed(2)}€ para la fianza.` };
    }

    const newBalance = (user.credit ?? 0) - reservationFee;
    state.updateUserInUserDatabaseState(userId, { credit: newBalance });

    const currentUser = state.getMockCurrentUser();
    if (currentUser?.id === userId) {
        state.initializeMockCurrentUser({ ...currentUser, credit: newBalance });
    }

    state.addTransactionToState({
        id: `txn-reserve-${Date.now()}-${userId.slice(-4)}`,
        userId: userId,
        date: new Date(),
        type: 'Compra Producto',
        amount: -reservationFee,
        description: `Fianza por reserva: ${product.name}`,
    });

    return { success: true, newBalance };
};

export const fetchPointTransactions = async (clubId?: string, userId?: string): Promise<PointTransaction[]> => {
    await new Promise(resolve => setTimeout(resolve, config.MINIMAL_DELAY));
    let transactions = state.getMockPointTransactions();
    if (clubId) {
        transactions = transactions.filter(t => t.clubId === clubId);
    }
    if (userId) {
        transactions = transactions.filter(t => t.userId === userId);
    }
    return JSON.parse(JSON.stringify(transactions));
};


export const countUserReservedProducts = async (userId: string): Promise<number> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    const userTransactions = state.getMockTransactions().filter(t => t.userId === userId && t.type === 'Compra Producto');
    return userTransactions.length;
};

export const addProduct = async (productData: Omit<Product, 'id'>): Promise<Product | { error: string }> => {
  await new Promise(resolve => setTimeout(resolve, 50));
  
  if (!productData.name || !productData.clubId) {
    return { error: 'El nombre y el club son obligatorios.' };
  }
  
  const newProduct: Product = {
    ...productData,
    id: `prod-${Date.now()}`,
  };

  state.addProductToState(newProduct);
  return newProduct;
};
