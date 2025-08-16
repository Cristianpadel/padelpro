// src/app/(app)/activities/page.tsx
import React, { Suspense } from 'react';
import ActivitiesPageContent from './components/ActivitiesPageContent';
import PageSkeleton from '@/components/layout/PageSkeleton';

// This page now accepts `activityFilters` as a prop from the layout
export default function ActivitiesPage({ activityFilters }: { activityFilters?: any }) {
    if (!activityFilters) {
        // This can happen during initial server render before client hydration adds the props.
        // The Suspense boundary will handle showing the skeleton.
        return <PageSkeleton />;
    }

    return (
        <Suspense fallback={<PageSkeleton />}>
            <ActivitiesPageContent activityFilters={activityFilters} />
        </Suspense>
    );
}
