"use client";

import React from 'react';
import type { PadelCourt } from '@/types';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface CourtAvailabilityIndicatorProps {
  availableCourts: PadelCourt[];
  occupiedCourts: PadelCourt[];
  totalCourts: number;
}

const CourtAvailabilityIndicator: React.FC<CourtAvailabilityIndicatorProps> = ({ availableCourts, occupiedCourts, totalCourts }) => {
  if (totalCourts === 0) {
    return null; // Don't show if there are no courts
  }

  const availableCount = availableCourts.length;
  const percentageAvailable = totalCourts > 0 ? (availableCount / totalCourts) * 100 : 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className="w-full mt-2 text-left">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-muted-foreground">Disponibilidad de Pistas</span>
              <span className={cn(
                "text-xs font-bold",
                percentageAvailable > 66 && "text-green-600",
                percentageAvailable <= 66 && percentageAvailable > 33 && "text-amber-600",
                percentageAvailable <= 33 && "text-red-600"
              )}>
                {availableCount} / {totalCourts} Libres
              </span>
            </div>
            <Progress value={percentageAvailable} className="h-2" />
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
