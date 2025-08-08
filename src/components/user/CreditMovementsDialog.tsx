// src/components/user/CreditMovementsDialog.tsx
"use client";

import React, { useState, useEffect } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Wallet, PlusCircle, MinusCircle, Lock, Activity, Trophy } from 'lucide-react';
import type { User as UserType, Transaction, Booking, MatchBooking } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getMockTransactions, fetchUserBookings, fetchUserMatchBookings, getMockTimeSlots, getMockMatches } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { calculatePricePerPerson } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface CreditMovementsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: UserType;
}

const CreditMovementsDialog: React.FC<CreditMovementsDialogProps> = ({
  isOpen,
  onOpenChange,
  currentUser,
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingBookings, setPendingBookings] = useState<(Booking | MatchBooking)[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (isOpen) {
        setLoading(true);
        try {
          const [fetchedTransactions, classBookings, matchBookings] = await Promise.all([
            getMockTransactions().filter(t => t.userId === currentUser.id),
            fetchUserBookings(currentUser.id),
            fetchUserMatchBookings(currentUser.id)
          ]);
          
          setTransactions(fetchedTransactions);

          const pendingClassBookings = classBookings.filter(b => b.status === 'pending' && !b.bookedWithPoints);
          const pendingMatchBookings = matchBookings.filter(b => b.matchDetails?.status === 'forming' && !b.bookedWithPoints);

          setPendingBookings([...pendingClassBookings, ...pendingMatchBookings]);

        } catch (error) {
          console.error("Error fetching movements data:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    loadData();
  }, [isOpen, currentUser.id]);

  const availableCredit = (currentUser.credit ?? 0) - (currentUser.blockedCredit ?? 0);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Wallet className="mr-2 h-5 w-5 text-primary" />
            Movimientos de Saldo
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Consulta tu saldo disponible, el crédito bloqueado por pre-inscripciones y tu historial de transacciones.
          </DialogDescription>
        </DialogHeader>

        <div className="my-2 p-3 bg-secondary rounded-lg shadow-inner grid grid-cols-2 gap-4">
            <div>
                <p className="text-xs text-secondary-foreground">Saldo Disponible:</p>
                <p className="text-2xl font-bold text-primary">{availableCredit.toFixed(2)}€</p>
            </div>
             <div>
                <p className="text-xs text-secondary-foreground">Saldo Total:</p>
                <p className="text-lg font-semibold text-muted-foreground">{(currentUser.credit ?? 0).toFixed(2)}€</p>
            </div>
        </div>

        <ScrollArea className="h-[300px] my-2 pr-3 space-y-4">
            {/* Blocked Credit Section */}
            <div>
                <h4 className="font-semibold text-foreground mb-2 flex items-center">
                    <Lock className="mr-2 h-4 w-4" />
                    Saldo Bloqueado ({(currentUser.blockedCredit ?? 0).toFixed(2)}€)
                </h4>
                {loading ? (
                    <p className="text-sm text-muted-foreground">Cargando...</p>
                ) : pendingBookings.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic p-2 bg-muted/50 rounded-md">No tienes saldo bloqueado por pre-inscripciones.</p>
                ) : (
                    <div className="space-y-2">
                        {pendingBookings.map(booking => {
                             let details = { type: '', description: '', amount: 0 };
                             if (booking.activityType === 'class') {
                                 details = {
                                     type: 'Clase',
                                     description: `con ${booking.slotDetails?.instructorName} el ${format(new Date(booking.slotDetails!.startTime), "dd/MM")}`,
                                     amount: calculatePricePerPerson(booking.slotDetails?.totalPrice, booking.groupSize)
                                 };
                             } else { // Match
                                 details = {
                                     type: 'Partida',
                                     description: `Nivel ${booking.matchDetails?.level} el ${format(new Date(booking.matchDetails!.startTime), "dd/MM")}`,
                                     amount: calculatePricePerPerson(booking.matchDetails?.totalCourtFee, 4)
                                 };
                             }
                            return (
                                <div key={booking.id} className="flex items-center justify-between p-2 rounded-md border bg-background/50 text-xs">
                                    <div className="flex-grow">
                                        <p className="font-semibold flex items-center">
                                            {booking.activityType === 'class' ? <Activity className="h-3 w-3 mr-1.5"/> : <Trophy className="h-3 w-3 mr-1.5"/>}
                                            {details.type}
                                        </p>
                                        <p className="text-muted-foreground">{details.description}</p>
                                    </div>
                                    <div className="font-bold text-sm text-muted-foreground">
                                        -{details.amount.toFixed(2)}€
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <Separator className="my-4" />

            {/* Transaction History Section */}
             <div>
                <h4 className="font-semibold text-foreground mb-2">Historial de Movimientos</h4>
                 {loading ? (
                    <p className="text-sm text-muted-foreground">Cargando...</p>
                ) : transactions.length === 0 ? (
                     <p className="text-xs text-muted-foreground italic p-2 bg-muted/50 rounded-md">No tienes movimientos de saldo registrados.</p>
                ) : (
                    <div className="space-y-2">
                        {transactions.map((txn) => (
                            <div key={txn.id} className="flex items-start justify-between p-2 rounded-md border bg-background/50 text-xs">
                                <div className="flex-grow">
                                    <p className="font-semibold">{txn.type}</p>
                                    <p className="text-muted-foreground">{txn.description}</p>
                                    <p className="text-muted-foreground/80 text-[10px] mt-1">{format(new Date(txn.date), "dd MMM yyyy, HH:mm", { locale: es })}</p>
                                </div>
                                <div className={cn(
                                    "flex items-center font-bold text-sm",
                                    txn.amount > 0 ? 'text-green-600' : 'text-destructive'
                                )}>
                                    {txn.amount > 0 ? <PlusCircle className="h-4 w-4 mr-1.5"/> : <MinusCircle className="h-4 w-4 mr-1.5"/>}
                                    {Math.abs(txn.amount).toFixed(2)}€
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </ScrollArea>

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="w-full">
              Cerrar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreditMovementsDialog;
