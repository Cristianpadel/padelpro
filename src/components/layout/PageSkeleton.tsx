"use client";

import React from 'react';
import Footer from '@/components/layout/Footer';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

const ITEMS_PER_PAGE_SKELETON = 6; // Default, can be adjusted if needed per page via props later

export default function PageSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
        <div className="flex-1 container px-2 py-8">
            <div className="grid grid-cols-1 md:grid-cols-[288px_1fr] lg:grid-cols-[288px_1fr] gap-4">
                <aside className="hidden md:block">
                    <Skeleton className="h-[600px] w-72 rounded-lg" />
                </aside>
                <main className="w-full space-y-4">
                    <div className="flex justify-between">
                         <Skeleton className="h-10 w-48" />
                         <Skeleton className="h-10 w-32" />
                    </div>
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-64 w-full" />
                </main>
            </div>
        </div>
      <Footer />
    </div>
  );
}
