"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Clock, Users, Plus, Loader2, CheckCircle, Lock, BarChartHorizontal, Hash, User as UserIcon, Star, UserRound, Gift, HelpCircle, CircleCheckBig } from 'lucide-react';
import { format, differenceInMinutes, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn, getInitials, getPlaceholderUserName, calculatePricePerPerson } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import type { TimeSlot, User, Booking, ClassPadelLevel } from '@/types';
import { displayClassLevel } from '@/types'; 
import BookingSpotDisplay from '@/components/class/BookingSpotDisplay';
import {
    getMockUserBookings,
    bookClass,
    isSlotEffectivelyCompleted,
    hasAnyConfirmedActivityForDay,
    makeClassPublic,
    getMockClubs,
    getMockInstructors
} from '@/lib/mockData';

interface TimeSlotCardProps {
    slot: TimeSlot;
    currentUser: User | null;
    onBookingSuccess: (newBooking: Booking, updatedSlot: TimeSlot) => void;
}

const TimeSlotCard: React.FC<TimeSlotCardProps> = ({ slot: initialSlot, currentUser, onBookingSuccess }) => {
    const { toast } = useToast();
    const [isPendingMap, setIsPendingMap] = useState<Record<string, boolean>>({});
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [spotIndexToBook, setSpotIndexToBook] = useState<number | undefined>(undefined);
    const [groupSizeToBook, setGroupSizeToBook] = useState<1|2|3|4>(4);
    const [currentSlot, setCurrentSlot] = useState<TimeSlot>(initialSlot);
    const [isPublicConfirmOpen, setIsPublicConfirmOpen] = useState(false);
    const [instructorRating, setInstructorRating] = useState<number>(4.5);
    const club = useMemo(() => getMockClubs().find(c => c.id === initialSlot.clubId), [initialSlot.clubId]);

    useEffect(() => {
        const startTime = initialSlot.startTime instanceof Date ? initialSlot.startTime : parseISO(initialSlot.startTime as unknown as string);
        const endTime = initialSlot.endTime ? (initialSlot.endTime instanceof Date ? initialSlot.endTime : parseISO(initialSlot.endTime as unknown as string)) : new Date(startTime.getTime() + 60 * 60 * 1000); 

        setCurrentSlot({
            ...initialSlot,
            startTime: startTime,
            endTime: endTime,
            bookedPlayers: initialSlot.bookedPlayers || [],
            level: initialSlot.level || 'abierto', 
            category: initialSlot.category || 'abierta', 
            designatedGratisSpotPlaceholderIndexForOption: initialSlot.designatedGratisSpotPlaceholderIndexForOption || {},
        });
        
         if (initialSlot.instructorName && initialSlot.id) {
            let hash = 0;
            const str = initialSlot.instructorName + initialSlot.id;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash |= 0; 
            }
            const randomVal = (Math.abs(hash) % 16) / 10; 
            setInstructorRating(parseFloat(Math.max(3.5, Math.min(5.0, 3.8 + randomVal)).toFixed(1)));
        }
    }, [initialSlot]);
    
    const { completed: isSlotEffectivelyFull, size: confirmedGroupSize } = useMemo(() => isSlotEffectivelyCompleted(currentSlot), [currentSlot]);

    const bookingsByGroupSize: Record<number, { userId: string; groupSize: 1 | 2 | 3 | 4 }[]> = useMemo(() => {
        const groups: Record<number, { userId: string; groupSize: 1 | 2 | 3 | 4 }[]> = { 1: [], 2: [], 3: [], 4: [] };
        if (!currentSlot || !currentSlot.bookedPlayers) return groups;
        (currentSlot.bookedPlayers || []).forEach(p => {
            const validGroupSize = [1, 2, 3, 4].includes(p.groupSize) ? p.groupSize : null;
            if (validGroupSize && groups[validGroupSize]) { 
                groups[validGroupSize].push(p as { userId: string; groupSize: 1 | 2 | 3 | 4 });
            }
        });
        return groups;
    }, [currentSlot]);
    
    const userHasConfirmedActivityToday = (currentUser && currentSlot?.startTime) 
        ? hasAnyConfirmedActivityForDay(currentUser.id, new Date(currentSlot.startTime))
        : false;

    const handleBook = async () => {
        if (!currentUser) { toast({ title: "Error", description: "Debes iniciar sesión para reservar.", variant: "destructive" }); return; }
        if (groupSizeToBook === null || spotIndexToBook === undefined || !currentSlot) return;
        const primaryGroupSize = groupSizeToBook as (1 | 2 | 3 | 4);
        const bookingKey = `${primaryGroupSize}-${spotIndexToBook}`;
        setIsPendingMap(prev => ({ ...prev, [bookingKey]: true }));
        const result = await bookClass(currentUser.id, currentSlot.id, primaryGroupSize, spotIndexToBook);
        setShowConfirmDialog(false); 
        setSpotIndexToBook(undefined);
        setIsPendingMap(prev => ({ ...prev, [bookingKey]: false }));
        
        if ('error' in result) {
            toast({ title: 'Error en la Reserva', description: result.error, variant: "destructive" });
        } else if (result.booking && result.updatedSlot) {
            toast({ title: '¡Inscripción Realizada!', description: `Te has inscrito en: Clase de ${result.booking.groupSize}.`, className: 'bg-primary text-primary-foreground' });
            onBookingSuccess(result.booking, result.updatedSlot);
        }
    };
    
    const handleMakeClassPublic = useCallback(async () => {
        if (!currentUser) return;
        setIsPendingMap(prev => ({ ...prev, [`make-public-${currentSlot.id}`]: true }));
        const result = await makeClassPublic(currentUser.id, currentSlot.id);
        setIsPendingMap(prev => ({ ...prev, [`make-public-${currentSlot.id}`]: false }));
        setIsPublicConfirmOpen(false);
        if ('error' in result) {
            toast({ title: 'Error', description: result.error, variant: "destructive" });
        } else {
            toast({ title: '¡Clase Pública!', description: 'La clase ahora es pública y está abierta a inscripciones.' });
            onBookingSuccess({} as Booking, result.updatedSlot); // Trigger refresh
        }
    }, [currentUser, currentSlot, onBookingSuccess, toast]);

    const openConfirmationDialog = (optionSize: 1 | 2 | 3 | 4, spotIdx: number) => {
        setShowConfirmDialog(true);
        setGroupSizeToBook(optionSize);
        setSpotIndexToBook(spotIdx);
    }

    if (!currentSlot || !currentUser) {
        return <Skeleton className="h-96 w-full" />;
    }
    
    const durationMinutes = currentSlot.endTime ? differenceInMinutes(new Date(currentSlot.endTime), new Date(currentSlot.startTime)) : 60;
    
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
            <Card className="flex flex-col h-full transition-shadow duration-300 hover:shadow-xl">
                <CardHeader className="pb-2 pt-3 px-3"> 
                    <div className="flex justify-between items-start">
                        <div className="flex-grow">
                             <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4" />
                                <span className="font-semibold">{`${format(new Date(currentSlot.startTime), 'HH:mm', { locale: es })} - ${format(new Date(currentSlot.endTime), 'HH:mm', { locale: es })}`} ({durationMinutes} min)</span>
                             </div>
                              <p className="text-xs text-muted-foreground capitalize">{format(new Date(currentSlot.startTime), "eeee, d 'de' MMMM", { locale: es })}</p>
                        </div>
                        {isSlotEffectivelyFull && (
                            <Badge variant="default" className="text-xs bg-green-600 text-white border-green-700">
                                <CircleCheckBig className="mr-1 h-3 w-3" />Clase Confirmada
                            </Badge>
                        )}
                    </div>
                     <div className="flex items-center space-x-2 pt-1 text-xs">
                        <Avatar className="h-7 w-7">
                             <AvatarImage src={`https://i.pravatar.cc/48?u=${currentSlot.instructorId}`} alt={currentSlot.instructorName} data-ai-hint="instructor profile photo"/>
                             <AvatarFallback className="text-xs">{getInitials(currentSlot.instructorName)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                           <span className="font-medium">{currentSlot.instructorName}</span>
                           {renderStarsDisplay(instructorRating)}
                        </div>
                     </div>
                </CardHeader>
                <CardContent className="flex-grow pt-2 pb-2 px-1.5 grid grid-cols-2 gap-1.5"> 
                     {([1, 2, 3, 4] as const).map(optionSize => {
                        const isUserBookedInThisOption = (bookingsByGroupSize[optionSize] || []).some(p => p.userId === currentUser.id);
                        
                        return (
                            <div key={optionSize} className={cn( 
                                "border rounded-md p-1.5 flex flex-col items-center text-center relative min-h-[130px] justify-between transition-all",
                                 (isSlotEffectivelyFull && confirmedGroupSize !== optionSize) && "opacity-50 pointer-events-none bg-gray-50",
                                isUserBookedInThisOption && "bg-blue-50 border-blue-200"
                            )}>
                                <h4 className="font-bold text-xs">Clase de {optionSize}p</h4>
                                <div className={cn(
                                    "flex flex-wrap justify-center items-start gap-x-0.5 gap-y-0.5 mt-0.5 mb-0.5 min-h-[60px]",
                                    optionSize === 3 && "w-[110px]", 
                                    optionSize === 4 && "w-[110px]"
                                )}> 
                                    {Array.from({ length: optionSize }).map((_, index) =>
                                        <BookingSpotDisplay
                                            key={`${optionSize}-${index}`}
                                            optionSize={optionSize}
                                            spotIndex={index}
                                            bookingsByGroupSize={bookingsByGroupSize}
                                            currentUser={currentUser!}
                                            currentSlot={currentSlot}
                                            isPendingMap={isPendingMap}
                                            totalPrice={currentSlot.totalPrice!}
                                            pointsCostForGratisSpot={calculatePricePerPerson(currentSlot.totalPrice, 1)}
                                            isSlotOverallConfirmed={isSlotEffectivelyFull}
                                            confirmedGroupSize={confirmedGroupSize}
                                            userHasConfirmedActivityToday={userHasConfirmedActivityToday}
                                            isUserBookedInThisOption={isUserBookedInThisOption} 
                                            onOpenConfirmationDialog={openConfirmationDialog}
                                            showPointsBonus={true}
                                        />
                                    )}
                                </div>
                                <span className="font-semibold text-xs">{calculatePricePerPerson(currentSlot.totalPrice, optionSize).toFixed(2)}€ p.p.</span>
                            </div>
                        );
                    })}
                </CardContent>
                 {currentSlot.organizerId === currentUser?.id && currentSlot.status === 'confirmed_private' && (
                    <CardFooter className="p-2">
                        <AlertDialog open={isPublicConfirmOpen} onOpenChange={setIsPublicConfirmOpen}>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" size="xs" className="w-full h-auto py-1 text-xs">
                                     <Unlock className="mr-2 h-3.5 w-3.5" /> Hacer Pública
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>¿Hacer Pública la Clase?</AlertDialogTitle>
                                    <AlertDialogDescription>Si haces pública esta clase, otros alumnos podrán unirse a las plazas libres. No se te reembolsará el coste.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleMakeClassPublic}>Sí, Hacer Pública</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardFooter>
                )}
            </Card>

            <AlertDialog open={showConfirmDialog && spotIndexToBook !== undefined} onOpenChange={(isOpen) => { if (!isOpen) { setShowConfirmDialog(false); setSpotIndexToBook(undefined); }}}>
                {currentSlot && currentUser && (
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Inscripción</AlertDialogTitle>
                            <AlertDialogDescription>
                                {groupSizeToBook === 1
                                    ? `Vas a reservar una clase privada por ${currentSlot.totalPrice?.toFixed(2)}€. Se te cobrará el importe total.`
                                    : `Vas a apuntarte a una clase de ${groupSizeToBook} personas. Coste: ${calculatePricePerPerson(currentSlot.totalPrice, groupSizeToBook as (1|2|3|4)).toFixed(2)}€. Se bloqueará este importe de tu saldo.`}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isPendingMap[`${groupSizeToBook}-${spotIndexToBook}`]}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleBook} disabled={isPendingMap[`${groupSizeToBook}-${spotIndexToBook}`]}>
                                {isPendingMap[`${groupSizeToBook}-${spotIndexToBook}`] ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                )}
            </AlertDialog>
        </>
    );
};

export default TimeSlotCard;
