// src/components/match/MatchCard.tsx
"use client";

import React, { useState, useMemo, useEffect, useCallback, useTransition } from 'react';
import type { Match, User, Club, PadelCourt } from '@/types';
import { getMockStudents, getMockClubs, bookMatch, confirmMatchAsPrivate, joinPrivateMatch, makeMatchPublic, bookCourtForMatchWithPoints, calculateActivityPrice, getCourtAvailabilityForInterval, isUserLevelCompatibleWithActivity, isMatchBookableWithPoints } from '@/lib/mockData';
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
import { Clock, Users, Plus, Loader2, Gift, CreditCard, AlertTriangle, Lock, Star, Share2, Hash, Users2, Venus, Mars, BarChartHorizontal, Lightbulb, Euro, Trophy, PiggyBank, ThumbsUp, Scissors } from 'lucide-react';
import { MatchSpotDisplay } from '@/components/match/MatchSpotDisplay';
import CourtAvailabilityIndicator from '@/components/class/CourtAvailabilityIndicator';
import { hasAnyConfirmedActivityForDay } from '@/lib/mockData';


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
}

const InfoButton = ({ icon: Icon, text, onClick, className }: { icon: React.ElementType, text: string, onClick: () => void, className?: string }) => (
    <Button variant="outline" className={cn("flex-1 h-8 rounded-full shadow-inner bg-slate-50 border-slate-200 capitalize text-xs", className)} onClick={onClick}>
        <span className="font-bold text-slate-500 mr-1.5">+</span> {text}
    </Button>
);


