"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, HardHat } from 'lucide-react';
import type { PadelCourt } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';

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
    totalCourts 
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <HardHat className="mr-2 h-5 w-5 text-primary" />
            Disponibilidad de Pistas
          </DialogTitle>
          <DialogDescription>
            Hay {availableCourts.length} de {totalCourts} pistas disponibles compatibles con este horario.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center text-green-600">
                    <CheckCircle className="mr-1.5 h-4 w-4" />
                    Pistas Libres ({availableCourts.length})
                </h4>
                 <ScrollArea className="h-32 pr-2">
                     <ul className="space-y-1 list-disc list-inside text-xs text-muted-foreground">
                        {availableCourts.length > 0 ? (
                            availableCourts.map(court => <li key={court.id}>{court.name} (Pista {court.courtNumber})</li>)
                        ) : (
                            <li>Ninguna</li>
                        )}
                    </ul>
                 </ScrollArea>
            </div>
            <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center text-destructive">
                    <XCircle className="mr-1.5 h-4 w-4" />
                    Pistas Ocupadas ({occupiedCourts.length})
                </h4>
                 <ScrollArea className="h-32 pr-2">
                    <ul className="space-y-1 list-disc list-inside text-xs text-muted-foreground">
                        {occupiedCourts.length > 0 ? (
                            occupiedCourts.map(court => <li key={court.id}>{court.name} (Pista {court.courtNumber})</li>)
                        ) : (
                            <li>Ninguna</li>
                        )}
                    </ul>
                 </ScrollArea>
            </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" className="w-full">
              Entendido
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CourtAvailabilityInfoDialog;
