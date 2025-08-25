"use client";

import React, { useEffect, useState } from 'react';
import type { User } from '@/types';
import { getMockCurrentUser } from '@/lib/mockData';
import MatchesPageContent from './MatchesPageContent';
import PageSkeleton from '@/components/layout/PageSkeleton';

export default function MatchesClientWrapper() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const run = async () => {
      setLoadingUser(true);
      const user = await getMockCurrentUser();
      setCurrentUser(user);
      setLoadingUser(false);
    };
    run();
  }, []);

  if (loadingUser) return <PageSkeleton />;
  return <MatchesPageContent currentUser={currentUser} />;
}
