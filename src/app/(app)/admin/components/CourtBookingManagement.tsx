"use client";

import React, { useState, useEffect, useCallback, useMemo, useTransition } from 'react';
import type { PadelCourt, CourtGridBooking, Club, TimeSlot, Match } from '@/types'; // Added TimeSlot and Match
import { fetchPadelCourtsByClub, fetchCourtBookingsForDay, addMatch, getMockClubs, isSlotEffectivelyCompleted as isSlotConfirmed } from '@/lib/mockData'; // Added isSlotEffectivelyCompleted
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addMinutes, format, startOfDay, setHours, setMinutes, isEqual, addDays, differenceInMinutes, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarClock, Loader2, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

import DateNavigation from './DateNavigation';
import ManualBookingDialog, { manualBookingFormSchema, type ManualBookingFormData } from './ManualBookingDialog';
import BookingGridDisplay from './BookingGridDisplay';

const timeSlotsInterval = 30; // minutes
const gridStartHour = 8;
const gridEndHour = 22;

interface CourtBookingManagementProps {
  clubId: string;
}

// Helper function to create time intervals
const getTimeIntervals = (startHour: number, endHour: number, intervalMinutes: number): Date[] => {
    const intervals: Date[] = [];
    let currentTimeSlot = setMinutes(setHours(startOfDay(new Date()), startHour), 0);
    const finalTime = setMinutes(setHours(startOfDay(new Date()), endHour), 0);
    while (currentTimeSlot < finalTime) {
      intervals.push(new Date(currentTimeSlot));
      currentTimeSlot = addMinutes(currentTimeSlot, intervalMinutes);
    }
    return intervals;
};

