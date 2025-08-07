// src/components/class/CourtAvailabilityIndicator.tsx
"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import type { PadelCourt } from '@/types';

interface CourtAvailabilityIndicatorProps {
  availableCourts: PadelCourt[];
  occupiedCourts: PadelCourt[];
  totalCourts: number;
}

const CourtAvailabilityIndicator: React.FC<CourtAvailabilityIndicatorProps> = ({
  availableCourts,
  occupiedCourts,
  totalCourts,
}) => {
  if (totalCourts === 0) {
    return <p className="text-xs text-muted-foreground text-center">No hay pistas en el club.</p>;
  }
  
  const allCourtsStatus = [
      ...availableCourts.map(c => ({ ...c, isAvailable: true })),
      ...occupiedCourts.map(c => ({ ...c, isAvailable: false }))
  ].sort((a,b) => a.courtNumber - b.courtNumber);

  return (
    <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg shadow-inner w-full">
        <p className="text-xs text-center font-medium text-slate-600 mb-2">Pistas disponibles</p>
        <div className="flex items-center justify-center gap-x-4">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-white border-2 border-slate-300 font-bold text-slate-700 text-lg shadow-sm">
                {availableCourts.length}
            </div>
            <div className="flex items-center">
                {allCourtsStatus.map((court, index) => (
                    <React.Fragment key={court.id}>
                        <div
                            className={cn(
                                "h-2 w-2 rounded-full",
                                court.isAvailable ? "bg-green-500" : "bg-gray-300"
                            )}
                            title={`${court.name} - ${court.isAvailable ? 'Disponible' : 'Ocupada'}`}
                        />
                        {index < allCourtsStatus.length - 1 && (
                            <div className={cn(
                                "h-0.5 w-2",
                                court.isAvailable ? "bg-green-500" : "bg-gray-300"
                            )}/>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    </div>
  );
};

export default CourtAvailabilityIndicator;
