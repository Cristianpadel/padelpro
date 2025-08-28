"use client";

import React, { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, setHours, setMinutes, startOfDay, parse, addMinutes, getDay } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from "@/components/ui/switch";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from '@/lib/utils';
import { CalendarIcon, Loader2, CalendarPlus, Euro, Users, BarChart, Hash, Info, AlertCircle, Users2 } from 'lucide-react'; // Added Users2
import { useToast } from '@/hooks/use-toast';
import { addTimeSlot, getMockClubs, getMockPadelCourts, calculateActivityPrice, getInstructorRate } from '@/lib/mockData';
import type { User, TimeSlot, MatchPadelLevel, ClassPadelLevel, PadelLevelRange, Instructor as InstructorType, PadelCategoryForSlot, PadelCourt } from '@/types'; // Added PadelCategoryForSlot
import { matchPadelLevels, padelCategoryForSlotOptions, numericMatchPadelLevels, daysOfWeek as dayOfWeekArray } from '@/types'; // Added padelCategoryForSlotOptions and numericMatchPadelLevels
import { Label } from '@/components/ui/label';

interface AddClassFormProps {
  instructor: InstructorType; // Changed from User to InstructorType
  onClassAdded: (newSlot: TimeSlot) => void;
}

const formSchema = z.object({
  date: z.date({
    required_error: "Se requiere una fecha.",
  }).nullable(),
  startTime: z.string(),
  maxPlayers: z.coerce.number().int().min(1, "Mínimo 1 jugador.").max(4, "Máximo 4 jugadores."),
  isLevelAbierto: z.boolean().default(false),
  levelMin: z.enum(numericMatchPadelLevels).optional(), 
  levelMax: z.enum(numericMatchPadelLevels).optional(), 
  category: z.enum(['abierta', 'chica', 'chico'] as [PadelCategoryForSlot, ...PadelCategoryForSlot[]], { required_error: "Se requiere una categoría."}),
  courtNumber: z.coerce.number().int().min(1, "Número de pista inválido.").optional(), // Made optional
  clubId: z.string().min(1, "Debes seleccionar un club."),
}).refine(data => {
    if (data.isLevelAbierto) return true;
    if (!data.levelMin || !data.levelMax) return false;
    return parseFloat(data.levelMax) >= parseFloat(data.levelMin);
  }, {
    message: "El nivel máximo debe ser mayor o igual al nivel mínimo.",
    path: ["levelMax"],
  }).refine(data => data.isLevelAbierto || (data.levelMin && data.levelMax), {
    message: "Debes seleccionar un rango de nivel o marcar la clase como 'Nivel Abierto'.",
    path: ["isLevelAbierto"],
});


type FormData = z.infer<typeof formSchema>;

const timeOptions = Array.from({ length: 29 }, (_, i) => { 
    const hour = 8 + Math.floor(i / 2);
    const minute = (i % 2) * 30;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
});

