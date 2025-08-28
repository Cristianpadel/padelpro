"use client";

import React, { useTransition, useEffect, useState, useMemo } from 'react'; 
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, setHours, setMinutes, startOfDay, addDays, addMinutes, getDay } from 'date-fns'; 
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { CalendarIcon, Loader2, Users, BarChart, Hash, Euro, PlayCircle, Users2 as CategoryIcon } from 'lucide-react'; // Changed Users to CategoryIcon
import { useToast } from '@/hooks/use-toast';
import { addMatch, getMockClubs, getMockPadelCourts } from '@/lib/mockData';
import type { Match, Instructor, MatchPadelLevel, PadelCategoryForSlot, PadelCourt } from '@/types'; 
import { matchPadelLevels, padelCategoryForSlotOptions, daysOfWeek } from '@/types'; 

interface OpenMatchFormProps {
  instructor: Instructor;
  onMatchOpened: (newMatch: Match) => void;
}

const timeOptions = Array.from({ length: 28 }, (_, i) => { 
    const hour = 9 + Math.floor(i / 2);
    const minute = (i % 2) * 30;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
});

const matchSchema = z.object({
  date: z.date({ required_error: "Se requiere una fecha." }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato de hora inválido (HH:MM)."),
  courtNumber: z.coerce.number().int().min(1, "Pista inválida.").optional(),
  level: z.enum(matchPadelLevels as [MatchPadelLevel, ...MatchPadelLevel[]], { required_error: "Selecciona un nivel." }), 
  category: z.enum(['abierta', 'chica', 'chico'] as [PadelCategoryForSlot, ...PadelCategoryForSlot[]], { required_error: "Selecciona una categoría." }),
  totalCourtFee: z.coerce.number().min(0, "El precio no puede ser negativo.").optional(),
  clubId: z.string().min(1, "Debes seleccionar un club."), 
});

type MatchFormData = z.infer<typeof matchSchema>;

const OpenMatchForm: React.FC<OpenMatchFormProps> = ({ instructor, onMatchOpened }) => {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [availableCourtsForSelectedClub, setAvailableCourtsForSelectedClub] = useState<PadelCourt[]>([]);
  const memoizedMockClubs = useMemo(() => getMockClubs(), []);

  const form = useForm<MatchFormData>({
    resolver: zodResolver(matchSchema),
    defaultValues: {
      date: addDays(startOfDay(new Date()), 1), 
      startTime: "09:00",
      courtNumber: undefined,
      level: 'abierto', 
      category: 'abierta',
      totalCourtFee: 20,
      clubId: instructor.assignedClubId || (memoizedMockClubs.length > 0 ? memoizedMockClubs[0].id : undefined), 
    },
  });

  const selectedClubId = form.watch("clubId");
  const watchedDate = form.watch('date');
  const watchedStartTime = form.watch('startTime');

  useEffect(() => {
    if (memoizedMockClubs.length > 0 && !form.getValues('clubId')) {
        form.setValue('clubId', memoizedMockClubs[0].id);
    }
     if (instructor.assignedClubId) {
        form.setValue('clubId', instructor.assignedClubId);
    }
  }, [form, memoizedMockClubs, instructor.assignedClubId]);

  useEffect(() => {
    if (selectedClubId) {
        const courtsOfClub = getMockPadelCourts()
            .filter(court => court.clubId === selectedClubId && court.isActive)
            .sort((a, b) => a.courtNumber - b.courtNumber);
        setAvailableCourtsForSelectedClub(courtsOfClub);
    if (courtsOfClub.length > 0 && !courtsOfClub.some(c => c.courtNumber === form.getValues('courtNumber'))) {
      form.setValue('courtNumber', courtsOfClub[0].courtNumber);
    } else if (courtsOfClub.length === 0) {
       form.setValue('courtNumber', undefined); 
    }
    } else {
        setAvailableCourtsForSelectedClub([]); 
    }
  }, [selectedClubId, form]);

  useEffect(() => {
    const club = memoizedMockClubs.find(c => c.id === selectedClubId);
    if (watchedDate && watchedStartTime && club?.courtRateTiers) {
        const dayIndex = getDay(watchedDate);
        const dayOfWeek = daysOfWeek[dayIndex === 0 ? 6 : dayIndex - 1]; // Adjust for locale (Sunday is 0)
        const matchingTier = club.courtRateTiers.find(tier => 
            tier.days.includes(dayOfWeek) && 
            watchedStartTime >= tier.startTime && 
            watchedStartTime < tier.endTime
        );
        form.setValue('totalCourtFee', matchingTier ? matchingTier.rate : 20, { shouldValidate: true });
    }
  }, [watchedDate, watchedStartTime, selectedClubId, memoizedMockClubs, form]);


  const onSubmit = (values: MatchFormData) => {
    startTransition(async () => {
      try {
        if (values.courtNumber === undefined) {
          toast({ title: 'Falta seleccionar pista', description: 'Selecciona una pista disponible antes de abrir la partida.', variant: 'destructive' });
          return;
        }
        const [startHour, startMinute] = values.startTime.split(':').map(Number);
        const startTimeDate = setMinutes(setHours(values.date, startHour), startMinute);
        const endTimeDate = addMinutes(startTimeDate, 90); 

        const matchData: Omit<Match, 'id' | 'isPlaceholder' | 'status' | 'confirmedPrivateSize' | 'organizerId' | 'privateShareCode'> & { creatorId?: string } = {
          clubId: values.clubId,
          startTime: startTimeDate,
          endTime: endTimeDate,
          courtNumber: values.courtNumber,
          level: values.level,
          category: values.category,
          totalCourtFee: values.totalCourtFee,
          bookedPlayers: [],
          creatorId: instructor.id, 
          durationMinutes: 90,
        };

        const result = await addMatch(matchData);

        if ('error' in result) {
          toast({ title: 'Error al Abrir Partida', description: result.error, variant: 'destructive' });
        } else {
          toast({
            title: '¡Partida Abierta!',
            description: `La partida para el ${format(startTimeDate, "PPP 'a las' HH:mm", { locale: es })} ha sido abierta.`,
            className: 'bg-primary text-primary-foreground',
          });
          form.reset({
            date: addDays(startOfDay(new Date()), 1), 
            startTime: "09:00",
            courtNumber: availableCourtsForSelectedClub.length > 0 ? availableCourtsForSelectedClub[0].courtNumber : undefined,
            level: 'abierto', 
            category: 'abierta',
            totalCourtFee: 20,
            clubId: selectedClubId,
          });
          onMatchOpened(result);
        }
      } catch (error) {
        console.error("Error opening match:", error);
        toast({ title: 'Error Inesperado', description: 'Ocurrió un problema al abrir la partida.', variant: 'destructive' });
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="clubId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Club</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={memoizedMockClubs.length === 0 || !!instructor.assignedClubId}>
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
               {instructor.assignedClubId && <FormDescription className="text-xs text-blue-600">Club asignado por defecto.</FormDescription>}
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <SelectValue placeholder="Selecciona hora" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {timeOptions.map(time => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="text-xs text-muted-foreground">Duración: 90 minutos.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="courtNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center"><Hash className="mr-1 h-4 w-4"/>Pista</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(value ? Number(value) : undefined)} 
                  value={field.value !== undefined ? String(field.value) : ""}
                  disabled={availableCourtsForSelectedClub.length === 0 || !selectedClubId}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Nº Pista" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableCourtsForSelectedClub.length === 0 || !selectedClubId ? (
                        <SelectItem value="no-courts" disabled>
                            {selectedClubId ? "No hay pistas para este club" : "Selecciona un club primero"}
                        </SelectItem>
                    ) : (
                        availableCourtsForSelectedClub.map(court => (
                            <SelectItem key={court.id} value={String(court.courtNumber)}>{court.name} (Pista {court.courtNumber})</SelectItem>
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
            name="level"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center"><BarChart className="mr-1 h-4 w-4 -rotate-90"/>Nivel Sugerido</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Nivel" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {matchPadelLevels.map(level => ( 
                      <SelectItem key={level} value={level} className="capitalize">
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                <FormItem>
                    <FormLabel className="flex items-center"><CategoryIcon className="mr-1 h-4 w-4"/>Categoría</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue placeholder="Categoría" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {padelCategoryForSlotOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value} className="capitalize">{opt.label}</SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="totalCourtFee"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center"><Euro className="mr-1 h-4 w-4"/>Precio Total Pista (€)</FormLabel>
                        <FormControl>
                            <Input type="number" min="0" step="0.01" placeholder="Ej: 20.00" {...field} />
                        </FormControl>
                        <FormDescription className="text-xs text-muted-foreground">Precio total a dividir entre 4 jugadores.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        <Button type="submit" disabled={isPending || memoizedMockClubs.length === 0 || availableCourtsForSelectedClub.length === 0} className="w-full mt-8">
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <PlayCircle className="mr-2 h-4 w-4" />
          )}
          Abrir Partida
        </Button>
      </form>
    </Form>
  );
};

export default OpenMatchForm;
