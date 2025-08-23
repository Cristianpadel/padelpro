
// src/components/class/BookingSpotDisplay.tsx
"use client";

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, Plus, Gift, CreditCard, Star } from 'lucide-react';
import { cn, getInitials, getPlaceholderUserName } from '@/lib/utils';
import type { User, TimeSlot } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { getMockStudents, calculatePricePerPerson } from '@/lib/mockData';
import { differenceInDays, startOfDay } from 'date-fns';

interface BookingSpotDisplayProps {
  optionSize: 1 | 2 | 3 | 4;
  spotIndex: number;
  bookingsByGroupSize: Record<number, { userId: string; groupSize: 1 | 2 | 3 | 4 }[]>;
  currentUser: User;
  currentSlot: TimeSlot;
  isPendingMap: Record<string, boolean>;
  totalPrice: number;
  isSlotOverallConfirmed: boolean;
  confirmedGroupSize: (1 | 2 | 3 | 4) | null;
  userHasConfirmedActivityToday: boolean;
  isUserBookedInThisOption: boolean;
  onOpenConfirmationDialog: (optionSize: 1 | 2 | 3 | 4, spotIdx: number) => void;
  showPointsBonus: boolean;
}

const BookingSpotDisplay: React.FC<BookingSpotDisplayProps> = ({
  optionSize,
  spotIndex,
  bookingsByGroupSize,
  currentUser,
  currentSlot,
  isPendingMap,
  totalPrice,
  isSlotOverallConfirmed,
  confirmedGroupSize,
  userHasConfirmedActivityToday,
  isUserBookedInThisOption,
  onOpenConfirmationDialog,
  showPointsBonus,
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
  const pointsCostForGratisSpot = calculatePricePerPerson(totalPrice, 1);
  const hasEnoughCredit = (currentUser?.credit ?? 0) - (currentUser?.blockedCredit ?? 0) >= pricePerPersonForThisOption;
  const hasEnoughPointsForGratis = (currentUser?.loyaltyPoints ?? 0) >= pointsCostForGratisSpot;

  const canJoinStandard = !playerInSpot && !isDesignatedGratisSpot && bookedPlayersForOption.length < optionSize && !isSlotOverallConfirmed && !userHasConfirmedActivityToday && !isUserBookedInThisOption && hasEnoughCredit;
  const canJoinGratis = isGratisSpotEffectivelyAvailable && !userHasConfirmedActivityToday && !isUserBookedInThisOption && hasEnoughPointsForGratis;

  const getTooltipText = () => {
    if (isLoading) return "Procesando...";
    const studentName = playerInSpot ? (getMockStudents().find(u => u.id === playerInSpot.userId)?.name || getPlaceholderUserName(playerInSpot.userId, currentUser.id, currentUser.name)) : '';
    if (playerInSpot) return studentName;
    if (isUserBookedInThisOption) return "Ya estás inscrito en esta opción.";
    if (canJoinGratis) return `Unirse (Gratis con ${pointsCostForGratisSpot} Puntos)`;
    if (canJoinStandard) return `Unirse (Coste: ${pricePerPersonForThisOption.toFixed(2)}€)`;
  if (userHasConfirmedActivityToday && !isGratisSpotEffectivelyAvailable) return "Ya tienes una reserva este día. Máximo una reserva por día.";
    if (isGratisSpotEffectivelyAvailable && !hasEnoughPointsForGratis) return `Puntos insuficientes (${currentUser?.loyaltyPoints ?? 0} / ${pointsCostForGratisSpot}).`;
    if (!isDesignatedGratisSpot && !hasEnoughCredit) return `Saldo insuficiente (${((currentUser?.credit ?? 0) - (currentUser?.blockedCredit ?? 0)).toFixed(2)}€ / ${pricePerPersonForThisOption.toFixed(2)}€).`;
    if (isSlotOverallConfirmed) return `Clase confirmada para ${confirmedGroupSize}p.`;
    return "No disponible.";
  };

  const pointsBaseValues: { [key in 1 | 2 | 3 | 4]: number[] } = { 1: [10], 2: [8, 7], 3: [5, 4, 3], 4: [3, 2, 1, 0] };
  const basePoints = (pointsBaseValues[optionSize] || [])[spotIndex] ?? 0;
  const anticipationPoints = differenceInDays(startOfDay(new Date(currentSlot.startTime)), startOfDay(new Date()));
  const totalPointsToAward = basePoints + anticipationPoints;
  const shouldShowPointsBonus = showPointsBonus && totalPointsToAward > 0 && !isDesignatedGratisSpot && !playerInSpot && canJoinStandard;

  const handleClick = () => {
    if (playerInSpot || isLoading) return;
    if (canJoinStandard || canJoinGratis) {
      onOpenConfirmationDialog(optionSize, spotIndex);
    } else {
      toast({ title: "Información", description: getTooltipText(), variant: "default", duration: 4000 });
    }
  };

  if (playerInSpot) {
    const student = getMockStudents().find(u => u.id === playerInSpot.userId) 
      || require('@/lib/mockDataSources/state').getMockUserDatabase().find((u: any) => u.id === playerInSpot.userId)
      || null;
    const avatarUrl = student?.profilePictureUrl || null;
    const displayName = student?.name || '';
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative">
              <Avatar className={cn("h-10 w-10 p-0 overflow-hidden shadow-[inset_0_3px_6px_0_rgba(0,0,0,0.4)]", isCurrentUserInSpot ? "border-[3px] border-primary shadow-lg" : "border-gray-300")}>
                <AvatarImage src={avatarUrl || ''} alt={displayName} data-ai-hint="player avatar small" onError={e => { e.currentTarget.style.display = 'none'; }} />
                <AvatarFallback className="text-xs">{getInitials(displayName)}</AvatarFallback>
              </Avatar>
            </div>
          </TooltipTrigger>
          <TooltipContent><p>{getTooltipText()}</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="relative" onClick={handleClick}>
            <Button
              variant="outline" size="icon"
              className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center border-[3px] border-dashed shadow-[inset_0_3px_6px_0_rgba(0,0,0,0.2)]",
                isLoading && "cursor-wait",
                (canJoinStandard || canJoinGratis) ? (canJoinGratis ? "border-yellow-400 hover:bg-yellow-50" : "border-green-400 hover:bg-green-50") : "opacity-50 cursor-not-allowed"
              )}
              disabled={isLoading || !(canJoinStandard || canJoinGratis)}
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : (canJoinGratis ? <Gift className="h-5 w-5 text-yellow-600" /> : <Plus className="h-5 w-5 text-green-600 stroke-[3]" />)}
            </Button>
            {shouldShowPointsBonus && (
              <div className="absolute -top-1 -right-1 z-10 flex h-auto items-center justify-center rounded-full bg-amber-400 px-1 py-0 text-white shadow-md text-[10px] font-bold" title={`${totalPointsToAward} puntos de bonificación`}>
                  +{totalPointsToAward}
              </div>
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent><p>{getTooltipText()}</p></TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default React.memo(BookingSpotDisplay);
