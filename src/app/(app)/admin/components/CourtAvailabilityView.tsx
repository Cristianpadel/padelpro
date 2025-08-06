"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { PadelCourt, CourtGridBooking, Club, Instructor as InstructorType } from '@/types';
import { fetchPadelCourtsByClub, fetchCourtBookingsForDay, getMockClubs } from '@/lib/mockData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format, startOfDay, isEqual, addDays, setHours, setMinutes, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarClock, Loader2, AlertTriangle, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import DateNavigation from './DateNavigation'; // Reutilizamos DateNavigation
import BookingGridDisplay from './BookingGridDisplay'; // Reutilizamos BookingGridDisplay

const timeSlotsInterval = 30; // minutes
const gridStartHour = 8;
const gridEndHour = 22;

// Helper function to create time intervals (podríamos moverlo a utils si se usa en más sitios)
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

interface CourtAvailabilityViewProps {
  instructor: InstructorType;
}

const CourtAvailabilityView: React.FC<CourtAvailabilityViewProps> = ({ instructor }) => {
  const [currentDate, setCurrentDate] = useState<Date>(startOfDay(new Date()));
  const [courts, setCourts] = useState<PadelCourt[]>([]);
  const [clubDetails, setClubDetails] = useState<Club | null>(null);
  const [bookings, setBookings] = useState<CourtGridBooking[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { toast } = useToast();

  // Guard against undefined instructor prop
  if (!instructor) {
    console.error("[CourtAvailabilityView] Instructor prop is undefined.");
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><CalendarClock className="mr-2 h-5 w-5 text-primary" />Disponibilidad de Pistas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-6 text-center bg-muted/50 rounded-md border">
            <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-3" />
            <p className="font-semibold text-destructive">Error: Datos del instructor no disponibles.</p>
            <p className="text-sm text-muted-foreground mt-1">
              No se pudo cargar la información del instructor para mostrar la disponibilidad.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const assignedClubId = instructor.assignedClubId;

  const timeGrid = useMemo(() => getTimeIntervals(gridStartHour, gridEndHour, timeSlotsInterval), []);
  const dateStripDates = useMemo(() => {
    const today = startOfDay(new Date());
    const startDate = addDays(today, -3);
    return Array.from({ length: 19 }, (_, i) => addDays(startDate, i));
  }, []);


  const loadCourtAndBookingData = useCallback(async () => {
    if (!assignedClubId || assignedClubId === 'all') {
        setLoadingData(false);
        return;
    }
    setLoadingData(true);
    try {
      const [fetchedCourts, clubData, fetchedBookings] = await Promise.all([
          fetchPadelCourtsByClub(assignedClubId),
          getMockClubs().find(c => c.id === assignedClubId) || null,
          fetchCourtBookingsForDay(assignedClubId, currentDate)
      ]);
      
      const activeCourts = fetchedCourts.filter(c => c.isActive).sort((a, b) => a.courtNumber - b.courtNumber);
      setCourts(activeCourts);
      setClubDetails(clubData);
      setBookings(fetchedBookings);

    } catch (error) {
      console.error("Error loading court data for instructor:", error);
      toast({ title: "Error", description: "No se pudieron cargar los datos de disponibilidad de pistas.", variant: "destructive" });
      setCourts([]);
      setBookings([]);
      setClubDetails(null);
    } finally {
      setLoadingData(false);
    }
  }, [assignedClubId, currentDate, toast]);

  useEffect(() => {
    loadCourtAndBookingData();
  }, [loadCourtAndBookingData]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update current time every minute
    return () => clearInterval(timer);
  }, []);


  const getBookingForCell = (courtNumber: number, time: Date): CourtGridBooking | undefined => {
    return bookings.find(b =>
      b.courtNumber === courtNumber &&
      new Date(b.startTime).getTime() <= time.getTime() && // Corrected comparison
      new Date(b.endTime).getTime() > time.getTime()      // Corrected comparison
    );
  };

  const getBookingDurationInSlots = (booking: CourtGridBooking): number => {
    const duration = differenceInMinutes(new Date(booking.endTime), new Date(booking.startTime));
    return Math.max(1, Math.ceil(duration / timeSlotsInterval));
  };

  if (!assignedClubId || assignedClubId === 'all') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><CalendarClock className="mr-2 h-5 w-5 text-primary" />Disponibilidad de Pistas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-6 text-center bg-muted/50 rounded-md border">
            <Building className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="font-semibold text-foreground">No tienes un club asignado.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Por favor, selecciona un club en tus "Preferencias" para ver la disponibilidad de pistas.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }


  return (
    <Card>
      <CardHeader className="flex flex-col gap-4">
        <CardTitle className="text-xl flex items-center">
          <CalendarClock className="mr-2 h-6 w-6 text-primary" />
          Disponibilidad de Pistas (Solo Vista)
        </CardTitle>
         <CardDescription className="text-sm text-muted-foreground md:text-base">
          Club: {clubDetails?.name || 'Cargando...'} | Fecha Seleccionada: {format(currentDate, "PPP", { locale: es })}
          <p className="text-xs text-muted-foreground mt-0.5">Hora Actual: {format(currentTime, "HH:mm", { locale: es })}</p>
        </CardDescription>
        <DateNavigation
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          dateStripDates={dateStripDates}
          isToday={(date) => isSameDay(startOfDay(date), startOfDay(new Date()))}
        />
      </CardHeader>
      <CardContent className="p-2">
        {loadingData ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Cargando disponibilidad...</p>
          </div>
        ) : courts.length === 0 && clubDetails ? (
          <p className="text-center text-muted-foreground py-10">El club <span className="font-semibold">{clubDetails.name}</span> no tiene pistas activas configuradas.</p>
        ) : !clubDetails && !loadingData ? (
            <div className="p-6 text-center bg-destructive/10 rounded-md border border-destructive/30">
                <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-3" />
                <p className="font-semibold text-destructive">Error al cargar datos del club.</p>
                <p className="text-sm text-destructive/80 mt-1">
                    No se pudo obtener la información del club asignado. Inténtalo más tarde.
                </p>
            </div>
        ) : (
          <BookingGridDisplay
            courts={courts}
            timeGrid={timeGrid}
            getBookingForCell={getBookingForCell}
            getBookingDurationInSlots={getBookingDurationInSlots}
            currentTime={currentTime}
            currentDate={currentDate}
            openManualBookingDialog={() => { /* No-op for read-only view */ }}
            timeSlotsInterval={timeSlotsInterval}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default CourtAvailabilityView;