const CourtBookingManagement: React.FC<CourtBookingManagementProps> = ({ clubId }) => {
  const [currentDate, setCurrentDate] = useState<Date>(startOfDay(new Date()));
  const [courts, setCourts] = useState<PadelCourt[]>([]);
  const [clubDetails, setClubDetails] = useState<Club | null>(null);
  const [bookings, setBookings] = useState<CourtGridBooking[]>([]);
  const [loadingCourts, setLoadingCourts] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [isManualBookingDialogOpen, setIsManualBookingDialogOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { toast } = useToast();
  const [isSubmittingManualBooking, startManualBookingTransition] = useTransition();

  const form = useForm<ManualBookingFormData>({
    resolver: zodResolver(manualBookingFormSchema),
    defaultValues: {
      courtNumber: undefined,
      startTime: format(setMinutes(setHours(new Date(), Math.ceil(new Date().getHours())), Math.ceil(new Date().getMinutes() / 30) * 30), "HH:mm"),
      title: "clases 60min",
    },
  });

  const timeOptions = useMemo(() => {
    return getTimeIntervals(gridStartHour, gridEndHour, timeSlotsInterval).map(date => format(date, "HH:mm"));
  }, []);

  const dateStripDates = useMemo(() => {
    const today = startOfDay(new Date());
    const startDate = addDays(today, -3);
    return Array.from({ length: 19 }, (_, i) => addDays(startDate, i));
  }, []);

  const loadCourtsAndBookings = useCallback(async () => {
    setLoadingCourts(true);
    setLoadingBookings(true);
    try {
      const [fetchedCourts, clubData] = await Promise.all([
          fetchPadelCourtsByClub(clubId),
          getMockClubs().find(c => c.id === clubId) || null
      ]);
      fetchedCourts.sort((a, b) => a.courtNumber - b.courtNumber);
      setCourts(fetchedCourts.filter(c => c.isActive));
      setClubDetails(clubData);

      const fetchedBookings = await fetchCourtBookingsForDay(clubId, currentDate);
      setBookings(fetchedBookings);
    } catch (error) {
      console.error("Error loading court data:", error);
      toast({ title: "Error", description: "No se pudieron cargar los datos.", variant: "destructive" });
    } finally {
      setLoadingCourts(false);
      setLoadingBookings(false);
    }
  }, [clubId, currentDate, toast]);

  useEffect(() => {
    loadCourtsAndBookings();
  }, [loadCourtsAndBookings]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const timeGrid = useMemo(() => getTimeIntervals(gridStartHour, gridEndHour, timeSlotsInterval), []);

  const getBookingForCell = (courtNumber: number, time: Date): CourtGridBooking | undefined => {
    return bookings.find(b =>
      b.courtNumber === courtNumber &&
      new Date(b.startTime) <= time &&
      new Date(b.endTime) > time
    );
  };

  const getBookingDurationInSlots = (booking: CourtGridBooking): number => {
    const duration = differenceInMinutes(new Date(booking.endTime), new Date(booking.startTime));
    return Math.max(1, Math.ceil(duration / timeSlotsInterval));
  };

  const handleManualBookingSubmit = async (data: ManualBookingFormData) => {
    startManualBookingTransition(async () => {
        const [hour, minute] = data.startTime.split(':').map(Number);
        const bookingStartTime = setMinutes(setHours(startOfDay(currentDate), hour), minute);
        const durationMinutes = data.title === 'clases 60min' ? 60 : 90;
        const bookingEndTime = addMinutes(bookingStartTime, durationMinutes);

        const newBookingData: Omit<Match, 'id' | 'status' | 'organizerId' | 'privateShareCode'> = {
          clubId: clubId,
          startTime: bookingStartTime,
          endTime: bookingEndTime,
          courtNumber: data.courtNumber,
          level: 'abierto',
          category: 'abierta',
          bookedPlayers: [],
          isPlaceholder: false,
          totalCourtFee: 0,
          durationMinutes: durationMinutes,
        };

        try {
        const result = await addMatch(newBookingData);
        if ('error' in result) {
            toast({ title: "Error al Reservar", description: result.error, variant: "destructive" });
        } else {
            toast({ title: "Reserva Manual Creada", description: `Se ha creado una reserva en Pista ${data.courtNumber}.` });
            setIsManualBookingDialogOpen(false);
            form.reset({
                courtNumber: undefined,
                startTime: format(setMinutes(setHours(new Date(), Math.ceil(new Date().getHours())), Math.ceil(new Date().getMinutes()/30)*30 ), "HH:mm"),
                title: "clases 60min",
            });
            loadCourtsAndBookings(); // Refresh data
        }
        } catch (error) {
        toast({ title: "Error", description: "No se pudo crear la reserva manual.", variant: "destructive" });
        }
    });
  };

  const openManualBookingDialog = (courtNum: number, slotStartTime: Date) => {
    form.reset({
        courtNumber: courtNum,
        startTime: format(slotStartTime, "HH:mm"),
        title: "clases 60min",
    })
    setIsManualBookingDialogOpen(true);
  };

  if (loadingCourts) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
        <CardContent><Skeleton className="h-64 w-full" /></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4">
        <CardTitle className="text-xl flex items-center">
          <CalendarClock className="mr-2 h-6 w-6 text-primary" />
          Gestión de Reservas de Pistas
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground md:text-base">
          Club: {clubDetails?.name || 'N/A'} | Fecha Seleccionada: {format(currentDate, "PPP", { locale: es })}
          <p className="text-xs text-muted-foreground mt-0.5">Hora Actual: {format(currentTime, "HH:mm", { locale: es })} (Madrid, España)</p>
        </CardDescription>
        <DateNavigation
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          dateStripDates={dateStripDates}
          isToday={isToday}
        />
         <Button onClick={() => setIsManualBookingDialogOpen(true)} size="sm" className="w-full md:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" /> Añadir Reserva Manual
        </Button>
      </CardHeader>
      <CardContent className="p-2">
        {loadingBookings ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Cargando reservas...</p>
          </div>
        ) : courts.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">No hay pistas activas configuradas. Añada pistas en "Gestionar Pistas".</p>
        ) : (
          <BookingGridDisplay
            courts={courts}
            timeGrid={timeGrid}
            getBookingForCell={getBookingForCell}
            getBookingDurationInSlots={getBookingDurationInSlots}
            currentTime={currentTime}
            currentDate={currentDate}
            openManualBookingDialog={openManualBookingDialog}
            timeSlotsInterval={timeSlotsInterval}
          />
        )}
      </CardContent>
      <ManualBookingDialog
        isOpen={isManualBookingDialogOpen}
        onOpenChange={setIsManualBookingDialogOpen}
        form={form}
        courts={courts}
        timeOptions={timeOptions}
        onSubmit={handleManualBookingSubmit}
        isSubmitting={isSubmittingManualBooking}
      />
    </Card>
  );
};

export default CourtBookingManagement;
