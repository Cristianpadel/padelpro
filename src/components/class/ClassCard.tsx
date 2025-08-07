"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Clock, Users, Plus, Loader2, CheckCircle, Lock, BarChartHorizontal, Hash, User as UserIcon, Star, UserRound, Gift, HelpCircle, CircleCheckBig, SlidersHorizontal, XCircle, Minus, Venus, Mars, Users2, Share2, ShieldCheck, Unlock, Play, PiggyBank, Rocket, Scissors, ThumbsUp, Euro, Lightbulb, ShieldQuestion } from 'lucide-react';
import { format, differenceInMinutes, parseISO, differenceInDays, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn, getInitials, calculatePricePerPerson } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle as InfoDialogTitle, DialogDescription as InfoDialogDescription, DialogFooter as InfoDialogFooter, DialogClose as InfoDialogClose } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import type { TimeSlot, User, Booking, ClassPadelLevel, MatchPadelLevel, Club, PadelCourt, Instructor } from '@/types';
import { displayClassLevel, displayClassCategory } from '@/types'; 
import BookingSpotDisplay from '@/components/class/BookingSpotDisplay'; 
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input'; // Import Input for dialog
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { useRouter } from 'next/navigation';
import CourtAvailabilityIndicator from '@/components/class/CourtAvailabilityIndicator';
import { Skeleton } from '@/components/ui/skeleton';
import {
    getMockUserBookings,
    bookClass,
    isSlotEffectivelyCompleted,
    hasAnyConfirmedActivityForDay,
    makeClassPublic,
    getMockClubs,
    calculateActivityPrice,
    getInstructorRate,
    getCourtAvailabilityForInterval,
    getMockStudents,
    getMockInstructors,
    isSlotGratisAndAvailable,
    confirmClassAsPrivate,
    joinPrivateClass
} from '@/lib/mockData';

interface ClassCardProps {
    classData: TimeSlot;
    currentUser: User | null;
    onBookingSuccess: () => void;
    shareCode?: string;
    showPointsBonus: boolean;
}

const InfoDialog: React.FC<{
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  icon: React.ElementType;
}> = ({ isOpen, onOpenChange, title, description, icon: Icon }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <InfoDialogTitle className="flex items-center text-xl">
            <Icon className="mr-3 h-6 w-6 text-primary" />
            {title}
          </InfoDialogTitle>
        </DialogHeader>
        <div className="py-4 text-base text-muted-foreground leading-relaxed whitespace-pre-line">
            {description.split('\n').map((item, key) => (
                <p key={key} className="mb-2">{`• ${item}`}</p>
            ))}
        </div>
        <InfoDialogFooter>
          <InfoDialogClose asChild>
            <Button className="w-full">¡Entendido!</Button>
          </InfoDialogClose>
        </InfoDialogFooter>
      </DialogContent>
    </Dialog>
  );
};


