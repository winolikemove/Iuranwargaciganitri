'use client';

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard,
  Wallet,
  Users,
  Calendar,
  Bell,
  Image as ImageIcon,
  Star,
  Settings,
  LogOut,
  ChevronUp,
  CreditCard,
  Shield,
  User,
  Menu,
  Building2,
} from 'lucide-react';
import { DashboardHome } from './dashboard/dashboard-home';
import { FinancePage } from './dashboard/finance-page';
import { PaymentPage } from './dashboard/payment-page';
import { UserManagementPage } from './dashboard/user-management-page';
import { AgendaPage } from './dashboard/agenda-page';
import { InformationPage } from './dashboard/information-page';
import { GalleryPage } from './dashboard/gallery-page';
import { ReviewPage } from './dashboard/review-page';
import { SettingsPage } from './dashboard/settings-page';
import { ProfilePage } from './dashboard/profile-page';
import { OrganizationPage } from './dashboard/organization-page';

type PageType = 'dashboard' | 'finance' | 'payment' | 'users' | 'agenda' | 'information' | 'gallery' | 'reviews' | 'settings' | 'profile' | 'organization';

export function Dashboard() {
  const { user, permissions, logout } = useAuth();
  const { settings } = useApp();
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const getRoleBadge = (role: string) => {
    const roleMap: Record<string, { label: string; className: string }> = {
      SUPERADMIN: { label: 'Super Admin', className: 'bg-purple-500' },
      ADMIN: { label: 'Admin', className: 'bg-blue-500' },
      BENDAHARA: { label: 'Bendahara', className: 'bg-amber-500' },
      WARGA: { label: 'Warga', className: 'bg-gray-500' },
    };
    return roleMap[role] || { label: role, className: 'bg-gray-500' };
  };

  const menuItems = [
    {
      group: 'Menu Utama',
      items: [
        { id: 'dashboard' as PageType, label: 'Dashboard', icon: LayoutDashboard, show: true },
        { id: 'finance' as PageType, label: 'Keuangan', icon: Wallet, show: permissions?.canViewFinance },
        { id: 'payment' as PageType, label: 'Pembayaran', icon: CreditCard, show: permissions?.canSubmitPayment || permissions?.canApprovePayment },
      ],
    },
    {
      group: 'Manajemen',
      items: [
        { id: 'users' as PageType, label: 'Warga', icon: Users, show: permissions?.canViewAllUsers || permissions?.canViewOwnBlokUsers },
        { id: 'organization' as PageType, label: 'Struktur Organisasi', icon: Building2, show: true },
        { id: 'agenda' as PageType, label: 'Agenda', icon: Calendar, show: settings?.enableAgenda },
        { id: 'information' as PageType, label: 'Informasi', icon: Bell, show: settings?.enableInformation },
        { id: 'gallery' as PageType, label: 'Galeri', icon: ImageIcon, show: settings?.enableGallery },
        { id: 'reviews' as PageType, label: 'Testimoni', icon: Star, show: settings?.enableReviews },
      ],
    },
    {
      group: 'Pengaturan',
      items: [
        { id: 'settings' as PageType, label: 'Pengaturan', icon: Settings, show: permissions?.canManageSettings || permissions?.canManageRoles },
      ],
    },
  ];

  const roleBadge = getRoleBadge(user?.role || 'WARGA');

  const handleLogout = () => {
    logout();
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardHome />;
      case 'finance':
        return <FinancePage />;
      case 'payment':
        return <PaymentPage />;
      case 'users':
        return <UserManagementPage />;
      case 'agenda':
        return <AgendaPage />;
      case 'information':
        return <InformationPage />;
      case 'gallery':
        return <GalleryPage />;
      case 'reviews':
        return <ReviewPage />;
      case 'settings':
        return <SettingsPage />;
      case 'profile':
        return <ProfilePage />;
      case 'organization':
        return <OrganizationPage />;
      default:
        return <DashboardHome />;
    }
  };

  return (
    <SidebarProvider>
      <Sidebar className="border-r">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-sm truncate">{settings?.siteName || 'Pradha'}</h2>
              <p className="text-xs text-muted-foreground truncate">Manajemen Warga</p>
            </div>
          </div>
        </SidebarHeader>
        
        <SidebarContent>
          {menuItems.map((group) => (
            <SidebarGroup key={group.group}>
              <SidebarGroupLabel>{group.group}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.filter(item => item.show).map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={currentPage === item.id}
                        onClick={() => setCurrentPage(item.id)}
                      >
                        <button>
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
        
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton className="w-full">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user?.photoUrl || undefined} />
                      <AvatarFallback className="text-xs bg-emerald-500 text-white">
                        {user?.nama?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium truncate">{user?.nama}</p>
                      <p className="text-xs text-muted-foreground truncate">{roleBadge.label}</p>
                    </div>
                    <ChevronUp className="h-4 w-4 ml-auto" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width]">
                  <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setCurrentPage('profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Profil
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />
          <div className="flex-1">
            <h1 className="text-lg font-semibold">
              {menuItems.flatMap(g => g.items).find(i => i.id === currentPage)?.label || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={roleBadge.className}>{roleBadge.label}</Badge>
          </div>
        </header>
        
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {renderPage()}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
