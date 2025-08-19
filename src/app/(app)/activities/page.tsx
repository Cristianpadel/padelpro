// src/app/(app)/activities/page.tsx
import React, { Suspense } from 'react';
import ActivitiesClientWrapper from './components/ActivitiesClientWrapper';
import PageSkeleton from '@/components/layout/PageSkeleton';

export default function ActivitiesPage() {
    return (
        <Suspense fallback={<PageSkeleton />}>
            <ActivitiesClientWrapper />
        </Suspense>
    );
}
