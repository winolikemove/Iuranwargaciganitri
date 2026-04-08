'use client';

import { useState, useEffect, useMemo } from 'react';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Building2,
  Home,
  X,
  BellRing,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Info,
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
import { FinanceReportPage } from './dashboard/finance-report-page';
import { cn } from '@/lib/utils';

export type PageType = 'dashboard' | 'finance' | 'payment' | 'users' | 'agenda' | 'information' | 'gallery' | 'reviews' | 'settings' | 'profile' | 'organization' | 'finance-report';

// Notification type
interface Notification {
  id: string;
  type: 'information' | 'agenda' | 'payment' | 'user';
  title: string;
  description: string;
  timestamp: string;
  redirectPage: PageType;
  redirectId?: string;
  isRead: boolean;
}

export function Dashboard() {
  const { user, permissions, logout } = useAuth();
  const { settings, agendas, informations } = useApp();
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Load read notifications from localStorage
  useEffect(() => {
    if (user?.id) {
      const stored = localStorage.getItem(`notifications_read_${user.id}`);
      if (stored) {
        setReadNotifications(new Set(JSON.parse(stored)));
      }
    }
  }, [user?.id]);

  // Generate notifications based on user role and block
  const notifications = useMemo<Notification[]>(() => {
    if (!user) return [];
    
    const notifs: Notification[] = [];
    const userBlok = user.blok?.toUpperCase() || '';
    
    // Information notifications - filtered by user's block or ALL
    const relevantInformations = informations.filter(info => {
      const targetBlok = (info.targetBlok || '').toUpperCase();
      return targetBlok === 'ALL' || targetBlok === userBlok;
    });
    
    relevantInformations.slice(0, 5).forEach(info => {
      notifs.push({
        id: `info-${info.id}`,
        type: 'information',
        title: info.title,
        description: info.content?.slice(0, 80) + ((info.content?.length || 0) > 80 ? '...' : ''),
        timestamp: info.createdAt || info.publishedAt || new Date().toISOString(),
        redirectPage: 'information',
        redirectId: info.id,
        isRead: readNotifications.has(`info-${info.id}`)
      });
    });

    // Agenda notifications - upcoming agendas
    const upcomingAgendas = agendas.filter(agenda => {
      const targetBlok = (agenda.targetBlok || '').toUpperCase();
      return (targetBlok === 'ALL' || targetBlok === userBlok) &&
      agenda.status === 'UPCOMING';
    });
    
    upcomingAgendas.slice(0, 3).forEach(agenda => {
      notifs.push({
        id: `agenda-${agenda.id}`,
        type: 'agenda',
        title: agenda.title,
        description: `${agenda.startDate}${agenda.startTime ? ` • ${agenda.startTime}` : ''}`,
        timestamp: agenda.createdAt || new Date().toISOString(),
        redirectPage: 'agenda',
        redirectId: agenda.id,
        isRead: readNotifications.has(`agenda-${agenda.id}`)
      });
    });

    // Admin notifications - pending users
    if (permissions?.canApproveUsers) {
      notifs.push({
        id: 'pending-users',
        type: 'user',
        title: 'Warga Menunggu Persetujuan',
        description: 'Ada warga baru yang menunggu persetujuan akun',
        timestamp: new Date().toISOString(),
        redirectPage: 'users',
        isRead: readNotifications.has('pending-users')
      });
    }

    // Admin/Bendahara notifications - pending payments
    if (permissions?.canApprovePayment) {
      notifs.push({
        id: 'pending-payments',
        type: 'payment',
        title: 'Pembayaran Menunggu Verifikasi',
        description: 'Ada pembayaran yang perlu diverifikasi',
        timestamp: new Date().toISOString(),
        redirectPage: 'payment',
        isRead: readNotifications.has('pending-payments')
      });
    }

    // Sort by timestamp (newest first) and unread first
    return notifs.sort((a, b) => {
      if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [user, informations, agendas, permissions, readNotifications]);

  // Count unread notifications
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

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
        { id: 'finance-report' as PageType, label: 'Laporan Keuangan', icon: Wallet, show: permissions?.canViewFinance },
        { id: 'finance' as PageType, label: 'Kelola Keuangan', icon: Wallet, show: permissions?.canCreateTransaction },
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

  const handleNavigate = (page: PageType) => {
    setCurrentPage(page);
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    const newReadSet = new Set(readNotifications);
    newReadSet.add(notification.id);
    setReadNotifications(newReadSet);
    localStorage.setItem(`notifications_read_${user?.id}`, JSON.stringify([...newReadSet]));
    
    // Close popover and navigate
    setIsNotificationOpen(false);
    setCurrentPage(notification.redirectPage);
  };

  const clearAllNotifications = () => {
    const allIds = notifications.map(n => n.id);
    setReadNotifications(new Set(allIds));
    localStorage.setItem(`notifications_read_${user?.id}`, JSON.stringify(allIds));
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardHome onNavigate={handleNavigate} />;
      case 'finance':
        return <FinancePage />;
      case 'finance-report':
        return <FinanceReportPage onBack={() => setCurrentPage('dashboard')} />;
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
        return <DashboardHome onNavigate={handleNavigate} />;
    }
  };

  // Get current page label
  const getCurrentPageLabel = () => {
    for (const group of menuItems) {
      const item = group.items.find(i => i.id === currentPage);
      if (item) return item.label;
    }
    return 'Dashboard';
  };

  // Format timestamp to relative time
  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'information':
        return <Info className="h-4 w-4 text-cyan-500" />;
      case 'agenda':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'payment':
        return <CreditCard className="h-4 w-4 text-emerald-500" />;
      case 'user':
        return <User className="h-4 w-4 text-amber-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <SidebarProvider>
      <Sidebar className="border-r">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-2">
            <img
              src={settings?.logoUrl || '/logo.jpg'}
              alt={settings.siteName || 'Logo'}
              className="w-10 h-10 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-sm truncate">{settings?.siteName || 'Pradha Ciganitri'}</h2>
              <p className="text-xs text-muted-foreground truncate">{settings?.siteDescription || 'Manajemen Warga'}</p>
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
        <header className="flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6 sticky top-0 z-10">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />
          <div className="flex-1">
            <h1 className="text-lg font-semibold">
              {getCurrentPageLabel()}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={roleBadge.className}>{roleBadge.label}</Badge>
            {user?.blok && (
              <Badge variant="outline">Blok {user.blok}</Badge>
            )}
            
            {/* Notification Bell */}
            <Popover open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
              <PopoverTrigger asChild>
                <button
                  className="relative rounded-full p-2 hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="font-semibold flex items-center gap-2">
                    <BellRing className="h-4 w-4" />
                    Notifikasi
                  </h3>
                  {unreadCount > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs h-auto py-1 px-2"
                      onClick={clearAllNotifications}
                    >
                      Tandai semua dibaca
                    </Button>
                  )}
                </div>
                
                <ScrollArea className="h-[300px]">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <Bell className="h-8 w-8 mb-2 opacity-50" />
                      <p className="text-sm">Tidak ada notifikasi</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {notifications.map((notification) => (
                        <button
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={cn(
                            "w-full text-left p-4 hover:bg-muted/50 transition-colors",
                            !notification.isRead && "bg-primary/5"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className={cn(
                                  "text-sm font-medium truncate",
                                  !notification.isRead && "text-primary"
                                )}>
                                  {notification.title}
                                </p>
                                {!notification.isRead && (
                                  <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                {notification.description}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {formatRelativeTime(notification.timestamp)}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                
                {notifications.length > 0 && (
                  <div className="p-2 border-t">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full text-xs"
                      onClick={() => {
                        setIsNotificationOpen(false);
                        setCurrentPage('information');
                      }}
                    >
                      Lihat Semua Informasi
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </header>
        
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {renderPage()}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
