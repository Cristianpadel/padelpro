// src/components/class/ClassCard.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { isSameDay, parseISO, differenceInMinutes, differenceInDays, startOfDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ClassInfoDialog } from './ClassCard/ClassInfoDialog';
import { ClassCardHeader } from './ClassCard/ClassCardHeader';
import { ClassCardContent } from './ClassCard/ClassCardContent';
import { ClassCardFooter } from './ClassCard/ClassCardFooter';
import { BookingConfirmationDialog } from './ClassCard/BookingConfirmationDialog';

import type { TimeSlot, User, Club, PadelCourt, Instructor, ClassPadelLevel } from '@/types';
import {
    bookClass, isSlotEffectivelyCompleted, hasAnyActivityForDay,
    getMockClubs, calculateActivityPrice, getInstructorRate, getCourtAvailabilityForInterval, getMockInstructors,
    confirmClassAsPrivate
} from '@/lib/mockData';
import { Lightbulb, ShieldQuestion, Hash, Users2, Venus, Mars, Euro, Info } from 'lucide-react';
import { calculatePricePerPerson, hexToRgba } from '@/lib/utils';
import { displayClassCategory } from '@/types';
import { cn } from '@/lib/utils';

interface ClassCardProps {
    classData: TimeSlot;
    currentUser: User | null;
    onBookingSuccess: () => void;
    shareCode?: string;
    showPointsBonus: boolean;
}

