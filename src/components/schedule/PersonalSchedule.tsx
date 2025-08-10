// src/components/schedule/PersonalSchedule.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback, useTransition } from 'react';
import type { Booking, User, Review, TimeSlot, PadelCourt, Instructor } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { List, Star, Activity, CheckCircle, CalendarX, Ban, UserCircle as UserIcon, Clock, Hash, Euro, Gift, Lightbulb, BarChartHorizontal, Users2, Venus, Mars, Plus, Share2, Lock, Loader2 } from 'lucide-react';
import { isPast, format, differenceInHours } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { displayClassLevel, displayClassCategory } from '@/types';
import { cancelBooking, fetchUserBookings, addReviewToState, getMockStudents, getMockInstructors, isSlotEffectivelyCompleted, getCourtAvailabilityForInterval, fillClassAndMakePrivate } from '@/lib/mockData';
import { useRouter } from 'next/navigation';
import { InfoCard } from './InfoCard';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { calculatePricePerPerson } from '@/lib/utils';
import Link from 'next/link';
import CourtAvailabilityIndicator from '@/components/class/CourtAvailabilityIndicator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';


interface CourtAvailabilityState {
    available: PadelCourt[];
    occupied: PadelCourt[];
    total: number;
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


const DialogInfo: React.FC<{
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


interface BookingListItemProps {
  booking: Booking;
  isUpcoming: boolean;
  ratedBookings: Record<string, number>;
  onRateClass: (bookingId: string, instructorName: string, rating: number) => void;
  currentUser: User;
  onBookingCancelledOrCeded: () => void;
  instructor: Instructor | null;
  availability: CourtAvailabilityState;
}

const BookingListItem: React.FC<BookingListItemProps> = ({ booking, isUpcoming, ratedBookings, onRateClass, currentUser, onBookingCancelledOrCeded, instructor, availability }) => {
  const { toast } = useToast();
  const [isCancelling, setIsCancelling] = useState(false);
  const [isMakingPrivate, startMakePrivateTransition] = useTransition();
  const [infoDialog, setInfoDialog] = useState<{ open: boolean, title: string, description: string, icon: React.ElementType }>({ open: false, title: '', description: '', icon: Lightbulb });
  
  if (!booking.slotDetails || !instructor) return null;

  const {
    id: bookingId,
    slotDetails,
    bookedWithPoints,
  } = booking;

  const {
      id: slotId, startTime, endTime, instructorName, level, category, totalPrice, bookedPlayers, status, courtNumber, durationMinutes
  } = slotDetails;

  const handleCancel = async () => {
    setIsCancelling(true);
    const result = await cancelBooking(currentUser.id, bookingId);
    if ('error' in result) {
      toast({ title: 'Error al cancelar', description: result.error, variant: 'destructive' });
    } else {
      toast({
        title: result.message?.includes("Bonificada") ? "Cancelación Bonificada" : "Inscripción Cancelada",
        description: result.message || 'Tu inscripción ha sido cancelada.',
        className: (result.pointsAwarded && result.pointsAwarded > 0) ? 'bg-green-600 text-white' : 'bg-accent text-accent-foreground'
      });
      onBookingCancelledOrCeded();
    }
    setIsCancelling(false);
  };
  
  const handleMakePrivate = () => {
      startMakePrivateTransition(async () => {
        const result = await fillClassAndMakePrivate(currentUser.id, slotId);
        if('error' in result) {
            toast({ title: "Error", description: result.error, variant: "destructive"});
        } else {
            toast({
                title: "¡Clase Privada!",
                description: `Has completado la clase. Coste de plazas restantes: ${result.cost.toFixed(2)}€.`,
                className: "bg-purple-600 text-white"
            });
            onBookingCancelledOrCeded();
        }
      });
  };
  
  const handleInfoClick = (type: 'level' | 'court' | 'category') => {
        let dialogData;
        const CategoryIcon = category === 'chica' ? Venus : category === 'chico' ? Mars : Users2;
        switch (type) {
            case 'level':
                 dialogData = { title: 'Nivel de la Clase', description: 'Este es el rango de nivel para esta clase. Se ajusta según el primer jugador inscrito para asegurar que sea competitiva.', icon: Lightbulb };
                 break;
            case 'court':
                 dialogData = { title: 'Asignación de Pista', description: 'La pista se asigna automáticamente solo cuando la clase está completa.\nRecibirás una notificación con el número de pista cuando se confirme.', icon: Hash };
                 break;
            case 'category':
                 dialogData = { title: 'Categoría de la Clase', description: `La categoría (chicos/chicas) la sugiere el primer jugador que se apunta.\nNo es una regla estricta, solo una guía para los demás.`, icon: CategoryIcon };
                 break;
        }
        setInfoDialog({ open: true, ...dialogData });
    };

  const isConfirmed = status === 'confirmed' || status === 'confirmed_private';
  const { completed: isSlotCompleted, size: completedGroupSize } = isSlotEffectivelyCompleted(slotDetails);
  
  const bookingsByGroupSize: Record<number, { userId: string; groupSize: 1 | 2 | 3 | 4 }[]> = { 1: [], 2: [], 3: [], 4: [] };
    (bookedPlayers || []).forEach(p => {
        if (bookingsByGroupSize[p.groupSize]) bookingsByGroupSize[p.groupSize].push(p);
    });

  const cardBorderColor = isUpcoming && isConfirmed ? 'border-l-green-500' 
                        : isUpcoming && !isConfirmed ? 'border-l-blue-500' 
                        : 'border-l-gray-400';
  
  const isLevelAssigned = level !== 'abierto';
  const isCategoryAssigned = category !== 'abierta';
  const isCourtAssigned = !!courtNumber;

  const levelDisplay = displayClassLevel(level, true);
  const categoryDisplay = displayClassCategory(category, true);
  const courtDisplay = isCourtAssigned ? `Pista ${courtNumber}` : 'Clasificando';

  const CategoryIcon = category === 'chica' ? Venus : category === 'chico' ? Mars : Users2;
  const classifiedBadgeClass = 'text-blue-700 border-blue-200 bg-blue-100 hover:border-blue-300';
  
  const canMakePrivate = isUpcoming && !isSlotCompleted && status === 'pre_registration' && !!booking.groupSize && booking.groupSize > 1;

  const renderStarsDisplay = (rating: number) => {
        const fullStars = Math.round(rating);
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(<Star key={i} className={cn("h-4 w-4", i <= fullStars ? "fill-amber-500 text-amber-500" : "fill-gray-300 text-gray-400")} />);
        }
        return <div className="flex items-center">{stars} <span className="ml-1.5 text-sm text-gray-600 font-medium">({rating.toFixed(1)})</span></div>;
    };


  return (
    <>
      <div className="w-80 flex flex-col max-w-md mx-auto">
        <Card className={cn("flex flex-col shadow-md border-l-4 h-full", cardBorderColor)}>
          <CardHeader className="p-3 pb-1 space-y-2">
           <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                   <Link href={`/instructors/${instructor.id}`} passHref className="group">
                     <Avatar className="h-12 w-12">
                        <AvatarImage src={instructor?.profilePictureUrl} alt={instructor?.name || ''} data-ai-hint="instructor profile photo"/>
                        <AvatarFallback className="text-xl">{getInitials(instructor?.name || '')}</AvatarFallback>
                    </Avatar>
                   </Link>
                   <div className="flex flex-col">
                      <Link href={`/instructors/${instructor.id}`} passHref className="group">
                        <p className="font-semibold text-lg text-gray-800 -mb-0.5 group-hover:underline">{instructorName}</p>
                      </Link>
                      {renderStarsDisplay(4.5)}
                   </div>
                </div>
            </div>
             <div className="flex justify-around items-center gap-1.5 pt-1">
                <InfoButton icon={Lightbulb} text={levelDisplay} onClick={() => handleInfoClick('level')} className={cn(isLevelAssigned && classifiedBadgeClass)} />
                <InfoButton icon={CategoryIcon} text={categoryDisplay} onClick={() => handleInfoClick('category')} className={cn(isCategoryAssigned && classifiedBadgeClass)} />
                <InfoButton icon={Hash} text={courtDisplay} onClick={() => handleInfoClick('court')} className={cn(isCourtAssigned && classifiedBadgeClass)} />
            </div>

            <div className="flex justify-between items-center border-t border-border pt-1.5 mt-1">
              <div className="flex items-center space-x-3">
                  <div className="flex flex-col items-center justify-center font-bold">
                      <span className="text-4xl leading-none -mb-1">{format(new Date(startTime), 'd')}</span>
                      <span className="text-[10px] uppercase leading-none">{format(new Date(startTime), "MMM", { locale: es })}</span>
                  </div>
                  <div className="text-sm">
                      <p className="font-semibold text-foreground uppercase">{format(new Date(startTime), 'eeee HH:mm\'h\'', { locale: es })}</p>
                      <p className="text-xs text-muted-foreground flex items-center"><Clock className="mr-1 h-3 w-3" />{durationMinutes} min</p>
                  </div>
              </div>
              <Button variant="ghost" className="h-auto p-1 text-muted-foreground self-start"><Share2 className="h-5 w-5" /></Button>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-1 flex-grow">
            <div className="space-y-1">
              {([1, 2, 3, 4] as const).map((optionSize) => {
                const isUserBookedInThisOption = booking.groupSize === optionSize;
                const playersInThisOption = bookingsByGroupSize[optionSize] || [];

                return (
                  <div key={optionSize} className={cn("flex items-center justify-between p-1 rounded-md transition-all border border-transparent min-h-[44px]", isUserBookedInThisOption && "bg-blue-100/70 border-blue-200")}>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: optionSize }).map((_, index) => {
                        const playerInSpot = playersInThisOption[index];
                        const isCurrentUserInSpot = playerInSpot?.userId === currentUser.id;
                        const student = playerInSpot ? getMockStudents().find(s => s.id === playerInSpot.userId) : null;
                        return (
                          <div key={index} className="relative">
                             <Avatar className={cn("h-10 w-10 p-0 overflow-hidden shadow-[inset_0_3px_6px_0_rgba(0,0,0,0.4)]", isCurrentUserInSpot ? "border-[3px] border-primary shadow-lg" : "border-gray-300")}>
                                {playerInSpot && student ? (
                                    <>
                                        <AvatarImage src={student.profilePictureUrl} alt={student.name} data-ai-hint="student avatar small" />
                                        <AvatarFallback className="text-xs">{getInitials(student.name || '')}</AvatarFallback>
                                    </>
                                ) : (
                                    <AvatarFallback className="bg-muted border-[3px] border-dashed border-muted-foreground/30 flex items-center justify-center">
                                         <Plus className="h-4 w-4 text-muted-foreground/60" />
                                    </AvatarFallback>
                                )}
                            </Avatar>
                           </div>
                        );
                      })}
                    </div>
                    <div className="text-xs font-semibold flex items-center">
                      {bookedWithPoints ? <><Gift className="mr-1.5 h-4 w-4 text-purple-600" />Gratis</> : <><Euro className="mr-1.5 h-4 w-4 text-green-600" />{(totalPrice! / booking.groupSize).toFixed(2)}</>}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
          <CardFooter className="p-3 flex-col items-stretch space-y-2 border-t">
            <CourtAvailabilityIndicator
              availableCourts={availability.available}
              occupiedCourts={availability.occupied}
              totalCourts={availability.total}
            />
            <div className="pt-2 w-full flex gap-2">
              {isUpcoming ? (
                <>
                   {canMakePrivate && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="flex-1 bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200 hover:text-purple-800" disabled={isMakingPrivate}>
                                {isMakingPrivate ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Lock className="mr-1.5 h-3.5 w-3.5" />}
                                Hacer Privada
                            </Button>
                           </AlertDialogTrigger>
                           <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Hacer Clase Privada</AlertDialogTitle>
                                <AlertDialogDescription>Pagarás las plazas restantes para completar la clase y asegurarla. Se te cobrará el coste correspondiente.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel disabled={isMakingPrivate}>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleMakePrivate} disabled={isMakingPrivate} className="bg-purple-600 text-white hover:bg-purple-700">{isMakingPrivate ? <Loader2 className="animate-spin h-4 w-4"/> : "Sí, Hacer Privada"}</AlertDialogAction>
                            </AlertDialogFooter>
                           </AlertDialogContent>
                        </AlertDialog>
                    )}
                    <Button size="sm" variant="destructive" className="flex-1" onClick={handleCancel} disabled={isCancelling}>
                        {isCancelling ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Cancelando...</> : <><Ban className="mr-1.5 h-3.5 w-3.5" />Cancelar</>}
                    </Button>
                </>
              ) : (
                <div className="flex items-center justify-center gap-1 w-full">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => onRateClass(bookingId, instructorName, star)}>
                      <Star className={cn("h-6 w-6", (ratedBookings[bookingId] || 0) >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300')} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
      <DialogInfo isOpen={infoDialog.open} onOpenChange={(open) => setInfoDialog(prev => ({ ...prev, open }))} title={infoDialog.title} description={infoDialog.description} icon={infoDialog.icon} />
    </>
  );
};


interface PersonalScheduleProps {
  currentUser: User;
  onBookingActionSuccess: () => void;
  refreshKey: number;
}

const PersonalSchedule: React.FC<PersonalScheduleProps> = ({ currentUser, onBookingActionSuccess, refreshKey }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ratedBookings, setRatedBookings] = useState<Record<string, number>>({});
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [availabilityData, setAvailabilityData] = useState<Record<string, CourtAvailabilityState>>({});
  const { toast } = useToast();
  const router = useRouter();


  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [fetchedBookings, fetchedInstructors] = await Promise.all([
          fetchUserBookings(currentUser.id),
          getMockInstructors()
      ]);
      
      setInstructors(fetchedInstructors);
      
      fetchedBookings.sort((a, b) => {
        if (!a.slotDetails?.startTime || !b.slotDetails?.startTime) return 0;
        const aIsPast = isPast(new Date(a.slotDetails.startTime));
        const bIsPast = isPast(new Date(b.slotDetails.startTime));

        if (aIsPast && !bIsPast) return 1;
        if (!aIsPast && bIsPast) return -1;
        
        return new Date(b.slotDetails.startTime).getTime() - new Date(a.slotDetails.startTime).getTime();
      });

      setBookings(fetchedBookings);
      setError(null);
      
      const newAvailabilityData: Record<string, CourtAvailabilityState> = {};
      for (const booking of fetchedBookings) {
          if (booking.slotDetails) {
              const availability = await getCourtAvailabilityForInterval(booking.slotDetails.clubId, new Date(booking.slotDetails.startTime), new Date(booking.slotDetails.endTime));
              newAvailabilityData[booking.activityId] = availability;
          }
      }
      setAvailabilityData(newAvailabilityData);

    } catch (err) {
      console.error("Failed to fetch user bookings:", err);
      setError("No se pudieron cargar tus clases.");
    } finally {
      setLoading(false);
    }
  }, [currentUser.id]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  const handleRateClass = (bookingId: string, instructorName: string, rating: number) => {
    setRatedBookings(prev => ({ ...prev, [bookingId]: rating }));
    toast({
      title: "¡Gracias por tu valoración!",
      description: `Has valorado la clase de ${instructorName} con ${rating} estrellas.`,
      className: "bg-primary text-primary-foreground",
    });
  };

