// src/components/match/MatchCard.tsx
"use client";

import React, { useState, useMemo, useEffect, useCallback, useTransition } from 'react';
import type { Match, User, Club, PadelCourt } from '@/types';
import { getMockStudents, getMockClubs, getMockUserDatabase, bookMatch, calculateActivityPrice, getCourtAvailabilityForInterval, isUserLevelCompatibleWithActivity, confirmMatchAsPrivate, fillMatchAndMakePrivate, createFixedMatchFromPlaceholder, makeMatchPublic } from '@/lib/mockData';
import { isMatchBookableWithPoints } from '@/lib/mockDataSources/utils';
import { displayClassCategory } from '@/types';
import { format, differenceInMinutes, differenceInDays, startOfDay, parse, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn, getInitials, getPlaceholderUserName, calculatePricePerPerson, hexToRgba } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from '@/components/ui/input';
import { Clock, Users, Loader2, Gift, CreditCard, AlertTriangle, Lock, Star, Share2, Hash, Users2, Venus, Mars, BarChartHorizontal, Lightbulb, Euro, Trophy, PiggyBank, ThumbsUp, Scissors, CalendarDays, Plus } from 'lucide-react';
import { MatchSpotDisplay } from '@/components/match/MatchSpotDisplay';
import CourtAvailabilityIndicator from '@/components/class/CourtAvailabilityIndicator';
import { hasAnyActivityForDay, countUserConfirmedActivitiesForDay } from '@/lib/mockData';

