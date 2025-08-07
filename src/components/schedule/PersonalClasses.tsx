"use client";

import React, { useMemo, useState, useTransition, useCallback, memo } from 'react';
import type { Booking, User, Review, Club, TimeSlot, MatchPadelLevel, ClassPadelLevel } from '@/types';
import { Clock, Users, CalendarCheck, CalendarX, UserCircle, Loader2, Ban, Lock, Star, CircleCheckBig, BarChart, Info, Hash, MessageSquare, Edit3, Gift, ShieldQuestion, CheckCircle as CheckCircleIcon, Euro, Share, Unlock, AlertTriangle } from 'lucide-react';
import { format, differenceInHours } from 'date-fns';
import { es } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'; 
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { getInitials, calculatePricePerPerson, getPlaceholderUserName } from '@/lib/utils';
import { isSlotEffectivelyCompleted, getMockTimeSlots, getMockInstructors, getMockClubs, getMockStudents, makeClassPublic, addReviewToState as addReview, cancelBooking } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { displayClassLevel } from '@/types';
import Link from 'next/link';

interface BookingListItemProps {
    booking: Booking;
    isUpcoming: boolean;
    ratedBookings: Record<string, number>;
    onRateClass: (bookingId: string, instructorName: string, rating: number) => void;
    currentUser: User;
    onBookingCancelledOrCeded: () => void;
}

interface CancelBookingResultDetailed {
    bookingId?: string;
    slotId?: string;
    pointsAwarded?: number;
    penaltyApplied?: { type: 'point' | 'euro'; amount: number };
    isGratisBookingCancelled?: boolean;
    gratisPointsRecoveryStatus?: 'pending' | 'recovered' | 'lost';
    newSlotState?: TimeSlot;
    message?: string;
    error?: string;
}


