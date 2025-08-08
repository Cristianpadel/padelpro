// src/components/schedule/PersonalSchedule.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Booking, User, Review, TimeSlot, PadelCategoryForSlot } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { List, Star, Activity, CheckCircle, CalendarX, Ban, UserCircle as UserIcon, Clock, Hash, Euro, Gift, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { isPast, format, differenceInHours } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { displayClassLevel, displayClassCategory } from '@/types';
import { cancelBooking, fetchUserBookings, addReviewToState } from '@/lib/mockData';
import { useRouter } from 'next/navigation';
import { InfoCard } from './InfoCard';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from '@/lib/utils';


interface BookingListItemProps {
  booking: Booking;
  isUpcoming: boolean;
  ratedBookings: Record<string, number>;
  onRateClass: (bookingId: string, instructorName: string, rating: number) => void;
  currentUser: User;
  onBookingCancelledOrCeded: () => void;
}

const BookingListItem: React.FC<BookingListItemProps> = ({ booking, isUpcoming, ratedBookings, onRateClass, currentUser, onBookingCancelledOrCeded }) => {
  const { toast } = useToast();
  const [isCancelling, setIsCancelling] = useState(false);
  
  if (!booking.slotDetails) return null;

  const {
    id: bookingId,
    slotDetails: { id: slotId, startTime, endTime, instructorName, level, category, totalPrice, bookedPlayers, status, courtNumber },
    bookedWithPoints,
  } = booking;

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
  
  const isConfirmed = status === 'confirmed' || status === 'confirmed_private';

  return (
    <div className={cn("p-3 border rounded-md transition-colors", isUpcoming && isConfirmed && "bg-green-50 border-green-200", isUpcoming && !isConfirmed && "bg-blue-50 border-blue-200", !isUpcoming && "bg-gray-50 border-gray-200")}>
       <div className="flex justify-between items-start">
            <div>
                <p className="font-semibold text-sm">{format(new Date(startTime), "eeee, d 'de' MMMM", { locale: es })}</p>
                <p className="text-xs text-muted-foreground">{instructorName}</p>
            </div>
            {isUpcoming && isConfirmed && <Badge variant="default" className="text-xs bg-green-600">Confirmada</Badge>}
            {isUpcoming && !isConfirmed && <Badge variant="secondary" className="text-xs">Pendiente</Badge>}
            {!isUpcoming && <Badge variant="outline" className="text-xs">Finalizada</Badge>}
       </div>
        <div className="mt-2 text-xs text-muted-foreground space-y-1">
            <p className="flex items-center"><Clock className="mr-1.5 h-3.5 w-3.5" />{`${format(new Date(startTime), 'HH:mm')} - ${format(new Date(endTime), 'HH:mm')}`}</p>
            <p className="flex items-center"><UserIcon className="mr-1.5 h-3.5 w-3.5" />Clase de {booking.groupSize} personas</p>
            {courtNumber && <p className="flex items-center"><Hash className="mr-1.5 h-3.5 w-3.5" />Pista {courtNumber}</p>}
       </div>

       {bookedPlayers && bookedPlayers.length > 0 && (
           <div className="mt-2 pt-2 border-t border-border/30">
               <p className="text-xs font-medium text-muted-foreground mb-1.5">Inscritos:</p>
               <div className="flex items-center gap-1.5">
                   {bookedPlayers.map(player => (
                       <Avatar key={player.userId} className="h-7 w-7">
                           <AvatarImage src={`https://i.pravatar.cc/48?u=${player.userId}`} alt={player.name} data-ai-hint="player avatar small" />
                           <AvatarFallback className="text-[10px]">{getInitials(player.name || '')}</AvatarFallback>
                       </Avatar>
                   ))}
               </div>
           </div>
       )}

       <div className="mt-3 flex justify-between items-center">
            {isUpcoming ? (
                <Button size="xs" variant="destructive" onClick={handleCancel} disabled={isCancelling}>
                    {isCancelling ? <><List className="mr-1.5 h-3.5 w-3.5 animate-spin" />Cancelando...</> : <><Ban className="mr-1.5 h-3.5 w-3.5" />Cancelar</>}
                </Button>
            ) : (
                <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} onClick={() => onRateClass(bookingId, instructorName, star)}>
                            <Star className={cn("h-5 w-5", (ratedBookings[bookingId] || 0) >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300')} />
                        </button>
                    ))}
                </div>
            )}
            <div className="text-xs font-semibold flex items-center">
                {bookedWithPoints ? <><Gift className="mr-1.5 h-4 w-4 text-purple-600"/>Plaza Gratis</> : <><Euro className="mr-1.5 h-4 w-4 text-green-600"/>{(totalPrice! / booking.groupSize).toFixed(2)}€</>}
            </div>
       </div>
    </div>
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
  const { toast } = useToast();
  const router = useRouter();


  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedBookings = await fetchUserBookings(currentUser.id);
      const now = new Date();
      const upcoming = fetchedBookings.filter(b => b.slotDetails && new Date(b.slotDetails.endTime) > now);
      const past = fetchedBookings.filter(b => b.slotDetails && new Date(b.slotDetails.endTime) <= now);
      
      upcoming.sort((a, b) => (a.slotDetails?.startTime?.getTime() ?? 0) - (b.slotDetails?.startTime?.getTime() ?? 0));
      past.sort((a, b) => (b.slotDetails?.startTime?.getTime() ?? 0) - (a.slotDetails?.startTime?.getTime() ?? 0));

      setBookings([...upcoming, ...past]);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch user bookings:", err);
      setError("No se pudo cargar tu horario.");
    } finally {
      setLoading(false);
    }
  }, [currentUser.id]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings, refreshKey]);

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
  
  const upcomingBookings = bookings.filter(b => b.slotDetails && new Date(b.slotDetails.endTime) > new Date());
  const pastBookings = bookings.filter(b => b.slotDetails && new Date(b.slotDetails.endTime) <= new Date());
  
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
          <div className="space-y-4">
            {upcomingBookings.map(booking => (
              <BookingListItem
                key={booking.id}
                booking={booking}
                isUpcoming={true}
                ratedBookings={ratedBookings}
                onRateClass={handleRateClass}
                currentUser={currentUser}
                onBookingCancelledOrCeded={handleBookingUpdate}
              />
            ))}
          </div>
        </div>
      )}
      {pastBookings.length > 0 && (
        <div>
           <h4 className="text-base font-semibold mb-3 text-muted-foreground flex items-center"><CheckCircle className="mr-2 h-4 w-4" /> Historial</h4>
          <div className="space-y-4">
            {pastBookings.map(booking => (
              <BookingListItem
                key={booking.id}
                booking={booking}
                isUpcoming={false}
                ratedBookings={ratedBookings}
                onRateClass={handleRateClass}
                currentUser={currentUser}
                onBookingCancelledOrCeded={handleBookingUpdate}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalSchedule;
