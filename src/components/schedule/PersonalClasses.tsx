// src/components/schedule/PersonalClasses.tsx
"use client";

import React, { useState, useEffect, useTransition } from 'react';
import type { Booking, User, TimeSlot, Club, MatchPadelLevel } from '@/types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { List, CalendarX, Loader2, Ban, Gift, CalendarCheck, Clock, Hash, Trophy, UserCircle, Users, BarChartHorizontal } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchUserBookings, cancelBooking, getMockClubs } from '@/lib/mockData';
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
import { getInitials, calculatePricePerPerson } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { displayClassCategory, displayClassLevel } from '@/types';
import { useRouter } from 'next/navigation';

interface PersonalClassesProps {
  currentUser: User;
  onBookingActionSuccess: () => void;
}

const PersonalClasses: React.FC<PersonalClassesProps> = ({ currentUser, onBookingActionSuccess }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, startCancellationTransition] = useTransition();
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const { toast } = useToast();
  const router = useRouter();


  useEffect(() => {
    const loadBookings = async () => {
      try {
        setLoading(true);
        const fetchedBookings = await fetchUserBookings(currentUser.id);
        // Sort bookings: upcoming first, then by date
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
      } catch (err) {
        console.error("Failed to fetch user bookings:", err);
        setError("No se pudo cargar tu horario de clases.");
      } finally {
        setLoading(false);
      }
    };
    loadBookings();
  }, [currentUser.id, onBookingActionSuccess]);

  const handleCancelClick = (booking: Booking) => {
    setBookingToCancel(booking);
  };

  const confirmCancellation = () => {
    if (!bookingToCancel) return;
    startCancellationTransition(async () => {
      const result = await cancelBooking(currentUser.id, bookingToCancel.id);
      if ('error'in result) {
        toast({ title: 'Error al Cancelar', description: result.error, variant: 'destructive' });
      } else {
        toast({
          title: result.message?.includes("Bonificada") ? "Cancelación Bonificada" : result.message?.includes("NO Bonificada") ? "Inscripción Cancelada" : "Inscripción Cancelada",
          description: result.message || 'Tu inscripción ha sido cancelada.',
          className: (result.pointsAwarded && result.pointsAwarded > 0) ? 'bg-green-600 text-white' : (result.penaltyApplied) ? 'bg-yellow-500 text-white' : 'bg-accent text-accent-foreground',
          duration: 7000,
        });
        onBookingActionSuccess();
      }
      setBookingToCancel(null);
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="text-center p-6 bg-destructive/10 border-destructive">
        <p className="text-destructive">{error}</p>
      </Card>
    );
  }
  
  if (bookings.length === 0) {
      return (
        <Card className="text-center p-6 bg-secondary/30 border-dashed">
            <Trophy className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">¿Listo para mejorar?</h3>
            <p className="mt-1 text-sm text-muted-foreground">Tu agenda de clases está vacía. ¡Apúntate a una y sube de nivel!</p>
            <Button className="mt-4" onClick={() => router.push('/activities?view=clases')}>
                Ver Clases Disponibles
            </Button>
        </Card>
      );
  }

  const upcomingBookings = bookings.filter(b => b.slotDetails && !isPast(new Date(b.slotDetails.startTime)));
  const pastBookings = bookings.filter(b => b.slotDetails && isPast(new Date(b.slotDetails.startTime)));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-xl"><List className="mr-2 h-5 w-5" /> Mis Clases</CardTitle>
          <CardDescription>Aquí tienes un resumen de tus clases inscritas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {upcomingBookings.length > 0 ? upcomingBookings.map(booking => (
            <BookingItem key={booking.id} booking={booking} onCancel={handleCancelClick} isUpcoming={true} />
          )) : (
            <p className="text-muted-foreground text-center py-4">No tienes próximas clases.</p>
          )}

          {pastBookings.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground my-4 border-t pt-4">Clases Pasadas</h4>
              <div className="space-y-4">
                {pastBookings.map(booking => (
                  <BookingItem key={booking.id} booking={booking} onCancel={handleCancelClick} isUpcoming={false} />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
       <AlertDialog open={!!bookingToCancel} onOpenChange={(open) => !open && setBookingToCancel(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Confirmar Cancelación?</AlertDialogTitle>
                     <AlertDialogDescription>
                        ¿Estás seguro de que quieres cancelar tu inscripción a esta clase? Revisa las condiciones.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isCancelling}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmCancellation} disabled={isCancelling} className="bg-destructive hover:bg-destructive/90">
                        {isCancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Sí, Cancelar'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
};


const BookingItem: React.FC<{ booking: Booking, onCancel: (booking: Booking) => void, isUpcoming: boolean }> = ({ booking, onCancel, isUpcoming }) => {
    if (!booking.slotDetails) {
        return <div className="p-3 border rounded-md bg-muted/50 text-muted-foreground">Detalles de la clase no disponibles.</div>;
    }
    const { startTime, instructorName, level, category, courtNumber, totalPrice, status } = booking.slotDetails;
    const isConfirmed = status === 'confirmed' || status === 'confirmed_private';
    const wasBookedWithPoints = booking.bookedWithPoints;
    const pricePerPerson = calculatePricePerPerson(totalPrice, booking.groupSize);
    const club = getMockClubs().find(c => c.id === booking.slotDetails?.clubId);

    const cardBorderColor = isUpcoming 
      ? (isConfirmed ? 'border-l-green-500' : 'border-l-blue-500')
      : 'border-l-gray-400';

    return (
        <div className={cn("flex flex-col p-3 rounded-lg shadow-sm space-y-2 border-l-4", cardBorderColor, isUpcoming ? 'bg-card border border-border' : 'bg-muted/60 border border-border/50')}>
             <div className="flex justify-between items-start">
                <div>
                     <p className="font-semibold capitalize">{format(new Date(startTime), 'eeee, d MMM', { locale: es })}</p>
                    <p className="text-sm text-muted-foreground flex items-center">
                        <Clock className="mr-1.5 h-4 w-4" /> {format(new Date(startTime), 'HH:mm', { locale: es })}h - Instructor: {instructorName}
                    </p>
                </div>
                {isUpcoming && <Badge variant={isConfirmed ? "default" : "outline"} className={cn(isConfirmed && "bg-green-600")}>{isConfirmed ? 'Confirmada' : 'Pendiente'}</Badge>}
                 {!isUpcoming && <Badge variant="secondary">Finalizada</Badge>}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs pt-2 border-t border-border/50">
                <Badge variant="outline" className="capitalize"><Users className="mr-1 h-3 w-3"/> Clase de {booking.groupSize}</Badge>
                <Badge variant="outline"><BarChartHorizontal className="mr-1 h-3 w-3 -rotate-90"/>{displayClassLevel(level)}</Badge>
                <Badge variant="outline" className="capitalize">{displayClassCategory(category)}</Badge>
                {courtNumber && <Badge variant="outline"><Hash className="mr-1 h-3 w-3"/> Pista {courtNumber}</Badge>}
                 <div className={cn("font-semibold flex items-center", wasBookedWithPoints ? "text-purple-600" : "text-green-600")}>
                     {wasBookedWithPoints ? (
                         <> <Gift className="h-4 w-4 mr-1.5" /> {pricePerPerson.toFixed(0)} Puntos </>
                     ) : (
                         <> <span className="text-sm font-bold">{pricePerPerson.toFixed(2)}€</span> </>
                     )}
                 </div>
            </div>
            {isUpcoming && (
                <div className="flex justify-end pt-2">
                    <Button variant="destructive" size="sm" onClick={() => onCancel(booking)}>
                        <Ban className="mr-2 h-4 w-4" /> Cancelar Inscripción
                    </Button>
                </div>
            )}
        </div>
    );
};


export default PersonalClasses;
