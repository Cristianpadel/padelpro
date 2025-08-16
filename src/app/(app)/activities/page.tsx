// src/app/(app)/activities/page.tsx
import React, { Suspense } from 'react';
import ActivitiesPageContent from './components/ActivitiesPageContent';
import PageSkeleton from '@/components/layout/PageSkeleton';

// This is now a Server Component
// It receives props from the layout and passes them down.
export default function ActivitiesPage(props: any) {
    return (
        // The Suspense boundary is essential for streaming the client component
        // that uses searchParams.
        <Suspense fallback={<PageSkeleton />}>
            <ActivitiesPageContent {...props} />
        </Suspense>
    );
}
