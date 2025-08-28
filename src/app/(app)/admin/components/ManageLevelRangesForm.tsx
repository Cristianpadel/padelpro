"use client";

import React, { useEffect } from 'react';
import type { Club, ClubLevelRange, MatchPadelLevel } from '@/types';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { updateClub } from '@/lib/mockData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Trash2, PlusCircle, Save, Settings2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { numericMatchPadelLevels as importedNumericMatchPadelLevels } from '@/types'; // numeric levels only
import { cn } from '@/lib/utils';

interface ManageLevelRangesFormProps {
    club: Club;
    onRangesUpdated: (updatedClub: Club) => void;
}

// Use the imported numericMatchPadelLevels
// Create a mutable tuple for z.enum from the readonly const array
const numericLevelsForSchema = [...importedNumericMatchPadelLevels] as [NumericLevel, ...NumericLevel[]];
type NumericLevel = typeof importedNumericMatchPadelLevels[number];


const levelRangeSchema = z.object({
    name: z.string().min(1, "El nombre del rango es obligatorio.").max(50, "Máximo 50 caracteres."),
    min: z.enum(numericLevelsForSchema, { required_error: "Nivel mínimo requerido."}),
    max: z.enum(numericLevelsForSchema, { required_error: "Nivel máximo requerido."}),
}).refine(data => parseFloat(data.max) >= parseFloat(data.min), {
    message: "El nivel máx. debe ser >= nivel mín.",
    path: ["max"],
});

const formSchema = z.object({
    levelRanges: z.array(levelRangeSchema).min(0, "Debe definir al menos un rango o dejar la lista vacía.").max(10, "Máximo 10 rangos."),
});

type LevelRangeFormData = z.infer<typeof formSchema>;

const defaultClubLevelRangesForForm: ClubLevelRange[] = [
    { name: "Iniciación", min: '1.0', max: '2.0' },
    { name: "Intermedio", min: '2.5', max: '3.5' },
    { name: "Avanzado", min: '4.0', max: '5.5' },
    { name: "Competición", min: '6.0', max: '7.0' },
];

const ManageLevelRangesForm: React.FC<ManageLevelRangesFormProps> = ({ club, onRangesUpdated }) => {
    const { toast } = useToast();

    const form = useForm<LevelRangeFormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            levelRanges: (club.levelRanges && club.levelRanges.length > 0) 
                         ? club.levelRanges.map((range) => ({ 
                             name: range.name,
                             min: range.min, 
                             max: range.max 
                           }))
                         : defaultClubLevelRangesForForm,
        },
    });
    
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "levelRanges"
    });

    useEffect(() => {
        const initialRanges = (club.levelRanges && club.levelRanges.length > 0) 
            ? club.levelRanges.map((range) => ({
                name: range.name,
                min: range.min,
                max: range.max
              }))
            : defaultClubLevelRangesForForm;
        form.reset({ levelRanges: initialRanges });
    }, [club, form.reset, form]);


    const onSubmit = async (data: LevelRangeFormData) => {
        const newRanges: ClubLevelRange[] = data.levelRanges.map(range => ({
            name: range.name,
            min: range.min,
            max: range.max,
        }));

        const result = await updateClub(club.id, { levelRanges: newRanges });

        if ('error' in result) {
            toast({
                title: "Error al actualizar los rangos de nivel",
                description: result.error,
                variant: "destructive",
            });
        } else {
            toast({
                title: "Rangos de nivel actualizados",
                description: "Los rangos de nivel del club se han guardado con éxito.",
                className: "bg-primary text-primary-foreground",
            });
            onRangesUpdated({ ...club, levelRanges: newRanges });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center text-lg"><Settings2 className="mr-2 h-5 w-5 text-primary" /> Gestionar Rangos de Nivel del Club</CardTitle>
                <CardDescription>Define los diferentes niveles de juego que ofrece tu club. Estos se usarán para clasificar clases 'abiertas'.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {fields.map((item, index) => (
                            <div key={item.id} className="p-4 border rounded-md space-y-3 bg-secondary/20 relative">
                                <FormField
                                    control={form.control}
                                    name={`levelRanges.${index}.name`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nombre del Rango</FormLabel>
                                            <FormControl><Input {...field} placeholder="Ej: Iniciación" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name={`levelRanges.${index}.min`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nivel Mínimo</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Mín." /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        {importedNumericMatchPadelLevels.map(lvl => <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`levelRanges.${index}.max`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nivel Máximo</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Máx." /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        {importedNumericMatchPadelLevels.map(lvl => <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                 <FormMessage>{form.formState.errors.levelRanges?.[index]?.max?.message || form.formState.errors.levelRanges?.[index]?.root?.message}</FormMessage>
                                {fields.length > 0 && ( // Allow removing if any field exists, not just > 1
                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="absolute top-2 right-2 text-destructive hover:bg-destructive/10 h-7 w-7">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                        
                        <FormMessage>{form.formState.errors.levelRanges?.message || form.formState.errors.levelRanges?.root?.message}</FormMessage>


                        <div className="flex flex-col sm:flex-row gap-2 mt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    let newRangeName = "Nuevo Rango";
                                    let newMin: NumericLevel = importedNumericMatchPadelLevels[0];
                                    let newMax: NumericLevel = importedNumericMatchPadelLevels[0];

                                    if (fields.length < defaultClubLevelRangesForForm.length) {
                                        const defaultRange = defaultClubLevelRangesForForm[fields.length];
                                        newRangeName = defaultRange.name;
                                        newMin = defaultRange.min;
                                        newMax = defaultRange.max;
                                    } else if (fields.length > 0) {
                                        const lastRange = fields[fields.length -1] as unknown as { min: NumericLevel; max: NumericLevel };
                                        const lastMaxIndex = importedNumericMatchPadelLevels.indexOf(lastRange.max);
                                        if (lastMaxIndex < importedNumericMatchPadelLevels.length -1) {
                                            newMin = importedNumericMatchPadelLevels[lastMaxIndex + 1];
                                            newMax = newMin;
                                        } else {
                                            newMin = lastRange.max; // Or handle differently if max is reached
                                            newMax = lastRange.max;
                                        }
                                    }
                                    append({ name: newRangeName, min: newMin, max: newMax });
                                }}
                                disabled={fields.length >= 10}
                                className="w-full sm:w-auto"
                            >
                                <PlusCircle className="mr-2 h-4 w-4" /> Añadir Rango de Nivel
                            </Button>
                            <Button type="submit" className="w-full sm:w-auto" disabled={!form.formState.isDirty && form.formState.isValid}>
                                <Save className="mr-2 h-4 w-4" /> Guardar Rangos
                            </Button>
                        </div>
                         {fields.length >= 10 && <p className="text-xs text-muted-foreground text-center mt-2">Has alcanzado el límite máximo de 10 rangos.</p>}
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};

export default ManageLevelRangesForm;
