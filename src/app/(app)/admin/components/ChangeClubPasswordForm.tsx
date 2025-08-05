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
import { Loader2, KeyRound, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateClubAdminPassword } from '@/lib/mockData';

interface ChangeClubPasswordFormProps {
  clubId: string;
}

const passwordSchema = z.string().min(6, "La contraseña debe tener al menos 6 caracteres.");

const formSchema = z.object({
  currentPassword: passwordSchema,
  newPassword: passwordSchema,
  confirmNewPassword: passwordSchema,
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: "Las nuevas contraseñas no coinciden.",
  path: ["confirmNewPassword"], // Set error on confirmNewPassword field
});

type FormData = z.infer<typeof formSchema>;

const ChangeClubPasswordForm: React.FC<ChangeClubPasswordFormProps> = ({ clubId }) => {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const onSubmit = (values: FormData) => {
    startTransition(async () => {
      try {
        const result = await updateClubAdminPassword(clubId, values.currentPassword, values.newPassword);

        if ('error' in result) {
          toast({
            title: 'Error al Cambiar Contraseña',
            description: result.error,
            variant: 'destructive',
          });
        } else {
          toast({
            title: '¡Contraseña Actualizada!',
            description: 'La contraseña de acceso al club ha sido cambiada exitosamente.',
            className: 'bg-primary text-primary-foreground',
          });
          form.reset();
        }
      } catch (error) {
        console.error("Error changing club password:", error);
        toast({
          title: 'Error Inesperado',
          description: 'Ocurrió un problema al cambiar la contraseña.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-md">
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                <KeyRound className="mr-2 h-4 w-4 text-muted-foreground" />
                Contraseña Actual
              </FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                <KeyRound className="mr-2 h-4 w-4 text-muted-foreground" />
                Nueva Contraseña
              </FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormDescription>Debe tener al menos 6 caracteres.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmNewPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                <KeyRound className="mr-2 h-4 w-4 text-muted-foreground" />
                Confirmar Nueva Contraseña
              </FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ShieldCheck className="mr-2 h-4 w-4" />
          )}
          Cambiar Contraseña
        </Button>
      </form>
    </Form>
  );
};

export default ChangeClubPasswordForm;
