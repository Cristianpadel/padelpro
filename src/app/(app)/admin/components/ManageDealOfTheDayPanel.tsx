"use client";

import React, { useTransition, useState } from 'react';
import type { Club, Product } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { updateProduct } from '@/lib/mockData';
import { Sparkles, Save, Loader2, Percent } from 'lucide-react';

interface ManageDealOfTheDayPanelProps {
    club: Club;
    allClubProducts: Product[];
    onSettingsUpdated: (updatedClub: Club) => void;
}

const formSchema = z.object({
  productId: z.string().min(1, "Debes seleccionar un producto."),
  discountPercentage: z.coerce.number().min(0, "El descuento no puede ser negativo.").max(99, "El descuento máximo es 99%."),
});

type FormData = z.infer<typeof formSchema>;

const ManageDealOfTheDayPanel: React.FC<ManageDealOfTheDayPanelProps> = ({ club, allClubProducts, onSettingsUpdated }) => {
    const { toast } = useToast();
    const [isSaving, startTransition] = useTransition();

    const currentDeal = allClubProducts.find(p => p.isDealOfTheDay);

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            productId: currentDeal?.id || '',
            discountPercentage: currentDeal?.discountPercentage || 0,
        },
    });

    const onSubmit = async (data: FormData) => {
        startTransition(async () => {
            // First, remove the deal flag from the old deal product if it exists and is different
            if (currentDeal && currentDeal.id !== data.productId) {
                await updateProduct(currentDeal.id, { isDealOfTheDay: false, discountPercentage: 0 });
            }

            // Then, set the new product as the deal of the day
            const result = await updateProduct(data.productId, {
                isDealOfTheDay: true,
                discountPercentage: data.discountPercentage,
            });

            if ('error' in result) {
                toast({ title: "Error al actualizar la oferta", description: result.error, variant: "destructive" });
            } else {
                toast({ title: "¡Oferta del Día Actualizada!", description: `"${result.name}" es ahora la oferta del día.`, className: "bg-primary text-primary-foreground" });
                onSettingsUpdated(club); // Trigger a refresh in the parent
            }
        });
    };

    return (
        <Card className="mt-6 border-amber-400 border-2 shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center text-lg text-amber-700">
                    <Sparkles className="mr-2 h-5 w-5" />
                    Gestionar Oferta del Día
                </CardTitle>
                <CardDescription>
                    Selecciona un producto para destacarlo como la oferta especial del día con un descuento.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="productId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Producto en Oferta</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={allClubProducts.length === 0}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona un producto..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {allClubProducts.length === 0 ? (
                                                <SelectItem value="none" disabled>No hay productos en la tienda</SelectItem>
                                            ) : (
                                                allClubProducts.map(p => (
                                                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.offerPrice.toFixed(2)}€)</SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="discountPercentage"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Porcentaje de Descuento (%)</FormLabel>
                                    <div className="relative">
                                        <Input type="number" min="0" max="99" {...field} className="pr-8"/>
                                        <Percent className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    </div>
                                    <FormDescription>El descuento se aplicará sobre el Precio de Oferta.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={isSaving || allClubProducts.length === 0}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            <Save className="mr-2 h-4 w-4"/>
                            Guardar Oferta
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};

export default ManageDealOfTheDayPanel;
