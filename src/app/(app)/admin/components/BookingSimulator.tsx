"use client";

import React, { useState, useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Loader2, Sparkles, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { simulateBookings, clearSimulatedBookings } from '@/lib/mockData';
import type { Club } from '@/types';
import { daysOfWeek, dayOfWeekLabels } from '@/types';

interface BookingSimulatorProps {
  club: Club;
  onSimulationRun: () => void;
}

const formSchema = z.object({
  activityType: z.enum(['clases', 'partidas'], { required_error: "Debes seleccionar un tipo de actividad." }),
  days: z.array(z.string()).refine(value => value.some(item => item), {
    message: "Debes seleccionar al menos un día.",
  }),
  timeRanges: z.array(z.string()).refine(value => value.some(item => item), {
    message: "Debes seleccionar al menos una franja horaria.",
  }),
  studentCount: z.array(z.number().int().min(1).max(4)),
  density: z.array(z.number().int().min(1).max(100)),
});

type FormData = z.infer<typeof formSchema>;

const timeRangeOptions = [
  { id: 'morning', label: 'Mañanas (08:00 - 13:00)' },
  { id: 'midday', label: 'Mediodía (13:00 - 18:00)' },
  { id: 'evening', label: 'Tardes (18:00 - 22:00)' },
];

const BookingSimulator: React.FC<BookingSimulatorProps> = ({ club, onSimulationRun }) => {
  const [isSimulating, startSimulation] = useTransition();
  const [isCleaning, startCleaning] = useTransition();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      activityType: 'clases',
      days: ['Lunes', 'Miércoles', 'Viernes'],
      timeRanges: ['evening'],
      studentCount: [2],
      density: [50],
    },
  });

  const onSubmit = (values: FormData) => {
    startSimulation(async () => {
      try {
        const result = await simulateBookings({
          clubId: club.id,
          activityType: values.activityType,
          days: values.days as any,
          timeRanges: values.timeRanges as ('morning' | 'midday' | 'evening')[],
          studentCount: values.studentCount[0],
          density: values.density[0],
        });

        toast({
          title: 'Simulación Completada',
          description: result.message,
          className: 'bg-primary text-primary-foreground',
        });
        onSimulationRun();
      } catch (error) {
        toast({ title: 'Error en la Simulación', description: String(error), variant: 'destructive' });
      }
    });
  };
  
  const handleClearBookings = () => {
    startCleaning(async () => {
        try {
            const result = await clearSimulatedBookings(club.id);
            toast({
                title: 'Limpieza Completada',
                description: result.message,
            });
            onSimulationRun();
        } catch(error) {
             toast({ title: 'Error al Limpiar', description: String(error), variant: 'destructive' });
        }
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Simulador de Inscripciones</CardTitle>
        <CardDescription>
          Genera datos de prueba para ver cómo se comporta tu calendario de actividades con inscripciones reales.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="activityType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>1. Tipo de Actividad a Simular</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl><RadioGroupItem value="clases" /></FormControl>
                        <FormLabel className="font-normal">Clases</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl><RadioGroupItem value="partidas" /></FormControl>
                        <FormLabel className="font-normal">Partidas</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
                control={form.control}
                name="days"
                render={() => (
                    <FormItem>
                        <FormLabel>2. Días de la Semana</FormLabel>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {daysOfWeek.map((day) => (
                            <FormField
                            key={day}
                            control={form.control}
                            name="days"
                            render={({ field }) => {
                                return (
                                <FormItem key={day} className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                    <Checkbox
                                        checked={field.value?.includes(day)}
                                        onCheckedChange={(checked) => {
                                        return checked
                                            ? field.onChange([...(field.value || []), day])
                                            : field.onChange(field.value?.filter((value) => value !== day))
                                        }}
                                    />
                                    </FormControl>
                                    <FormLabel className="font-normal">{dayOfWeekLabels[day]}</FormLabel>
                                </FormItem>
                                )
                            }}
                            />
                        ))}
                        </div>
                        <FormMessage />
                    </FormItem>
                )}
            />
            
            <FormField
                control={form.control}
                name="timeRanges"
                render={() => (
                     <FormItem>
                        <FormLabel>3. Franjas Horarias</FormLabel>
                         <div className="flex flex-col space-y-2">
                         {timeRangeOptions.map((item) => (
                            <FormField
                            key={item.id}
                            control={form.control}
                            name="timeRanges"
                            render={({ field }) => {
                                return (
                                <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                    <Checkbox
                                        checked={field.value?.includes(item.id)}
                                        onCheckedChange={(checked) => {
                                        return checked
                                            ? field.onChange([...(field.value || []), item.id])
                                            : field.onChange(
                                                field.value?.filter(
                                                (value) => value !== item.id
                                                )
                                            )
                                        }}
                                    />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                    {item.label}
                                    </FormLabel>
                                </FormItem>
                                )
                            }}
                            />
                        ))}
                        </div>
                        <FormMessage />
                    </FormItem>
                )}
             />

            <FormField
                control={form.control}
                name="studentCount"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>4. Alumnos por Actividad: {field.value}</FormLabel>
                        <FormControl>
                            <Slider
                                min={1} max={4} step={1}
                                defaultValue={field.value}
                                onValueChange={field.onChange}
                            />
                        </FormControl>
                    </FormItem>
                )}
            />

             <FormField
                control={form.control}
                name="density"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>5. Densidad de Simulación: {field.value}%</FormLabel>
                        <FormControl>
                            <Slider
                                min={1} max={100} step={1}
                                defaultValue={field.value}
                                onValueChange={field.onChange}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button type="submit" disabled={isSimulating || isCleaning} className="w-full sm:w-auto">
                {isSimulating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Ejecutar Simulación
              </Button>
               <Button type="button" variant="destructive" onClick={handleClearBookings} disabled={isCleaning || isSimulating} className="w-full sm:w-auto">
                {isCleaning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                Limpiar Simulación
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default BookingSimulator;

    