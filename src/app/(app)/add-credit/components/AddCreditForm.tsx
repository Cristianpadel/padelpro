"use client";

import React, { useState, useTransition, useEffect } from 'react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, UserCircle, WalletCards, Euro } from 'lucide-react'; // Import icons
import { useToast } from '@/hooks/use-toast';
import { fetchStudents, addCreditToStudent } from '@/lib/mockData'; // Import mock functions
import type { User } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Import Avatar
import { getInitials } from '@/lib/utils'; // Import getInitials

interface AddCreditFormProps {
  instructor: User; // Instructor might be needed for permissions/tracking
}

// Schema for validation
const formSchema = z.object({
  studentId: z.string().min(1, "Debes seleccionar un alumno."),
  amount: z.coerce.number().positive("La cantidad debe ser un número positivo.").min(0.01, "La cantidad mínima es 0.01€."),
});

type FormData = z.infer<typeof formSchema>;

const AddCreditForm: React.FC<AddCreditFormProps> = ({ instructor }) => {
  const [students, setStudents] = useState<User[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    const loadStudents = async () => {
      try {
        setLoadingStudents(true);
        const fetched = await fetchStudents();
        // Sort students alphabetically by name
        fetched.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
        setStudents(fetched);
      } catch (error) {
        console.error("Error fetching students:", error);
        toast({
          title: "Error al Cargar Alumnos",
          description: "No se pudieron obtener los datos de los alumnos.",
          variant: "destructive",
        });
      } finally {
        setLoadingStudents(false);
      }
    };
    loadStudents();
  }, [toast]); // Added toast to dependency array

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentId: "",
      amount: 10, // Default amount
    },
  });

  const onSubmit = (values: FormData) => {
    startTransition(async () => {
      try {
        const result = await addCreditToStudent(values.studentId, values.amount);

        if ('error' in result) {
          toast({
            title: 'Error al Añadir Crédito',
            description: result.error,
            variant: 'destructive',
          });
        } else {
          const studentName = students.find(s => s.id === values.studentId)?.name ?? 'Alumno';
          toast({
            title: '¡Crédito Añadido!',
            description: `Se han añadido ${values.amount.toFixed(2)}€ a ${studentName}. Nuevo saldo: ${result.newBalance.toFixed(2)}€`,
            className: 'bg-primary text-primary-foreground',
          });
          form.reset(); // Reset form
          // Optionally update student list/data locally if needed, or rely on re-fetch
        }
      } catch (error) {
        console.error("Error adding credit:", error);
        toast({
          title: 'Error Inesperado',
          description: 'Ocurrió un problema al añadir el crédito.',
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
          name="studentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alumno</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loadingStudents}>
                <FormControl>
                  <SelectTrigger>
                    {loadingStudents ? (
                      <div className="flex items-center space-x-2">
                         <Skeleton className="h-5 w-5 rounded-full" />
                         <Skeleton className="h-4 w-3/4" />
                      </div>
                    ) : (
                       <SelectValue placeholder="Selecciona un alumno..." />
                    )}
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {loadingStudents ? (
                    <SelectItem value="loading" disabled>Cargando alumnos...</SelectItem>
                  ) : students.length === 0 ? (
                     <SelectItem value="no-students" disabled>No hay alumnos registrados.</SelectItem>
                  ) : (
                    students.map(student => (
                      <SelectItem key={student.id} value={student.id}>
                         <div className="flex items-center space-x-2">
                           <Avatar className="h-5 w-5">
                              <AvatarImage src={student.profilePictureUrl} alt={student.name} data-ai-hint="student profile photo small" />
                              <AvatarFallback className="text-xs">{getInitials(student.name ?? '')}</AvatarFallback>
                           </Avatar>
                           <span>{student.name}</span>
                         </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormDescription>Elige el alumno al que quieres añadir crédito.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cantidad a Añadir (€)</FormLabel>
              <FormControl>
                 <div className="relative">
                    <Euro className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input type="number" min="0.01" step="0.01" className="pl-8" placeholder="Ej: 20.50" {...field} />
                 </div>
              </FormControl>
              <FormDescription>Introduce la cantidad de crédito en euros.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending || loadingStudents} className="w-full">
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <WalletCards className="mr-2 h-4 w-4" />
          )}
          Añadir Crédito
        </Button>
      </form>
    </Form>
  );
};

export default AddCreditForm;