// src/components/class/ClassCard/ClassCardContent.tsx
"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import type { TimeSlot, User } from '@/types';
import BookingSpotDisplay from './BookingSpotDisplay';
import { Button } from '@/components/ui/button';
import { calculatePricePerPerson } from '@/lib/utils';
import { Euro, Info } from 'lucide-react';
import { isSlotEffectivelyCompleted } from '@/lib/mockData';
import { differenceInDays, startOfDay } from 'date-fns';

interface ClassCardContentProps {
  currentUser: User;
  currentSlot: TimeSlot;
  totalPrice: number;
  bookingsByGroupSize: Record<number, { userId: string; groupSize: 1 | 2 | 3 | 4; }[]>;
  isSlotEffectivelyFull: boolean;
  userHasConfirmedActivityToday: boolean;
  isPendingMap: Record<string, boolean>;
  onOpenConfirmationDialog: (optionSize: 1 | 2 | 3 | 4, spotIdx: number) => void;
  showPointsBonus: boolean;
  handlePriceInfoClick: (optionSize: number) => void;
  anticipationBonus: number;
}

export const ClassCardContent: React.FC<ClassCardContentProps> = ({
  currentUser,
  currentSlot,
  totalPrice,
  bookingsByGroupSize,
  isSlotEffectivelyFull,
  userHasConfirmedActivityToday,
  isPendingMap,
  onOpenConfirmationDialog,
  showPointsBonus,
  handlePriceInfoClick,
  anticipationBonus,
}) => {
    
  return (
    <div className="flex-grow pt-1 pb-2 px-3 space-y-1 flex flex-col">
        <div className="flex-grow space-y-1">
            {([1, 2, 3, 4] as const).map(optionSize => {
                const isUserBookedInThisOption = (bookingsByGroupSize[optionSize] || []).some(p => p.userId === currentUser.id);
                const confirmedGroupSize = isSlotEffectivelyFull ? (isSlotEffectivelyCompleted(currentSlot).size) : null;

                const pointsBaseValues: { [key in 1 | 2 | 3 | 4]: number[] } = { 1: [10], 2: [8, 7], 3: [5, 4, 3], 4: [3, 2, 1, 0] };

                return (
                <div key={optionSize} className={cn(
                    "flex items-center justify-between p-1 rounded-md transition-all border border-transparent min-h-[44px]",
                    isUserBookedInThisOption && "bg-blue-50 border-blue-200"
                )}>
                    <div className="flex items-center gap-1 flex-grow-0 shrink-0 basis-auto justify-start">
                    {Array.from({ length: optionSize }).map((_, index) =>
                        <BookingSpotDisplay
                            key={`${optionSize}-${index}`}
                            optionSize={optionSize}
                            spotIndex={index}
                            bookingsByGroupSize={bookingsByGroupSize}
                            currentUser={currentUser!}
                            currentSlot={currentSlot}
                            isPendingMap={isPendingMap}
                            totalPrice={totalPrice}
                            isSlotOverallConfirmed={isSlotEffectivelyFull}
                            confirmedGroupSize={confirmedGroupSize}
                            userHasConfirmedActivityToday={userHasConfirmedActivityToday}
                            isUserBookedInThisOption={isUserBookedInThisOption}
                            onOpenConfirmationDialog={onOpenConfirmationDialog}
                            showPointsBonus={showPointsBonus}
                            pointsToAward={ (pointsBaseValues[optionSize][index] ?? 0) + anticipationBonus }
                        />
                    )}
                    </div>
                    <Button variant="outline" className="text-xs flex items-center h-8 px-3 rounded-full shadow-sm bg-slate-100 hover:bg-slate-200 text-slate-700" onClick={() => handlePriceInfoClick(optionSize)}>
                    <Euro className="mr-1 h-3.5 w-3.5"/>
                    <span className="font-bold text-sm">
                        {calculatePricePerPerson(totalPrice, optionSize).toFixed(2)}
                    </span>
                    </Button>
                </div>
                );
            })}
        </div>
    </div>
  );
};