const AddClassForm: React.FC<AddClassFormProps> = ({ instructor, onClassAdded }) => {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [availableCourtsForSelectedClub, setAvailableCourtsForSelectedClub] = useState<PadelCourt[]>([]);
  const memoizedMockClubs = React.useMemo(() => getMockClubs(), []);
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: null,
      startTime: "09:00",
      maxPlayers: 4,
      isLevelAbierto: true,
      levelMin: numericMatchPadelLevels[0],
      levelMax: numericMatchPadelLevels[numericMatchPadelLevels.length -1],
      category: 'abierta',
      courtNumber: instructor.assignedCourtNumber, 
      clubId: instructor.assignedClubId || (memoizedMockClubs.length > 0 ? memoizedMockClubs[0].id : undefined),
    },
  });

  const selectedClubId = form.watch("clubId");
  const isLevelAbierto = form.watch("isLevelAbierto");
  const watchedDate = form.watch('date');
  const watchedStartTime = form.watch('startTime');

  useEffect(() => {
    form.setValue('date', startOfDay(new Date()));
    if (instructor.assignedClubId && instructor.assignedClubId !== 'all') {
        form.setValue('clubId', instructor.assignedClubId);
        if (instructor.assignedCourtNumber !== undefined) { 
            form.setValue('courtNumber', instructor.assignedCourtNumber);
        }
    } else if (memoizedMockClubs.length > 0 && !form.getValues('clubId')) {
        form.setValue('clubId', memoizedMockClubs[0].id);
    }
  }, [form, memoizedMockClubs, instructor.assignedClubId, instructor.assignedCourtNumber]);

  useEffect(() => {
    if (selectedClubId) {
        const courtsOfClub = getMockPadelCourts()
            .filter(court => court.clubId === selectedClubId && court.isActive)
            .sort((a, b) => a.courtNumber - b.courtNumber);
        setAvailableCourtsForSelectedClub(courtsOfClub);

        if (instructor.assignedClubId === selectedClubId && instructor.assignedCourtNumber !== undefined) {
            form.setValue('courtNumber', instructor.assignedCourtNumber);
        } else if (courtsOfClub.length > 0) {
            const currentCourtVal = form.getValues('courtNumber');
            if (currentCourtVal === undefined || !courtsOfClub.some(c => c.courtNumber === currentCourtVal)) {
                 form.setValue('courtNumber', courtsOfClub[0].courtNumber);
            }
        } else {
             form.setValue('courtNumber', undefined);
        }
    } else {
        setAvailableCourtsForSelectedClub([]);
        form.setValue('courtNumber', undefined);
    }
  }, [selectedClubId, form, instructor.assignedClubId, instructor.assignedCourtNumber]);

  useEffect(() => {
    if (watchedDate && watchedStartTime && selectedClubId) {
      const club = memoizedMockClubs.find(c => c.id === selectedClubId);
      if (!club) return;
      const startTimeDate = setMinutes(setHours(watchedDate, parseInt(watchedStartTime.split(':')[0])), parseInt(watchedStartTime.split(':')[1]));
      
      const courtPrice = calculateActivityPrice(club, startTimeDate);
      const instructorRate = getInstructorRate(instructor, startTimeDate);
      const calculatedTotalPrice = courtPrice + instructorRate;
      
      setCalculatedPrice(calculatedTotalPrice > 0 ? calculatedTotalPrice : 0);
    } else {
        setCalculatedPrice(null);
    }
  }, [watchedDate, watchedStartTime, selectedClubId, instructor, memoizedMockClubs, form]);

  if (instructor.isAvailable === false) {
    return (
        <div className="p-4 border rounded-md bg-yellow-50 text-yellow-700 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>Actualmente no estás disponible. Activa tu disponibilidad en "Preferencias" para crear clases.</span>
        </div>
    );
  }

  const onSubmit = (values: FormData) => {
    if (!values.date) {
        toast({ title: 'Error de Validación', description: 'Por favor, selecciona una fecha para la clase.', variant: 'destructive' });
        return;
    }
    if (!instructor.isAvailable) {
        toast({ title: 'Instructor No Disponible', description: 'Debes marcarte como disponible en tus ajustes para crear clases.', variant: 'destructive' });
        return;
    }
    if (values.courtNumber === undefined) { 
        toast({ title: 'Error de Validación', description: 'Por favor, selecciona una pista.', variant: 'destructive' });
        return;
    }


    startTransition(async () => {
      try {
        let classLevel: ClassPadelLevel;
        if (values.isLevelAbierto) {
            classLevel = 'abierto';
        } else if (values.levelMin && values.levelMax) {
            classLevel = { min: values.levelMin, max: values.levelMax };
        } else {
            toast({ title: 'Error de Validación', description: 'Nivel de clase no definido correctamente.', variant: 'destructive' });
            return;
        }

        const [startHour, startMinute] = values.startTime.split(':').map(Number);
        const startTimeDate = setMinutes(setHours(values.date!, startHour), startMinute);
        const durationMinutes = 60;

        const clubIdToUse = values.clubId;
        if (!clubIdToUse) {
            toast({ title: 'Error', description: 'No se pudo determinar el club. Por favor, selecciona uno.', variant: 'destructive' });
            return;
        }

        const slotDataPayload = {
          clubId: clubIdToUse,
          startTime: startTimeDate,
          instructorId: instructor.id,
          maxPlayers: values.maxPlayers,
          courtNumber: values.courtNumber!, 
          level: classLevel,
          category: values.category,
          durationMinutes: durationMinutes,
        };

        const results = await addTimeSlot(slotDataPayload as any);

        const firstResult = Array.isArray(results) ? results[0] : results;
        const addedCount = Array.isArray(results) ? results.filter(r => !('error' in r)).length : ('error' in results ? 0 : 1);
        const errorCount = Array.isArray(results) ? results.filter(r => 'error' in r).length : ('error' in results ? 1 : 0);

        if (errorCount > 0) {
           const firstErrorResult = Array.isArray(results) ? (results.find(r => 'error' in r) as { error: string }) : ('error' in results ? results : null);
           toast({
             title: `Error al Añadir Clase`,
             description: firstErrorResult?.error || 'Se encontraron errores al añadir la clase.',
             variant: 'destructive',
           });
        }

         if (addedCount > 0) {
             const levelDisplay = typeof classLevel === 'string' ? classLevel : `${classLevel.min}-${classLevel.max}`;
             const categoryDisplay = padelCategoryForSlotOptions.find(opt => opt.value === values.category)?.label || values.category;
             toast({
               title: `¡Clase Añadida!`,
               description: `Se ha añadido 1 clase para el ${format(startTimeDate, "PPP 'a las' HH:mm", { locale: es })} (${durationMinutes} min) en Pista ${values.courtNumber} (Club ID: ${clubIdToUse}) con nivel: ${levelDisplay} y categoría: ${categoryDisplay}.`,
               className: 'bg-primary text-primary-foreground',
             });
             form.reset({
                date: startOfDay(new Date()),
                startTime: "09:00",
                maxPlayers: 4,
                isLevelAbierto: true,
                levelMin: numericMatchPadelLevels[0],
                levelMax: numericMatchPadelLevels[numericMatchPadelLevels.length -1],
                category: 'abierta',
                courtNumber: instructor.assignedCourtNumber,
                clubId: instructor.assignedClubId || (memoizedMockClubs.length > 0 ? memoizedMockClubs[0].id : undefined),
             });
             if (firstResult && !('error' in firstResult)) {
                onClassAdded(firstResult as TimeSlot);
             } else {
                 onClassAdded({} as TimeSlot);
             }
         }

      } catch (error) {
        console.error("Error adding class:", error);
        toast({
          title: 'Error Inesperado',
          description: 'Ocurrió un problema al añadir la clase.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Fecha</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, 'PPP', { locale: es })
                      ) : (
                        <span>Selecciona una fecha</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ?? undefined}
                    onSelect={field.onChange}
                    disabled={(date) => date < startOfDay(new Date())}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="startTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hora de Inicio</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                   <FormControl>
                      <SelectTrigger>
                         <SelectValue placeholder="Selecciona hora de inicio" />
                      </SelectTrigger>
                   </FormControl>
                   <SelectContent>
                     {timeOptions.map(time => (
                       <SelectItem key={time} value={time}>{time}</SelectItem>
                     ))}
                   </SelectContent>
                </Select>
              <FormDescription>Clases de 60 minutos de duración.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="clubId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Club</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={memoizedMockClubs.length === 0 || (!!instructor.assignedClubId && instructor.assignedClubId !== 'all')}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un club" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {memoizedMockClubs.length === 0 ? (
                    <SelectItem value="loading" disabled>No hay clubes disponibles</SelectItem>
                  ) : (
                    memoizedMockClubs.map(club => (
                      <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {instructor.assignedClubId && instructor.assignedClubId !== 'all' && <FormDescription className="text-xs text-blue-600">Club asignado por defecto.</FormDescription>}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="courtNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número de Pista</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value ? Number(value) : undefined)} 
                value={field.value !== undefined ? String(field.value) : ""} 
                disabled={availableCourtsForSelectedClub.length === 0 || !selectedClubId || (instructor.assignedClubId === selectedClubId && instructor.assignedCourtNumber !== undefined)}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona pista" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableCourtsForSelectedClub.length === 0 || !selectedClubId ? (
                     <SelectItem value="no-courts" disabled>
                        {selectedClubId ? "No hay pistas para este club" : "Selecciona un club primero"}
                     </SelectItem>
                  ) : (
                    availableCourtsForSelectedClub.map(court => (
                       <SelectItem key={court.id} value={String(court.courtNumber)}>{court.name || `Pista ${court.courtNumber}`}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {instructor.assignedClubId === selectedClubId && instructor.assignedCourtNumber !== undefined && <FormDescription className="text-xs text-blue-600">Pista asignada por defecto.</FormDescription>}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
            control={form.control}
            name="isLevelAbierto"
            render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-secondary/20">
                <div className="space-y-0.5">
                <FormLabel>Nivel Abierto</FormLabel>
                <FormDescription>
                    Si está activado, la clase será para todos los niveles.
                </FormDescription>
                </div>
                <FormControl>
                <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    aria-readonly
                />
                </FormControl>
            </FormItem>
            )}
        />

        {!isLevelAbierto && (
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="levelMin"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nivel Mínimo</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Mín." /></SelectTrigger></FormControl>
                        <SelectContent>
                            {numericMatchPadelLevels.map(levelValue => (
                            <SelectItem key={levelValue} value={levelValue}>{levelValue}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="levelMax"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nivel Máximo</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Máx." /></SelectTrigger></FormControl>
                        <SelectContent>
                            {numericMatchPadelLevels.map(levelValue => (
                            <SelectItem key={levelValue} value={levelValue}>{levelValue}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
        )}
        <FormMessage>{form.formState.errors.isLevelAbierto?.message || form.formState.errors.levelMax?.message}</FormMessage>

        <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
                <FormItem>
                    <FormLabel className="flex items-center"><Users2 className="mr-2 h-4 w-4 text-primary/80"/>Categoría de la Clase</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecciona una categoría" /></SelectTrigger></FormControl>
                        <SelectContent>
                            {padelCategoryForSlotOptions.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormDescription>La categoría de la clase. 'Abierta' se clasificará según el primer alumno.</FormDescription>
                    <FormMessage />
                </FormItem>
            )}
        />

        <FormField
          control={form.control}
          name="maxPlayers"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Máximo Jugadores (Pista)</FormLabel>
              <FormControl>
                <Input type="number" min="1" max="4" {...field} />
              </FormControl>
              <FormDescription>Capacidad máxima de la pista (normalmente 4).</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="p-3 border rounded-lg bg-muted/50">
            <Label>Precio Total Calculado</Label>
            <div className="text-2xl font-bold text-primary flex items-center mt-1">
                {calculatedPrice !== null ? (
                    <>
                        <Euro className="mr-2 h-6 w-6" />
                        {calculatedPrice.toFixed(2)}
                    </>
                ) : (
                    <span className="text-sm text-muted-foreground">Selecciona fecha y hora para calcular...</span>
                )}
            </div>
             <p className="text-xs text-muted-foreground mt-1">Este precio se calcula automáticamente sumando la tarifa de la pista y tu tarifa para la hora seleccionada.</p>
        </div>


        <Button type="submit" disabled={isPending || memoizedMockClubs.length === 0 || availableCourtsForSelectedClub.length === 0} className="w-full">
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CalendarPlus className="mr-2 h-4 w-4" />
          )}
          Añadir Clase
        </Button>
      </form>
    </Form>
  );
};

export default AddClassForm;
