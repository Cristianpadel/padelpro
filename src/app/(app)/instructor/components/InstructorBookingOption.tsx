"use client";

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, Gift, UserCircle as UserIconPlaceholder, XCircle, Info, CheckCircle } from 'lucide-react';
import type { TimeSlot } from '@/types';
import { getInitials, getPlaceholderUserName, calculatePricePerPerson } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { isSlotEffectivelyCompleted } from '@/lib/mockData';

interface InstructorBookingOptionProps {
  slot: TimeSlot;
  optionSize: 1 | 2 | 3 | 4;
  playersInThisOption: { userId: string; groupSize: 1 | 2 | 3 | 4 }[];
  isSlotCompletedOverall: boolean;
  isProcessingAction: boolean;
  processingActionKey?: string | null;
  onOpenStudentSelect: (slot: TimeSlot, optionSize: 1 | 2 | 3 | 4, spotIndexVisual: number) => void;
  onToggleGratis: (slotId: string, optionSize: 1 | 2 | 3 | 4, spotIndexVisual: number) => void;
  onRemoveBooking: (slotId: string, userId: string, groupSize: 1 | 2 | 3 | 4) => void;
  isCancellingClass: boolean;
}

const InstructorBookingOption: React.FC<InstructorBookingOptionProps> = ({
  slot,
  optionSize,
  playersInThisOption,
  isSlotCompletedOverall,
  isProcessingAction,
  processingActionKey,
  onOpenStudentSelect,
  onToggleGratis,
  onRemoveBooking,
  isCancellingClass,
}) => {
  const { toast } = useToast();

  const renderSpots = () => {
    return Array.from({ length: optionSize }).map((_, spotIndex) => {
      const playerInThisSpot = playersInThisOption[spotIndex];
      const isThisSpotDesignatedGratisPlaceholder = slot.designatedGratisSpotPlaceholderIndexForOption?.[optionSize] === spotIndex;
      const isSpotEmptyAndDesignatedGratis = !playerInThisSpot && isThisSpotDesignatedGratisPlaceholder;

      const spotSpecificActionKeySuffix = `${optionSize}-${spotIndex}`;
      const gratisToggleActionKey = `gratis-${slot.id}-${spotSpecificActionKeySuffix}`;
      const removeActionKey = playerInThisSpot ? `remove-${slot.id}-${playerInThisSpot.userId}-${playerInThisSpot.groupSize}` : '';

      const isThisSpotActionProcessing =
        processingActionKey === gratisToggleActionKey ||
        (playerInThisSpot && processingActionKey === removeActionKey);

      if (playerInThisSpot) {
        const playerName = getPlaceholderUserName(playerInThisSpot.userId, undefined, undefined);
        return (
          <div key={`player-${optionSize}-${spotIndex}`} className="flex flex-col items-center text-center">
            <Avatar className="h-10 w-10">
              <AvatarImage src={`https://picsum.photos/seed/${playerInThisSpot.userId}/40/40`} alt={playerName} data-ai-hint="student profile photo medium"/>
              <AvatarFallback>{getInitials(playerName)}</AvatarFallback>
            </Avatar>
            <span className="text-[10px] mt-0.5 truncate w-full">{playerName.split(' ')[0]}</span>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="link" size="xs" className="text-destructive h-auto p-0 text-[10px] leading-tight" disabled={isProcessingAction || isCancellingClass || isThisSpotActionProcessing}>
                  {isThisSpotActionProcessing && processingActionKey === removeActionKey ? <Loader2 className="h-3 w-3 animate-spin"/> : 'Eliminar'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Confirmar Eliminación?</AlertDialogTitle>
                  <AlertDialogDescription>Eliminar inscripción de <span className="font-semibold">{playerName}</span> (Clase de {playerInThisSpot.groupSize})?</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isThisSpotActionProcessing && processingActionKey === removeActionKey}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onRemoveBooking(slot.id, playerInThisSpot.userId, playerInThisSpot.groupSize)} disabled={isThisSpotActionProcessing && processingActionKey === removeActionKey} className="bg-destructive hover:bg-destructive/90">
                    {(isThisSpotActionProcessing && processingActionKey === removeActionKey) ? <Loader2 className="animate-spin" /> : "Eliminar"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      } else if (isSpotEmptyAndDesignatedGratis) {
        return (
          <div key={`gratis-${optionSize}-${spotIndex}`} className="flex flex-col items-center space-y-0.5">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-yellow-100 border-2 border-yellow-400 animate-pulse-yellow">
              <Gift className="h-5 w-5 text-yellow-600" />
            </div>
            <span className="text-[10px] font-semibold text-yellow-600">Gratis</span>
            <Button
              variant="outline" size="xs"
              className="text-destructive border-destructive hover:bg-destructive/10 h-auto py-0.5 px-1 text-[9px] leading-tight"
              onClick={() => onToggleGratis(slot.id, optionSize, spotIndex)}
              disabled={isProcessingAction || isCancellingClass || isThisSpotActionProcessing || isSlotCompletedOverall}
            >
              {isThisSpotActionProcessing && processingActionKey === gratisToggleActionKey ? <Loader2 className="h-3 w-3 animate-spin"/> : <><XCircle className="mr-0.5 h-3 w-3" /> Quitar Gratis</>}
            </Button>
          </div>
        );
      } else {
        return (
          <div key={`empty-${optionSize}-${spotIndex}`} className="flex flex-col items-center space-y-0.5">
             <TooltipProvider delayDuration={150}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline" size="icon"
                            className={cn(
                                "h-10 w-10 rounded-full p-0 flex items-center justify-center border-dashed hover:bg-primary/5",
                                (isProcessingAction || isCancellingClass || isThisSpotActionProcessing || isSlotCompletedOverall || playersInThisOption.length >= optionSize) && "opacity-50 cursor-not-allowed"
                            )}
                            onClick={() => {
                                if (!(isProcessingAction || isCancellingClass || isThisSpotActionProcessing || isSlotCompletedOverall || playersInThisOption.length >= optionSize)) {
                                    toast({
                                        title: "Inscripción Individual",
                                        description: "Los alumnos se inscriben individualmente a través de su propia aplicación.",
                                        duration: 5000,
                                    });
                                }
                            }}
                             disabled={isProcessingAction || isCancellingClass || isThisSpotActionProcessing || isSlotCompletedOverall || playersInThisOption.length >= optionSize}
                        >
                          {isThisSpotActionProcessing ? <Loader2 className="h-4 w-4 animate-spin"/> : <Info className="h-5 w-5 text-muted-foreground group-hover/option:text-primary" />}
                          <span className="sr-only">Información de Reserva</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                        <p>Inscripción individual por alumno.</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <span className="text-[10px] text-muted-foreground">Libre</span>
            <Button
              variant="link" size="xs"
              className="h-auto py-0 px-1 text-[9px] leading-tight text-yellow-600 hover:text-yellow-700/80"
              onClick={() => onToggleGratis(slot.id, optionSize, spotIndex)}
              disabled={isProcessingAction || isCancellingClass || isThisSpotActionProcessing || isSlotCompletedOverall || playersInThisOption.length >= optionSize}
            >
              {isThisSpotActionProcessing && processingActionKey === gratisToggleActionKey ? <Loader2 className="h-3 w-3 animate-spin"/> : <><Gift className="mr-0.5 h-3 w-3" /> Ofrecer Gratis</>}
            </Button>
          </div>
        );
      }
    });
  };

  const pricePerPersonForOption = calculatePricePerPerson(slot.totalPrice, optionSize);
  const { completed: isOptionNowCompleted, size: completedSize } = isSlotEffectivelyCompleted(slot);
  const isThisTheCompletedOption = isOptionNowCompleted && completedSize === optionSize;

  return (
     <div className={cn("flex items-center justify-between py-1.5 px-2 rounded-md bg-background/60 group/option hover:bg-background transition-colors", isThisTheCompletedOption && "bg-green-100/50 border border-green-200")}>
      <div className="flex items-center gap-4 flex-grow-0 shrink-0 basis-auto justify-start">
        {renderSpots()}
      </div>
      <div className="flex flex-col items-end text-right pl-1 basis-auto">
        <span className="text-sm font-semibold text-gray-700">
          {pricePerPersonForOption.toFixed(2)}€ <span className="font-normal text-gray-500 text-xs">p.p.</span>
        </span>
        <div className="flex items-center">
          <span className={cn("text-xs font-medium", isThisTheCompletedOption ? "text-green-700" : "text-gray-500")}>
            ({playersInThisOption.length}/{optionSize})
          </span>
          {isThisTheCompletedOption && (
            <CheckCircle className="h-4 w-4 text-green-600 ml-1" />
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(InstructorBookingOption);
