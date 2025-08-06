"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, XCircle } from 'lucide-react';
import type { PadelCourt } from '@/types';

interface CourtAvailabilityInfoDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  availableCourts: PadelCourt[];
  occupiedCourts: PadelCourt[];
  totalCourts: number;
}

const CourtAvailabilityInfoDialog: React.FC<CourtAvailabilityInfoDialogProps> = ({
  isOpen,
  onOpenChange,
  availableCourts,
  occupiedCourts,
  totalCourts,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Disponibilidad de Pistas ({availableCourts.length}/{totalCourts})</DialogTitle>
          <DialogDescription>
            Detalle de las pistas disponibles y ocupadas para el horario de esta clase.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-60">
            <div className="grid grid-cols-2 gap-4 p-1">
                <div>
                    <h4 className="font-semibold mb-2 flex items-center text-green-600"><CheckCircle className="h-4 w-4 mr-2"/>Disponibles</h4>
                    {availableCourts.length > 0 ? (
                        <ul className="list-disc list-inside text-sm space-y-1">
                            {availableCourts.map(court => <li key={court.id}>{court.name}</li>)}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted-foreground italic">Ninguna</p>
                    )}
                </div>
                <div>
                    <h4 className="font-semibold mb-2 flex items-center text-destructive"><XCircle className="h-4 w-4 mr-2"/>Ocupadas</h4>
                     {occupiedCourts.length > 0 ? (
                        <ul className="list-disc list-inside text-sm space-y-1">
                            {occupiedCourts.map(court => <li key={court.id}>{court.name}</li>)}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted-foreground italic">Ninguna</p>
                    )}
                </div>
            </div>
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild>
            <Button>Cerrar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CourtAvailabilityInfoDialog;
