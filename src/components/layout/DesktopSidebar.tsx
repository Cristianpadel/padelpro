

"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn, getInitials } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { User, Club, TimeOfDayFilterType, MatchPadelLevel } from '@/types';
import { timeSlotFilterOptions } from '@/types';
import {
    Activity, Users, Gift, Clock, BarChartHorizontal, Heart,
    Briefcase, LogOut, Building, CalendarDays, Eye, ClipboardList, CheckCircle, LogIn, PartyPopper, ShoppingBag, Star, Sparkles, Plus, Calendar
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { countConfirmedLiberadasSpots, fetchMatchDayEventsForDate, getHasNewSpecialOfferNotification, countUserReservedProducts, countUserConfirmedActivitiesForDay } from '@/lib/mockData';
import { Badge } from '@/components/ui/badge';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { addDays } from 'date-fns';

interface DesktopSidebarProps {
    currentUser: User | null;
    clubInfo: Club | null;
    currentPage: 'clases' | 'partidas' | 'agenda' | 'other';
    showFilters?: boolean;
    onGratisClick?: () => void;
    showGratisNotification?: boolean;
    onTimeFilterClick?: () => void;
    onLevelFilterClick?: () => void;
    onFavoritesClick?: () => void;
    isFavoritesActive?: boolean;
    onProfessionalAccessClick: () => void;
    onLogoutClick: () => void;
    viewPreference?: 'normal' | 'myInscriptions' | 'myConfirmed';
    timeSlotFilter?: TimeOfDayFilterType;
    selectedLevel?: MatchPadelLevel | 'all';
    // confirmedBookingsCount is no longer needed as a prop, it will be handled internally
    unconfirmedInscriptionsCount?: number;
    showPointsBonus?: boolean;
    onTogglePointsBonus?: () => void;
}

const hexToRgba = (hex: string, alpha: number) => {
    let c: any;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        if (c.length == 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return `rgba(${[(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',')},${alpha})`;
    }
    return 'rgba(168,85,247,0.7)'; // Fallback color
};


const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
    currentUser, clubInfo, showFilters = false, onGratisClick, showGratisNotification,
    onTimeFilterClick, onLevelFilterClick, onFavoritesClick, isFavoritesActive,
    onProfessionalAccessClick, onLogoutClick,
    viewPreference = 'normal',
    timeSlotFilter = 'all',
    selectedLevel = 'all',
    unconfirmedInscriptionsCount = 0,
    showPointsBonus,
    onTogglePointsBonus,
}) => {
    const [liberadasCount, setLiberadasCount] = useState(0);
    const [reservedProductsCount, setReservedProductsCount] = useState(0);
    const [confirmedBookingsCount, setConfirmedBookingsCount] = useState(0);
    const [showSpecialOfferNotificationDot, setShowSpecialOfferNotificationDot] = useState(false);
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const [nextMatchDayEventId, setNextMatchDayEventId] = useState<string | null>(null);
    const [qrCodeUrl, setQrCodeUrl] = useState('');

    const view = searchParams.get('view');
    const currentPage = pathname.startsWith('/schedule') ? 'agenda'
                        : pathname.startsWith('/activities') && view === 'partidas' ? 'partidas'
                        : pathname.startsWith('/activities') ? 'clases'
                        : 'other';

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const currentUrl = window.location.origin;
            setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(currentUrl)}`);
        }
    }, []);
    
    useEffect(() => {
        if (!currentUser) return;
        const fetchConfirmedCount = async () => {
            const count = countUserConfirmedActivitiesForDay(currentUser.id, new Date());
            setConfirmedBookingsCount(count);
        };
        fetchConfirmedCount();
        const interval = setInterval(fetchConfirmedCount, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, [currentUser]);


    const handleViewPrefChange = (value: 'normal' | 'myInscriptions' | 'myConfirmed') => {
        const newSearchParams = new URLSearchParams(searchParams.toString());
        if (value === 'normal') {
            newSearchParams.delete('viewPref');
        } else {
            newSearchParams.set('viewPref', value);
        }
        router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
    };
    
    const handleTimeFilterChange = (value: TimeOfDayFilterType) => {
        const newSearchParams = new URLSearchParams(searchParams.toString());
        if (value === 'all') {
            newSearchParams.delete('time');
        } else {
            newSearchParams.set('time', value);
        }
        router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
    };
    
    const handleLevelFilterChange = (value: MatchPadelLevel | 'all') => {
        const newSearchParams = new URLSearchParams(searchParams.toString());
        if (value === 'all') {
            newSearchParams.delete('level');
        } else {
            newSearchParams.set('level', value);
        }
        router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
    };


    useEffect(() => {
        const updateCounts = () => {
            const counts = countConfirmedLiberadasSpots(clubInfo?.id);
            setLiberadasCount(counts.classes + counts.matches);
        };
        updateCounts();
        const interval = setInterval(updateCounts, 5000); // Check every 5 seconds
        return () => clearInterval(interval);
    }, [clubInfo?.id]);

    useEffect(() => {
        const updateProductReservations = async () => {
            if (currentUser) {
                const count = await countUserReservedProducts(currentUser.id);
                setReservedProductsCount(count);
            } else {
                setReservedProductsCount(0);
            }
        };
        updateProductReservations();
        const interval = setInterval(updateProductReservations, 5000); // Poll for changes

        // This event could be triggered from other components after a reservation is made
        const handleReservationChange = () => updateProductReservations();
        window.addEventListener('productReservationChanged', handleReservationChange);

        return () => {
            clearInterval(interval);
            window.removeEventListener('productReservationChanged', handleReservationChange);
        };
    }, [currentUser]);


    useEffect(() => {
        const findEvent = async () => {
            if (!clubInfo) {
                setNextMatchDayEventId(null);
                return;
            }
            for (let i = 0; i < 14; i++) { // check next 2 weeks
                const events = await fetchMatchDayEventsForDate(addDays(new Date(), i), clubInfo.id);
                if (events && events.length > 0) {
                    setNextMatchDayEventId(events[0].id);
                    return;
                }
            }
            setNextMatchDayEventId(null); // No event found
        };
        findEvent();
    }, [clubInfo]);


    const shadowEffect = clubInfo?.cardShadowEffect;
    const shadowStyle = shadowEffect?.enabled 
      ? { boxShadow: `0 0 35px ${hexToRgba(shadowEffect.color, shadowEffect.intensity)}` }
      : {};


    if (!currentUser) {
        return (
            <Card className="p-4 flex flex-col gap-4 sticky top-6 h-fit w-72" style={shadowStyle}>
                {clubInfo && (
                    <Link href="/" className="flex flex-col items-center text-center gap-2 hover:opacity-90 transition-opacity">
                        <Avatar className="h-24 w-24 rounded-md">
                            <AvatarImage src={clubInfo.logoUrl} alt={clubInfo.name} data-ai-hint="club logo" />
                            <AvatarFallback className="rounded-md bg-muted">
                                <Building className="h-12 w-12" />
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="font-bold text-xl">{clubInfo.name}</h2>
                            <p className="text-sm text-muted-foreground">{clubInfo.location}</p>
                        </div>
                    </Link>
                )}
                 <div className="p-4 text-center rounded-full">
                     <p className="text-sm font-semibold">¡Bienvenido!</p>
                     <p className="text-xs text-muted-foreground mt-1">Inicia sesión para empezar a reservar.</p>
                 </div>
                 <Link href="/auth/login-alumno" passHref>
                    <Button variant="default" className="w-full justify-center text-base h-12 rounded-full">
                        <LogIn className="mr-3 h-5 w-5" /> Acceder / Registrarse
                    </Button>
                 </Link>
                 <Button variant="outline" className="w-full justify-center text-base h-12 rounded-full" onClick={onProfessionalAccessClick}>
                    <Briefcase className="mr-3 h-4 w-4" /> Acceso Profesional
                </Button>
            </Card>
        );
    }

    const filterParam = searchParams.get('filter');
    const isLevelFilterActive = selectedLevel !== 'all';
    const levelFilterLabel = selectedLevel === 'all' ? 'Todos' : selectedLevel === 'abierto' ? 'Nivel Abierto' : `Nivel ${selectedLevel}`;


    return (
        <Card className="p-4 flex flex-col gap-4 sticky top-6 h-fit w-72" style={shadowStyle}>
            {clubInfo && (
                <Link href="/" className="flex flex-col items-center text-center gap-2 hover:opacity-90 transition-opacity">
                    <Avatar className="h-24 w-24 rounded-md">
                         <AvatarImage src={clubInfo.logoUrl} alt={clubInfo.name} data-ai-hint="club logo" />
                         <AvatarFallback className="rounded-md bg-muted">
                             <Building className="h-12 w-12" />
                         </AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="font-bold text-xl">{clubInfo.name}</h2>
                        <p className="text-sm text-muted-foreground">{clubInfo.location}</p>
                    </div>
                </Link>
            )}

            <div className="p-1 space-y-2">
                <Link href="/schedule" className="w-full">
                    <Button variant={currentPage === 'agenda' ? "secondary" : "ghost"} className={cn("w-full justify-start text-base h-12 items-center py-2 px-3 relative rounded-full", currentPage === 'agenda' && "scale-105 shadow-md font-bold")}>
                        <Avatar className="h-8 w-8 mr-3">
                            <AvatarImage src={currentUser.profilePictureUrl} alt={currentUser.name || 'avatar'} data-ai-hint="user profile small"/>
                            <AvatarFallback>{getInitials(currentUser.name || '')}</AvatarFallback>
                        </Avatar>
                        <span className="font-semibold flex-grow text-left">Agenda</span>
                         {currentUser?.loyaltyPoints !== undefined && (
                            <div className="flex items-center justify-center bg-amber-400 text-white rounded-full px-2 py-0.5 text-xs font-bold shadow-md border-2 border-background ml-2">
                                {Math.round(currentUser.loyaltyPoints)}
                            </div>
                        )}
                         {confirmedBookingsCount > 0 && (
                            <Badge variant="destructive" className="ml-2">
                                {confirmedBookingsCount}
                            </Badge>
                        )}
                    </Button>
                </Link>
                <Link href="/activities?view=clases" className="w-full">
                    <Button variant={currentPage === 'clases' && filterParam !== 'liberadas' ? "secondary" : "ghost"} className={cn("w-full justify-start text-base h-12 rounded-full", currentPage === 'clases' && filterParam !== 'liberadas' && "scale-105 shadow-md font-bold")}>
                        <Activity className="mr-3 h-5 w-5" /> Clases
                    </Button>
                </Link>
                 <Link href="/activities?view=partidas" className="w-full">
                    <Button variant={currentPage === 'partidas' && filterParam !== 'liberadas' ? "secondary" : "ghost"} className={cn("w-full justify-start text-base h-12 rounded-full", currentPage === 'partidas' && filterParam !== 'liberadas' && "scale-105 shadow-md font-bold")}>
                        <Users className="mr-3 h-5 w-5" /> Partidas
                    </Button>
                </Link>
                {clubInfo?.isMatchDayEnabled && (
                    <Link href={`/match-day`} className="w-full">
                        <Button variant={pathname.startsWith('/match-day') ? "secondary" : "ghost"} className={cn("w-full justify-start text-base h-12 rounded-full", pathname.startsWith('/match-day') && "scale-105 shadow-md font-bold")}>
                            <PartyPopper className="mr-3 h-5 w-5 text-amber-500" /> Match-Day
                        </Button>
                    </Link>
                )}
                <Link href="/reservar" className="w-full">
                     <Button variant={pathname === '/reservar' ? "secondary" : "ghost"} className={cn("w-full justify-start text-base h-12 relative rounded-full", pathname === '/reservar' && "scale-105 shadow-md font-bold")}>
                         <Star className="mr-3 h-5 w-5 text-amber-500" />
                         Reservar con Puntos
                         {liberadasCount > 0 && (
                            <Badge variant="destructive" className="ml-auto animate-pulse">
                                {liberadasCount}
                            </Badge>
                         )}
                     </Button>
                 </Link>
                 {onTogglePointsBonus && (
                    <Button variant={showPointsBonus ? "secondary" : "ghost"} className={cn("w-full justify-start text-base h-12 rounded-full", showPointsBonus && "scale-105 shadow-md font-bold")} onClick={onTogglePointsBonus}>
                        <Sparkles className="mr-3 h-5 w-5 text-amber-500" /> Ver Puntos
                    </Button>
                 )}
                 <Link href="/shop" className="w-full">
                    <Button variant={pathname === '/shop' ? "secondary" : "ghost"} className={cn("w-full justify-start text-base h-12 rounded-full", pathname === '/shop' && "scale-105 shadow-md font-bold")}>
                        <ShoppingBag className="mr-3 h-5 w-5" />
                        Tienda
                        {reservedProductsCount > 0 && (
                            <Badge variant="destructive" className="ml-auto">
                                {reservedProductsCount}
                            </Badge>
                        )}
                    </Button>
                </Link>
            </div>
            
            {showFilters && (
                <>
                    <div className="space-y-1 p-1">
                        {timeSlotFilterOptions.map(opt => (
                            <Button 
                                key={opt.value}
                                variant={timeSlotFilter === opt.value ? "secondary" : "ghost"}
                                className={cn("w-full justify-start text-base h-12 rounded-full", timeSlotFilter === opt.value && "scale-105 shadow-md font-bold")}
                                onClick={() => handleTimeFilterChange(opt.value)}
                            >
                                <Clock className="mr-3 h-5 w-5" /> {opt.label}
                            </Button>
                        ))}
                         <Button variant={isLevelFilterActive ? "secondary" : "ghost"} className={cn("w-full justify-start text-base h-12 rounded-full", isLevelFilterActive && "scale-105 shadow-md font-bold")} onClick={onLevelFilterClick}>
                            <BarChartHorizontal className="mr-3 h-5 w-5" /> {levelFilterLabel}
                        </Button>
                        <div className="space-y-1 p-1">
                             <Button variant={viewPreference === 'normal' ? "secondary" : "ghost"} className={cn("w-full justify-start h-11 rounded-full", viewPreference === 'normal' && "scale-105 shadow-md font-bold")} onClick={() => handleViewPrefChange('normal')}>
                                <Eye className="mr-3 h-5 w-5" /> Disponibles
                            </Button>
                            <Button
                                variant={viewPreference === 'myInscriptions' ? 'secondary' : 'ghost'}
                                className={cn('w-full justify-start h-11 relative rounded-full', viewPreference === 'myInscriptions' && 'scale-105 shadow-md font-bold')}
                                onClick={() => handleViewPrefChange('myInscriptions')}
                            >
                                <ClipboardList className="mr-3 h-5 w-5" />
                                <span className="flex-grow text-left">Mis Inscripciones</span>
                                {unconfirmedInscriptionsCount > 0 && (
                                    <Badge className="ml-auto bg-blue-500 text-white">
                                        {unconfirmedInscriptionsCount}
                                    </Badge>
                                )}
                            </Button>
                            <Button
                                variant={viewPreference === 'myConfirmed' ? 'secondary' : 'ghost'}
                                className={cn('w-full justify-start h-11 relative rounded-full', viewPreference === 'myConfirmed' && 'scale-105 shadow-md font-bold')}
                                onClick={() => handleViewPrefChange('myConfirmed')}
                            >
                                <CheckCircle className="mr-3 h-5 w-5" />
                                <span className="flex-grow text-left">Mis Reservas</span>
                                {confirmedBookingsCount > 0 && (
                                    <Badge variant="destructive" className="ml-auto">
                                        {confirmedBookingsCount}
                                    </Badge>
                                )}
                            </Button>
                        </div>
                        <Button 
                            variant={isFavoritesActive ? "secondary" : "ghost"} 
                            className={cn("w-full justify-start text-base h-12 rounded-full", isFavoritesActive && "scale-105 shadow-md font-bold")} 
                            onClick={onFavoritesClick}
                        >
                            <Heart className={cn("mr-3 h-4 w-4", isFavoritesActive && "fill-current text-destructive")} /> Favoritos
                        </Button>
                    </div>
                </>
            )}

            <div className="space-y-1 mt-auto">
                 <Button variant="outline" className="w-full justify-start text-base h-12 rounded-full" onClick={onProfessionalAccessClick}>
                    <Briefcase className="mr-3 h-4 w-4" /> Acceso Profesional
                </Button>
                <Button variant="outline" className="w-full justify-start text-base h-12 rounded-full" onClick={onLogoutClick}>
                    <LogOut className="mr-3 h-4 w-4" /> Salir
                </Button>
            </div>
            
            {qrCodeUrl && (
                <div className="mt-4 pt-4 border-t border-border/10 flex flex-col items-center gap-2">
                    <p className="text-xs text-muted-foreground text-center">Escanea para abrir en el móvil</p>
                    <Image
                        src={qrCodeUrl}
                        alt="QR Code"
                        width={128}
                        height={128}
                        className="rounded-md border p-1 bg-white"
                    />
                </div>
            )}
        </Card>
    );
};

export default DesktopSidebar;
