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
  AlertCircle,
  CreditCard,
  Building2,
  Image as ImageIcon,
  Star,
  ChevronRight,
  Activity,
  Eye,
  Plus,
} from 'lucide-react';
import { api, CacheManager } from '@/lib/api-client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { FinanceSummary, SafeUser, Transaction, Payment } from '@/types';

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
      
      if (permissions?.canViewFinance) {
        promises.push(api.getFinanceSummary());
        if (permissions.canViewAllUsers || user?.role === 'SUPERADMIN') {
          promises.push(api.getTransactions({ limit: 5 }));
        }
      }
      
      if (permissions?.canApproveUsers) {
        promises.push(api.getPendingUsers());
      }
      
      if (permissions?.canApprovePayment) {
        promises.push(api.getPendingPayments());
      }
      
      const results = await Promise.allSettled(promises);
      
      let resultIndex = 0;
      
      if (permissions?.canViewFinance) {
        const financeResult = results[resultIndex];
        if (financeResult.status === 'fulfilled') {
          const res = financeResult.value as { ok: boolean; data?: FinanceSummary };
          if (res.ok && res.data) {
            if (user?.blok === 'A') {
              setFinanceA(res.data);
            } else {
              setFinanceB(res.data);
            }
          }
        }
        resultIndex++;
        
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

  const userFinance = user?.blok === 'A' ? financeA : financeB;
  const saldoAwal = user?.blok === 'A' ? settings?.saldoAwalA : settings?.saldoAwalB;

  const navigateTo = (page: PageType) => {
    if (onNavigate) {
      onNavigate(page);
    }
  };

  const quickActions = [
    { 
      id: 'payment', 
      label: 'Bayar Iuran', 
      icon: CreditCard, 
      show: permissions?.canSubmitPayment,
      page: 'payment' as PageType
    },
    { 
      id: 'agenda', 
      label: 'Agenda Baru', 
      icon: Calendar, 
      show: permissions?.canCreateAgenda,
      page: 'agenda' as PageType
    },
    { 
      id: 'information', 
      label: 'Buat Info', 
      icon: Bell, 
      show: permissions?.canCreateInformation,
      page: 'information' as PageType
    },
    { 
      id: 'users', 
      label: 'Kelola Warga', 
      icon: Users, 
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-muted-foreground">Memuat data...</span>
        </div>
      )}
      
      {!isLoading && (
        <>
          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Welcome Card - Large (2x2 on desktop) */}
            <Card 
              className="md:col-span-2 md:row-span-2 cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden group"
              onClick={() => navigateTo('profile')}
            >
              {/* Background Image */}
              <div className="absolute inset-0">
                <img
                  src={settings?.bannerUrl || '/banner.jpg'}
                  alt="Banner"
                  className="w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-card via-card/95 to-card/90"></div>
              </div>
              
              <CardHeader className="relative z-10">
                <CardDescription>{getGreeting()}</CardDescription>
                <CardTitle className="text-2xl">{user?.nama}</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-border">
                    <AvatarImage src={user?.photoUrl || undefined} />
                    <AvatarFallback className="text-lg">
                      {user?.nama?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Blok {user?.blok} • No. {user?.nomorRumah}</p>
                    <Badge variant="secondary">
                      {user?.role === 'SUPERADMIN' ? 'Super Admin' : 
                       user?.role === 'ADMIN' ? 'Admin' : 
                       user?.role === 'BENDAHARA' ? 'Bendahara' : 'Warga'}
                    </Badge>
                  </div>
                </div>
                
                {/* Quick Actions inside Welcome Card */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {quickActions.filter(a => a.show).slice(0, 2).map((action) => (
                    <Button 
                      key={action.id}
                      variant="outline" 
                      size="sm" 
                      className="justify-start"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateTo(action.page);
                      }}
                    >
                      <action.icon className="h-4 w-4 mr-2" />
                      {action.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Finance Summary Card */}
            {permissions?.canViewFinance && (
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigateTo('finance')}
              >
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Saldo Blok {user?.blok}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{formatCurrency(userFinance?.saldoAkhir || 0)}</p>
                  <p className="text-xs text-muted-foreground">{userFinance?.periodLabel}</p>
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <span className="text-emerald-600 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {formatCurrency(userFinance?.totalPemasukan || 0)}
                    </span>
                    <span className="text-destructive flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" />
                      {formatCurrency(userFinance?.totalPengeluaran || 0)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Monthly Fee Card */}
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigateTo('payment')}
            >
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Iuran Bulanan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(settings?.monthlyFee || 0)}</p>
                <p className="text-xs text-muted-foreground">per bulan</p>
                {permissions?.canSubmitPayment && (
                  <Button size="sm" className="mt-3 w-full" onClick={(e) => {
                    e.stopPropagation();
                    navigateTo('payment');
                  }}>
                    <Plus className="h-4 w-4 mr-1" />
                    Bayar
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Pending Tasks Card - Only for admins */}
            {(permissions?.canApproveUsers || permissions?.canApprovePayment) && (
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigateTo(pendingUsers.length > 0 ? 'users' : 'payment')}
              >
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Tugas Pending
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{pendingUsers.length + pendingPayments.length}</p>
                  <p className="text-xs text-muted-foreground">menunggu aksi</p>
                  <div className="flex gap-2 mt-2">
                    {pendingUsers.length > 0 && (
                      <Badge variant="secondary" className="text-xs">{pendingUsers.length} warga</Badge>
                    )}
                    {pendingPayments.length > 0 && (
                      <Badge variant="secondary" className="text-xs">{pendingPayments.length} bayar</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Agenda Count Card */}
            {settings?.enableAgenda && (
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigateTo('agenda')}
              >
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Agenda
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{agendas.length}</p>
                  <p className="text-xs text-muted-foreground">kegiatan terjadwal</p>
                </CardContent>
              </Card>
            )}

            {/* Gallery Count Card */}
            {settings?.enableGallery && (
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigateTo('gallery')}
              >
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Galeri
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{galleries.length}</p>
                  <p className="text-xs text-muted-foreground">foto kegiatan</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Second Row - Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Upcoming Agenda - Large */}
            {settings?.enableAgenda && (
              <Card className="lg:row-span-2">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Agenda Mendatang
                    </CardTitle>
                    <CardDescription>{agendas.length} kegiatan terjadwal</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigateTo('agenda')}>
                    Lihat Semua <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {agendas.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>Tidak ada agenda</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {agendas.slice(0, 4).map((agenda) => (
                        <div 
                          key={agenda.id} 
                          className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => navigateTo('agenda')}
                        >
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate text-sm">{agenda.title}</h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{formatDate(agenda.startDate)}</span>
                              {agenda.startTime && <span>• {agenda.startTime}</span>}
                            </div>
                            {agenda.location && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">{agenda.location}</span>
                              </div>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs">
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
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Informasi Terkini
                    </CardTitle>
                    <CardDescription>Pengumuman & berita</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigateTo('information')}>
                    Lihat Semua <ChevronRight className="h-4 w-4 ml-1" />
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
                      {informations.slice(0, 3).map((info) => (
                        <div 
                          key={info.id} 
                          className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => navigateTo('information')}
                        >
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                            <Bell className="h-5 w-5 text-muted-foreground" />
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

            {/* Gallery Preview */}
            {settings?.enableGallery && galleries.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      Galeri Terbaru
                    </CardTitle>
                    <CardDescription>{galleries.length} foto</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigateTo('gallery')}>
                    Lihat Semua <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
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
                            index === 0 ? 'h-32' : 'h-16'
                          }`}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-1 left-1 right-1">
                            <p className="text-white text-[10px] truncate">{gallery.title}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Admin Section: Pending Items */}
          {(permissions?.canApproveUsers || permissions?.canApprovePayment) && (pendingUsers.length > 0 || pendingPayments.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pending Users */}
              {permissions?.canApproveUsers && pendingUsers.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <UserCheck className="h-5 w-5" />
                      Warga Menunggu Persetujuan
                    </CardTitle>
                    <CardDescription>{pendingUsers.length} warga menunggu persetujuan</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {pendingUsers.slice(0, 3).map((pendingUser) => (
                        <div key={pendingUser.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
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
                            <Button size="sm" variant="default" className="h-7">
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" className="h-7">
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => navigateTo('users')}>
                      Kelola Semua <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Pending Payments */}
              {permissions?.canApprovePayment && pendingPayments.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CreditCard className="h-5 w-5" />
                      Pembayaran Menunggu Verifikasi
                    </CardTitle>
                    <CardDescription>{pendingPayments.length} pembayaran pending</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {pendingPayments.slice(0, 3).map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div>
                            <h4 className="font-medium text-sm">{payment.userName}</h4>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(payment.amount)} • {payment.periods.length} periode
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="default" className="h-7">
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" className="h-7">
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

          {/* Recent Transactions */}
          {permissions?.canViewFinance && recentTransactions.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="h-5 w-5" />
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
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigateTo('finance')}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          tx.type === 'INCOME' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-red-100 dark:bg-red-900/30 text-red-600'
                        }`}>
                          {tx.type === 'INCOME' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{tx.description}</h4>
                          <p className="text-xs text-muted-foreground">{tx.category} • {formatDate(tx.date)}</p>
                        </div>
                      </div>
                      <p className={`font-medium text-sm ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-red-600'}`}>
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
                    <Star className="h-5 w-5" />
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
                      className="p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigateTo('reviews')}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {review.userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{review.userName}</p>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-muted'}`} />
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
        </>
      )}
    </div>
  );
}
