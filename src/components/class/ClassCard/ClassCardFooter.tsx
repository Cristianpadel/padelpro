// src/components/class/ClassCard/ClassCardFooter.tsx
"use client";

import React from 'react';
import type { TimeSlot, PadelCourt } from '@/types';
import CourtAvailabilityIndicator from '@/components/class/CourtAvailabilityIndicator';

interface ClassCardFooterProps {
  courtAvailability: { available: PadelCourt[], occupied: PadelCourt[], total: number };
}

export const ClassCardFooter: React.FC<ClassCardFooterProps> = ({
    courtAvailability
}) => {
    return (
        <div className="border-t pt-2 pb-3 px-3">
            <CourtAvailabilityIndicator
                availableCourts={courtAvailability.available}
                occupiedCourts={courtAvailability.occupied}
                totalCourts={courtAvailability.total}
            />
        </div>
    );
};
