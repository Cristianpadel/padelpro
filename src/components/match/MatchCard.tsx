
"use client";

import React, { useState, useTransition, useMemo, useEffect, useCallback } from 'react';
import type { Match, User, MatchBooking, MatchPadelLevel, PadelLevelRange, PadelCategoryForSlot, Club, DayOfWeek, TimeRange, PadelCourt } from '@/types'; 
import { getMockStudents, getMockClubs, getMockUserMatchBookings, getMockMatches, countUserConfirmedMatchesForDay, hasAnyConfirmedActivityForDay, confirmMatchAsPrivate, joinPrivateMatch, makeMatchPublic, bookMatch as bookMatchFromMockData, isUserLevelCompatibleWithActivity, bookCourtForMatchWithPoints, calculateActivityPrice, getCourtAvailabilityForInterval } from '@/lib/mockData';
import { matchPadelLevels, padelCategoryForSlotOptions, displayClassCategory, daysOfWeek as dayOfWeekArray, displayClassLevel } from '@/types'; 
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Clock, Users, Plus, Loader2, CheckCircle, BarChart, Hash, CalendarDays, ShieldQuestion, Euro, CircleCheckBig, User as UserIcon, Gift, CreditCard, AlertTriangle, Users2 as CategoryIcon, Venus, Mars, Share2, Lock, Unlock, UserPlus, ShieldCheck, Play, Star, ChevronDown, Rocket, PiggyBank, ThumbsUp, Scissors, Trophy, Lightbulb, BarChartHorizontal } from 'lucide-react'; // Added Lightbulb
import { format, isSameDay, parse, getDay, differenceInDays, startOfDay, addMinutes, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn, getInitials, getPlaceholderUserName, calculatePricePerPerson } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle as InfoDialogTitle,
  DialogDescription as InfoDialogDescription,
  DialogFooter as InfoDialogFooter,
  DialogClose as InfoDialogClose,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from '@/components/ui/input';
import { MatchSpotDisplay } from './MatchSpotDisplay';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import CourtAvailabilityIndicator from '@/components/class/CourtAvailabilityIndicator';
import { Skeleton } from '@/components/ui/skeleton';

interface MatchCardProps {
  match: Match;
  currentUser: User;
  onBookingSuccess: () => void;
  onMatchUpdate: (updatedMatch: Match) => void;
  matchShareCode?: string | null;
  showPointsBonus: boolean;
}

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
          <InfoDialogTitle className="flex items-center text-xl">
            <Icon className="mr-3 h-6 w-6 text-primary" />
            {title}
          </InfoDialogTitle>
        </DialogHeader>
        <div className="py-4 text-base text-muted-foreground leading-relaxed whitespace-pre-line">
            {description.split('\n').map((item, key) => (
                <p key={key} className="mb-2">{`• ${item}`}</p>
            ))}
        </div>
        <InfoDialogFooter>
          <InfoDialogClose asChild>
            <Button className="w-full">¡Entendido!</Button>
          </InfoDialogClose>
        </InfoDialogFooter>
      </DialogContent>
    </Dialog>
  );
};


