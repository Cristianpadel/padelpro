"use client";

import React, { useTransition } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, Save, Settings2, Percent, Clock, Trash2, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateClub } from '@/lib/mockData';
import type { Club, PenaltyTier } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface ManageCancellationPenaltiesFormProps {
  club: Club;
  onSettingsUpdated: (updatedClub: Club) => void;
}

const penaltyTierSchema = z.object({
  hoursBefore: z.coerce.number().min(0, "Las horas no pueden ser negativas."),
  penaltyPercentage: z.coerce.number().min(0, "El porcentaje no puede ser negativo.").max(100, "El porcentaje no puede ser mayor que 100."),
});

const formSchema = z.object({
  cancellationPenaltyTiers: z.array(penaltyTierSchema).max(5, "Máximo 5 tramos de penalización."),
});

type PenaltyFormData = z.infer<typeof formSchema>;

const ManageCancellationPenaltiesForm: React.FC<ManageCancellationPenaltiesFormProps> = ({ club, onSettingsUpdated }) => {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<PenaltyFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cancellationPenaltyTiers: club.pointSettings?.cancellationPenaltyTiers || [],
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "cancellationPenaltyTiers"
  });

  const onSubmit = (values: PenaltyFormData) => {
    startTransition(async () => {
      try {
        const sortedTiers = [...values.cancellationPenaltyTiers].sort((a,b) => b.hoursBefore - a.hoursBefore);

        const newPointSettings = {
          ...club.pointSettings,
          cancellationPenaltyTiers: sortedTiers,
        };

        const result = await updateClub(club.id, { pointSettings: newPointSettings });

        if ('error' in result) {
          toast({
            title: 'Error al Actualizar Penalizaciones',
            description: result.error,
            variant: 'destructive',
          });
        } else {
          toast({
            title: '¡Penalizaciones Actualizadas!',
            description: 'Las reglas de penalización por cancelación han sido guardadas.',
            className: 'bg-primary text-primary-foreground',
          });
          onSettingsUpdated(result);
          form.reset({ cancellationPenaltyTiers: result.pointSettings?.cancellationPenaltyTiers || [] });
        }
      } catch (error) {
        console.error("Error updating penalty settings:", error);
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
        <CardTitle className="flex items-center"><Settings2 className="mr-2 h-5 w-5 text-primary" />Editar Penalizaciones por Cancelación</CardTitle>
        <CardDescription>
          Define los porcentajes de penalización sobre los puntos de bonificación que se aplican al cancelar una actividad confirmada con poca antelación.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end p-3 border rounded-md bg-secondary/20">
                  <FormField
                    control={form.control}
                    name={`cancellationPenaltyTiers.${index}.hoursBefore`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs flex items-center"><Clock className="mr-1 h-3 w-3"/>Menos de (horas)</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`cancellationPenaltyTiers.${index}.penaltyPercentage`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs flex items-center"><Percent className="mr-1 h-3 w-3"/>Penalización (%)</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
             <Button type="button" variant="outline" size="sm" onClick={() => append({ hoursBefore: 1, penaltyPercentage: 100 })} disabled={fields.length >= 5}>
                <PlusCircle className="mr-2 h-4 w-4" /> Añadir Tramo
            </Button>
            <Button type="submit" disabled={isPending || !form.formState.isDirty} className="w-full">
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Guardar Cambios
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ManageCancellationPenaltiesForm;