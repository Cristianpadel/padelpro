"use client";

import React, { useState, useTransition } from 'react';
import type { Club, CardShadowEffectSettings } from '@/types';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { updateClub } from '@/lib/mockData';
import { Palette, Save, Loader2 } from 'lucide-react';

interface ManageCardStylesPanelProps {
    club: Club;
    onSettingsUpdated: (updatedClub: Club) => void;
}

const formSchema = z.object({
    enabled: z.boolean(),
    color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Debe ser un código de color hexadecimal válido (ej: #a855f7)."),
    intensity: z.array(z.number().min(0).max(100)).length(1),
});

type FormData = z.infer<typeof formSchema>;

const hexToRgba = (hex: string, alpha: number) => {
    let c: any;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        if (c.length == 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return `rgba(${[(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',')},${alpha})`;
    }
    // Return a default color if hex is invalid to avoid crashing
    return 'rgba(0,0,0,0)';
};


const ManageCardStylesPanel: React.FC<ManageCardStylesPanelProps> = ({ club, onSettingsUpdated }) => {
    const { toast } = useToast();
    const [isSaving, startTransition] = useTransition();

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            enabled: club.cardShadowEffect?.enabled ?? true,
            color: club.cardShadowEffect?.color ?? '#a855f7',
            intensity: [club.cardShadowEffect?.intensity !== undefined ? club.cardShadowEffect.intensity * 100 : 50],
        }
    });

    const watchedColor = form.watch("color");
    const watchedIntensity = form.watch("intensity")[0];
    const isColorValid = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(watchedColor);

    const previewStyle = form.watch("enabled") && isColorValid
        ? { boxShadow: `0 0 25px ${hexToRgba(watchedColor, watchedIntensity / 100)}` }
        : {};

    const onSubmit = (data: FormData) => {
        startTransition(async () => {
            const newSettings: CardShadowEffectSettings = {
                enabled: data.enabled,
                color: data.color,
                intensity: data.intensity[0] / 100,
            };

            const result = await updateClub(club.id, { cardShadowEffect: newSettings });

            if ('error' in result) {
                toast({ title: "Error al guardar estilos", description: result.error, variant: "destructive" });
            } else {
                toast({ title: "Estilos Actualizados", description: "La apariencia de las tarjetas ha sido guardada." });
                onSettingsUpdated(result);
            }
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center text-lg"><Palette className="mr-2 h-5 w-5 text-primary" /> Estilos de Tarjetas</CardTitle>
                <CardDescription>Personaliza el efecto de resplandor en las tarjetas de clases y partidas.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="enabled"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-secondary/20">
                                    <div className="space-y-0.5">
                                        <FormLabel>Activar Resplandor</FormLabel>
                                        <FormMessage />
                                    </div>
                                    <FormControl>
                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="color"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Color del Resplandor</FormLabel>
                                    <div className="flex items-center gap-2">
                                        <FormControl>
                                            <Input type="text" placeholder="#a855f7" {...field} className="w-24"/>
                                        </FormControl>
                                        <Input type="color" value={isColorValid ? field.value : '#000000'} onChange={field.onChange} className="h-10 w-10 p-1 cursor-pointer" />
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="intensity"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Intensidad del Resplandor: {field.value}%</FormLabel>
                                    <FormControl>
                                        <Slider
                                            min={0} max={100} step={1}
                                            defaultValue={field.value}
                                            onValueChange={field.onChange}
                                        />
                                    </FormControl>
                                     <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={isSaving || !form.formState.isDirty}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            <Save className="mr-2 h-4 w-4"/>
                            Guardar Estilos
                        </Button>
                    </form>
                </Form>
                 <div className="flex flex-col items-center justify-center pt-6">
                    <Label className="text-muted-foreground mb-4">Vista Previa</Label>
                    <div className="relative w-48 h-64 bg-card rounded-lg border flex items-center justify-center transition-all duration-300" style={previewStyle}>
                        <p className="text-sm font-medium text-center">Tarjeta de Ejemplo</p>
                    </div>
                 </div>
            </CardContent>
        </Card>
    );
};

export default ManageCardStylesPanel;
