// src/components/match/MatchCard.tsx
"use client";

import React, { useState, useMemo, useEffect, useCallback, useTransition } from 'react';
import type { Match, User, Club, PadelCourt } from '@/types';
import { getMockStudents, getMockClubs, bookMatch, confirmMatchAsPrivate, joinPrivateMatch, makeMatchPublic, bookCourtForMatchWithPoints, calculateActivityPrice, getCourtAvailabilityForInterval, isMatchBookableWithPoints, isUserLevelCompatibleWithActivity, hasAnyConfirmedActivityForDay } from '@/lib/mockData';
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
import { Clock, Users, Plus, Loader2, Gift, CreditCard, AlertTriangle, Lock, Star, Share2, Hash, Users2, Venus, Mars, BarChartHorizontal, Lightbulb, Euro } from 'lucide-react';
import { MatchSpotDisplay } from '@/components/match/MatchSpotDisplay';
import CourtAvailabilityIndicator from '@/components/class/CourtAvailabilityIndicator';


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
  currentUser: User;
  onBookingSuccess: () => void;
  onMatchUpdate: (updatedMatch: Match) => void;
  matchShareCode?: string | null;
  showPointsBonus: boolean;
}


const MatchCard: React.FC<MatchCardProps> = React.memo(({ match: initialMatch, currentUser, onBookingSuccess }) => {
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

    const isUserBooked = useMemo(() => currentMatch.bookedPlayers.some(p => p.userId === currentUser.id), [currentMatch.bookedPlayers, currentUser.id]);
    const isOrganizer = currentUser.id === currentMatch.organizerId;
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
        if (!isPlaceholderMatch || isUserBooked) return 0;
        const clubPointSettings = clubInfo?.pointSettings;
        if (!clubPointSettings) return 0;
        const basePoints = clubPointSettings.firstToJoinMatch || 0;
        const daysInAdvance = differenceInDays(startOfDay(new Date(currentMatch.startTime)), startOfDay(new Date()));
        const anticipationPoints = Math.max(0, daysInAdvance);
        return basePoints + anticipationPoints;
    }, [isPlaceholderMatch, isUserBooked, currentMatch.startTime, clubInfo]);

    
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
        setIsProcessingPrivateAction(true);
        startTransition(async () => {
            const result = await confirmMatchAsPrivate(currentUser.id, currentMatch.id, false);
            if ('error' in result) {
                toast({ title: 'Error', description: result.error, variant: 'destructive' });
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

    return (
        <>
            <Card className="w-full transition-shadow duration-300 flex flex-col bg-card border-l-4 border-l-green-400">
                <CardHeader className="pb-3 pt-3 px-3">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 text-center font-bold bg-muted p-1 rounded-md w-14">
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
                                <Button className="bg-purple-600 text-white rounded-lg h-9 px-3 flex items-center gap-1 shadow-md hover:bg-purple-700" onClick={() => setIsConfirmPrivateDialogOpen(true)}>
                                    <div className="flex items-center justify-center h-5 w-5 rounded-full bg-white/20"><Plus className="h-4 w-4"/></div>
                                    <div className="flex flex-col items-start leading-none -space-y-1">
                                         <span className="text-[10px]">Reservar</span>
                                         <span className="font-bold">Privada</span>
                                    </div>
                                </Button>
                             )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="px-3 pb-3 flex-grow">
                     <div className="flex justify-around items-center gap-1.5 my-2">
                         <Button variant="outline" className="flex-1 h-8 rounded-full shadow-inner bg-slate-50 border-slate-200 capitalize" onClick={() => handleInfoClick('category')}>
                            <Users2 className="mr-1.5 h-4 w-4"/>{displayClassCategory(matchCategoryToDisplay)}
                         </Button>
                         <Button variant="outline" className="flex-1 h-8 rounded-full shadow-inner bg-slate-50 border-slate-200" onClick={() => handleInfoClick('court')}>
                            <Hash className="mr-1.5 h-4 w-4"/>{currentMatch.courtNumber ? `Pista ${currentMatch.courtNumber}` : 'Sin Asignar'}
                         </Button>
                         <Button variant="outline" className="flex-1 h-8 rounded-full shadow-inner bg-slate-50 border-slate-200 capitalize" onClick={() => handleInfoClick('level')}>
                            <BarChartHorizontal className="mr-1.5 h-4 w-4"/>{matchLevelToDisplay}
                         </Button>
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
                                userHasOtherConfirmedActivityToday={userHasOtherConfirmedActivityToday}
                                isUserLevelCompatible={isUserLevelCompatibleWithActivity(matchLevelToDisplay, currentUser.level, isPlaceholderMatch)}
                                canJoinThisPrivateMatch={canJoinThisPrivateMatch}
                                isOrganizer={isOrganizer}
                                canBookWithPoints={isBookableWithPointsBySchedule}
                                showPointsBonus={true}
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
                        <AlertDialogTitle>Confirmar Inscripción</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="text-center text-lg text-foreground space-y-4 py-4">
                               <div className="space-y-1">
                                <div>Te apuntas a una partida de pádel.</div>
                                <div className="flex items-center justify-center text-3xl font-bold">
                                     {dialogContent.isJoiningWithPoints || (currentMatch.gratisSpotAvailable && currentMatch.bookedPlayers.length === 3)
                                         ? <> <Gift className="h-8 w-8 mr-2 text-yellow-500" /> {dialogContent.pointsCost} <span className="text-lg ml-1">puntos</span> </>
                                         : <> <Euro className="h-7 w-7 mr-1" /> {dialogContent.price.toFixed(2)} </>
                                     }
                                </div>
                                 {!dialogContent.isJoiningWithPoints && pointsToAward > 0 && (
                                    <div className="text-sm font-semibold text-amber-600 flex items-center justify-center">
                                        <Star className="h-4 w-4 mr-1.5 fill-amber-400" />
                                        ¡Ganarás {pointsToAward} puntos por esta reserva!
                                    </div>
                                 )}
                              </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmJoin} disabled={isPending}>
                            {isPending ? <Loader2 className="animate-spin" /> : "Confirmar"}
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
