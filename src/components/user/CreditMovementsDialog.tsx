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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Wallet, PlusCircle, MinusCircle } from 'lucide-react';
import type { User as UserType, Transaction } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getMockTransactions } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadTransactions = async () => {
      if (isOpen) {
        setLoading(true);
        try {
          // In a real app, you'd fetch this from your backend
          const fetched = getMockTransactions().filter(t => t.userId === currentUser.id);
          setTransactions(fetched);
        } catch (error) {
          console.error("Error fetching transactions:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    loadTransactions();
  }, [isOpen, currentUser.id]);

  const currentCredit = currentUser.credit ?? 0;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Wallet className="mr-2 h-5 w-5 text-primary" />
            Movimientos de Saldo
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Historial de tus recargas y gastos en la aplicación.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 p-3 bg-secondary rounded-lg shadow">
            <p className="text-sm text-secondary-foreground">Saldo Actual:</p>
            <p className="text-2xl font-bold text-primary">{currentCredit.toFixed(2)} €</p>
        </div>

        {loading ? (
            <div className="py-8 text-center text-muted-foreground">Cargando movimientos...</div>
        ) : transactions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
                No tienes movimientos de saldo registrados.
            </div>
        ) : (
            <ScrollArea className="h-[250px] my-2 pr-3">
                 <div className="space-y-2">
                    {transactions.map((txn) => (
                        <div key={txn.id} className="flex items-center justify-between p-2 rounded-md border bg-background/50 text-xs">
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
            </ScrollArea>
        )}

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cerrar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreditMovementsDialog;
