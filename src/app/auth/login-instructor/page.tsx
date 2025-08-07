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
import { PadelRacketIcon } from '@/components/PadelRacketIcon';
import { UserCog } from 'lucide-react';
import { getMockInstructors, setGlobalCurrentUser } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';

export default function LoginInstructorPage() {
    const router = useRouter();
    const { toast } = useToast();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate logging in as the first instructor
        const instructor = getMockInstructors()[1]; // Ana García
        if (instructor) {
            setGlobalCurrentUser(instructor);
            toast({ title: `Bienvenida, ${instructor.name}`, description: "Has accedido a tu panel de instructor." });
            router.push('/instructor');
        } else {
             toast({ title: "Error", description: "No se encontró el perfil de instructor.", variant: "destructive" });
        }
    };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserCog className="h-8 w-8" />
            </div>
            <CardTitle className="font-headline text-2xl">
              Acceso Instructor
            </CardTitle>
            <CardDescription>
              Introduce tus datos de acceso de instructor.
            </CardDescription>
          </CardHeader>
           <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="instructor@example.com" defaultValue="ana.garcia@padelestrella.com" />
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
