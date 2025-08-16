// src/app/(app)/activities/page.tsx
import React, { Suspense } from 'react';
import ActivitiesPageContent from './components/ActivitiesPageContent';
import PageSkeleton from '@/components/layout/PageSkeleton';

export default function ActivitiesPage() {
    return (
        <Suspense fallback={<PageSkeleton />}>
            <ActivitiesPageContent />
        </Suspense>
    );
}
