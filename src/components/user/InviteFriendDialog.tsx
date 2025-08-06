"use client";

import React, { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Send, UserPlus, Gift } from 'lucide-react';
import type { User as UserType } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface InviteFriendDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: UserType;
  onInviteSent: (friendEmail: string) => void;
}

const InviteFriendDialog: React.FC<InviteFriendDialogProps> = ({
  isOpen,
  onOpenChange,
  currentUser,
  onInviteSent,
}) => {
  const [friendEmail, setFriendEmail] = useState('');
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!friendEmail.trim()) {
      toast({
        title: "Campo Requerido",
        description: "Por favor, introduce el correo electrónico de tu amigo.",
        variant: "destructive",
      });
      return;
    }
    // Basic email validation (not exhaustive)
    if (!/\S+@\S+\.\S+/.test(friendEmail)) {
      toast({
        title: "Correo Inválido",
        description: "Por favor, introduce un correo electrónico válido.",
        variant: "destructive",
      });
      return;
    }
    onInviteSent(friendEmail);
    setFriendEmail(''); // Reset after sending
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) setFriendEmail(''); // Reset email if dialog is closed
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Gift className="mr-2 h-5 w-5 text-primary" />
            Invitar a un Amigo
          </DialogTitle>
          <DialogDescription>
            Introduce el correo de tu amigo para invitarlo. Ganarás <strong>10 puntos</strong> si se registra y reserva su primera actividad. (Simulación)
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3">
          <div>
            <Label htmlFor="friend-email" className="text-sm font-medium text-foreground flex items-center">
              <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
              Correo Electrónico del Amigo
            </Label>
            <Input
              id="friend-email"
              type="email"
              placeholder="amigo@ejemplo.com"
              value={friendEmail}
              onChange={(e) => setFriendEmail(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSubmit}>
            <Send className="mr-2 h-4 w-4" />
            Enviar Invitación (Simulado)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InviteFriendDialog;
