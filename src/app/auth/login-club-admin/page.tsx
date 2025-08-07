"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PadelRacketIcon } from '@/components/PadelRacketIcon';
import { useToast } from '@/hooks/use-toast';
import { getMockClubs } from '@/lib/mockData';
import { Building } from 'lucide-react';

export default function LoginClubAdminPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        const club = getMockClubs().find(c => c.adminEmail === email);
        if (club && club.adminPassword === password) {
            if (typeof window !== 'undefined') {
                localStorage.setItem('activeAdminClubId', club.id);
            }
            toast({ title: "Acceso Concedido", description: `Bienvenido al panel de ${club.name}.` });
            router.push('/admin');
        } else {
            toast({ title: "Acceso Denegado", description: "Credenciales de administrador de club incorrectas.", variant: "destructive" });
        }
    };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
             <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Building className="h-8 w-8" />
            </div>
            <CardTitle className="font-headline text-2xl">
              Acceso Club
            </CardTitle>
            <CardDescription>
              Introduce los datos de acceso del club.
            </CardDescription>
          </CardHeader>
           <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email del Club</Label>
                  <Input id="email" type="email" placeholder="admin@club.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button className="w-full" type="submit">
                  Acceder al Panel
                </Button>
                 <div className="text-center text-sm text-muted-foreground">
                    <Link
                        href="/"
                        className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                        Volver al inicio
                    </Link>
                </div>
              </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  );
}
