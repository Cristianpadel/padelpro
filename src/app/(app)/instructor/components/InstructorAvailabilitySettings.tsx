"use client";

import React, { useState, useEffect } from 'react';
import type { Instructor, DayOfWeek, TimeRange } from '@/types';
import { daysOfWeek, dayOfWeekLabels } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Trash2, Save, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface InstructorAvailabilitySettingsProps {
  instructor: Instructor;
  onSaveUnavailableHours: (unavailableHours: Partial<Record<DayOfWeek, TimeRange[]>>) => Promise<void>;
}

const timeOptions = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = (i % 2) * 30;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
});

interface NewRangeState {
  day: DayOfWeek | null;
  start: string;
  end: string;
}

const InstructorAvailabilitySettings: React.FC<InstructorAvailabilitySettingsProps> = ({
  instructor,
  onSaveUnavailableHours,
}) => {
  const [currentUnavailableHours, setCurrentUnavailableHours] = useState<Partial<Record<DayOfWeek, TimeRange[]>>>(
    () => JSON.parse(JSON.stringify(instructor.unavailableHours || {})) // Deep copy
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showNewRangeForm, setShowNewRangeForm] = useState<NewRangeState | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setCurrentUnavailableHours(JSON.parse(JSON.stringify(instructor.unavailableHours || {})));
  }, [instructor.unavailableHours]);

  const handleOpenNewRangeForm = (day: DayOfWeek) => {
    setShowNewRangeForm({ day, start: '09:00', end: '10:00' });
  };

  const handleNewRangeChange = (field: 'start' | 'end', value: string) => {
    if (showNewRangeForm) {
      setShowNewRangeForm({ ...showNewRangeForm, [field]: value });
    }
  };

  const handleAddNewRange = () => {
    if (!showNewRangeForm || !showNewRangeForm.day) return;

    const { day, start, end } = showNewRangeForm;

    // Validation
    if (start >= end) {
      toast({ title: "Error de Rango", description: "La hora de inicio debe ser anterior a la hora de fin.", variant: "destructive" });
      return;
    }

    const newRange: TimeRange = { start, end };
    const dayRanges = currentUnavailableHours[day] || [];

    // Check for overlaps
    const overlap = dayRanges.some(existingRange =>
      (newRange.start < existingRange.end && newRange.end > existingRange.start)
    );

    if (overlap) {
      toast({ title: "Error de Solapamiento", description: "El nuevo rango se solapa con uno existente.", variant: "destructive" });
      return;
    }

    setCurrentUnavailableHours(prev => ({
      ...prev,
      [day]: [...(prev[day] || []), newRange].sort((a, b) => a.start.localeCompare(b.start)),
    }));
    setShowNewRangeForm(null); // Close form
  };

  const handleRemoveRange = (day: DayOfWeek, indexToRemove: number) => {
    setCurrentUnavailableHours(prev => {
      const dayRanges = (prev[day] || []).filter((_, index) => index !== indexToRemove);
      if (dayRanges.length === 0) {
        const { [day]: _, ...rest } = prev; // Remove the day key if no ranges left
        return rest;
      }
      return { ...prev, [day]: dayRanges };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveUnavailableHours(currentUnavailableHours);
      toast({ title: "Disponibilidad Guardada", description: "Tu horario de indisponibilidad ha sido actualizado.", className: "bg-primary text-primary-foreground" });
    } catch (error) {
      toast({ title: "Error al Guardar", description: "No se pudo guardar la disponibilidad.", variant: "destructive" });
      console.error("Error saving unavailable hours:", error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const isDirty = JSON.stringify(currentUnavailableHours) !== JSON.stringify(instructor.unavailableHours || {});


  return (
    <div className="space-y-6">
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-700 text-sm flex items-start">
          <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
          <span>Define los bloques horarios en los que NO estarás disponible. El sistema NO generará clases automáticamente en estos periodos para ti.</span>
      </div>

      {daysOfWeek.map((day) => (
        <Card key={day} className="shadow-sm">
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base font-medium text-foreground">{dayOfWeekLabels[day]}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenNewRangeForm(day)}
                className="text-xs h-7 px-2 text-primary hover:bg-primary/10"
                disabled={isSaving}
              >
                <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Añadir Rango
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            {(currentUnavailableHours[day] || []).length === 0 && (!showNewRangeForm || showNewRangeForm.day !== day) && (
              <p className="text-xs text-muted-foreground italic text-center py-2">
                Disponible todo el día.
              </p>
            )}
            <div className="space-y-2">
              {(currentUnavailableHours[day] || []).map((range, index) => (
                <div
                  key={`${day}-${index}`}
                  className="flex items-center justify-between p-2 bg-muted/50 rounded-md border text-sm"
                >
                  <div className="flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-1.5 text-muted-foreground"/>
                    <span>De {range.start} a {range.end}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemoveRange(day, index)}
                    disabled={isSaving}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            {showNewRangeForm && showNewRangeForm.day === day && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-sm font-medium mb-2 text-primary">Nuevo Rango de Indisponibilidad:</p>
                <div className="grid grid-cols-2 gap-3 items-end">
                  <div>
                    <label htmlFor={`start-time-${day}`} className="text-xs font-medium text-muted-foreground">Desde</label>
                    <Select value={showNewRangeForm.start} onValueChange={(value) => handleNewRangeChange('start', value)}>
                      <SelectTrigger id={`start-time-${day}`} className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{timeOptions.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label htmlFor={`end-time-${day}`} className="text-xs font-medium text-muted-foreground">Hasta</label>
                    <Select value={showNewRangeForm.end} onValueChange={(value) => handleNewRangeChange('end', value)}>
                      <SelectTrigger id={`end-time-${day}`} className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{timeOptions.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-3 flex justify-end space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowNewRangeForm(null)} className="text-xs h-8">Cancelar</Button>
                  <Button size="sm" onClick={handleAddNewRange} className="text-xs h-8">Añadir</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      <Button onClick={handleSave} disabled={isSaving || !isDirty} className="w-full mt-6">
        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Guardar Cambios de Disponibilidad
      </Button>
      {!isDirty && !isSaving && <p className="text-xs text-muted-foreground text-center mt-2">No hay cambios sin guardar.</p>}
    </div>
  );
};

export default InstructorAvailabilitySettings;