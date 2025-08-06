import type { TimeSlot } from '@/types';

/**
 * Checks if a TimeSlot is a "proposal slot".
 * A proposal slot is one that is in the 'forming' state and has no booked players.
 * @param slot The TimeSlot to check.
 * @returns True if the slot is a proposal slot, false otherwise.
 */
export const isProposalSlot = (slot: TimeSlot): boolean => {
    return slot.status === 'forming' && (!slot.bookedPlayers || slot.bookedPlayers.length === 0);
};
