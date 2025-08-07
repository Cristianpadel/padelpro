"use client";

import React from 'react';
import type { TimeSlot } from '@/types';
import { cn } from '@/lib/utils';
import { Users } from 'lucide-react';
import { isSlotEffectivelyCompleted } from '@/lib/mockData';

interface ClassInscriptionVisualizerProps {
  timeSlot: TimeSlot | null;
}

const ClassInscriptionVisualizer: React.FC<ClassInscriptionVisualizerProps> = ({ timeSlot }) => {
  const isProposedClass = timeSlot?.status === 'pre_registration' && (!timeSlot.bookedPlayers || timeSlot.bookedPlayers.length === 0);

  if (!timeSlot) {
    return (
       <div className="h-full w-full bg-gray-50" />
    );
  }

  if (isProposedClass) {
    return (
      <div className="proposed-class-panel flex h-full w-full items-center justify-center p-0.5 bg-transparent rounded-sm min-w-fit flex-col gap-1">
         <Users className="h-4 w-4 text-orange-600" />
         <p className="text-[9px] font-semibold text-orange-700">Clase Propuesta</p>
      </div>
    );
  }

  const bookingsByGroupSize: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  if (timeSlot?.bookedPlayers) {
    timeSlot.bookedPlayers.forEach(p => {
      if (bookingsByGroupSize[p.groupSize] !== undefined) {
        bookingsByGroupSize[p.groupSize]++;
      }
    });
  }

  const { completed: isCompleted } = isSlotEffectivelyCompleted(timeSlot);

  return (
    <div className="class-pyramid-panel flex flex-col items-center justify-center gap-0.5 p-0.5 bg-transparent rounded-sm w-full h-full">
      {([1, 2, 3, 4] as const).map(optionSize => (
        <div key={optionSize} className="flex items-center justify-center gap-px">
          {Array.from({ length: optionSize }).map((_, spotIndex) => {
            const isFilled = spotIndex < bookingsByGroupSize[optionSize];
            const isGratisPlaceholder = timeSlot?.designatedGratisSpotPlaceholderIndexForOption?.[optionSize] === spotIndex && !isFilled;

            let squareColorClass = 'bg-blue-200'; // Default libre (pre-registration)
            let title = `Opción ${optionSize}p - Plaza ${spotIndex + 1}/${optionSize} Libre`;

            if (isGratisPlaceholder) {
                squareColorClass = 'bg-yellow-400'; // Gratis spot color
                title = `Opción ${optionSize}p - Plaza ${spotIndex + 1}/${optionSize} ¡Gratis!`;
            } else if (timeSlot?.status === 'confirmed_private') {
                squareColorClass = isFilled ? 'bg-purple-600' : 'bg-purple-200';
                title = `Opción ${optionSize}p - Plaza ${spotIndex + 1}/${optionSize} ${isFilled ? 'Ocupada (Privada)' : 'Libre (Privada)'}`;
            } else if (isCompleted) {
                squareColorClass = isFilled ? 'bg-green-600' : 'bg-green-200';
                title = `Opción ${optionSize}p - Plaza ${spotIndex + 1}/${optionSize} ${isFilled ? 'Ocupada (Confirmada)' : 'Libre'}`;
            } else { // pre_registration
                 squareColorClass = isFilled ? 'bg-blue-600' : 'bg-blue-200';
                 title = `Opción ${optionSize}p - Plaza ${spotIndex + 1}/${optionSize} ${isFilled ? 'Ocupada' : 'Libre'}`;
            }
            
            return (
              <div
                key={`${optionSize}-${spotIndex}`}
                title={title}
                className={cn(
                  "w-1.5 h-1.5 border border-gray-400",
                  squareColorClass
                )}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default ClassInscriptionVisualizer;
