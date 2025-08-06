"use client";

import React, { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
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
import { updateUserPassword } from '@/lib/mockData';

interface ChangePasswordDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

const passwordSchema = z.string().min(6, "La contraseña debe tener al menos 6 caracteres.");

const formSchema = z.object({
  currentPassword: z.string().min(1, "Debes introducir tu contraseña actual."),
  newPassword: passwordSchema,
  confirmNewPassword: passwordSchema,
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: "Las nuevas contraseñas no coinciden.",
  path: ["confirmNewPassword"],
});

type FormData = z.infer<typeof formSchema>;

const ChangePasswordDialog: React.FC<ChangePasswordDialogProps> = ({ isOpen, onOpenChange, userId }) => {
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
        const result = await updateUserPassword(userId, values.currentPassword, values.newPassword);
        if ('error' in result) {
          toast({
            title: 'Error al Cambiar Contraseña',
            description: result.error,
            variant: 'destructive',
          });
        } else {
          toast({
            title: '¡Contraseña Actualizada!',
            description: 'Tu contraseña ha sido cambiada exitosamente.',
            className: 'bg-primary text-primary-foreground',
          });
          form.reset();
          onOpenChange(false);
        }
      } catch (error: any) {
        console.error("Error changing password:", error);
        toast({
          title: 'Error Inesperado',
          description: error.message || 'Ocurrió un problema al cambiar la contraseña.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) form.reset();
        onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <ShieldCheck className="mr-2 h-5 w-5 text-primary"/>
            Cambiar Contraseña
          </DialogTitle>
          <DialogDescription>
            Introduce tu contraseña actual y la nueva.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
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
                    <Input type="password" placeholder="Mínimo 6 caracteres" {...field} />
                  </FormControl>
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
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isPending}>Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Contraseña
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ChangePasswordDialog;
