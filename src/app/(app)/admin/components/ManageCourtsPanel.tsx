"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { PadelCourt } from '@/types';
import { updatePadelCourt, deletePadelCourt, fetchPadelCourtsByClub, addPadelCourt } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2, Edit, ListChecks, ToggleLeft, ToggleRight, ServerIcon, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription as FormFieldDescription } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

const courtFormSchema = z.object({
  courtNumber: z.coerce.number().int().min(1, "El número de pista debe ser al menos 1."),
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres.").max(50, "El nombre no puede exceder 50 caracteres."),
  capacity: z.enum(['2', '4'], {
    required_error: "Debes seleccionar la capacidad de la pista.",
  }).transform((val) => parseInt(val) as 2 | 4),
});
type CourtFormData = z.infer<typeof courtFormSchema>;

interface ManageCourtsPanelProps {
  clubId: string;
}

const ManageCourtsPanel: React.FC<ManageCourtsPanelProps> = ({ clubId }) => {
  const [courts, setCourts] = useState<PadelCourt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCourt, setEditingCourt] = useState<PadelCourt | null>(null);
  const [deletingCourt, setDeletingCourt] = useState<PadelCourt | null>(null);
  const { toast } = useToast();

  const form = useForm<CourtFormData>({
    resolver: zodResolver(courtFormSchema),
    defaultValues: { courtNumber: undefined, name: "", capacity: 4 },
  });

  const loadCourts = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedCourts = await fetchPadelCourtsByClub(clubId);
      fetchedCourts.sort((a, b) => a.courtNumber - b.courtNumber);
      setCourts(fetchedCourts);
      setError(null);
    } catch (err) {
      setError("No se pudieron cargar las pistas.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    loadCourts();
  }, [loadCourts]);

  const onSubmit = async (data: CourtFormData) => {
    setIsSubmitting(true);
    try {
      const courtPayload = {
        clubId,
        courtNumber: data.courtNumber,
        name: data.name,
        capacity: data.capacity,
      };
      if (editingCourt) {
        const result = await updatePadelCourt(editingCourt.id, courtPayload);
        if ('error' in result) throw new Error(result.error);
        toast({ title: "Pista Actualizada", description: `La ${result.name} ha sido actualizada.` });
      } else {
        const result = await addPadelCourt(courtPayload);
        if ('error' in result) throw new Error(result.error);
        toast({ title: "Pista Añadida", description: `La ${result.name} ha sido añadida.` });
      }
      form.reset({ courtNumber: undefined, name: "", capacity: 4 });
      setEditingCourt(null);
      loadCourts();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "No se pudo guardar la pista.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (court: PadelCourt) => {
    try {
      const result = await updatePadelCourt(court.id, { isActive: !court.isActive });
      if ('error' in result) throw new Error(result.error);
      toast({ title: `Pista ${result.isActive ? 'Activada' : 'Desactivada'}`, description: `${result.name} está ahora ${result.isActive ? 'activa' : 'inactiva'}.` });
      loadCourts();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "No se pudo cambiar el estado.", variant: "destructive" });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCourt) return;
    try {
      const result = await deletePadelCourt(deletingCourt.id);
      if ('error' in result) throw new Error(result.error);
      toast({ title: "Pista Eliminada", description: `${deletingCourt.name} ha sido eliminada.` });
      setDeletingCourt(null);
      loadCourts();
    } catch (err: any) {
      toast({ title: "Error al Eliminar", description: err.message || "No se pudo eliminar la pista.", variant: "destructive" });
    }
  };
  
  const startEdit = (court: PadelCourt) => {
    setEditingCourt(court);
    form.setValue("courtNumber", court.courtNumber);
    form.setValue("name", court.name);
    form.setValue("capacity", court.capacity);
  };

  const cancelEdit = () => {
    setEditingCourt(null);
    form.reset({ courtNumber: undefined, name: "", capacity: 4 });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              {editingCourt ? <Edit className="mr-2 h-5 w-5 text-primary" /> : <PlusCircle className="mr-2 h-5 w-5 text-primary" />}
              {editingCourt ? 'Editar Pista' : 'Añadir Nueva Pista'}
            </CardTitle>
            <CardDescription>
              {editingCourt ? 'Modifica los detalles de la pista.' : 'Registra una nueva pista para el club.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="courtNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Pista</FormLabel>
                      <FormControl><Input type="number" placeholder="Ej: 1" {...field} /></FormControl>
                      <FormFieldDescription>Identificador numérico único para la pista dentro del club.</FormFieldDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la Pista</FormLabel>
                      <FormControl><Input placeholder={`Ej: Pista Central`} {...field} /></FormControl>
                      <FormFieldDescription>Nombre descriptivo (e.g., Pista Central, Pista Cristal).</FormFieldDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacidad de Jugadores</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona capacidad" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="2">2 Jugadores (Singles)</SelectItem>
                          <SelectItem value="4">4 Jugadores (Dobles)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormFieldDescription>Número máximo de jugadores que pueden jugar simultáneamente en esta pista.</FormFieldDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex space-x-2 pt-2">
                  <Button type="submit" disabled={isSubmitting} className="flex-grow">
                    {isSubmitting ? "Guardando..." : (editingCourt ? "Guardar Cambios" : "Añadir Pista")}
                  </Button>
                  {editingCourt && (
                    <Button type="button" variant="outline" onClick={cancelEdit} disabled={isSubmitting}>Cancelar</Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg"><ListChecks className="mr-2 h-5 w-5 text-primary" /> Pistas Registradas ({courts.length})</CardTitle>
            <CardDescription>Visualiza y gestiona las pistas del club.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-md" />)}
              </div>
            )}
            {error && <p className="text-destructive py-4">{error}</p>}
            {!loading && !error && courts.length === 0 && (
              <p className="text-muted-foreground italic py-4 text-center">No hay pistas registradas para este club.</p>
            )}
            {!loading && !error && courts.length > 0 && (
              <ScrollArea className="h-[450px] pr-3">
                <ul className="space-y-3">
                  {courts.map(court => (
                    <li key={court.id} className={cn("flex items-center justify-between p-3 border rounded-lg transition-colors", court.isActive ? "bg-secondary/20 hover:bg-secondary/40" : "bg-muted/30 hover:bg-muted/50 opacity-70")}>
                      <div className="flex items-center space-x-3">
                        <ServerIcon className={cn("h-6 w-6", court.isActive ? "text-green-600" : "text-muted-foreground")} />
                        <div>
                          <p className="font-semibold text-base">{court.name}</p>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>Número: {court.courtNumber}</span>
                            <span className="flex items-center space-x-1">
                              <Users className="h-3 w-3" />
                              <span>{court.capacity} jugadores</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1" title={court.isActive ? "Pista Activa" : "Pista Inactiva"}>
                           <Switch
                             id={`active-${court.id}`}
                             checked={court.isActive}
                             onCheckedChange={() => handleToggleActive(court)}
                             aria-label={court.isActive ? "Desactivar Pista" : "Activar Pista"}
                           />
                           <Label htmlFor={`active-${court.id}`} className="text-xs cursor-pointer sr-only">
                             {court.isActive ? "Activa" : "Inactiva"}
                           </Label>
                           {court.isActive ? <ToggleRight className="h-5 w-5 text-green-600"/> : <ToggleLeft className="h-5 w-5 text-muted-foreground"/>}
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => startEdit(court)} className="h-8 w-8 text-muted-foreground hover:text-primary"><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeletingCourt(court)} className="text-destructive hover:bg-destructive/10 h-8 w-8"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
      <AlertDialog open={!!deletingCourt} onOpenChange={(open) => !open && setDeletingCourt(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Pista: {deletingCourt?.name}</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar la pista "{deletingCourt?.name}" (Número {deletingCourt?.courtNumber})?
              Esta acción no se puede deshacer. Las reservas existentes en esta pista podrían verse afectadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingCourt(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/80">Sí, Eliminar Pista</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ManageCourtsPanel;
