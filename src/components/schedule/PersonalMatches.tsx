// src/components/schedule/PersonalMatches.tsx
"use client";

import React, { useState, useEffect, useTransition, useMemo } from 'react';
import type { MatchBooking, User, Match, Club, PadelCategoryForSlot, MatchBookingMatchDetails, PadelCourt } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { List, Clock, Users, CalendarCheck, CalendarX, Loader2, Ban, Hash, Trophy, UserCircle, Gift, Info, MessageSquare, Euro, Users2 as CategoryIcon, Venus, Mars, Share2, Unlock, Lock, Repeat, Lightbulb, BarChartHorizontal, Plus } from 'lucide-react';
import { format, differenceInHours } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchUserMatchBookings, cancelMatchBooking, getMockClubs, makeMatchPublic, cancelPrivateMatchAndReofferWithPoints, getMockMatches, renewRecurringMatch, getCourtAvailabilityForInterval, fillMatchAndMakePrivate } from '@/lib/mockData';
import * as state from '@/lib/mockDataSources/state';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
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
import { Dialog as InfoDialog, DialogContent as InfoDialogContent, DialogHeader as InfoDialogHeader, DialogTitle as InfoDialogTitle, DialogFooter as InfoDialogFooter, DialogClose as InfoDialogClose } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, getPlaceholderUserName, calculatePricePerPerson } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import MatchChatDialog from '@/components/chat/MatchChatDialog';
import { displayClassCategory } from '@/types';
import { InfoCard } from '@/components/schedule/InfoCard'; 
import { useRouter } from 'next/navigation'; 
import { Separator } from '../ui/separator';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import CourtAvailabilityIndicator from '@/components/class/CourtAvailabilityIndicator';


interface PersonalMatchesProps {
  currentUser: User;
  newMatchBooking?: MatchBooking | null;
  onBookingActionSuccess: () => void;
}

interface CourtAvailabilityState {
    available: PadelCourt[];
    occupied: PadelCourt[];
    total: number;
}

const InfoButton = ({ icon: Icon, text, onClick, className }: { icon: React.ElementType, text: string, onClick: () => void, className?: string }) => (
    <button className={cn("flex-1 flex items-center justify-center text-xs h-8 rounded-full shadow-inner bg-slate-50 border border-slate-200 capitalize hover:bg-slate-100 transition-colors", className)} onClick={onClick}>
        <Icon className="mr-1.5 h-3 w-3 text-slate-500" /> 
        <span className="font-medium text-slate-700">{text}</span>
    </button>
);

const DialogInfo: React.FC<{
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  icon: React.ElementType;
}> = ({ isOpen, onOpenChange, title, description, icon: Icon }) => {
  return (
    <InfoDialog open={isOpen} onOpenChange={onOpenChange}>
      <InfoDialogContent>
        <InfoDialogHeader>
          <InfoDialogTitle className="flex items-center text-xl">
            <Icon className="mr-3 h-6 w-6 text-primary" />
            {title}
          </InfoDialogTitle>
        </InfoDialogHeader>
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
      </InfoDialogContent>
    </InfoDialog>
  );
};


