// src/components/schedule/OpenClassesDialog.tsx
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

// This is a placeholder component as its functionality is not fully defined in the PRD.
// It can be expanded upon later.

interface OpenClassesDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const OpenClassesDialog: React.FC<OpenClassesDialogProps> = ({ isOpen, onOpenChange }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clases Disponibles (en desarrollo)</DialogTitle>
          <DialogDescription>
            Esta ventana mostrará una lista de clases abiertas a las que te puedes unir.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-muted-foreground">Funcionalidad en construcción.</p>
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

export default OpenClassesDialog;
