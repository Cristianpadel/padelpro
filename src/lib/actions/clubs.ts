// lib/actions/clubs.ts
import type { Club, Instructor, DayOfWeek } from '@/types';
import { getDay, format } from 'date-fns';
import { daysOfWeek as dayOfWeekArray } from '@/types';

export const calculateActivityPrice = (club: Club, startTime: Date): number => {
    if (club.courtRateTiers) {
        const dayIndex = getDay(startTime);
        const dayOfWeek: DayOfWeek = dayOfWeekArray[dayIndex === 0 ? 6 : dayIndex - 1];
        const time = format(startTime, 'HH:mm');

        const matchingTier = club.courtRateTiers.find(tier =>
            tier.days.includes(dayOfWeek) &&
            time >= tier.startTime &&
            time < tier.endTime
        );
        if (matchingTier) {
            return matchingTier.rate;
        }
    }
    // Fallback price
    const hour = startTime.getHours();
    if (hour >= 18) {
        return 28; // Peak time
    }
    return 20; // Off-peak
};

export const getInstructorRate = (instructor: Instructor, date: Date): number => {
    const dayOfWeek = dayOfWeekArray[getDay(date) === 0 ? 6 : getDay(date) - 1];
    const time = format(date, 'HH:mm');

    if (instructor.rateTiers) {
        const matchingTier = instructor.rateTiers.find(tier =>
            tier.days.includes(dayOfWeek) &&
            time >= tier.startTime &&
            time < tier.endTime
        );
        if (matchingTier) {
            return matchingTier.rate;
        }
    }