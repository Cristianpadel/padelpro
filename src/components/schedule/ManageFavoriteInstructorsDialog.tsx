// src/components/schedule/ManageFavoriteInstructorsDialog.tsx
"use client";

import React, { useState, useEffect } from 'react';
import type { Instructor, User } from '@/types';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getMockInstructors } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';
import { Heart } from 'lucide-react';

interface ManageFavoriteInstructorsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: User | null;
  onSaveFavorites: (newFavoriteIds: string[]) => void;
}

const ManageFavoriteInstructorsDialog: React.FC<ManageFavoriteInstructorsDialogProps> = ({
  isOpen,
  onOpenChange,
  currentUser,
  onSaveFavorites,
}) => {
  const [allInstructors, setAllInstructors] = useState<Instructor[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(currentUser?.favoriteInstructorIds || []);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(currentUser?.favoriteInstructorIds || []);
      const fetchInstructors = async () => {
        const instructors = await getMockInstructors();
        setAllInstructors(instructors);
      };
      fetchInstructors();
    }
  }, [isOpen, currentUser]);

  const handleCheckboxChange = (instructorId: string) => {
    setSelectedIds(prev =>
      prev.includes(instructorId)
        ? prev.filter(id => id !== instructorId)
        : [...prev, instructorId]
    );
  };
  
  const handleSave = () => {
    onSaveFavorites(selectedIds);
    toast({ title: "Favoritos Guardados", description: "Tus preferencias de instructores han sido actualizadas." });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center"><Heart className="mr-2 h-5 w-5 text-primary" /> Mis Instructores Favoritos</DialogTitle>
          <DialogDescription>
            Selecciona tus instructores favoritos para encontrarlos más fácilmente en la lista de actividades.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-64 my-4">
          <div className="space-y-3 pr-4">
            {allInstructors.map(instructor => (
              <div key={instructor.id} className="flex items-center space-x-3 rounded-md border p-3">
                <Checkbox
                  id={`fav-${instructor.id}`}
                  checked={selectedIds.includes(instructor.id)}
                  onCheckedChange={() => handleCheckboxChange(instructor.id)}
                />
                <Label htmlFor={`fav-${instructor.id}`} className="font-normal text-sm flex-grow">
                  {instructor.name}
                </Label>
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSave}>Guardar Cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManageFavoriteInstructorsDialog;
