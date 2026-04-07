'use client';

import { useAuth } from '@/context/auth-context';
import { useApp } from '@/context/app-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Wallet,
  Calendar,
  Bell,
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
  MapPin,
  ArrowRight,
  CheckCircle,
  XCircle,
  UserCheck,
  FileText,
  AlertCircle,
  CreditCard,
  Building2,
  Image as ImageIcon,
  Star,
  Settings,
  ChevronRight,
  Activity,
  Zap,
  Eye,
} from 'lucide-react';
import { api, CacheManager } from '@/lib/api-client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { FinanceSummary, SafeUser, Transaction, Payment } from '@/types';

// Types for page navigation
type PageType = 'dashboard' | 'finance' | 'payment' | 'users' | 'agenda' | 'information' | 'gallery' | 'reviews' | 'settings' | 'profile' | 'organization';

interface DashboardHomeProps {
  onNavigate?: (page: PageType) => void;
}

export function DashboardHome({ onNavigate }: DashboardHomeProps) {
  const { user, permissions } = useAuth();
  const { settings, agendas, informations, pengurus, galleries, reviews } = useApp();
  const [financeA, setFinanceA] = useState<FinanceSummary | null>(null);
  const [financeB, setFinanceB] = useState<FinanceSummary | null>(null);
  const [pendingUsers, setPendingUsers] = useState<SafeUser[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const hasLoadedRef = useRef(false);

  const loadData = useCallback(async () => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const promises: Promise<unknown>[] = [];
      
      // Load finance for user's blok (or both for superadmin)
      if (permissions?.canViewFinance) {
        promises.push(api.getFinanceSummary());
        if (permissions.canViewAllUsers || user?.role === 'SUPERADMIN') {
          // Superadmin can see both bloks
          promises.push(api.getTransactions({ limit: 5 }));
        }
      }
      
      // Load pending users for admins
      if (permissions?.canApproveUsers) {
        promises.push(api.getPendingUsers());
      }
      
      // Load pending payments for admins/bendahara
      if (permissions?.canApprovePayment) {
        promises.push(api.getPendingPayments());
      }
      
      const results = await Promise.allSettled(promises);
      
      let resultIndex = 0;
      
      if (permissions?.canViewFinance) {
        const financeResult = results[resultIndex];
        if (financeResult.status === 'fulfilled') {
          const res = financeResult.value as { ok: boolean; data?: FinanceSummary; error?: string };
          if (res.ok && res.data) {
            // Set finance based on user's blok
            if (user?.blok === 'A') {
              setFinanceA(res.data);
            } else {
              setFinanceB(res.data);
            }
          }
        }
        resultIndex++;
        
        // Load recent transactions for superadmin
        if (permissions.canViewAllUsers || user?.role === 'SUPERADMIN') {
          const transResult = results[resultIndex];
          if (transResult.status === 'fulfilled') {
            const res = transResult.value as { ok: boolean; data?: Transaction[] };
            if (res.ok && res.data) {
              setRecentTransactions(res.data);
            }
          }
          resultIndex++;
        }
      }
      
      if (permissions?.canApproveUsers) {
        const pendingResult = results[resultIndex];
        if (pendingResult.status === 'fulfilled') {
          const res = pendingResult.value as { ok: boolean; data?: SafeUser[] };
          if (res.ok && res.data) {
            setPendingUsers(res.data);
          }
        }
        resultIndex++;
      }
      
      if (permissions?.canApprovePayment) {
        const paymentResult = results[resultIndex];
        if (paymentResult.status === 'fulfilled') {
          const res = paymentResult.value as { ok: boolean; data?: Payment[] };
          if (res.ok && res.data) {
            setPendingPayments(res.data);
          }
        }
        resultIndex++;
      }
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat data';
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [permissions, user?.blok, user?.role, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refreshData = useCallback(() => {
    hasLoadedRef.current = false;
    loadData();
  }, [loadData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  // Get finance based on user blok
  const userFinance = user?.blok === 'A' ? financeA : financeB;
  const saldoAwal = user?.blok === 'A' ? settings?.saldoAwalA : settings?.saldoAwalB;

  // Navigate helper
  const navigateTo = (page: PageType) => {
    if (onNavigate) {
      onNavigate(page);
    }
  };

  // Quick action items based on permissions
  const quickActions = [
    { 
      id: 'payment', 
      label: 'Bayar Iuran', 
      icon: CreditCard, 
      color: 'bg-emerald-500',
      show: permissions?.canSubmitPayment,
      page: 'payment' as PageType
    },
    { 
      id: 'agenda', 
      label: 'Agenda Baru', 
      icon: Calendar, 
      color: 'bg-blue-500',
      show: permissions?.canCreateAgenda,
      page: 'agenda' as PageType
    },
    { 
      id: 'information', 
      label: 'Buat Info', 
      icon: Bell, 
      color: 'bg-amber-500',
      show: permissions?.canCreateInformation,
      page: 'information' as PageType
    },
    { 
      id: 'users', 
      label: 'Kelola Warga', 
      icon: Users, 
      color: 'bg-purple-500',
      show: permissions?.canApproveUsers,
      page: 'users' as PageType
    },
  ];

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={refreshData}>
              Coba Lagi
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          <span className="ml-2 text-muted-foreground">Memuat data...</span>
        </div>
      )}
      
      {!isLoading && (
        <>
          {/* Banner Section - Show if bannerUrl exists or fallback to default */}
          {(settings?.bannerUrl || true) && (
            <div className="relative w-full h-32 md:h-48 rounded-xl overflow-hidden shadow-lg">
              <img
                src={settings?.bannerUrl || '/banner.jpg'}
                alt="Banner"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/70 to-transparent flex items-center">
                <div className="px-6">
                  <h2 className="text-xl md:text-2xl font-bold text-white">{getGreeting()}, {user?.nama}!</h2>
                  <p className="text-emerald-100 text-sm md:text-base mt-1">
                    Blok {user?.blok} - No. {user?.nomorRumah}
                  </p>
                  <Badge className="mt-2 bg-white/20 text-white border-0">
                    {user?.role === 'SUPERADMIN' ? 'Super Admin' : 
                     user?.role === 'ADMIN' ? 'Admin' : 
                     user?.role === 'BENDAHARA' ? 'Bendahara' : 'Warga'}
                  </Badge>
                </div>
              </div>
              <div className="absolute bottom-4 right-4 hidden md:block">
                <Avatar className="h-14 w-14 border-2 border-white shadow-lg">
                  <AvatarImage src={user?.photoUrl || undefined} />
                  <AvatarFallback className="bg-emerald-500 text-white">
                    {user?.nama?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          )}

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Monthly Fee Card */}
            <Card 
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigateTo('payment')}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Iuran Bulanan</p>
                  <p className="text-xl font-bold">{formatCurrency(settings?.monthlyFee || 0)}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Wallet className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            {/* Pending Tasks Card */}
            <Card 
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigateTo('users')}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm">Tugas Pending</p>
                  <p className="text-xl font-bold">{pendingUsers.length + pendingPayments.length}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Activity className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
            
            {/* Agenda Count Card */}
            <Card 
              className="bg-gradient-to-r from-purple-500 to-violet-600 text-white border-0 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigateTo('agenda')}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Agenda</p>
                  <p className="text-xl font-bold">{agendas.length}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Calendar className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
            
            {/* Gallery Count Card */}
            <Card 
              className="bg-gradient-to-r from-pink-500 to-rose-600 text-white border-0 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigateTo('gallery')}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-pink-100 text-sm">Galeri</p>
                  <p className="text-xl font-bold">{galleries.length}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <ImageIcon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions - Bento Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.filter(a => a.show).map((action) => (
              <Card 
                key={action.id}
                className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.02] border border-border/50"
                onClick={() => navigateTo(action.page)}
              >
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <div className={`h-12 w-12 rounded-xl ${action.color} flex items-center justify-center text-white`}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  <p className="font-medium text-sm">{action.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Finance Summary - Blok Based */}
          {permissions?.canViewFinance && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-emerald-500" />
                  Ringkasan Keuangan Blok {user?.blok}
                </h3>
                <Button variant="ghost" size="sm" onClick={() => navigateTo('finance')}>
                  Lihat Detail <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Saldo Awal */}
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigateTo('finance')}
                >
                  <CardHeader className="pb-2 pt-4">
                    <CardDescription className="flex items-center gap-2 text-xs">
                      <Wallet className="h-3 w-3" />
                      Saldo Awal
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <p className="text-xl font-bold">{formatCurrency(saldoAwal || userFinance?.saldoAwal || 0)}</p>
                  </CardContent>
                </Card>

                {/* Pemasukan */}
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-green-500"
                  onClick={() => navigateTo('finance')}
                >
                  <CardHeader className="pb-2 pt-4">
                    <CardDescription className="flex items-center gap-2 text-xs">
                      <TrendingUp className="h-3 w-3" />
                      Pemasukan
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <p className="text-xl font-bold text-green-600">{formatCurrency(userFinance?.totalPemasukan || 0)}</p>
                  </CardContent>
                </Card>

                {/* Pengeluaran */}
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-red-500"
                  onClick={() => navigateTo('finance')}
                >
                  <CardHeader className="pb-2 pt-4">
                    <CardDescription className="flex items-center gap-2 text-xs">
                      <TrendingDown className="h-3 w-3" />
                      Pengeluaran
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <p className="text-xl font-bold text-red-600">{formatCurrency(userFinance?.totalPengeluaran || 0)}</p>
                  </CardContent>
                </Card>

                {/* Saldo Akhir */}
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950"
                  onClick={() => navigateTo('finance')}
                >
                  <CardHeader className="pb-2 pt-4">
                    <CardDescription className="flex items-center gap-2 text-xs">
                      <Wallet className="h-3 w-3" />
                      Saldo Akhir
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <p className="text-xl font-bold text-emerald-600">{formatCurrency(userFinance?.saldoAkhir || 0)}</p>
                    <p className="text-xs text-muted-foreground">{userFinance?.periodLabel}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Agenda */}
            {settings?.enableAgenda && (
              <Card className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Calendar className="h-5 w-5 text-blue-500" />
                      Agenda Mendatang
                    </CardTitle>
                    <CardDescription>{agendas.length} kegiatan terjadwal</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigateTo('agenda')}>
                    <Eye className="h-4 w-4 mr-1" /> Lihat Semua
                  </Button>
                </CardHeader>
                <CardContent>
                  {agendas.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Tidak ada agenda</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {agendas.slice(0, 4).map((agenda) => (
                        <div 
                          key={agenda.id} 
                          className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                          onClick={() => navigateTo('agenda')}
                        >
                          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                            <Calendar className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate text-sm">{agenda.title}</h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{formatDate(agenda.startDate)}</span>
                              {agenda.startTime && (
                                <>
                                  <span>•</span>
                                  <span>{agenda.startTime}</span>
                                </>
                              )}
                            </div>
                            {agenda.location && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">{agenda.location}</span>
                              </div>
                            )}
                          </div>
                          <Badge variant={agenda.status === 'UPCOMING' ? 'default' : 'secondary'} className="text-xs">
                            {agenda.status === 'UPCOMING' ? 'Akan Datang' : 'Berlangsung'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Latest Information */}
            {settings?.enableInformation && (
              <Card className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Bell className="h-5 w-5 text-amber-500" />
                      Informasi Terkini
                    </CardTitle>
                    <CardDescription>Pengumuman & berita terbaru</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigateTo('information')}>
                    <Eye className="h-4 w-4 mr-1" /> Lihat Semua
                  </Button>
                </CardHeader>
                <CardContent>
                  {informations.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Tidak ada informasi</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {informations.slice(0, 4).map((info) => (
                        <div 
                          key={info.id} 
                          className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                          onClick={() => navigateTo('information')}
                        >
                          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                            <Bell className="h-5 w-5 text-amber-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium truncate text-sm">{info.title}</h4>
                              {info.isPinned && (
                                <Badge variant="secondary" className="text-xs">Pin</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1">{info.content}</p>
                            <p className="text-xs text-muted-foreground mt-1">{formatDate(info.publishedAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Gallery Preview - Bento Style */}
          {settings?.enableGallery && galleries.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ImageIcon className="h-5 w-5 text-purple-500" />
                    Galeri Kegiatan
                  </CardTitle>
                  <CardDescription>{galleries.length} foto terbaru</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigateTo('gallery')}>
                  Lihat Semua <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {galleries.slice(0, 6).map((gallery, index) => (
                    <div 
                      key={gallery.id} 
                      className={`relative group cursor-pointer overflow-hidden rounded-lg ${
                        index === 0 ? 'col-span-2 row-span-2' : ''
                      }`}
                      onClick={() => navigateTo('gallery')}
                    >
                      <img
                        src={gallery.thumbnailUrl || gallery.imageUrl}
                        alt={gallery.title}
                        className={`w-full object-cover transition-transform group-hover:scale-105 ${
                          index === 0 ? 'h-48' : 'h-24'
                        }`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-2 left-2 right-2">
                          <p className="text-white text-xs font-medium truncate">{gallery.title}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Admin Section: Pending Items */}
          {(permissions?.canApproveUsers || permissions?.canApprovePayment) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pending Users */}
              {permissions?.canApproveUsers && pendingUsers.length > 0 && (
                <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg text-amber-700 dark:text-amber-400">
                      <UserCheck className="h-5 w-5" />
                      Warga Menunggu Persetujuan
                    </CardTitle>
                    <CardDescription>{pendingUsers.length} warga menunggu persetujuan</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {pendingUsers.slice(0, 3).map((pendingUser) => (
                        <div key={pendingUser.id} className="flex items-center justify-between p-3 rounded-lg bg-background">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-gray-500 text-white text-xs">
                                {pendingUser.nama.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-medium text-sm">{pendingUser.nama}</h4>
                              <p className="text-xs text-muted-foreground">
                                Blok {pendingUser.blok} - No. {pendingUser.nomorRumah}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700 h-7">
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="destructive" className="h-7">
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => navigateTo('users')}>
                      Kelola Semua Warga <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Pending Payments */}
              {permissions?.canApprovePayment && pendingPayments.length > 0 && (
                <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg text-blue-700 dark:text-blue-400">
                      <CreditCard className="h-5 w-5" />
                      Pembayaran Menunggu Verifikasi
                    </CardTitle>
                    <CardDescription>{pendingPayments.length} pembayaran pending</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {pendingPayments.slice(0, 3).map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg bg-background">
                          <div>
                            <h4 className="font-medium text-sm">{payment.userName}</h4>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(payment.amount)} • {payment.periods.length} periode
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700 h-7">
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="destructive" className="h-7">
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => navigateTo('payment')}>
                      Kelola Pembayaran <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Recent Transactions (for finance viewers) */}
          {permissions?.canViewFinance && recentTransactions.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="h-5 w-5 text-green-500" />
                    Transaksi Terbaru
                  </CardTitle>
                  <CardDescription>Aktivitas keuangan terkini</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigateTo('finance')}>
                  Lihat Semua <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentTransactions.map((tx) => (
                    <div 
                      key={tx.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => navigateTo('finance')}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          tx.type === 'INCOME' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {tx.type === 'INCOME' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{tx.description}</h4>
                          <p className="text-xs text-muted-foreground">{tx.category} • {formatDate(tx.date)}</p>
                        </div>
                      </div>
                      <p className={`font-medium ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reviews Preview */}
          {settings?.enableReviews && reviews.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Star className="h-5 w-5 text-yellow-500" />
                    Testimoni Warga
                  </CardTitle>
                  <CardDescription>{reviews.length} testimoni</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigateTo('reviews')}>
                  Lihat Semua <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reviews.slice(0, 2).map((review) => (
                    <div 
                      key={review.id} 
                      className="p-4 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => navigateTo('reviews')}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-yellow-500 text-white text-xs">
                            {review.userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{review.userName}</p>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Info Card for Warga */}
          {permissions?.canSubmitPayment && (
            <Card className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-200 dark:border-emerald-800">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                      <Wallet className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Iuran Bulanan</h3>
                      <p className="text-2xl font-bold text-emerald-600">
                        {formatCurrency(settings?.monthlyFee || 0)}
                        <span className="text-sm font-normal text-muted-foreground">/bulan</span>
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => navigateTo('payment')} className="bg-emerald-600 hover:bg-emerald-700">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Bayar Iuran Sekarang
                  </Button>
                </div>
                
                {/* Bank Info based on blok */}
                {(user?.blok === 'A' ? settings?.bankInfoA : settings?.bankInfoB) && (
                  <div className="mt-4 p-3 rounded-lg bg-background/50">
                    <p className="text-sm font-medium mb-1">Transfer ke:</p>
                    <p className="text-sm text-muted-foreground">
                      {(user?.blok === 'A' ? settings?.bankInfoA : settings?.bankInfoB)?.bankName} - 
                      {' '}{(user?.blok === 'A' ? settings?.bankInfoA : settings?.bankInfoB)?.bankAccount}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      a.n. {(user?.blok === 'A' ? settings?.bankInfoA : settings?.bankInfoB)?.bankHolder}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
