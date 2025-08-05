'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarDays,
  Gem,
  LayoutDashboard,
  LogOut,
  Star,
  Store,
  Trophy,
  User,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { PadelRacketIcon } from '@/components/PadelRacketIcon';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'My Agenda' },
  { href: '/activities', icon: CalendarDays, label: 'Activities' },
  { href: '/match-day', icon: Trophy, label: 'Match-Day' },
  { href: '/book-with-points', icon: Star, label: 'Book with Points' },
  { href: '/store', icon: Store, label: 'Store' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex h-10 items-center gap-2.5 px-2">
            <PadelRacketIcon className="h-6 w-6 text-primary" />
            <h2 className="font-headline text-xl font-semibold tracking-tighter text-sidebar-foreground">
              PadelPro
            </h2>
            <div className="ml-auto">
              <SidebarTrigger className="text-sidebar-foreground" />
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={{ children: item.label }}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarSeparator />
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={{ children: 'Profile' }}>
                <Link href="#">
                  <Avatar className="h-7 w-7">
                    <AvatarImage
                      src="https://placehold.co/40x40.png"
                      alt="User Avatar"
                      data-ai-hint="profile avatar"
                    />
                    <AvatarFallback>AD</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Alex Doe</span>
                    <span className="text-xs text-sidebar-foreground/70">
                      Level 2.5
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={{ children: 'Logout' }}>
                <Link href="/">
                  <LogOut />
                  <span>Logout</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
