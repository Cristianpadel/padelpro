"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { parseISO, differenceInMinutes, differenceInDays, startOfDay } from 'date-fns';
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
import { displayClassLevel } from '@/types';
import {
    getMockUserBookings, bookClass, isSlotEffectivelyCompleted, hasAnyConfirmedActivityForDay, makeClassPublic,
    getMockClubs, calculateActivityPrice, getInstructorRate, getCourtAvailabilityForInterval, getMockInstructors,
    confirmClassAsPrivate, joinPrivateClass
} from '@/lib/mockData';
import { Lightbulb, ShieldQuestion, Hash, Users2, Venus, Mars, Euro } from 'lucide-react';
import { calculatePricePerPerson } from '@/lib/utils';

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

    // State for dialogs
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [dialogContent, setDialogContent] = useState({ spotIndex: 0, groupSize: 4 as (1|2|3|4) });
    const [infoDialog, setInfoDialog] = useState<{ open: boolean, title: string, description: string, icon: React.ElementType }>({ open: false, title: '', description: '', icon: Lightbulb });
    const [isConfirmPrivateDialogOpen, setIsConfirmPrivateDialogOpen] = useState(false);
    const [privateClassSizeToConfirm, setPrivateClassSizeToConfirm] = useState<1 | 2 | 3 | 4>(4);
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

    // Memos for derived state
    const isSlotEffectivelyFull = useMemo(() => isSlotEffectivelyCompleted(currentSlot).completed, [currentSlot]);
    const confirmedGroupSize = useMemo(() => isSlotEffectivelyCompleted(currentSlot).size, [currentSlot]);
    
    const bookingsByGroupSize = useMemo(() => {
        const groups: Record<number, { userId: string; groupSize: 1 | 2 | 3 | 4; }[]> = { 1: [], 2: [], 3: [], 4: [] };
        (currentSlot.bookedPlayers || []).forEach(p => {
            if (groups[p.groupSize]) groups[p.groupSize].push(p);
        });
        return groups;
    }, [currentSlot.bookedPlayers]);

    const userHasConfirmedActivityToday = useMemo(() => 
        currentUser ? hasAnyConfirmedActivityForDay(currentUser.id, new Date(currentSlot.startTime), currentSlot.id, 'class') : false,
    [currentUser, currentSlot.startTime, currentSlot.id]);

    const canConfirmAsPrivate = useMemo(() =>
        currentUser && currentSlot.status === 'pre_registration' && (currentSlot.bookedPlayers || []).length === 0,
    [currentUser, currentSlot]);

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
        setDialogContent({ groupSize: optionSize, spotIndex: spotIdx });
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

    const handleInfoClick = (type: 'level' | 'court' | 'category') => {
        let dialogContent;
        const levelDisplay = displayClassLevel(currentSlot.level, true);
        const CategoryIcon = currentSlot.category === 'chica' ? Venus : currentSlot.category === 'chico' ? Mars : Users2;

        switch (type) {
            case 'level':
                dialogContent = { title: 'Nivel de la Clase', description: 'Este es el rango de nivel para esta clase. Se ajusta según el primer jugador inscrito para asegurar que sea competitiva.', icon: Lightbulb };
                break;
            case 'court':
                dialogContent = { title: 'Asignación de Pista', description: 'La pista se asigna automáticamente solo cuando la clase está completa.\nRecibirás una notificación con el número de pista cuando se confirme.', icon: Hash };
                break;
            case 'category':
                dialogContent = { title: 'Categoría de la Clase', description: 'La categoría (chicos/chicas) la sugiere el primer jugador que se apunta.\nNo es una regla estricta, solo una guía para los demás jugadores.', icon: CategoryIcon };
                break;
        }
        setInfoDialog({ open: true, ...dialogContent });
    };
    
    const handlePriceInfoClick = (optionSize: 1 | 2 | 3 | 4) => {
         setInfoDialog({ 
            open: true, 
            title: 'Información del Precio', 
            description: `El precio por persona se calcula dividiendo el coste total de la clase (${totalPrice.toFixed(2)}€) entre el número de jugadores en la opción que elijas.\nOpción de ${optionSize}p: ${totalPrice.toFixed(2)}€ / ${optionSize} = ${(totalPrice/optionSize).toFixed(2)}€ cada uno.`, 
            icon: Euro 
        });
    };

    const handleConfirmAsPrivate = async () => {
         if (!currentUser) return;
        setIsProcessingPrivateAction(true);
        const result = await confirmClassAsPrivate(currentUser.id, currentSlot.id, privateClassSizeToConfirm);
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
    
    const handleJoinPrivateClass = async () => {
        if (!currentUser || !shareCode) return;
        setIsProcessingPrivateAction(true);
        const result = await joinPrivateClass(currentUser.id, currentSlot.id, shareCode);
        if('error' in result) {
             toast({ title: "Error al Unirse", description: result.error, variant: "destructive" });
        } else {
            onBookingSuccess();
            toast({
                title: "¡Te has unido a la Clase Privada!",
                description: `Se ha realizado un cargo de ${result.organizerRefundAmount.toFixed(2)}€ y se ha reembolsado al organizador.`,
                className: 'bg-primary text-primary-foreground'
            });
        }
        setIsProcessingPrivateAction(false);
    };

    if (!currentUser || !clubInfo || !instructor) {
        return <Card className="p-4"><Skeleton className="h-[500px] w-full" /></Card>;
    }
    
    const durationMinutes = differenceInMinutes(new Date(currentSlot.endTime), new Date(currentSlot.startTime));

    return (
        <>
            <Card className="flex flex-col h-full rounded-lg overflow-hidden border">
                <ClassCardHeader
                    currentSlot={currentSlot}
                    instructor={instructor}
                    clubInfo={clubInfo}
                    instructorRating={instructorRating}
                    durationMinutes={durationMinutes}
                    isSlotEffectivelyFull={isSlotEffectivelyFull}
                    handleShareClass={handleShareClass}
                    handleInfoClick={handleInfoClick}
                />
                <ClassCardContent
                    currentUser={currentUser}
                    currentSlot={currentSlot}
                    totalPrice={totalPrice}
                    bookingsByGroupSize={bookingsByGroupSize}
                    isSlotEffectivelyFull={isSlotEffectivelyFull}
                    confirmedGroupSize={confirmedGroupSize}
                    userHasConfirmedActivityToday={userHasConfirmedActivityToday}
                    isPendingMap={isPendingMap}
                    onOpenConfirmationDialog={openConfirmationDialog}
                    showPointsBonus={showPointsBonus}
                    handlePriceInfoClick={handlePriceInfoClick}
                    courtAvailability={courtAvailability}
                />
                <ClassCardFooter
                    currentSlot={currentSlot}
                    currentUser={currentUser}
                    shareCode={shareCode}
                    isProcessingPrivateAction={isProcessingPrivateAction}
                    canConfirmAsPrivate={!!canConfirmAsPrivate}
                    canJoinThisPrivateMatch={!!(shareCode && currentSlot.status === 'confirmed_private')}
                    userHasConfirmedActivityToday={userHasConfirmedActivityToday}
                    priceForPrivateInvitee={calculatePricePerPerson(totalPrice, currentSlot.confirmedPrivateSize || 4)}
                    handleConfirmAsPrivate={handleConfirmAsPrivate}
                    handleJoinPrivateClass={handleJoinPrivateClass}
                    handleShareClass={handleShareClass}
                    onOpenChangePrivateDialog={setIsConfirmPrivateDialogOpen}
                    isConfirmPrivateDialogOpen={isConfirmPrivateDialogOpen}
                    privateClassSizeToConfirm={privateClassSizeToConfirm}
                />
            </Card>

            <BookingConfirmationDialog
                isOpen={showConfirmDialog}
                onOpenChange={setShowConfirmDialog}
                onConfirm={handleBook}
                isPending={isPendingMap[`${dialogContent.groupSize}-${dialogContent.spotIndex}`]}
                currentUser={currentUser}
                totalPrice={totalPrice}
                {...dialogContent}
            />

            <ClassInfoDialog
                isOpen={infoDialog.open}
                onOpenChange={(open) => setInfoDialog(prev => ({ ...prev, open }))}
                title={infoDialog.title}
                description={infoDialog.description}
                icon={infoDialog.icon}
            />
        </>
    );
});
ClassCard.displayName = 'ClassCard';
export default ClassCard;
