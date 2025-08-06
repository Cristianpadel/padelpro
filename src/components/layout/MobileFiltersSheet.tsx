"use client";

import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Heart, SlidersHorizontal, Eye, ClipboardList, CheckCircle, Sparkles, Star, Clock, BarChartHorizontal, X } from 'lucide-react';
import { timeSlotFilterOptions } from '@/types';
import type { TimeOfDayFilterType, MatchPadelLevel } from '@/types';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { matchPadelLevels } from '@/types';

interface MobileFiltersSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  timeSlotFilter: TimeOfDayFilterType;
  selectedLevel: MatchPadelLevel | 'all';
  viewPreference: 'normal' | 'myInscriptions' | 'myConfirmed';
  filterByFavorites: boolean;
  showPointsBonus: boolean;
  onTimeFilterChange: (value: TimeOfDayFilterType) => void;
  onLevelChange: (value: MatchPadelLevel | 'all') => void;
  onViewPreferenceChange: (value: 'normal' | 'myInscriptions' | 'myConfirmed') => void;
  onFavoritesClick: () => void;
  onTogglePointsBonus: () => void;
  onClearFilters: () => void;
}

const FilterButton: React.FC<{
    label: string;
    icon: React.ElementType;
    isActive: boolean;
    onClick: () => void;
    className?: string;
}> = ({ label, icon: Icon, isActive, onClick, className }) => (
    <Button
        variant={isActive ? "secondary" : "outline"}
        onClick={onClick}
        className={cn("h-auto py-3 justify-center font-semibold text-sm w-full flex flex-col items-center gap-1", isActive && 'border-primary text-primary', className)}
    >
        <Icon className="h-5 w-5 mb-1" />
        {label}
    </Button>
);

export function MobileFiltersSheet({
    isOpen,
    onOpenChange,
    timeSlotFilter,
    selectedLevel,
    viewPreference,
    filterByFavorites,
    showPointsBonus,
    onTimeFilterChange,
    onLevelChange,
    onViewPreferenceChange,
    onFavoritesClick,
    onTogglePointsBonus,
    onClearFilters,
}: MobileFiltersSheetProps) {

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="rounded-t-lg h-auto flex flex-col p-0">
                <SheetHeader className="text-left p-4 border-b">
                    <SheetTitle className="flex items-center"><SlidersHorizontal className="mr-2 h-5 w-5" /> Filtros y Opciones</SheetTitle>
                    <SheetDescription>Aplica filtros para encontrar la actividad perfecta para ti.</SheetDescription>
                </SheetHeader>
                <div className="flex-grow overflow-y-auto p-4 space-y-4">
                    
                    <div>
                        <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Franja Horaria</h4>
                        <div className="grid grid-cols-4 gap-2">
                            <Button variant={timeSlotFilter === 'all' ? "secondary" : "outline"} onClick={() => onTimeFilterChange('all')} className={cn("h-auto py-2", timeSlotFilter === 'all' && 'border-primary')}>Todos</Button>
                            <Button variant={timeSlotFilter === 'morning' ? "secondary" : "outline"} onClick={() => onTimeFilterChange('morning')} className={cn("h-auto py-2", timeSlotFilter === 'morning' && 'border-primary')}>Mañanas</Button>
                            <Button variant={timeSlotFilter === 'midday' ? "secondary" : "outline"} onClick={() => onTimeFilterChange('midday')} className={cn("h-auto py-2", timeSlotFilter === 'midday' && 'border-primary')}>Mediodía</Button>
                            <Button variant={timeSlotFilter === 'evening' ? "secondary" : "outline"} onClick={() => onTimeFilterChange('evening')} className={cn("h-auto py-2", timeSlotFilter === 'evening' && 'border-primary')}>Tardes</Button>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Nivel</h4>
                        <Select value={selectedLevel} onValueChange={(value: MatchPadelLevel | 'all') => onLevelChange(value)}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Elige un nivel..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los Niveles</SelectItem>
                                {matchPadelLevels.map(level => (
                                    <SelectItem key={level} value={level} className="capitalize">
                                        {level === 'abierto' ? 'Nivel Abierto' : `Nivel ${level}`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Vista</h4>
                            <div className="space-y-1">
                                <Button variant={viewPreference === 'normal' ? 'secondary' : 'outline'} onClick={() => onViewPreferenceChange('normal')} className={cn("h-auto w-full py-2 justify-start font-semibold", viewPreference === 'normal' && "border-primary")}><Eye className="mr-2 h-4 w-4"/> Disponibles</Button>
                                <Button variant={viewPreference === 'myInscriptions' ? 'secondary' : 'outline'} onClick={() => onViewPreferenceChange('myInscriptions')} className={cn("h-auto w-full py-2 justify-start font-semibold", viewPreference === 'myInscriptions' && "border-primary")}><ClipboardList className="mr-2 h-4 w-4"/> Inscripciones</Button>
                                <Button variant={viewPreference === 'myConfirmed' ? 'secondary' : 'outline'} onClick={() => onViewPreferenceChange('myConfirmed')} className={cn("h-auto w-full py-2 justify-start font-semibold", viewPreference === 'myConfirmed' && "border-primary")}><CheckCircle className="mr-2 h-4 w-4"/> Reservas</Button>
                            </div>
                        </div>
                        <div>
                             <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Preferencias</h4>
                             <div className="space-y-1">
                                <Button variant={filterByFavorites ? 'secondary' : 'outline'} className={cn("w-full h-auto py-2 justify-start font-semibold", filterByFavorites && 'border-primary')} onClick={onFavoritesClick}>
                                    <Heart className={cn("mr-2 h-4 w-4", filterByFavorites && "fill-current text-destructive")} />
                                    Favoritos
                                </Button>
                                <Button variant={showPointsBonus ? 'secondary' : 'outline'} className={cn("w-full h-auto py-2 justify-start font-semibold", showPointsBonus && 'border-primary')} onClick={onTogglePointsBonus}>
                                    <Sparkles className="mr-2 h-4 w-4 text-amber-500"/>
                                    Puntos Extra
                                </Button>
                             </div>
                        </div>
                    </div>
                </div>
                 <SheetFooter className="p-4 border-t bg-background flex flex-row gap-2">
                    <Button variant="ghost" onClick={onClearFilters} className="flex-1">
                        <X className="mr-2 h-4 w-4" />
                        Limpiar Filtros
                    </Button>
                    <Button onClick={() => onOpenChange(false)} className="flex-1">
                        Ver Resultados
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}