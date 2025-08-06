"use client";

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, Plus, Gift, Minus, CreditCard, Star } from 'lucide-react';
import { cn, getInitials, getPlaceholderUserName, calculatePricePerPerson } from '@/lib/utils';
import type { User, TimeSlot } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { getMockStudents, getMockClubs } from '@/lib/mockData'; // Import getMockStudents
import { differenceInDays, startOfDay } from 'date-fns';
import { Progress } from '@/components/ui/progress';


interface BookingSpotDisplayProps {
  optionSize: 1 | 2 | 3 | 4;
  spotIndex: number;
  bookingsByGroupSize: Record<number, { userId: string; groupSize: 1 | 2 | 3 | 4 }[]>;
  currentUser: User;
  currentSlot: TimeSlot;
  isPendingMap: Record<string, boolean>;
  totalPrice: number;
  pointsCostForGratisSpot: number; // This is the actual points cost for this specific gratis spot
  isSlotOverallConfirmed: boolean;
  confirmedGroupSize: (1 | 2 | 3 | 4) | null;
  userHasConfirmedActivityToday: boolean;
  isUserBookedInThisOption: boolean; 
  onOpenConfirmationDialog: (optionSize: 1 | 2 | 3 | 4, spotIdx: number) => void;
  showPointsBonus: boolean; // New prop
}

