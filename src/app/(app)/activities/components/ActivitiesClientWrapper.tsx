// src/app/(app)/activities/components/ActivitiesClientWrapper.tsx
"use client";

import React, { useState, useEffect } from 'react';
import type { User } from '@/types';
import { getMockCurrentUser } from '@/lib/mockData';
import ActivitiesPageContent from './ActivitiesPageContent';
import PageSkeleton from '@/components/layout/PageSkeleton';

export default function ActivitiesClientWrapper() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loadingUser, setLoadingUser] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            setLoadingUser(true);
            const user = await getMockCurrentUser();
            setCurrentUser(user);
            setLoadingUser(false);
        };
        fetchUser();
    }, []);

    const handleUserUpdate = (newFavoriteIds: string[]) => {
      setCurrentUser(prevUser => prevUser ? { ...prevUser, favoriteInstructorIds: newFavoriteIds } : null);
    };

    if (loadingUser) {
        return <PageSkeleton />;
    }

    return (
        <ActivitiesPageContent
            currentUser={currentUser}
            onCurrentUserUpdate={handleUserUpdate}
        />
    );
}