const MatchCard: React.FC<MatchCardProps> = React.memo(({ match: initialMatch, currentUser, onBookingSuccess, onMatchUpdate, matchShareCode, showPointsBonus }) => {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [joiningSpotIndex, setJoiningSpotIndex] = useState<number | null>(null);
  const [currentMatch, setCurrentMatch] = useState<Match>(initialMatch);
  const [isConfirmPrivateDialogOpen, setIsConfirmPrivateDialogOpen] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [isProcessingPrivateAction, setIsProcessingPrivateAction] = useState(false);
  const [isJoinPrivateDialogOpen, setIsJoinPrivateDialogOpen] = useState(false);
  const [isMakePublicDialogOpen, setIsMakePublicDialogOpen] = useState(false);
  const [isBookWithPointsDialogOpen, setIsBookWithPointsDialogOpen] = useState(false);
  const [isJoiningWithPoints, setIsJoiningWithPoints] = useState(false);
  const [clubInfo, setClubInfo] = useState<Club | null>(null);
  const [pricePerPlayerEuro, setPricePerPlayerEuro] = useState<number>(0);
  const [infoDialog, setInfoDialog] = useState<{ open: boolean, title: string, description: string, icon: React.ElementType }>({ open: false, title: '', description: '', icon: Lightbulb });
  const [courtAvailability, setCourtAvailability] = useState<{ available: PadelCourt[], occupied: PadelCourt[], total: number }>({ available: [], occupied: [], total: 0 });

  const fetchCourtAvailability = useCallback(async () => {
    if (!initialMatch.clubId || !initialMatch.startTime || !initialMatch.endTime) return;
    const availability = await getCourtAvailabilityForInterval(initialMatch.clubId, new Date(initialMatch.startTime), new Date(initialMatch.endTime));
    setCourtAvailability(availability);
  }, [initialMatch.clubId, initialMatch.startTime, initialMatch.endTime]);


  useEffect(() => {
    const clubData = getMockClubs().find(c => c.id === initialMatch.clubId);
    setClubInfo(clubData || null);
    fetchCourtAvailability();
    if(clubData) {
        // Corrected: Calculate price from scratch based on club tariffs
        const courtPrice = calculateActivityPrice(clubData, new Date(initialMatch.startTime));
        setPricePerPlayerEuro(calculatePricePerPerson(courtPrice, 4));
    } else {
        setPricePerPlayerEuro(0);
    }
  }, [initialMatch.clubId, initialMatch.startTime, fetchCourtAvailability]);


  useEffect(() => {
    setCurrentMatch(initialMatch);
  }, [initialMatch]);

 const handleInfoClick = (type: 'level' | 'court' | 'category') => {
    let dialogContent;
    const levelDisplay = displayClassLevel(currentMatch.level, true);
    
    switch (type) {
      case 'level':
        dialogContent = currentMatch.level === 'abierto' || currentMatch.isPlaceholder
            ? { title: 'Nivel', description: `El nivel de la partida lo define el primer jugador que se inscribe.\nEsto asegura que las partidas sean siempre equilibradas.`, icon: Lightbulb }
            : { title: `Nivel de la Partida: ${levelDisplay}`, description: `El nivel se ha fijado en este rango para garantizar una partida competitiva y divertida para todos.\nSolo jugadores con un nivel similar pueden unirse.`, icon: BarChartHorizontal };
        break;
      case 'court':
        dialogContent = !currentMatch.courtNumber
            ? { title: 'Pista', description: `La pista se asigna automáticamente solo cuando la partida está completa (4 jugadores).\nRecibirás una notificación con el número de pista cuando se confirme.`, icon: ShieldQuestion }
            : { title: `Pista Asignada: ${currentMatch.courtNumber}`, description: `¡Ya tenéis pista!\nSe ha asignado la Pista ${currentMatch.courtNumber} porque la partida está completa.\n¡A jugar!`, icon: Hash };
        break;
      case 'category':
        dialogContent = currentMatch.category === 'abierta'
            ? { title: 'Categoría', description: `La categoría (chicos/chicas) la sugiere el primer jugador que se apunta.\nNo es una regla estricta, solo una guía para los demás jugadores.`, icon: Users }
            : { title: `Categoría Sugerida: ${displayClassCategory(currentMatch.category, true)}`, description: `Esta categoría se ha definido como sugerencia para la partida, basándose en el primer jugador que se inscribió.`, icon: CategoryIcon };
        break;
    }
    setInfoDialog({ open: true, ...dialogContent });
  };


  const userIndexInMatch = currentMatch.bookedPlayers.findIndex(p => p.userId === currentUser.id);
  const isUserBooked = userIndexInMatch !== -1;
  const isPlaceholderMatch = currentMatch.isPlaceholder === true;

  const anticipationPoints = useMemo(() => {
      if (!currentMatch?.startTime) return 0;
      const days = differenceInDays(startOfDay(new Date(currentMatch.startTime)), startOfDay(new Date()));
      return Math.max(0, days);
  }, [currentMatch?.startTime]);


  const userHasOtherConfirmedActivityToday = (currentUser && currentMatch?.startTime) 
    ? hasAnyConfirmedActivityForDay(currentUser.id, new Date(currentMatch.startTime), isUserBooked ? currentMatch.id : undefined, 'match')
    : false;
  
  const club = getMockClubs().find(c => c.id === currentMatch.clubId);
  const pointsCostForCourt = club?.pointSettings?.pointsCostForCourt ?? 0;

  // *** NEW LOGIC: Check if this specific match slot is bookable with points ***
  const isBookableWithPointsBySchedule = useMemo(() => {
    if (!club?.pointBookingSlots || isUserBooked) {
        return false;
    }
    const matchStartTime = new Date(currentMatch.startTime);
    const dayOfWeek = dayOfWeekArray[getDay(matchStartTime)];
    const pointBookingSlotsToday = club.pointBookingSlots?.[dayOfWeek as keyof typeof club.pointBookingSlots];

    if (pointBookingSlotsToday) {
        return pointBookingSlotsToday.some(range => {
            const rangeStart = parse(range.start, 'HH:mm', matchStartTime);
            const rangeEnd = parse(range.end, 'HH:mm', matchStartTime);
            return matchStartTime >= rangeStart && matchStartTime < rangeEnd;
        });
    }
    return false;
  }, [club, currentMatch, isUserBooked]);


  const handleJoinMatch = (spotIndex: number, usePoints: boolean = false) => {
    startTransition(async () => {
      const result = await bookMatchFromMockData(currentUser.id, currentMatch.id, usePoints);
      setShowConfirmDialog(false);
      setIsBookWithPointsDialogOpen(false);
      setJoiningSpotIndex(null);
      setIsJoiningWithPoints(false);

      if ('error' in result) {
        toast({
          title: 'Error al Unirse',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: '¡Inscrito en la Partida!',
          description: `Te has unido a la partida del ${format(new Date(currentMatch.startTime), "PPP 'a las' HH:mm", { locale: es })}.`,
          className: 'bg-primary text-primary-foreground',
        });
        onBookingSuccess(); 
      }
    });
  };

  const handleConfirmAsPrivateAction = () => {
    setIsProcessingPrivateAction(true);
    startTransition(async () => {
        const result = await confirmMatchAsPrivate(currentUser.id, currentMatch.id, isRecurring);
        if ('error' in result) {
            toast({ title: "Error al Confirmar Privada", description: result.error, variant: "destructive" });
        } else {
            onBookingSuccess();
             toast({
                title: "¡Partida Confirmada como Privada!",
                description: (
                    <div>
                        <p>Tu partida ahora es privada. Enlace para compartir con tus amigos:</p>
                        <Input type="text" readOnly value={result.shareLink} className="mt-1 text-xs h-8" />
                        <Button size="sm" className="mt-2 text-xs" onClick={() => { navigator.clipboard.writeText(result.shareLink); toast({description: "Enlace copiado"}); }}>Copiar Enlace</Button>
                    </div>
                ),
                duration: 15000,
                className: "bg-purple-600 text-white",
            });
        }
        setIsConfirmPrivateDialogOpen(false);
        setIsProcessingPrivateAction(false);
        setIsRecurring(false); // Reset checkbox state
    });
  };

  const handleBookWithPoints = (isPlaza: boolean = false) => {
      if (!currentUser) return;
      if (isPlaza) {
          setIsJoiningWithPoints(true);
          handleOpenConfirmDialog(0); // Open confirmation dialog for joining a spot
      } else {
          // Logic for booking the whole court with points
          startTransition(async () => {
              const result = await bookCourtForMatchWithPoints(currentUser.id, currentMatch.id);
              if ('error' in result) {
                  toast({ title: "Error al Reservar con Puntos", description: result.error, variant: "destructive" });
              } else {
                  toast({ title: "¡Pista Reservada con Puntos!", description: "Has creado una partida privada usando tus puntos. ¡Invita a tus amigos!" });
                  onBookingSuccess();
              }
              setIsBookWithPointsDialogOpen(false);
          });
      }
  };


  const handleJoinPrivateMatchAction = () => {
    if (!matchShareCode) {
      toast({ title: "Error", description: "Código para unirse no disponible.", variant: "destructive" });
      return;
    }
    setIsProcessingPrivateAction(true);
    startTransition(async () => {
        const result = await joinPrivateMatch(currentUser.id, currentMatch.id, matchShareCode);
        if ('error'in result) {
            toast({ title: "Error al Unirse", description: result.error, variant: "destructive" });
        } else {
            onBookingSuccess();
            toast({ title: "¡Te has unido a la Partida Privada!", description: `Se te ha cobrado ${result.organizerRefundAmount.toFixed(2)}€ y se ha reembolsado al organizador.`, className: "bg-primary text-primary-foreground"});
        }
        setIsJoinPrivateDialogOpen(false);
        setIsProcessingPrivateAction(false);
    });
  };
  
  const handleMakeMatchPublic = () => {
    setIsProcessingPrivateAction(true);
    startTransition(async () => {
        const result = await makeMatchPublic(currentUser.id, currentMatch.id);
        if ('error' in result) {
            toast({ title: "Error al Hacer Pública", description: result.error, variant: "destructive" });
        } else {
            onBookingSuccess();
            toast({ title: "Partida Hecha Pública", description: "La partida ahora está abierta a todos.", className: "bg-primary text-primary-foreground" });
        }
        setIsMakePublicDialogOpen(false);
        setIsProcessingPrivateAction(false);
    });
  };

  const handleShareMatch = async () => {
    if (!currentMatch) return;
    let shareUrl = ``;
    if (currentMatch.status === 'confirmed_private' && currentMatch.privateShareCode) {
        shareUrl = `${window.location.origin}/?view=partidas&code=${currentMatch.privateShareCode}`;
    } else {
        shareUrl = `${window.location.origin}/?view=partidas&matchId=${currentMatch.id}`;
    }

    try {
        await navigator.clipboard.writeText(shareUrl);
        toast({
            title: "¡Enlace Copiado!",
            description: "El enlace a la partida ha sido copiado a tu portapapeles.",
            className: "bg-primary text-primary-foreground",
        });
    } catch (err) {
        console.error("Error al copiar enlace: ", err);
        toast({ title: "Error", description: "No se pudo copiar el enlace.", variant: "destructive" });
    }
  };


  const matchLevelToDisplay = isPlaceholderMatch ? 'abierto' : currentMatch.level || 'abierto';
  const matchCategoryToDisplay = isPlaceholderMatch ? 'abierta' : currentMatch.category || 'abierta'; 

  const CategoryIconDisplay = matchCategoryToDisplay === 'chica' ? Venus : matchCategoryToDisplay === 'chico' ? Mars : CategoryIcon;
  
  const isMatchFull = currentMatch.bookedPlayers.length >= 4;
  const isOrganizer = currentMatch.organizerId === currentUser.id;
  const canJoinThisPrivateMatch = 
    currentMatch.status === 'confirmed_private' &&
    matchShareCode === currentMatch.privateShareCode &&
    !isOrganizer &&
    !isUserBooked &&
    (currentMatch.bookedPlayers || []).length < 4;


  const cardBorderColor =
    isBookableWithPointsBySchedule ? 'border-l-yellow-500' :
    currentMatch.status === 'confirmed_private' ? 'border-l-purple-500' :
    isMatchFull && currentMatch.status === 'confirmed' ? 'border-l-red-500' :
    isUserBooked ? 'border-l-blue-500' :
    isPlaceholderMatch ? 'border-l-green-500' :
    'border-l-green-500';
    
  const handleOpenConfirmDialog = (spotIdx: number) => {
    setShowConfirmDialog(true);
    setJoiningSpotIndex(spotIdx);
  };

  const occupancyPercentage = (currentMatch.bookedPlayers.length / 4) * 100;
  
  const pointsCostForSpot = calculatePricePerPerson(pricePerPlayerEuro * 4, 4);
  
  const shadowEffect = clubInfo?.cardShadowEffect;
  const shadowStyle = shadowEffect?.enabled 
    ? { boxShadow: `0 0 25px ${shadowEffect.color}${Math.round(shadowEffect.intensity * 255).toString(16).padStart(2, '0')}` } 
    : {};
  
  const privateMatchBonusPoints = 10 + anticipationPoints;

  const availableCreditForDialog = (currentUser.credit ?? 0) - (currentUser.blockedCredit ?? 0);
  const durationMinutes = differenceInMinutes(new Date(currentMatch.endTime), new Date(currentMatch.startTime));

  const badges = [
      { type: 'category', value: displayClassCategory(matchCategoryToDisplay, true), icon: CategoryIconDisplay },
      { type: 'court', value: currentMatch.courtNumber ? `Pista ${currentMatch.courtNumber}` : 'Pista', icon: Hash },
      { type: 'level', value: displayClassLevel(matchLevelToDisplay), icon: BarChartHorizontal }
  ];


  return (
    <>
      <TooltipProvider>
      <Card className={cn(
        "w-full transition-shadow duration-300 flex flex-col bg-white border-l-4",
        cardBorderColor,
        (userHasOtherConfirmedActivityToday && !isUserBooked) && "opacity-60"
      )} style={shadowStyle}>
        <CardHeader className="pb-2 pt-3 px-3">
            <div className="flex justify-between items-center mb-1">
                <div className="flex items-center space-x-2">
                    <div className="flex flex-col items-center">
                        <div className="bg-white text-black p-1 rounded-lg shadow-md flex flex-col items-center justify-center w-14">
                            <p className="text-xs font-bold uppercase">{format(new Date(currentMatch.startTime), "EEE", { locale: es })}</p>
                            <p className="text-3xl font-extrabold -my-1">{format(new Date(currentMatch.startTime), "d", { locale: es })}</p>
                            <p className="text-xs font-bold uppercase">{format(new Date(currentMatch.startTime), "MMM", { locale: es }).slice(0,3)}</p>
                        </div>
                    </div>
                    <div className="flex flex-col flex-grow">
                        <span className="font-semibold text-base text-foreground leading-tight">
                            {format(new Date(currentMatch.startTime), 'HH:mm')}h
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center">
                            <Clock className="mr-1 h-3 w-3" /> {durationMinutes} min
                        </span>
                         <span className="text-xs text-muted-foreground">
                            {clubInfo?.name || 'Club Padel'}
                        </span>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1 -mt-4">
                    <div className="flex items-center gap-1 mt-1">
                        <Button variant="ghost" className="h-auto p-1 text-muted-foreground" onClick={handleShareMatch}>
                            <Share2 className="h-4 w-4" />
                        </Button>
                        {isPlaceholderMatch && (currentMatch.bookedPlayers || []).length === 0 && (
                            <Button
                            variant="default"
                            className="relative h-auto py-1 px-2 rounded-l-full text-white bg-purple-600 hover:bg-purple-700 shadow-lg flex items-center space-x-1"
                            onClick={() => setIsConfirmPrivateDialogOpen(true)}
                            disabled={isProcessingPrivateAction || userHasOtherConfirmedActivityToday}
                            >
                                <div className="flex-shrink-0 h-5 w-5 rounded-full bg-white/20 flex items-center justify-center border border-white/50">
                                    <Plus className="h-3 w-3 text-white"/>
                                </div>
                                <div className="flex flex-col items-start -space-y-1">
                                    <span className="text-[8px] font-normal">Reservar</span>
                                    <span className="text-[11px] font-bold">Privada</span>
                                </div>
                            </Button>
                        )}
                    </div>
                </div>
            </div>
             <div className="flex justify-center items-center gap-1.5 px-3 pb-2">
                 {badges.map(item => (
                     <button key={item.type} onClick={() => handleInfoClick(item.type as any)} className="flex-1">
                        <Badge variant="outline" className="w-full justify-center text-xs py-1.5 rounded-full capitalize shadow-inner bg-slate-50 border-slate-200">
                            <item.icon className="mr-1.5 h-3 w-3" />
                            {item.value}
                        </Badge>
                     </button>
                 ))}
            </div>
        </CardHeader>


        <CardContent className="pt-1 pb-2 px-2 flex-grow flex flex-col justify-between">
            <div className="grid grid-cols-4 gap-1 items-start">
                {Array.from({ length: 4 }).map((_, index) => (
                <MatchSpotDisplay
                    key={index}
                    spotIndex={index}
                    match={currentMatch}
                    currentUser={currentUser}
                    onJoin={(spotIdx, usePoints) => {
                    setIsJoiningWithPoints(!!usePoints);
                    handleOpenConfirmDialog(spotIdx);
                    }}
                    onJoinPrivate={() => setIsJoinPrivateDialogOpen(true)}
                    isPending={isPending && joiningSpotIndex === index}
                    userHasOtherConfirmedActivityToday={userHasOtherConfirmedActivityToday}
                    isUserLevelCompatible={isUserLevelCompatibleWithActivity(matchLevelToDisplay, currentUser.level, isPlaceholderMatch)}
                    canJoinThisPrivateMatch={canJoinThisPrivateMatch}
                    isOrganizer={isOrganizer}
                    canBookWithPoints={isBookableWithPointsBySchedule}
                    showPointsBonus={showPointsBonus}
                    pricePerPlayer={pricePerPlayerEuro}
                />
                ))}
            </div>
             <div className="mt-2">
                 <CourtAvailabilityIndicator
                    availableCourts={courtAvailability.available}
                    occupiedCourts={courtAvailability.occupied}
                    totalCourts={courtAvailability.total}
                />
            </div>
        </CardContent>

      </Card>
      </TooltipProvider>

      <AlertDialog
        open={showConfirmDialog && joiningSpotIndex !== null}
        onOpenChange={(open) => { if (!open) { setShowConfirmDialog(false); setJoiningSpotIndex(null); setIsJoiningWithPoints(false); }}}
      >
        {joiningSpotIndex !== null && (
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl font-bold flex items-center justify-center">
                       <Trophy className="h-8 w-8 mr-3 text-amber-500" /> ¡A Jugar!
                    </AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogDescription className="text-center text-lg text-foreground space-y-4 py-4">
                     <div className="space-y-1">
                        <p>Te apuntas a una partida de pádel.</p>
                        <p className="flex items-center justify-center text-3xl font-bold">
                             {isJoiningWithPoints || (currentMatch.gratisSpotAvailable && currentMatch.bookedPlayers.length === 3)
                                ? <> <Gift className="h-8 w-8 mr-2 text-yellow-500" /> {pointsCostForSpot} <span className="text-lg ml-1">puntos</span> </>
                                : <> <Euro className="h-7 w-7 mr-1" /> {pricePerPlayerEuro.toFixed(2)} </>
                            }
                        </p>
                    </div>
                     <div className="flex items-center justify-center gap-2 p-2 bg-slate-100 rounded-md">
                        <PiggyBank className="h-6 w-6 text-slate-500" />
                        <span className="text-sm">Tu hucha tiene:</span>
                        <span className="font-bold text-slate-800">{availableCreditForDialog.toFixed(2)}€</span>
                        <span className="text-slate-400">/</span>
                        <Star className="h-5 w-5 text-amber-500"/>
                        <span className="font-bold text-slate-800">{currentUser?.loyaltyPoints ?? 0}</span>
                    </div>
                </AlertDialogDescription>
                <div className="text-sm bg-blue-50 text-blue-800 p-3 rounded-lg space-y-2">
                    <p className="font-bold text-center">¡Recuerda las reglas del juego!</p>
                    <ul className="space-y-1.5">
                        <li className="flex items-start"><Users className="h-4 w-4 mr-2 mt-0.5 text-blue-500 flex-shrink-0" /><span>La partida necesita 4 jugadores para empezar.</span></li>
                        <li className="flex items-start"><Lock className="h-4 w-4 mr-2 mt-0.5 text-blue-500 flex-shrink-0" /><span>Si esta partida se confirma, tu plaza está asegurada.</span></li>
                        <li className="flex items-start"><Scissors className="h-4 w-4 mr-2 mt-0.5 text-blue-500 flex-shrink-0" /><span>**Si esta partida se confirma**, tus otras inscripciones del día se anularán solas.</span></li>
                    </ul>
                </div>
                <AlertDialogFooter className="grid grid-cols-2 gap-2 mt-4">
                    <AlertDialogCancel className="h-12 text-base" disabled={isPending}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => handleJoinMatch(joiningSpotIndex, isJoiningWithPoints)}
                        disabled={isPending}
                        className="h-12 text-base bg-green-600 text-white hover:bg-green-700" 
                    >
                        {isPending ? <Loader2 className="h-6 w-6 animate-spin" /> : "¡Sí, a jugar!"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        )}
      </AlertDialog>
        <AlertDialog open={isConfirmPrivateDialogOpen} onOpenChange={(open) => { if(!open) setIsRecurring(false); setIsConfirmPrivateDialogOpen(open); }}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Partida como Privada</AlertDialogTitle>
                    <AlertDialogDescription>
                        • Paga la partida entera ahora ({pricePerPlayerEuro > 0 ? (pricePerPlayerEuro * 4).toFixed(2) : '0.00'}€).
                        <br/>• Te daremos un enlace para compartir.
                        <br/>• Cuando tus amigos se unan, te devolveremos su parte.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex items-center space-x-2 my-4">
                    <Checkbox id="recurring-booking" checked={isRecurring} onCheckedChange={(checked) => setIsRecurring(!!checked)} disabled={isProcessingPrivateAction} />
                    <Label htmlFor="recurring-booking" className="text-sm font-normal">Hacer esta reserva recurrente (semanal)</Label>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setIsConfirmPrivateDialogOpen(false)} disabled={isProcessingPrivateAction}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmAsPrivateAction} disabled={isProcessingPrivateAction}>
                        {isProcessingPrivateAction && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmar y Pagar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={isJoinPrivateDialogOpen} onOpenChange={setIsJoinPrivateDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Unirse a Partida Privada</AlertDialogTitle>
                    <AlertDialogDescription>
                        Estás a punto de unirte a esta partida privada. Coste: {pricePerPlayerEuro.toFixed(2)}€.
                        Se deducirá de tu saldo y se reembolsará al organizador.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                 {!isUserLevelCompatibleWithActivity(currentMatch.level, currentUser.level, false) && (
                    <p className="text-sm text-destructive flex items-center"><AlertTriangle className="mr-2 h-4 w-4"/> Tu nivel ({currentUser.level || 'N/A'}) podría no ser compatible con el de esta partida ({currentMatch.level}).</p>
                )}
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setIsJoinPrivateDialogOpen(false)} disabled={isProcessingPrivateAction}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleJoinPrivateMatchAction} disabled={isProcessingPrivateAction || !isUserLevelCompatibleWithActivity(currentMatch.level, currentUser.level, false) || (currentUser.credit ?? 0) < pricePerPlayerEuro}>
                        {isProcessingPrivateAction && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Unirme y Pagar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        
        <AlertDialog open={isMakePublicDialogOpen} onOpenChange={setIsMakePublicDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Hacer Pública esta Partida?</AlertDialogTitle>
                    <AlertDialogDescription>
                        La partida volverá a ser visible para todos y podrán unirse nuevos jugadores.
                        No se realizarán reembolsos automáticos. Deberás gestionar cualquier pago pendiente con tus amigos directamente.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isProcessingPrivateAction}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleMakeMatchPublic} disabled={isProcessingPrivateAction} className="bg-orange-500 hover:bg-orange-600 text-white">
                        {isProcessingPrivateAction ? <Loader2 className="animate-spin h-4 w-4" /> : "Sí, Hacer Pública"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
         <AlertDialog open={isBookWithPointsDialogOpen} onOpenChange={setIsBookWithPointsDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center"><Gift className="mr-2 h-5 w-5 text-primary" /> Reservar Pista con Puntos</AlertDialogTitle>
                    <AlertDialogDescription>
                        Se descontarán <span className="font-bold">{pointsCostForCourt} puntos</span> de tu saldo para reservar esta pista completa y crear una partida privada. Podrás invitar a tus amigos.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleBookWithPoints(false)} disabled={isPending || (currentUser.loyaltyPoints ?? 0) < pointsCostForCourt}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmar y Usar Puntos
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

         {/* Info Dialog */}
        <InfoDialog
            isOpen={infoDialog.open}
            onOpenChange={(open) => setInfoDialog(prev => ({ ...prev, open }))}
            title={infoDialog.title}
            description={infoDialog.description}
            icon={infoDialog.icon}
        />
    </>
  );
});
MatchCard.displayName = 'MatchCard';
export default MatchCard;
