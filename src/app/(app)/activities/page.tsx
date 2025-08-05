import { Button } from '@/components/ui/button';
import { ClassCard } from './components/ClassCard';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

const sampleClasses = [
  {
    instructor: {
      name: 'Sofía Martín',
      avatar: 'https://placehold.co/40x40.png',
      rating: 4.6,
    },
    date: 'SÁBADO 11:00H - 12:00H',
    duration: 60,
    tags: ['Categoría', 'Pista', 'Nivel'],
    slots: [
      { type: 'user', price: 60.0, available: 1 },
      { type: 'user', price: 30.0, available: 2 },
      { type: 'user', price: 20.0, available: 3 },
      { type: 'instructor', price: 15.0, available: 0 },
    ],
    availableCourts: 8,
  },
  {
    instructor: {
      name: 'Sofía Martín',
      avatar: 'https://placehold.co/40x40.png',
      rating: 4.3,
    },
    date: 'SÁBADO 11:30H - 12:30H',
    duration: 60,
    tags: ['Chicos', 'Pista', '4.5-7.0'],
    slots: [
        { type: 'user', price: 60.0, available: 1 },
        { type: 'user', price: 30.0, available: 2 },
        { type: 'user', price: 20.0, available: 3 },
        { type: 'instructor', price: 15.0, available: 4 },
    ],
    availableCourts: 8,
  },
  {
    instructor: {
      name: 'Sofía Martín',
      avatar: 'https://placehold.co/40x40.png',
      rating: 4.5,
    },
    date: 'SÁBADO 12:00H - 13:00H',
    duration: 60,
    tags: ['Categoría', 'Pista', 'Nivel'],
    slots: [
        { type: 'user', price: 60.0, available: 1 },
        { type: 'user', price: 30.0, available: 2 },
        { type: 'user', price: 20.0, available: 3 },
        { type: 'user', price: 15.0, available: 4 },
    ],
    availableCourts: 8,
  },
    {
    instructor: {
      name: 'Sofía Martín',
      avatar: 'https://placehold.co/40x40.png',
      rating: 4.8,
    },
    date: 'SÁBADO 12:30H - 13:30H',
    duration: 60,
    tags: ['Categoría', 'Pista', 'Nivel'],
    slots: [
        { type: 'user', price: 60.0, available: 1 },
        { type: 'user', price: 30.0, available: 0 },
        { type: 'user', price: 20.0, available: 0 },
        { type: 'user', price: 15.0, available: 0 },
    ],
    availableCourts: 8,
  },
    {
    instructor: {
      name: 'Sofía Martín',
      avatar: 'https://placehold.co/40x40.png',
      rating: 4.4,
    },
    date: 'SÁBADO 13:00H - 14:00H',
    duration: 60,
    tags: ['Categoría', 'Pista', 'Nivel'],
    slots: [
      { type: 'user', price: 60.0, available: 1 },
      { type: 'user', price: 30.0, available: 2 },
      { type: 'user', price: 20.0, available: 3 },
      { type: 'user', price: 15.0, available: 4 },
    ],
    availableCourts: 8,
  },
    {
    instructor: {
      name: 'Sofía Martín',
      avatar: 'https://placehold.co/40x40.png',
      rating: 4.7,
    },
    date: 'SÁBADO 13:30H - 14:30H',
    duration: 60,
    tags: ['Categoría', 'Pista', 'Nivel'],
    slots: [
      { type: 'user', price: 60.0, available: 1 },
      { type: 'user', price: 30.0, available: 0 },
      { type: 'user', price: 20.0, available: 0 },
      { type: 'user', price: 15.0, available: 0 },
    ],
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
          {sampleClasses.map((classInfo, index) => (
            <ClassCard key={index} {...classInfo} />
          ))}
        </div>
      </main>
    </div>
  );
}
