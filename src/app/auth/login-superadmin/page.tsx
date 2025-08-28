"use client";

import React from 'react';
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
import { ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginSuperAdminPage() {
    const router = useRouter();
    const { toast } = useToast();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
  const form = e.currentTarget as HTMLFormElement;
  const email = (form.elements.namedItem('email') as HTMLInputElement).value;
  const password = (form.elements.namedItem('password') as HTMLInputElement).value;
        
        if (email === 'superadmin@padelapp.com' && password === 'superadminpass') {
             toast({ title: "Acceso de Super Admin Concedido", description: `Bienvenido.` });
             router.push('/superadmin');
        } else {
             toast({ title: "Acceso Denegado", description: "Credenciales de Super Admin incorrectas.", variant: "destructive" });
        }
    };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
             <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ShieldCheck className="h-8 w-8" />
            </div>
            <CardTitle className="font-headline text-2xl">
              Acceso Super Admin
            </CardTitle>
            <CardDescription>
              Introduce las credenciales de Super Administrador.
            </CardDescription>
          </CardHeader>
           <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Super Admin</Label>
                  <Input id="email" type="email" placeholder="superadmin@padelapp.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input id="password" type="password" />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button className="w-full" type="submit">
                  Acceder al Panel Global
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
