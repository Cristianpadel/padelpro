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
import { getMockClubs } from '@/lib/mockDataSources';
import { Building } from 'lucide-react';

export default function LoginClubAdminPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('🔍 Intentando login con:', { email, password });
        
        // Forzar inicialización si es necesario
        try {
            const { performInitialization } = require('@/lib/mockDataSources/init');
            performInitialization();
        } catch (error) {
            console.warn('Error en inicialización:', error);
        }
        
        const allClubs = getMockClubs();
        console.log('🏢 Clubs disponibles:', allClubs.map(c => ({ id: c.id, name: c.name, email: c.adminEmail, password: c.adminPassword })));
        
        const club = allClubs.find(c => c.adminEmail === email);
        console.log('🎯 Club encontrado:', club);
        
        if (club && club.adminPassword === password) {
            console.log('✅ Login exitoso para club:', club.name);
            if (typeof window !== 'undefined') {
                localStorage.setItem('activeAdminClubId', club.id);
            }
            toast({ title: "Acceso Concedido", description: `Bienvenido al panel de ${club.name}.` });
            router.push('/admin');
        } else {
            console.log('❌ Login fallido - Credenciales incorrectas');
            console.log('📧 Email buscado:', email);
            console.log('🔑 Password proporcionado:', password);
            console.log('🏢 Total clubs encontrados:', allClubs.length);
            if (club) {
                console.log('🔓 Password esperado:', club.adminPassword);
            } else {
                console.log('🚫 No se encontró club con email:', email);
                console.log('📋 Emails disponibles:', allClubs.map(c => c.adminEmail));
            }
            
            // Debug: mostrar alert además del toast
            alert(`Login fallido. Clubs: ${allClubs.length}, Club encontrado: ${!!club}`);
            
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
