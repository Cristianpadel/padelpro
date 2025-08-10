// src/components/schedule/PersonalSchedule.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Booking, User, Review, TimeSlot, PadelCourt, Instructor } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { List, Star, Activity, CheckCircle, CalendarX, Ban, UserCircle as UserIcon, Clock, Hash, Euro, Gift, Lightbulb, BarChartHorizontal, Users2, Venus, Mars } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { isPast, format, differenceInHours } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { displayClassLevel, displayClassCategory } from '@/types';
import { cancelBooking, fetchUserBookings, addReviewToState, getMockStudents, getMockInstructors, isSlotEffectivelyCompleted, getCourtAvailabilityForInterval } from '@/lib/mockData';
import { useRouter } from 'next/navigation';
import { InfoCard } from './InfoCard';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { calculatePricePerPerson } from '@/lib/utils';
import Link from 'next/link';
import CourtAvailabilityIndicator from '@/components/class/CourtAvailabilityIndicator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';

interface CourtAvailabilityState {
    available: PadelCourt[];
    occupied: PadelCourt[];
    total: number;
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


const InfoButton = ({ icon: Icon, text, onClick, className }: { icon: React.ElementType, text: string, onClick: () => void, className?: string }) => (
    <button onClick={onClick} className="flex-1">
        <Badge variant="outline" className={cn("w-full justify-center text-xs py-1.5 rounded-full capitalize shadow-inner bg-slate-50 border-slate-200 hover:border-slate-300 transition-colors", className)}>
            <Icon className="mr-1.5 h-3 w-3" /> {text}
        </Badge>
    </button>
);


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
  const [infoDialog, setInfoDialog] = useState<{ open: boolean, title: string, description: string, icon: React.ElementType }>({ open: false, title: '', description: '', icon: Lightbulb });
  
  if (!booking.slotDetails || !instructor) return null;

  const {
    id: bookingId,
    slotDetails,
    bookedWithPoints,
  } = booking;

  const {
      id: slotId, startTime, endTime, instructorName, level, category, totalPrice, bookedPlayers, status, courtNumber
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
                 dialogData = { title: 'Categoría de la Clase', description: 'La categoría (chicos/chicas) la sugiere el primer jugador que se apunta.\nNo es una regla estricta, solo una guía para los demás.', icon: CategoryIcon };
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
  const courtDisplay = isCourtAssigned ? `Pista ${courtNumber}` : 'Pista';

  const CategoryIcon = category === 'chica' ? Venus : category === 'chico' ? Mars : Users2;
  const classifiedBadgeClass = 'text-blue-700 border-blue-200 bg-blue-100 hover:border-blue-300';

  return (
    <>
      <div className="w-80 max-w-md mx-auto">
        <Card className={cn("flex flex-col shadow-md border-l-4 h-full", cardBorderColor)}>
          <CardHeader className="p-3">
             <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                     <div className="flex-shrink-0 text-center font-bold bg-white p-1 rounded-md w-14 shadow-lg border border-border/20">
                        <p className="text-xs uppercase">{format(new Date(startTime), "EEE", { locale: es })}</p>
                        <p className="text-3xl leading-none">{format(new Date(startTime), "d")}</p>
                        <p className="text-xs uppercase">{format(new Date(startTime), "MMM", { locale: es })}</p>
                    </div>
                     <div className="flex flex-col">
                        <span className="font-semibold text-lg">{format(new Date(startTime), 'HH:mm')}h</span>
                        <span className="text-sm text-muted-foreground">con {instructorName}</span>
                    </div>
                </div>
                 <div className="flex items-center">
                    {isUpcoming && isConfirmed && <Badge variant="default" className="text-xs bg-green-600">Confirmada</Badge>}
                    {isUpcoming && !isConfirmed && <Badge variant="secondary" className="text-xs">Pendiente</Badge>}
                    {!isUpcoming && <Badge variant="outline" className="text-xs">Finalizada</Badge>}
                 </div>
             </div>

             <div className="flex justify-center items-center gap-1.5 pt-2">
                <InfoButton 
                    icon={Lightbulb} 
                    text={levelDisplay} 
                    onClick={() => handleInfoClick('level')}
                    className={cn(isLevelAssigned && classifiedBadgeClass)}
                />
                <InfoButton 
                    icon={CategoryIcon} 
                    text={categoryDisplay} 
                    onClick={() => handleInfoClick('category')} 
                    className={cn(isCategoryAssigned && classifiedBadgeClass)}
                />
                <InfoButton 
                    icon={Hash} 
                    text={courtDisplay} 
                    onClick={() => handleInfoClick('court')} 
                    className={cn(isCourtAssigned && classifiedBadgeClass)}
                />
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
                          <Avatar key={index} className={cn("h-10 w-10", isCurrentUserInSpot && "border-2 border-primary")}>
                            {playerInSpot && student ? (
                              <>
                                <AvatarImage src={student.profilePictureUrl} alt={student.name} data-ai-hint="student avatar small" />
                                <AvatarFallback className="text-xs">{getInitials(student.name || '')}</AvatarFallback>
                              </>
                            ) : (
                              <AvatarFallback className="bg-muted"><UserIcon className="h-4 w-4 text-muted-foreground" /></AvatarFallback>
                            )}
                          </Avatar>
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
            <div className="pt-2 w-full">
              {isUpcoming ? (
                <Button size="sm" variant="destructive" className="w-full" onClick={handleCancel} disabled={isCancelling}>
                  {isCancelling ? <><List className="mr-1.5 h-3.5 w-3.5 animate-spin" />Cancelando...</> : <><Ban className="mr-1.5 h-3.5 w-3.5" />Cancelar</>}
                </Button>
              ) : (
                <div className="flex items-center justify-center gap-1">
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
      <InfoDialog isOpen={infoDialog.open} onOpenChange={(open) => setInfoDialog(prev => ({ ...prev, open }))} title={infoDialog.title} description={infoDialog.description} icon={infoDialog.icon} />
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
  
  if (upcomingBookings.length === 0 && pastBookings.length === 0) {
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
       <h3 className="text-lg font-semibold mb-3 text-blue-600 flex items-center"><Activity className="mr-2 h-5 w-5" /> Mis Clases</h3>
      {upcomingBookings.length > 0 && (
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
      {pastBookings.length > 0 && (
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
