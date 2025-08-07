// src/components/class/ClassCard/BookingConfirmationDialog.tsx
"use client";

import React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Euro, Gift, Rocket, PiggyBank, Star, ThumbsUp, Lock, Scissors } from 'lucide-react';
import type { User } from '@/types';
import { calculatePricePerPerson } from '@/lib/utils';


interface BookingConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
  currentUser: User;
  groupSize: 1 | 2 | 3 | 4;
  spotIndex: number;
  totalPrice: number;
  isGratisSpot?: boolean;
}

export const BookingConfirmationDialog: React.FC<BookingConfirmationDialogProps> = ({
  isOpen,
  onOpenChange,
  onConfirm,
  isPending,
  currentUser,
  groupSize,
  spotIndex,
  totalPrice,
  isGratisSpot,
}) => {
  const pricePerPerson = calculatePricePerPerson(totalPrice, groupSize);
  const pointsCost = calculatePricePerPerson(totalPrice, 1);
  const availableCredit = (currentUser.credit ?? 0) - (currentUser.blockedCredit ?? 0);

  const confirmationDialogTitle = groupSize === 1 ? '¡Confirmar Clase Privada!' : '¡Casi dentro!';
  const confirmationDialogDescription = groupSize === 1
    ? 'Pagas la clase entera ahora.\nTe daremos un enlace para compartir.\nCuando tus amigos se unan, te devolveremos su parte.'
    : `Vas a apuntarte a una clase de ${groupSize}.`;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-bold flex items-center justify-center">
            <Rocket className="h-8 w-8 mr-3 text-blue-500" /> {confirmationDialogTitle}
          </AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogDescription className="text-center text-lg text-foreground space-y-4 py-4">
          <div className="space-y-1">
            <p>{confirmationDialogDescription.split('\n')[0]}</p>
            <p className="flex items-center justify-center text-3xl font-bold">
              {isGratisSpot
                ? <><Gift className="h-8 w-8 mr-2 text-yellow-500" /> {pointsCost} <span className="text-lg ml-1">puntos</span></>
                : <><Euro className="h-7 w-7 mr-1" /> {groupSize === 1 ? totalPrice.toFixed(2) : pricePerPerson.toFixed(2)}</>
              }
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 p-2 bg-slate-100 rounded-md">
            <PiggyBank className="h-6 w-6 text-slate-500" />
            <span className="text-sm">Tu hucha tiene:</span>
            <span className="font-bold text-slate-800">{availableCredit.toFixed(2)}€</span>
            <span className="text-slate-400">/</span>
            <Star className="h-5 w-5 text-amber-500"/>
            <span className="font-bold text-slate-800">{currentUser?.loyaltyPoints ?? 0}</span>
          </div>
        </AlertDialogDescription>
        <div className="text-sm bg-blue-50 text-blue-800 p-3 rounded-lg space-y-2">
          <p className="font-bold text-center">¡Recuerda las reglas del juego!</p>
          <ul className="space-y-1.5">
            <li className="flex items-start"><ThumbsUp className="h-4 w-4 mr-2 mt-0.5 text-blue-500 flex-shrink-0" /><span>{groupSize === 1 ? 'La clase se confirma y la pista se asigna al instante.' : 'Si la clase se llena, ¡se confirma!'}</span></li>
            <li className="flex items-start"><Lock className="h-4 w-4 mr-2 mt-0.5 text-blue-500 flex-shrink-0" /><span>Una vez confirmada, tu plaza es definitiva.</span></li>
            <li className="flex items-start"><Scissors className="h-4 w-4 mr-2 mt-0.5 text-blue-500 flex-shrink-0" /><span>**Si esta clase se confirma**, tus otras inscripciones del día se anularán solas.</span></li>
          </ul>
        </div>
        <AlertDialogFooter className="grid grid-cols-2 gap-2 mt-4">
          <AlertDialogCancel className="h-12 text-base" disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="h-12 text-base bg-green-600 text-white hover:bg-green-700" 
          >
            {isPending
              ? <Loader2 className="h-6 w-6 animate-spin" />
              : (isGratisSpot ? `Sí, Usar Puntos` : "Sí, ¡Me apunto!")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
