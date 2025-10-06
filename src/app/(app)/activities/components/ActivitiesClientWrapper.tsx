// src/app/(app)/activities/components/ActivitiesClientWrapper.tsx
"use client";

import React, { useState, useEffect } from 'react';
import type { User } from '@/types';
import { getMockCurrentUser, performInitialization } from '@/lib/mockData';
import ActivitiesPageContent from './ActivitiesPageContent';
import PageSkeleton from '@/components/layout/PageSkeleton';

export default function ActivitiesClientWrapper() {
    // Ensure mock data is initialized when visiting Activities directly
    performInitialization();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loadingUser, setLoadingUser] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            setLoadingUser(true);
            try {
                // Intentar obtener usuario real de la API primero
                const response = await fetch('/api/me', { 
                    credentials: 'include',
                    cache: 'no-store' 
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data?.user) {
                        // Mapear campos de la BD al formato esperado por el frontend
                        const mappedUser = {
                            ...data.user,
                            credit: data.user.credits || 0, // Mapear credits -> credit
                            blockedCredit: data.user.blockedCredit || 0,
                            loyaltyPoints: data.user.loyaltyPoints || 0
                        };
                        console.log('✅ Usuario real cargado:', mappedUser.name, 'Crédito:', mappedUser.credit);
                        setCurrentUser(mappedUser);
                        setLoadingUser(false);
                        return;
                    }
                }
                
                // Fallback al usuario mock si no hay usuario real
                console.log('⚠️ Fallback a usuario mock');
                const user = await getMockCurrentUser();
                setCurrentUser(user);
            } catch (error) {
                console.error('❌ Error cargando usuario:', error);
                // Fallback al usuario mock en caso de error
                const user = await getMockCurrentUser();
                setCurrentUser(user);
            }
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
