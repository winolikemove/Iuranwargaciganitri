'use client';

import { useAuth } from '@/context/auth-context';
import { useApp } from '@/context/app-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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
} from 'lucide-react';
import { api, CacheManager } from '@/lib/api-client';
import { useState, useEffect } from 'react';
import type { FinanceSummary, SafeUser } from '@/types';

export function DashboardHome() {
  const { user, permissions } = useAuth();
  const { settings, agendas, informations, pengurus } = useApp();
  const [finance, setFinance] = useState<FinanceSummary | null>(null);
  const [pendingUsers, setPendingUsers] = useState<SafeUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      // Load finance summary
      if (permissions?.canViewFinance) {
        const financeRes = await api.getFinanceSummary();
        if (financeRes.ok && financeRes.data) {
          setFinance(financeRes.data);
        }
      }
      
      // Load pending users
      if (permissions?.canApproveUsers) {
        const pendingRes = await api.getPendingUsers();
        if (pendingRes.ok && pendingRes.data) {
          setPendingUsers(pendingRes.data);
        }
      }
      
      setIsLoading(false);
    };
    
    loadData();
  }, [permissions]);

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
        month: 'long',
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

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{getGreeting()}, {user?.nama}!</h2>
          <p className="text-muted-foreground">
            Blok {user?.blok} - No. {user?.nomorRumah}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user?.photoUrl || undefined} />
            <AvatarFallback className="bg-emerald-500 text-white">
              {user?.nama?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {permissions?.canViewFinance && finance && (
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Saldo Akhir
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(finance.saldoAkhir)}</p>
              <p className="text-xs text-muted-foreground">{finance.periodLabel}</p>
            </CardContent>
          </Card>
        )}
        
        {permissions?.canViewFinance && finance && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Pemasukan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(finance.totalPemasukan)}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Pengeluaran
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(finance.totalPengeluaran)}</p>
              </CardContent>
            </Card>
          </>
        )}
        
        {permissions?.canApproveUsers && (
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Warga Pending
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{pendingUsers.length}</p>
              <p className="text-xs text-muted-foreground">Menunggu persetujuan</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Agenda */}
        {settings?.enableAgenda && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Agenda Mendatang
                  </CardTitle>
                  <CardDescription>Kegiatan yang akan datang</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {agendas.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Tidak ada agenda</p>
              ) : (
                <div className="space-y-4">
                  {agendas.slice(0, 3).map((agenda) => (
                    <div key={agenda.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{agenda.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(agenda.startDate)}</span>
                        </div>
                        {agenda.location && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{agenda.location}</span>
                          </div>
                        )}
                      </div>
                      <Badge variant={agenda.status === 'UPCOMING' ? 'default' : 'secondary'}>
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
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Informasi Terkini
                  </CardTitle>
                  <CardDescription>Pengumuman dan berita</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {informations.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Tidak ada informasi</p>
              ) : (
                <div className="space-y-4">
                  {informations.slice(0, 3).map((info) => (
                    <div key={info.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                        <Bell className="h-5 w-5 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium truncate">{info.title}</h4>
                          {info.isPinned && (
                            <Badge variant="secondary" className="text-xs">Disematkan</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">{info.content}</p>
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

      {/* Pending Users (for admins) */}
      {permissions?.canApproveUsers && pendingUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Warga Menunggu Persetujuan
            </CardTitle>
            <CardDescription>{pendingUsers.length} warga menunggu persetujuan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingUsers.slice(0, 5).map((pendingUser) => (
                <div key={pendingUser.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-gray-500 text-white">
                        {pendingUser.nama.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{pendingUser.nama}</h4>
                      <p className="text-sm text-muted-foreground">
                        Blok {pendingUser.blok} - No. {pendingUser.nomorRumah}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Setujui
                    </Button>
                    <Button size="sm" variant="destructive">
                      <XCircle className="h-4 w-4 mr-1" />
                      Tolak
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Fee Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Informasi Iuran Bulanan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-muted-foreground">Iuran bulanan per rumah tangga:</p>
              <p className="text-3xl font-bold text-emerald-600">
                {formatCurrency(settings?.monthlyFee || 0)}
                <span className="text-sm font-normal text-muted-foreground">/bulan</span>
              </p>
            </div>
            {permissions?.canSubmitPayment && (
              <Button>
                <Wallet className="h-4 w-4 mr-2" />
                Bayar Iuran
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
