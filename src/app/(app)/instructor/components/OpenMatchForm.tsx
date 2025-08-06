"use client";

import React, { useState, useEffect, useTransition } from 'react';
import type { Club, PadelCourt, Match, MatchPadelLevel, PadelCategoryForSlot, User, Instructor } from '@/types';
import { matchPadelLevels, padelCategoryForSlotOptions } from '@/types';
import { Calendar } from "@/components/ui/calendar";
import { CalendarDays, Users2 as CategoryIcon } from "lucide-react"; 
import { format, addMinutes, startOfDay, setMinutes, setHours } from "date-fns";
import { es } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast';
import { addMatch, getMockStudents, getMockClubs, getMockPadelCourts } from '@/lib/mockData';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, PlayCircle } from 'lucide-react';
import { calculateActivityPrice } from '@/lib/mockData';

interface OpenMatchFormProps {
    instructor: Instructor;
    onMatchOpened: (match: Match) => void;
}

const matchSchema = z.object({
  date: z.date({ required_error: "Se requiere una fecha." }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato de hora inválido (HH:MM)."),
  courtNumber: z.coerce.number().int().min(1, "Pista inválida."),
  level: z.enum(matchPadelLevels as [string, ...string[]], { required_error: "Selecciona un nivel." }), 
  category: z.enum(['abierta', 'chica', 'chico'] as [PadelCategoryForSlot, ...PadelCategoryForSlot[]], { required_error: "Selecciona una categoría." }),
  totalCourtFee: z.coerce.number().min(0, "El precio no puede ser negativo.").optional(),
  clubId: z.string(),
});

type MatchFormData = z.infer<typeof matchSchema>;

const timeOptions = Array.from({ length: 28 }, (_, i) => { 
    const hour = 9 + Math.floor(i / 2);
    const minute = (i % 2) * 30;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
});

const OpenMatchForm: React.FC<OpenMatchFormProps> = ({ instructor, onMatchOpened }) => {
    const [students, setStudents] = useState<User[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(true);
    const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [availableCourts, setAvailableCourts] = useState<PadelCourt[]>([]);
    const [club, setClub] = useState<Club | null>(null);

    const form = useForm<MatchFormData>({
        resolver: zodResolver(matchSchema),
        defaultValues: {
            date: startOfDay(new Date()),
            startTime: "09:00",
            courtNumber: undefined,
            level: 'abierto',
            category: 'abierta',
            totalCourtFee: 0,
            clubId: instructor.assignedClubId,
        },
    });

    useEffect(() => {
        if (instructor.assignedClubId) {
            const currentClub = getMockClubs().find(c => c.id === instructor.assignedClubId);
            setClub(currentClub || null);
            const clubCourts = getMockPadelCourts().filter(c => c.clubId === instructor.assignedClubId && c.isActive);
            setAvailableCourts(clubCourts);
            if(clubCourts.length > 0 && !form.getValues('courtNumber')) {
                form.setValue('courtNumber', clubCourts[0].courtNumber);
            }
        }
    }, [instructor.assignedClubId, form]);

    const watchedDate = form.watch('date');
    const watchedStartTime = form.watch('startTime');

    useEffect(() => {
        if (club && watchedDate && watchedStartTime) {
            const [startHours, startMinutes] = watchedStartTime.split(':').map(Number);
            const startTimeDate = setMinutes(setHours(watchedDate, startHours), startMinutes);
            const price = calculateActivityPrice(club, startTimeDate);
            form.setValue('totalCourtFee', price, { shouldValidate: true });
        }
    }, [watchedDate, watchedStartTime, club, form]);

    useEffect(() => {
        const loadStudents = async () => {
            setLoadingStudents(true);
            try {
                const fetchedStudents = await getMockStudents();
                setStudents(fetchedStudents);
            } catch (err) {
                toast({ title: "Error", description: "No se pudieron cargar los alumnos.", variant: "destructive" });
            } finally {
                setLoadingStudents(false);
            }
        };
        loadStudents();
    }, [toast]);

    const handlePlayerSelection = (playerId: string) => {
        setSelectedPlayers(prev => {
            if (prev.includes(playerId)) {
                return prev.filter(id => id !== playerId);
            } else if (prev.length < 4) {
                return [...prev, playerId];
            } else {
                toast({ title: "Límite Alcanzado", description: "No puedes seleccionar más de 4 jugadores.", variant: "default" });
                return prev;
            }
        });
    };

    const onSubmit = (values: MatchFormData) => {
        startTransition(async () => {
            const [startHours, startMinutes] = values.startTime.split(':').map(Number);
            const startTimeDate = setMinutes(setHours(values.date, startHours), startMinutes);
            const endTimeDate = addMinutes(startTimeDate, 90);

            const bookedPlayersData = selectedPlayers.map(userId => {
                const player = students.find(s => s.id === userId);
                return { userId: userId, name: player?.name || 'Unknown', groupSize: 4 }; // Assuming groupSize 4 for matches
            });

            const newMatchData: Omit<Match, 'id' | 'status'> = {
                ...values,
                startTime: startTimeDate,
                endTime: endTimeDate,
                bookedPlayers: bookedPlayersData,
                isPlaceholder: false,
                durationMinutes: 90,
            };

            const result = await addMatch(newMatchData);

            if ('error' in result) {
                toast({ title: "Error al crear la partida", description: result.error, variant: "destructive" });
            } else {
                toast({ title: "Partida creada", description: "La partida se ha creado con éxito." });
                onMatchOpened(result);
                form.reset({
                     date: startOfDay(new Date()),
                    startTime: "09:00",
                    courtNumber: availableCourts.length > 0 ? availableCourts[0].courtNumber : undefined,
                    level: 'abierto',
                    category: 'abierta',
                    totalCourtFee: club ? calculateActivityPrice(club, new Date()) : 0,
                    clubId: club?.id,
                });
                setSelectedPlayers([]);
            }
        });
    };

    if (!instructor.assignedClubId || !club) {
        return <p className="text-muted-foreground p-4 text-center">Debes asignarte a un club en tus preferencias para abrir partidas.</p>;
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                 <FormField control={form.control} name="date" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>Fecha</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal",!field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPPP", { locale: es }) : (<span>Selecciona una fecha</span>)}<CalendarDays className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="center" side="bottom"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(d) => d < new Date(new Date().setHours(0,0,0,0))} initialFocus/></PopoverContent></Popover><FormMessage /></FormItem>)}/>
                <div className="flex space-x-4">
                    <FormField control={form.control} name="startTime" render={({ field }) => (<FormItem className="flex-1"><FormLabel>Hora de Inicio</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{timeOptions.map(time => (<SelectItem key={time} value={time}>{time}</SelectItem>))}</SelectContent></Select><FormDescription className="text-xs">Duración: 90 min.</FormDescription><FormMessage/></FormItem>)}/>
                    <FormField control={form.control} name="courtNumber" render={({ field }) => (<FormItem className="flex-1"><FormLabel>Pista</FormLabel><Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value)} disabled={availableCourts.length === 0}><FormControl><SelectTrigger><SelectValue placeholder="Pista"/></SelectTrigger></FormControl><SelectContent>{availableCourts.length > 0 ? (availableCourts.map(court => (<SelectItem key={court.id} value={String(court.courtNumber)}>{court.name}</SelectItem>))) : (<SelectItem value="no-courts" disabled>No hay pistas</SelectItem>)}</SelectContent></Select><FormMessage/></FormItem>)}/>
                </div>
                <div className="flex space-x-4">
                    <FormField control={form.control} name="level" render={({ field }) => (<FormItem className="flex-1"><FormLabel>Nivel</FormLabel><Select onValueChange={field.onChange} value={String(field.value)}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{[ 'abierto', ...matchPadelLevels].map(l => (<SelectItem key={l} value={l} className="capitalize">{l === 'abierto' ? 'Nivel Abierto' : l}</SelectItem>))}</SelectContent></Select><FormMessage/></FormItem>)}/>
                    <FormField control={form.control} name="category" render={({ field }) => (<FormItem className="flex-1"><FormLabel>Categoría</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{padelCategoryForSlotOptions.map(opt => (<SelectItem key={opt.value} value={opt.value} className="capitalize">{opt.label}</SelectItem>))}</SelectContent></Select><FormMessage/></FormItem>)}/>
                </div>
                <FormField control={form.control} name="totalCourtFee" render={({ field }) => (<FormItem><FormLabel>Precio Total Pista (€)</FormLabel><FormControl><Input type="number" min="0" step="0.01" {...field}/></FormControl><FormMessage/></FormItem>)}/>
                <div><FormLabel>Jugadores Pre-asignados (Opcional, máx. 4)</FormLabel>
                <ScrollArea className="h-[150px] w-full rounded-md border p-2 mt-1">
                    {loadingStudents ? <p>Cargando...</p> : students.length > 0 ? (<div className="space-y-1">{students.map(student => (
                        <div key={student.id} className="flex items-center space-x-2">
                        <Checkbox id={`player-${student.id}`} checked={selectedPlayers.includes(student.id)} onCheckedChange={() => handlePlayerSelection(student.id)} disabled={selectedPlayers.length >= 4 && !selectedPlayers.includes(student.id)}/>
                        <label htmlFor={`player-${student.id}`} className="text-sm font-normal">{student.name} (N: {student.level || '?'})</label>
                        </div>
                    ))}</div>) : (<p className="text-sm text-muted-foreground">No hay alumnos.</p>)}
                </ScrollArea></div>
                <Button type="submit" disabled={isPending || availableCourts.length === 0} className="w-full">
                    {isPending ? <Loader2 className="animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
                    Abrir Partida
                </Button>
            </form>
        </Form>
    );
};

export default OpenMatchForm;
