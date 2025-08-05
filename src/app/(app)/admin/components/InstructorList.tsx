"use client";

import React, { useState, useTransition } from 'react';
import type { Instructor } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserCircle, Pencil, Trash2, Ban, CheckCircle } from 'lucide-react'; // Added Ban and CheckCircle for block/unblock
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteInstructor, updateInstructor } from '@/lib/mockData'; // Import delete and update functions
import { cn } from '@/lib/utils';

const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

interface InstructorListProps {
  instructors: Instructor[];
  loading: boolean;
  error: string | null;
  onInstructorUpdated: () => void; // Callback to refresh list after update/delete
  onEditInstructor: (instructor: Instructor) => void; // Callback to open edit dialog
}

const InstructorList: React.FC<InstructorListProps> = ({ instructors, loading, error, onInstructorUpdated, onEditInstructor }) => {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState<string | null>(null); // Track which instructor is being deleted
  const [isTogglingBlock, setIsTogglingBlock] = useState<string | null>(null); // Track block/unblock

  const handleDelete = async (instructorId: string, instructorName?: string) => {
    setIsDeleting(instructorId);
    try {
      const result = await deleteInstructor(instructorId);
      if ('error' in result) {
        toast({
          title: 'Error al Eliminar',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: '¡Instructor Eliminado!',
          description: `${instructorName || 'El instructor'} ha sido eliminado.`,
          className: 'bg-accent text-accent-foreground',
        });
        onInstructorUpdated(); // Refresh list
      }
    } catch (err) {
      console.error("Error deleting instructor:", err);
      toast({
        title: 'Error Inesperado',
        description: 'Ocurrió un problema al eliminar el instructor.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleToggleBlock = async (instructor: Instructor) => {
    setIsTogglingBlock(instructor.id);
    try {
      const result = await updateInstructor(instructor.id, { isBlocked: !instructor.isBlocked });
      if ('error' in result) {
        toast({
          title: 'Error al Actualizar',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: `Instructor ${result.isBlocked ? 'Bloqueado' : 'Desbloqueado'}`,
          description: `${result.name} ha sido ${result.isBlocked ? 'bloqueado' : 'desbloqueado'}.`,
          className: result.isBlocked ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground',
        });
        onInstructorUpdated(); // Refresh list
      }
    } catch (err) {
      console.error("Error toggling instructor block status:", err);
      toast({
        title: 'Error Inesperado',
        description: 'Ocurrió un problema al actualizar el estado del instructor.',
        variant: 'destructive',
      });
    } finally {
      setIsTogglingBlock(null);
    }
  };


  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center space-x-3 p-2 rounded-md bg-secondary/30">
             <Skeleton className="h-10 w-10 rounded-full" />
             <Skeleton className="h-5 w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive p-4">{error}</div>;
  }

  if (instructors.length === 0) {
     return <p className="text-muted-foreground italic text-center py-4">No hay instructores registrados.</p>;
  }

  return (
    <ScrollArea className="h-[300px] pr-4"> {/* Adjust height as needed */}
      <div className="space-y-3">
        {instructors.map((instructor) => (
          <div key={instructor.id} className={cn("flex items-center space-x-3 p-2 rounded-md bg-secondary/30 hover:bg-secondary/50 transition-colors", instructor.isBlocked && "opacity-60 bg-destructive/10 hover:bg-destructive/20")}>
            <Avatar className="h-9 w-9">
              <AvatarImage
                 src={`https://picsum.photos/seed/${instructor.id}/36/36`}
                 alt={`Foto de ${instructor.name}`}
                 data-ai-hint="instructor profile photo small"
                 width={36} height={36}
              />
              <AvatarFallback className="text-sm">
                 {getInitials(instructor.name || '') || <UserCircle className="h-5 w-5" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex-grow">
                <span className="font-medium text-sm">{instructor.name}</span>
                {instructor.isBlocked && <span className="ml-2 text-xs text-destructive font-semibold">(Bloqueado)</span>}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                    onClick={() => onEditInstructor(instructor)}
                    disabled={isDeleting === instructor.id || isTogglingBlock === instructor.id}
                    aria-label={`Editar ${instructor.name}`}
                >
                    <Pencil className="h-4 w-4" />
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-7 w-7", instructor.isBlocked ? "text-green-600 hover:bg-green-500/10" : "text-yellow-600 hover:bg-yellow-500/10")}
                    onClick={() => handleToggleBlock(instructor)}
                    disabled={isDeleting === instructor.id || isTogglingBlock === instructor.id}
                    aria-label={instructor.isBlocked ? `Desbloquear ${instructor.name}` : `Bloquear ${instructor.name}`}
                >
                    {isTogglingBlock === instructor.id ? <UserCircle className="h-4 w-4 animate-spin" /> : instructor.isBlocked ? <CheckCircle className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                </Button>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            disabled={isDeleting === instructor.id || isTogglingBlock === instructor.id}
                            aria-label={`Eliminar ${instructor.name}`}
                        >
                            {isDeleting === instructor.id ? <UserCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Confirmar Eliminación?</AlertDialogTitle>
                            <AlertDialogDescription>
                                ¿Estás seguro de que quieres eliminar a {instructor.name}? Esta acción no se puede deshacer.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => handleDelete(instructor.id, instructor.name)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                Sí, Eliminar
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default InstructorList;
