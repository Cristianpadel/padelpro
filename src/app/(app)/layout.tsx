'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Star,
  Store,
  Trophy,
  Users,
  Eye,
  Clock,
  CircleHelp,
  BarChart,
  UserPlus,
  PlusCircle,
  Shield,
  WalletCards,
  UserCog,
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

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Agenda' },
  { href: '/activities', icon: Users, label: 'Classes' },
  { href: '/matches', icon: Trophy, label: 'Partidas' },
  { href: '/match-day', icon: CalendarDays, label: 'Match-Day' },
  { href: '/book-with-points', icon: Star, label: 'Reservar con Puntos' },
  { href: '/view-points', icon: Eye, label: 'Ver Puntos' },
  { href: '/store', icon: Store, label: 'Tienda' },
];

const adminItems = [
    { href: '/add-class', icon: PlusCircle, label: 'Añadir Clase' },
    { href: '/instructor/preferences', icon: UserCog, label: 'Preferencias' },
    { href: '/add-instructor', icon: UserPlus, label: 'Añadir Instructor'},
    { href: '/add-credit', icon: WalletCards, label: 'Añadir Crédito' },
    { href: '/admin', icon: Shield, label: 'Panel de Admin' }
]

const timeFilters = [
    { icon: Clock, label: "Todos los Horarios" },
    { icon: Clock, label: "Mañanas (08-13h)" },
    { icon: Clock, label: "Mediodía (13-18h)" },
    { icon: Clock, label: "Tardes (18-22h)" },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader>
          <div className="flex h-10 items-center gap-2.5 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-5 w-5"
                >
                    <path
                    d="M12.378 1.602a.75.75 0 00-.756 0L3.366 6.174A.75.75 0 003 6.828v10.344a.75.75 0 00.366.654l8.256 4.572a.75.75 0 00.756 0l8.256-4.572a.75.75 0 00.366-.654V6.828a.75.75 0 00-.366-.654L12.378 1.602zM12 15.25a3.25 3.25 0 100-6.5 3.25 3.25 0 000 6.5z"
                    />
                </svg>
            </div>
            <div className="flex flex-col">
              <h2 className="font-headline text-lg font-semibold tracking-tighter text-sidebar-foreground">
                PadelPro
              </h2>
            </div>
            <div className="ml-auto">
              <SidebarTrigger className="text-sidebar-foreground" />
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
             <SidebarMenuItem>
                 <SidebarMenuButton
                  asChild
                  isActive={pathname === '/dashboard'}
                  tooltip={{ children: 'Agenda' }}
                >
                  <Link href="/dashboard">
                    <Avatar className="h-7 w-7">
                        <AvatarImage
                        src="https://placehold.co/40x40.png"
                        alt="User Avatar"
                        data-ai-hint="profile avatar"
                        />
                        <AvatarFallback>AD</AvatarFallback>
                    </Avatar>
                    <span>Mi Agenda</span>
                  </Link>
                </SidebarMenuButton>
             </SidebarMenuItem>
            {navItems.slice(1).map((item) => (
                <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                        asChild
                        isActive={pathname.startsWith(item.href)}
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

           <SidebarSeparator className="my-4"/>
            <SidebarMenu>
                <SidebarMenuItem>
                    <div className="px-2 text-xs font-medium text-sidebar-foreground/70 group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0">Admin Panel</div>
                </SidebarMenuItem>
                {adminItems.map((item, index) => (
                    <SidebarMenuItem key={index}>
                        <SidebarMenuButton
                        asChild
                        isActive={pathname.startsWith(item.href)}
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


            <SidebarSeparator className="my-4"/>
            <SidebarMenu>
                {timeFilters.map((item, index) => (
                    <SidebarMenuItem key={index}>
                        <SidebarMenuButton
                        asChild
                        isActive={index === 0}
                        tooltip={{ children: item.label }}
                        >
                        <Link href="#">
                            <item.icon />
                            <span>{item.label}</span>
                        </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
            <SidebarSeparator className="my-4"/>
            <SidebarMenu>
                 <SidebarMenuItem>
                    <SidebarMenuButton
                    asChild
                    isActive={true}
                    tooltip={{ children: "Nivel 4.5" }}
                    >
                    <Link href="#">
                        <BarChart />
                        <span>Nivel 4.5</span>
                    </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton
                    asChild
                    isActive={false}
                    tooltip={{ children: "Disponibles" }}
                    >
                    <Link href="#">
                        <CircleHelp />
                        <span>Disponibles</span>
                    </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
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
