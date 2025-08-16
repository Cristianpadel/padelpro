// src/app/(app)/layout.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { cn } from '@/lib/utils';
import DesktopSidebar from '@/components/layout/DesktopSidebar';
import { BottomNavigationBar } from '@/components/layout/BottomNavigationBar';
import Footer from '@/components/layout/Footer';
import { getMockCurrentUser, getMockClubs } from '@/lib/mockData';
import type { User, Club } from '@/types';
import LogoutConfirmationDialog from '@/components/layout/LogoutConfirmationDialog';
import ProfessionalAccessDialog from '@/components/layout/ProfessionalAccessDialog';
import { useToast } from '@/hooks/use-toast';
import { setGlobalCurrentUser } from '@/lib/mockData';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [clubInfo, setClubInfo] = React.useState<Club | null>(null);
  const [loading, setLoading] = React.useState(true);

  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = React.useState(false);
  const [isProfessionalAccessOpen, setIsProfessionalAccessOpen] = React.useState(false);

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

    const intervalId = setInterval(fetchUserAndClub, 3000); // Periodically check for user/club changes
    return () => clearInterval(intervalId);
  }, []);

  const handleLogout = () => {
    setIsLogoutConfirmOpen(true);
  };
  
  const handleConfirmLogout = () => {
    setGlobalCurrentUser(null); // Simulate logout
    toast({ title: "Sesión Cerrada" });
    setIsLogoutConfirmOpen(false);
    router.push('/');
  };

  return (
    <>
      <div className="flex min-h-screen">
        <DesktopSidebar
          currentUser={currentUser}
          clubInfo={clubInfo}
          onProfessionalAccessClick={() => setIsProfessionalAccessOpen(true)}
          onLogoutClick={handleLogout}
        />
        <main className="flex-1 flex flex-col">
          {children}
          <Footer />
        </main>
      </div>
      <BottomNavigationBar />

      <LogoutConfirmationDialog
        isOpen={isLogoutConfirmOpen}
        onOpenChange={setIsLogoutConfirmOpen}
        onConfirm={handleConfirmLogout}
      />
      <ProfessionalAccessDialog
        isOpen={isProfessionalAccessOpen}
        onOpenChange={setIsProfessionalAccessOpen}
      />
    </>
  );
}
