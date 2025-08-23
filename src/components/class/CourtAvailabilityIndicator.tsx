// src/components/class/CourtAvailabilityIndicator.tsx
"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import type { PadelCourt } from '@/types';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

// Court icon with three states: available (green), occupied (gray), assigned (blue)
const CourtIcon: React.FC<{ status: 'available' | 'occupied' | 'assigned' }> = ({ status }) => {
  const fillColor = status === 'assigned' ? '#3b82f6' : status === 'available' ? '#4ade80' : '#d1d5db';
  const strokeColor = '#ffffff';
  return (
    <svg
      width="18"
      height="26"
      viewBox="0 0 18 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <rect width="18" height="26" rx="3" fill={fillColor} />
      <rect x="2" y="2" width="14" height="9" rx="2" fill={fillColor} stroke={strokeColor} strokeWidth="1.5" />
      <rect x="2" y="15" width="14" height="9" rx="2" fill={fillColor} stroke={strokeColor} strokeWidth="1.5" />
      <line x1="2" y1="12.5" x2="16" y2="12.5" stroke={strokeColor} strokeWidth="1.5" />
    </svg>
  );
};


interface CourtAvailabilityIndicatorProps {
  availableCourts: PadelCourt[];
  occupiedCourts: PadelCourt[];
  totalCourts: number;
  // Optional: highlight assigned court number in blue
  assignedCourtNumber?: number | null;
}

const CourtAvailabilityIndicator: React.FC<CourtAvailabilityIndicatorProps> = ({
  availableCourts,
  occupiedCourts,
  totalCourts,
  assignedCourtNumber,
}) => {
  if (totalCourts === 0) {
    return <p className="text-xs text-muted-foreground text-center">No hay pistas en el club.</p>;
  }
  
  const availableSet = new Set((availableCourts || []).map(c => c.courtNumber));
  const occupiedSet = new Set((occupiedCourts || []).map(c => c.courtNumber));

  return (
    <div className="w-full text-center">
        <p className="text-xs font-medium text-slate-600 mb-1">
            Pistas disponibles:
        </p>
      <TooltipProvider>
          <Tooltip>
              <TooltipTrigger className="w-full text-left cursor-default">
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg shadow-inner w-full">
                      <div className="flex items-center justify-center gap-x-2 flex-wrap">
                           <div className="flex flex-col items-center mr-1">
                                <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm border-2 border-white shadow">
                                    {availableCourts.length}/{totalCourts}
                                </div>
                            </div>
                          {Array.from({ length: totalCourts }).map((_, idx) => {
                            const n = idx + 1;
                            const status: 'available' | 'occupied' | 'assigned' = assignedCourtNumber && n === assignedCourtNumber
                              ? 'assigned'
                              : availableSet.has(n)
                                ? 'available'
                                : 'occupied';
                            return <CourtIcon key={n} status={status} />;
                          })}
                      </div>
                  </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                   <div className="flex items-start">
                        <Info className="h-4 w-4 mr-2 mt-0.5 text-blue-500"/>
                        <div>
                             <p className="font-semibold">Asignación de Pista</p>
                             <p className="text-xs text-muted-foreground">
                                Cuando una clase se completa con todos los alumnos, se le asigna automáticamente una de las pistas que ves disponibles. ¡Por eso es importante que los grupos se llenen!
                            </p>
                             {assignedCourtNumber ? (
                               <p className="text-xs text-blue-600 mt-1">Pista asignada: #{assignedCourtNumber}</p>
                             ) : null}
                        </div>
                   </div>
              </TooltipContent>
          </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default CourtAvailabilityIndicator;