const BookingListItemComponent: React.FC<BookingListItemProps> = ({
    booking,
    isUpcoming,
    ratedBookings,
    onRateClass,
    currentUser,
    onBookingCancelledOrCeded,
}) => {
    const { slotDetails } = booking;
    const { toast } = useToast();
    const [isProcessingAction, startProcessingTransition] = useTransition();
    const [isProcessingOpinion, startOpinionTransition] = useTransition();

    const [isOpinionDialogOpen, setIsOpinionDialogOpen] = useState(false);
    const [currentOpinionText, setCurrentOpinionText] = useState('');
    const [opinionsSubmitted, setOpinionsSubmitted] = useState<Set<string>>(new Set());
    const [selectedBookingForOpinion, setSelectedBookingForOpinion] = useState<Booking | null>(null);

    const displayInstructorRating = useMemo(() => {
        if (!isUpcoming && slotDetails?.instructorName) {
            let hash = 0;
            const str = slotDetails.instructorName + booking.id;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash |= 0;
            }
            const randomVal = (Math.abs(hash) % 16) / 10;
            return (3.5 + randomVal).toFixed(1);
        }
        return null;
    }, [isUpcoming, booking.id, slotDetails?.instructorName]);
    
    const renderStarsDisplay = (ratingString: string | null) => {
        if (!ratingString) return null;
        const rating = parseFloat(ratingString);
        if (isNaN(rating)) return null;

        const fullStars = Math.round(rating);
        return (
            <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                        key={i}
                        className={cn(
                            "h-3.5 w-3.5",
                            i < fullStars ? "fill-amber-400 text-amber-500" : "fill-gray-300 text-gray-400"
                        )}
                    />
                ))}
                 <span className="ml-1.5 text-xs text-muted-foreground font-medium">({rating.toFixed(1)})</span>
            </div>
        );
    };

    if (!slotDetails) {
        return (
            <div key={booking.id} className="flex items-start space-x-3 p-3 sm:p-4 rounded-md bg-muted/30 opacity-50">
               <div className="flex-shrink-0 mt-1">
                 <CalendarX className="h-5 w-5 text-muted-foreground" />
               </div>
               <div className="flex-grow space-y-1">
                   <p className="font-medium capitalize italic text-foreground">Detalles de la clase no disponibles</p>
                   <p className="text-sm text-foreground">Reserva ID: {booking.id}</p>
               </div>
            </div>
        );
    }

    const fullSlot = getMockTimeSlots().find(s => s.id === booking.activityId);
    const { completed: isOverallSlotConfirmed, size: overallConfirmedSize } = fullSlot ? isSlotEffectivelyCompleted(fullSlot) : { completed: false, size: null };
    const wasConfirmed = slotDetails.status === 'confirmed' || slotDetails.status === 'confirmed_private';


    const currentRating = ratedBookings[booking.id];
    const isRated = typeof currentRating === 'number';
    const wasBookedWithPoints = booking.bookedWithPoints === true;

    const isOrganizerOfPrivateClass = slotDetails.status === 'confirmed_private' && slotDetails.organizerId === currentUser.id;

    const handleOpenOpinionDialog = useCallback(() => {
        setSelectedBookingForOpinion(booking);
        setCurrentOpinionText('');
        setIsOpinionDialogOpen(true);
    }, [booking]);

    const handleSendOpinion = useCallback(async () => {
        if (!currentUser) { toast({ title: "Error", description: "Debes iniciar sesión para enviar una opinión.", variant: "destructive" }); return; }
        if (!selectedBookingForOpinion || !selectedBookingForOpinion.slotDetails || !currentOpinionText.trim()) { toast({ title: "Error", description: "La opinión no puede estar vacía.", variant: "destructive" }); return; }

        startOpinionTransition(async () => {
            const instructor = getMockInstructors().find(i => i.name === selectedBookingForOpinion.slotDetails!.instructorName);
            const reviewData = {
                activityId: selectedBookingForOpinion.activityId,
                activityType: 'class' as const,
                userId: currentUser.id,
                rating: ratedBookings[selectedBookingForOpinion.id],
                comment: currentOpinionText,
                instructorId: instructor?.id,
            };
            try {
                addReview(reviewData); // This is now a direct state update
                toast({ title: "Opinión Enviada", description: "¡Gracias por tu feedback!", className: "bg-primary text-primary-foreground" });
                setOpinionsSubmitted(prev => new Set(prev).add(selectedBookingForOpinion.id));
                setIsOpinionDialogOpen(false);
            } catch(e) {
                toast({ title: "Error al Enviar Opinión", description: "No se pudo guardar la opinión.", variant: "destructive" });
            }
        });
    }, [currentUser, selectedBookingForOpinion, currentOpinionText, ratedBookings, toast]);

    const handleCancelBookingClick = useCallback(async () => {
        if (!currentUser || !fullSlot) return;
        startProcessingTransition(async () => {
            const result = await cancelBooking(currentUser.id, booking.id) as CancelBookingResultDetailed;
            if (result.error) {
                toast({ title: 'Error al Cancelar', description: result.error, variant: "destructive" });
            } else {
                toast({
                    title: result.message?.startsWith("Cancelación Bonificada") ? 'Cancelación Bonificada' : result.message?.startsWith("Cancelación NO Bonificada") ? 'Cancelación NO Bonificada' : 'Reserva Cancelada',
                    description: result.message || 'Tu inscripción ha sido cancelada.',
                    className: (result.pointsAwarded && result.pointsAwarded > 0) ? 'bg-green-600 text-white' : (result.penaltyApplied || booking.bookedWithPoints) ? 'bg-yellow-500 text-white' : 'bg-accent text-accent-foreground',
                    duration: 7000,
                });
                onBookingCancelledOrCeded();
            }
        });
    }, [currentUser, fullSlot, booking.id, booking.bookedWithPoints, toast, onBookingCancelledOrCeded]);
    
    const handleMakeClassPublic = useCallback(async () => {
        if (!currentUser || !fullSlot || !isOrganizerOfPrivateClass) return;
        startProcessingTransition(async () => {
            const result = await makeClassPublic(currentUser.id, fullSlot.id);
            if ('error' in result) {
                toast({ title: 'Error al Hacer Pública', description: result.error, variant: "destructive" });
            } else {
                toast({
                    title: "Clase Convertida a Pública",
                    description: "La clase ahora está abierta para pre-inscripciones y ya no es privada.",
                    className: "bg-primary text-primary-foreground",
                    duration: 7000,
                });
                onBookingCancelledOrCeded();
            }
        });
    }, [currentUser, fullSlot, isOrganizerOfPrivateClass, toast, onBookingCancelledOrCeded]);

    const pricePerPerson = useMemo(() => calculatePricePerPerson(slotDetails.totalPrice, booking.groupSize), [slotDetails.totalPrice, booking.groupSize]);
    const pointsCostForBooking = wasBookedWithPoints ? calculatePricePerPerson(slotDetails.totalPrice || 0, 1) : 0;

    const cancellationButtonInfo = useMemo(() => {
        if (!isUpcoming) return null;
        if (isOrganizerOfPrivateClass) return null;

        if (isOverallSlotConfirmed) {
            if (!wasBookedWithPoints) {
                return { text: "Cancelación Bonificada", variant: "outline" as const, bonificada: true };
            } else {
                 return { text: "Cancelación NO Bonificada", variant: "destructive" as const, bonificada: false };
            }
        }
        return { text: "Cancelar Inscripción", variant: "destructive" as const, bonificada: false };
    }, [isUpcoming, isOverallSlotConfirmed, wasBookedWithPoints, isOrganizerOfPrivateClass]);

    const cancellationDialogDescription = useMemo(() => {
        let description = "";
        if (isOverallSlotConfirmed) {
            if (!wasBookedWithPoints) {
                const club = getMockClubs().find(c => c.id === slotDetails.clubId);
                const bonusPoints = Math.round(pricePerPerson * (club?.pointSettings?.cancellationPointPerEuro || 0));
                description = `Cancelación Bonificada: Al cancelar esta clase confirmada, recibirás ${bonusPoints} puntos de fidelidad. Tu plaza (valor ${pricePerPerson.toFixed(2)}€) se liberará como "Gratis" para otros alumnos (canjeable por ${Math.round(pricePerPerson)} puntos).`;
            } else {
                description = `Cancelación NO Bonificada: Al cancelar esta clase (pagada con ${pointsCostForBooking} puntos), los puntos NO serán devueltos. Tu plaza se liberará como "Libre".`;
            }
        } else {
             const club = getMockClubs().find(c => c.id === slotDetails.clubId);
             const penaltyPoints = club?.pointSettings?.unconfirmedCancelPenaltyPoints ?? 1;
             const penaltyEuros = club?.pointSettings?.unconfirmedCancelPenaltyEuros ?? 1;
            if(wasBookedWithPoints){
                description = `Al cancelar esta pre-inscripción (pagada con ${pointsCostForBooking} puntos), los puntos NO serán devueltos. La plaza se liberará como "Libre".`;
            } else {
                description = `Al cancelar esta pre-inscripción (valor ${pricePerPerson.toFixed(2)}€), se aplicará una penalización de ${penaltyPoints} punto(s) o ${penaltyEuros}€. La plaza se liberará como "Libre".`;
            }
        }
        return description;
    }, [isOverallSlotConfirmed, wasBookedWithPoints, pricePerPerson, pointsCostForBooking, slotDetails.clubId, slotDetails.totalPrice]);
    
    const cardBorderColor = isUpcoming
        ? (isOrganizerOfPrivateClass ? 'border-l-purple-600' : (isOverallSlotConfirmed ? 'border-l-red-500' : 'border-l-blue-500'))
        : 'border-l-gray-400';

    const playersInThisOption = useMemo(() => {
        return (slotDetails.bookedPlayers || []).filter(p => p.groupSize === booking.groupSize);
    }, [slotDetails.bookedPlayers, booking.groupSize]);

    const handleSharePrivateClass = () => {
        if (!slotDetails?.privateShareCode) {
            toast({ title: "Error", description: "No se encontró el código para compartir esta clase.", variant: "destructive" });
            return;
        }
        const shareUrl = `${window.location.origin}/clases/${booking.activityId}?code=${slotDetails.privateShareCode}`;
        navigator.clipboard.writeText(shareUrl)
            .then(() => toast({ title: "Enlace de Clase Privada Copiado", description: "Comparte este enlace con tus amigos para que se unan." }))
            .catch(() => toast({ title: "Error al Copiar", description: "No se pudo copiar el enlace.", variant: "destructive" }));
    };

    const instructor = getMockInstructors().find(i => i.id === slotDetails.instructorId);

    return (
        <>
        <div key={booking.id} className={cn("flex flex-col p-3 sm:p-4 rounded-lg shadow-md space-y-3 border-l-4 mx-auto max-w-md", cardBorderColor, isUpcoming ? 'bg-card border border-border' : 'bg-muted/60 border border-border/50')}>
             <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                 <div className="font-semibold text-lg text-foreground capitalize flex items-center">
                     {isUpcoming ? <CalendarCheck className="h-5 w-5 mr-2 text-primary" /> : <CalendarX className="h-5 w-5 mr-2 text-muted-foreground" />}
                     {format(new Date(slotDetails.startTime), "eeee, d MMM yyyy", { locale: es })}
                 </div>
                  <div className="mt-1 sm:mt-0">
                     {isOrganizerOfPrivateClass && isUpcoming && (
                        <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 border-purple-400 hover:bg-purple-200">
                            <Lock className="h-3 w-3 mr-1" /> Clase Privada ({slotDetails.confirmedPrivateSize}p)
                        </Badge>
                    )}
                    {!isOrganizerOfPrivateClass && isOverallSlotConfirmed && isUpcoming && (
                        <Badge variant="default" className="text-xs bg-red-500 text-white border-red-700 hover:bg-red-600">
                            <CircleCheckBig className="h-3 w-3 mr-1"/>Clase Confirmada ({overallConfirmedSize}p)
                        </Badge>
                    )}
                    {!isOrganizerOfPrivateClass && !isOverallSlotConfirmed && isUpcoming && (
                        <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-500 hover:bg-blue-200">
                            <Info className="mr-1 h-3 w-3"/>Pre-inscrito ({booking.groupSize}p)
                        </Badge>
                    )}
                    {!isUpcoming && (
                         wasConfirmed ? (
                            <Badge variant="outline" className="text-xs bg-gray-200 text-gray-700 border-gray-400">Finalizada</Badge>
                         ) : (
                            <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 border-amber-300">Expirada</Badge>
                         )
                    )}
                  </div>
             </div>

             <div className="flex flex-col space-y-1.5 text-sm text-muted-foreground">
                <div className="flex items-center gap-x-4 flex-wrap">
                    <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1.5" />
                        {`${format(new Date(slotDetails.startTime), 'HH:mm', { locale: es })} - ${format(new Date(slotDetails.endTime), 'HH:mm', { locale: es })}`}
                    </div>
                    {slotDetails?.courtNumber && (
                        <div className="flex items-center">
                             <Badge className="bg-primary/10 text-primary border-primary/30 px-2 py-0.5 text-xs">
                                <Hash className="h-3 w-3 mr-1" /> Pista {slotDetails.courtNumber}
                             </Badge>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-x-4 flex-wrap">
                    {slotDetails?.level && (
                        <div className="flex items-center">
                            <Badge variant="outline" className="capitalize text-xs px-2 py-0.5 whitespace-nowrap">
                                 <BarChart className="h-3 w-3 mr-1 -rotate-90" />{displayClassLevel(slotDetails.level)}
                            </Badge>
                        </div>
                    )}
                    <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1.5" /> Clase de {booking.groupSize}
                    </div>
                </div>
            </div>
           
            {slotDetails?.instructorName && slotDetails.instructorId && (
                <Link href={`/instructors/${slotDetails.instructorId}`} passHref className="group">
                    <div className="flex flex-wrap items-center space-x-2 text-sm text-foreground pt-1 mt-1 border-t border-border/50 group-hover:bg-muted/50 rounded-md p-1 -m-1 transition-colors">
                        <Avatar className="h-7 w-7">
                            <AvatarImage src={instructor?.profilePictureUrl || `https://randomuser.me/api/portraits/men/${simpleHash(slotDetails.instructorId)}.jpg`} alt={`Foto de ${slotDetails.instructorName}`} width={28} height={28} data-ai-hint="instructor avatar medium" />
                            <AvatarFallback className="text-xs">{getInitials(slotDetails.instructorName)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">Instructor</span>
                            <span className="font-medium -mt-0.5 truncate max-w-[150px] sm:max-w-none group-hover:underline">{slotDetails.instructorName}</span>
                        </div>
                        <div className="ml-auto">
                            {renderStarsDisplay(displayInstructorRating)}
                        </div>
                    </div>
                </Link>
            )}

             <div className="pt-2 mt-1 border-t border-border/50">
                <p className="text-xs font-medium text-secondary-foreground mb-1.5">Jugadores Inscritos ({playersInThisOption.length}/{isOrganizerOfPrivateClass ? slotDetails.confirmedPrivateSize : booking.groupSize}):</p>
                <div className={cn(
                    "grid gap-1.5",
                    (isOrganizerOfPrivateClass ? slotDetails.confirmedPrivateSize : booking.groupSize) === 1 && "grid-cols-1",
                    (isOrganizerOfPrivateClass ? slotDetails.confirmedPrivateSize : booking.groupSize) === 2 && "grid-cols-2",
                    (isOrganizerOfPrivateClass ? slotDetails.confirmedPrivateSize : booking.groupSize) === 3 && "grid-cols-3",
                    (isOrganizerOfPrivateClass ? slotDetails.confirmedPrivateSize : booking.groupSize) === 4 && "grid-cols-4"
                )}>
                    {Array.from({ length: (isOrganizerOfPrivateClass ? slotDetails.confirmedPrivateSize : booking.groupSize) || 0 }).map((_, spotIdx) => {
                        const playerInSpot = playersInThisOption[spotIdx];
                        const playerName = playerInSpot ? getPlaceholderUserName(playerInSpot.userId, currentUser.id, currentUser.name) : 'Libre';
                        return (
                            <div key={`spot-${booking.id}-${spotIdx}`} className="flex flex-col items-center text-center space-y-0.5">
                                <Avatar className={cn("h-9 w-9 shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.2)]", playerInSpot ? (playerInSpot.userId === currentUser.id ? "border-2 border-primary" : "border-gray-300") : "border-2 border-dashed border-muted-foreground/30")}>
                                    <AvatarImage
                                        src={playerInSpot ? getMockStudents().find(s => s.id === playerInSpot.userId)?.profilePictureUrl || `https://randomuser.me/api/portraits/men/${simpleHash(playerInSpot.userId) % 100}.jpg` : undefined}
                                        alt={playerName}
                                        data-ai-hint="player avatar medium"
                                    />
                                    <AvatarFallback className={cn("text-xs", !playerInSpot && "bg-transparent text-muted-foreground/60")}>
                                        {playerInSpot ? getInitials(playerName) : <UserCircle className="h-4 w-4" />}
                                    </AvatarFallback>
                                </Avatar>
                                <span className={cn("text-[10px] truncate w-full", playerInSpot ? "text-foreground font-medium" : "text-muted-foreground italic")}>
                                    {playerName.split(' ')[0]}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
            
             <div className={cn("text-sm font-semibold flex items-center pt-2 mt-2 border-t border-border/50", wasBookedWithPoints ? "text-purple-600" : "text-green-600")}>
                {wasBookedWithPoints ? (
                    <> <Gift className="h-4 w-4 mr-1.5" /> {pointsCostForBooking} Puntos </>
                ) : (
                    <> <Euro className="h-4 w-4 mr-1.5" /> {booking.isOrganizerBooking && slotDetails.totalPrice ? slotDetails.totalPrice.toFixed(2) : pricePerPerson.toFixed(2)}€ </>
                )}
            </div>

            <div className="pt-3 space-y-2 md:space-y-0 md:flex md:flex-row md:items-center md:justify-end md:space-x-2">
                {!isUpcoming && wasConfirmed && slotDetails?.instructorName && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
                        <div className="flex items-center">
                            <span className="text-xs text-foreground mr-2">Valorar:</span>
                            <div className="inline-flex space-x-0.5">
                                {[1, 2, 3, 4, 5].map((starValue) => (
                                    <Button key={starValue} variant="ghost" size="icon" className={`h-7 w-7 p-0 ${isRated ? 'cursor-default' : 'hover:text-amber-500'}`} onClick={() => !isRated && onRateClass(booking.id, slotDetails!.instructorName!, starValue)} disabled={isRated || isProcessingAction || isProcessingOpinion} aria-label={`Valorar con ${starValue} estrella${starValue > 1 ? 's' : ''}`}>
                                        <Star className={`h-4 w-4 transition-colors ${ isRated && starValue <= currentRating ? 'text-amber-400 fill-amber-400' : !isRated ? 'text-foreground/50 hover:text-amber-400' : 'text-foreground/30' }`} />
                                    </Button>
                                ))}
                            </div>
                            {isRated && <span className="text-xs text-amber-600 ml-1.5 font-medium">({currentRating}/5)</span>}
                        </div>
                        {!opinionsSubmitted.has(booking.id) ? (
                            <Button variant="outline" size="xs" className="h-auto py-1 px-2 text-xs border-primary text-primary hover:bg-primary/10 w-full sm:w-auto" onClick={handleOpenOpinionDialog} disabled={isProcessingAction || isProcessingOpinion}>
                                <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Dejar Opinión
                            </Button>
                        ) : (
                            <p className="text-xs text-green-600 italic flex items-center w-full sm:w-auto justify-center sm:justify-start"><CheckCircleIcon className="mr-1 h-3.5 w-3.5" /> Opinión Enviada</p>
                        )}
                    </div>
                )}
                 {isOrganizerOfPrivateClass && isUpcoming && (
                    <>
                        <Button
                            variant="outline" size="sm"
                            className="w-full md:w-auto px-3 py-1.5 h-auto text-xs bg-purple-500 text-white border-purple-600 hover:bg-purple-600 flex items-center justify-center"
                            onClick={handleSharePrivateClass}
                            disabled={isProcessingAction || isProcessingOpinion}
                        >
                            <Share className="mr-1.5 h-3.5 w-3.5" /> Compartir Clase Privada
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="outline" size="sm"
                                    className="w-full md:w-auto px-3 py-1.5 h-auto text-xs border-orange-500 text-orange-600 hover:bg-orange-500/10 hover:text-orange-700 flex items-center justify-center"
                                    disabled={isProcessingAction || isProcessingOpinion}
                                >
                                    {isProcessingAction ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Unlock className="mr-1.5 h-3.5 w-3.5" />} Hacer Pública
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>¿Hacer Pública esta Clase?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Si haces pública esta clase, pasará al estado de "Pre-inscripción" y cualquier alumno podrá unirse.
                                        Los alumnos ya inscritos (incluyéndote) permanecerán. No se te reembolsará el coste inicial de la clase.
                                        ¿Estás seguro?
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={isProcessingAction}>No, Mantener Privada</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleMakeClassPublic} disabled={isProcessingAction} className="bg-orange-500 hover:bg-orange-600 text-white">
                                        {isProcessingAction ? <Loader2 className="animate-spin h-4 w-4" /> : "Sí, Hacer Pública"}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </>
                 )}
                 {cancellationButtonInfo && !isOrganizerOfPrivateClass && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant={cancellationButtonInfo.variant}
                                size="sm"
                                className={cn(
                                    "w-full md:w-auto px-3 py-1.5 h-auto text-xs flex items-center justify-center",
                                    cancellationButtonInfo.variant === "destructive" && "bg-card text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive",
                                    cancellationButtonInfo.variant === "outline" && cancellationButtonInfo.bonificada && "bg-green-500 text-white border-green-600 hover:bg-green-600",
                                    "disabled:opacity-50 disabled:cursor-not-allowed"
                                )}
                                disabled={isProcessingAction || isProcessingOpinion}
                                aria-label={cancellationButtonInfo.text}
                            >
                                {isProcessingAction ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Ban className="mr-1.5 h-3.5 w-3.5" />} {cancellationButtonInfo.text}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Confirmar Cancelación?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    {cancellationDialogDescription}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel disabled={isProcessingAction}>Cerrar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleCancelBookingClick} disabled={isProcessingAction} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    {isProcessingAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sí, Cancelar Inscripción"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
        </div>
        <Dialog open={isOpinionDialogOpen && selectedBookingForOpinion?.id === booking.id} onOpenChange={(open) => { if(!open) setIsOpinionDialogOpen(false); }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center"><MessageSquare className="mr-2 h-5 w-5 text-primary" /> Tu Opinión sobre la Clase</DialogTitle>
                    <DialogDescription>Con {selectedBookingForOpinion?.slotDetails?.instructorName} el {selectedBookingForOpinion?.slotDetails?.startTime ? format(new Date(selectedBookingForOpinion.slotDetails.startTime), "dd/MM/yy 'a las' HH:mm", { locale: es }) : ''}.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-3">
                    <div>
                        <Label htmlFor="opinion-text" className="text-sm font-medium text-foreground">Escribe tu opinión:</Label>
                        <Textarea id="opinion-text" value={currentOpinionText} onChange={(e) => setCurrentOpinionText(e.target.value)} placeholder="Comparte tu experiencia sobre la clase..." rows={5} className="mt-1" />
                    </div>
                    {selectedBookingForOpinion && ratedBookings[selectedBookingForOpinion.id] && (<p className="text-xs text-muted-foreground">Ya has valorado esta clase con {ratedBookings[selectedBookingForOpinion.id]} estrella(s). Tu opinión escrita complementará esta valoración.</p>)}
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsOpinionDialogOpen(false)} disabled={isProcessingOpinion}>Cancelar</Button>
                    <Button type="button" onClick={handleSendOpinion} disabled={isProcessingOpinion || !currentOpinionText.trim()}>{isProcessingOpinion && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Enviar Opinión</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
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

const BookingListItem = memo(BookingListItemComponent);
BookingListItem.displayName = 'BookingListItem';

export default BookingListItem;
