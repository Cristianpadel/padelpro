// src/components/class/CourtAvailabilityIndicator.tsx
"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import type { PadelCourt } from '@/types';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

// A new, specific icon component as described by the user.
const CourtIcon: React.FC<{ isAvailable: boolean }> = ({ isAvailable }) => {
    const colorClass = isAvailable ? "text-green-500" : "text-gray-300";
    const fillClass = isAvailable ? "fill-green-500" : "fill-gray-300";

    return (
        <svg width="24" height="14" viewBox="0 0 24 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("shrink-0", colorClass)}>
            {/* Outer rectangle */}
            <rect x="0.5" y="0.5" width="23" height="13" rx="2" stroke="currentColor"/>
            {/* Line separator */}
            <line x1="12" y1="1" y2="13" stroke="currentColor" strokeWidth="1"/>
            {/* Two inner rectangles (represented by filled rects) */}
            <rect x="4" y="4" width="5" height="6" rx="1" className={fillClass} strokeWidth="0"/>
            <rect x="15" y="4" width="5" height="6" rx="1" className={fillClass} strokeWidth="0"/>
        </svg>
    );
};


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
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger className="w-full mt-2 text-left cursor-default">
                <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg shadow-inner w-full">
                    <p className="text-xs text-center font-medium text-slate-600 mb-2">
                        Pistas disponibles: <span className="font-bold">{availableCourts.length}/{totalCourts}</span>
                    </p>
                    <div className="flex items-center justify-center gap-x-1.5 flex-wrap">
                        {allCourtsStatus.map((court) => (
                           <CourtIcon key={court.id} isAvailable={court.isAvailable} />
                        ))}
                    </div>
                </div>
            </TooltipTrigger>
            <TooltipContent>
                 <p className="font-semibold">Pistas Ocupadas:</p>
                {occupiedCourts.length > 0 ? (
                    <ul className="list-disc list-inside text-xs">
                    {occupiedCourts.map(court => <li key={court.id}>{court.name}</li>)}
                    </ul>
                ) : (
                    <p className="text-xs">Ninguna</p>
                )}
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
  );
};

export default CourtAvailabilityIndicator;