  const handleBookingUpdate = () => {
    onBookingActionSuccess();
  };

  if (loading) {
    return (
      <div className="space-y-4">
         <Skeleton className="h-8 w-3/4" />
         <div className="flex space-x-4">
            <Skeleton className="h-96 w-80" />
            <Skeleton className="h-96 w-80" />
         </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-destructive p-4 text-center">{error}</div>
    );
  }
  
  const upcomingBookings = bookings.filter(b => b.slotDetails && !isPast(new Date(b.slotDetails.endTime)));
  const pastBookings = bookings.filter(b => b.slotDetails && isPast(new Date(b.slotDetails.endTime)));
  const hasUpcomingBookings = upcomingBookings.length > 0;
  const hasPastBookings = pastBookings.length > 0;
  
  if (!hasUpcomingBookings && !hasPastBookings) {
    return (
       <InfoCard
          icon={Activity}
          title="Tu Agenda de Clases está Vacía"
          description="Aquí verás tus próximas clases y tu historial. ¡Anímate a reservar tu primera clase!"
          actionText="Ver Clases Disponibles"
          onActionClick={() => router.push('/activities')}
          storageKey="dismissed_class_suggestion"
      />
    );
  }

  return (
    <div className="space-y-6">
       { (upcomingBookings.length > 0 || pastBookings.length > 0) &&
         <h3 className="text-lg font-semibold text-blue-600 flex items-center"><Activity className="mr-2 h-5 w-5" /> Mis Clases</h3>
       }
      {hasUpcomingBookings && (
        <div>
          <h4 className="text-base font-semibold mb-3 text-foreground flex items-center"><Clock className="mr-2 h-4 w-4" /> Próximas</h4>
           <ScrollArea>
              <div className="flex space-x-4 pb-4">
                {upcomingBookings.map(booking => (
                  <BookingListItem
                    key={booking.id}
                    booking={booking}
                    isUpcoming={true}
                    ratedBookings={ratedBookings}
                    onRateClass={handleRateClass}
                    currentUser={currentUser}
                    onBookingCancelledOrCeded={handleBookingUpdate}
                    instructor={instructors.find(i => i.id === booking.slotDetails?.instructorId) || null}
                    availability={availabilityData[booking.activityId] || { available: [], occupied: [], total: 0 }}
                  />
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
      )}
      {hasUpcomingBookings && hasPastBookings && <Separator />}
      {hasPastBookings && (
        <div>
           <h4 className="text-base font-semibold mb-3 text-muted-foreground flex items-center"><CheckCircle className="mr-2 h-4 w-4" /> Historial</h4>
            <ScrollArea>
              <div className="flex space-x-4 pb-4">
                {pastBookings.map(booking => (
                  <BookingListItem
                    key={booking.id}
                    booking={booking}
                    isUpcoming={false}
                    ratedBookings={ratedBookings}
                    onRateClass={handleRateClass}
                    currentUser={currentUser}
                    onBookingCancelledOrCeded={handleBookingUpdate}
                    instructor={instructors.find(i => i.id === booking.slotDetails?.instructorId) || null}
                    availability={availabilityData[booking.activityId] || { available: [], occupied: [], total: 0 }}
                  />
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default PersonalSchedule;
