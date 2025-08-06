"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, Send, Mail } from 'lucide-react';
import type { User } from '@/types';

interface InviteFriendDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: User;
  onInviteSent: (friendEmail: string) => Promise<void>;
}

const formSchema = z.object({
  friendEmail: z.string().email("Debe ser un correo electrónico válido."),
});

type FormData = z.infer<typeof formSchema>;

const InviteFriendDialog: React.FC<InviteFriendDialogProps> = ({
  isOpen,
  onOpenChange,
  currentUser,
  onInviteSent,
}) => {
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      friendEmail: "",
    },
  });

  const onSubmit = (values: FormData) => {
    startTransition(async () => {
      await onInviteSent(values.friendEmail);
      form.reset();
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Send className="mr-2 h-5 w-5 text-primary" />
            Invita a un Amigo
          </DialogTitle>
          <DialogDescription>
            Introduce el email de tu amigo para invitarle. ¡Recibirás puntos cuando se una y juegue su primera partida!
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="friendEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email del Amigo</FormLabel>
                  <FormControl>
                    <div className="relative">
                       <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                       <Input type="email" placeholder="amigo@ejemplo.com" className="pl-8" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Enviar Invitación
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default InviteFriendDialog;