const PersonalMatches: React.FC<PersonalMatchesProps> = ({ currentUser, newMatchBooking, onBookingActionSuccess }) => {
  const [bookings, setBookings] = useState<MatchBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessingAction, startProcessingTransition] = useTransition();
  const [currentActionInfo, setCurrentActionInfo] = useState<{ type: 'cancel' | 'cede' | 'cancelAndReoffer' | 'renew' | 'makePrivate', bookingId: string, matchId?: string } | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const [isChatDialogOpen, setIsChatDialogOpen] = useState(false);
  const [selectedMatchForChat, setSelectedMatchForChat] = useState<Match | null | undefined>(null);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [now, setNow] = useState(new Date());
  const [availabilityData, setAvailabilityData] = useState<Record<string, CourtAvailabilityState>>({});
  const [infoDialog, setInfoDialog] = useState<{ open: boolean, title: string, description: string, icon: React.ElementType }>({ open: false, title: '', description: '', icon: Lightbulb });
  const [isConfirmPrivateDialogOpen, setIsConfirmPrivateDialogOpen] = useState(false);
  const [isProcessingPrivateAction, setIsProcessingPrivateAction] = useState(false);


  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedBookings, fetchedMatches] = await Promise.all([
        fetchUserMatchBookings(currentUser.id),
        getMockMatches(),
      ]);
      fetchedBookings.sort((a, b) => (a.matchDetails?.startTime?.getTime() ?? 0) - (b.matchDetails?.startTime?.getTime() ?? 0));
      setBookings(fetchedBookings);
      setAllMatches(fetchedMatches);
      setError(null);

      const upcoming = fetchedBookings.filter(b => b.matchDetails && new Date(b.matchDetails.endTime) > new Date());
      const newAvailabilityData: Record<string, CourtAvailabilityState> = {};
      for (const booking of upcoming) {
          if (booking.matchDetails) {
              const availability = await getCourtAvailabilityForInterval(booking.matchDetails.clubId, new Date(booking.matchDetails.startTime), new Date(booking.matchDetails.endTime));
              newAvailabilityData[booking.activityId] = availability;
          }
      }
      setAvailabilityData(newAvailabilityData);

    } catch (err) {
      console.error("Failed to fetch user match bookings:", err);
      setError("No se pudo cargar tu horario de partidas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, [currentUser.id, newMatchBooking, onBookingActionSuccess]);

  const handleCancellationAction = (booking: MatchBooking) => {
    if (!booking.matchDetails) {
      toast({ title: "Error", description: "Detalles de la partida no disponibles.", variant: "destructive" });
      return;
    }
    setCurrentActionInfo({ type: 'cancel', bookingId: booking.id });
    startProcessingTransition(async () => {
      const result = await cancelMatchBooking(currentUser.id, booking.id);
      if ('error'in result) {
        toast({ title: 'Error al Cancelar', description: result.error, variant: 'destructive' });
      } else {
        toast({
          title: result.message?.includes("Bonificada") ? "Cancelación Bonificada" : result.message?.includes("NO Bonificada") ? "Cancelación NO Bonificada" : "Inscripción Cancelada",
          description: result.message || 'Tu inscripción ha sido cancelada.',
          className: (result.pointsAwarded && result.pointsAwarded > 0) ? 'bg-green-600 text-white' : (result.penaltyApplied) ? 'bg-yellow-500 text-white' : 'bg-accent text-accent-foreground',
          duration: 7000,
        });
        onBookingActionSuccess();
      }
      setCurrentActionInfo(null);
    });
  };

  const handleOpenChatDialog = (matchDetails: MatchBookingMatchDetails | undefined | null) => {
    if (matchDetails) {
        const fullMatchDetails: Match = {
            id: selectedMatchForChat?.id || matchDetails.clubId + Date.now(),
            ...matchDetails,
            level: matchDetails.level || 'abierto',
            bookedPlayers: matchDetails.bookedPlayers || [],
            isPlaceholder: false, 
            status: (matchDetails.bookedPlayers || []).length === 4 ? 'confirmed' : 'forming',
        };
        setSelectedMatchForChat(fullMatchDetails);
        setIsChatDialogOpen(true);
    } else {
        toast({
            title: "Error de Chat",
            description: "No se pudieron cargar los detalles de la partida para el chat.",
            variant: "destructive",
        });
    }
  };
  
    const handleInfoClick = (type: 'level' | 'court' | 'category', match: MatchBookingMatchDetails) => {
        let dialogData;
        const CategoryIconDisplay = match.category === 'chica' ? Venus : match.category === 'chico' ? Mars : CategoryIcon;

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

  const handleCancelAndReoffer = (matchId: string) => {
    setCurrentActionInfo({ type: 'cancelAndReoffer', bookingId: '', matchId: matchId });
    startProcessingTransition(async () => {
        const result = await cancelPrivateMatchAndReofferWithPoints(currentUser.id, matchId);
        if ('error' in result) {
            toast({ title: "Error al Cancelar", description: result.error, variant: "destructive" });
        } else {
            toast({ title: "Partida Cancelada y Ofertada", description: "Tu reserva ha sido cancelada y la pista está ahora disponible por puntos." });
            onBookingActionSuccess();
        }
        setCurrentActionInfo(null);
    });
  };
  
  const handleMakePrivate = (booking: MatchBooking) => {
    if (!booking.matchDetails) return;
    setCurrentActionInfo({ type: 'makePrivate', bookingId: booking.id, matchId: booking.activityId });
    startProcessingTransition(async () => {
        const result = await fillMatchAndMakePrivate(currentUser.id, booking.activityId);
        if ('error' in result) {
            toast({ title: "Error al Hacer Privada", description: result.error, variant: 'destructive' });
        } else {
            toast({ title: "¡Partida Privada!", description: `Has completado la partida. Coste de plazas restantes: ${result.cost.toFixed(2)}€.`, className: "bg-purple-600 text-white" });
            onBookingActionSuccess();
        }
        setCurrentActionInfo(null);
    });
  };


  const handleRenew = (completedMatchId: string) => {
    setCurrentActionInfo({ type: 'renew', bookingId: '', matchId: completedMatchId });
    startProcessingTransition(async () => {
        const result = await renewRecurringMatch(currentUser.id, completedMatchId);
        if ('error' in result) {
            toast({ title: "Error al Renovar", description: result.error, variant: "destructive" });
        } else {
            toast({ title: "¡Reserva Renovada!", description: "Tu partida para la próxima semana ha sido confirmada." });
            onBookingActionSuccess();
        }
        setCurrentActionInfo(null);
    });
  };

  const upcomingBookings = bookings.filter(b => b.matchDetails && new Date(b.matchDetails.endTime) > now);
  const pastBookings = bookings.filter(b => b.matchDetails && new Date(b.matchDetails.endTime) <= now);


  if (loading) {
    return (
      <div className="space-y-4">
         <Skeleton className="h-8 w-3/4" />
         <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-destructive p-4 text-center">{error}</div>
    );
  }

  const hasUpcomingBookings = upcomingBookings.length > 0;
  const hasPastBookings = pastBookings.length > 0;
  
  if (!hasUpcomingBookings && !hasPastBookings) {
     return (
        <InfoCard
            icon={Trophy}
            title="¿Echamos una Partida?"
            description="Parece que no tienes partidas en tu agenda. ¡Únete a una y demuestra tu nivel!"
            actionText="Ver Partidas"
            onActionClick={() => router.push('/activities?view=partidas')}
            storageKey="dismissed_match_suggestion"
        />
     );
  }

  const renderBookingItem = (booking: MatchBooking, isUpcomingItem: boolean) => {
      if (!booking.matchDetails) {
          return (
            <div key={booking.id} className="flex items-start space-x-3 p-3 sm:p-4 rounded-lg bg-muted/30 opacity-50 w-80">
               <div className="flex-shrink-0 mt-1">
                 <CalendarX className="h-5 w-5 text-muted-foreground" />
               </div>
               <div className="flex-grow space-y-1">
                   <p className="font-medium capitalize italic">Detalles de la partida no disponibles</p>
                   <p className="text-sm text-muted-foreground">Reserva ID: {booking.id}</p>
               </div>
            </div>
          );
      }

      const { startTime, endTime, courtNumber, level, category, bookedPlayers, totalCourtFee, clubId, status, organizerId, privateShareCode, isRecurring, nextRecurringMatchId, durationMinutes } = booking.matchDetails;
      const isMatchFull = (bookedPlayers || []).length >= 4;
      const wasBookedWithPoints = booking.bookedWithPoints === true;
      const clubDetails = getMockClubs().find(c => c.id === clubId);
      const isOrganizerOfPrivateMatch = status === 'confirmed_private' && organizerId === currentUser.id;
      const availability = availabilityData[booking.activityId];
      const pricePerPlayer = calculatePricePerPerson(totalCourtFee || 0, 4);
      const isUserInMatch = (bookedPlayers || []).some(p => p.userId === currentUser.id);

      let cancellationButtonText = "Cancelar Inscripción";
      let cancellationDialogText = "¿Estás seguro de que quieres cancelar tu inscripción?";
      let buttonVariant: "destructive" | "outline" = "destructive";

      if (isMatchFull) {
          if (wasBookedWithPoints) {
              cancellationButtonText = "Cancelación NO Bonificada";
              buttonVariant = "destructive";
              cancellationDialogText = "Cancelación NO Bonificada: Al cancelar esta partida (pagada con puntos), los puntos NO serán devueltos. Tu plaza se liberará como 'Libre'.";
          } else { 
              cancellationButtonText = "Cancelación Bonificada";
              buttonVariant = "outline";
              const pricePaid = calculatePricePerPerson(totalCourtFee || 0, 4);
              const bonusPoints = Math.round(pricePaid * (clubDetails?.pointSettings?.cancellationPointPerEuro || 0));
              cancellationDialogText = `Cancelación Bonificada: Al cancelar, recibirás ${bonusPoints} puntos. Tu plaza (valor ${pricePaid.toFixed(2)}€) se liberará como 'Gratis'.`;
          }
      } else { 
          const penaltyPoints = clubDetails?.pointSettings?.unconfirmedCancelPenaltyPoints ?? 1;
          const penaltyEuros = clubDetails?.pointSettings?.unconfirmedCancelPenaltyEuros ?? 1;
           if(wasBookedWithPoints){
                cancellationDialogText = `Al cancelar esta pre-inscripción (pagada con puntos), los puntos NO serán devueltos. La plaza se liberará como "Libre".`;
            } else {
                cancellationDialogText = `Al cancelar esta pre-inscripción, se aplicará una penalización de ${penaltyPoints} punto(s) o ${penaltyEuros}€. La plaza se liberará como "Libre".`;
            }
      }

      const handleSharePrivateMatch = () => {
        if (!privateShareCode) {
            toast({ title: "Error", description: "No se encontró el código para compartir esta partida.", variant: "destructive" });
            return;
        }
        const shareUrl = `${window.location.origin}/?view=partidas&code=${privateShareCode}`;
        navigator.clipboard.writeText(shareUrl)
            .then(() => toast({ title: "Enlace de Partida Privada Copiado", description: "Comparte este enlace con tus amigos." }))
            .catch(() => toast({ title: "Error al Copiar", description: "No se pudo copiar el enlace.", variant: "destructive" }));
      };
      
      const handleMakeMatchPublic = () => {
         startProcessingTransition(async () => {
            const result = await makeMatchPublic(currentUser.id, booking.matchId);
            if ('error' in result) {
                toast({ title: "Error al Hacer Pública", description: result.error, variant: "destructive" });
            } else {
                toast({ title: "Partida Hecha Pública", description: "La partida ahora está abierta a todos.", className: "bg-primary text-primary-foreground" });
                onBookingActionSuccess();
            }
        });
      };
      
      const provisionalMatch = !isUpcomingItem && nextRecurringMatchId ? allMatches.find(m => m.id === nextRecurringMatchId) : undefined;
      let renewalTimeLeft = '';
      let isRenewalExpired = false;
      if (provisionalMatch?.provisionalExpiresAt) {
          const diff = new Date(provisionalMatch.provisionalExpiresAt).getTime() - now.getTime();
          isRenewalExpired = diff <= 0;
          if (!isRenewalExpired) {
              const hours = Math.floor(diff / (1000 * 60 * 60));
              const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
              const seconds = Math.floor((diff % (1000 * 60)) / 1000);
              renewalTimeLeft = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          }
      }

      const canMakePrivate = isUpcomingItem && isUserInMatch && !isMatchFull && status !== 'confirmed_private';
      const cardBorderColor = isUpcomingItem
        ? (status === 'confirmed_private' ? 'border-l-purple-600' : (isMatchFull ? 'border-l-red-500' : 'border-l-blue-500'))
        : 'border-l-gray-400';

      return (
        <div key={booking.id} className={cn("flex flex-col p-3 rounded-lg shadow-md space-y-2 border-l-4 w-80", cardBorderColor, isUpcomingItem ? 'bg-card border' : 'bg-muted/60 border border-border/50')}>
             <div className="flex items-start justify-between">
                 <div className="flex items-center space-x-3">
                     <div className="flex-shrink-0 text-center font-bold bg-white p-1 rounded-md w-14 shadow-lg border border-border/20">
                        <p className="text-xs uppercase">{format(new Date(startTime), "EEE", { locale: es })}</p>
                        <p className="text-3xl leading-none">{format(new Date(startTime), "d")}</p>
                        <p className="text-xs uppercase">{format(new Date(startTime), "MMM", { locale: es })}</p>
                    </div>
                     <div className="flex flex-col">
                        <span className="font-semibold text-lg">{format(new Date(startTime), 'HH:mm')}h</span>
                        <span className="text-sm text-muted-foreground flex items-center"><Clock className="mr-1 h-3.5 w-3.5"/>{durationMinutes || 90} min</span>
                        <span className="text-sm text-muted-foreground">{clubDetails?.name || 'Club Padel'}</span>
                    </div>
                </div>
                  <div className="mt-0.5 flex flex-col items-end gap-1.5">
                    {canMakePrivate && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <button
                                    className="flex items-center h-10 bg-purple-600 text-white rounded-lg shadow-lg cursor-pointer hover:bg-purple-700 transition-colors disabled:opacity-50"
                                    disabled={isProcessingAction}
                                >
                                    <div className="flex items-center justify-center h-full w-10 bg-purple-700 rounded-l-lg">
                                        {isProcessingAction && currentActionInfo?.bookingId === booking.id && currentActionInfo.type === 'makePrivate' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
                                    </div>
                                    <div className="px-3 text-center">
                                        <p className="text-sm font-bold leading-tight">Hacer</p>
                                        <p className="text-xs leading-tight">Privada</p>
                                    </div>
                                </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Hacer Partida Privada</AlertDialogTitle><AlertDialogDescription>Pagarás las plazas restantes para completar la partida y asegurarla. Se te cobrará el coste correspondiente de tu saldo. ¿Continuar?</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel disabled={isProcessingAction}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleMakePrivate(booking)} disabled={isProcessingAction} className="bg-purple-600 text-white hover:bg-purple-700">{isProcessingAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Sí, Hacer Privada"}</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                    {isUpcomingItem && !canMakePrivate && status !== 'confirmed_private' && <Badge variant={isMatchFull ? 'destructive' : 'default'} className={cn('text-xs', isMatchFull ? 'bg-red-500' : 'bg-blue-500')}>{isMatchFull ? 'Completa' : 'Inscrito'}</Badge>}
                    {isUpcomingItem && status === 'confirmed_private' && <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 border-purple-400">Privada</Badge>}
                    {!isUpcomingItem && <Badge variant="outline" className="text-xs">Finalizada</Badge>}

                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Share2 className="h-4 w-4"/></Button>
                  </div>
             </div>
             
             <div className="flex justify-around items-center gap-1.5 my-1">
                <InfoButton icon={CategoryIcon} text={displayClassCategory(category, true)} onClick={() => handleInfoClick('category', booking.matchDetails!)} />
                <InfoButton icon={Hash} text={courtNumber ? `# ${courtNumber}` : '# Pista'} onClick={() => handleInfoClick('court', booking.matchDetails!)} />
                <InfoButton icon={BarChartHorizontal} text={level || "Nivel"} onClick={() => handleInfoClick('level', booking.matchDetails!)} />
             </div>
           
            <div className="grid grid-cols-4 gap-2 items-start justify-items-center mt-1">
                {Array.from({ length: 4 }).map((_, idx) => {
                    const player = (bookedPlayers || [])[idx];
                    const fullPlayer = player ? (state.getMockStudents().find(s => s.id === player.userId) || (currentUser?.id === player.userId ? currentUser : null)) : null;

                    return (
                        <div key={idx} className="flex flex-col items-center group/avatar-wrapper space-y-0.5 relative text-center">
                            <TooltipProvider key={idx} delayDuration={150}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="flex flex-col items-center space-y-1">
                                            <Avatar className={cn(
                                                "h-12 w-12 border-[3px] transition-all shadow-inner",
                                                player ? "border-green-500 bg-green-100" : "border-dashed border-green-400 bg-green-50/50"
                                            )}>
                                                {player && fullPlayer ? (
                                                    <>
                                                        <AvatarImage src={fullPlayer.profilePictureUrl} data-ai-hint="player avatar small" />
                                                        <AvatarFallback className="text-sm bg-muted text-muted-foreground">{getInitials(fullPlayer.name || 'P')}</AvatarFallback>
                                                    </>
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Plus className="h-5 w-5 text-green-600 opacity-60" />
                                                    </div>
                                                )}
                                            </Avatar>
                                            <span className={cn(
                                                "text-[11px] font-medium truncate w-auto max-w-[60px]",
                                                player ? "text-foreground" : "text-muted-foreground"
                                            )}>{player ? (player.name || 'Jugador').split(' ')[0] : (pricePerPlayer > 0 ? `${pricePerPlayer.toFixed(2)}€` : "Libre")}</span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom"><p>{player ? (player.name || 'Tú') : 'Plaza Libre'}</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    );
                })}
            </div>

            {isUpcomingItem && availability && (
                <div className="pt-2 border-t mt-2">
                    <CourtAvailabilityIndicator
                        availableCourts={availability.available}
                        occupiedCourts={availability.occupied}
                        totalCourts={availability.total}
                    />
                </div>
            )}


              <div className="pt-2 border-t mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-center space-y-2 sm:space-y-0 sm:space-x-2">
                  {isOrganizerOfPrivateMatch && isUpcomingItem && (
                      <div className="flex w-full gap-2">
                         <Button variant="outline" size="sm" className="flex-1 text-xs bg-purple-500 text-white border-purple-600 hover:bg-purple-600" onClick={handleSharePrivateMatch} disabled={isProcessingAction}><Share2 className="mr-1.5 h-3.5 w-3.5" /> Compartir</Button>
                         <AlertDialog>
                             <AlertDialogTrigger asChild><Button variant="outline" size="sm" className="flex-1 text-xs border-orange-500 text-orange-600 hover:bg-orange-500/10 hover:text-orange-700" disabled={isProcessingAction}>{isProcessingAction ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin"/> : <Unlock className="mr-1.5 h-3.5 w-3.5"/>} Pública</Button></AlertDialogTrigger>
                              <AlertDialogContent>
                                 <AlertDialogHeader><AlertDialogTitle>¿Hacer Pública esta Partida?</AlertDialogTitle><AlertDialogDescription>La partida será visible para todos y podrán unirse nuevos jugadores. No se realizarán reembolsos automáticos.</AlertDialogDescription></AlertDialogHeader>
                                 <AlertDialogFooter><AlertDialogCancel disabled={isProcessingAction}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleMakeMatchPublic} disabled={isProcessingAction} className="bg-orange-500 hover:bg-orange-600 text-white">{isProcessingAction ? <Loader2 className="animate-spin h-4 w-4" /> : "Sí, Hacer Pública"}</AlertDialogAction></AlertDialogFooter>
                             </AlertDialogContent>
                         </AlertDialog>
                         <AlertDialog>
                             <AlertDialogTrigger asChild><Button variant="outline" size="sm" className="flex-1 text-xs text-destructive border-destructive hover:bg-destructive/10" disabled={isProcessingAction}><Ban className="mr-1.5 h-3.5 w-3.5" /> Ofrecer</Button></AlertDialogTrigger>
                              <AlertDialogContent>
                                 <AlertDialogHeader><AlertDialogTitle>Cancelar y Ofrecer por Puntos</AlertDialogTitle><AlertDialogDescription>Se te reembolsará el coste total de la pista ({totalCourtFee?.toFixed(2)}€). La pista quedará disponible para que otro jugador la reserve únicamente con puntos de fidelidad. ¿Estás seguro?</AlertDialogDescription></AlertDialogHeader>
                                 <AlertDialogFooter><AlertDialogCancel disabled={isProcessingAction}>Cerrar</AlertDialogCancel><AlertDialogAction onClick={() => handleCancelAndReoffer(booking.matchId)} disabled={isProcessingAction} className="bg-destructive hover:bg-destructive/90">{currentActionInfo?.type === 'cancelAndReoffer' && isProcessingAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sí, Cancelar y Ofrecer"}</AlertDialogAction></AlertDialogFooter>
                             </AlertDialogContent>
                         </AlertDialog>
                      </div>
                  )}
                 {isUpcomingItem && !isOrganizerOfPrivateMatch && (
                     <div className="flex items-center justify-center w-full">
                         <AlertDialog>
                             <AlertDialogTrigger asChild>
                                <Button 
                                    variant={buttonVariant} 
                                    size="sm" 
                                    className={cn(
                                        "w-full sm:w-auto text-xs shadow-md border", 
                                        buttonVariant === "destructive" && "bg-card text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive", 
                                        buttonVariant === "outline" && cancellationButtonText.includes("Bonificada") && "bg-green-500 text-white border-green-600 hover:bg-green-600",
                                        "disabled:opacity-50 disabled:cursor-not-allowed"
                                    )} 
                                    disabled={isProcessingAction && currentActionInfo?.bookingId === booking.id}
                                >
                                    {isProcessingAction && currentActionInfo?.bookingId === booking.id ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Ban className="mr-1.5 h-3.5 w-3.5" />}
                                    {cancellationButtonText}
                                </Button>
                             </AlertDialogTrigger>
                             <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Confirmar Cancelación?</AlertDialogTitle><AlertDialogDescription>{cancellationDialogText}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={isProcessingAction && currentActionInfo?.bookingId === booking.id}>Cerrar</AlertDialogCancel><AlertDialogAction onClick={() => handleCancellationAction(booking)} disabled={isProcessingAction && currentActionInfo?.bookingId === booking.id} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{isProcessingAction && currentActionInfo?.bookingId === booking.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sí, Cancelar"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                         </AlertDialog>
                         {isMatchFull && isUpcomingItem && (<Button variant="outline" size="sm" className="w-full sm:w-auto ml-2 text-xs bg-blue-500 text-white border-blue-600 hover:bg-blue-600" onClick={() => handleOpenChatDialog(booking.matchDetails)}><MessageSquare className="mr-1.5 h-3.5 w-3.5" />Chat</Button>)}
                     </div>
                 )}
                  {!isUpcomingItem && provisionalMatch && !isRenewalExpired && (
                    <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-2 p-2 bg-blue-50 border-t border-blue-200">
                        <span className="text-xs text-blue-700 font-medium">Renovar para la próxima semana (expira en {renewalTimeLeft}):</span>
                        <Button onClick={() => handleRenew(booking.matchId)} size="sm" className="h-8 bg-blue-600 hover:bg-blue-700" disabled={isProcessingAction}>{isProcessingAction && currentActionInfo?.type === 'renew' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Repeat className="mr-2 h-4 w-4"/>} Renovar Reserva</Button>
                    </div>
                )}
             </div>
         </div>
       );
    };

    return (
    <>
      <div className="space-y-6">
          {hasUpcomingBookings && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-primary flex items-center"><Trophy className="mr-2 h-5 w-5" /> Partidas Regulares</h3>
                  <ScrollArea>
                    <div className="flex space-x-4 pb-4">
                        {upcomingBookings.map(b => renderBookingItem(b, true))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
              </div>
          )}
          {hasUpcomingBookings && hasPastBookings && <Separator />}
          {hasPastBookings && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-muted-foreground flex items-center"><CalendarX className="mr-2 h-5 w-5" /> Partidas Pasadas</h3>
                 <ScrollArea>
                    <div className="flex space-x-4 pb-4">
                      {pastBookings.map(b => renderBookingItem(b, false))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
              </div>
          )}
      </div>
      <DialogInfo isOpen={infoDialog.open} onOpenChange={(open) => setInfoDialog(prev => ({ ...prev, open }))} title={infoDialog.title} description={infoDialog.description} icon={infoDialog.icon} />
      {selectedMatchForChat && (
          <MatchChatDialog
              isOpen={isChatDialogOpen}
              onOpenChange={setIsChatDialogOpen}
              matchDetails={selectedMatchForChat}
          />
      )}
    </>
  );
};

export default PersonalMatches;
