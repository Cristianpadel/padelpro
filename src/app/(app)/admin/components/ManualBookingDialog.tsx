"use client";

import React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription as DialogPrimitiveDescription, // Renamed to avoid conflict
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import type { PadelCourt } from '@/types';

export const manualBookingFormSchema = z.object({
  courtNumber: z.coerce.number().int().min(1, "Selecciona una pista."),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Hora de inicio inválida."),
  title: z.enum(['clases 60min', 'partidas 90min'], { required_error: "Selecciona un tipo de evento." }),
});

export type ManualBookingFormData = z.infer<typeof manualBookingFormSchema>;

interface ManualBookingDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<ManualBookingFormData>;
  courts: PadelCourt[];
  timeOptions: string[];
  onSubmit: (data: ManualBookingFormData) => Promise<void>;
  isSubmitting: boolean;
}

const ManualBookingDialog: React.FC<ManualBookingDialogProps> = ({
  isOpen,
  onOpenChange,
  form,
  courts,
  timeOptions,
  onSubmit,
  isSubmitting,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Añadir Reserva Manual</DialogTitle>
          <DialogPrimitiveDescription> {/* Use renamed import */}
            Añade una clase o partida manualmente al horario de la pista.
          </DialogPrimitiveDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="courtNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pista</FormLabel>
                  <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Selecciona una pista" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {courts.map(court => (
                        <SelectItem key={court.id} value={court.courtNumber.toString()}>{court.name} (Pista {court.courtNumber})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hora Inicio</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Hora" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {timeOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Evento</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona tipo de evento" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="clases 60min">Clase (60 min)</SelectItem>
                      <SelectItem value="partidas 90min">Partida (90 min)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Reserva
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ManualBookingDialog;
