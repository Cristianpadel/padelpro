"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, isSameDay, startOfDay, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface DateNavigationProps {
  currentDate: Date;
  setCurrentDate: (dateUpdater: ((prevDate: Date) => Date) | Date) => void;
  dateStripDates: Date[];
  isToday: (date: Date) => boolean;
}

const DateNavigation: React.FC<DateNavigationProps> = ({
  currentDate,
  setCurrentDate,
  dateStripDates,
  isToday,
}) => {
  return (
    <div className="flex flex-col md:flex-row items-center gap-2 w-full">
      <div className="flex items-center gap-1 w-full md:w-auto justify-center md:justify-start">
        <Button
          onClick={() => setCurrentDate(startOfDay(new Date()))}
          variant="outline"
          size="sm"
          disabled={isSameDay(startOfDay(currentDate), startOfDay(new Date()))}
        >
          Hoy
        </Button>
        <Button
          onClick={() => setCurrentDate(prev => addDays(prev, -1))}
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label="Día anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex w-max space-x-1 px-1 py-1 rounded-md border bg-muted">
            {dateStripDates.map(day => (
                <Button
                key={day.toISOString()}
                variant={isSameDay(startOfDay(currentDate), day) ? "default" : "ghost"}
                size="sm"
                className={cn(
                    "h-auto px-2 py-1 text-xs flex flex-col leading-tight",
                    isSameDay(startOfDay(currentDate), day) && "bg-primary text-primary-foreground shadow-md",
                    isToday(day) && !isSameDay(startOfDay(currentDate), day) && "font-semibold text-primary"
                )}
                onClick={() => setCurrentDate(day)}
                >
                <span>{format(day, "EEE", { locale: es }).charAt(0).toUpperCase() + format(day, "EEE", { locale: es }).slice(1,3)}</span>
                <span>{format(day, "d", { locale: es })}</span>
                </Button>
            ))}
            </div>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
        <Button
          onClick={() => setCurrentDate(prev => addDays(prev, 1))}
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label="Día siguiente"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default DateNavigation;
