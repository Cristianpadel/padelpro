"use client";

import React, { useEffect, useTransition } from 'react';
import type { Club, CourtRateTier, DayOfWeek, DynamicPricingTier } from '@/types';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { updateClub } from '@/lib/mockData';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Trash2, PlusCircle, Save, Settings2, Euro, Clock, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from '@/components/ui/switch';
import { daysOfWeek, dayOfWeekLabels } from '@/types';
import { Label } from '@/components/ui/label';

interface ManageCourtRatesPanelProps {
    club: Club;
    onRatesUpdated: (updatedClub: Club) => void;
}

const timeOptions = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = (i % 2) * 30;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
});

const courtRateTierSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "El nombre es obligatorio."),
  days: z.array(z.string()).min(1, "Debes seleccionar al menos un día."),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Hora inválida."),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Hora inválida."),
  rate: z.coerce.number().positive("La tarifa debe ser un número positivo."),
}).refine(data => data.startTime < data.endTime, {
  message: "La hora de fin debe ser posterior a la de inicio.",
  path: ["endTime"],
});

const dynamicPricingTierSchema = z.object({
  id: z.string(),
  days: z.array(z.string()).min(1, "Debes seleccionar al menos un día."),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Hora inválida."),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Hora inválida."),
  minPrice: z.coerce.number().min(0, "El precio no puede ser negativo."),
  startPrice: z.coerce.number().min(0, "El precio no puede ser negativo."),
  maxPrice: z.coerce.number().min(0, "El precio no puede ser negativo."),
}).refine(data => data.startTime < data.endTime, {
  message: "La hora de fin debe ser posterior a la de inicio.",
  path: ["endTime"],
}).refine(data => data.minPrice <= data.startPrice && data.startPrice <= data.maxPrice, {
  message: "El orden debe ser: Mín. <= Salida <= Máx.",
  path: ["maxPrice"],
});


const formSchema = z.object({
    dynamicPricingEnabled: z.boolean(),
    courtRateTiers: z.array(courtRateTierSchema).max(10, "Máximo 10 tarifas."),
    dynamicPricingTiers: z.array(dynamicPricingTierSchema).max(20, "Máximo 20 tramos dinámicos."),
});

type CourtRateFormData = z.infer<typeof formSchema>;

