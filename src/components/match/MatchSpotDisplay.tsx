// src/components/match/MatchSpotDisplay.tsx
"use client";

import React from 'react';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { User as UserIcon, Plus, Loader2, Gift, CreditCard, AlertTriangle, Lock, Star } from 'lucide-react';
import type { Match, User } from '@/types';
import { cn, getInitials } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getMockStudents, getMockClubs, calculatePricePerPerson } from '@/lib/mockData';
import { differenceInDays, startOfDay } from 'date-fns';

interface MatchSpotDisplayProps {
  spotIndex: number;
  match: Match;
  currentUser: User | null;
  onJoin: (spotIndex: number, usePoints?: boolean) => void;
  onJoinPrivate: () => void;
  isPending: boolean;
  userHasOtherConfirmedActivityToday: boolean;
  isUserLevelCompatible: boolean;
  canJoinThisPrivateMatch: boolean;
  isOrganizer: boolean;
  canBookWithPoints?: boolean;
  showPointsBonus: boolean;
  pricePerPlayer: number;
  pointsToAward: number;
}

const MatchSpotDisplayComponent: React.FC<MatchSpotDisplayProps> = ({
  spotIndex,
  match,
  currentUser,
  onJoin,
  onJoinPrivate,
  isPending,
  userHasOtherConfirmedActivityToday,
  isUserLevelCompatible,
  canJoinThisPrivateMatch,
  isOrganizer,
  canBookWithPoints,
  showPointsBonus,
  pricePerPlayer,
  pointsToAward,
}) => {
    const { toast } = useToast();
    const player = match.bookedPlayers?.[spotIndex];
    const isCurrentUserInSpot = !!(player && currentUser && player.userId === currentUser.id);
    const isMatchFull = (match.bookedPlayers || []).length >= 4;
    const isPlaceholderMatch = match.isPlaceholder === true;
    
    const pointsCost = match.isPointsOnlyBooking 
        ? (calculatePricePerPerson(match.totalCourtFee, 4) || 20) // Use price if available, else fallback
        : pricePerPlayer;

    let spotTooltipText = "";
    let iconToShow: React.ReactNode = <UserIcon className="h-5 w-5 text-muted-foreground opacity-50" />;
    let spotVariant: "solid" | "dashed" | "gratis" = "dashed";
    let isDisabled = true;
    let animationClass = "";
    
    const isUserAlreadyBooked = !!(currentUser && (match.bookedPlayers || []).some(p => p.userId === currentUser.id));
    const availableCredit = (currentUser?.credit ?? 0) - (currentUser?.blockedCredit ?? 0);
    const hasEnoughCredit = availableCredit >= pricePerPlayer;
    const hasEnoughPoints = (currentUser?.loyaltyPoints ?? 0) >= pointsCost;

    const isMatchBookableWithPoints = canBookWithPoints && isPlaceholderMatch;
    const isPointsBonusVisible = showPointsBonus && !isMatchBookableWithPoints && pointsToAward > 0 && !player && !isMatchFull;


    let actionHandler = () => {
        if (!currentUser) {
            toast({ title: "Acción Requerida", description: 'Por favor, inicia sesión para unirte a la partida.', variant: "default" });
            return;
        }
        if (isDisabled && spotTooltipText) {
            toast({ title: "Información", description: spotTooltipText, variant: "default", duration: 4000 });
        }
    };


    if (player) {
        spotTooltipText = `${player.name || 'Jugador'}${isCurrentUserInSpot ? ' (Tú)' : ''}`;
        spotVariant = "solid";
        isDisabled = true; 
    } else if (isPending) {
        iconToShow = <Loader2 className="h-5 w-5 animate-spin text-primary" />;
        spotTooltipText = "Procesando...";
        isDisabled = true;
    } else if (isUserAlreadyBooked) {
        spotTooltipText = "Ya estás inscrito en esta partida.";
        isDisabled = true;
    } else if (userHasOtherConfirmedActivityToday) {
        spotTooltipText = "Ya tienes otra actividad confirmada hoy.";
        isDisabled = true;
    } else if (match.status === 'confirmed_private') {
        if(canJoinThisPrivateMatch) {
            iconToShow = <UserIcon className="h-5 w-5 text-purple-600" />;
            spotTooltipText = `Unirme a esta Partida Privada (Coste: ${pricePerPlayer.toFixed(2)}€)`;
            spotVariant = "gratis";
            isDisabled = false;
            actionHandler = () => {
                if (!currentUser) { toast({ title: "Acción Requerida", description: 'Por favor, inicia sesión para unirte.' }); return; }
                onJoinPrivate();
            };
        } else if (!isOrganizer) {
            spotTooltipText = "Partida privada. Necesitas invitación.";
            iconToShow = <Lock className="h-5 w-5 text-purple-500 opacity-70"/>;
            isDisabled = true;
        } else {
             spotTooltipText = "Plaza libre para tu invitado.";
             isDisabled = true;
        }
    } else { 
        const isThisSpotTheGratisOne = match.gratisSpotAvailable && (match.bookedPlayers || []).length === 3;
        
        if (isThisSpotTheGratisOne) {
            if (!isUserLevelCompatible) {
                iconToShow = <Gift className="h-5 w-5 text-purple-400 opacity-60" />;
                spotTooltipText = `Nivel incompatible (${currentUser?.level || 'N/A'}) para plaza gratis.`;
                spotVariant = "gratis";
                isDisabled = true;
            } else if (hasEnoughPoints) {
                iconToShow = <Gift className="h-5 w-5 text-purple-600" />;
                spotTooltipText = `Unirse (Coste: ${pointsCost} Puntos)`;
                spotVariant = "gratis";
                isDisabled = false;
                actionHandler = () => onJoin(spotIndex, true);
                animationClass = "animate-pulse-purple";
            } else {
                iconToShow = <Gift className="h-5 w-5 text-purple-400 opacity-60" />;
                spotTooltipText = `Puntos insuficientes (${currentUser?.loyaltyPoints ?? 0} / ${pointsCost}) para plaza gratis.`;
                spotVariant = "gratis";
                isDisabled = true;
            }
        } else if (match.isPointsOnlyBooking || (canBookWithPoints && isPlaceholderMatch)) {
            if (!isUserLevelCompatible) {
                iconToShow = <Gift className="h-5 w-5 text-purple-400 opacity-60" />;
                spotTooltipText = `Nivel incompatible (${currentUser?.level || 'N/A'}) para plaza de puntos.`;
                spotVariant = "gratis";
                isDisabled = true;
            } else if (hasEnoughPoints) {
                iconToShow = <Gift className="h-5 w-5 text-purple-600" />;
                spotTooltipText = `Reservar Plaza (Coste: ${pointsCost} Puntos)`;
                spotVariant = "gratis";
                isDisabled = false;
                actionHandler = () => onJoin(spotIndex, true); 
                animationClass = "animate-pulse-purple";
            } else {
                iconToShow = <Gift className="h-5 w-5 text-purple-400 opacity-60" />;
                spotTooltipText = `Puntos insuficientes (${currentUser?.loyaltyPoints ?? 0} / ${pointsCost}) para reservar la plaza.`;
                spotVariant = "gratis";
                isDisabled = true;
            }
        } else if (isMatchFull) {
            spotTooltipText = "Partida Completa.";
            isDisabled = true;
        } else if (!isUserLevelCompatible) {
            iconToShow = <AlertTriangle className="h-5 w-5 text-destructive/70" />;
            spotTooltipText = `Nivel incompatible (${currentUser?.level || 'N/A'}).`;
            isDisabled = true;
        } else if (hasEnoughCredit) {
            iconToShow = <Plus className="h-5 w-5 text-green-600 stroke-[3]" />;
            spotTooltipText = isPlaceholderMatch ? `Iniciar Partida (Coste: ${pricePerPlayer.toFixed(2)}€)` : `Unirse (Coste: ${pricePerPlayer.toFixed(2)}€)`;
            isDisabled = false;
            actionHandler = () => onJoin(spotIndex, false);
        } else {
            iconToShow = <CreditCard className="h-5 w-5 text-destructive/70" />;
            spotTooltipText = `Saldo disponible insuficiente (${availableCredit.toFixed(2)}€ / ${pricePerPlayer.toFixed(2)}€).`;
            isDisabled = true;
        }
    }
    
    const fullPlayer = player ? (getMockStudents().find(s => s.id === player.userId) || (currentUser?.id === player.userId ? currentUser : null)) : null;
    const playerLevelDisplay = fullPlayer?.level && fullPlayer.level !== 'abierto' ? fullPlayer.level : (fullPlayer ? '?' : '');
    
     const spotLabel = player
      ? (player.name || 'Jugador').split(' ')[0]
      : (match.gratisSpotAvailable && (match.bookedPlayers || []).length === 3 && !player)
      ? "Gratis"
      : (pricePerPlayer > 0 ? `${pricePerPlayer.toFixed(2)}€` : "");


    return (
        <TooltipProvider delayDuration={100}>
        <Tooltip>
            <TooltipTrigger asChild>
                <div
                    onClick={actionHandler}
                    className={cn( "flex flex-col items-center group/avatar-wrapper space-y-0.5 relative", !isDisabled ? "cursor-pointer" : "cursor-not-allowed")}
                    aria-label={spotTooltipText}
                >
                    <div className={cn(
                        "relative inline-flex items-center justify-center h-12 w-12 rounded-full border-[3px] z-0 transition-all shadow-[inset_0_3px_6px_0_rgba(0,0,0,0.4)]",
                        animationClass,
                        spotVariant === "solid" && "bg-slate-100 border-slate-300",
                        spotVariant === "dashed" && "border-dashed border-green-400 hover:bg-green-100",
                        spotVariant === "gratis" && "border-solid border-purple-500 bg-purple-100 hover:bg-purple-200",
                        isCurrentUserInSpot && "border-4 border-primary shadow-lg",
                        isDisabled && !player && 'opacity-70 hover:bg-transparent'
                    )}>
                        {player ? (
                            <>
                                <Avatar className="h-[calc(100%-4px)] w-[calc(100%-4px)]">
                                    <AvatarImage src={fullPlayer?.profilePictureUrl} alt={`Avatar ${player.name}`} data-ai-hint="player avatar large"/>
                                    <AvatarFallback className="text-sm">{getInitials(player.name || 'P')}</AvatarFallback>
                                </Avatar>
                            </>
                        ) : iconToShow}
                        {player && playerLevelDisplay && (
                            <div className="absolute -top-1.5 -right-1.5 bg-background text-foreground border border-border rounded-md px-1 py-0.5 text-[10px] font-bold shadow-md z-20">{playerLevelDisplay}</div>
                        )}
                        {isPointsBonusVisible && (
                            <div className={cn("absolute -top-1 -right-1 flex h-auto items-center justify-center rounded-full bg-amber-400 px-1 py-0 text-white shadow-md text-[10px] font-bold")} title={`${pointsToAward} puntos de bonificación`}>
                                +{pointsToAward.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                        )}
                    </div>
                     <span className={cn(
                        "text-[10px] font-medium truncate w-auto max-w-[60px] text-center",
                        player ? "text-foreground" : "text-muted-foreground",
                         (match.gratisSpotAvailable && (match.bookedPlayers || []).length === 3 && !player) && "text-purple-600 font-bold",
                         canJoinThisPrivateMatch && !player && "text-purple-600 font-bold",
                         (match.isPointsOnlyBooking || (canBookWithPoints && isPlaceholderMatch)) && !player && "text-purple-600 font-bold"
                     )}>{spotLabel}</span>
                </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs p-1.5">{spotTooltipText}</TooltipContent>
        </Tooltip>
        </TooltipProvider>
    );
};

export const MatchSpotDisplay = React.memo(MatchSpotDisplayComponent);
