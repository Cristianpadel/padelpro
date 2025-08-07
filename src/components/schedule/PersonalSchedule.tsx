"use client";

import React, { useState, useEffect, useMemo } from 'react';
import type { Booking, User, Review } from '@/types';
import BookingListItem from './BookingListItem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { fetchUserBookings, getMockReviews } from '@/lib/mockData';
import { Activity, Plus, CheckCircle, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { InfoCard } from './InfoCard';
import { useRouter } from 'next/navigation';

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


  useEffect(() => {
    const loadBookings = async () => {
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
    };
    loadBookings();
  }, [currentUser.id, refreshKey, onBookingActionSuccess]);

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
      {upcomingBookings.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-primary flex items-center"><Activity className="mr-2 h-5 w-5" /> Próximas Clases</h3>
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
           <h3 className="text-lg font-semibold mb-3 text-muted-foreground flex items-center"><CheckCircle className="mr-2 h-5 w-5" /> Historial de Clases</h3>
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
