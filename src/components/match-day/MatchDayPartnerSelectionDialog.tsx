// src/components/match-day/MatchDayPartnerSelectionDialog.tsx
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

interface MatchDayPartnerSelectionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const MatchDayPartnerSelectionDialog: React.FC<MatchDayPartnerSelectionDialogProps> = ({ isOpen, onOpenChange }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Seleccionar Pareja (En Desarrollo)</DialogTitle>
          <DialogDescription>
            Esta funcionalidad permitirá a los usuarios indicar con quién les gustaría jugar en el evento Match-Day.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-muted-foreground">Aquí aparecería una lista de jugadores inscritos para seleccionar como pareja preferida.</p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <button className="bg-gray-200 p-2 rounded-md">Cerrar</button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MatchDayPartnerSelectionDialog;
