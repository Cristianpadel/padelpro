"use client";

import React from 'react';
import type { User as StudentUser } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface StudentPointBalancesTableProps {
  students: StudentUser[];
  loading: boolean;
}

const StudentPointBalancesTable: React.FC<StudentPointBalancesTableProps> = ({ students, loading }) => {
  if (loading) {
    return <Skeleton className="h-60 w-full" />;
  }

  if (students.length === 0) {
    return <p className="text-muted-foreground">No hay datos de alumnos.</p>;
  }

  return (
    <ScrollArea className="h-[300px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Alumno</TableHead>
            <TableHead className="text-right">Puntos</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map(student => (
            <TableRow key={student.id}>
              <TableCell>{student.name}</TableCell>
              <TableCell className="text-right font-semibold">{(student.loyaltyPoints || 0)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
};

export default StudentPointBalancesTable;
