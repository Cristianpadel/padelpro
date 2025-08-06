import { Button } from '@/components/ui/button';
import { ClassCard } from './components/ClassCard';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { TimeSlot } from '@/types';
import { addHours, startOfDay } from 'date-fns';

const today = startOfDay(new Date());

const sampleClasses: {classInfo: TimeSlot, instructor: any, availableCourts: number}[] = [
  {
    instructor: {
      name: 'Sofía Martín',
      avatar: 'https://placehold.co/40x40.png',
      rating: 4.6,
    },
    classInfo: {
        id: 'slot-1',
        clubId: 'club-1',
        startTime: addHours(today, 10),
        endTime: addHours(today, 11),
        durationMinutes: 60,
        instructorId: 'inst-1',
        instructorName: 'Sofía Martín',
        maxPlayers: 4,
        courtNumber: 2,
        level: 'abierto',
        category: 'abierta',
        status: 'forming',
        bookedPlayers: [{userId: 'user-2', name: 'Beatriz Reyes'}]
    },
    availableCourts: 8,
  },
  {
    instructor: {
      name: 'Carlos López',
      avatar: 'https://placehold.co/40x40.png',
      rating: 4.8,
    },
    classInfo: {
        id: 'slot-2',
        clubId: 'club-1',
        startTime: addHours(today, 11),
        endTime: addHours(today, 12),
        durationMinutes: 60,
        instructorId: 'inst-2',
        instructorName: 'Carlos López',
        maxPlayers: 4,
        courtNumber: 3,
        level: {min: '2.5', max: '3.5'},
        category: 'chico',
        status: 'forming',
        bookedPlayers: []
    },
    availableCourts: 8,
  },
   {
    instructor: {
      name: 'Ana García',
      avatar: 'https://placehold.co/40x40.png',
      rating: 4.9,
    },
    classInfo: {
        id: 'slot-3',
        clubId: 'club-1',
        startTime: addHours(today, 12),
        endTime: addHours(today, 13),
        durationMinutes: 60,
        instructorId: 'inst-3',
        instructorName: 'Ana García',
        maxPlayers: 4,
        courtNumber: 4,
        level: 'abierto',
        category: 'chica',
        status: 'forming',
        bookedPlayers: [{userId: 'user-3', name: 'Carlos Sainz'}, {userId: 'user-4', name: 'Daniela Vega'}]
    },
    availableCourts: 8,
  },
];

const days = [
  { day: 'SÁB', date: 2, month: 'Ago', current: true },
  { day: 'DOM', date: 3, month: 'Ago' },
  { day: 'LUN', date: 4, month: 'Ago' },
  { day: 'MAR', date: 5, month: 'Ago' },
  { day: 'MIÉ', date: 6, month: 'Ago' },
  { day: 'JUE', date: 7, month: 'Ago' },
  { day: 'VIE', date: 8, month: 'Ago' },
  { day: 'SÁB', date: 9, month: 'Ago' },
  { day: 'DOM', date: 10, month: 'Ago' },
  { day: 'LUN', date: 11, month: 'Ago' },
  { day: 'MAR', date: 12, month: 'Ago' },
  { day: 'MIÉ', date: 13, month: 'Ago' },
  { day: 'JUE', date: 14, month: 'Ago' },
  { day: 'VIE', date: 15, month: 'Ago' },
  { day: 'SÁB', date: 16, month: 'Ago' },
];

export default function ActivitiesPage() {
  return (
    <div className="flex h-full flex-col">
      <header className="p-4 md:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" /> Clases
          </Button>
          <Button variant="secondary">Nivel 4.5</Button>
          <Button variant="ghost" className="text-muted-foreground">
            <X className="mr-2 h-4 w-4" /> Limpiar
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-1 items-center justify-center gap-2 overflow-x-auto">
            {days.map((d, i) => (
              <div
                key={i}
                className={`flex w-12 flex-shrink-0 cursor-pointer flex-col items-center rounded-lg p-2 ${
                  d.current ? 'bg-primary text-primary-foreground' : 'bg-card'
                }`}
              >
                <div className="text-xs">{d.day}</div>
                <div className="text-lg font-bold">{d.date}</div>
                <div className="text-xs">{d.month}</div>
              </div>
            ))}
          </div>
          <Button variant="ghost" size="icon">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto bg-muted/40 p-4 md:p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {sampleClasses.map((classData, index) => (
            <ClassCard key={index} {...classData} />
          ))}
        </div>
      </main>
    </div>
  );
}