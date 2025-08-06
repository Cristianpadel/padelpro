"use client";

import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { MatchPadelLevel, SortOption } from '@/types';
import { matchPadelLevels } from '@/types';
import { Sparkles, Star } from 'lucide-react';

interface ActivityFilterSheetProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    selectedLevels: MatchPadelLevel[];
    setSelectedLevels: React.Dispatch<React.SetStateAction<MatchPadelLevel[]>>;
    sortBy: SortOption;
    setSortBy: React.Dispatch<React.SetStateAction<SortOption>>;
    filterAlsoConfirmed: boolean;
    setFilterAlsoConfirmed: React.Dispatch<React.SetStateAction<boolean>>;
    filterByFavorite: boolean;
    setFilterByFavorite: React.Dispatch<React.SetStateAction<boolean>>;
    showPointsBonus: boolean;
    setShowPointsBonus: React.Dispatch<React.SetStateAction<boolean>>;
}

const ActivityFilterSheet: React.FC<ActivityFilterSheetProps> = ({
    isOpen, onOpenChange,
    selectedLevels, setSelectedLevels,
    sortBy, setSortBy,
    filterAlsoConfirmed, setFilterAlsoConfirmed,
    filterByFavorite, setFilterByFavorite,
    showPointsBonus, setShowPointsBonus
}) => {
    
    const handleLevelChange = (level: MatchPadelLevel) => {
        setSelectedLevels(prev => 
            prev.includes(level) 
            ? prev.filter(l => l !== level) 
            : [...prev, level]
        );
    };

    const handleSelectAllLevels = () => setSelectedLevels([]);
    const handleSelectNoneLevels = () => setSelectedLevels(['abierto']); // Placeholder to clear

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Filtrar Actividades</SheetTitle>
                    <SheetDescription>
                       Afina tu búsqueda para encontrar la clase o partida perfecta.
                    </SheetDescription>
                </SheetHeader>
                <div className="py-4 space-y-6">
                    {/* Level Filter */}
                    <div>
                        <Label>Nivel de Juego</Label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                           {matchPadelLevels.map(level => (
                                <div key={level} className="flex items-center space-x-2">
                                    <Checkbox 
                                        id={`level-${level}`}
                                        checked={selectedLevels.includes(level)}
                                        onCheckedChange={() => handleLevelChange(level)}
                                    />
                                    <Label htmlFor={`level-${level}`} className="font-normal">{level}</Label>
                                </div>
                            ))}
                        </div>
                         <div className="flex gap-2 mt-2">
                            <Button variant="link" size="sm" onClick={handleSelectAllLevels}>Todos</Button>
                            <Button variant="link" size="sm" onClick={handleSelectNoneLevels}>Ninguno</Button>
                        </div>
                    </div>
                     {/* Sort By */}
                    <div>
                        <Label>Ordenar Por</Label>
                         <RadioGroup value={sortBy} onValueChange={(val) => setSortBy(val as SortOption)} className="mt-2">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="time" id="sort-time" />
                                <Label htmlFor="sort-time">Hora</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="occupancy" id="sort-occupancy" />
                                <Label htmlFor="sort-occupancy">Ocupación</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="level" id="sort-level" />
                                <Label htmlFor="sort-level">Nivel</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    {/* Other Filters */}
                     <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="filter-confirmed" className="flex-1">Incluir clases ya confirmadas</Label>
                            <Switch id="filter-confirmed" checked={filterAlsoConfirmed} onCheckedChange={setFilterAlsoConfirmed} />
                        </div>
                         <div className="flex items-center justify-between">
                            <Label htmlFor="filter-favorites" className="flex-1">Solo mis instructores favoritos</Label>
                            <Switch id="filter-favorites" checked={filterByFavorite} onCheckedChange={setFilterByFavorite} />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="show-bonus" className="flex-1 flex items-center">
                               <Sparkles className="mr-2 h-4 w-4 text-amber-500" />
                               Mostrar bonus de puntos
                            </Label>
                            <Switch id="show-bonus" checked={showPointsBonus} onCheckedChange={setShowPointsBonus} />
                        </div>
                    </div>
                </div>
                <SheetFooter>
                    <SheetClose asChild>
                        <Button type="button" className="w-full">Ver Resultados</Button>
                    </SheetClose>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};

export default ActivityFilterSheet;