const ManageCourtRatesPanel: React.FC<ManageCourtRatesPanelProps> = ({ club, onRatesUpdated }) => {
    const { toast } = useToast();
    const [isSaving, startSaveTransition] = useTransition();

    const form = useForm<CourtRateFormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            dynamicPricingEnabled: club.dynamicPricingEnabled ?? false,
            courtRateTiers: club.courtRateTiers || [],
            dynamicPricingTiers: club.dynamicPricingTiers || [],
        },
    });

    const { fields: fixedFields, append: appendFixed, remove: removeFixed } = useFieldArray({ control: form.control, name: "courtRateTiers" });
    const { fields: dynamicFields, append: appendDynamic, remove: removeDynamic } = useFieldArray({ control: form.control, name: "dynamicPricingTiers" });
    const dynamicPricingEnabled = form.watch('dynamicPricingEnabled');
    
    useEffect(() => {
        form.reset({
            dynamicPricingEnabled: club.dynamicPricingEnabled ?? false,
            courtRateTiers: club.courtRateTiers || [],
            dynamicPricingTiers: club.dynamicPricingTiers || [],
        });
    }, [club, form]);


    const onSubmit = async (data: CourtRateFormData) => {
        startSaveTransition(async () => {
            const result = await updateClub(club.id, { 
                dynamicPricingEnabled: data.dynamicPricingEnabled,
                courtRateTiers: data.courtRateTiers,
                dynamicPricingTiers: data.dynamicPricingTiers,
            });

            if ('error' in result) {
                toast({ title: "Error al actualizar las tarifas", description: result.error, variant: "destructive" });
            } else {
                toast({ title: "Tarifas de pista actualizadas", description: "Las tarifas se han guardado con éxito.", className: "bg-primary text-primary-foreground" });
                onRatesUpdated(result);
                form.reset(data); // Reset the form with the new data to make it "not dirty"
            }
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center text-lg"><Settings2 className="mr-2 h-5 w-5 text-primary" /> Modelo de Precios</CardTitle>
                             <FormField
                                control={form.control}
                                name="dynamicPricingEnabled"
                                render={({ field }) => (
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl>
                                            <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormLabel className="font-normal">{field.value ? "Precios Dinámicos" : "Precios Fijos"}</FormLabel>
                                    </FormItem>
                                )}
                            />
                        </div>
                        <CardDescription>
                            {dynamicPricingEnabled 
                                ? "Define precios variables que se ajustan según la ocupación de las pistas en cada franja horaria. El 'Precio de Salida' es el coste inicial. El rango horario no incluye la hora de fin (ej: 17:00 a 21:00 termina a las 20:59)." 
                                : "Define precios fijos por franjas horarias y días de la semana. El rango horario no incluye la hora de fin."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {dynamicPricingEnabled ? (
                            // DYNAMIC PRICING UI
                            <div className="space-y-4">
                               {dynamicFields.map((item, index) => (
                                    <div key={item.id} className="p-4 border rounded-md space-y-3 bg-secondary/20 relative">
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField control={form.control} name={`dynamicPricingTiers.${index}.startTime`} render={({ field }) => ( <FormItem><FormLabel className="text-xs">Desde</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger></FormControl><SelectContent>{timeOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select><FormMessage className="text-xs" /></FormItem>)} />
                                            <FormField control={form.control} name={`dynamicPricingTiers.${index}.endTime`} render={({ field }) => ( <FormItem><FormLabel className="text-xs">Hasta</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger></FormControl><SelectContent>{timeOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select><FormMessage className="text-xs" /></FormItem>)} />
                                        </div>
                                         <div className="grid grid-cols-3 gap-2">
                                            <FormField control={form.control} name={`dynamicPricingTiers.${index}.minPrice`} render={({ field }) => ( <FormItem><FormLabel className="text-xs flex items-center">Mínimo (€)</FormLabel><FormControl><Input type="number" min="0" step="0.5" {...field} className="h-8" /></FormControl><FormMessage className="text-xs"/></FormItem>)} />
                                            <FormField control={form.control} name={`dynamicPricingTiers.${index}.startPrice`} render={({ field }) => ( <FormItem><FormLabel className="text-xs flex items-center">Salida (€)</FormLabel><FormControl><Input type="number" min="0" step="0.5" {...field} className="h-8" /></FormControl><FormMessage className="text-xs"/></FormItem>)} />
                                            <FormField control={form.control} name={`dynamicPricingTiers.${index}.maxPrice`} render={({ field }) => ( <FormItem><FormLabel className="text-xs flex items-center">Máximo (€)</FormLabel><FormControl><Input type="number" min="0" step="0.5" {...field} className="h-8" /></FormControl><FormMessage className="text-xs"/></FormItem>)} />
                                        </div>
                                        <FormField control={form.control} name={`dynamicPricingTiers.${index}.days`} render={() => ( <FormItem><FormLabel className="text-xs">Días de Aplicación</FormLabel><div className="grid grid-cols-4 gap-1.5">{daysOfWeek.map((day) => (<FormField key={day} control={form.control} name={`dynamicPricingTiers.${index}.days`} render={({ field }) => ( <FormItem className="flex flex-row items-center space-x-1.5 space-y-0"><FormControl><Switch className="h-4 w-7" checked={field.value?.includes(day)} onCheckedChange={(checked) => { return checked ? field.onChange([...(field.value || []), day]) : field.onChange((field.value || []).filter((value) => value !== day)) }}/></FormControl><FormLabel className="text-xs font-normal">{dayOfWeekLabels[day].substring(0,3)}</FormLabel></FormItem>)}/>))}</div><FormMessage className="text-xs"/></FormItem>)} />
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeDynamic(index)} className="absolute top-2 right-2 text-destructive hover:bg-destructive/10 h-7 w-7"><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" onClick={() => appendDynamic({ id: `dyn-tier-${Date.now()}`, days: [], startTime: '09:00', endTime: '10:00', minPrice: 1, startPrice: 5, maxPrice: 10 })} disabled={dynamicFields.length >= 20}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Añadir Tramo Dinámico
                                </Button>
                            </div>
                        ) : (
                            // FIXED PRICING UI
                             <div className="space-y-4">
                               {fixedFields.map((item, index) => (
                                    <div key={item.id} className="p-4 border rounded-md space-y-3 bg-secondary/20 relative">
                                        <FormField control={form.control} name={`courtRateTiers.${index}.name`} render={({ field }) => (<FormItem><FormLabel>Nombre de la Tarifa</FormLabel><FormControl><Input {...field} placeholder="Ej: Horas Punta" /></FormControl><FormMessage /></FormItem>)} />
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField control={form.control} name={`courtRateTiers.${index}.startTime`} render={({ field }) => ( <FormItem><FormLabel className="text-xs">Desde</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger></FormControl><SelectContent>{timeOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select><FormMessage className="text-xs" /></FormItem>)} />
                                            <FormField control={form.control} name={`courtRateTiers.${index}.endTime`} render={({ field }) => ( <FormItem><FormLabel className="text-xs">Hasta</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger></FormControl><SelectContent>{timeOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select><FormMessage className="text-xs" /></FormItem>)} />
                                        </div>
                                         <FormField control={form.control} name={`courtRateTiers.${index}.rate`} render={({ field }) => ( <FormItem><FormLabel className="text-xs flex items-center"><Euro className="mr-1 h-3.5 w-3.5"/>Tarifa por Hora</FormLabel><FormControl><Input type="number" min="0" step="1" {...field} className="h-8" /></FormControl><FormMessage className="text-xs"/></FormItem>)} />
                                        <FormField control={form.control} name={`courtRateTiers.${index}.days`} render={() => ( <FormItem><FormLabel className="text-xs">Días de Aplicación</FormLabel><div className="grid grid-cols-4 gap-1.5">{daysOfWeek.map((day) => (<FormField key={day} control={form.control} name={`courtRateTiers.${index}.days`} render={({ field }) => ( <FormItem className="flex flex-row items-center space-x-1.5 space-y-0"><FormControl><Switch className="h-4 w-7" checked={field.value?.includes(day)} onCheckedChange={(checked) => { return checked ? field.onChange([...(field.value || []), day]) : field.onChange((field.value || []).filter((value) => value !== day)) }}/></FormControl><FormLabel className="text-xs font-normal">{dayOfWeekLabels[day].substring(0,3)}</FormLabel></FormItem>)}/>))}</div><FormMessage className="text-xs"/></FormItem>)} />
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeFixed(index)} className="absolute top-2 right-2 text-destructive hover:bg-destructive/10 h-7 w-7"><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" onClick={() => appendFixed({ id: `tier-${Date.now()}`, name: 'Nueva Tarifa', days: [], startTime: '18:00', endTime: '22:00', rate: 25 })} disabled={fixedFields.length >= 10}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Añadir Tarifa Fija
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Button type="submit" disabled={isSaving || !form.formState.isDirty}>
                    <Save className="mr-2 h-4 w-4" /> Guardar Cambios de Tarifas
                </Button>
            </form>
        </Form>
    );
};

export default ManageCourtRatesPanel;
