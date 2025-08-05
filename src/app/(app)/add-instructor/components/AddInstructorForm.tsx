"use client";

import React, { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addInstructor } from '@/lib/mockData';
import type { Instructor } from '@/types';

interface AddInstructorFormProps {
  onInstructorAdded: (newInstructor: Instructor) => void;
}

const formSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres.").max(50, "El nombre no puede exceder los 50 caracteres."),
});

type FormData = z.infer<typeof formSchema>;

const AddInstructorForm: React.FC<AddInstructorFormProps> = ({ onInstructorAdded }) => {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = (values: FormData) => {
    startTransition(async () => {
      try {
        const instructorData: Omit<Instructor, 'id' | 'isAvailable' | 'assignedClubId' | 'assignedCourtNumber'> = {
          name: values.name,
        };

        const result = await addInstructor(instructorData);

        if ('error' in result) {
          toast({
            title: 'Error al Añadir Instructor',
            description: result.error,
            variant: 'destructive',
          });
        } else {
          toast({
            title: '¡Instructor Añadido!',
            description: `Se ha añadido a ${result.name} como instructor.`,
            className: 'bg-primary text-primary-foreground',
          });
          form.reset();
          onInstructorAdded(result);
        }
      } catch (error) {
        console.error("Error adding instructor:", error);
        toast({
          title: 'Error Inesperado',
          description: 'Ocurrió un problema al añadir el instructor.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Instructor</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Javier Gómez" {...field} />
              </FormControl>
              <FormDescription>Introduce el nombre completo del nuevo instructor.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <UserPlus className="mr-2 h-4 w-4" />
          )}
          Añadir Instructor
        </Button>
      </form>
    </Form>
  );
};

export default AddInstructorForm;
