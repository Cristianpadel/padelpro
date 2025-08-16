

"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn, getInitials } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { User, Club, TimeOfDayFilterType, MatchPadelLevel, ActivityViewType, ViewPreference } from '@/types';
import { timeSlotFilterOptions } from '@/types';
import {
    Activity, Users, Gift, Clock, BarChartHorizontal, Heart,
    Briefcase, LogOut, Building, CalendarDays, Eye, ClipboardList, CheckCircle, LogIn, PartyPopper, ShoppingBag, Star, Sparkles, Plus, Calendar, User as UserIcon, Wallet, Trophy, SlidersHorizontal
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { usePathname } from 'next/navigation';
import { Separator } from '../ui/separator';
import LevelFilterDialog from '../classfinder/LevelFilterDialog';
import TimeOfDayFilterDialog from '../classfinder/TimeOfDayFilterDialog';
import ViewOptionsDialog from '@/components/classfinder/ViewOptionsDialog';
import ManageFavoriteInstructorsDialog from '@/components/schedule/ManageFavoriteInstructorsDialog';

interface DesktopSidebarProps {
    currentUser: User | null;
    clubInfo: Club | null;
    onProfessionalAccessClick: () => void;
    onLogoutClick: () => void;
    onMobileFiltersClick: () => void; // New prop for mobile
    // Filter props
    isActivitiesPage: boolean;
    activeView: ActivityViewType;
    timeSlotFilter: TimeOfDayFilterType;
    selectedLevel: MatchPadelLevel | 'all';
    viewPreference: ViewPreference;
    filterByFavorites: boolean;
    showPointsBonus: boolean;
    handleTimeFilterChange: (value: TimeOfDayFilterType) => void;
    handleLevelChange: (value: MatchPadelLevel | 'all') => void;
    handleViewPrefChange: (pref: ViewPreference, type: ActivityViewType) => void;
    handleTogglePointsBonus: () => void;
    handleApplyFavorites: (ids: string[]) => void;
    updateUrlFilter: (key: string, value: string | boolean | null) => void;
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
    currentUser, clubInfo, onProfessionalAccessClick, onLogoutClick, onMobileFiltersClick,
    isActivitiesPage, activeView, timeSlotFilter, selectedLevel, viewPreference,
    filterByFavorites, showPointsBonus, handleTimeFilterChange, handleLevelChange,
    handleViewPrefChange, handleTogglePointsBonus, handleApplyFavorites, updateUrlFilter
}) => {
    const pathname = usePathname();
    const [isManageFavoritesOpen, setIsManageFavoritesOpen] = useState(false);
    const [isLevelFilterOpen, setIsLevelFilterOpen] = useState(false);
    const [isTimeFilterOpen, setIsTimeFilterOpen] = useState(false);
    const [isViewOptionsOpen, setIsViewOptionsOpen] = useState(false);
    

    const levelFilterLabel = selectedLevel === 'all' ? 'Niveles' : selectedLevel === 'abierto' ? 'Nivel Abierto' : `${selectedLevel}`;
    const timeFilterLabel = timeSlotFilter === 'all'
        ? 'Horarios'
        : timeSlotFilterOptions.find(o => o.value === timeSlotFilter)?.label.replace(/ \([^)]+\)/, '') || 'Horarios';

    const viewPreferenceLabel = useMemo(() => {
        switch (viewPreference) {
            case 'myInscriptions': return 'Mis Inscripciones';
            case 'myConfirmed': return 'Mis Reservas';
            case 'withPlayers': return 'En Juego';
            case 'completed': return 'Completas';
            default: return 'Ocupación';
        }
    }, [viewPreference]);

    const handleFavoritesClick = () => {
        if (filterByFavorites) {
            updateUrlFilter('favorites', false);
        } else {
            setIsManageFavoritesOpen(true);
        }
    };

    const isMatchProEnabled = clubInfo?.isMatchProEnabled ?? false;
    const navItemCount = 3 + (isMatchProEnabled ? 1 : 0) + (clubInfo?.isMatchDayEnabled ? 1 : 0) + 1; // Base + Pro + MD + Store
    const navGridClass = `grid-cols-${navItemCount}`;


    const renderLoginPrompt = () => (
      <aside className="hidden md:block w-72 p-4">
        <Card className="p-4 flex flex-col gap-4 sticky top-6 h-fit w-full rounded-2xl">
            {clubInfo && (
                <Link href="/" className="flex flex-col items-center text-center gap-2 hover:opacity-90 transition-opacity">
                    <Avatar className="h-24 w-24 rounded-md">
                        <AvatarImage src={clubInfo.logoUrl} alt={clubInfo.name} data-ai-hint="club logo" />
                        <AvatarFallback className="rounded-md bg-muted"><Building className="h-12 w-12" /></AvatarFallback>
                    </Avatar>
                    <div><h2 className="font-bold text-xl">{clubInfo.name}</h2><p className="text-sm text-muted-foreground">{clubInfo.location}</p></div>
                </Link>
            )}
            <div className="p-4 text-center rounded-full"><p className="text-sm font-semibold">¡Bienvenido!</p><p className="text-xs text-muted-foreground mt-1">Inicia sesión para empezar a reservar.</p></div>
            <Link href="/auth/login" passHref><Button variant="default" className="w-full justify-center text-base h-12 rounded-full"><LogIn className="mr-3 h-5 w-5" /> Acceder / Registrarse</Button></Link>
            <Button variant="outline" className="w-full justify-center text-base h-12 rounded-full" onClick={onProfessionalAccessClick}><Briefcase className="mr-3 h-4 w-4" /> Acceso Profesional</Button>
        </Card>
      </aside>
    );

    if (!currentUser || !clubInfo) {
        return renderLoginPrompt();
    }
    
    const shadowEffect = clubInfo?.cardShadowEffect;
    const shadowStyle = shadowEffect?.enabled && shadowEffect.color
      ? { boxShadow: `0 0 35px ${hexToRgba(shadowEffect.color, shadowEffect.intensity)}` }
      : {};
      
    const navButtonShadowStyle = shadowEffect?.enabled && shadowEffect.color
      ? { boxShadow: `0 4px 15px -2px ${hexToRgba(shadowEffect.color, shadowEffect.intensity * 0.5)}` }
      : {};

    const inactiveFilterShadowStyle = shadowEffect?.enabled && shadowEffect.color
      ? { boxShadow: `inset 0 2px 8px 0 ${hexToRgba(shadowEffect.color, shadowEffect.intensity * 0.35)}` }
      : { boxShadow: `inset 0 2px 8px 0 rgba(0, 0, 0, 0.08)` };

    const activeFilterClasses = "font-semibold bg-white text-primary border-primary border-2 shadow-sm";

    return (
        <>
            <aside className="hidden md:flex md:flex-col md:w-72 md:p-4">
                <div className="p-4 flex flex-col gap-4 sticky top-6 h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] rounded-2xl bg-card border shadow-lg overflow-y-auto">
                     <div className="flex flex-col items-center text-center gap-2">
                            <Avatar className="h-20 w-20 rounded-md">
                                <AvatarImage src={clubInfo.logoUrl} alt={clubInfo.name} data-ai-hint="club logo" />
                                <AvatarFallback className="rounded-md bg-muted"><Building className="h-10 w-10" /></AvatarFallback>
                            </Avatar>
                            <div><h2 className="font-bold text-lg">{clubInfo.name}</h2><p className="text-xs text-muted-foreground">{clubInfo.location}</p></div>
                        </div>
                    
                    <Separator />
                    
                    <Link href="/profile" className="w-full text-left p-2 rounded-lg hover:bg-muted transition-colors">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12"><AvatarImage src={currentUser.profilePictureUrl} alt={currentUser.name} data-ai-hint="user profile picture" /><AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback></Avatar>
                            <div className="flex-grow"><p className="font-semibold text-base">{currentUser.name}</p><div className="flex items-center gap-2 text-xs text-muted-foreground"><div className="flex items-center"><Wallet className="h-3 w-3 mr-1"/> {(currentUser.credit ?? 0).toFixed(2)}€</div><div className="flex items-center"><Star className="h-3 w-3 mr-1"/> {currentUser.loyaltyPoints ?? 0} Pts</div></div></div>
                        </div>
                    </Link>

                    <Separator />

                    <div className="p-1 space-y-3">
                        <Link href="/dashboard" className="w-full"><Button variant={pathname.startsWith('/dashboard') || pathname.startsWith('/schedule') ? "default" : "outline"} className="w-full justify-start text-base h-12 rounded-md" style={navButtonShadowStyle}><ClipboardList className="mr-3 h-5 w-5" /> Agenda</Button></Link>
                        <Link href="/activities?view=clases" className="w-full"><Button variant={isActivitiesPage && activeView === 'clases' ? "default" : "outline"} className="w-full justify-start text-base h-12 rounded-md" style={navButtonShadowStyle}><Activity className="mr-3 h-5 w-5" /> Clases</Button></Link>
                        {isMatchProEnabled && (<Link href="/activities?view=matchpro" className="w-full"><Button variant={isActivitiesPage && activeView === 'matchpro' ? "default" : "outline"} className="w-full justify-start text-base h-12 rounded-md" style={navButtonShadowStyle}><Trophy className="mr-3 h-5 w-5" /> Matchpro</Button></Link>)}
                        <Link href="/activities?view=partidas" className="w-full"><Button variant={isActivitiesPage && activeView === 'partidas' ? "default" : "outline"} className="w-full justify-start text-base h-12 rounded-md" style={navButtonShadowStyle}><Users className="mr-3 h-5 w-5" /> Partidas</Button></Link>
                        {clubInfo?.isMatchDayEnabled && (<Link href="/match-day" className="w-full"><Button variant={pathname.startsWith('/match-day') ? "default" : "outline"} className="w-full justify-start text-base h-12 rounded-md" style={navButtonShadowStyle}><PartyPopper className="mr-3 h-5 w-5" /> Match-Day</Button></Link>)}
                        <Link href="/store" className="w-full"><Button variant={pathname.startsWith('/store') ? "default" : "outline"} className="w-full justify-start text-base h-12 rounded-md" style={navButtonShadowStyle}><ShoppingBag className="mr-3 h-5 w-5" /> Tienda</Button></Link>
                    </div>
                    
                    {isActivitiesPage && (
                        <>
                            <Separator />
                            <div className="space-y-1 p-1">
                                <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase">Filtros</h3>
                                <Button variant="ghost" style={timeSlotFilter === 'all' ? inactiveFilterShadowStyle : {}} className={cn("w-full justify-start text-sm h-10 rounded-full", timeSlotFilter !== 'all' && activeFilterClasses)} onClick={() => setIsTimeFilterOpen(true)}><Clock className="mr-3 h-4 w-4" /> {timeFilterLabel}</Button>
                                <Button variant="ghost" style={selectedLevel === 'all' ? inactiveFilterShadowStyle : {}} className={cn("w-full justify-start text-sm h-10 rounded-full", selectedLevel !== 'all' && activeFilterClasses)} onClick={() => setIsLevelFilterOpen(true)}><BarChartHorizontal className="mr-3 h-4 w-4" /> {levelFilterLabel}</Button>
                                <Button variant="ghost" style={viewPreference === 'normal' ? inactiveFilterShadowStyle : {}} className={cn("w-full justify-start text-sm h-10 rounded-full", viewPreference !== 'normal' && activeFilterClasses)} onClick={() => setIsViewOptionsOpen(true)}><Eye className="mr-3 h-4 w-4" /> {viewPreferenceLabel}</Button>
                                {activeView === 'clases' && (<Button variant="ghost" style={!filterByFavorites ? inactiveFilterShadowStyle : {}} className={cn("w-full justify-start text-sm h-10 rounded-full", filterByFavorites && activeFilterClasses)} onClick={handleFavoritesClick}><Heart className={cn("mr-3 h-4 w-4", filterByFavorites && "fill-current text-destructive")} /> Favoritos</Button>)}
                                <Button variant="ghost" style={!showPointsBonus ? inactiveFilterShadowStyle : {}} className={cn("w-full justify-start text-sm h-10 rounded-full", showPointsBonus && activeFilterClasses)} onClick={handleTogglePointsBonus}><Sparkles className="mr-3 h-4 w-4 text-amber-500" /> + Puntos</Button>
                            </div>
                        </>
                    )}

                    <div className="mt-auto pt-2 border-t space-y-2">
                        <Button variant="outline" className="w-full justify-start text-sm h-10 rounded-full" onClick={onProfessionalAccessClick}><Briefcase className="mr-3 h-4 w-4" /> Acceso Profesional</Button>
                        <Button variant="outline" className="w-full justify-start text-sm h-10 rounded-full" onClick={onLogoutClick}><LogOut className="mr-3 h-4 w-4" /> Salir</Button>
                    </div>
                </div>

                <ManageFavoriteInstructorsDialog isOpen={isManageFavoritesOpen} onOpenChange={setIsManageFavoritesOpen} currentUser={currentUser} onApplyFavorites={handleApplyFavorites} />
                <LevelFilterDialog isOpen={isLevelFilterOpen} onOpenChange={setIsLevelFilterOpen} currentValue={selectedLevel} onSelect={handleLevelChange} clubId={clubInfo.id} />
                <TimeOfDayFilterDialog isOpen={isTimeFilterOpen} onOpenChange={setIsTimeFilterOpen} currentValue={timeSlotFilter} onSelect={handleTimeFilterChange} />
                <ViewOptionsDialog isOpen={isViewOptionsOpen} onOpenChange={setIsViewOptionsOpen} viewPreference={viewPreference} onViewPreferenceChange={(pref) => handleViewPrefChange(pref, activeView as ActivityViewType)} />
            </aside>
            
             <header className="md:hidden p-4 bg-card border-b sticky top-0 z-20">
                <div className="flex justify-between items-center">
                    <Link href="/profile" className="flex items-center gap-2">
                        <Avatar className="h-8 w-8"><AvatarImage src={currentUser.profilePictureUrl} alt={currentUser.name} /><AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback></Avatar>
                        <div><p className="font-semibold text-sm">{currentUser.name}</p></div>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={onMobileFiltersClick}>
                        <SlidersHorizontal />
                    </Button>
                </div>
                {isActivitiesPage && (
                <div className="mt-4">
                    <div className="grid grid-cols-2 gap-2">
                        <Button size="sm" variant={activeView === 'clases' ? 'default' : 'outline'} onClick={() => updateUrlFilter('view', 'clases')}><Activity className="mr-2 h-4 w-4" />Clases</Button>
                        <Button size="sm" variant={activeView === 'partidas' ? 'default' : 'outline'} onClick={() => updateUrlFilter('view', 'partidas')}><Users className="mr-2 h-4 w-4" />Partidas</Button>
                    </div>
                </div>
                )}
            </header>
        </>
    );
};

export default DesktopSidebar;