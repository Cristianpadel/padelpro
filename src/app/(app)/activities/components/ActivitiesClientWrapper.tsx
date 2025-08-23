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
        // Keep in sync with global current user updates (e.g., favorites changes from sidebar)
        const id = setInterval(async () => {
            const fresh = await getMockCurrentUser();
            setCurrentUser(prev => {
                // Update only if something relevant changed to avoid re-renders
                if (!prev && fresh) return fresh;
                if (prev && fresh) {
                    const prevFav = prev.favoriteInstructorIds?.join(',') || '';
                    const newFav = fresh.favoriteInstructorIds?.join(',') || '';
                    if (
                        prevFav !== newFav ||
                        prev.name !== fresh.name ||
                        prev.level !== fresh.level ||
                        prev.profilePictureUrl !== fresh.profilePictureUrl
                    ) {
                        return fresh;
                    }
                }
                return prev;
            });
        }, 2500);
        return () => clearInterval(id);
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
