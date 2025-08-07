'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import DesktopSidebar from '@/components/layout/DesktopSidebar';
import { BottomNavigationBar } from '@/components/layout/BottomNavigationBar';
import { getMockCurrentUser, getMockClubs } from '@/lib/mockData';
import type { User, Club } from '@/types';
import Footer from '@/components/layout/Footer';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [clubInfo, setClubInfo] = React.useState<Club | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  
  React.useEffect(() => {
    const fetchData = async () => {
        const user = await getMockCurrentUser();
        setCurrentUser(user);
        const clubs = await getMockClubs();
        // In a real app, you might get the club from user preferences
        setClubInfo(clubs.length > 0 ? clubs[0] : null);
        setIsLoading(false);
    }
    fetchData();
  }, [pathname]); // Refetch on path change to simulate auth state changes

  const handleProfessionalAccessClick = () => {
    // Logic for professional access dialog
    console.log("Professional Access Clicked");
  }

  const handleLogoutClick = () => {
    // Logic for logout confirmation
    console.log("Logout Clicked");
  }

  // Determine current page for sidebar active state
  const currentPage = pathname.startsWith('/schedule') ? 'agenda'
                    : pathname.startsWith('/activities') && pathname.includes('partidas') ? 'partidas'
                    : pathname.startsWith('/activities') ? 'clases'
                    : 'other';


  return (
    <div className="flex min-h-screen flex-col">
      <div className='flex flex-1'>
        <div className="hidden md:block">
          {!isLoading && (
              <DesktopSidebar
                  currentUser={currentUser}
                  clubInfo={clubInfo}
                  currentPage={currentPage}
                  showFilters={pathname.startsWith('/activities')}
                  onProfessionalAccessClick={handleProfessionalAccessClick}
                  onLogoutClick={handleLogoutClick}
              />
          )}
        </div>
        <main className="flex-1">
          {children}
        </main>
      </div>
      <Footer />
      <BottomNavigationBar />
    </div>
  );
}
