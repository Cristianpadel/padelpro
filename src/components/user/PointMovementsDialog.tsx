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
import { Star, Activity, Gift, Award, Users, MinusCircle, PlusCircle, ShoppingBag } from 'lucide-react';
import type { User as UserType, PointTransaction, PointTransactionType } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { fetchPointTransactions } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface PointMovementsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: UserType;
}

const getTransactionTypeInfo = (type: PointTransactionType): { icon: React.ElementType, label: string } => {
  switch (type) {
    case 'cancelacion_clase': return { icon: Activity, label: 'Cancelación Clase' };
    case 'cancelacion_clase_confirmada': return { icon: Activity, label: 'Cancelación Clase (Confirmada)' };
    case 'cancelacion_partida': return { icon: Activity, label: 'Cancelación Partida' };
    case 'invitar_amigo': return { icon: Users, label: 'Amigo Invitado' };
    case 'primero_en_clase': return { icon: Award, label: 'Pionero Clase' };
    case 'primero_en_partida': return { icon: Award, label: 'Pionero Partida' };
    case 'canje_plaza_gratis': return { icon: Gift, label: 'Canje Plaza Gratis' };
    case 'reserva_pista_puntos': return { icon: Star, label: 'Reserva Pista' };
    case 'penalizacion_cancelacion_no_confirmada': return { icon: MinusCircle, label: 'Penalización Cancelación (No Confirmada)' };
    case 'penalizacion_cancelacion_confirmada': return { icon: MinusCircle, label: 'Penalización Cancelación (Confirmada)' };
    case 'ajuste_manual': return { icon: Star, label: 'Ajuste Manual' };
    case 'reembolso_error_reserva': return { icon: PlusCircle, label: 'Reembolso por Error' };
    case 'devolucion_cancelacion_anticipada': return { icon: PlusCircle, label: 'Devolución Cancelación Anticipada' };
    case 'bonificacion_preinscripcion': return { icon: PlusCircle, label: 'Bonus Pre-inscripción' };
    default: return { icon: Star, label: type };
  }
};

const PointMovementsDialog: React.FC<PointMovementsDialogProps> = ({
  isOpen,
  onOpenChange,
  currentUser,
}) => {
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadTransactions = async () => {
      if (isOpen && currentUser) {
        setLoading(true);
        try {
          const fetched = await fetchPointTransactions(undefined, currentUser.id);
          setTransactions(fetched);
        } catch (error) {
          console.error("Error fetching point transactions:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    loadTransactions();
  }, [isOpen, currentUser]);

  const currentPoints = currentUser.loyaltyPoints ?? 0;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Star className="mr-2 h-5 w-5 text-primary" />
            Movimientos de Puntos
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Historial de tus puntos de fidelidad ganados y canjeados.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 p-3 bg-secondary rounded-lg shadow">
            <p className="text-sm text-secondary-foreground">Puntos Actuales:</p>
            <p className="text-2xl font-bold text-primary">{currentPoints.toFixed(2)} Puntos</p>
        </div>

        {loading ? (
            <div className="py-8 text-center text-muted-foreground">Cargando movimientos...</div>
        ) : transactions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
                No tienes movimientos de puntos registrados.
            </div>
        ) : (
            <ScrollArea className="h-[250px] my-2 pr-3">
                 <div className="space-y-2">
                    {transactions.map((txn) => {
                         const typeInfo = getTransactionTypeInfo(txn.type);
                         const IconComponent = typeInfo.icon;
                        return (
                        <div key={txn.id} className="flex items-start justify-between p-2 rounded-md border bg-background/50 text-xs">
                            <div className="flex-grow">
                                <div className="flex items-center justify-between mb-1">
                                    <span className={cn(
                                        "flex items-center font-semibold",
                                        txn.points > 0 ? "text-green-600" : "text-destructive"
                                    )}>
                                        <IconComponent className="mr-1.5 h-4 w-4" /> {typeInfo.label}
                                    </span>
                                    <span className={cn(
                                        "font-bold text-sm",
                                        txn.points > 0 ? 'text-green-600' : 'text-destructive'
                                    )}>
                                        {txn.points > 0 ? `+${txn.points.toFixed(2)}` : txn.points.toFixed(2)}
                                    </span>
                                </div>
                                <p className="text-muted-foreground ml-1">{txn.description}</p>
                                <p className="text-muted-foreground/80 text-[10px] text-right mt-1">{format(new Date(txn.date), "dd MMM yyyy, HH:mm", { locale: es })}</p>
                            </div>
                        </div>
                        )
                    })}
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

export default PointMovementsDialog;
