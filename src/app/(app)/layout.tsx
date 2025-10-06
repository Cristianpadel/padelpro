// src/app/(app)/layout.tsx
import { Suspense } from 'react';
import AppLayoutClient from './AppLayoutClient';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // This is now a pure Server Component.
  // It fetches no data and has no client-side logic.
  // It simply renders the client-side wrapper which contains the actual layout.
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">Cargando...</div>}>
      <AppLayoutClient>{children}</AppLayoutClient>
    </Suspense>
  );
}
