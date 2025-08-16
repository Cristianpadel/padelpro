// src/app/(app)/AppLayoutClient.tsx
'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';

import DesktopSidebar from '@/components/layout/DesktopSidebar';
import { BottomNavigationBar } from '@/components/layout/BottomNavigationBar';
import Footer from '@/components/layout/Footer';
import { getMockCurrentUser, getMockClubs, setGlobalCurrentUser, updateUserFavoriteInstructors } from '@/lib/mockData';
import type { User, Club, TimeOfDayFilterType, MatchPadelLevel, ViewPreference, ActivityViewType } from '@/types';
import LogoutConfirmationDialog from '@/components/layout/LogoutConfirmationDialog';
import ProfessionalAccessDialog from '@/components/layout/ProfessionalAccessDialog';
import { useToast } from '@/hooks/use-toast';
import { useActivityFilters } from '@/hooks/useActivityFilters';
import { MobileFiltersSheet } from '@/components/layout/MobileFiltersSheet';

export default function AppLayoutClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [clubInfo, setClubInfo] = React.useState<Club | null>(null);
  const [loading, setLoading] = React.useState(true);

  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = React.useState(false);
  const [isProfessionalAccessOpen, setIsProfessionalAccessOpen] = React.useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = React.useState(false);


  React.useEffect(() => {
    const fetchUserAndClub = async () => {
      setLoading(true);
      const user = await getMockCurrentUser();
      const clubs = await getMockClubs();
      setCurrentUser(user);
      setClubInfo(clubs.length > 0 ? clubs[0] : null);
      setLoading(false);
    };
    fetchUserAndClub();

    const intervalId = setInterval(fetchUserAndClub, 3000); 
    return () => clearInterval(intervalId);
  }, []);

  const handleLogout = () => {
    setIsLogoutConfirmOpen(true);
  };
  
  const handleConfirmLogout = () => {
    setGlobalCurrentUser(null);
    toast({ title: "Sesión Cerrada" });
    setIsLogoutConfirmOpen(false);
    router.push('/');
  };

  const {
      activeView,
      timeSlotFilter,
      selectedLevel,
      filterByFavorites,
      viewPreference,
      isUpdatingFavorites,
      showPointsBonus,
      handleTimeFilterChange,
      handleLevelChange,
      handleApplyFavorites,
      handleViewPrefChange,
      handleTogglePointsBonus,
      updateUrlFilter,
      clearAllFilters
  } = useActivityFilters(currentUser, (newFavoriteIds) => {
      setCurrentUser(prevUser => prevUser ? { ...prevUser, favoriteInstructorIds: newFavoriteIds } : null);
  });

  return (
    <>
      <div className="flex min-h-screen">
        <DesktopSidebar
            currentUser={currentUser}
            clubInfo={clubInfo}
            onProfessionalAccessClick={() => setIsProfessionalAccessOpen(true)}
            onLogoutClick={handleLogout}
            onMobileFiltersClick={() => setIsMobileFiltersOpen(true)}
             // Filters props
            isActivitiesPage={pathname.startsWith('/activities')}
            activeView={activeView}
            timeSlotFilter={timeSlotFilter}
            selectedLevel={selectedLevel}
            viewPreference={viewPreference}
            filterByFavorites={filterByFavorites}
            showPointsBonus={showPointsBonus}
            handleLevelChange={handleLevelChange}
            handleTimeFilterChange={handleTimeFilterChange}
            handleViewPrefChange={handleViewPrefChange}
            handleTogglePointsBonus={handleTogglePointsBonus}
            handleApplyFavorites={handleApplyFavorites}
            updateUrlFilter={updateUrlFilter}
        />
        <main className="flex-1 flex flex-col">
          {children}
          <Footer />
        </main>
      </div>
      <BottomNavigationBar onMobileFiltersClick={() => setIsMobileFiltersOpen(true)} />

      <LogoutConfirmationDialog
        isOpen={isLogoutConfirmOpen}
        onOpenChange={setIsLogoutConfirmOpen}
        onConfirm={handleConfirmLogout}
      />
      <ProfessionalAccessDialog
        isOpen={isProfessionalAccessOpen}
        onOpenChange={setIsProfessionalAccessOpen}
      />
       <MobileFiltersSheet
            isOpen={isMobileFiltersOpen}
            onOpenChange={setIsMobileFiltersOpen}
            timeSlotFilter={timeSlotFilter}
            selectedLevel={selectedLevel}
            viewPreference={viewPreference}
            filterByFavorites={filterByFavorites}
            showPointsBonus={showPointsBonus}
            onTimeFilterChange={handleTimeFilterChange}
            onLevelChange={handleLevelChange}
            onViewPreferenceChange={(pref) => handleViewPrefChange(pref, activeView as ActivityViewType)}
            onFavoritesClick={() => updateUrlFilter('favorites', !filterByFavorites)}
            onTogglePointsBonus={handleTogglePointsBonus}
            onClearFilters={clearAllFilters}
        />
    </>
  );
}