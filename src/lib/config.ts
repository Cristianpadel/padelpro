// lib/config.ts

// A small delay to simulate network latency
export const MINIMAL_DELAY = 250;

// Default settings for club points
export const defaultPointSettings = {
    cancellationPointPerEuro: 1,
    inviteFriend: 10,
    firstToJoinClass: 2,
    firstToJoinMatch: 2,
    pointsCostForCourt: 25,
    unconfirmedCancelPenaltyPoints: 1,
    unconfirmedCancelPenaltyEuros: 1,
    cancellationPenaltyTiers: [
        { hoursBefore: 2, penaltyPercentage: 100 },
        { hoursBefore: 6, penaltyPercentage: 50 },
        { hoursBefore: 12, penaltyPercentage: 25 },
    ]
};