const InfoDialog: React.FC<{
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  icon: React.ElementType;
}> = ({ isOpen, onOpenChange, title, description, icon: Icon }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <Icon className="mr-3 h-6 w-6 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 text-base text-muted-foreground leading-relaxed whitespace-pre-line">
            {description.split('\n').map((item, key) => (
                <p key={key} className="mb-2">{`• ${item}`}</p>
            ))}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button className="w-full">¡Entendido!</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface MatchCardProps {
  match: Match;
  currentUser: User | null;
  onBookingSuccess: () => void;
  onMatchUpdate: (updatedMatch: Match) => void;
  matchShareCode?: string | null;
  showPointsBonus: boolean;
    allowCreateFixedWeekly?: boolean;
    // Optional: enable inline X remove buttons on player avatars (used in Mi agenda for fixed matches)
    inlineRemovalEnabled?: boolean;
    onRemovePlayer?: (userId: string) => void;
    // Optional compact layout for mobile (Mi agenda)
    compact?: boolean;
}

const InfoButton: React.FC<{
    icon: React.ElementType;
    text: string;
    onClick: () => void;
    className?: string;
}> = ({ icon: Icon, text, onClick, className }) => (
    <button className="flex-1" onClick={onClick}>
        <Badge variant="outline" className={cn("w-full justify-center text-xs py-1.5 rounded-full capitalize shadow-inner bg-slate-50 border-slate-200 hover:border-slate-300 transition-colors", className)}>
            <Icon className="mr-1.5 h-3 w-3 text-slate-500" /> 
            <span className="font-medium text-slate-700">{text}</span>
        </Badge>
    </button>
);


interface MatchCardContentComponentProps extends MatchCardProps {
    currentUser: User;
    clubInfo: Club;
}

// This is the inner component that contains all the logic and hooks.
// It will only be rendered when currentUser and clubInfo are available.
const MatchCardContentComponent: React.FC<MatchCardContentComponentProps> = React.memo(({ match: initialMatch, currentUser, clubInfo, onBookingSuccess, onMatchUpdate, showPointsBonus, allowCreateFixedWeekly, inlineRemovalEnabled, onRemovePlayer, compact }) => {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [currentMatch, setCurrentMatch] = useState<Match>(initialMatch);
    const [courtAvailability, setCourtAvailability] = useState<{ available: PadelCourt[], occupied: PadelCourt[], total: number }>({ available: [], occupied: [], total: 0 });
    const [infoDialog, setInfoDialog] = useState<{ open: boolean, title: string, description: string, icon: React.ElementType }>({ open: false, title: '', description: '', icon: Lightbulb });
    // Private reservation state (only for normal matches)
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [dialogContent, setDialogContent] = useState<{ isJoiningWithPoints: boolean, pointsCost: number, price: number, spotIndex: number }>({ isJoiningWithPoints: false, pointsCost: 0, price: 0, spotIndex: 0 });
    const [isConfirmPrivateDialogOpen, setIsConfirmPrivateDialogOpen] = useState(false);
    const [isMakePrivateDialogOpen, setIsMakePrivateDialogOpen] = useState(false);
    const [isProcessingPrivateAction, setIsProcessingPrivateAction] = useState(false);
    // Removed fixed-weekly state
    const [pendingLevel, setPendingLevel] = useState<string | null>(null);
    const [pendingCategory, setPendingCategory] = useState<'abierta' | 'chico' | 'chica' | null>(null);
    const [isSavingConfig, setIsSavingConfig] = useState(false);
    const [isStartingFixedProcessing, setIsStartingFixedProcessing] = useState(false);
    const [isFixedReserveDialogOpen, setIsFixedReserveDialogOpen] = useState(false);
    const [reserveAsPlayer, setReserveAsPlayer] = useState<boolean | null>(null);
    const [isMakingPublic, setIsMakingPublic] = useState(false);

    useEffect(() => {
        const loadAvailability = async () => {
            if (!clubInfo) return;
            // Skip availability fetch in compact contexts (Mi agenda)
            if (compact) return;
            const availability = await getCourtAvailabilityForInterval(
                initialMatch.clubId,
                new Date(initialMatch.startTime),
                new Date(initialMatch.endTime)
            );
            setCourtAvailability(availability);
        };
        loadAvailability();
        setCurrentMatch(initialMatch);
    }, [initialMatch, clubInfo, compact]);

    const isUserBooked = useMemo(() => (currentMatch.bookedPlayers || []).some(p => p.userId === currentUser?.id), [currentMatch.bookedPlayers, currentUser?.id]);
    const isOrganizer = currentUser?.id === currentMatch.organizerId;
    const isPlaceholderMatch = currentMatch.isPlaceholder === true;
    const isPrivateMatch = currentMatch.status === 'confirmed_private';
    const canJoinThisPrivateMatch = false; // private join flow removed
    // Bloquear unirse a cualquier actividad de ese día si ya hay alguna RESERVA confirmada ese mismo día
    const userHasOtherConfirmedActivityToday = useMemo(() => {
        if (!currentUser) return false;
        const activityDate = new Date(currentMatch.startTime);
        // For fixed matches, allow multiple reservations even if another confirmed exists; keep block for normals
        if (currentMatch.isFixedMatch) return false;
        // Exclude this same activity (match) from the count
        return countUserConfirmedActivitiesForDay(currentUser.id, activityDate, currentMatch.id, 'match') > 0;
    }, [currentUser, currentMatch.startTime, currentMatch.id, currentMatch.isFixedMatch]);


    const pricePerPlayer = useMemo(() => {
        if (clubInfo) {
            const courtPrice = calculateActivityPrice(clubInfo, new Date(currentMatch.startTime));
            return calculatePricePerPerson(courtPrice, 4);
        }
        return 0;
    }, [clubInfo, currentMatch.startTime]);

    const pointsToAward = useMemo(() => {
        if (!isPlaceholderMatch || isUserBooked || !showPointsBonus) return 0;
        const clubPointSettings = clubInfo?.pointSettings;
        if (!clubPointSettings) return 0;
        const basePoints = clubPointSettings.firstToJoinMatch || 0;
        const daysInAdvance = Math.max(0, differenceInDays(startOfDay(new Date(currentMatch.startTime)), startOfDay(new Date())));
        return basePoints + daysInAdvance;
    }, [isPlaceholderMatch, isUserBooked, currentMatch.startTime, clubInfo, showPointsBonus]);

    const handleJoinClick = (spotIndex: number, isJoiningWithPoints = false) => {
            if(!currentUser) return;
                    // For fixed matches, run direct reserve flow
                    if (currentMatch.isFixedMatch) {
                        if (!currentMatch.isFixedMatch && userHasOtherConfirmedActivityToday) {
                            toast({ title: 'No disponible', description: 'Ya tienes otra actividad confirmada hoy.', variant: 'destructive' });
                            return;
                        }
                        // If it's a placeholder, ask confirmation before reserving
                        if (currentMatch.isPlaceholder) {
                            setReserveAsPlayer(null);
                            setIsFixedReserveDialogOpen(true);
                            return;
                        }
                        // Non-placeholder fixed flow (rare) keeps old behavior
                        setIsStartingFixedProcessing(true);
                        startTransition(async () => {
                            try {
                                const resJoin = await bookMatch(currentUser.id, currentMatch.id, false);
                                if ('error' in resJoin) {
                                    toast({ title: 'No inscrito', description: resJoin.error, variant: 'destructive' });
                                    return;
                                }
                                const resPriv = await fillMatchAndMakePrivate(currentUser.id, currentMatch.id);
                                if ('error' in resPriv) {
                                    toast({ title: 'No reservado', description: resPriv.error, variant: 'destructive' });
                                    return;
                                }
                                const updatedMatch = resPriv.updatedMatch;
                                setCurrentMatch(updatedMatch);
                                onMatchUpdate?.(updatedMatch);
                                toast({ title: 'Pista reservada', description: 'Has creado la partida fija y reservado la pista.' });
                            } finally {
                                setIsStartingFixedProcessing(false);
                            }
                        });
                        return;
                    }
            const pointsCostForSpot = isJoiningWithPoints ? (calculatePricePerPerson(currentMatch.totalCourtFee, 4) || 20) : 0;
            setDialogContent({ spotIndex, isJoiningWithPoints, pointsCost: pointsCostForSpot, price: pricePerPlayer });
            setShowConfirmDialog(true);
        };

    const handleConfirmJoin = () => {
        if (!currentUser) return;
        startTransition(async () => {
            const result = await bookMatch(currentUser.id, currentMatch.id, dialogContent.isJoiningWithPoints);
            if ('error' in result) {
                toast({ title: 'Error al Unirse', description: result.error, variant: 'destructive' });
            } else {
                toast({ title: '¡Inscrito!', description: 'Te has unido a la partida.', className: 'bg-primary text-primary-foreground' });
                // Refrescar la tarjeta con el match actualizado inmediatamente
                if (result.updatedMatch) {
                    setCurrentMatch(result.updatedMatch);
                    onMatchUpdate?.(result.updatedMatch);
                }
                onBookingSuccess();
            }
            setShowConfirmDialog(false);
        });
    };

    // removed private flows

    const handleInfoClick = (type: 'level' | 'court' | 'category') => {
        let dialogData;
        const CategoryIconDisplay = currentMatch.category === 'chica' ? Venus : currentMatch.category === 'chico' ? Mars : Users2;

        switch (type) {
            case 'level':
                 dialogData = { title: 'Nivel', description: `El nivel de la partida lo define el primer jugador que se inscribe.\nEsto asegura que las partidas sean siempre equilibradas.`, icon: Lightbulb };
                 break;
            case 'court':
                 dialogData = { title: 'Pista', description: `La pista se asigna automáticamente solo cuando la partida está completa (4 jugadores).\nRecibirás una notificación con el número de pista cuando se confirme.`, icon: Hash };
                 break;
            case 'category':
                 dialogData = { title: 'Categoría', description: `La categoría (chicos/chicas) la sugiere el primer jugador que se apunta.\nNo es una regla estricta, solo una guía para los demás.`, icon: CategoryIconDisplay };
                 break;
        }
        setInfoDialog({ open: true, ...dialogData });
    };

    // Buttons removed; use avatar self-join instead
    const isBookableWithPointsBySchedule = clubInfo.pointBookingSlots && isMatchBookableWithPoints(currentMatch, clubInfo);

    const matchLevelToDisplay = useMemo(() => {
        const level = isPlaceholderMatch ? 'abierto' : currentMatch.level || 'abierto';
        if (level === 'abierto') return 'Abierto';

        const numericLevel = parseFloat(level);
        if (isNaN(numericLevel)) return level;

        const range = clubInfo.levelRanges?.find(r => numericLevel >= parseFloat(r.min) && numericLevel <= parseFloat(r.max));
        return range ? `${range.min}-${range.max}` : level;
    }, [isPlaceholderMatch, currentMatch.level, clubInfo.levelRanges]);
    
    const matchCategoryToDisplay = isPlaceholderMatch ? 'abierta' : currentMatch.category || 'abierta';
    
    const shadowEffect = clubInfo?.cardShadowEffect;
    const shadowStyle = shadowEffect?.enabled 
        ? { boxShadow: `0 0 25px ${hexToRgba(shadowEffect.color, shadowEffect.intensity)}` } 
        : {};

    const cardBorderClass = currentMatch.isFixedMatch
        ? 'border-l-indigo-500'
        : (currentMatch.isProMatch ? 'border-l-amber-500' : 'border-l-green-400');

    const isLevelAssigned = !isPlaceholderMatch && currentMatch.level !== 'abierto';
    const isCategoryAssigned = !isPlaceholderMatch && currentMatch.category !== 'abierta';
    const isCourtAssigned = !!currentMatch.courtNumber;
    const playerCount = (currentMatch.bookedPlayers?.filter(p => p.userId && p.userId.trim() !== '').length ?? 0);
    const zeroPlayers = playerCount === 0;
    const classifiedBadgeClass = 'text-blue-700 border-blue-200 bg-blue-100 hover:border-blue-300';
    const CategoryIconDisplay = currentMatch.category === 'chica' ? Venus : currentMatch.category === 'chico' ? Mars : Users2;
    const courtDisplay = isCourtAssigned ? `# ${currentMatch.courtNumber}` : '# Pista';

    const dayBlocked = userHasOtherConfirmedActivityToday;
    const isPrivateFixed = currentMatch.isFixedMatch && currentMatch.status === 'confirmed_private';
    return (
        <>
            <Card className={cn("w-full transition-shadow duration-300 flex flex-col bg-card border-l-4", cardBorderClass, dayBlocked && "opacity-60") } style={shadowStyle}>
                <CardHeader className={cn("pb-2", compact ? "pt-2 px-2" : "pt-3 px-3") }>
                    <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 text-center font-bold bg-white p-1 rounded-md w-14 shadow-lg border border-border/20">
                                <p className="text-xs uppercase">{format(new Date(currentMatch.startTime), "EEE", { locale: es })}</p>
                                <p className="text-3xl leading-none">{format(new Date(currentMatch.startTime), "d")}</p>
                                <p className="text-xs uppercase">{format(new Date(currentMatch.startTime), "MMM", { locale: es })}</p>
                            </div>
                            <div className="flex flex-col">
                                <span className={cn("font-semibold", compact ? "text-base" : "text-lg")}>{format(new Date(currentMatch.startTime), 'HH:mm')}h</span>
                                <span className={cn("text-muted-foreground flex items-center", compact ? "text-xs" : "text-sm") }><Clock className="mr-1 h-3.5 w-3.5"/>{currentMatch.durationMinutes || 90} min</span>
                                <span className={cn("text-muted-foreground", compact ? "hidden sm:block text-xs" : "text-sm")}>{clubInfo?.name || 'Club Padel'}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {currentMatch.isFixedMatch && (
                                <div className="flex items-center gap-2">
                                    {/* Avatar + CTA (shows + if user not booked and match not confirmed) or organizer avatar */}
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (!isUserBooked && currentMatch.status !== 'confirmed' && currentMatch.status !== 'confirmed_private') {
                                                            handleJoinClick(0, false);
                                                        }
                                                    }}
                                                    className={cn(
                                                        "inline-flex items-center justify-center rounded-full border bg-white text-slate-700 shadow-lg ring-1",
                                                        compact ? "h-12 w-12" : "h-14 w-14",
                                                        zeroPlayers ? 'border-transparent ring-green-100' : 'border-slate-200 ring-slate-100',
                                                        (!isUserBooked && currentMatch.status !== 'confirmed' && currentMatch.status !== 'confirmed_private') ? 'hover:bg-slate-50 cursor-pointer' : 'cursor-default'
                                                    )}
                                                    aria-label="Reservar partida fija"
                                                >
                                                    <div className="relative">
                                                        <div className={cn(zeroPlayers && "p-1 rounded-full border-2 border-dashed border-green-500 ring-2 ring-green-200")}> 
                                                            <div className="relative">
                                                                <Avatar
                                                                    className={cn(
                                                                        "bg-gradient-to-b from-white to-slate-50",
                                                                        compact ? "h-10 w-10" : "h-12 w-12",
                                                                        zeroPlayers ? "shadow-[inset_0_4px_18px_rgba(0,0,0,0.25)]" : "shadow-sm"
                                                                    )}
                                                                >
                                                                    <AvatarImage
                                                                        loading="lazy"
                                                                        src={(currentMatch.organizerId ? (getMockUserDatabase().find(u => u.id === currentMatch.organizerId)?.profilePictureUrl || '') : '')}
                                                                        alt="Organizador"
                                                                    />
                                                                    <AvatarFallback>
                                                                        {currentMatch.organizerId ? getInitials(getMockUserDatabase().find(u => u.id === currentMatch.organizerId)?.name || 'Org') : ''}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                {zeroPlayers && (
                                                                    <span className="absolute -top-1.5 -left-1.5 z-10 inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-white border border-white ring-2 ring-white shadow-md">
                                                                        <Plus className="h-3.5 w-3.5" />
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {!zeroPlayers && !isUserBooked && currentMatch.status !== 'confirmed' && currentMatch.status !== 'confirmed_private' && (
                                                            <span className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 z-10 inline-flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-white border border-white ring-2 ring-white shadow-md">
                                                                <Plus className="h-3.5 w-3.5" />
                                                            </span>
                                                        )}
                                                    </div>
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent>{isUserBooked ? 'Organizador' : 'Reservar esta partida fija'}</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>

                                    <div className="leading-tight hidden sm:block">
                                        <div className="text-sm font-semibold truncate max-w-[140px]">
                                            {currentMatch.organizerId ? (getMockUserDatabase().find(u => u.id === currentMatch.organizerId)?.name || 'Organizador') : 'Organizador'}
                                        </div>
                                        <div className="text-xs text-muted-foreground flex flex-col items-start gap-1">
                                            <Badge className="px-2 py-0.5 h-5 rounded-full bg-sky-600 text-white">Partida Fija</Badge>
                                            {currentMatch.isFixedMatch && (
                                                isPrivateFixed ? (
                                                    isOrganizer ? (
                                                        <button
                                                            type="button"
                                                            title="Hacer pública"
                                                            onClick={async () => {
                                                                try {
                                                                    setIsMakingPublic(true);
                                                                    const res = await makeMatchPublic(currentUser.id, currentMatch.id);
                                                                    if ('error' in res) {
                                                                        toast({ title: 'No se pudo cambiar', description: res.error, variant: 'destructive' });
                                                                    } else {
                                                                        const updated = res.updatedMatch;
                                                                        setCurrentMatch(updated);
                                                                        onMatchUpdate?.(updated);
                                                                        toast({ title: 'Ahora es pública', description: 'Tu partida fija es visible para otros.', className: 'bg-green-600 text-white' });
                                                                    }
                                                                } finally {
                                                                    setIsMakingPublic(false);
                                                                }
                                                            }}
                                                            className="disabled:opacity-60"
                                                            disabled={isMakingPublic}
                                                        >
                                                            <Badge className="px-2 py-0.5 h-5 rounded-full bg-purple-600 text-white hover:bg-purple-700">Privada</Badge>
                                                        </button>
                                                    ) : (
                                                        <Badge className="px-2 py-0.5 h-5 rounded-full bg-purple-600 text-white">Privada</Badge>
                                                    )
                                                ) : (
                                                    <Badge className="px-2 py-0.5 h-5 rounded-full bg-green-600 text-white">Pública</Badge>
                                                )
                                            )}
                                        </div>
                                    </div>
                                    {/* Share button (Mi agenda y tarjeta principal) */}
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const code = (currentMatch as any).privateShareCode as string | undefined;
                                                        if (!code) {
                                                            toast({ title: 'Sin enlace', description: 'Esta partida no tiene enlace para compartir.', variant: 'destructive' });
                                                            return;
                                                        }
                                                        const shareUrl = `${window.location.origin}/?view=partidas&code=${code}`;
                                                        if (navigator.share) {
                                                            navigator.share({ title: 'Partida fija', url: shareUrl }).catch(() => {});
                                                        }
                                                        navigator.clipboard.writeText(shareUrl)
                                                            .then(() => toast({ title: 'Enlace copiado', description: 'Comparte este enlace con tus amigos.' }))
                                                            .catch(() => toast({ title: 'Error al copiar', description: 'No se pudo copiar el enlace.', variant: 'destructive' }));
                                                    }}
                                                    className={cn('inline-flex items-center justify-center rounded-full border bg-white text-slate-700 shadow-sm hover:bg-slate-50', compact ? 'h-8 w-8' : 'h-9 w-9')}
                                                    aria-label="Compartir partida fija"
                                                >
                                                    <Share2 className={cn(compact ? 'h-4 w-4' : 'h-5 w-5')} />
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent>Compartir</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            )}
                            {!currentMatch.isFixedMatch && (
                                <div className="flex items-center gap-2">
                                    {isPlaceholderMatch && !isPrivateMatch && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsConfirmPrivateDialogOpen(true)}
                                                        className="group inline-flex items-center h-9 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-md pl-1.5 pr-3 transition-colors"
                                                        aria-label="Reservar privada"
                                                    >
                                                        <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                                                            <Plus className="h-4 w-4" />
                                                        </span>
                                                        <span className="flex flex-col leading-tight -my-0.5 text-left">
                                                            <span className="text-xs font-semibold">Reservar</span>
                                                            <span className="text-[10px] opacity-95 -mt-0.5">Privada</span>
                                                        </span>
                                                    </button>
                                                </TooltipTrigger>
                                                <TooltipContent>Reservar privada</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                    {!isPlaceholderMatch && currentMatch.status === 'forming' && isUserBooked && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 rounded-full border-purple-300 text-purple-700 hover:bg-purple-50"
                                                        onClick={() => setIsMakePrivateDialogOpen(true)}
                                                    >
                                                        <Lock className="h-3.5 w-3.5 mr-1.5" />
                                                        Hacer privada
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Confirmar pagando plazas restantes</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                    {isPlaceholderMatch && !isPrivateMatch && (
                                        <Share2 className="h-4 w-4 text-slate-400/80" />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className={cn(compact ? "px-2 pb-2" : "px-3 pb-3") }>
                    <div className={cn("flex items-center flex-wrap", compact ? "gap-1.5" : "gap-2") }>
                        {currentMatch.isFixedMatch ? (
                            <>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        if (isOrganizer && isPrivateFixed) {
                                            try {
                                                setIsMakingPublic(true);
                                                const res = await makeMatchPublic(currentUser.id, currentMatch.id);
                                                if ('error' in res) {
                                                    toast({ title: 'No se pudo cambiar', description: res.error, variant: 'destructive' });
                                                } else {
                                                    const updated = res.updatedMatch;
                                                    setCurrentMatch(updated);
                                                    onMatchUpdate?.(updated);
                                                    toast({ title: 'Ahora es pública', description: 'Tu partida fija es visible para otros.', className: 'bg-green-600 text-white' });
                                                }
                                            } finally {
                                                setIsMakingPublic(false);
                                            }
                                        }
                                    }}
                                    className={cn(
                                        "inline-flex items-center gap-2 rounded-full border shadow-inner",
                                        compact ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
                                        isPrivateFixed
                                            ? 'bg-purple-100 text-purple-700 border-purple-200 hover:border-purple-300'
                                            : 'bg-green-100 text-green-700 border-green-200 hover:border-green-300',
                                        (!isOrganizer || !isPrivateFixed) && 'cursor-default'
                                    )}
                                    disabled={!isOrganizer || !isPrivateFixed || isMakingPublic}
                                >
                                    <span className="inline-block h-2.5 w-2.5 rounded-full"
                                          style={{ backgroundColor: isPrivateFixed ? '#9333ea' : '#16a34a' }}
                                    />
                                    <span className="font-semibold">{isPrivateFixed ? 'Priv.' : 'Púb.'}</span>
                                </button>
                                {compact ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => handleInfoClick('level')}
                                            className={cn(
                                                "inline-flex items-center gap-2 rounded-full border bg-white shadow-inner text-slate-700",
                                                "px-2 py-0.5 text-[11px]",
                                                isLevelAssigned ? classifiedBadgeClass : "border-slate-200 hover:border-slate-300"
                                            )}
                                        >
                                            <span className="font-semibold">Nivel</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleInfoClick('category')}
                                            className={cn(
                                                "inline-flex items-center gap-2 rounded-full border bg-white shadow-inner text-slate-700",
                                                "px-2 py-0.5 text-[11px]",
                                                isCategoryAssigned ? classifiedBadgeClass : "border-slate-200 hover:border-slate-300"
                                            )}
                                        >
                                            <span className="font-semibold">Cat.</span>
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        {/* Principal: solo valores, sin iconos */}
                                        <span
                                            className={cn(
                                                "inline-flex items-center rounded-full border bg-white shadow-inner text-slate-700 px-3 py-1 text-xs font-semibold",
                                                isLevelAssigned ? classifiedBadgeClass : "border-slate-200"
                                            )}
                                        >
                                            {matchLevelToDisplay}
                                        </span>
                                        <span
                                            className={cn(
                                                "inline-flex items-center rounded-full border bg-white shadow-inner text-slate-700 px-3 py-1 text-xs font-semibold",
                                                isCategoryAssigned ? classifiedBadgeClass : "border-slate-200"
                                            )}
                                        >
                                            {(() => {
                                                const cat = matchCategoryToDisplay;
                                                return cat === 'abierta' ? 'Abierta' : cat === 'chico' ? 'Chico' : cat === 'chica' ? 'Chica' : String(cat);
                                            })()}
                                        </span>
                                    </>
                                )}
                                <button
                                    type="button"
                                    onClick={() => handleInfoClick('court')}
                                    className={cn(
                                        "inline-flex items-center gap-2 rounded-full border bg-white shadow-inner text-slate-700",
                                        compact ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
                                        isCourtAssigned ? 'text-green-700 border-green-200 bg-green-100 hover:border-green-300' : 'border-slate-200 hover:border-slate-300'
                                    )}
                                >
                                    <span className="font-semibold">{isCourtAssigned ? `# ${currentMatch.courtNumber}` : '# Pista'}</span>
                                </button>
                            </>
                        ) : (
                            <>
                                {/* Partidas normales: mostrar solo valores y reducir tamaño de chips */}
                                <span
                                    className={cn(
                                        "inline-flex items-center rounded-full border bg-white shadow-inner text-slate-700 font-semibold",
                                        compact ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-0.5 text-[11px]",
                                        isLevelAssigned ? classifiedBadgeClass : "border-slate-200"
                                    )}
                                >
                                    {matchLevelToDisplay}
                                </span>
                                <span
                                    className={cn(
                                        "inline-flex items-center rounded-full border bg-white shadow-inner text-slate-700 font-semibold",
                                        compact ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-0.5 text-[11px]",
                                        isCategoryAssigned ? classifiedBadgeClass : "border-slate-200"
                                    )}
                                >
                                    {(() => {
                                        const cat = matchCategoryToDisplay;
                                        return cat === 'abierta' ? 'Abierta' : cat === 'chico' ? 'Chico' : cat === 'chica' ? 'Chica' : String(cat);
                                    })()}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleInfoClick('court')}
                                    className={cn(
                                        "inline-flex items-center rounded-full border bg-white shadow-inner text-slate-700 font-semibold",
                                        compact ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-0.5 text-[11px]",
                                        isCourtAssigned ? 'text-green-700 border-green-200 bg-green-100 hover:border-green-300' : 'border-slate-200 hover:border-slate-300'
                                    )}
                                >
                                    {isCourtAssigned ? `# ${currentMatch.courtNumber}` : '# Pista'}
                                </button>
                            </>
                        )}
                    </div>
                    <div className={cn("mt-3 grid grid-cols-4", compact ? "gap-2" : "gap-3") }>
                        {[0,1,2,3].map((idx) => (
                            <MatchSpotDisplay
                                key={idx}
                                spotIndex={idx}
                                match={currentMatch}
                                currentUser={currentUser}
                                onJoin={(spot, usePoints) => handleJoinClick(spot, !!usePoints)}
                                onJoinPrivate={() => { /* private flow removed */ }}
                                isPending={isPending}
                                userHasOtherConfirmedActivityToday={userHasOtherConfirmedActivityToday}
                                isUserLevelCompatible={isUserLevelCompatibleWithActivity(currentMatch.level, currentUser.level, currentMatch.isPlaceholder)}
                                canJoinThisPrivateMatch={canJoinThisPrivateMatch}
                                isOrganizer={isOrganizer}
                                canBookWithPoints={isBookableWithPointsBySchedule}
                                showPointsBonus={showPointsBonus}
                                pricePerPlayer={pricePerPlayer}
                                pointsToAward={pointsToAward}
                                inlineRemovalEnabled={inlineRemovalEnabled === true}
                                onRemovePlayer={(uid) => onRemovePlayer?.(uid)}
                            />
                        ))}
                    </div>
                    <div className="mt-4">
                        {!compact && courtAvailability.total > 0 && (
                            <CourtAvailabilityIndicator
                                availableCourts={courtAvailability.available}
                                occupiedCourts={courtAvailability.occupied}
                                totalCourts={courtAvailability.total}
                                assignedCourtNumber={currentMatch.courtNumber ?? undefined}
                            />
                        )}
                    </div>
                </CardContent>
            </Card>

                        {/* Fixed match reserve confirmation */}
                        {currentMatch.isFixedMatch && (
                            <AlertDialog open={isFixedReserveDialogOpen} onOpenChange={setIsFixedReserveDialogOpen}>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="flex items-center gap-2"><Lock className="h-5 w-5"/> Reservar partida fija</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            ¿Cómo quieres proceder?
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <Button
                                            variant="outline"
                                            className="h-11"
                                            disabled={isStartingFixedProcessing}
                                            onClick={() => {
                                                setReserveAsPlayer(false);
                                                setIsStartingFixedProcessing(true);
                                                startTransition(async () => {
                                                    try {
                                                        const res = await createFixedMatchFromPlaceholder(currentUser.id, currentMatch.id, { hasReservedCourt: true, organizerJoins: false });
                                                        if ('error' in res) {
                                                            toast({ title: 'No reservado', description: res.error, variant: 'destructive' });
                                                            return;
                                                        }
                                                        const updatedMatch = res.updatedMatch;
                                                        setCurrentMatch(updatedMatch);
                                                        onMatchUpdate?.(updatedMatch);
                                                        toast({ title: 'Pista reservada', description: 'Has reservado la pista sin inscribirte.' });
                                                        setIsFixedReserveDialogOpen(false);
                                                    } finally {
                                                        setIsStartingFixedProcessing(false);
                                                    }
                                                });
                                            }}
                                        >{isStartingFixedProcessing && reserveAsPlayer === false ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Reservar sin apuntarme'}</Button>
                                        <Button
                                            className="h-11 bg-green-600 text-white hover:bg-green-700"
                                            disabled={isStartingFixedProcessing}
                                            onClick={() => {
                                                setReserveAsPlayer(true);
                                                setIsStartingFixedProcessing(true);
                                                startTransition(async () => {
                                                    try {
                                                        const res = await createFixedMatchFromPlaceholder(currentUser.id, currentMatch.id, { hasReservedCourt: true, organizerJoins: true });
                                                        if ('error' in res) {
                                                            toast({ title: 'No reservado', description: res.error, variant: 'destructive' });
                                                            return;
                                                        }
                                                        const updatedMatch = res.updatedMatch;
                                                        setCurrentMatch(updatedMatch);
                                                        onMatchUpdate?.(updatedMatch);
                                                        toast({ title: 'Pista reservada', description: 'Has reservado la pista y te has inscrito.' });
                                                        setIsFixedReserveDialogOpen(false);
                                                    } finally {
                                                        setIsStartingFixedProcessing(false);
                                                    }
                                                });
                                            }}
                                        >{isStartingFixedProcessing && reserveAsPlayer === true ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Reservar e inscribirme'}</Button>
                                    </div>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel disabled={isStartingFixedProcessing}>Cerrar</AlertDialogCancel>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}

            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-2xl font-bold flex items-center justify-center">
                    <Trophy className="h-8 w-8 mr-3 text-primary" /> ¡Únete a la Partida!
                  </AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogDescription asChild>
                  <div className="text-center text-lg text-foreground space-y-4 py-4">
                      <div className="space-y-1">
                        <div>Vas a apuntarte a una partida de pádel.</div>
                        <div className="flex items-center justify-center text-3xl font-bold">
                              {dialogContent.isJoiningWithPoints || (currentMatch.gratisSpotAvailable && (currentMatch.bookedPlayers || []).length === 3)
                                  ? <><Gift className="h-8 w-8 mr-2 text-yellow-500" /> {dialogContent.pointsCost} <span className="text-lg ml-1">puntos</span></>
                                  : <><Euro className="h-7 w-7 mr-1" /> {dialogContent.price.toFixed(2)}</>
                              }
                        </div>
                        {showPointsBonus && !dialogContent.isJoiningWithPoints && pointsToAward > 0 && (
                            <div className="text-sm font-semibold text-amber-600 flex items-center justify-center">
                                <Star className="h-4 w-4 mr-1.5 fill-amber-400" />
                                ¡Ganarás {pointsToAward} puntos por esta reserva!
                            </div>
                        )}
                      </div>
                      <div className="flex items-center justify-center gap-2 p-2 bg-slate-100 rounded-md">
                        <PiggyBank className="h-6 w-6 text-slate-500" />
                        <span className="text-sm">Tu saldo:</span>
                        <span className="font-bold text-slate-800">{(currentUser.credit ?? 0).toFixed(2)}€</span>
                        <span className="text-slate-400">/</span>
                        <Star className="h-5 w-5 text-amber-500"/>
                        <span className="font-bold text-slate-800">{currentUser?.loyaltyPoints ?? 0}</span>
                      </div>
                  </div>
                </AlertDialogDescription>
                <div className="text-sm bg-blue-50 text-blue-800 p-3 rounded-lg space-y-2">
                  <p className="font-bold text-center">¡Recuerda las reglas del juego!</p>
                  <ul className="space-y-1.5">
                    <li className="flex items-start"><ThumbsUp className="h-4 w-4 mr-2 mt-0.5 text-blue-500 flex-shrink-0" /><span>Cuando se apuntan 4 jugadores, ¡la partida se confirma!</span></li>
                    <li className="flex items-start"><Lock className="h-4 w-4 mr-2 mt-0.5 text-blue-500 flex-shrink-0" /><span>Una vez confirmada, tu plaza es definitiva.</span></li>
                    <li className="flex items-start"><Scissors className="h-4 w-4 mr-2 mt-0.5 text-blue-500 flex-shrink-0" /><span>**Si esta partida se confirma**, tus otras inscripciones del día se anularán solas.</span></li>
                  </ul>
                </div>
                <AlertDialogFooter className="grid grid-cols-2 gap-2 mt-4">
                  <AlertDialogCancel className="h-12 text-base" disabled={isPending}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleConfirmJoin}
                    disabled={isPending}
                    className="h-12 text-base bg-green-600 text-white hover:bg-green-700" 
                  >
                    {isPending
                      ? <Loader2 className="h-6 w-6 animate-spin" />
                      : (dialogContent.isJoiningWithPoints ? `Sí, Usar Puntos` : "Sí, ¡Me apunto!")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Confirm private for placeholder (normal matches) */}
            {!currentMatch.isFixedMatch && (
                <AlertDialog open={isConfirmPrivateDialogOpen} onOpenChange={setIsConfirmPrivateDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2"><Lock className="h-5 w-5"/> Confirmar Partida Privada</AlertDialogTitle>
                            <AlertDialogDescription>
                                Pagarás la partida entera ahora ({(calculateActivityPrice(clubInfo, new Date(currentMatch.startTime))).toFixed(2)}€) y recibirás un enlace para compartir. Se te devolverá la parte de cada amigo que se una.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isProcessingPrivateAction}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                                disabled={isProcessingPrivateAction}
                                onClick={async () => {
                                    setIsProcessingPrivateAction(true);
                                    const res = await confirmMatchAsPrivate(currentUser.id, currentMatch.id, false);
                                    if ('error' in res) {
                                        toast({ title: 'No confirmado', description: res.error, variant: 'destructive' });
                                    } else {
                                        setCurrentMatch(res.updatedMatch);
                                        toast({ title: 'Partida privada', description: 'Reserva confirmada como privada.' });
                                        onMatchUpdate?.(res.updatedMatch);
                                    }
                                    setIsProcessingPrivateAction(false);
                                    setIsConfirmPrivateDialogOpen(false);
                                }}
                            >{isProcessingPrivateAction ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar'}</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}

            {/* Make forming match private when already booked (normal matches) */}
            {!currentMatch.isFixedMatch && (
                <AlertDialog open={isMakePrivateDialogOpen} onOpenChange={setIsMakePrivateDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2"><Lock className="h-5 w-5"/> Hacer privada</AlertDialogTitle>
                            <AlertDialogDescription>
                                Pagarás las plazas restantes para confirmar ahora. Coste estimado: {
                                    (() => {
                                        const total = calculateActivityPrice(clubInfo, new Date(currentMatch.startTime));
                                        const per = calculatePricePerPerson(total, 4);
                                        const remaining = Math.max(0, 4 - (currentMatch.bookedPlayers?.length || 0));
                                        return (per * remaining).toFixed(2);
                                    })()
                                }€.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isProcessingPrivateAction}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                                disabled={isProcessingPrivateAction}
                                onClick={async () => {
                                    setIsProcessingPrivateAction(true);
                                    const res = await fillMatchAndMakePrivate(currentUser.id, currentMatch.id);
                                    if ('error' in res) {
                                        toast({ title: 'No completado', description: res.error, variant: 'destructive' });
                                    } else {
                                        setCurrentMatch(res.updatedMatch);
                                        toast({ title: 'Partida privada', description: 'Se ha confirmado como privada.' });
                                        onMatchUpdate?.(res.updatedMatch);
                                    }
                                    setIsProcessingPrivateAction(false);
                                    setIsMakePrivateDialogOpen(false);
                                }}
                            >{isProcessingPrivateAction ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar'}</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}

            {/* Fixed matches: no inline config; edición será desde "Mi agenda" */}

            {/* Fixed matches start/reserve handled via avatar CTA; dialog removed */}

            
            <InfoDialog isOpen={infoDialog.open} onOpenChange={(open) => setInfoDialog(prev => ({ ...prev, open }))} title={infoDialog.title} description={infoDialog.description} icon={infoDialog.icon} />
        </>
    );
});

// This is the main exported component. It fetches the necessary data
// and then renders the content component, or a skeleton if data is missing.
const MatchCard: React.FC<MatchCardProps> = (props) => {
    const [clubInfo, setClubInfo] = useState<Club | null>(null);

    useEffect(() => {
        const club = getMockClubs().find(c => c.id === props.match.clubId);
        setClubInfo(club || null);
    }, [props.match.clubId]);
    
    // This is the correct placement for the conditional return.
    // We check for necessary props BEFORE any hooks are called in the content component.
    if (!props.currentUser || !clubInfo) {
        return <Skeleton className="h-[280px] w-full" />;
    }

    return <MatchCardContentComponent {...props} currentUser={props.currentUser} clubInfo={clubInfo} />;
};

MatchCard.displayName = 'MatchCard';
export default MatchCard;