const BookingSpotDisplay: React.FC<BookingSpotDisplayProps> = ({
  optionSize,
  spotIndex,
  bookingsByGroupSize,
  currentUser,
  currentSlot,
  isPendingMap,
  totalPrice,
  pointsCostForGratisSpot,
  isSlotOverallConfirmed,
  confirmedGroupSize,
  userHasConfirmedActivityToday,
  isUserBookedInThisOption,
  onOpenConfirmationDialog,
  showPointsBonus, // Receive prop
}) => {
  const { toast } = useToast();
  const bookedPlayersForOption = bookingsByGroupSize[optionSize] || [];
  const playerInSpot = bookedPlayersForOption[spotIndex];
  const isCurrentUserInSpot = playerInSpot?.userId === currentUser?.id;
  const bookingKey = `${optionSize}-${spotIndex}`;
  const isLoading = isPendingMap[bookingKey];

  const isDesignatedGratisSpot = currentSlot.designatedGratisSpotPlaceholderIndexForOption?.[optionSize] === spotIndex;
  const isGratisSpotEffectivelyAvailable = isDesignatedGratisSpot && !playerInSpot;

  const pricePerPersonForThisOption = calculatePricePerPerson(totalPrice, optionSize);
  const hasEnoughCredit = (currentUser?.credit ?? 0) >= pricePerPersonForThisOption;
  const hasEnoughPointsForGratis = (currentUser?.loyaltyPoints ?? 0) >= pointsCostForGratisSpot;

  const canJoinThisSpotStandard =
    !playerInSpot &&
    !isDesignatedGratisSpot &&
    bookedPlayersForOption.length < optionSize &&
    !isSlotOverallConfirmed &&
    !userHasConfirmedActivityToday &&
    !isUserBookedInThisOption && 
    hasEnoughCredit;

  const canJoinGratisSpot =
    isGratisSpotEffectivelyAvailable &&
    !userHasConfirmedActivityToday && // You can join a gratis spot even if you have another confirmed activity
    !isUserBookedInThisOption &&
    hasEnoughPointsForGratis;

  const spotAvatarBaseClasses = "h-10 w-10 rounded-full flex items-center justify-center transition-all duration-150 border";
  const spotButtonBaseClasses = "h-10 w-10 rounded-full flex items-center justify-center transition-all duration-150 border-2 border-dashed";

  let spotDisplayElement;
  let actionHandler: (() => void) | undefined;
  let isDisabled = isLoading;
  let tooltipText = "";
  let iconToShow;
  
  const pointsBaseValues: { [key in 1 | 2 | 3 | 4]: number[] } = {
      1: [10],
      2: [8, 7],
      3: [5, 4, 3],
      4: [3, 2, 1, 0]
  };

  const nextPlayerIndexInOption = spotIndex; // Calculate points for this specific spot index
  const basePoints = (pointsBaseValues[optionSize] || [])[nextPlayerIndexInOption] ?? 0;
  
  const daysInAdvance = differenceInDays(startOfDay(new Date(currentSlot.startTime)), startOfDay(new Date()));
  const anticipationPoints = Math.max(0, daysInAdvance);
  
  const totalPointsToAward = basePoints + anticipationPoints;
  const shouldShowPointsBonus = showPointsBonus && totalPointsToAward > 0 && !isDesignatedGratisSpot && canJoinThisSpotStandard;


  if (playerInSpot) {
    const student = getMockStudents().find(u => u.id === playerInSpot.userId);
    const playerName = student?.name || getPlaceholderUserName(playerInSpot.userId, currentUser?.id, currentUser?.name || 'Tú');
    tooltipText = playerName;
    spotDisplayElement = (
        <TooltipProvider delayDuration={100}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="relative">
                        <Avatar className={cn(spotAvatarBaseClasses, "p-0 overflow-hidden shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.2)]", isCurrentUserInSpot ? "ring-2 ring-offset-1 ring-primary border-primary" : "border-gray-300")}>
                            <AvatarImage src={student?.profilePictureUrl || `https://randomuser.me/api/portraits/men/${simpleHash(playerInSpot.userId) % 100}.jpg`} alt={tooltipText} data-ai-hint="player avatar small"/>
                            <AvatarFallback className="text-xs">{getInitials(tooltipText)}</AvatarFallback>
                        </Avatar>
                    </div>
                </TooltipTrigger>
                <TooltipContent><p>{tooltipText}</p></TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
  } else {
    if (isLoading) {
      tooltipText = "Procesando...";
      iconToShow = <Loader2 className="h-6 w-6 animate-spin text-primary" />;
      isDisabled = true;
    } else if (canJoinGratisSpot) {
      iconToShow = <Gift className={cn("h-6 w-6 text-yellow-600")} />;
      tooltipText = `Unirse (Gratis con ${pointsCostForGratisSpot} Puntos)`;
      actionHandler = () => onOpenConfirmationDialog(optionSize, spotIndex);
      isDisabled = false;
    } else if (canJoinThisSpotStandard) {
      iconToShow = <Plus className={cn("h-6 w-6 text-green-600")} />;
      tooltipText = `Unirse (Coste: ${pricePerPersonForThisOption.toFixed(2)}€)`;
      actionHandler = () => onOpenConfirmationDialog(optionSize, spotIndex);
      isDisabled = false;
    } else { // Spot cannot be joined, determine specific reason
      iconToShow = <Minus className="h-6 w-6 text-gray-400" />;
      isDisabled = true;
      if (isUserBookedInThisOption) {
        tooltipText = "Ya estás inscrito en esta opción de la clase.";
      } else if (userHasConfirmedActivityToday && !isGratisSpotEffectivelyAvailable) { // Allow joining gratis spots even with other activities
        tooltipText = "Ya tienes otra actividad confirmada hoy.";
      } else if (isGratisSpotEffectivelyAvailable && !hasEnoughPointsForGratis) {
        tooltipText = `Puntos insuficientes (${currentUser?.loyaltyPoints ?? 0} / ${pointsCostForGratisSpot}) para plaza gratis.`;
        iconToShow = <Gift className="h-6 w-6 text-yellow-400 opacity-60" />;
      } else if (!isDesignatedGratisSpot && !hasEnoughCredit) {
        tooltipText = `Saldo insuficiente (${(currentUser?.credit ?? 0).toFixed(2)}€ / ${pricePerPersonForThisOption.toFixed(2)}€) para opción de ${optionSize}p.`;
        iconToShow = <CreditCard className="h-6 w-6 text-destructive/70" />;
      } else if (isSlotOverallConfirmed) {
        tooltipText = `Clase ya confirmada (opción de ${confirmedGroupSize}p llena).`;
      } else if (bookedPlayersForOption.length >= optionSize && !isDesignatedGratisSpot) {
        tooltipText = `Opción de ${optionSize}p completa.`;
      } else {
        tooltipText = "No disponible en este momento.";
      }
    }

    spotDisplayElement = (
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              onClick={() => {
                if (isDisabled && tooltipText && !actionHandler) {
                  toast({ title: "Información", description: tooltipText, variant: "default", duration: 4000 });
                }
              }}
               className="relative"
            >
              <Button
                variant="outline" size="icon"
                className={cn(
                  spotButtonBaseClasses,
                  isLoading && "cursor-wait",
                  isDisabled && "opacity-50 cursor-not-allowed",
                  !isDisabled && actionHandler && (isGratisSpotEffectivelyAvailable ? "border-yellow-400 hover:bg-yellow-50 animate-pulse-yellow" : "border-green-400 hover:bg-green-50")
                )}
                onClick={actionHandler} disabled={isDisabled || !actionHandler}
              >
                {iconToShow}
              </Button>
               {shouldShowPointsBonus && (
                <div className={cn("absolute -top-1.5 -right-1 z-10 flex h-auto items-center justify-center rounded-full bg-amber-400 px-1.5 py-0.5 text-white shadow-md text-xs font-bold")} title={`${totalPointsToAward} puntos de bonificación`}>
                    +{totalPointsToAward.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              )}
            </span>
          </TooltipTrigger>
          <TooltipContent><p>{tooltipText}</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-0.5 relative">
      {spotDisplayElement}
    </div>
  );
};

// Helper function
function simpleHash(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}


export default React.memo(BookingSpotDisplay);