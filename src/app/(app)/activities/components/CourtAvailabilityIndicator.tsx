"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import CourtAvailabilityInfoDialog from './CourtAvailabilityInfoDialog'; // Import the new dialog
import type { PadelCourt } from '@/types';

// A simple SVG component for the padel court icon
const PadelCourtIcon: React.FC<{ isAvailable: boolean; className?: string }> = ({ isAvailable, className }) => (
  <svg width="20" height="30" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("flex-shrink-0", className)}>
    <rect x="1" y="1" width="22" height="34" rx="2" className={cn(isAvailable ? "fill-green-500" : "fill-gray-300", "stroke-gray-400")} strokeWidth="1.5"/>
    <path d="M1 18H23" className={cn(isAvailable ? "stroke-white/80" : "stroke-gray-500/80")} strokeWidth="1.5"/>
    <rect x="4" y="5" width="16" height="10" rx="1" className={cn(isAvailable ? "stroke-white/70" : "stroke-gray-500/70")} strokeWidth="1"/>
    <rect x="4" y="21" width="16" height="10" rx="1" className={cn(isAvailable ? "stroke-white/70" : "stroke-gray-500/70")} strokeWidth="1"/>
  </svg>
);


interface CourtAvailabilityIndicatorProps {
  availableCourts: PadelCourt[];
  occupiedCourts: PadelCourt[];
  totalCourts: number;
}

const CourtAvailabilityIndicator: React.FC<CourtAvailabilityIndicatorProps> = ({ availableCourts, occupiedCourts, totalCourts }) => {
    const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);

    if (totalCourts === 0) return null;

    const maxIconsToShow = 8;
    const courtsToShow = Array.from({ length: Math.min(totalCourts, maxIconsToShow) }).map((_, index) => ({
        isAvailable: index < availableCourts.length
    }));

    if (totalCourts > maxIconsToShow && availableCourts.length <= (totalCourts - maxIconsToShow)) {
        // Ensure we always show the occupied ones if there are many total courts.
        const occupiedToShow = Math.min(maxIconsToShow, totalCourts - availableCourts.length);
        const availableToShow = maxIconsToShow - occupiedToShow;
        courtsToShow.forEach((court, index) => {
            court.isAvailable = index < availableToShow;
        });
    }

  return (
    <>
      <div 
        className="flex flex-col items-center mt-1 cursor-pointer group w-full"
        onClick={() => setIsInfoDialogOpen(true)}
        role="button"
        tabIndex={0}
        aria-label="Ver detalles de disponibilidad de pistas"
      >
        <p className="text-xs text-muted-foreground mb-1 group-hover:text-primary transition-colors">Pistas disponibles</p>
        <div 
          className="flex items-center justify-center p-1.5 w-full bg-slate-50 border border-slate-200 rounded-lg shadow-inner"
        >
          <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center h-6 w-6 rounded-full bg-white border-2 border-slate-300 font-bold text-slate-700 text-base">
              {availableCourts.length}
              </div>
              <div className="flex space-x-1">
                  {courtsToShow.map((court, index) => (
                      <PadelCourtIcon key={index} isAvailable={court.isAvailable} />
                  ))}
              </div>
          </div>
        </div>
      </div>

      <CourtAvailabilityInfoDialog
        isOpen={isInfoDialogOpen}
        onOpenChange={setIsInfoDialogOpen}
        availableCourts={availableCourts}
        occupiedCourts={occupiedCourts}
        totalCourts={totalCourts}
      />
    </>
  );
};

export default CourtAvailabilityIndicator;
