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
  User,
  PieChart,
  FileText,
  Download,
} from 'lucide-react';
import { api, CacheManager } from '@/lib/api-client';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { FinanceSummary, SafeUser, Transaction, Payment, MonthlyFinance } from '@/types';

type PageType = 'dashboard' | 'finance' | 'payment' | 'users' | 'agenda' | 'information' | 'gallery' | 'reviews' | 'settings' | 'profile' | 'organization' | 'finance-report';

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
  const [monthlyData, setMonthlyData] = useState<MonthlyFinance[]>([]);
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
            // Set monthly breakdown for chart
            if (res.data.monthlyBreakdown) {
              setMonthlyData(res.data.monthlyBreakdown);
            } else {
              // Generate demo data if no real data
              setMonthlyData(generateMonthlyFinanceData(6));
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

  // Calculate pie chart data
  const pieData = useMemo(() => {
    const totalPemasukan = userFinance?.totalPemasukan || 0;
    const totalPengeluaran = userFinance?.totalPengeluaran || 0;
    const total = totalPemasukan + totalPengeluaran;
    
    if (total === 0) return { pemasukanPercent: 50, pengeluaranPercent: 50 };
    
    return {
      pemasukanPercent: (totalPemasukan / total) * 100,
      pengeluaranPercent: (totalPengeluaran / total) * 100,
    };
  }, [userFinance]);

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
          {/* Top Row - Banner & Saldo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Welcome Card - Large */}
            <Card
              className="md:col-span-2 cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden group min-h-[260px]"
              onClick={() => navigateTo('profile')}
            >
              {/* Background Image with Higher Visibility */}
              <div className="absolute inset-0">
                <img
                  src={settings?.bannerUrl || '/banner.jpg'}
                  alt="Banner"
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-70 transition-opacity"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-background/85 via-background/75 to-background/70"></div>
              </div>

              <CardHeader className="relative z-10">
                <CardDescription>{getGreeting()}</CardDescription>
                <CardTitle className="text-2xl truncate">{user?.nama}</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 border-2 border-border flex-shrink-0">
                    <AvatarImage src={user?.photoUrl || undefined} />
                    <AvatarFallback className="text-lg">
                      {user?.nama?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1 min-w-0">
                    <p className="text-muted-foreground text-sm truncate">Blok {user?.blok} • No. {user?.nomorRumah}</p>
                    <Badge variant="secondary">
                      {user?.role === 'SUPERADMIN' ? 'Super Admin' :
                       user?.role === 'ADMIN' ? 'Admin' :
                       user?.role === 'BENDAHARA' ? 'Bendahara' : 'Warga'}
                    </Badge>
                  </div>
                </div>

                {/* Profile Button */}
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-background/50 backdrop-blur-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateTo('profile');
                    }}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Lihat Profil
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Finance Summary Card */}
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigateTo('finance-report')}
            >
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Saldo Blok {user?.blok}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold truncate">{formatCurrency(userFinance?.saldoAkhir || 0)}</p>
                <p className="text-xs text-muted-foreground truncate">{userFinance?.periodLabel || 'Periode ini'}</p>
                <div className="flex flex-col gap-1 mt-3 text-sm">
                  <span className="text-emerald-600 flex items-center gap-1 truncate">
                    <TrendingUp className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{formatCurrency(userFinance?.totalPemasukan || 0)}</span>
                  </span>
                  <span className="text-destructive flex items-center gap-1 truncate">
                    <TrendingDown className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{formatCurrency(userFinance?.totalPengeluaran || 0)}</span>
                  </span>
                </div>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="p-0 h-auto mt-2 text-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateTo('finance-report');
                  }}
                >
                  Lihat Laporan <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Feature Cards - Bento Style */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Iuran Bulanan */}
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200/50 dark:border-emerald-800/30"
              onClick={() => navigateTo('payment')}
            >
              <CardContent className="pt-4">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 w-fit mb-2">
                  <CreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-sm text-muted-foreground">Iuran Bulanan</p>
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400 truncate">{formatCurrency(settings?.monthlyFee || 0)}</p>
                {permissions?.canSubmitPayment && (
                  <Button size="sm" className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700" onClick={(e) => {
                    e.stopPropagation();
                    navigateTo('payment');
                  }}>
                    <Plus className="h-4 w-4 mr-1" />
                    Bayar
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Agenda */}
            {settings?.enableAgenda && (
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200/50 dark:border-blue-800/30"
                onClick={() => navigateTo('agenda')}
              >
                <CardContent className="pt-4 text-center">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50 w-fit mx-auto mb-2">
                    <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{agendas.length}</p>
                  <p className="text-xs text-muted-foreground">Agenda</p>
                </CardContent>
              </Card>
            )}

            {/* Gallery */}
            {settings?.enableGallery && (
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200/50 dark:border-purple-800/30"
                onClick={() => navigateTo('gallery')}
              >
                <CardContent className="pt-4 text-center">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50 w-fit mx-auto mb-2">
                    <ImageIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{galleries.length}</p>
                  <p className="text-xs text-muted-foreground">Galeri</p>
                </CardContent>
              </Card>
            )}

            {/* Information */}
            {settings?.enableInformation && (
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-950/30 dark:to-cyan-900/20 border-cyan-200/50 dark:border-cyan-800/30"
                onClick={() => navigateTo('information')}
              >
                <CardContent className="pt-4 text-center">
                  <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/50 w-fit mx-auto mb-2">
                    <Bell className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-400">{informations.length}</p>
                  <p className="text-xs text-muted-foreground">Informasi</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Finance Report Section */}
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
            onClick={() => navigateTo('finance-report')}
          >
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Resume Keuangan Blok {user?.blok}
                  </CardTitle>
                  <CardDescription>Transparansi keuangan untuk warga</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={(e) => {
                  e.stopPropagation();
                  navigateTo('finance-report');
                }}>
                  <FileText className="h-4 w-4 mr-1" />
                  Laporan Lengkap
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Line Chart */}
                <div className="md:col-span-2">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                      <span className="text-sm text-muted-foreground">Pemasukan</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                      <span className="text-sm text-muted-foreground">Pengeluaran</span>
                    </div>
                  </div>
                  
                  {/* Simple Line Chart */}
                  <div className="relative h-36">
                    <svg 
                      viewBox="0 0 100 50" 
                      preserveAspectRatio="none"
                      className="w-full h-full"
                    >
                      {/* Grid lines */}
                      <line x1="5" y1="12.5" x2="95" y2="12.5" stroke="currentColor" strokeOpacity="0.1" />
                      <line x1="5" y1="25" x2="95" y2="25" stroke="currentColor" strokeOpacity="0.1" />
                      <line x1="5" y1="37.5" x2="95" y2="37.5" stroke="currentColor" strokeOpacity="0.1" />
                      
                      {/* Pemasukan Line */}
                      <path
                        d={generateLinePath(monthlyData.map(d => d.pemasukan))}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="0.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      
                      {/* Pengeluaran Line */}
                      <path
                        d={generateLinePath(monthlyData.map(d => d.pengeluaran))}
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="0.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    
                    {/* X Axis Labels */}
                    <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-xs text-muted-foreground">
                      {monthlyData.slice(-6).map((d, i) => (
                        <span key={i}>{d.monthShort}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Pie Chart & Summary */}
                <div className="flex flex-col items-center justify-center">
                  {/* Simple Pie Chart */}
                  <div className="relative w-28 h-28 mb-3">
                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="20"
                        strokeDasharray={`${pieData.pemasukanPercent * 2.51} 251`}
                        className="opacity-80"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="20"
                        strokeDasharray={`${pieData.pengeluaranPercent * 2.51} 251`}
                        strokeDashoffset={`-${pieData.pemasukanPercent * 2.51}`}
                        className="opacity-80"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground">Saldo</p>
                        <p className="text-xs font-bold truncate max-w-[60px]">{formatCurrency(userFinance?.saldoAkhir || 0).replace('Rp', '').trim()}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center space-y-1 w-full">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <span className="text-xs text-muted-foreground">Pemasukan</span>
                      <span className="text-sm font-medium text-emerald-600">{pieData.pemasukanPercent.toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                      <span className="text-xs text-muted-foreground">Pengeluaran</span>
                      <span className="text-sm font-medium text-rose-600">{pieData.pengeluaranPercent.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pending Tasks Card - Only for admins */}
            {(permissions?.canApproveUsers || permissions?.canApprovePayment) && (
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-amber-50 to-orange-100/50 dark:from-amber-950/30 dark:to-orange-900/20 border-amber-200/50 dark:border-amber-800/30"
                onClick={() => navigateTo(pendingUsers.length > 0 ? 'users' : 'payment')}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50">
                        <Activity className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tugas Pending</p>
                        <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{pendingUsers.length + pendingPayments.length}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {pendingUsers.length > 0 && (
                        <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">{pendingUsers.length} warga</Badge>
                      )}
                      {pendingPayments.length > 0 && (
                        <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">{pendingPayments.length} bayar</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Information Count */}
            {settings?.enableInformation && (
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-cyan-50 to-sky-100/50 dark:from-cyan-950/30 dark:to-sky-900/20 border-cyan-200/50 dark:border-cyan-800/30"
                onClick={() => navigateTo('information')}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/50">
                      <Bell className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Informasi Terkini</p>
                      <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-400">{informations.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Content Grid - Agenda & Gallery */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Upcoming Agenda */}
            {settings?.enableAgenda && (
              <Card>
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
                      {agendas.slice(0, 3).map((agenda) => (
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

// Helper function to generate line path for chart
function generateLinePath(values: number[]): string {
  if (values.length === 0) return '';
  
  const max = Math.max(...values, 1);
  const min = 0;
  const width = 100;
  const height = 50;
  const padding = 5;
  
  const points = values.map((v, i) => {
    const x = padding + (i * ((width - 2 * padding) / (values.length - 1 || 1)));
    const y = height - padding - ((v - min) / (max - min || 1)) * (height - 2 * padding);
    return { x, y };
  });
  
  if (points.length === 0) return '';
  
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx1 = prev.x + (curr.x - prev.x) / 3;
    const cpx2 = prev.x + 2 * (curr.x - prev.x) / 3;
    path += ` C ${cpx1} ${prev.y}, ${cpx2} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  
  return path;
}

// Helper function to generate demo monthly finance data
function generateMonthlyFinanceData(months: number = 6): MonthlyFinance[] {
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
  
  const now = new Date();
  const data: MonthlyFinance[] = [];
  let runningSaldo = 2000000;
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const pemasukan = Math.floor(Math.random() * 3000000) + 2000000;
    const pengeluaran = Math.floor(Math.random() * 2000000) + 1000000;
    runningSaldo = runningSaldo + pemasukan - pengeluaran;
    
    data.push({
      month: `${monthNames[date.getMonth()]} ${date.getFullYear()}`,
      monthShort: monthShort[date.getMonth()],
      pemasukan,
      pengeluaran,
      saldo: runningSaldo,
    });
  }
  
  return data;
}
