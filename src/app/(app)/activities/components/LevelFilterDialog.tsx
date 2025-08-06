
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
import { BarChartHorizontal } from 'lucide-react';
import type { MatchPadelLevel } from '@/types';
import { matchPadelLevels } from '@/types';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LevelFilterDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentValue: MatchPadelLevel | 'all';
  onSelect: (value: MatchPadelLevel | 'all') => void;
}

const LevelFilterDialog: React.FC<LevelFilterDialogProps> = ({ isOpen, onOpenChange, currentValue, onSelect }) => {
  
  const handleSelect = (value: MatchPadelLevel | 'all') => {
    onSelect(value);
    onOpenChange(false);
  };
  
  const levelOptions = ['all', ...matchPadelLevels];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <BarChartHorizontal className="mr-2 h-5 w-5 text-primary" />
            Filtrar por Nivel
          </DialogTitle>
          <DialogDescription>
            Elige un nivel de juego para filtrar las actividades.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[250px] my-4 pr-3">
          <div className="grid grid-cols-4 gap-2">
            {levelOptions.map(level => (
              <Button
                key={level}
                variant={currentValue === level ? "default" : "outline"}
                onClick={() => handleSelect(level)}
                className="h-auto p-2 text-xs justify-center capitalize"
              >
                {level === 'all' ? 'Todos' : (level === 'abierto' ? 'Abierto' : level)}
              </Button>
            ))}
          </div>
        </ScrollArea>
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
