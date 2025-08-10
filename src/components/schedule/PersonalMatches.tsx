// src/components/schedule/PersonalMatches.tsx
"use client";

import React, { useState, useEffect, useTransition, useMemo } from 'react';
import type { MatchBooking, User, Match, Club, PadelCategoryForSlot, MatchBookingMatchDetails } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { List, Clock, Users, CalendarCheck, CalendarX, Loader2, Ban, Hash, Trophy, UserCircle, Gift, Info, MessageSquare, Euro, Users2 as CategoryIcon, Venus, Mars, Share2, Unlock, Lock, Repeat, Lightbulb } from 'lucide-react'; // Added Repeat and Lightbulb
import { format, differenceInHours } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchUserMatchBookings, cancelMatchBooking, getMockClubs, makeMatchPublic, cancelPrivateMatchAndReofferWithPoints, getMockMatches, renewRecurringMatch } from '@/lib/mockData';
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, getPlaceholderUserName, calculatePricePerPerson } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import MatchChatDialog from '@/components/chat/MatchChatDialog';
import { displayClassCategory } from '@/types';
import { InfoCard } from '@/components/schedule/InfoCard'; // Import InfoCard
import { useRouter } from 'next/navigation'; // Import useRouter
import { Separator } from '../ui/separator';
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


interface PersonalMatchesProps {
  currentUser: User;
  newMatchBooking?: MatchBooking | null;
  onBookingActionSuccess: () => void;
}

