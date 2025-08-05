"use client";

import React, { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, Save, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateClub } from '@/lib/mockData';
import type { Club } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface EditPointSettingsFormProps {
  club: Club;
  onSettingsUpdated: (updatedClub: Club) => void;
}

const pointSettingsSchema = z.object({
  cancellationPointPerEuro: z.coerce.number().min(0, "No puede ser negativo.").default(0),
  inviteFriend: z.coerce.number().int().min(0, "Debe ser un entero no negativo.").default(0),
  firstToJoinClass: z.coerce.number().int().min(0, "Debe ser un entero no negativo.").default(0),
  firstToJoinMatch: z.coerce.number().int().min(0, "Debe ser un entero no negativo.").default(0),
  pointsCostForCourt: z.coerce.number().int().min(0, "Debe ser un entero no negativo.").default(20),
});

type PointSettingsFormData = z.infer<typeof pointSettingsSchema>;

const EditPointSettingsForm: React.FC<EditPointSettingsFormProps> = ({ club, onSettingsUpdated }) => {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<PointSettingsFormData>({
    resolver: zodResolver(pointSettingsSchema),
    defaultValues: {
      cancellationPointPerEuro: club.pointSettings?.cancellationPointPerEuro ?? 1,
      inviteFriend: club.pointSettings?.inviteFriend ?? 5,
      firstToJoinClass: club.pointSettings?.firstToJoinClass ?? 2,
      firstToJoinMatch: club.pointSettings?.firstToJoinMatch ?? 2,
      pointsCostForCourt: club.pointSettings?.pointsCostForCourt ?? 20,
    },
  });

  const onSubmit = (values: PointSettingsFormData) => {
    startTransition(async () => {
      try {
        const newPointSettings = {
            ...club.pointSettings,
            ...values,
        };
        // Ensure the obsolete field is removed if it lingers from old data structures.
        delete (newPointSettings as any).pointsCostForGratisSpot;

        const result = await updateClub(club.id, {
          pointSettings: newPointSettings
        });

        if ('error' in result) {
          toast({
            title: 'Error al Actualizar Configuración',
            description: result.error,
            variant: 'destructive',
          });
        } else {
          toast({
            title: '¡Configuración Actualizada!',
            description: 'Los ajustes de puntos de fidelidad han sido guardados.',
            className: 'bg-primary text-primary-foreground',
          });
          onSettingsUpdated(result);
          form.reset(values); // Reset with the new saved values
        }
      } catch (error) {
        console.error("Error updating point settings:", error);
        toast({
          title: 'Error Inesperado',
          description: 'Ocurrió un problema al guardar la configuración.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center"><Settings className="mr-2 h-5 w-5 text-primary" />Editar Configuración de Puntos</CardTitle>
            <CardDescription>Modifica los puntos que se otorgan por diferentes acciones en el club.</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                control={form.control}
                name="cancellationPointPerEuro"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Puntos por € en Cancelación Bonificada</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="Ej: 1" {...field} />
                    </FormControl>
                    <FormDescription>Puntos otorgados por cada euro del precio de la actividad (clase/partida) cuando un jugador cancela su plaza confirmada y esta se libera como "gratis".</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="inviteFriend"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Puntos por Invitar Amigo</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="Ej: 5" {...field} />
                    </FormControl>
                    <FormDescription>Puntos otorgados al referente cuando un amigo invitado se registra y completa una acción (simulado).</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="firstToJoinClass"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Puntos por Ser Primero en Opción de Clase (No-Gratis)</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="Ej: 2" {...field} />
                    </FormControl>
                    <FormDescription>Puntos otorgados al primer alumno en unirse a una opción de clase de pago (no aplica a plazas gratis).</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="firstToJoinMatch"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Puntos por Ser Primero en Partida (No-Gratis)</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="Ej: 2" {...field} />
                    </FormControl>
                    <FormDescription>Puntos otorgados al primer alumno en unirse a una partida de pago (no aplica a plazas gratis).</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="pointsCostForCourt"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Coste en Puntos por Reserva de Pista</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="Ej: 20" {...field} />
                    </FormControl>
                    <FormDescription>Puntos necesarios para que un usuario reserve una pista completa durante los horarios habilitados.</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <Button type="submit" disabled={isPending || !form.formState.isDirty} className="w-full">
                {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Save className="mr-2 h-4 w-4" />
                )}
                Guardar Cambios
                </Button>
            </form>
            </Form>
        </CardContent>
    </Card>
  );
};

export default EditPointSettingsForm;