const ClassCard: React.FC<ClassCardProps> = React.memo(({ classData: initialSlot, currentUser, onBookingSuccess, shareCode, showPointsBonus }) => {
    const { toast } = useToast();
    const router = useRouter();
    const [isPendingMap, setIsPendingMap] = useState<Record<string, boolean>>({});
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [spotIndexToBook, setSpotIndexToBook] = useState<number | undefined>(undefined);
    const [groupSizeToBook, setGroupSizeToBook] = useState<1|2|3|4>(4);
    const [currentSlot, setCurrentSlot] = useState<TimeSlot>(initialSlot);
    const [instructorRating, setInstructorRating] = useState<number>(4.5);
    const [isConfirmPrivateDialogOpen, setIsConfirmPrivateDialogOpen] = useState(false);
    const [privateClassSizeToConfirm, setPrivateClassSizeToConfirm] = useState<1 | 2 | 3 | 4>(4);
    const [isProcessingPrivateAction, setIsProcessingPrivateAction] = useState(false);
    const [clubInfo, setClubInfo] = useState<Club | null>(null);
    const [totalPrice, setTotalPrice] = useState<number>(0);
    const [infoDialog, setInfoDialog] = useState<{ open: boolean, title: string, description: string, icon: React.ElementType }>({ open: false, title: '', description: '', icon: Lightbulb });
    const [courtAvailability, setCourtAvailability] = useState<{ available: PadelCourt[], occupied: PadelCourt[], total: number }>({ available: [], occupied: [], total: 0 });

    const instructor = useMemo(() => getMockInstructors().find(i => i.id === initialSlot.instructorId), [initialSlot.instructorId]);
    
    const fetchCourtAvailability = useCallback(async () => {
        if (!initialSlot.clubId || !initialSlot.startTime || !initialSlot.endTime) return;
        const availability = await getCourtAvailabilityForInterval(initialSlot.clubId, new Date(initialSlot.startTime), new Date(initialSlot.endTime));
        setCourtAvailability(availability);
    }, [initialSlot.clubId, initialSlot.startTime, initialSlot.endTime]);

    useEffect(() => {
        const clubData = getMockClubs().find(c => c.id === initialSlot.clubId);
        setClubInfo(clubData || null);
        fetchCourtAvailability();

        if (clubData && instructor) {
            const courtPrice = calculateActivityPrice(clubData, new Date(initialSlot.startTime));
            const instructorRate = getInstructorRate(instructor, new Date(initialSlot.startTime));
            setTotalPrice(courtPrice + instructorRate);
        }

    }, [initialSlot.clubId, initialSlot.startTime, instructor, fetchCourtAvailability]);


    useEffect(() => {
        const startTime = initialSlot.startTime instanceof Date ? initialSlot.startTime : parseISO(initialSlot.startTime as unknown as string);
        const endTime = initialSlot.endTime 
                        ? (initialSlot.endTime instanceof Date ? initialSlot.endTime : parseISO(initialSlot.endTime as unknown as string)) 
                        : new Date(startTime.getTime() + 60 * 60 * 1000); 

        setCurrentSlot({
            ...initialSlot,
            startTime: startTime,
            endTime: endTime,
            bookedPlayers: initialSlot.bookedPlayers || [],
            level: initialSlot.level || 'abierto', 
            category: initialSlot.category || 'abierta', 
            designatedGratisSpotPlaceholderIndexForOption: initialSlot.designatedGratisSpotPlaceholderIndexForOption || {},
            status: initialSlot.status as any || 'forming',
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

    const isSlotOverallConfirmed = useMemo(() => {
        if (!currentSlot) return { completed: false, size: null };
        return isSlotEffectivelyCompleted(currentSlot);
    }, [currentSlot]);

    const bookingsByGroupSize: Record<number, { userId: string; groupSize: 1 | 2 | 3 | 4 }[]> = useMemo(() => {
        const groups: Record<number, { userId: string; groupSize: 1 | 2 | 3 | 4 }[]> = { 1: [], 2: [], 3: [], 4: [] };
        if (!currentSlot || !currentSlot.bookedPlayers) return groups;
        (currentSlot.bookedPlayers || []).forEach(p => {
            const validGroupSize = [1, 2, 3, 4].includes(p.groupSize) ? p.groupSize : null;
            if (validGroupSize && groups[validGroupSize]) { 
                groups[validGroupSize].push(p as { userId: string; groupSize: 1 | 2 | 3 | 4 });
            }
        });
        // Sort each group to ensure stable display order
        for (const size of [1, 2, 3, 4]) {
            if (groups[size]) {
                groups[size].sort((a, b) => (a.userId || '').localeCompare(b.userId || ''));
            }
        }
        return groups;
    }, [currentSlot]);
    
    const userHasConfirmedActivityToday = (currentUser && currentSlot?.startTime) 
        ? hasAnyConfirmedActivityForDay(currentUser.id, new Date(currentSlot.startTime), currentSlot.id, 'class')
        : false;
    
    const anticipationPoints = useMemo(() => {
        if (!currentSlot?.startTime) return 0;
        const days = differenceInDays(startOfDay(new Date(currentSlot.startTime)), startOfDay(new Date()));
        return Math.max(0, days);
    }, [currentSlot?.startTime]);


    const isOrganizerOfPrivateClass = currentSlot.status === 'confirmed_private' && currentUser && currentSlot.organizerId === currentUser.id;

    const handleInfoClick = (type: 'level' | 'court' | 'category') => {
        let dialogContent;
        const levelDisplay = displayClassLevel(currentSlot.level as ClassPadelLevel);
        
        switch (type) {
            case 'level':
                dialogContent = currentSlot.level === 'abierto'
                    ? { title: 'Nivel', description: `El nivel de esta clase lo define el primer jugador que se inscribe.\nEsto asegura que la clase sea equilibrada para todos.`, icon: Lightbulb }
                    : { title: `Nivel: ${levelDisplay}`, description: `El nivel se ha fijado en este rango para garantizar una clase competitiva y divertida.\nSolo jugadores con un nivel similar pueden unirse.`, icon: BarChartHorizontal };
                break;
            case 'court':
                dialogContent = !currentSlot.courtNumber
                    ? { title: 'Pista', description: `La pista se asigna automáticamente solo cuando la clase está completa.\nEl sistema buscará la primera pista libre en el club a esa hora.\nRecibirás una notificación cuando se confirme.`, icon: ShieldQuestion }
                    : { title: `Pista Asignada: ${currentSlot.courtNumber}`, description: `¡Ya tenéis pista!\nSe ha asignado la Pista ${currentSlot.courtNumber} porque la clase está completa.\n¡A jugar!`, icon: Hash };
                break;
            case 'category':
                dialogContent = currentSlot.category === 'abierta'
                    ? { title: 'Categoría', description: `La categoría (chicos/chicas) la sugiere el primer jugador que se apunta.\nNo es una regla estricta, solo una guía para los demás.`, icon: Users }
                    : { title: `Categoría: ${displayClassCategory(currentSlot.category)}`, description: `Esta categoría se ha definido como sugerencia para la clase, basándose en el primer jugador que se inscribió.`, icon: (currentSlot.category === 'chica' ? Venus : Mars) };
                break;
        }
        setInfoDialog({ open: true, ...dialogContent });
    };

    const handlePriceInfoClick = (optionSize: 1 | 2 | 3 | 4) => {
        if (!clubInfo || !instructor) return;
        const courtPrice = calculateActivityPrice(clubInfo, new Date(currentSlot.startTime));
        const instructorRate = getInstructorRate(instructor, new Date(currentSlot.startTime));
        const finalTotalPrice = courtPrice + instructorRate;
        const pricePerPerson = calculatePricePerPerson(finalTotalPrice, optionSize);

        const description = `Tarifa Instructor: ${instructorRate.toFixed(2)}€\n+ Coste Pista: ${courtPrice.toFixed(2)}€\n= Total Clase: ${finalTotalPrice.toFixed(2)}€\n\nDividido entre ${optionSize} alumno${optionSize > 1 ? 's' : ''}, sale a ${pricePerPerson.toFixed(2)}€ por persona.`;

        setInfoDialog({
            open: true,
            title: `Desglose de Precio (${optionSize}p)`,
            description: description,
            icon: Euro
        });
    };

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
            router.push(`/clases/${result.updatedSlot.id}`);
            onBookingSuccess();
        }
    };

    const openConfirmationDialog = (optionSize: 1 | 2 | 3 | 4, spotIdx: number) => {
        if (!currentUser) { toast({ title: "Acción Requerida", description: "Por favor, inicia sesión.", variant: "default" }); return; }
        if (!currentSlot) return;

        const classLevel = currentSlot.level;
        const userLevel = currentUser.level;
        let levelCompatible = false;
        if (classLevel === 'abierto' || !userLevel) {
            levelCompatible = true;
        } else if (typeof classLevel === 'object' && 'min' in classLevel && 'max' in classLevel && userLevel) {
            const classMin = parseFloat(classLevel.min as string);
            const classMax = parseFloat(classLevel.max as string);
            const playerLvlNum = parseFloat(userLevel as string);
            if (!isNaN(playerLvlNum) && !isNaN(classMin) && !isNaN(classMax)) {
                if (playerLvlNum >= classMin && playerLvlNum <= classMax) {
                    levelCompatible = true;
                }
            }
        }
        if (!levelCompatible) {
            const classLevelDisplay = displayClassLevel(classLevel as ClassPadelLevel);
            toast({ title: "Nivel Incompatible", description: `Tu nivel (${userLevel || 'No definido'}) no es compatible con el de la clase (${classLevelDisplay}).`, variant: "destructive", duration: 7000 });
            return;
        }

        const isAttemptingDesignatedGratisSpot = currentSlot.designatedGratisSpotPlaceholderIndexForOption?.[optionSize] === spotIdx && !(bookingsByGroupSize[optionSize] || [])[spotIdx];
        
        const pricePerPerson = calculatePricePerPerson(totalPrice, optionSize);
        const pointsCostForThisOptionGratis = calculatePricePerPerson(totalPrice, 1); 
        const availableCredit = (currentUser.credit ?? 0) - (currentUser.blockedCredit ?? 0);

        if (isAttemptingDesignatedGratisSpot) {
            if ((currentUser.loyaltyPoints ?? 0) < pointsCostForThisOptionGratis) {
                 toast({ title: "Puntos Insuficientes", description: `No tienes suficientes puntos (${currentUser.loyaltyPoints ?? 0}) para canjear esta plaza gratis (${pointsCostForThisOptionGratis} puntos).`, variant: "destructive", duration: 7000 });
                return;
            }
        } else {
             if (optionSize === 1 && availableCredit < totalPrice) { // Special check for private class
                toast({ title: "Saldo Insuficiente", description: `No tienes suficiente crédito disponible (${availableCredit.toFixed(2)}€) para reservar la clase privada (${totalPrice.toFixed(2)}€).`, variant: "destructive", duration: 7000 });
                return;
            } else if (optionSize > 1 && availableCredit < pricePerPerson) {
                toast({ title: "Saldo Insuficiente", description: `No tienes suficiente crédito disponible (${availableCredit.toFixed(2)}€) para unirte a esta clase (${pricePerPerson.toFixed(2)}€).`, variant: "destructive", duration: 7000 });
                return;
            }
        }
        
        const { completed: isCompletedNow, size: completedSizeNow } = isSlotOverallConfirmed;
        const isUserAlreadyBookedInThisOption = (bookingsByGroupSize[optionSize] || []).some(p => p.userId === currentUser.id);

        if (userHasConfirmedActivityToday && !isAttemptingDesignatedGratisSpot) {
            toast({ title: 'Límite Diario Alcanzado', description: 'Ya tienes otra actividad confirmada para este día. Solo puedes unirte a plazas "Gratis" con puntos.', variant: 'destructive', duration: 7000 });
            return;
        }
        if (isCompletedNow && completedSizeNow !== optionSize && !isUserAlreadyBookedInThisOption && !isAttemptingDesignatedGratisSpot) { toast({ title: 'Clase Ya Confirmada', description: `Esta clase ya se ha confirmado para ${completedSizeNow}p.`, variant: 'destructive', duration: 7000 }); return; }
        
        setShowConfirmDialog(true);
        setGroupSizeToBook(optionSize);
        setSpotIndexToBook(spotIdx);
    }
    
    const { completed: isSlotEffectivelyFull, size: confirmedGroupSize } = isSlotOverallConfirmed;
    
    const gratisSpotDetails = useMemo(() => {
        if (!currentSlot?.designatedGratisSpotPlaceholderIndexForOption) return null;
        for (const [sizeStr, index] of Object.entries(currentSlot.designatedGratisSpotPlaceholderIndexForOption)) {
            if (index !== null && index !== undefined) {
                const size = parseInt(sizeStr, 10) as 1 | 2 | 3 | 4;
                const bookingInSpot = (bookingsByGroupSize[size] || []).find((_p, idx) => idx === index);
                if (!bookingInSpot) {
                    return { optionSize: size, spotIndex: index };
                }
            }
        }
        return null;
    }, [currentSlot, bookingsByGroupSize]);

    const showSpecialGratisButton = isSlotEffectivelyFull && !!gratisSpotDetails;
    
    const hasGratisSpotAvailable = currentSlot ? isSlotGratisAndAvailable(currentSlot) : false;

    const handleConfirmAsPrivate = async () => {
        if (!currentUser || !currentSlot || !privateClassSizeToConfirm) return;
        setIsProcessingPrivateAction(true);
        const result = await confirmClassAsPrivate(currentUser.id, currentSlot.id, privateClassSizeToConfirm);
        if ('error' in result) {
            toast({ title: "Error al Confirmar Privada", description: result.error, variant: "destructive" });
        } else {
            onBookingSuccess();
            toast({
                title: "¡Clase Confirmada como Privada!",
                description: (
                    <div>
                        <p>Se ha confirmado para {privateClassSizeToConfirm} persona{privateClassSizeToConfirm > 1 ? 's' : ''}.</p>
                        <p className="mt-2">Enlace para compartir: <br />
                            <Input type="text" readOnly value={result.shareLink} className="mt-1 text-xs h-8" />
                        </p>
                        <Button size="sm" className="mt-2 text-xs" onClick={() => { navigator.clipboard.writeText(result.shareLink); toast({description: "Enlace copiado"}); }}>Copiar Enlace</Button>
                    </div>
                ),
                duration: 15000, // Longer duration for link
                className: "bg-purple-600 text-white",
            });
        }
        setIsConfirmPrivateDialogOpen(false);
        setIsProcessingPrivateAction(false);
    };

    const handleJoinPrivateClass = async () => {
        if (!currentUser || !currentSlot || !shareCode || currentSlot.status !== 'confirmed_private') return;
        setIsProcessingPrivateAction(true);
        const result = await joinPrivateClass(currentUser.id, currentSlot.id, shareCode);
        if ('error'in result) {
            toast({ title: "Error al Unirse a Clase Privada", description: result.error, variant: "destructive" });
        } else {
            onBookingSuccess();
            toast({ title: "¡Te has unido a la Clase Privada!", description: `Se te ha cobrado ${result.organizerRefundAmount.toFixed(2)}€ y se ha reembolsado al organizador.`, className: "bg-primary text-primary-foreground"});
        }
        setIsProcessingPrivateAction(false);
    };

    const canConfirmAsPrivate = currentUser && (currentSlot.status as any) === 'forming' &&
        !userHasConfirmedActivityToday &&
        ((currentSlot.bookedPlayers || []).length === 0 ||
        (((currentSlot.bookedPlayers || []).length === 1 && (currentSlot.bookedPlayers || []).length === 1 && (currentSlot.bookedPlayers || [])[0].userId === currentUser.id)));

    const canJoinThisPrivateMatch = currentUser &&
        !userHasConfirmedActivityToday &&
        currentSlot.status === 'confirmed_private' &&
        shareCode === currentSlot.privateShareCode &&
        currentSlot.organizerId !== currentUser.id &&
        !(currentSlot.bookedPlayers || []).some(p => p.userId === currentUser.id) &&
        (currentSlot.bookedPlayers || []).length < (currentSlot.confirmedPrivateSize || 0);

    const priceForPrivateInvitee = currentSlot.status === 'confirmed_private' && currentSlot.totalPrice && currentSlot.confirmedPrivateSize
        ? currentSlot.totalPrice / currentSlot.confirmedPrivateSize
        : 0;


    const handleShareClass = async () => {
        if (!currentSlot) return;
        let shareUrl = ``;
        if (currentSlot.status === 'confirmed_private' && currentSlot.privateShareCode) {
            shareUrl = `${window.location.origin}/clases/${currentSlot.id}?code=${currentSlot.privateShareCode}`;
        } else {
            shareUrl = `${window.location.origin}/clases/${currentSlot.id}`;
        }

        try {
            await navigator.clipboard.writeText(shareUrl);
            toast({
                title: "¡Enlace Copiado!",
                description: "El enlace a la clase ha sido copiado a tu portapapeles.",
                className: "bg-primary text-primary-foreground",
            });
        } catch (err) {
            console.error("Error al copiar enlace: ", err);
            toast({
                title: "Error",
                description: "No se pudo copiar el enlace. Inténtalo manualmente.",
                variant: "destructive",
            });
        }
    };
    
    if (!currentSlot || !currentUser || !clubInfo || !instructor) {
        return <Card className="p-4"><Skeleton className="h-96 w-full" /></Card>;
    }
    
    const durationMinutes = currentSlot.endTime ? differenceInMinutes(new Date(currentSlot.endTime), new Date(currentSlot.startTime)) : 60;
    
    const actualPointsCostForDialog = groupSizeToBook ? calculatePricePerPerson(totalPrice, 1) : 0;
    const availableCreditForDialog = (currentUser.credit ?? 0) - (currentUser.blockedCredit ?? 0);

    const renderStarsDisplay = (rating: number) => {
        const fullStars = Math.round(rating);
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(<Star key={i} className={cn("h-4 w-4", i <= fullStars ? "fill-amber-500 text-amber-500" : "fill-gray-300 text-gray-400")} />);
        }
        return <div className="flex items-center">{stars} <span className="ml-1.5 text-sm text-gray-600 font-medium">({rating.toFixed(1)})</span></div>;
    };

    const CategoryIcon = currentSlot.category === 'chica' ? Venus : currentSlot.category === 'chico' ? Mars : Users2;
    
    const isSharedPrivateView = currentSlot.status === 'confirmed_private' && shareCode && shareCode === currentSlot.privateShareCode;

    const shadowEffect = clubInfo.cardShadowEffect;
    const shadowStyle = shadowEffect?.enabled && shadowEffect.color
      ? { boxShadow: `0 0 25px ${shadowEffect.color}${Math.round((shadowEffect.intensity ?? 0.5) * 255).toString(16).padStart(2, '0')}` } 
      : {};

    const privateClassBonusPoints = 10 + anticipationPoints;

    const confirmationDialogTitle = groupSizeToBook === 1
        ? '¡Confirmar Clase Privada!'
        : '¡Casi dentro!';
    
    const confirmationDialogDescription = groupSizeToBook === 1
        ? 'Pagas la clase entera ahora.\nTe daremos un enlace para compartir.\nCuando tus amigos se unan, te devolveremos su parte.'
        : `Vas a apuntarte a una clase de ${groupSizeToBook}.`;


    const badges = [
        { type: 'category', value: displayClassCategory(currentSlot.category), icon: CategoryIcon },
        { type: 'court', value: displayClassLevel(currentSlot.courtNumber ? `Pista ${currentSlot.courtNumber}` : 'Pista' as any), icon: Hash },
        { type: 'level', value: currentSlot.level === 'abierto' ? 'Nivel' : displayClassLevel(currentSlot.level as ClassPadelLevel), icon: BarChartHorizontal }
    ];

    return (
        <>
            <Card className={cn("flex flex-col h-full transition-shadow duration-300 rounded-lg overflow-hidden border", 'border-border')} style={shadowStyle}>
                <CardHeader className={cn("pt-3 pb-2 px-3 space-y-2")}> 
                    <div className="flex justify-between items-start">
                         <Link href={`/instructors/${currentSlot.instructorId}`} passHref className="group flex-grow">
                            <div className="flex items-center space-x-3">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={instructor?.profilePictureUrl || `https://avatar.vercel.sh/${currentSlot.instructorId || currentSlot.instructorName.replace(/\s+/g, '')}.png?size=60`} alt={currentSlot.instructorName} data-ai-hint="instructor avatar large"/>
                                    <AvatarFallback className="text-xl">{getInitials(currentSlot.instructorName)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-grow">
                                    <p className="font-semibold text-lg text-gray-800 -mb-0.5 group-hover:underline">{currentSlot.instructorName}</p>
                                    {renderStarsDisplay(instructorRating)}
                                </div>
                            </div>
                        </Link>
                         <div className="flex flex-col items-end gap-1">
                            <Button
                                variant="default"
                                className="relative h-auto py-1.5 px-3 rounded-full text-white bg-purple-600 hover:bg-purple-700 shadow-lg flex items-center space-x-1.5"
                                onClick={() => canConfirmAsPrivate && setIsConfirmPrivateDialogOpen(true)}
                                disabled={!canConfirmAsPrivate || userHasConfirmedActivityToday}
                            >
                                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-white/20 flex items-center justify-center border border-white/50">
                                    <Plus className="h-4 w-4 text-white"/>
                                </div>
                                <div className="flex flex-col items-start -space-y-1">
                                    <span className="text-[9px] font-normal">Reservar</span>
                                    <span className="text-sm font-bold">Privada</span>
                                </div>
                            </Button>
                        </div>
                    </div>
                     <div className="flex justify-between items-center border-t border-border pt-2">
                        <div className="flex items-start space-x-3">
                            <div className="flex flex-col items-center justify-center font-bold">
                                <span className="text-4xl leading-none -mb-1">{format(new Date(currentSlot.startTime), 'd')}</span>
                                <span className="text-[10px] uppercase leading-none">{format(new Date(currentSlot.startTime), 'MMM', { locale: es })}</span>
                            </div>
                            <div className="text-sm">
                                <p className="font-semibold text-foreground uppercase">{format(new Date(currentSlot.startTime), 'eeee HH:mm\'h\'', { locale: es })} - {format(new Date(currentSlot.endTime), 'HH:mm\'h\'', { locale: es })}</p>
                                <p className="text-xs text-muted-foreground flex items-center">
                                    <Clock className="mr-1 h-3 w-3" /> {durationMinutes} min
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" className="h-auto p-1 text-muted-foreground self-start" onClick={handleShareClass}>
                            <Share2 className="h-5 w-5" />
                        </Button>
                     </div>
                     <div className="flex justify-center items-center gap-1.5 pb-2">
                        {badges.map(item => (
                             <button key={item.type} onClick={() => handleInfoClick(item.type as any)} className="flex-1">
                                <Badge variant="outline" className="w-full justify-center text-xs py-1.5 rounded-full capitalize shadow-inner bg-slate-50 border-slate-200">
                                    <item.icon className="mr-1.5 h-3 w-3" />
                                    {item.value}
                                </Badge>
                             </button>
                         ))}
                    </div>
                </CardHeader>
                <CardContent className="flex-grow pt-2 pb-2 px-3 space-y-1 bg-white"> 
                    {([1, 2, 3, 4] as const).map(optionSize => {
                        const isUserBookedInThisOption = (bookingsByGroupSize[optionSize] || []).some(p => p.userId === currentUser.id);
                        
                        return (
                            <div key={optionSize} className={cn( 
                                "flex items-center justify-between p-1 rounded-md transition-all border border-transparent",
                                 (isSlotEffectivelyFull && confirmedGroupSize !== optionSize) && "opacity-50 pointer-events-none",
                                isUserBookedInThisOption && "bg-blue-50 border-blue-200"
                            )}>
                                 <div className="flex items-center gap-1.5 flex-grow-0 shrink-0 basis-auto justify-start"> 
                                    {Array.from({ length: optionSize }).map((_, index) =>
                                        <BookingSpotDisplay
                                            key={`${optionSize}-${index}`}
                                            optionSize={optionSize}
                                            spotIndex={index}
                                            bookingsByGroupSize={bookingsByGroupSize}
                                            currentUser={currentUser!}
                                            currentSlot={currentSlot}
                                            isPendingMap={isPendingMap}
                                            totalPrice={totalPrice}
                                            pointsCostForGratisSpot={calculatePricePerPerson(totalPrice, 1)} 
                                            isSlotOverallConfirmed={isSlotEffectivelyFull}
                                            confirmedGroupSize={confirmedGroupSize}
                                            userHasConfirmedActivityToday={userHasConfirmedActivityToday}
                                            isUserBookedInThisOption={isUserBookedInThisOption} 
                                            onOpenConfirmationDialog={openConfirmationDialog}
                                            showPointsBonus={showPointsBonus}
                                        />
                                    )}
                                </div>
                                <Button variant="outline" className="text-xs flex items-center h-8 px-3 rounded-full shadow-sm" onClick={() => handlePriceInfoClick(optionSize)}>
                                    <span className="font-bold text-sm">
                                        {calculatePricePerPerson(totalPrice, optionSize).toFixed(2)}
                                    </span>
                                    <span className="font-semibold text-xs ml-1 text-muted-foreground">€ p.p.</span>
                                </Button>
                            </div>
                        );
                    })}
                    <CourtAvailabilityIndicator
                        availableCourts={courtAvailability.available}
                        occupiedCourts={courtAvailability.occupied}
                        totalCourts={courtAvailability.total}
                    />
                </CardContent>
            </Card>

            <AlertDialog 
                open={showConfirmDialog && spotIndexToBook !== undefined} 
                onOpenChange={(isOpen) => {
                    if (!isOpen) {
                        if (groupSizeToBook !== null && spotIndexToBook !== undefined) {
                           const bookingKey = `${groupSizeToBook}-${spotIndexToBook}`;
                           setIsPendingMap(prev => ({ ...prev, [bookingKey]: false })); 
                        }
                        setShowConfirmDialog(false);
                        setSpotIndexToBook(undefined);
                    }
                }}
            >
                {currentSlot && currentUser && groupSizeToBook !==null && spotIndexToBook !== undefined && (
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-2xl font-bold flex items-center justify-center">
                                <Rocket className="h-8 w-8 mr-3 text-blue-500" /> {confirmationDialogTitle}
                            </AlertDialogTitle>
                        </AlertDialogHeader>
                        <AlertDialogDescription className="text-center text-lg text-foreground space-y-4 py-4">
                            <div className="space-y-1">
                                <p>{confirmationDialogDescription.split('\n')[0]}</p>
                                <p className="flex items-center justify-center text-3xl font-bold">
                                    { currentSlot.designatedGratisSpotPlaceholderIndexForOption?.[groupSizeToBook as (1|2|3|4)] === spotIndexToBook && !(bookingsByGroupSize[groupSizeToBook as (1|2|3|4)] || [])[spotIndexToBook]
                                        ? <> <Gift className="h-8 w-8 mr-2 text-yellow-500" /> {actualPointsCostForDialog} <span className="text-lg ml-1">puntos</span> </>
                                        : <> <Euro className="h-7 w-7 mr-1" /> {groupSizeToBook === 1 ? totalPrice.toFixed(2) : calculatePricePerPerson(totalPrice, groupSizeToBook as (1 | 2 | 3 | 4)).toFixed(2)} </>
                                    }
                                </p>
                            </div>
                            <div className="flex items-center justify-center gap-2 p-2 bg-slate-100 rounded-md">
                                <PiggyBank className="h-6 w-6 text-slate-500" />
                                <span className="text-sm">Tu hucha tiene:</span>
                                <span className="font-bold text-slate-800">{availableCreditForDialog.toFixed(2)}€</span>
                                <span className="text-slate-400">/</span>
                                <Star className="h-5 w-5 text-amber-500"/>
                                <span className="font-bold text-slate-800">{currentUser?.loyaltyPoints ?? 0}</span>
                            </div>
                        </AlertDialogDescription>
                        <div className="text-sm bg-blue-50 text-blue-800 p-3 rounded-lg space-y-2">
                             <p className="font-bold text-center">¡Recuerda las reglas del juego!</p>
                             <ul className="space-y-1.5">
                                 <li className="flex items-start"><ThumbsUp className="h-4 w-4 mr-2 mt-0.5 text-blue-500 flex-shrink-0" /><span>{groupSizeToBook === 1 ? 'La clase se confirma y la pista se asigna al instante.' : 'Si la clase se llena, ¡se confirma!'}</span></li>
                                 <li className="flex items-start"><Lock className="h-4 w-4 mr-2 mt-0.5 text-blue-500 flex-shrink-0" /><span>Una vez confirmada, tu plaza es definitiva.</span></li>
                                 <li className="flex items-start"><Scissors className="h-4 w-4 mr-2 mt-0.5 text-blue-500 flex-shrink-0" /><span>**Si esta clase se confirma**, tus otras inscripciones del día se anularán solas.</span></li>
                             </ul>
                         </div>
                        <AlertDialogFooter className="grid grid-cols-2 gap-2 mt-4">
                            <AlertDialogCancel className="h-12 text-base" disabled={isPendingMap[`${groupSizeToBook}-${spotIndexToBook}`]}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleBook}
                                disabled={
                                    isPendingMap[`${groupSizeToBook}-${spotIndexToBook}`] || 
                                    (currentSlot.designatedGratisSpotPlaceholderIndexForOption?.[groupSizeToBook as (1|2|3|4)] === spotIndexToBook && (currentUser?.loyaltyPoints ?? 0) < actualPointsCostForDialog) || 
                                    (!(currentSlot.designatedGratisSpotPlaceholderIndexForOption?.[groupSizeToBook as (1|2|3|4)] === spotIndexToBook) && availableCreditForDialog < (groupSizeToBook === 1 ? totalPrice : calculatePricePerPerson(totalPrice, groupSizeToBook as (1 | 2 | 3 | 4))))
                                }
                                className="h-12 text-base bg-green-600 text-white hover:bg-green-700" 
                            >
                                {isPendingMap[`${groupSizeToBook}-${spotIndexToBook}`] 
                                    ? <Loader2 className="h-6 w-6 animate-spin" /> 
                                    : (currentSlot.designatedGratisSpotPlaceholderIndexForOption?.[groupSizeToBook as (1|2|3|4)] === spotIndexToBook 
                                        ? `Sí, Usar Puntos` 
                                        : "Sí, ¡Me apunto!")}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                )}
            </AlertDialog>
            <AlertDialog open={isConfirmPrivateDialogOpen} onOpenChange={setIsConfirmPrivateDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Clase Privada</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-1">
                            <p>• Pagas la clase entera ahora.</p>
                            <p>• Te daremos un enlace para compartir.</p>
                            <p>• Cuando tus amigos se unan, te devolveremos su parte.</p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                        <Select
                            value={privateClassSizeToConfirm?.toString()}
                            onValueChange={(value) => setPrivateClassSizeToConfirm(parseInt(value) as 1 | 2 | 3 | 4)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Número de alumnos (incluyéndote)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">Clase Individual (1 alumno)</SelectItem>
                                <SelectItem value="2">Grupo Pequeño (2 alumnos)</SelectItem>
                                <SelectItem value="3">Grupo Mediano (3 alumnos)</SelectItem>
                                <SelectItem value="4">Grupo Completo (4 alumnos)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsConfirmPrivateDialogOpen(false)} disabled={isProcessingPrivateAction}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmAsPrivate} disabled={isProcessingPrivateAction || !privateClassSizeToConfirm}>
                            {isProcessingPrivateAction && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirmar y Pagar {totalPrice.toFixed(2)}€
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            {/* Info Dialog */}
            <InfoDialog
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

    