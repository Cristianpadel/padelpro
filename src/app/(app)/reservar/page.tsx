// src/app/(app)/reservar/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { User, Club, PadelCourt, TimeRange, DayOfWeek } from '@/types';
import { getMockCurrentUser, getMockClubs, getMockPadelCourts, bookCourtWithPoints } from '@/lib/mockData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, Star, AlertTriangle, ArrowRight, Loader2, Check } from 'lucide-react';
import { format, startOfDay, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
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
} from "@/components/ui/alert-dialog";

const dayOfWeekArray: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const CourtBookingCard: React.FC<{
    club: Club;
    date: Date;
    currentUser: User;
    onBookingSuccess: () => void;
}> = ({ club, date, currentUser, onBookingSuccess }) => {
    const { toast } = useToast();
    const [availableSlots, setAvailableSlots] = useState<Date[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
    const [isConfirming, setIsConfirming] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    
    const pointsCost = club.pointSettings?.pointsCostForCourt ?? 0;
    const hasEnoughPoints = (currentUser.loyaltyPoints ?? 0) >= pointsCost;

    useEffect(() => {
        const getSlots = async () => {
            const dayKey = dayOfWeekArray[date.getDay()];
            const ranges = club.pointBookingSlots?.[dayKey] || [];
            const courts = await getMockPadelCourts(club.id);
            const activeCourts = courts.filter(c => c.isActive);

            if (ranges.length === 0 || activeCourts.length === 0) {
                setAvailableSlots([]);
                return;
            }
            
            // Logic to determine available slots would be more complex in a real app,
            // checking existing bookings. For now, we list all potential slots.
            const slots: Date[] = [];
            for (const range of ranges) {
                let current = new Date(date);
                const [startH, startM] = range.start.split(':').map(Number);
                current.setHours(startH, startM, 0, 0);

                let end = new Date(date);
                const [endH, endM] = range.end.split(':').map(Number);
                end.setHours(endH, endM, 0, 0);

                while (current < end) {
                    slots.push(new Date(current));
                    current.setMinutes(current.getMinutes() + 90); // Matches are 90 min
                }
            }
            setAvailableSlots(slots);
        };
        getSlots();
    }, [date, club]);

    const handleBooking = async () => {
        if (!selectedSlot) return;
        setIsProcessing(true);
        const result = await bookCourtWithPoints(currentUser.id, club.id, selectedSlot);
        if ('error' in result) {
            toast({ title: 'Error al Reservar', description: result.error, variant: 'destructive' });
        } else {
            toast({ title: '¡Pista Reservada!', description: `Has creado una partida privada para el ${format(selectedSlot, "dd/MM 'a las' HH:mm")}h.`, className: 'bg-primary text-primary-foreground' });
            onBookingSuccess();
        }
        setIsConfirming(false);
        setSelectedSlot(null);
        setIsProcessing(false);
    };

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center">
                    <Calendar className="mr-2 h-5 w-5" />
                    {format(date, "EEEE, d 'de' MMMM", { locale: es })}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                        {availableSlots.map(slot => (
                            <Button
                                key={slot.toISOString()}
                                variant="outline"
                                disabled={!hasEnoughPoints}
                                onClick={() => { setSelectedSlot(slot); setIsConfirming(true); }}
                            >
                                <Clock className="mr-2 h-4 w-4" />
                                {format(slot, "HH:mm")}
                            </Button>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground">No hay horas disponibles para reservar con puntos este día.</p>
                )}
            </CardContent>
            {!hasEnoughPoints && (
                 <CardFooter>
                    <p className="text-sm text-destructive flex items-center">
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        No tienes suficientes puntos para reservar.
                    </p>
                 </CardFooter>
            )}

            {selectedSlot && (
                 <AlertDialog open={isConfirming} onOpenChange={setIsConfirming}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Reserva con Puntos</AlertDialogTitle>
                            <AlertDialogDescription>
                                Se descontarán <span className="font-bold">{pointsCost} puntos</span> de tu saldo para reservar una pista y crear una partida privada.
                                <br />
                                Fecha: <span className="font-semibold">{format(selectedSlot, "eeee d, HH:mm'h'", { locale: es })}</span>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleBooking} disabled={isProcessing}>
                                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Confirmar y Usar Puntos
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </Card>
    );
};


export default function ReservarPage() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [clubs, setClubs] = useState<Club[]>([]);
    const [selectedClub, setSelectedClub] = useState<Club | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    const loadData = useCallback(async () => {
        setLoading(true);
        const [user, allClubs] = await Promise.all([
            getMockCurrentUser(),
            getMockClubs()
        ]);
        setCurrentUser(user);
        setClubs(allClubs);
        if (allClubs.length > 0) {
            setSelectedClub(allClubs[0]);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData, refreshKey]);

    const onBookingSuccess = () => {
        setRefreshKey(prev => prev + 1);
    };
    
    const dates = Array.from({ length: 7 }, (_, i) => addDays(startOfDay(new Date()), i));
    
    if (loading || !currentUser || !selectedClub) {
        return (
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <header>
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-4 w-2/3 mt-2" />
                </header>
                <main className="flex-1 space-y-4">
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-40 w-full" />
                </main>
            </div>
        );
    }
    
    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
            <header>
                <h1 className="font-headline text-3xl font-semibold">Reservar Pista con Puntos</h1>
                <p className="text-muted-foreground">
                   Usa tus puntos de fidelidad para crear una partida privada para ti y tus amigos.
                </p>
            </header>
            <main className="flex-1 space-y-4">
                <Card>
                    <CardHeader className="flex-row items-center justify-between">
                        <div>
                            <CardTitle>Tu Saldo de Puntos</CardTitle>
                            <CardDescription>Puntos disponibles para canjear.</CardDescription>
                        </div>
                        <p className="text-3xl font-bold text-primary flex items-center">
                            <Star className="mr-2 h-7 w-7 fill-amber-400 text-amber-500" />
                            {currentUser.loyaltyPoints?.toLocaleString('es-ES') ?? 0}
                        </p>
                    </CardHeader>
                </Card>
                 <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg text-purple-800">
                    <p className="font-bold flex items-center"><Check className="mr-2 h-4 w-4"/>Plazas Liberadas</p>
                    <p className="text-sm mt-1">
                        ¿Un jugador se cae de una partida confirmada? ¡Esa plaza es tuya! Búscalas aquí.
                    </p>
                     <Button asChild size="sm" className="mt-2 bg-purple-600 hover:bg-purple-700">
                        <Link href="/activities?filter=liberadas">
                            Ver Plazas Liberadas <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
                {dates.map(date => (
                    <CourtBookingCard 
                        key={date.toISOString()}
                        club={selectedClub}
                        date={date}
                        currentUser={currentUser}
                        onBookingSuccess={onBookingSuccess}
                    />
                ))}
            </main>
        </div>
    );
}