const PersonalMatches: React.FC<PersonalMatchesProps> = ({ currentUser, newMatchBooking, onBookingActionSuccess }) => {
  const [bookings, setBookings] = useState<MatchBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessingAction, startProcessingTransition] = useTransition();
  const [currentActionInfo, setCurrentActionInfo] = useState<{ type: 'cancel' | 'cede' | 'cancelAndReoffer' | 'renew', bookingId: string, matchId?: string } | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const [isChatDialogOpen, setIsChatDialogOpen] = useState(false);
  const [selectedMatchForChat, setSelectedMatchForChat] = useState<Match | null | undefined>(null);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [now, setNow] = useState(new Date());


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

  const upcomingBookings = bookings.filter(b => b.matchDetails && !b.matchDetails.eventId && new Date(b.matchDetails.endTime) > now);
  const pastBookings = bookings.filter(b => b.matchDetails && !b.matchDetails.eventId && new Date(b.matchDetails.endTime) <= now);


  if (loading) {
    return (
      <div className="space-y-4">
         <Skeleton className="h-8 w-3/4" />
         <Skeleton className="h-20 w-full" />
         <Skeleton className="h-20 w-full" />
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
            <div key={booking.id} className="flex items-start space-x-3 p-3 sm:p-4 rounded-md bg-muted/30 opacity-50">
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

      const { startTime, endTime, courtNumber, level, category, bookedPlayers, totalCourtFee, clubId, status, organizerId, privateShareCode, isRecurring, nextRecurringMatchId } = booking.matchDetails;
      const isMatchFull = (bookedPlayers || []).length >= 4;
      const wasBookedWithPoints = booking.bookedWithPoints === true;
      const clubDetails = getMockClubs().find(c => c.id === clubId);
      const isOrganizerOfPrivateMatch = status === 'confirmed_private' && organizerId === currentUser.id;

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

      let levelDisplay: string;
      if (level === 'abierto') {
          levelDisplay = 'Nivel Abierto';
      } else if (clubDetails && clubDetails.levelRanges) {
          const numericLevel = parseFloat(level);
          const matchingRange = clubDetails.levelRanges.find(range => {
              const min = parseFloat(range.min);
              const max = parseFloat(range.max);
              return !isNaN(min) && !isNaN(max) && numericLevel >= min && numericLevel <= max;
          });
          levelDisplay = matchingRange ? `${matchingRange.name} (${level})` : `Nivel ${level}`;
      } else {
          levelDisplay = `Nivel ${level}`;
      }

      const pointsCostForThisBooking = wasBookedWithPoints ? calculatePricePerPerson(totalCourtFee || 0, 4) : 0;
      const euroCostForThisBooking = !wasBookedWithPoints && totalCourtFee ? calculatePricePerPerson(totalCourtFee, 4) : 0;

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

      const cardBorderColor = isUpcomingItem
        ? (status === 'confirmed_private' ? 'border-l-purple-600' : (isMatchFull ? 'border-l-red-500' : 'border-l-blue-500'))
        : 'border-l-gray-400';
        
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

      return (
        <div key={booking.id} className={cn("flex flex-col p-3 rounded-lg shadow-md space-y-2 border-l-4", cardBorderColor, isUpcomingItem ? 'bg-card border' : 'bg-muted/60 border border-border/50')}>
             <div className="flex items-start justify-between">
                 <div className="font-semibold text-base text-foreground capitalize flex items-center">
                     {isUpcomingItem ? <CalendarCheck className="h-4 w-4 mr-1.5 text-primary" /> : <CalendarX className="h-4 w-4 mr-1.5 text-muted-foreground" />}
                     {format(new Date(startTime), 'eeee, d MMM', { locale: es })}
                 </div>
                  <div className="mt-0.5">
                     {status === 'confirmed_private' && isUpcomingItem && <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 border-purple-400">Privada</Badge>}
                     {isMatchFull && status !== 'confirmed_private' && isUpcomingItem && <Badge variant="default" className="text-xs bg-red-500">Completa</Badge>}
                      {!isMatchFull && status !== 'confirmed_private' && isUpcomingItem && <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-500">Inscrito</Badge>}
                      {!isUpcomingItem && <Badge variant="outline" className="text-xs">Finalizada</Badge>}
                  </div>
             </div>

             <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-b border-border/30 py-1">
                 <div className="flex items-center"><Clock className="h-3.5 w-3.5 mr-1" />{`${format(new Date(startTime), 'HH:mm')}h`}</div>
                 <div className="flex items-center"><Hash className="h-3.5 w-3.5 mr-1" />Pista {courtNumber}</div>
                 <div className="flex items-center"><Trophy className="h-3.5 w-3.5 mr-1" />{levelDisplay}</div>
             </div>
           
             <div className="flex items-center justify-between">
                <div className="flex items-center -space-x-2">
                    {Array.from({ length: 4 }).map((_, idx) => {
                        const player = (bookedPlayers || [])[idx];
                        const fullPlayer = player ? (state.getMockStudents().find(s => s.id === player.userId) || (currentUser?.id === player.userId ? currentUser : null)) : null;

                        return (
                            <TooltipProvider key={idx} delayDuration={150}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Avatar className="h-8 w-8 border-2 border-background">
                                            <AvatarImage src={fullPlayer?.profilePictureUrl} data-ai-hint="player avatar"/>
                                            <AvatarFallback className="text-xs">{player ? getInitials(player.name || 'U') : '?'}</AvatarFallback>
                                        </Avatar>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom"><p>{player ? (player.name || 'Tú') : 'Plaza Libre'}</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )
                    })}
                </div>
                 <div className={cn("font-semibold flex items-center", wasBookedWithPoints ? "text-purple-600" : "text-green-600")}>
                     {wasBookedWithPoints ? (
                         <> <Gift className="h-4 w-4 mr-1.5" /> {pointsCostForThisBooking} Pts </>
                     ) : (
                         <> <Euro className="h-4 w-4 mr-1.5" /> {euroCostForThisBooking.toFixed(2)}€ </>
                     )}
                 </div>
            </div>

              <div className="pt-2 border-t mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                  {isOrganizerOfPrivateMatch && isUpcomingItem && (
                      <>
                         <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs bg-purple-500 text-white border-purple-600 hover:bg-purple-600" onClick={handleSharePrivateMatch} disabled={isProcessingAction}><Share2 className="mr-1.5 h-3.5 w-3.5" /> Compartir</Button>
                         <AlertDialog>
                             <AlertDialogTrigger asChild><Button variant="outline" size="sm" className="w-full sm:w-auto text-xs border-orange-500 text-orange-600 hover:bg-orange-500/10 hover:text-orange-700" disabled={isProcessingAction}>{isProcessingAction ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin"/> : <Unlock className="mr-1.5 h-3.5 w-3.5"/>} Hacer Pública</Button></AlertDialogTrigger>
                              <AlertDialogContent>
                                 <AlertDialogHeader><AlertDialogTitle>¿Hacer Pública esta Partida?</AlertDialogTitle><AlertDialogDescription>La partida será visible para todos y podrán unirse nuevos jugadores. No se realizarán reembolsos automáticos.</AlertDialogDescription></AlertDialogHeader>
                                 <AlertDialogFooter><AlertDialogCancel disabled={isProcessingAction}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleMakeMatchPublic} disabled={isProcessingAction} className="bg-orange-500 hover:bg-orange-600 text-white">{isProcessingAction ? <Loader2 className="animate-spin h-4 w-4" /> : "Sí, Hacer Pública"}</AlertDialogAction></AlertDialogFooter>
                             </AlertDialogContent>
                         </AlertDialog>
                         <AlertDialog>
                             <AlertDialogTrigger asChild><Button variant="outline" size="sm" className="w-full sm:w-auto text-xs text-destructive border-destructive hover:bg-destructive/10" disabled={isProcessingAction}><Ban className="mr-1.5 h-3.5 w-3.5" /> Cancelar y Ofrecer</Button></AlertDialogTrigger>
                              <AlertDialogContent>
                                 <AlertDialogHeader><AlertDialogTitle>Cancelar y Ofrecer por Puntos</AlertDialogTitle><AlertDialogDescription>Se te reembolsará el coste total de la pista ({totalCourtFee?.toFixed(2)}€). La pista quedará disponible para que otro jugador la reserve únicamente con puntos de fidelidad. ¿Estás seguro?</AlertDialogDescription></AlertDialogHeader>
                                 <AlertDialogFooter><AlertDialogCancel disabled={isProcessingAction}>Cerrar</AlertDialogCancel><AlertDialogAction onClick={() => handleCancelAndReoffer(booking.matchId)} disabled={isProcessingAction} className="bg-destructive hover:bg-destructive/90">{currentActionInfo?.type === 'cancelAndReoffer' && isProcessingAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sí, Cancelar y Ofrecer"}</AlertDialogAction></AlertDialogFooter>
                             </AlertDialogContent>
                         </AlertDialog>
                      </>
                  )}
                 {isUpcomingItem && !isOrganizerOfPrivateMatch && (
                     <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto justify-end">
                         <AlertDialog>
                             <AlertDialogTrigger asChild><Button variant={buttonVariant} size="sm" className={cn("w-full sm:w-auto text-xs", buttonVariant === "destructive" && "bg-card text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive", buttonVariant === "outline" && cancellationButtonText.includes("Bonificada") && "bg-green-500 text-white border-green-600 hover:bg-green-600", "disabled:opacity-50 disabled:cursor-not-allowed")} disabled={isProcessingAction && currentActionInfo?.bookingId === booking.id}>{isProcessingAction && currentActionInfo?.bookingId === booking.id ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Ban className="mr-1.5 h-3.5 w-3.5" />}{cancellationButtonText}</Button></AlertDialogTrigger>
                             <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Confirmar Cancelación?</AlertDialogTitle><AlertDialogDescription>{cancellationDialogText}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={isProcessingAction && currentActionInfo?.bookingId === booking.id}>Cerrar</AlertDialogCancel><AlertDialogAction onClick={() => handleCancellationAction(booking)} disabled={isProcessingAction && currentActionInfo?.bookingId === booking.id} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{isProcessingAction && currentActionInfo?.bookingId === booking.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sí, Cancelar"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                         </AlertDialog>
                         {isMatchFull && isUpcomingItem && (<Button variant="outline" size="sm" className="w-full sm:w-auto text-xs bg-blue-500 text-white border-blue-600 hover:bg-blue-600" onClick={() => handleOpenChatDialog(booking.matchDetails)}><MessageSquare className="mr-1.5 h-3.5 w-3.5" />Chat</Button>)}
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
                  <div className="space-y-4">
                      {upcomingBookings.map(b => renderBookingItem(b, true))}
                  </div>
              </div>
          )}
          {hasUpcomingBookings && hasPastBookings && <Separator />}
          {hasPastBookings && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-muted-foreground flex items-center"><CalendarX className="mr-2 h-5 w-5" /> Partidas Pasadas</h3>
                  <div className="space-y-4">
                      {pastBookings.map(b => renderBookingItem(b, false))}
                  </div>
              </div>
          )}
      </div>
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

export default PersonalMatches;
