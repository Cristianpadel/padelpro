
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
import { Clock } from 'lucide-react';
import type { TimeOfDayFilterType } from '@/types';
import { timeSlotFilterOptions } from '@/types';
import { cn } from '@/lib/utils';


interface TimeOfDayFilterDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentValue: TimeOfDayFilterType;
  onSelect: (value: TimeOfDayFilterType) => void;
}

const TimeOfDayFilterDialog: React.FC<TimeOfDayFilterDialogProps> = ({ isOpen, onOpenChange, currentValue, onSelect }) => {
  
  const handleSelect = (value: TimeOfDayFilterType) => {
    onSelect(value);
    onOpenChange(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5 text-primary" />
            Filtrar por Horario
          </DialogTitle>
          <DialogDescription>
            Elige una franja horaria para ver las actividades disponibles.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 grid grid-cols-2 gap-3">
          {timeSlotFilterOptions.map(option => (
            <Button
              key={option.value}
              variant={currentValue === option.value ? "default" : "outline"}
              onClick={() => handleSelect(option.value)}
              className="h-auto p-3 text-base justify-center"
            >
              {option.label}
            </Button>
          ))}
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

export default TimeOfDayFilterDialog;
