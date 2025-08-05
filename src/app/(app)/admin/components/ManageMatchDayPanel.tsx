"use client";

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, CalendarPlus, List, Check, HardHat, Users, ArrowRight, Euro, Edit, Trash2, Dices, Settings2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createMatchDayEvent, getMockPadelCourts, fetchActiveMatchDayEvents, getMatchDayInscriptions, deleteMatchDayEvent, manuallyTriggerMatchDayDraw } from '@/lib/mockData';
import type { Club, PadelCourt, MatchDayEvent } from '@/types';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import EditMatchDayEventDialog from './EditMatchDayEventDialog'; // Import the new dialog
import ManageMatchDayInscriptionsDialog from './ManageMatchDayInscriptionsDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


interface ManageMatchDayPanelProps {
  club: Club;
  onEventCreated: (event: MatchDayEvent) => void;
}

const formSchema = z.object({
  name: z.string().min(5, "El nombre debe tener al menos 5 caracteres."),
  eventDate: z.date({ required_error: "Se requiere una fecha." }),
  eventTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato HH:MM requerido."),
  eventEndTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato HH:MM requerido."),
  price: z.coerce.number().min(0, "El precio no puede ser negativo.").default(0),
  maxPlayers: z.coerce.number().int().min(4, "Mínimo 4 plazas.").max(100,"Máximo 100 plazas."),
  reservePlayers: z.coerce.number().int().min(0, "Debe ser 0 o más.").max(20, "Máximo 20 reservas."),
  courtIds: z.array(z.string()).min(1, "Debes seleccionar al menos una pista."),
}).refine(data => data.eventTime < data.eventEndTime, {
    message: "La hora de fin debe ser posterior a la de inicio.",
    path: ["eventEndTime"],
});

type FormData = z.infer<typeof formSchema>;

