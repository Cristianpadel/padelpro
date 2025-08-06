"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { TimeSlot, Booking, User as StudentUser, ClassPadelLevel } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { List, Clock, Users, CalendarCheck, CalendarX, Loader2, BarChart, Hash, Euro, CheckCircle, PlusCircle, Gift, Users2, Venus, Mars } from 'lucide-react';
import { format, isSameDay, startOfDay, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { getMockTimeSlots, getMockInstructors, isSlotEffectivelyCompleted, cancelClassByInstructor, updateTimeSlotInState, removeBookingFromTimeSlotInState, toggleGratisSpot } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import InstructorBookingOption from './InstructorBookingOption';
import { displayClassLevel, displayClassCategory } from '@/types';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useTransition } from 'react';

interface ManagedSlotsListProps {
  instructorId: string;
}


const ManagedSlotsList: React.FC<ManagedSlotsListProps> = ({ instructorId }) => {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [isProcessing, startTransition] = useTransition();
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const { toast } = useToast();

  const dateStripDates = useMemo(() => {
    const todayAnchor = startOfDay(new Date());
    return Array.from({ length: 15 }, (_, i) => addDays(todayAnchor, i));
  }, []);

  useEffect(() => {
    const loadSlots = async () => {
      try {
        setLoading(true);
        let fetchedSlots = await getMockTimeSlots();
        // Filter by instructor
        const instructor = (await getMockInstructors()).find(i => i.id === instructorId);
        if (instructor) {
            fetchedSlots = fetchedSlots.filter(slot => slot.instructorId === instructor.id);
        } else {
            fetchedSlots = [];
        }
        
        // Filter by selected date
        fetchedSlots = fetchedSlots.filter(slot => isSameDay(new Date(slot.startTime), selectedDate));
        
        // Sort remaining slots
        fetchedSlots.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        
        setSlots(fetchedSlots.map(s => ({
            ...s,
            designatedGratisSpotPlaceholderIndexForOption: s.designatedGratisSpotPlaceholderIndexForOption || {},
        })));
        setError(null);
      } catch (err) {
        console.error("Failed to fetch instructor time slots:", err);
        setError("No se pudieron cargar tus clases. Inténtalo de nuevo.");
      } finally {
        setLoading(false);
      }
    };
    loadSlots();
  }, [instructorId, refreshKey, selectedDate]);

  const handleRemoveBookingCallback = (slotId: string, userId: string, groupSize: 1 | 2 | 3 | 4) => {
    const actionKey = `remove-${slotId}-${userId}-${groupSize}`;
    setProcessingAction(actionKey);
    startTransition(async () => {
        try {
            const result = await removeBookingFromTimeSlotInState(slotId, userId, groupSize);
             if ('error' in result) {
                toast({ title: 'Error al Eliminar', description: result.error, variant: 'destructive' });
             } else {
                 toast({ title: 'Reserva Eliminada', description: 'Se ha eliminado la inscripción del alumno.', className: 'bg-accent text-accent-foreground' });
                 setRefreshKey(prev => prev + 1);
             }
        } catch (err) {
             console.error("Error removing booking:", err);
             toast({ title: 'Error Inesperado', description: 'Ocurrió un problema al eliminar la reserva.', variant: 'destructive' });
        } finally {
            setProcessingAction(null);
        }
    });
  };

  const handleOpenStudentSelectCallback = (slot: TimeSlot, optionSize: 1 | 2 | 3 | 4, spotIndexVisual: number) => {
    toast({
        title: "Información",
        description: "La inscripción de alumnos se realiza individualmente por ellos.",
        duration: 4000,
    });
  };

  const handleToggleGratisCallback = (slotId: string, optionSize: 1 | 2 | 3 | 4, spotIndexVisual: number) => {
    const actionKey = `gratis-${slotId}-${optionSize}-${spotIndexVisual}`;
    setProcessingAction(actionKey);
    startTransition(async () => {
      const slotToUpdate = slots.find(s => s.id === slotId);
      if (!slotToUpdate) {
        toast({ title: 'Error', description: 'No se encontró la clase para actualizar.', variant: 'destructive' });
        setProcessingAction(null);
        return;
      }
      
      try {
        await toggleGratisSpot(slotId, optionSize, spotIndexVisual);
        toast({ title: 'Estado de Plaza Gratis Actualizado', description: 'Se ha cambiado el estado de la plaza.', className: 'bg-primary text-primary-foreground' });
        setRefreshKey(prev => prev + 1);
      } catch (err: any) {
         toast({ title: 'Error', description: err.message || 'No se pudo actualizar la plaza.', variant: 'destructive' });
      } finally {
        setProcessingAction(null);
      }
    });
  };

  const handleCancelClass = (slotId: string) => {
    const actionKey = `cancel-class-${slotId}`;
    setProcessingAction(actionKey);
    startTransition(async () => {
      try {
        const result = await cancelClassByInstructor(slotId);
        if ('error' in result) {
            toast({ title: "Error al Cancelar Clase", description: result.error, variant: "destructive" });
        } else {
            toast({ title: "Clase Cancelada", description: result.message, className: "bg-destructive text-destructive-foreground", duration: 7000 });
            setRefreshKey(prevKey => prevKey + 1);
        }
      } catch (error) {
        toast({ title: "Error al Cancelar", description: "No se pudo cancelar la clase.", variant: "destructive" });
      } finally {
        setProcessingAction(null);
      }
    });
  };
  
  const renderSlotItem = (slot: TimeSlot) => {
    const slotLevel = slot.level || 'abierto';
    const slotCategory = slot.category || 'abierta';
    const courtNumber = slot.courtNumber || 'N/A';
    const { completed: isSlotCompletedOverall, size: completedClassSizeOverall } = isSlotEffectivelyCompleted(slot);
    const isPreInscripcion = false; // Placeholder for promotion logic
    const cancelClassActionKey = `cancel-class-${slot.id}`;
    const isCancellingThisClass = processingAction === cancelClassActionKey;
    const canCancelClass = !isPreInscripcion;

    const CategoryIcon = slotCategory === 'chica' ? Venus : slotCategory === 'chico' ? Mars : Users2;
    const categoryColorClass = slotCategory === 'chica' ? 'text-pink-600 border-pink-300 bg-pink-50' :
                             slotCategory === 'chico' ? 'text-sky-600 border-sky-300 bg-sky-50' :
                             'text-indigo-600 border-indigo-300 bg-indigo-50';

    return (
      <Card key={slot.id} className="bg-secondary/30 overflow-hidden flex flex-col">
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-start space-x-3.5">
            <div className="flex-shrink-0 mt-1"><CalendarCheck className="h-5 w-5 text-primary" /></div>
            <div className="flex-grow space-y-1">
              <div className="flex flex-col items-start space-y-1 md:flex-row md:items-center md:justify-between md:space-y-0">
                <div className="flex items-center flex-wrap">
                  <p className="font-medium capitalize">{format(new Date(slot.startTime), "eeee, d 'de' MMMM", { locale: es })}</p>
                  {isSlotCompletedOverall && completedClassSizeOverall && (<Badge variant="default" className="ml-2 text-xs bg-green-600 text-white border-green-700 hover:bg-green-700"><CheckCircle className="mr-1 h-3 w-3" />Clase Confirmada ({completedClassSizeOverall}p)</Badge>)}
                  {isPreInscripcion && !isSlotCompletedOverall && (<Badge variant="outline" className="ml-2 text-xs border-blue-500 bg-blue-50 text-blue-700">Pre-inscripción Activa</Badge>)}
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs flex items-center whitespace-nowrap"><BarChart className="mr-1 h-3 w-3 -rotate-90" />{displayClassLevel(slotLevel)}</Badge>
                  <Badge variant="outline" className={cn("text-xs flex items-center whitespace-nowrap", slotCategory !== 'abierta' && categoryColorClass)}><CategoryIcon className="mr-1 h-3 w-3" />{displayClassCategory(slotCategory)}</Badge>
                  <Badge variant="outline" className="text-xs flex items-center"><Hash className="mr-1 h-3 w-3" />Pista {courtNumber}</Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground flex items-center flex-wrap"><Clock className="h-4 w-4 mr-1.5" />{`${format(new Date(slot.startTime), 'HH:mm', { locale: es })} - ${format(new Date(slot.endTime), 'HH:mm', { locale: es })}`}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pt-2 pb-3 flex-grow">
          <div className="space-y-1.5 mt-2">
            {([1, 2, 3, 4] as const).map(optionSize => (
              <InstructorBookingOption
                key={`${slot.id}-${optionSize}`}
                slot={slot}
                optionSize={optionSize}
                playersInThisOption={(slot.bookedPlayers || []).filter(p => p.groupSize === optionSize)}
                isSlotCompletedOverall={isSlotCompletedOverall}
                isProcessingAction={isProcessing}
                processingActionKey={processingAction}
                onOpenStudentSelect={handleOpenStudentSelectCallback}
                onToggleGratis={handleToggleGratisCallback}
                onRemoveBooking={handleRemoveBookingCallback}
                isCancellingClass={isCancellingThisClass}
              />
            ))}
          </div>
        </CardContent>
        <CardFooter className="px-4 py-3 border-t mt-auto">
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="destructive" className="w-full sm:w-auto" disabled={isProcessing || isCancellingThisClass || !canCancelClass} aria-label="Cancelar Clase">{isCancellingThisClass ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarX className="mr-2 h-4 w-4" />}Cancelar Clase</Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>¿Estás seguro de que quieres cancelar esta clase?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. La clase se eliminará de la lista y los alumnos inscritos (si los hay) serán reembolsados (simulado).<br/> <br/><strong>Clase:</strong> {format(new Date(slot.startTime), "eeee, d 'de' MMMM, HH:mm", { locale: es })} - Pista {courtNumber}</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel disabled={isCancellingThisClass}>Volver</AlertDialogCancel><AlertDialogAction onClick={() => handleCancelClass(slot.id)} disabled={isCancellingThisClass} className="bg-destructive hover:bg-destructive/90">{(isProcessing && isCancellingThisClass) ? <Loader2 className="animate-spin" /> : "Sí, Cancelar Clase"}</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    );
  }

  if (loading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-lg" />)}</div>;
  if (error) return <div className="text-destructive p-4">{error}</div>;


  return (
    <div className="space-y-4">
      <div className="mb-4">
          <ScrollArea className="w-full whitespace-nowrap pb-2 -mx-1">
              <div className="flex items-center space-x-2 px-1">
                  {dateStripDates.map(day => {
                      const isSelected = isSameDay(day, selectedDate);
                      return (
                      <Button key={day.toISOString()} variant={isSelected ? "default" : "outline"} size="sm"
                          className={cn(
                              "h-auto px-2 py-1 flex flex-col items-center justify-center leading-tight shadow-sm",
                              isSameDay(day, new Date()) && !isSelected && "border-primary text-primary font-semibold",
                              isSelected && "shadow-md"
                          )}
                          onClick={() => setSelectedDate(day)}
                      >
                          <span className="font-bold text-xs uppercase">{format(day, "EEE", { locale: es }).slice(0, 3)}</span>
                          <span className="text-lg font-bold my-0.5">{format(day, "d", { locale: es })}</span>
                          <span className="text-xs text-muted-foreground capitalize">{format(day, "MMM", { locale: es }).slice(0,3)}</span>
                      </Button>
                      );
                  })}
              </div>
              <ScrollBar orientation="horizontal" className="h-2 mt-1" />
          </ScrollArea>
      </div>

      {slots.length === 0 ? (<p className="text-muted-foreground italic text-center py-4">No tienes clases publicadas para el día seleccionado.</p>) : (<div className="space-y-3">{slots.map(renderSlotItem)}</div>)}
    </div>
  );
};

export default React.memo(ManagedSlotsList);