const ClassCard: React.FC<ClassCardProps> = React.memo(({ classData: initialSlot, currentUser, onBookingSuccess, shareCode, showPointsBonus }) => {
    const { toast } = useToast();
    const router = useRouter();
    
    // State for managing UI and data
    const [isPendingMap, setIsPendingMap] = useState<Record<string, boolean>>({});
    const [currentSlot, setCurrentSlot] = useState<TimeSlot>(initialSlot);
    const [instructor, setInstructor] = useState<Instructor | null>(null);
    const [clubInfo, setClubInfo] = useState<Club | null>(null);
    const [totalPrice, setTotalPrice] = useState<number>(0);
    const [courtAvailability, setCourtAvailability] = useState<{ available: PadelCourt[], occupied: PadelCourt[], total: number }>({ available: [], occupied: [], total: 0 });
    const [instructorRating, setInstructorRating] = useState<number>(4.5);
    const [statusMessage, setStatusMessage] = useState('');
    const [showStatusMessage, setShowStatusMessage] = useState(false);

    // State for dialogs
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [dialogContent, setDialogContent] = useState<{ spotIndex: number, groupSize: 1 | 2 | 3 | 4, pointsToAward: number }>({ spotIndex: 0, groupSize: 4 as (1|2|3|4), pointsToAward: 0 });
    const [infoDialog, setInfoDialog] = useState<{ open: boolean, title: string, description: string, icon: React.ElementType }>({ open: false, title: '', description: '', icon: Lightbulb });
    const [isConfirmPrivateDialogOpen, setIsConfirmPrivateDialogOpen] = useState(false);
    const [isProcessingPrivateAction, setIsProcessingPrivateAction] = useState(false);

    // Data Fetching and Initialization
    useEffect(() => {
        const loadInitialData = async () => {
            const clubData = getMockClubs().find(c => c.id === initialSlot.clubId);
            const instructorData = getMockInstructors().find(i => i.id === initialSlot.instructorId);

            setClubInfo(clubData || null);
            setInstructor(instructorData || null);

            if (clubData && instructorData) {
                const courtPrice = calculateActivityPrice(clubData, new Date(initialSlot.startTime));
                const instructorRate = getInstructorRate(instructorData, new Date(initialSlot.startTime));
                setTotalPrice(courtPrice + instructorRate);
                
                const availability = await getCourtAvailabilityForInterval(initialSlot.clubId, new Date(initialSlot.startTime), new Date(initialSlot.endTime));
                setCourtAvailability(availability);
            }
        };

        loadInitialData();
        setCurrentSlot(initialSlot);
    }, [initialSlot]);
    
    // Status message effect
    useEffect(() => {
        const totalBookedPlayers = currentSlot.bookedPlayers.length;
        const { completed } = isSlotEffectivelyCompleted(currentSlot);

        let newStatusMessage = '';
        if (!completed && totalBookedPlayers > 0) {
            const currentGroupSize = currentSlot.bookedPlayers[0]?.groupSize;
            if (currentGroupSize) {
                const playersNeeded = currentGroupSize - totalBookedPlayers;
                if (playersNeeded > 0) {
                    const playerText = totalBookedPlayers === 1 ? 'un jugador apuntado' : `${totalBookedPlayers} jugadores apuntados`;
                    const neededText = playersNeeded === 1 ? 'falta 1 más' : `faltan ${playersNeeded} más`;
                    newStatusMessage = `Hay ${playerText}, ¡${neededText} para confirmar la clase!`;
                }
            }
        }
        
        if (newStatusMessage && newStatusMessage !== statusMessage) {
            setStatusMessage(newStatusMessage);
            setShowStatusMessage(true);
            const timer = setTimeout(() => {
                setShowStatusMessage(false);
            }, 5000); // Message disappears after 5 seconds

            return () => clearTimeout(timer);
        } else if (!newStatusMessage) {
            setShowStatusMessage(false);
        }

    }, [currentSlot.bookedPlayers, statusMessage]);


    // Memos for derived state
    const isSlotEffectivelyFull = useMemo(() => isSlotEffectivelyCompleted(currentSlot).completed, [currentSlot]);
    
    const bookingsByGroupSize = useMemo(() => {
        const groups: Record<number, { userId: string; groupSize: 1 | 2 | 3 | 4; }[]> = { 1: [], 2: [], 3: [], 4: [] };
        (currentSlot.bookedPlayers || []).forEach(p => {
            if (groups[p.groupSize]) groups[p.groupSize].push(p);
        });
        return groups;
    }, [currentSlot.bookedPlayers]);

    const userHasConfirmedActivityToday = useMemo(() => {
        if (!currentUser) return false;
        return hasAnyActivityForDay(currentUser.id, new Date(currentSlot.startTime), new Date(currentSlot.endTime));
    }, [currentUser, currentSlot.startTime, currentSlot.endTime]);

    const anticipationBonus = useMemo(() => {
      try {
        if (!currentSlot.startTime) return 0;
        const startTime = new Date(currentSlot.startTime);
        if (isNaN(startTime.getTime())) return 0;
        return Math.max(0, differenceInDays(startOfDay(startTime), startOfDay(new Date())));
      } catch (e) {
        return 0;
      }
    }, [currentSlot.startTime]);


    // Handlers
    const handleBook = async () => {
        if (!currentUser) { toast({ title: "Error", description: "Debes iniciar sesión.", variant: "destructive" }); return; }
        const { groupSize, spotIndex } = dialogContent;
        const bookingKey = `${groupSize}-${spotIndex}`;
        setIsPendingMap(prev => ({ ...prev, [bookingKey]: true }));
        const result = await bookClass(currentUser.id, currentSlot.id, groupSize, spotIndex);
        
        setShowConfirmDialog(false);
        setIsPendingMap(prev => ({ ...prev, [bookingKey]: false }));
        
        if ('error' in result) {
            toast({ title: 'Error en la Reserva', description: result.error, variant: "destructive" });
        } else {
            toast({ title: '¡Inscripción Realizada!', description: `Te has inscrito en: Clase de ${result.booking.groupSize}.`, className: 'bg-primary text-primary-foreground' });
            router.push(`/clases/${result.updatedSlot.id}`);
            onBookingSuccess();
        }
    };
    
    const openConfirmationDialog = (optionSize: 1 | 2 | 3 | 4, spotIdx: number) => {
        const pointsBaseValues: { [key in 1 | 2 | 3 | 4]: number[] } = { 1: [10], 2: [8, 7], 3: [5, 4, 3], 4: [3, 2, 1, 0] };
        const basePoints = (pointsBaseValues[optionSize] || [])[spotIdx] ?? 0;
        const totalPointsToAward = basePoints + anticipationBonus;

        setDialogContent({ groupSize: optionSize, spotIndex: spotIdx, pointsToAward: totalPointsToAward });
        setShowConfirmDialog(true);
    };

    const handleShareClass = async () => {
        const shareUrl = `${window.location.origin}/clases/${currentSlot.id}${currentSlot.privateShareCode ? `?code=${currentSlot.privateShareCode}`: ''}`;
        try {
            await navigator.clipboard.writeText(shareUrl);
            toast({ title: "¡Enlace Copiado!", description: "El enlace a la clase ha sido copiado.", className: "bg-primary text-primary-foreground" });
        } catch (err) {
            toast({ title: "Error", description: "No se pudo copiar el enlace.", variant: "destructive" });
        }
    };

    const handleInfoClick = (type: 'level' | 'court' | 'category' | { type: 'price', optionSize: number }) => {
        let dialogContent;
        if (typeof type === 'object' && type.type === 'price') {
            const price = calculatePricePerPerson(totalPrice, type.optionSize);
            dialogContent = {
                title: `Precio para Clase de ${type.optionSize}p`,
                description: `El precio total de la clase (pista + instructor) se divide entre el número de jugadores.\nPara ${type.optionSize} jugador(es), cada uno paga ${price.toFixed(2)}€.`,
                icon: Euro
            };
        } else {
             const CategoryIcon = currentSlot.category === 'chica' ? Venus : currentSlot.category === 'chico' ? Mars : Users2;
            switch (type) {
                case 'level':
                    dialogContent = { title: 'Nivel de la Clase', description: 'Este es el rango de nivel para esta clase. Se ajusta según el primer jugador inscrito para asegurar que sea competitiva.', icon: Lightbulb };
                    break;
                case 'court':
                    dialogContent = { title: 'Asignación de Pista', description: 'La pista se asigna automáticamente solo cuando la clase está completa.\nRecibirás una notificación con el número de pista cuando se confirme.', icon: Hash };
                    break;
                case 'category':
                    dialogContent = { title: 'Categoría de la Clase', description: 'La categoría (chicos/chicas) la sugiere el primer jugador que se apunta.\nNo es una regla estricta, solo una guía para los demás.', icon: CategoryIcon };
                    break;
            }
        }
        setInfoDialog({ open: true, ...dialogContent });
    };
    
    const handleConfirmAsPrivate = async () => {
        const firstEmptyGroupSize = [1, 2, 3, 4].find(size => (bookingsByGroupSize[size] || []).length === 0) as 1 | 2 | 3 | 4 | undefined;
        if (!currentUser || !firstEmptyGroupSize) return;

        setIsProcessingPrivateAction(true);
        const result = await confirmClassAsPrivate(currentUser.id, currentSlot.id, firstEmptyGroupSize);
        if ('error' in result) {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        } else {
            onBookingSuccess();
            toast({
                title: "¡Clase Privada Creada!",
                description: "Se ha creado la clase privada. Comparte el enlace con tus amigos para que se unan.",
                className: "bg-purple-600 text-white",
                duration: 10000
            });
            router.push(`/clases/${result.updatedSlot.id}`);
        }
        setIsConfirmPrivateDialogOpen(false);
        setIsProcessingPrivateAction(false);
    };

    if (!currentUser || !clubInfo || !instructor) {
        return <Card className="p-4"><Skeleton className="h-[500px] w-full" /></Card>;
    }
    
    const durationMinutes = differenceInMinutes(new Date(currentSlot.endTime), new Date(currentSlot.startTime));
    const shadowEffect = clubInfo?.cardShadowEffect;
    const shadowStyle = shadowEffect?.enabled 
        ? { boxShadow: `0 0 25px ${hexToRgba(shadowEffect.color, shadowEffect.intensity)}` } 
        : {};

    return (
        <div className="relative">
            <Card className="flex flex-col h-full rounded-lg overflow-hidden border bg-background" style={shadowStyle}>
                <ClassCardHeader
                    currentSlot={currentSlot}
                    instructor={instructor}
                    clubInfo={clubInfo}
                    instructorRating={instructorRating}
                    durationMinutes={durationMinutes}
                    isSlotEffectivelyFull={isSlotEffectivelyFull}
                    handleShareClass={handleShareClass}
                    onInfoClick={(type) => handleInfoClick(type)}
                    onReservarPrivadaClick={() => setIsConfirmPrivateDialogOpen(true)}
                    isProcessingPrivateAction={isProcessingPrivateAction}
                    bookings={bookingsByGroupSize}
                />
                <ClassCardContent
                    currentUser={currentUser}
                    currentSlot={currentSlot}
                    totalPrice={totalPrice}
                    bookingsByGroupSize={bookingsByGroupSize}
                    isSlotEffectivelyFull={isSlotEffectivelyFull}
                    userHasConfirmedActivityToday={userHasConfirmedActivityToday}
                    isPendingMap={isPendingMap}
                    onOpenConfirmationDialog={openConfirmationDialog}
                    showPointsBonus={showPointsBonus}
                    handlePriceInfoClick={(optionSize) => handleInfoClick({ type: 'price', optionSize })}
                    anticipationBonus={anticipationBonus}
                />
                 <ClassCardFooter
                    courtAvailability={courtAvailability}
                />
            </Card>

            {showStatusMessage && (
                 <div
                    className={cn(
                        "absolute -bottom-4 left-1/2 -translate-x-1/2 w-5/6 text-center text-xs text-blue-800 font-semibold bg-blue-100 p-2 rounded-lg border-2 border-white shadow-lg flex items-center justify-center transition-all duration-500 z-10",
                        showStatusMessage ? 'data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:slide-in-from-bottom-5' : 'data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:slide-out-to-bottom-5'
                    )}
                 >
                    <Info className="h-4 w-4 mr-2 flex-shrink-0" />
                    {statusMessage}
                </div>
            )}

            <BookingConfirmationDialog
                isOpen={showConfirmDialog}
                onOpenChange={setShowConfirmDialog}
                onConfirm={handleBook}
                isPending={isPendingMap[`${dialogContent.groupSize}-${dialogContent.spotIndex}`]}
                currentUser={currentUser}
                totalPrice={totalPrice}
                {...dialogContent}
                isGratisSpot={currentSlot.designatedGratisSpotPlaceholderIndexForOption?.[dialogContent.groupSize] === dialogContent.spotIndex}
            />
            
             <BookingConfirmationDialog
                isOpen={isConfirmPrivateDialogOpen}
                onOpenChange={setIsConfirmPrivateDialogOpen}
                onConfirm={handleConfirmAsPrivate}
                isPending={isProcessingPrivateAction}
                currentUser={currentUser}
                totalPrice={totalPrice}
                groupSize={1} // Indicates private booking
                spotIndex={0}
                pointsToAward={0} // No points for self-booking private class
            />

            <ClassInfoDialog
                isOpen={infoDialog.open}
                onOpenChange={(open) => setInfoDialog(prev => ({ ...prev, open }))}
                title={infoDialog.title}
                description={infoDialog.description}
                icon={infoDialog.icon}
            />
        </div>
    );
});
ClassCard.displayName = 'ClassCard';
export default ClassCard;
