"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TimeSlot, User } from '@/types';
import { CheckCircle, Users } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { isSlotEffectivelyCompleted, getMockInstructors } from '@/lib/mockData';
import { displayClassLevel } from '@/types';

interface OpenClassesDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  allTimeSlots: TimeSlot[];
  currentUser: User;
}

const OpenClassesDialog: React.FC<OpenClassesDialogProps> = ({ isOpen, onOpenChange, allTimeSlots, currentUser }) => {
    
  const confirmedClasses = useMemo(() => {
    const now = new Date();
    return allTimeSlots
      .filter(slot => {
        const { completed } = isSlotEffectivelyCompleted(slot);
        return completed && new Date(slot.startTime) > now;
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [allTimeSlots]);
  
  const instructors = useMemo(() => getMockInstructors(), []);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <CheckCircle className="mr-2 h-5 w-5 text-primary" />
            Clases Confirmadas Abiertas
          </DialogTitle>
          <DialogDescription>
            Estas son todas las clases que ya han alcanzado el número mínimo de alumnos y se van a jugar.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] my-4 pr-3">
          {confirmedClasses.length === 0 ? (
            <p className="text-center text-muted-foreground italic py-6">
              No hay clases confirmadas por el momento.
            </p>
          ) : (
            <div className="space-y-3">
              {confirmedClasses.map(slot => {
                const isUserInClass = (slot.bookedPlayers || []).some(p => p.userId === currentUser.id);
                const { size: groupSize } = isSlotEffectivelyCompleted(slot);
                const instructor = instructors.find(i => i.id === slot.instructorId);
                const isPrivateClass = slot.status === 'confirmed_private';

                return (
                  <Card key={slot.id} className={`border-l-4 ${isPrivateClass ? 'border-purple-500' : 'border-green-500'} transition-all hover:bg-muted/50`}>
                    <CardContent className="p-3">
                       <div className="flex justify-between items-start">
                           <div>
                             <p className="font-semibold">{format(new Date(slot.startTime), "eeee, dd MMMM", { locale: es })}</p>
                             <p className="text-sm text-muted-foreground">{format(new Date(slot.startTime), "HH:mm'h'", { locale: es })} - con {slot.instructorName}</p>
                           </div>
                           <Link href={`/clases/${slot.id}`} passHref>
                                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onOpenChange(false)}>
                                    Ver Clase
                                </Button>
                            </Link>
                       </div>
                       <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">{displayClassLevel(slot.level)}</Badge>
                                <Badge variant="secondary" className="text-xs">{isPrivateClass ? 'Clase Privada' : `Clase de ${groupSize}p`}</Badge>
                            </div>
                           {isUserInClass && <Badge className="text-xs bg-primary text-primary-foreground">Estás Inscrito</Badge>}
                       </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="mt-2">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="w-full">
              Cerrar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OpenClassesDialog;
