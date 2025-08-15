
'use client';

import * as React from 'react';
import Footer from '@/components/layout/Footer';
import { BottomNavigationBar } from '@/components/layout/BottomNavigationBar';


export default function AppLayout({ children }: { children: React.ReactNode }) {
  
  // This layout is now simpler and only provides the common structure.
  // Page-specific components like sidebars are handled within the page components themselves.

  return (
    <div className="flex min-h-screen flex-col">
      <div className='flex flex-1'>
        <main className="flex-1">
          {children}
        </main>
      </div>
      <Footer />
      <BottomNavigationBar />
    </div>
  );
}
