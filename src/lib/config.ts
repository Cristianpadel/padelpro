// lib/config.ts

// A small delay to simulate network latency
export const MINIMAL_DELAY = 10; // Milliseconds for simulated API calls
export const today = new Date(); // Initialized once

// Feature flags
export const USE_DB_FIXED = (process.env.NEXT_PUBLIC_USE_DB_FIXED || '0') === '1';

// Default settings for club points
export const defaultPointSettings = {
    cancellationPointPerEuro: 1, // Puntos otorgados por € en cancelación de clase/partida confirmada > 24h (cuando aplica)
    inviteFriend: 5,
    firstToJoinClass: 2,
    firstToJoinMatch: 2,
    unconfirmedCancelPenaltyPoints: 1, // Penalización por cancelar una INSCRIPCIÓN (no confirmada aún)
    unconfirmedCancelPenaltyEuros: 1, // Penalización en euros por INSCRIPCIÓN (no confirmada) si no hay puntos
    pointsCostForCourt: 20,
    cancellationPenaltyTiers: [
        { hoursBefore: 3, penaltyPercentage: 30 },
        { hoursBefore: 2, penaltyPercentage: 50 },
        { hoursBefore: 1, penaltyPercentage: 80 },
    ],
    inscriptionBonusPoints: 0.50, // Points for pre-registering
};
