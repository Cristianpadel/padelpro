"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { LogOut, Shield, Building, Users, BarChart3, Settings } from 'lucide-react';
import Link from 'next/link';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleLogout = () => {
    router.push('/');
  };

  const sidebarItems = [
    { href: '/superadmin', icon: BarChart3, label: 'Dashboard', description: 'Vista general de la plataforma' },
    { href: '/superadmin/clubs', icon: Building, label: 'Gestión de Clubes', description: 'Administrar clubes de la plataforma' },
    { href: '/superadmin/users', icon: Users, label: 'Usuarios Globales', description: 'Ver todos los usuarios de la plataforma' },
    { href: '/superadmin/settings', icon: Settings, label: 'Configuración', description: 'Configuración global de la plataforma' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Panel Super Admin</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Administración de la plataforma PadelPro</p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-[calc(100vh-73px)]">
          <nav className="p-4 space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <Card className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer border-l-4 border-l-transparent hover:border-l-primary">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{item.label}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.description}</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}