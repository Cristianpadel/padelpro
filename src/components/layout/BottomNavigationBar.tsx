
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Activity, Users, User as UserIconLucideProfile, ClipboardList, PartyPopper, ShoppingBag, SlidersHorizontal, Star, Trophy } from 'lucide-react';
import {
    getMockCurrentUser,
    getMockClubs,
    getHasNewGratisSpotNotification,
    setHasNewGratisSpotNotificationState,
    getMockUserBookings,
    getMockTimeSlots,
    isSlotEffectivelyCompleted,
    getMockUserMatchBookings,
    getMockMatches,
    countConfirmedLiberadasSpots,
    fetchMatchDayEventsForDate,
    countUserReservedProducts,
} from '@/lib/mockData';
import type { User, Club } from '@/types';
import { Badge } from '@/components/ui/badge';
import { addDays } from 'date-fns';

export function BottomNavigationBar() {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isClient, setIsClient] = useState(false);
    const [currentUser, setCurrentUserLocal] = useState<User | null>(null);
    
    const [clubInfo, setClubInfo] = useState<Club | null>(null);
    const [currentDisplayClubId, setCurrentDisplayClubId] = useState<string | null>(null);
    
    const [reservedProductsCount, setReservedProductsCount] = useState(0);
    const [showGratisNotificationDot, setShowGratisNotificationDot] = useState(false);
    const [confirmedBookingsCount, setConfirmedBookingsCount] = useState<number>(0);
    const [nextMatchDayEventId, setNextMatchDayEventId] = useState<string | null>(null);

    useEffect(() => {
        setIsClient(true);
        const fetchUser = async () => {
            const user = await getMockCurrentUser();
            setCurrentUserLocal(user);
        };
        fetchUser();
    }, []);

    useEffect(() => {
        if (!isClient) return;

        const clubIdFromParams = searchParams.get('clubId');
        let activeClubId = clubIdFromParams;

        if (!activeClubId && typeof window !== 'undefined') {
            activeClubId = localStorage.getItem('activeAdminClubId');
        }
        
        const clubs = getMockClubs();
        if (!activeClubId && clubs && clubs.length > 0) {
            activeClubId = clubs[0].id;
        }
        setCurrentDisplayClubId(activeClubId);

    }, [searchParams, isClient]);

    const calculateTotalConfirmedBookings = useCallback(async (userId: string | undefined) => {
        if (!isClient || !userId) {
            setConfirmedBookingsCount(0);
            return;
        }
        let count = 0;
        const now = new Date();
        const userClassBookingsData = await getMockUserBookings(userId);
        const allTimeSlots = await getMockTimeSlots();
        userClassBookingsData.forEach(booking => {
            const slot = allTimeSlots.find(s => s.id === booking.activityId && booking.activityType === 'class');
            if (slot && new Date(slot.startTime) > now && isSlotEffectivelyCompleted(slot).completed) {
                count++;
            }
        });
        const userMatchBookingsDataAll = await getMockUserMatchBookings(userId);
        const allMatches = await getMockMatches();
        userMatchBookingsDataAll.forEach(booking => {
            const match = allMatches.find(m => m.id === booking.activityId);
            if (match && new Date(match.startTime) > now && (match.bookedPlayers || []).length === 4) {
                count++;
            }
        });
        setConfirmedBookingsCount(count);
    }, [isClient]);

    useEffect(() => {
        if (isClient && currentUser) {
            const updateConfirmedBookings = () => calculateTotalConfirmedBookings(currentUser.id);
            updateConfirmedBookings(); // Initial call
            const intervalId = setInterval(updateConfirmedBookings, 3000); // Update every 3 seconds
            return () => clearInterval(intervalId);
        } else if (isClient && !currentUser) {
            setConfirmedBookingsCount(0);
        }
    }, [isClient, currentUser, calculateTotalConfirmedBookings]);


    const updateCountsAndNotifications = useCallback(async () => {
        if (currentUser) {
            const count = await countUserReservedProducts(currentUser.id);
            setReservedProductsCount(count);
        }
        setShowGratisNotificationDot(getHasNewGratisSpotNotification());
    }, [currentUser]);


    useEffect(() => {
        if (!isClient) return;
        
        const clubs = getMockClubs();
        let currentClub: Club | undefined | null = null;
        if (currentDisplayClubId) {
            currentClub = clubs.find(c => c.id === currentDisplayClubId);
        } else if (clubs.length > 0) {
            currentClub = clubs[0];
        }
        
        setClubInfo(currentClub);

        updateCountsAndNotifications();
        const intervalId = setInterval(updateCountsAndNotifications, 5000);
        
        const handleReservationChange = () => updateCountsAndNotifications();
        window.addEventListener('productReservationChanged', handleReservationChange);
        window.addEventListener('gratisSpotsUpdated', updateCountsAndNotifications);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener('productReservationChanged', handleReservationChange);
            window.removeEventListener('gratisSpotsUpdated', updateCountsAndNotifications);
        };

    }, [currentDisplayClubId, isClient, updateCountsAndNotifications]);
    
    useEffect(() => {
        const findEvent = async () => {
            if (!clubInfo) {
                setNextMatchDayEventId(null);
                return;
            }
            for (let i = 0; i < 14; i++) { // check next 2 weeks
                const events = await fetchMatchDayEventsForDate(addDays(new Date(), i), clubInfo.id);
                if (events && events.length > 0) {
                    setNextMatchDayEventId(events[0].id); // Get the first event for the notification link
                    return;
                }
            }
            setNextMatchDayEventId(null); // No event found
        };
        findEvent();
    }, [clubInfo]);


    useEffect(() => {
        const queryFilter = searchParams.get('filter');
        if (isClient && pathname === '/activities' && queryFilter === 'liberadas' && getHasNewGratisSpotNotification()) {
            setHasNewGratisSpotNotificationState(false);
            setShowGratisNotificationDot(false);
        }
    }, [isClient, pathname, searchParams]);


    const handleFiltersClick = () => {
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.set('show_filters', 'true');
        router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
    };
    
    const navItems = [
        {
            key: 'inicio',
            href: '/',
            icon: Home,
            label: 'Inicio',
            isActive: pathname === '/',
            hidden: !!currentUser,
        },
        {
            key: 'agenda',
            href: '/dashboard',
            icon: ClipboardList,
            label: 'Agenda',
            isActive: pathname === '/dashboard' || pathname === '/schedule',
            hidden: !currentUser,
            badgeCount: confirmedBookingsCount,
        },
        {
            key: 'clases',
            href: '/activities?view=clases',
            icon: Activity,
            label: 'Clases',
            isActive: pathname === '/activities' && searchParams.get('view') === 'clases',
            hidden: !currentUser || !(clubInfo?.showClassesTabOnFrontend ?? true),
        },
        {
            key: 'partidas',
            href: '/activities?view=partidas',
            icon: Users,
            label: 'Partidas',
            isActive: pathname === '/activities' && searchParams.get('view') === 'partidas',
            hidden: !currentUser || !(clubInfo?.showMatchesTabOnFrontend ?? true),
        },
        {
            key: 'matchpro',
            href: '/activities?view=matchpro',
            icon: Trophy,
            label: 'Match Pro',
            isActive: pathname === '/activities' && searchParams.get('view') === 'matchpro',
            hidden: !currentUser,
        },
         {
            key: 'liberadas',
            href: '/activities?filter=liberadas',
            icon: Star,
            label: 'Liberadas',
            isActive: pathname === '/activities' && searchParams.get('filter') === 'liberadas',
            hidden: !currentUser,
            showNotificationDot: showGratisNotificationDot,
        },
        {
            key: 'match-day',
            href: nextMatchDayEventId ? `/match-day/${nextMatchDayEventId}` : '/match-day',
            icon: PartyPopper,
            label: 'Match-Day',
            isActive: pathname.startsWith('/match-day'),
            hidden: !currentUser || !clubInfo?.isMatchDayEnabled,
        },
        {
            key: 'tienda',
            href: '/store',
            icon: ShoppingBag,
            label: 'Tienda',
            isActive: pathname === '/store',
            badgeCount: reservedProductsCount,
            hidden: !currentUser,
        },
        {
            key: 'profile',
            href: '/profile',
            icon: UserIconLucideProfile,
            label: 'Perfil',
            isActive: pathname === '/profile',
            hidden: !currentUser,
        },
    ];

    const visibleNavItems = navItems.filter(item => !item.hidden);
    const visibleNavItemsCount = visibleNavItems.length;
    const itemWidthClass = visibleNavItemsCount > 0 ? `w-1/${visibleNavItemsCount}` : 'w-full';

     if (!isClient) {
        return <div className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t" />;
    }

    if (pathname.startsWith('/auth') || pathname === '/') {
        return null; // Don't show on auth pages
    }


    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-30 md:hidden">
            <div className="w-full px-1 h-16 flex justify-around items-center">
                {visibleNavItems.map(item => {
                    const IconComponent = item.icon;
                    const buttonContent = (
                        <>
                            <div className="relative">
                                <IconComponent className={cn("h-5 w-5 mb-0.5", item.isActive && "text-primary")} />
                                {item.badgeCount !== undefined && item.badgeCount > 0 && (
                                    <Badge variant="destructive" className="absolute -top-1.5 -right-2.5 px-1.5 py-0 text-[9px] h-4 min-w-[16px] flex items-center justify-center rounded-full">
                                        {item.badgeCount}
                                    </Badge>
                                )}
                                {'showNotificationDot' in item && item.showNotificationDot && (
                                     <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                    </span>
                                )}
                            </div>
                            <span className={cn("text-xs", item.isActive ? "text-primary" : "text-muted-foreground")}>{item.label}</span>
                        </>
                    );

                    const className = cn(
                        "flex flex-col items-center justify-center font-medium p-1 rounded-lg h-full transition-transform duration-200 ease-in-out",
                        itemWidthClass,
                        item.isActive && 'scale-110'
                    );

                    if ('href' in item && item.href) {
                        return (
                            <Link key={item.key} href={item.href} scroll={false} className={className}>
                                {buttonContent}
                            </Link>
                        );
                    }
                    return (
                        <button
                            key={item.key}
                            onClick={(item as any).onClick}
                            className={className}
                            aria-pressed={item.isActive}
                        >
                            {buttonContent}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}

    