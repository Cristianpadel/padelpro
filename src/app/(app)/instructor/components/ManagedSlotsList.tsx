"use client";

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import type { TimeSlot, Instructor } from '@/types';
import { getMockTimeSlots, cancelTimeSlot, toggleGratisSpot, removePlayerFromClass } from '@/lib/mockData';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { format, isFuture, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import InstructorBookingOption from './InstructorBookingOption';
import { isSlotEffectivelyCompleted } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


interface ManagedSlotsListProps {
  instructorId: string;
}

const ManagedSlotsList: React.FC<ManagedSlotsListProps> = ({ instructorId }) => {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [isProcessingAction, startActionTransition] = useTransition();
  const [processingActionKey, setProcessingActionKey] = useState<string | null>(null);
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    try {
      const allSlots = await getMockTimeSlots(instructorId); // This needs to be adapted if clubId is needed
      const instructorSlots = allSlots.filter(s => s.instructorId === instructorId);
      instructorSlots.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      setSlots(instructorSlots);
    } catch (err) {
      setError("No se pudieron cargar las clases.");
    } finally {
      setLoading(false);
    }
  }, [instructorId]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const handleCancelClass = (slotId: string) => {
    startActionTransition(async () => {
      setProcessingActionKey(`cancel-${slotId}`);
      const result = await cancelTimeSlot(slotId);
      if ('error' in result) {
        toast({ title: 'Error al cancelar', description: result.error, variant: 'destructive' });
      } else {
        toast({ title: 'Clase Cancelada', description: 'La clase ha sido eliminada del sistema.', className: 'bg-accent text-accent-foreground' });
        fetchSlots();
      }
      setProcessingActionKey(null);
    });
  };

  const handleToggleGratis = (slotId: string, optionSize: 1|2|3|4, spotIndex: number) => {
     startActionTransition(async () => {
        setProcessingActionKey(`gratis-${slotId}-${optionSize}-${spotIndex}`);
        const result = await toggleGratisSpot(slotId, optionSize, spotIndex);
         if ('error' in result) {
            toast({ title: 'Error', description: result.error, variant: 'destructive' });
        } else {
            fetchSlots();
        }
        setProcessingActionKey(null);
     });
  }

  const handleRemovePlayer = (slotId: string, userId: string, groupSize: 1|2|3|4) => {
    startActionTransition(async () => {
       setProcessingActionKey(`remove-${slotId}-${userId}-${groupSize}`);
       const result = await removePlayerFromClass(slotId, userId, groupSize);
       if ('error' in result) {
            toast({ title: 'Error al eliminar jugador', description: result.error, variant: 'destructive' });
       } else {
            toast({ title: 'Jugador Eliminado', description: `Se ha eliminado al jugador de la clase.` });
            fetchSlots();
       }
       setProcessingActionKey(null);
    });
  }

  const filteredSlots = slots.filter(slot => {
    const isFutureSlot = isFuture(new Date(slot.endTime));
    return filter === 'upcoming' ? isFutureSlot : !isFutureSlot;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error) return <p className="text-destructive text-center">{error}</p>;

  return (
    <div className="space-y-4">
       <Select value={filter} onValueChange={(value) => setFilter(value as 'upcoming' | 'past')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar clases" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="upcoming">Próximas</SelectItem>
            <SelectItem value="past">Pasadas</SelectItem>
          </SelectContent>
        </Select>

      {filteredSlots.length === 0 ? (
        <p className="text-muted-foreground text-center italic py-6">No hay clases en esta categoría.</p>
      ) : (
        <ScrollArea className="h-[600px] pr-2">
            <div className="space-y-4">
            {filteredSlots.map(slot => {
                const isCompleted = isSlotEffectivelyCompleted(slot).completed;
                const isCancelling = isProcessingAction && processingActionKey === `cancel-${slot.id}`;
                return (
                <div key={slot.id} className={cn("p-3 rounded-lg border", isCompleted ? "bg-green-50 border-green-200" : "bg-card")}>
                    <div className="flex justify-between items-start mb-2">
                        <div>
                        <p className="font-semibold">{format(new Date(slot.startTime), "EEEE, d 'de' MMMM", { locale: es })}</p>
                        <p className="text-sm text-muted-foreground">{format(new Date(slot.startTime), "HH:mm", { locale: es })} - {format(new Date(slot.endTime), "HH:mm", { locale: es })} en Pista {slot.courtNumber}</p>
                        </div>
                        { (isFuture(new Date(slot.startTime)) || isToday(new Date(slot.startTime))) && (
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm" disabled={isProcessingAction || isCancelling}>
                                        {isCancelling ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4"/>}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>¿Cancelar Clase?</AlertDialogTitle><AlertDialogDescription>Esta acción es irreversible y notificará a los alumnos inscritos (simulado).</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>No</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleCancelClass(slot.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Sí, Cancelar Clase</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                    {isCompleted && <Badge variant="secondary" className="mb-2 bg-green-200 text-green-800">Clase Confirmada</Badge>}
                    <div className="space-y-1">
                        {([1, 2, 3, 4] as const).map(optionSize => (
                            <InstructorBookingOption
                                key={optionSize}
                                slot={slot}
                                optionSize={optionSize}
                                playersInThisOption={(slot.bookedPlayers || []).filter(p => p.groupSize === optionSize)}
                                isSlotCompletedOverall={isCompleted}
                                isProcessingAction={isProcessingAction}
                                processingActionKey={processingActionKey}
                                onToggleGratis={handleToggleGratis}
                                onRemoveBooking={handleRemovePlayer}
                                onOpenStudentSelect={() => {}} // Placeholder for future functionality
                                isCancellingClass={isCancelling}
                            />
                        ))}
                    </div>
                </div>
                );
            })}
            </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default ManagedSlotsList;
