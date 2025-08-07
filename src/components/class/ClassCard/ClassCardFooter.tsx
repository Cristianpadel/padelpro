"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { CardFooter } from '@/components/ui/card';
import { Loader2, Plus, Share2, Unlock } from 'lucide-react';
import type { TimeSlot, User } from '@/types';

interface ClassCardFooterProps {
  currentSlot: TimeSlot;
  currentUser: User;
  shareCode?: string | null;
  isProcessingPrivateAction: boolean;
  canConfirmAsPrivate: boolean;
  canJoinThisPrivateMatch: boolean;
  userHasConfirmedActivityToday: boolean;
  priceForPrivateInvitee: number;
  handleConfirmAsPrivate: () => void;
  handleJoinPrivateClass: () => void;
  handleShareClass: () => void;
  onOpenChangePrivateDialog: (open: boolean) => void;
  isConfirmPrivateDialogOpen: boolean;
  privateClassSizeToConfirm: 1 | 2 | 3 | 4;
}

export const ClassCardFooter: React.FC<ClassCardFooterProps> = ({
  currentSlot,
  currentUser,
  shareCode,
  isProcessingPrivateAction,
  canConfirmAsPrivate,
  canJoinThisPrivateMatch,
  userHasConfirmedActivityToday,
  priceForPrivateInvitee,
  handleConfirmAsPrivate,
  handleJoinPrivateClass,
  handleShareClass,
  onOpenChangePrivateDialog,
  isConfirmPrivateDialogOpen,
  privateClassSizeToConfirm,
}) => {

  const isOrganizerOfPrivateClass = currentSlot.status === 'confirmed_private' && currentUser && currentSlot.organizerId === currentUser.id;

  if (canJoinThisPrivateMatch) {
    return (
       <CardFooter className="p-2 bg-purple-50 border-t">
            <div className="w-full text-center p-2 rounded-lg bg-purple-100 border border-purple-200">
                 <p className="text-sm font-semibold text-purple-800">Te han invitado a una clase privada.</p>
                 <Button onClick={handleJoinPrivateClass} className="mt-2 w-full bg-purple-600 hover:bg-purple-700" disabled={isProcessingPrivateAction}>
                      {isProcessingPrivateAction && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                      Unirse por {priceForPrivateInvitee.toFixed(2)}€
                 </Button>
            </div>
       </CardFooter>
    );
  }

  if (isOrganizerOfPrivateClass) {
     return (
          <CardFooter className="p-2 flex gap-2">
              <Button variant="secondary" className="w-full" onClick={handleShareClass}>
                  <Share2 className="mr-2 h-4 w-4" /> Compartir
              </Button>
               {/* This button could trigger making the class public */}
              <Button variant="outline" className="w-full">
                  <Unlock className="mr-2 h-4 w-4" /> Pública
              </Button>
          </CardFooter>
      );
  }
  
   if (canConfirmAsPrivate) {
    return (
      <CardFooter className="p-2 border-t">
        <AlertDialog open={isConfirmPrivateDialogOpen} onOpenChange={onOpenChangePrivateDialog}>
          <AlertDialogTrigger asChild>
            <Button
              variant="default"
              className="w-full relative h-auto py-2 px-3 rounded-lg text-white bg-purple-600 hover:bg-purple-700 shadow-lg flex items-center"
              disabled={userHasConfirmedActivityToday}
            >
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/50">
                <Plus className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col items-start ml-3 -space-y-1">
                <span className="text-sm font-bold">Reservar Privada</span>
                <span className="text-xs font-normal">Paga todo y comparte</span>
              </div>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Clase Privada</AlertDialogTitle>
              <AlertDialogDescription>
                Pagarás la clase entera y te daremos un enlace para compartir. Cuando tus amigos se unan, te devolveremos su parte.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isProcessingPrivateAction}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmAsPrivate} disabled={isProcessingPrivateAction || !privateClassSizeToConfirm}>
                {isProcessingPrivateAction && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    );
  }

  return null;
};
