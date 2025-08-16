// src/app/(app)/add-class/page.tsx
import React, { Suspense } from 'react';
import AddClassPageContent from './components/AddClassPageContent';
import PageSkeleton from '@/components/layout/PageSkeleton';

export default function AddClassPage() {
    return (
        <Suspense fallback={<PageSkeleton />}>
            <AddClassPageContent />
        </Suspense>
    );
}
