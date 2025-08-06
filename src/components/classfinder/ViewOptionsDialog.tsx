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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Eye, ListFilter } from 'lucide-react';

interface ViewOptionsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  showConfirmed: boolean;
  onShowConfirmedChange: (checked: boolean) => void;
  viewPreference: 'normal' | 'myInscriptions' | 'myConfirmed';
  onViewPreferenceChange: (value: 'normal' | 'myInscriptions' | 'myConfirmed') => void;
}

const ViewOptionsDialog: React.FC<ViewOptionsDialogProps> = ({
  isOpen,
  onOpenChange,
  showConfirmed,
  onShowConfirmedChange,
  viewPreference,
  onViewPreferenceChange
}) => {

  const handleClose = () => onOpenChange(false);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <ListFilter className="mr-2 h-5 w-5 text-primary" />
            Opciones de Vista
          </DialogTitle>
          <DialogDescription>
            Personaliza cómo se muestran las actividades.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
          
          <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
              <Label htmlFor="show-confirmed-switch" className="text-sm font-medium">Mostrar Llenas/Confirmadas</Label>
              <p className="text-xs text-muted-foreground">Incluye actividades que ya no tienen plazas.</p>
            </div>
            <Switch
              id="show-confirmed-switch"
              checked={showConfirmed}
              onCheckedChange={onShowConfirmedChange}
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Priorizar Vista</Label>
            <RadioGroup 
              defaultValue={viewPreference} 
              onValueChange={onViewPreferenceChange as (value: string) => void} 
              className="mt-2 space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="normal" id="view-normal" />
                <Label htmlFor="view-normal" className="font-normal">Vista Normal</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="myInscriptions" id="view-inscriptions" />
                <Label htmlFor="view-inscriptions" className="font-normal">Mis Inscripciones Primero</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="myConfirmed" id="view-confirmed" />
                <Label htmlFor="view-confirmed" className="font-normal">Mis Confirmadas Primero</Label>
              </div>
            </RadioGroup>
          </div>

        </div>
        <DialogFooter className="mt-2">
          <Button type="button" onClick={handleClose} className="w-full">
            Aplicar y Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewOptionsDialog;