"use client";

import React, { useState, useEffect, useTransition } from 'react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, User, Heart } from 'lucide-react';
import type { User as UserType, Instructor } from '@/types';
import { fetchInstructors, updateUserFavoriteInstructors } from '@/lib/mockData';
import { getInitials } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ManageFavoriteInstructorsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: UserType;
  onApplyFavorites: (favoriteIds: string[]) => void;
}

const ManageFavoriteInstructorsDialog: React.FC<ManageFavoriteInstructorsDialogProps> = ({
  isOpen,
  onOpenChange,
  currentUser,
  onApplyFavorites,
}) => {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [selectedFavoriteIds, setSelectedFavoriteIds] = useState<string[]>(currentUser.favoriteInstructorIds || []);
  const [loadingInstructors, setLoadingInstructors] = useState(true);
  const [isSaving, startSaveTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    const loadInstructors = async () => {
      try {
        setLoadingInstructors(true);
        const fetched = await fetchInstructors();
        // Sort instructors alphabetically by name
        fetched.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
        setInstructors(fetched);
      } catch (error) {
        console.error("Error fetching instructors:", error);
        toast({
          title: "Error al Cargar Instructores",
          description: "No se pudieron obtener los datos de los instructores.",
          variant: "destructive",
        });
      } finally {
        setLoadingInstructors(false);
      }
    };
    if (isOpen) {
      loadInstructors();
    }
  }, [isOpen, toast]);

  useEffect(() => {
    if (currentUser.favoriteInstructorIds) {
      setSelectedFavoriteIds(currentUser.favoriteInstructorIds);
    }
  }, [currentUser.favoriteInstructorIds]);

  const handleToggleFavorite = (instructorId: string) => {
    setSelectedFavoriteIds((prev) =>
      prev.includes(instructorId)
        ? prev.filter((id) => id !== instructorId)
        : [...prev, instructorId]
    );
  };

  const handleApply = () => {
    startSaveTransition(async () => {
      const result = await updateUserFavoriteInstructors(currentUser.id, selectedFavoriteIds);
      if ('error' in result) {
        toast({
          title: "Error al Guardar Favoritos",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Favoritos Actualizados",
          description: "Tu lista de instructores favoritos ha sido guardada.",
          className: "bg-primary text-primary-foreground",
        });
        onApplyFavorites(selectedFavoriteIds);
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Heart className="mr-2 h-5 w-5 text-primary" />
            Gestionar Instructores Favoritos
          </DialogTitle>
          <DialogDescription>
            Selecciona tus instructores favoritos para filtrar clases más fácilmente.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[300px] my-4 pr-3">
          {loadingInstructors ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3 p-2 rounded-md">
                  <Skeleton className="h-5 w-5" /> {/* Checkbox skeleton */}
                  <Skeleton className="h-8 w-8 rounded-full" /> {/* Avatar skeleton */}
                  <Skeleton className="h-4 w-3/4" /> {/* Name skeleton */}
                </div>
              ))}
            </div>
          ) : instructors.length === 0 ? (
            <p className="text-muted-foreground text-center italic py-4">
              No hay instructores disponibles para seleccionar.
            </p>
          ) : (
            <div className="space-y-1">
              {instructors.map((instructor) => (
                <div
                  key={instructor.id}
                  className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    id={`fav-instructor-${instructor.id}`}
                    checked={selectedFavoriteIds.includes(instructor.id)}
                    onCheckedChange={() => handleToggleFavorite(instructor.id)}
                    disabled={isSaving}
                  />
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={instructor.profilePictureUrl}
                      alt={instructor.name || 'Instructor'}
                      data-ai-hint="instructor profile photo small"
                    />
                    <AvatarFallback className="text-xs">
                      {getInitials(instructor.name || '') || <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <Label htmlFor={`fav-instructor-${instructor.id}`} className="font-normal cursor-pointer flex-grow">
                    {instructor.name}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSaving}>
              Cancelar
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleApply} disabled={isSaving || loadingInstructors}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Aplicar Filtro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManageFavoriteInstructorsDialog;
