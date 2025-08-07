"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import type { TimeSlot, User } from '@/types';
import BookingSpotDisplay from '@/components/class/BookingSpotDisplay';
import CourtAvailabilityIndicator from '@/components/class/CourtAvailabilityIndicator';
import type { PadelCourt } from '@/types';

interface ClassCardContentProps {
  currentUser: User;
  currentSlot: TimeSlot;
  totalPrice: number;
  bookingsByGroupSize: Record<number, { userId: string; groupSize: 1 | 2 | 3 | 4; }[]>;
  isSlotEffectivelyFull: boolean;
  confirmedGroupSize: 1 | 2 | 3 | 4 | null;
  userHasConfirmedActivityToday: boolean;
  isPendingMap: Record<string, boolean>;
  onOpenConfirmationDialog: (optionSize: 1 | 2 | 3 | 4, spotIdx: number) => void;
  showPointsBonus: boolean;
  handlePriceInfoClick: (optionSize: 1 | 2 | 3 | 4) => void;
  courtAvailability: { available: PadelCourt[], occupied: PadelCourt[], total: number };
}

export const ClassCardContent: React.FC<ClassCardContentProps> = ({
  currentUser,
  currentSlot,
  totalPrice,
  bookingsByGroupSize,
  isSlotEffectivelyFull,
  confirmedGroupSize,
  userHasConfirmedActivityToday,
  isPendingMap,
  onOpenConfirmationDialog,
  showPointsBonus,
  handlePriceInfoClick,
  courtAvailability,
}) => {
  return (
    <div className="flex-grow pt-2 pb-2 px-3 space-y-1 bg-white">
      {([1, 2, 3, 4] as const).map(optionSize => {
        const isUserBookedInThisOption = (bookingsByGroupSize[optionSize] || []).some(p => p.userId === currentUser.id);
        return (
          <div key={optionSize} className={cn(
            "flex items-center justify-between p-1 rounded-md transition-all border border-transparent",
            (isSlotEffectivelyFull && confirmedGroupSize !== optionSize) && "opacity-50 pointer-events-none",
            isUserBookedInThisOption && "bg-blue-50 border-blue-200"
          )}>
            <div className="flex items-center gap-1.5 flex-grow-0 shrink-0 basis-auto justify-start">
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
                />
              )}
            </div>
            <Button variant="outline" className="text-xs flex items-center h-8 px-3 rounded-full shadow-sm" onClick={() => handlePriceInfoClick(optionSize)}>
              <span className="font-bold text-sm">
                {(totalPrice / optionSize).toFixed(2)}
              </span>
              <span className="font-semibold text-xs ml-1 text-muted-foreground">€ p.p.</span>
            </Button>
          </div>
        );
      })}
      <CourtAvailabilityIndicator
        availableCourts={courtAvailability.available}
        occupiedCourts={courtAvailability.occupied}
        totalCourts={courtAvailability.total}
      />
    </div>
  );
};
