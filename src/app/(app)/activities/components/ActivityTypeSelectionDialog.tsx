// src/app/(app)/activities/components/ActivityTypeSelectionDialog.tsx
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
import { Activity, Users, HelpCircle } from 'lucide-react';

interface ActivityTypeSelectionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: 'class' | 'match') => void;
}

const ActivityTypeSelectionDialog: React.FC<ActivityTypeSelectionDialogProps> = ({ isOpen, onOpenChange, onSelect }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <HelpCircle className="mr-2 h-5 w-5 text-primary" />
            Seleccionar Tipo de Actividad
          </DialogTitle>
          <DialogDescription>
            Tienes inscripciones en varios tipos de actividades para este día. ¿Cuáles quieres ver?
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 grid grid-cols-2 gap-4">
          <Button
            onClick={() => onSelect('class')}
            className="h-auto p-4 flex flex-col gap-2 text-base"
          >
            <Activity className="h-6 w-6" />
            Ver Clases
          </Button>
          <Button
            onClick={() => onSelect('match')}
            className="h-auto p-4 flex flex-col gap-2 text-base"
          >
            <Users className="h-6 w-6" />
            Ver Partidas
          </Button>
        </div>
        <DialogFooter className="mt-2">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="w-full">
              Cerrar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ActivityTypeSelectionDialog;
