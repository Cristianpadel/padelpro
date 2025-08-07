// src/components/class/CourtAvailabilityIndicator.tsx
"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import type { PadelCourt } from '@/types';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

// A new, specific icon component as described by the user.
const CourtIcon: React.FC<{ isAvailable: boolean }> = ({ isAvailable }) => {
    const fillColor = isAvailable ? "#4ade80" : "#d1d5db"; // green-400 or gray-300
    const strokeColor = "#ffffff";

    return (
        <svg width="18" height="26" viewBox="0 0 18 26" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
            <rect width="18" height="26" rx="3" fill={fillColor}/>
            <rect x="2" y="2" width="14" height="9" rx="2" fill={fillColor} stroke={strokeColor} strokeWidth="1.5"/>
            <rect x="2" y="15" width="14" height="9" rx="2" fill={fillColor} stroke={strokeColor} strokeWidth="1.5"/>
            <line x1="2" y1="12.5" x2="16" y2="12.5" stroke={strokeColor} strokeWidth="1.5"/>
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
    <div className="w-full text-center mt-2">
       <p className="text-xs font-medium text-slate-600 mb-1">
            Pistas disponibles: <span className="font-bold">{availableCourts.length}/{totalCourts}</span>
        </p>
      <TooltipProvider>
          <Tooltip>
              <TooltipTrigger className="w-full text-left cursor-default">
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg shadow-inner w-full">
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
    </div>
  );
};

export default CourtAvailabilityIndicator;
