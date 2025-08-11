
"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BarChartHorizontal, Check } from 'lucide-react';
import type { MatchPadelLevel, ClubLevelRange } from '@/types';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getMockClubs } from '@/lib/mockData';

interface LevelFilterDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentValue: MatchPadelLevel | 'all'; // Can be a range name now
  onSelect: (value: MatchPadelLevel | 'all') => void;
  clubId: string;
}

const LevelFilterDialog: React.FC<LevelFilterDialogProps> = ({ isOpen, onOpenChange, currentValue, onSelect, clubId }) => {
  
  const club = getMockClubs().find(c => c.id === clubId);
  const levelRanges = club?.levelRanges || [];

  const handleSelect = (value: MatchPadelLevel | 'all') => {
    onSelect(value);
    onOpenChange(false);
  };
  
  const allLevelsOption = { name: 'Todos los Niveles', min: 'all', max: 'all' };
  const allRangeOptions = [allLevelsOption, ...levelRanges];


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <BarChartHorizontal className="mr-2 h-5 w-5 text-primary" />
            Filtrar por Nivel de Juego
          </DialogTitle>
          <DialogDescription>
            Elige un rango de nivel para ver las actividades disponibles.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 grid grid-cols-2 gap-3">
          {allRangeOptions.map(range => {
              const isSelected = currentValue === range.name || (range.name === 'Todos los Niveles' && currentValue === 'all');
              const valueToSelect = range.name === 'Todos los Niveles' ? 'all' : range.name;

              return (
                 <Button
                    key={range.name}
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => handleSelect(valueToSelect as MatchPadelLevel | 'all')}
                    className="h-auto p-3 text-sm justify-between items-center"
                 >
                    <div className="text-left">
                        <p className="font-semibold">{range.name}</p>
                        {range.name !== 'Todos los Niveles' && (
                             <p className="text-xs opacity-80">{range.min} - {range.max}</p>
                        )}
                    </div>
                    {isSelected && <Check className="h-4 w-4" />}
                 </Button>
              )
          })}
        </div>
        <DialogFooter className="mt-2">
          <DialogClose asChild>
            <Button type="button" variant="ghost" className="w-full">
              Cerrar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LevelFilterDialog;
