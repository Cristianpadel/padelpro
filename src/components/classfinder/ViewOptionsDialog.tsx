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
import { Eye, ListFilter, ClipboardList, CheckCircle, Users } from 'lucide-react';
import type { ViewPreference } from '@/types';
import { cn } from '@/lib/utils';


interface ViewOptionsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  viewPreference: ViewPreference;
  onViewPreferenceChange: (value: ViewPreference) => void;
}

const viewOptions: { value: ViewPreference, label: string, icon: React.ElementType }[] = [
    { value: 'normal', label: 'Disponibles', icon: Eye },
    { value: 'withPlayers', label: 'En Juego', icon: Users },
    { value: 'completed', label: 'Completas', icon: CheckCircle },
    { value: 'myInscriptions', label: 'Mis Inscripciones', icon: ClipboardList },
    { value: 'myConfirmed', label: 'Mis Reservas', icon: CheckCircle },
];


const ViewOptionsDialog: React.FC<ViewOptionsDialogProps> = ({
  isOpen,
  onOpenChange,
  viewPreference,
  onViewPreferenceChange
}) => {
  
  const handleSelect = (value: ViewPreference) => {
    onViewPreferenceChange(value);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <ListFilter className="mr-2 h-5 w-5 text-primary" />
            Filtrar por Ocupación
          </DialogTitle>
          <DialogDescription>
            Elige qué tipo de actividades quieres ver.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 grid grid-cols-2 gap-3">
          {viewOptions.map(option => {
              const Icon = option.icon;
              return (
                 <Button
                    key={option.value}
                    variant={viewPreference === option.value ? "default" : "outline"}
                    onClick={() => handleSelect(option.value)}
                    className="h-auto p-3 text-base justify-start items-center"
                 >
                    <Icon className="mr-2 h-4 w-4" />
                    {option.label}
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

export default ViewOptionsDialog;
