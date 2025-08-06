// src/app/page.tsx
'use client';

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
import { PadelRacketIcon } from '@/components/PadelRacketIcon';
import ProfessionalAccessDialog from '@/components/layout/ProfessionalAccessDialog';

export default function LoginPage() {
    const router = useRouter();
    const [isProfessionalAccessOpen, setIsProfessionalAccessOpen] = React.useState(false);
    
    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, you would have login logic here.
        // For now, we just navigate to the schedule page.
        router.push('/schedule');
    };

  return (
    <>
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-border/50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex items-center justify-center gap-2">
              <PadelRacketIcon className="h-8 w-8 text-primary" />
              <h1 className="font-headline text-3xl font-bold text-primary">
                PadelPro
              </h1>
            </div>
            <CardTitle className="font-headline text-2xl">
              ¡Hola de Nuevo!
            </CardTitle>
            <CardDescription>
              Introduce tus datos para acceder a tu agenda.
            </CardDescription>
          </CardHeader>
           <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="student@example.com" defaultValue="alex.garcia@email.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input id="password" type="password" defaultValue="password123"/>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button className="w-full" type="submit">
                  Acceder
                </Button>
                 <div className="text-center text-sm text-muted-foreground">
                    ¿No tienes cuenta?{' '}
                    <Link
                        href="/auth/register"
                        className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                        Regístrate
                    </Link>
                </div>
              </CardFooter>
          </form>
        </Card>
        <Card className="mt-4 border-border/50">
          <CardContent className="p-4 text-center">
            <p className="mb-2 text-sm text-muted-foreground">
              ¿Eres parte del equipo del club?
            </p>
             <Button variant="outline" size="sm" onClick={() => setIsProfessionalAccessOpen(true)}>
                Acceso Profesional
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
    <ProfessionalAccessDialog isOpen={isProfessionalAccessOpen} onOpenChange={setIsProfessionalAccessOpen} />
    </>
  );
}
