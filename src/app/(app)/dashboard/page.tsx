// src/app/(app)/dashboard/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { getMockCurrentUser } from '@/lib/mockData';
import type { User } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import PersonalClasses from '@/components/schedule/PersonalClasses';
import PersonalMatches from '@/components/schedule/PersonalMatches';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Users } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { BalanceCard } from '@/components/schedule/BalanceCard';
import { PointsCard } from '@/components/schedule/PointsCard';
import { RecommendedClasses } from '@/app/(app)/dashboard/components/RecommendedClasses';

export default function DashboardPage() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const searchParams = useSearchParams();

    useEffect(() => {
        const fetchUser = async () => {
            setLoading(true);
            const user = await getMockCurrentUser();
            setCurrentUser(user);
            setLoading(false);
        };
        fetchUser();
    }, []);

    const handleBookingActionSuccess = useCallback(() => {
        setRefreshKey(prevKey => prevKey + 1);
    }, []);

    const defaultTab = searchParams.get('view') || (currentUser?.preferredGameType === 'partidas' ? 'matches' : 'classes');

    if (loading || !currentUser) {
        return (
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <header>
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-4 w-2/3 mt-2" />
                </header>
                <main className="flex-1 space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <Skeleton className="h-40 w-full" />
                        <Skeleton className="h-40 w-full" />
                        <Skeleton className="h-40 w-full lg:col-span-1" />
                    </div>
                    <Skeleton className="h-10 w-full md:w-1/2" />
                    <Skeleton className="h-64 w-full" />
                </main>
            </div>
        );
    }
    
    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
            <header>
                <h1 className="font-headline text-3xl font-semibold">Mi Agenda</h1>
                <p className="text-muted-foreground">
                    Aquí tienes un resumen de tus próximas clases y partidas.
                </p>
            </header>
            <main className="flex-1 space-y-6">
                 <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <BalanceCard />
                    <PointsCard />
                    <RecommendedClasses />
                </div>

                 <Tabs defaultValue={defaultTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="classes">
                            <Calendar className="mr-2 h-4 w-4" /> Clases
                        </TabsTrigger>
                        <TabsTrigger value="matches">
                            <Users className="mr-2 h-4 w-4" /> Partidas
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="classes" className="mt-6">
                        <PersonalClasses 
                            key={`classes-${refreshKey}`}
                            currentUser={currentUser} 
                            onBookingActionSuccess={handleBookingActionSuccess}
                        />
                    </TabsContent>
                    <TabsContent value="matches" className="mt-6">
                         <PersonalMatches
                            key={`matches-${refreshKey}`}
                            currentUser={currentUser}
                            onBookingActionSuccess={handleBookingActionSuccess}
                        />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
