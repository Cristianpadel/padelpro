"use client";

import React, { useState, useEffect, useTransition } from 'react';
import type { Club, DayOfWeek, TimeRange } from '@/types';
import { daysOfWeek, dayOfWeekLabels } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, Trash2, Save, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { updateClub } from '@/lib/mockData';

interface ManageClubMatchAvailabilityProps {
  club: Club;
  onSettingsUpdated: (updatedClub: Club) => void;
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

const ManageClubMatchAvailability: React.FC<ManageClubMatchAvailabilityProps> = ({
  club,
  onSettingsUpdated,
}) => {
  const [currentUnavailableMatchHours, setCurrentUnavailableMatchHours] = useState<Partial<Record<DayOfWeek, TimeRange[]>>>(
    () => JSON.parse(JSON.stringify(club.unavailableMatchHours || {}))
  );
  const [isSaving, startSaveTransition] = useTransition();
  const [showNewRangeForm, setShowNewRangeForm] = useState<NewRangeState | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setCurrentUnavailableMatchHours(JSON.parse(JSON.stringify(club.unavailableMatchHours || {})));
  }, [club.unavailableMatchHours]);

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

    if (start >= end) {
      toast({ title: "Error de Rango", description: "La hora de inicio debe ser anterior a la hora de fin.", variant: "destructive" });
      return;
    }

    const newRange: TimeRange = { start, end };
    const dayRanges = currentUnavailableMatchHours[day] || [];
    const overlap = dayRanges.some(existingRange =>
      (newRange.start < existingRange.end && newRange.end > existingRange.start)
    );

    if (overlap) {
      toast({ title: "Error de Solapamiento", description: "El nuevo rango se solapa con uno existente.", variant: "destructive" });
      return;
    }

    setCurrentUnavailableMatchHours(prev => ({
      ...prev,
      [day]: [...(prev[day] || []), newRange].sort((a, b) => a.start.localeCompare(b.start)),
    }));
    setShowNewRangeForm(null);
  };

  const handleRemoveRange = (day: DayOfWeek, indexToRemove: number) => {
    setCurrentUnavailableMatchHours(prev => {
      const dayRanges = (prev[day] || []).filter((_, index) => index !== indexToRemove);
      if (dayRanges.length === 0) {
        const { [day]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [day]: dayRanges };
    });
  };

  const handleSave = () => {
    startSaveTransition(async () => {
        const result = await updateClub(club.id, { unavailableMatchHours: currentUnavailableMatchHours });
        if ('error' in result) {
            toast({ title: "Error al Guardar Horario", description: result.error, variant: "destructive" });
        } else {
            toast({ title: "Horario de Partidas Guardado", description: "Los horarios de no generación automática de partidas han sido actualizados.", className: "bg-primary text-primary-foreground" });
            onSettingsUpdated(result);
        }
    });
  };
  
  const isDirty = JSON.stringify(currentUnavailableMatchHours) !== JSON.stringify(club.unavailableMatchHours || {});

  return (
    <div className="space-y-6">
      <CardDescription className="flex items-start p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-700 text-sm">
          <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
          <span>Define los bloques horarios en los que NO se generarán tarjetas de inscripción a partidas automáticamente para este club. Las partidas creadas manualmente no se ven afectadas.</span>
      </CardDescription>

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
            {(currentUnavailableMatchHours[day] || []).length === 0 && (!showNewRangeForm || showNewRangeForm.day !== day) && (
              <p className="text-xs text-muted-foreground italic text-center py-2">
                Generación de partidas habilitada todo el día.
              </p>
            )}
            <div className="space-y-2">
              {(currentUnavailableMatchHours[day] || []).map((range, index) => (
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
                <p className="text-sm font-medium mb-2 text-primary">Nuevo Rango de No Generación:</p>
                <div className="grid grid-cols-2 gap-3 items-end">
                  <div>
                    <label htmlFor={`start-time-${day}-club`} className="text-xs font-medium text-muted-foreground">Desde</label>
                    <Select value={showNewRangeForm.start} onValueChange={(value) => handleNewRangeChange('start', value)}>
                      <SelectTrigger id={`start-time-${day}-club`} className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{timeOptions.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label htmlFor={`end-time-${day}-club`} className="text-xs font-medium text-muted-foreground">Hasta</label>
                    <Select value={showNewRangeForm.end} onValueChange={(value) => handleNewRangeChange('end', value)}>
                      <SelectTrigger id={`end-time-${day}-club`} className="h-9 text-xs"><SelectValue /></SelectTrigger>
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
        Guardar Horario de No Generación de Partidas
      </Button>
      {!isDirty && !isSaving && <p className="text-xs text-muted-foreground text-center mt-2">No hay cambios sin guardar.</p>}
    </div>
  );
};

export default ManageClubMatchAvailability;