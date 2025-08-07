// src/components/class/CourtAvailabilityIndicator.tsx
"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { PadelCourt } from '@/types';

interface CourtAvailabilityIndicatorProps {
  availableCourts: PadelCourt[];
  occupiedCourts: PadelCourt[];
  totalCourts: number;
}

const CourtIcon: React.FC<{ available: boolean }> = ({ available }) => (
    <div className={cn(
      "w-3 h-4 rounded-sm border p-px flex flex-col justify-between",
      available ? "bg-green-200/50 border-green-500" : "bg-gray-200 border-gray-400"
    )}>
      <div className={cn("h-[calc(50%-1px)] w-full rounded-t-[1px]", available ? "bg-green-500" : "bg-gray-400")}></div>
      <div className={cn("h-[calc(50%-1px)] w-full rounded-b-[1px]", available ? "bg-green-500" : "bg-gray-400")}></div>
    </div>
);

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
        <p className="text-xs text-center font-medium text-slate-600 mb-1.5">Pistas disponibles</p>
        <div className="flex items-center justify-center gap-x-3">
             <div className="flex items-center justify-center h-8 w-8 rounded-full bg-white border-2 border-slate-300 font-bold text-slate-700 text-lg shadow-sm">
                {availableCourts.length}
            </div>
            <div className="flex items-center gap-1">
                {allCourtsStatus.map(court => (
                    <TooltipProvider key={court.id} delayDuration={100}>
                        <Tooltip>
                            <TooltipTrigger>
                                <CourtIcon available={court.isAvailable} />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{court.name} - {court.isAvailable ? 'Disponible' : 'Ocupada'}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ))}
            </div>
        </div>
    </div>
  );
};

export default CourtAvailabilityIndicator;