const ManageMatchDayPanel: React.FC<ManageMatchDayPanelProps> = ({ club, onEventCreated }) => {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [availableCourts, setAvailableCourts] = useState<PadelCourt[]>([]);
  const [activeEvents, setActiveEvents] = useState<MatchDayEvent[]>([]);
  const [inscriptionCounts, setInscriptionCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<MatchDayEvent | null>(null); // State for editing
  const [managingEvent, setManagingEvent] = useState<MatchDayEvent | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const courts = getMockPadelCourts().filter(c => c.clubId === club.id && c.isActive);
      setAvailableCourts(courts);

      const events = await fetchActiveMatchDayEvents(club.id);
      setActiveEvents(events);

      const counts: Record<string, number> = {};
      for (const event of events) {
          const inscriptions = await getMatchDayInscriptions(event.id);
          counts[event.id] = inscriptions.length;
      }
      setInscriptionCounts(counts);

    } catch (error) {
       toast({ title: "Error", description: "No se pudieron cargar los datos de eventos.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [club.id, toast]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: `Match-Day Semanal`,
      eventDate: addDays(new Date(), 7),
      eventTime: "10:00",
      eventEndTime: "13:00",
      price: 5,
      maxPlayers: 16,
      reservePlayers: 4,
      courtIds: [],
    },
  });
  
  const handleEventUpdated = () => {
    setEditingEvent(null);
    setManagingEvent(null);
    loadData(); // Refresh the list after an update
  };

  const handleDeleteEvent = (eventId: string) => {
    startTransition(async () => {
        const result = await deleteMatchDayEvent(eventId);
        if('error' in result) {
            toast({title: "Error al eliminar", description: result.error, variant: 'destructive'});
        } else {
            toast({title: "Evento Eliminado", description: "El evento Match-Day ha sido eliminado con éxito."});
            loadData();
        }
    });
  };

  const handleManualDraw = (eventId: string) => {
    startTransition(async () => {
      const result = await manuallyTriggerMatchDayDraw(eventId);
      if ('error' in result) {
        toast({ title: 'Error en el Sorteo', description: result.error, variant: 'destructive' });
      } else {
        toast({
          title: '¡Sorteo Realizado!',
          description: `Se han generado ${result.matchesCreated} partidas para el evento.`
        });
        loadData(); // Refresh to update event state
      }
    });
  };

  const onSubmit = (values: FormData) => {
    startTransition(async () => {
      try {
        const eventStartDateTime = new Date(values.eventDate);
        const [startHours, startMinutes] = values.eventTime.split(':').map(Number);
        eventStartDateTime.setHours(startHours, startMinutes, 0, 0);

        const eventEndDateTime = new Date(values.eventDate);
        const [endHours, endMinutes] = values.eventEndTime.split(':').map(Number);
        eventEndDateTime.setHours(endHours, endMinutes, 0, 0);


        const eventData = {
            clubId: club.id,
            name: values.name,
            eventDate: eventStartDateTime,
            eventEndTime: eventEndDateTime,
            price: values.price,
            maxPlayers: values.maxPlayers,
            reservePlayers: values.reservePlayers,
            courtIds: values.courtIds
        };
        
        const result = await createMatchDayEvent(eventData);

        if ('error' in result) {
          toast({ title: 'Error al Crear Evento', description: result.error, variant: 'destructive' });
        } else {
          toast({ title: '¡Evento Match-Day Creado!', description: `El evento "${result.name}" ha sido programado.` });
          form.reset();
          onEventCreated(result);
          loadData(); // Recargar la lista de eventos
        }
      } catch (error) {
        console.error("Error creating Match-Day event:", error);
        toast({ title: 'Error Inesperado', variant: 'destructive' });
      }
    });
  };

  return (
    <>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center"><CalendarPlus className="mr-2 h-5 w-5" /> Crear Nuevo Evento Match-Day</h3>
             <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre del Evento</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <div className="flex gap-4">
                        <FormField control={form.control} name="eventDate" render={({ field }) => (<FormItem className="flex flex-col flex-1"><FormLabel>Fecha del Evento</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP", { locale: es }) : <span>Elige fecha</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                    </div>
                     <div className="flex gap-4">
                        <FormField control={form.control} name="eventTime" render={({ field }) => (<FormItem className="flex-1"><FormLabel>Hora Inicio (HH:MM)</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="eventEndTime" render={({ field }) => (<FormItem className="flex-1"><FormLabel>Hora Fin (HH:MM)</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                     <div className="flex gap-4">
                        <FormField control={form.control} name="maxPlayers" render={({ field }) => (<FormItem className="flex-1"><FormLabel>Plazas Principales</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="reservePlayers" render={({ field }) => (<FormItem className="flex-1"><FormLabel>Plazas Reserva</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                     <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center"><Euro className="mr-1.5 h-4 w-4 text-muted-foreground"/>Precio de Inscripción (€)</FormLabel>
                                <FormControl>
                                    <Input type="number" min="0" step="0.5" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                     <FormField
                        control={form.control}
                        name="courtIds"
                        render={() => (
                            <FormItem>
                                <div className="mb-4">
                                    <FormLabel className="text-base flex items-center"><HardHat className="mr-2 h-4 w-4"/>Pistas a Utilizar</FormLabel>
                                    <FormDescription>Selecciona las pistas que se asignarán durante el sorteo.</FormDescription>
                                </div>
                                <ScrollArea className="h-32 w-full rounded-md border">
                                <div className="p-4 space-y-2">
                                {availableCourts.length === 0 && <p className="text-sm text-muted-foreground">No hay pistas activas en este club.</p>}
                                {availableCourts.map((court) => (
                                    <FormField key={court.id} control={form.control} name="courtIds"
                                    render={({ field }) => {
                                        return (
                                        <FormItem key={court.id} className="flex flex-row items-start space-x-3 space-y-0">
                                            <FormControl>
                                            <Checkbox
                                                checked={field.value?.includes(court.id)}
                                                onCheckedChange={(checked) => {
                                                return checked
                                                    ? field.onChange([...(field.value || []), court.id])
                                                    : field.onChange(
                                                        (field.value || []).filter(
                                                        (value) => value !== court.id
                                                        )
                                                    )
                                                }}
                                            />
                                            </FormControl>
                                            <FormLabel className="font-normal">{court.name} (Pista {court.courtNumber})</FormLabel>
                                        </FormItem>
                                        )
                                    }}
                                    />
                                ))}
                                </div>
                                </ScrollArea>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                    <Button type="submit" disabled={isPending || availableCourts.length === 0}>
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                        Crear Evento
                    </Button>
                </form>
            </Form>
        </div>
        <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center"><List className="mr-2 h-5 w-5" /> Eventos Activos</h3>
            <ScrollArea className="h-[450px] pr-2">
                <div className="space-y-3">
                {loading ? (
                    <p className="text-muted-foreground">Cargando eventos...</p>
                ) : activeEvents.length === 0 ? (
                    <div className="p-4 border rounded-md text-center text-muted-foreground italic">
                        No hay eventos Match-Day activos o programados.
                    </div>
                ) : (
                    activeEvents.map(event => (
                        <Card key={event.id}>
                            <CardContent className="p-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold text-sm">{event.name}</p>
                                        <p className="text-xs text-muted-foreground">{format(new Date(event.eventDate), "EEEE, d MMM, HH:mm'h'", { locale: es })}</p>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                         <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setManagingEvent(event)}>
                                            <Settings2 className="h-4 w-4"/>
                                        </Button>
                                        {!event.matchesGenerated && (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="outline" size="icon" className="h-7 w-7"><Dices className="h-4 w-4"/></Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>¿Realizar Sorteo Manual?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Esta acción generará las partidas para este evento inmediatamente. Los usuarios serán notificados. ¿Continuar?
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleManualDraw(event.id)}>Sí, Sortear Ahora</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        )}
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingEvent(event)}><Edit className="h-4 w-4"/></Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4"/></Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                                                    <AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará el evento y se notificará a los inscritos (simulado).</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteEvent(event.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                    <Badge variant="outline" className="flex items-center"><Users className="h-3 w-3 mr-1"/> {inscriptionCounts[event.id] || 0} / {event.maxPlayers}</Badge>
                                    <Link href={`/match-day/${event.id}`} passHref>
                                        <Button size="xs" variant="ghost">Ver <ArrowRight className="ml-1 h-3 w-3"/></Button>
                                    </Link>
                                </div>
                                 {event.matchesGenerated && (
                                    <Badge variant="secondary" className="mt-2 text-xs bg-green-100 text-green-800">
                                        Sorteo Realizado
                                    </Badge>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
                </div>
            </ScrollArea>
        </div>
    </div>

    {editingEvent && (
        <EditMatchDayEventDialog
            event={editingEvent}
            isOpen={!!editingEvent}
            onOpenChange={(open) => { if (!open) setEditingEvent(null); }}
            availableCourts={availableCourts}
            onEventUpdated={handleEventUpdated}
        />
    )}
     {managingEvent && (
        <ManageMatchDayInscriptionsDialog
            event={managingEvent}
            isOpen={!!managingEvent}
            onOpenChange={(open) => { if (!open) setManagingEvent(null); }}
            onEventUpdated={handleEventUpdated}
        />
    )}
    </>
  );
};

export default ManageMatchDayPanel;
