"use client";

import React, { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, setHours, setMinutes, startOfDay, addMinutes, getDay, parse } from 'date-fns';
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
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { CalendarIcon, Loader2, CalendarPlus, Users, Users2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addTimeSlot } from '@/lib/mockData';
import type { Club, Instructor, PadelCourt, TimeSlot, ClassPadelLevel, PadelCategoryForSlot } from '@/types';
import { padelCategoryForSlotOptions, numericMatchPadelLevels } from '@/types';

interface AddClassFormForAdminProps {
  club: Club;
  availableInstructors: Instructor[];
  clubPadelCourts: PadelCourt[];
  onClassAdded: (newSlot: TimeSlot) => void;
}

const formSchema = z.object({
  date: z.date({
    required_error: "Se requiere una fecha.",
  }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato de hora inválido (HH:MM)."),
  maxPlayers: z.coerce.number().int().min(1, "Mínimo 1 jugador.").max(4, "Máximo 4 jugadores."),
  isLevelAbierto: z.boolean().default(false),
  levelMin: z.enum(numericMatchPadelLevels).optional(), 
  levelMax: z.enum(numericMatchPadelLevels).optional(), 
  category: z.enum(['abierta', 'chica', 'chico'] as [PadelCategoryForSlot, ...PadelCategoryForSlot[]], { required_error: "Se requiere una categoría."}), 
  courtNumber: z.coerce.number().int().min(1, "Número de pista inválido.").optional(),
  instructorId: z.string().min(1, "Debes seleccionar un instructor."),
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

const AddClassFormForAdmin: React.FC<AddClassFormForAdminProps> = ({ club, availableInstructors, clubPadelCourts, onClassAdded }) => {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: startOfDay(new Date()),
      startTime: "09:00",
      maxPlayers: 4,
      isLevelAbierto: true,
      levelMin: numericMatchPadelLevels[0], 
      levelMax: numericMatchPadelLevels[numericMatchPadelLevels.length - 1], 
      category: 'abierta', 
      courtNumber: undefined, 
      instructorId: availableInstructors.length > 0 ? availableInstructors[0].id : undefined,
    },
  });
  
  const watchedIsLevelAbierto = form.watch("isLevelAbierto");
  const watchedInstructorId = form.watch("instructorId");


  useEffect(() => {
    if (availableInstructors.length > 0 && !form.getValues('instructorId')) {
        const firstInstructor = availableInstructors[0];
        form.setValue('instructorId', firstInstructor.id);
        setSelectedInstructor(firstInstructor);
        if (firstInstructor.assignedClubId === club.id && firstInstructor.assignedCourtNumber !== undefined) {
            form.setValue('courtNumber', firstInstructor.assignedCourtNumber, { shouldValidate: true });
        } else if (clubPadelCourts.length > 0) {
            form.setValue('courtNumber', clubPadelCourts[0].courtNumber, { shouldValidate: true });
        }
    }
  }, [club.id, clubPadelCourts, availableInstructors, form]);

  useEffect(() => {
    const instructor = availableInstructors.find(inst => inst.id === watchedInstructorId);
    setSelectedInstructor(instructor || null);
  }, [watchedInstructorId, availableInstructors]);

  useEffect(() => {
    if (watchedInstructorId) {
        const instructor = availableInstructors.find(inst => inst.id === watchedInstructorId);
        setSelectedInstructor(instructor || null);
        if (instructor?.assignedClubId === club.id && instructor?.assignedCourtNumber !== undefined) {
            form.setValue('courtNumber', instructor.assignedCourtNumber, { shouldValidate: true });
        } else if (clubPadelCourts.length > 0) {
            const currentCourt = form.getValues('courtNumber');
            if (!currentCourt || (instructor?.assignedClubId !== club.id) || (instructor.assignedClubId === club.id && instructor.assignedCourtNumber === undefined)) {
               if (clubPadelCourts.length > 0 && !clubPadelCourts.some(c => c.courtNumber === currentCourt)) {
                 form.setValue('courtNumber', clubPadelCourts[0].courtNumber, { shouldValidate: true });
               } else if (!currentCourt && clubPadelCourts.length > 0) {
                 form.setValue('courtNumber', clubPadelCourts[0].courtNumber, { shouldValidate: true });
               }
            }
        } else {
             form.setValue('courtNumber', undefined); 
        }
    } else {
        setSelectedInstructor(null);
        form.setValue('courtNumber', clubPadelCourts.length > 0 ? clubPadelCourts[0].courtNumber : undefined);
    }
  }, [watchedInstructorId, availableInstructors, club.id, clubPadelCourts, form]);

  const onSubmit = (values: FormData) => {
    if (!values.date) {
        toast({ title: 'Error de Validación', description: 'Por favor, selecciona una fecha para la clase.', variant: 'destructive' });
        return;
    }
    const instructor = availableInstructors.find(inst => inst.id === values.instructorId);
    if (!instructor) {
        toast({ title: 'Error', description: 'Instructor no válido.', variant: 'destructive' });
        return;
    }
    if (instructor.isAvailable === false) {
         toast({ title: 'Instructor No Disponible', description: `${instructor.name} no está disponible actualmente. Actualiza su estado en la gestión de instructores.`, variant: 'destructive', duration: 6000 });
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

        const slotDataPayload = {
          clubId: club.id,
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
               description: `Se ha añadido 1 clase para el ${format(startTimeDate, "PPP 'a las' HH:mm", { locale: es })} (${durationMinutes} min) en Pista ${values.courtNumber} con nivel: ${levelDisplay} y categoría: ${categoryDisplay}. Instructor: ${instructor.name}`,
               className: 'bg-primary text-primary-foreground',
             });
             
             const defaultInstructor = availableInstructors.length > 0 ? availableInstructors[0] : null;
             let defaultCourtForReset = clubPadelCourts.length > 0 ? clubPadelCourts[0].courtNumber : undefined;
             if(defaultInstructor && defaultInstructor.assignedClubId === club.id && defaultInstructor.assignedCourtNumber !== undefined) {
                defaultCourtForReset = defaultInstructor.assignedCourtNumber;
             }

             form.reset({
                date: startOfDay(new Date()),
                startTime: "09:00",
                maxPlayers: 4,
                isLevelAbierto: true,
                levelMin: numericMatchPadelLevels[0],
                levelMax: numericMatchPadelLevels[numericMatchPadelLevels.length - 1],
                category: 'abierta',
                courtNumber: defaultCourtForReset,
                instructorId: defaultInstructor ? defaultInstructor.id : undefined,
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
                    selected={field.value}
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
                <Select onValueChange={field.onChange} value={field.value}>
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
          name="instructorId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instructor</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={availableInstructors.length === 0}>
                   <FormControl>
                      <SelectTrigger>
                         <SelectValue placeholder="Selecciona un instructor" />
                      </SelectTrigger>
                   </FormControl>
                   <SelectContent>
                     {availableInstructors.length === 0 ? (
                       <SelectItem value="loading" disabled>No hay instructores disponibles</SelectItem>
                     ) : (
                       availableInstructors.map(inst => (
                         <SelectItem key={inst.id} value={inst.id} disabled={inst.isAvailable === false}>
                            {inst.name} {inst.isAvailable === false && "(No disponible)"}
                         </SelectItem>
                       ))
                     )}
                   </SelectContent>
                </Select>
                {selectedInstructor?.isAvailable === false && <FormDescription className="text-xs text-destructive">Este instructor no está disponible actualmente.</FormDescription>}
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
                disabled={clubPadelCourts.length === 0 || (selectedInstructor?.assignedClubId === club.id && selectedInstructor?.assignedCourtNumber !== undefined)}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona pista" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                   {clubPadelCourts.length === 0 ? (
                       <SelectItem value="loading" disabled>No hay pistas configuradas para este club</SelectItem>
                     ) : (
                        clubPadelCourts.map(court => (
                            <SelectItem key={court.id} value={String(court.courtNumber)}>{court.name} (Pista {court.courtNumber})</SelectItem>
                        ))
                     )}
                </SelectContent>
              </Select>
              {selectedInstructor?.assignedClubId === club.id && selectedInstructor?.assignedCourtNumber !== undefined && <FormDescription className="text-xs text-blue-600">Pista asignada por defecto para {selectedInstructor.name}.</FormDescription>}
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
                    Si está activado, el nivel de la clase se determinará por el primer alumno inscrito y los rangos del club.
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
        
        {!watchedIsLevelAbierto && (
            <div className="grid grid-cols-2 gap-4 p-4 border rounded-md bg-secondary/10">
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

        <Button type="submit" disabled={isPending || clubPadelCourts.length === 0 || availableInstructors.length === 0 || selectedInstructor?.isAvailable === false} className="w-full">
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

export default AddClassFormForAdmin;
