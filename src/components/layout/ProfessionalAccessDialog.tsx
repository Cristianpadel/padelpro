"use client";

import React from 'react';
import Link from 'next/link';
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
import { UserCog, Building, ShieldCheck, Briefcase } from 'lucide-react';

interface ProfessionalAccessDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProfessionalAccessDialog: React.FC<ProfessionalAccessDialogProps> = ({ isOpen, onOpenChange }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Briefcase className="mr-2 h-5 w-5 text-primary" />
            Acceso Profesional
          </DialogTitle>
          <DialogDescription>
            Selecciona tu tipo de perfil para iniciar sesión.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-3">
          <DialogClose asChild>
            <Link href="/auth/login-instructor" passHref legacyBehavior>
                <Button variant="outline" className="w-full justify-start text-base h-auto p-3">
                    <UserCog className="mr-3 h-5 w-5 text-primary/80" />
                    <span>Acceso Instructor</span>
                </Button>
            </Link>
          </DialogClose>
          <DialogClose asChild>
             <Link href="/auth/login-club-admin" passHref legacyBehavior>
                 <Button variant="outline" className="w-full justify-start text-base h-auto p-3">
                    <Building className="mr-3 h-5 w-5 text-primary/80" />
                    <span>Acceso Club</span>
                </Button>
             </Link>
          </DialogClose>
           <DialogClose asChild>
             <Link href="/auth/login-superadmin" passHref legacyBehavior>
                <Button variant="outline" className="w-full justify-start text-base h-auto p-3">
                    <ShieldCheck className="mr-3 h-5 w-5 text-primary/80" />
                    <span>Acceso Super Admin</span>
                </Button>
            </Link>
          </DialogClose>
        </div>
        <DialogFooter className="mt-2">
          <DialogClose asChild>
            <Button type="button" variant="ghost" className="w-full">
              Cerrar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProfessionalAccessDialog;