const MatchCard: React.FC<MatchCardProps> = React.memo(({ match: initialMatch, currentUser, onBookingSuccess, showPointsBonus }) => {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [currentMatch, setCurrentMatch] = useState<Match>(initialMatch);
    const [clubInfo, setClubInfo] = useState<Club | null>(null);
    const [courtAvailability, setCourtAvailability] = useState<{ available: PadelCourt[], occupied: PadelCourt[], total: number }>({ available: [], occupied: [], total: 0 });
    const [infoDialog, setInfoDialog] = useState<{ open: boolean, title: string, description: string, icon: React.ElementType }>({ open: false, title: '', description: '', icon: Lightbulb });
    const [isConfirmPrivateDialogOpen, setIsConfirmPrivateDialogOpen] = useState(false);
    const [isProcessingPrivateAction, setIsProcessingPrivateAction] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [dialogContent, setDialogContent] = useState<{ isJoiningWithPoints: boolean, pointsCost: number, price: number, spotIndex: number }>({ isJoiningWithPoints: false, pointsCost: 0, price: 0, spotIndex: 0 });


    useEffect(() => {
        const loadData = async () => {
            const club = getMockClubs().find(c => c.id === initialMatch.clubId);
            setClubInfo(club || null);
            if (club) {
                const availability = await getCourtAvailabilityForInterval(initialMatch.clubId, new Date(initialMatch.startTime), new Date(initialMatch.endTime));
                setCourtAvailability(availability);
            }
        };
        loadData();
        setCurrentMatch(initialMatch);
    }, [initialMatch]);

    const isUserBooked = useMemo(() => (currentMatch.bookedPlayers || []).some(p => p.userId === currentUser?.id), [currentMatch.bookedPlayers, currentUser?.id]);
    const isOrganizer = currentUser?.id === currentMatch.organizerId;
    const isPlaceholderMatch = currentMatch.isPlaceholder === true;
    const isPrivateMatch = currentMatch.status === 'confirmed_private';
    const canJoinThisPrivateMatch = isPrivateMatch && !isUserBooked;
    const userHasOtherConfirmedActivityToday = useMemo(() => {
        if (!currentUser) return false;
        return hasAnyConfirmedActivityForDay(currentUser.id, new Date(currentMatch.startTime));
    }, [currentUser, currentMatch.startTime]);


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
        const daysInAdvance = differenceInDays(startOfDay(new Date(currentMatch.startTime)), startOfDay(new Date()));
        const anticipationPoints = Math.max(0, daysInAdvance);
        return basePoints + anticipationPoints;
    }, [isPlaceholderMatch, isUserBooked, currentMatch.startTime, clubInfo, showPointsBonus]);

    
    const handleJoinClick = (spotIndex: number, isJoiningWithPoints = false) => {
      if(!currentUser) return;
      const pointsCostForSpot = isJoiningWithPoints ? (calculatePricePerPerson(currentMatch.totalCourtFee, 4) || 20) : 0;
      
      setDialogContent({
          spotIndex,
          isJoiningWithPoints,
          pointsCost: pointsCostForSpot,
          price: pricePerPlayer
      });
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
                onBookingSuccess();
            }
            setShowConfirmDialog(false);
        });
    };

    const handleConfirmPrivate = () => {
        if (!currentUser) return;
        setIsProcessingPrivateAction(true);
        startTransition(async () => {
            const result = await confirmMatchAsPrivate(currentUser.id, currentMatch.id, false);
            if ('error' in result) {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            } else {
                 toast({
                    title: "¡Partida Privada Creada!",
                    description: "Comparte el enlace con tus amigos para que se unan.",
                    duration: 10000
                });
                onBookingSuccess();
            }
            setIsConfirmPrivateDialogOpen(false);
            setIsProcessingPrivateAction(false);
        });
    };
    
    const handleJoinPrivate = () => {
        if (!currentUser) return;
         startTransition(async () => {
            if (!currentMatch.privateShareCode) return;
            const result = await joinPrivateMatch(currentUser.id, currentMatch.id, currentMatch.privateShareCode);
             if ('error' in result) {
                toast({ title: "Error al Unirse", description: result.error, variant: "destructive" });
            } else {
                toast({ title: "¡Te has unido a la partida privada!", description: `Se ha reembolsado ${result.organizerRefundAmount.toFixed(2)}€ al organizador.` });
                onBookingSuccess();
            }
        });
    };

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

    if (!currentUser || !clubInfo) return <Skeleton className="h-[280px] w-full" />;
    
    const canBookPrivate = (currentMatch.bookedPlayers || []).length === 0 && isPlaceholderMatch;
    const isBookableWithPointsBySchedule = clubInfo.pointBookingSlots && isMatchBookableWithPoints(currentMatch, clubInfo);

    const matchLevelToDisplay = isPlaceholderMatch ? 'abierto' : currentMatch.level || 'abierto';
    const matchCategoryToDisplay = isPlaceholderMatch ? 'abierta' : currentMatch.category || 'abierta';
    
    const shadowEffect = clubInfo?.cardShadowEffect;
    const shadowStyle = showPointsBonus && shadowEffect?.enabled && shadowEffect.color
      ? { boxShadow: `0 0 35px ${hexToRgba(shadowEffect.color, shadowEffect.intensity)}` }
      : {};


    return (
        <>
            <Card className="w-full transition-shadow duration-300 flex flex-col bg-card border-l-4 border-l-green-400" style={shadowStyle}>
                <CardHeader className="pb-3 pt-3 px-3">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-3">
                             <div className="flex-shrink-0 text-center font-bold bg-white p-1 rounded-md w-14 shadow-lg border border-border/20">
                                <p className="text-xs uppercase">{format(new Date(currentMatch.startTime), "EEE", { locale: es })}</p>
                                <p className="text-3xl leading-none">{format(new Date(currentMatch.startTime), "d")}</p>
                                <p className="text-xs uppercase">{format(new Date(currentMatch.startTime), "MMM", { locale: es })}</p>
                            </div>
                             <div className="flex flex-col">
                                <span className="font-semibold text-lg">{format(new Date(currentMatch.startTime), 'HH:mm')}h</span>
                                <span className="text-sm text-muted-foreground flex items-center"><Clock className="mr-1 h-3.5 w-3.5"/>{currentMatch.durationMinutes || 90} min</span>
                                <span className="text-sm text-muted-foreground">{clubInfo?.name || 'Club Padel'}</span>
                            </div>
                        </div>
                         <div className="flex items-center gap-1.5">
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Share2 className="h-4 w-4"/></Button>
                             {canBookPrivate && (
                                <button
                                    className="flex items-center h-10 bg-purple-600 text-white rounded-lg shadow-lg cursor-pointer hover:bg-purple-700 transition-colors disabled:opacity-50"
                                    onClick={() => setIsConfirmPrivateDialogOpen(true)}
                                    disabled={isProcessingPrivateAction}
                                >
                                    <div className="flex items-center justify-center h-full w-10 bg-purple-700 rounded-l-lg">
                                        {isProcessingPrivateAction ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                                    </div>
                                    <div className="px-3 text-center">
                                        <p className="text-sm font-bold leading-tight">Reservar</p>
                                        <p className="text-xs leading-tight">Privada</p>
                                    </div>
                                </button>
                             )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="px-3 pb-3 flex-grow">
                     <div className="flex justify-around items-center gap-1.5 my-2">
                         <InfoButton icon={Users2} text="Cat." onClick={() => handleInfoClick('category')} />
                         <InfoButton icon={Hash} text="# Pista" onClick={() => handleInfoClick('court')} />
                         <InfoButton icon={BarChartHorizontal} text="Nivel" onClick={() => handleInfoClick('level')} />
                     </div>

                    <div className="grid grid-cols-4 gap-2 items-start justify-items-center mt-3">
                        {Array.from({ length: 4 }).map((_, index) => (
                           <MatchSpotDisplay
                                key={index}
                                spotIndex={index}
                                match={currentMatch}
                                currentUser={currentUser}
                                onJoin={handleJoinClick}
                                onJoinPrivate={handleJoinPrivate}
                                isPending={isPending && dialogContent.spotIndex === index}
                                userHasOtherConfirmedActivityToday={hasAnyConfirmedActivityForDay(currentUser.id, new Date(currentMatch.startTime))}
                                isUserLevelCompatible={isUserLevelCompatibleWithActivity(matchLevelToDisplay, currentUser.level, isPlaceholderMatch)}
                                canJoinThisPrivateMatch={canJoinThisPrivateMatch}
                                isOrganizer={isOrganizer}
                                canBookWithPoints={isBookableWithPointsBySchedule}
                                showPointsBonus={showPointsBonus}
                                pricePerPlayer={pricePerPlayer}
                                pointsToAward={pointsToAward}
                            />
                        ))}
                    </div>
                     <div className="mt-4">
                        <CourtAvailabilityIndicator courts={[]} availableCourts={courtAvailability.available} occupiedCourts={courtAvailability.occupied} totalCourts={courtAvailability.total} />
                    </div>
                </CardContent>
            </Card>

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
            
            <AlertDialog open={isConfirmPrivateDialogOpen} onOpenChange={setIsConfirmPrivateDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Partida Privada</AlertDialogTitle>
                        <AlertDialogDescription>
                            Pagarás la partida entera ahora ({(pricePerPlayer * 4).toFixed(2)}€) y recibirás un enlace para compartir. Se te devolverá la parte de cada amigo que se una.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isProcessingPrivateAction}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmPrivate} disabled={isProcessingPrivateAction}>
                            {isProcessingPrivateAction ? <Loader2 className="animate-spin" /> : "Confirmar y Pagar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <InfoDialog isOpen={infoDialog.open} onOpenChange={(open) => setInfoDialog(prev => ({ ...prev, open }))} title={infoDialog.title} description={infoDialog.description} icon={infoDialog.icon} />
        </>
    );
});
MatchCard.displayName = 'MatchCard';
export default MatchCard;