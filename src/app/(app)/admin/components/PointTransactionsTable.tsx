"use client";

import React, { useEffect, useState } from 'react';
import type { PointTransaction, User as StudentUser } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { getMockStudents } from '@/lib/mockData';

interface PointTransactionsTableProps {
  transactions: PointTransaction[];
  loading: boolean;
}

const PointTransactionsTable: React.FC<PointTransactionsTableProps> = ({ transactions, loading }) => {
  const [students, setStudents] = useState<StudentUser[]>([]);

  useEffect(() => {
    const fetchStudents = async () => {
        const studentData = await getMockStudents();
        setStudents(studentData);
    };
    fetchStudents();
  }, []);


  if (loading) {
    return <Skeleton className="h-60 w-full" />;
  }

  if (transactions.length === 0) {
    return <p className="text-muted-foreground p-4 text-center">No hay transacciones de puntos.</p>;
  }

  return (
    <ScrollArea className="h-[300px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Alumno</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead className="text-right">Puntos</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map(txn => (
            <TableRow key={txn.id}>
              <TableCell className="text-xs">{format(new Date(txn.date), 'dd MMM, HH:mm', { locale: es })}</TableCell>
              <TableCell className="font-medium">{students.find(s => s.id === txn.userId)?.name || txn.userId.slice(0, 8)}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{txn.description}</TableCell>
              <TableCell className={cn("text-right font-semibold", txn.points > 0 ? "text-green-600" : "text-destructive")}>
                {txn.points > 0 ? `+${txn.points}` : txn.points}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
};

export default PointTransactionsTable;
