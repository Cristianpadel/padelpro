// src/components/class/ClassCard/ClassCardContent.tsx
"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import type { TimeSlot, User } from '@/types';
import BookingSpotDisplay from '@/components/class/BookingSpotDisplay';
import { Button } from '@/components/ui/button';
import { calculatePricePerPerson } from '@/lib/utils';
import { Euro, Info } from 'lucide-react';
import { isSlotEffectivelyCompleted } from '@/lib/mockData';

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
  isUserBookedInAnyOption: boolean;
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
  isUserBookedInAnyOption,
}) => {
    
  return (
    <div className="flex-grow pt-1 pb-2 px-3 space-y-1 flex flex-col">
        <div className="flex-grow space-y-1">
            {([1, 2, 3, 4] as const).map(optionSize => {
                const confirmedGroupSize = isSlotEffectivelyFull ? currentSlot.bookedPlayers.find(p => bookingsByGroupSize[optionSize].includes(p))?.groupSize : null;

                return (
                <div key={optionSize} className={cn(
                    "flex items-center justify-between p-1 rounded-md transition-all border border-transparent min-h-[44px]",
                    isUserBookedInAnyOption && (currentSlot.bookedPlayers || []).some(p => p.groupSize === optionSize) && "bg-blue-50 border-blue-200"
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
                        isUserBookedInAnyOption={isUserBookedInAnyOption}
                        onOpenConfirmationDialog={onOpenConfirmationDialog}
                        showPointsBonus={showPointsBonus}
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
