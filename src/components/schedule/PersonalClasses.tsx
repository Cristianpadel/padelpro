"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Booking, User, TimeSlot, Review } from '@/types';
import { fetchUserBookings, addReviewToState as addReview } from '@/lib/mockData';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { List, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import BookingListItem from './BookingListItem';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { isPast } from 'date-fns';

interface PersonalClassesProps {
  currentUser: User;
  onBookingActionSuccess: () => void;
}

const PersonalClasses: React.FC<PersonalClassesProps> = ({ currentUser, onBookingActionSuccess }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ratedBookings, setRatedBookings] = useState<Record<string, number>>({});
  const { toast } = useToast();

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedBookings = await fetchUserBookings(currentUser.id);
      
      // Sort bookings: upcoming first, then past, both sorted by date
      fetchedBookings.sort((a, b) => {
        if (!a.slotDetails?.startTime || !b.slotDetails?.startTime) return 0;
        const aIsPast = isPast(new Date(a.slotDetails.startTime));
        const bIsPast = isPast(new Date(b.slotDetails.startTime));

        if (aIsPast && !bIsPast) return 1;
        if (!aIsPast && bIsPast) return -1;
        
        // Both are upcoming or both are past, sort by date (most recent first for past, soonest first for upcoming)
        return new Date(b.slotDetails.startTime).getTime() - new Date(a.slotDetails.startTime).getTime();
      });

      setBookings(fetchedBookings);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch user bookings:", err);
      setError("No se pudieron cargar tus clases.");
    } finally {
      setLoading(false);
    }
  }, [currentUser.id]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings, onBookingActionSuccess]);

  const handleRateClass = (bookingId: string, instructorName: string, rating: number) => {
    setRatedBookings(prev => ({ ...prev, [bookingId]: rating }));
    toast({
      title: "Clase Valorada",
      description: `Has valorado la clase con ${instructorName} con ${rating} estrella(s).`,
      action: <Star className="h-5 w-5 text-yellow-400" />,
    });
  };

  const upcomingBookings = useMemo(() => bookings.filter(b => b.slotDetails && !isPast(new Date(b.slotDetails.endTime))), [bookings]);
  const pastBookings = useMemo(() => bookings.filter(b => b.slotDetails && isPast(new Date(b.slotDetails.endTime))), [bookings]);


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

  if (bookings.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-4">
        Aún no te has apuntado a ninguna clase.
      </p>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-xl"><List className="mr-2 h-5 w-5" /> Mis Clases</CardTitle>
      </CardHeader>
      <CardContent>
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upcoming">Próximas</TabsTrigger>
                <TabsTrigger value="past">Pasadas</TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming" className="mt-4">
                {upcomingBookings.length > 0 ? (
                    <div className="space-y-4">
                        {upcomingBookings.map(booking => (
                            <BookingListItem
                                key={booking.id}
                                booking={booking}
                                isUpcoming={true}
                                ratedBookings={ratedBookings}
                                onRateClass={handleRateClass}
                                currentUser={currentUser}
                                onBookingCancelledOrCeded={loadBookings}
                            />
                        ))}
                    </div>
                ) : <p className="text-muted-foreground text-center py-4">No tienes clases próximas.</p>}
            </TabsContent>
            <TabsContent value="past" className="mt-4">
                 {pastBookings.length > 0 ? (
                    <div className="space-y-4">
                        {pastBookings.map(booking => (
                            <BookingListItem
                                key={booking.id}
                                booking={booking}
                                isUpcoming={false}
                                ratedBookings={ratedBookings}
                                onRateClass={handleRateClass}
                                currentUser={currentUser}
                                onBookingCancelledOrCeded={loadBookings}
                            />
                        ))}
                    </div>
                ) : <p className="text-muted-foreground text-center py-4">No tienes clases en tu historial.</p>}
            </TabsContent>
          </Tabs>
      </CardContent>
    </Card>
  );
};

export default memo(PersonalClasses);
