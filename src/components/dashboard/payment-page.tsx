'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useApp } from '@/context/app-context';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  Loader2, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Upload,
  Calendar,
  Wallet,
  Hourglass,
} from 'lucide-react';
import { PaymentWizard } from './payment-wizard';
import type { Payment } from '@/types';

export function PaymentPage() {
  const { user, permissions } = useAuth();
  const { settings } = useApp();
  
  const [myPayments, setMyPayments] = useState<Payment[]>([]);
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [paidPeriods, setPaidPeriods] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my');
  const [wizardOpen, setWizardOpen] = useState(false);

  // Generate available periods (last 12 months + current + next 3 months)
  const generateAvailablePeriods = () => {
    const periods: string[] = [];
    const now = new Date();
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    // Last 12 months
    for (let i = 12; i >= 1; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      periods.push(`${monthNames[d.getMonth()]} ${d.getFullYear()}`);
    }
    
    // Current month
    periods.push(`${monthNames[now.getMonth()]} ${now.getFullYear()}`);
    
    // Next 3 months
    for (let i = 1; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      periods.push(`${monthNames[d.getMonth()]} ${d.getFullYear()}`);
    }
    
    return periods;
  };

  const availablePeriods = generateAvailablePeriods();
  
  // Get pending periods from pending payments (PENDING status only)
  const pendingPeriods = myPayments
    .filter(p => p.status === 'PENDING')
    .flatMap(p => p.periods);

  // Get rejected periods from rejected payments
  const rejectedPeriods = myPayments
    .filter(p => p.status === 'REJECTED')
    .flatMap(p => p.periods);

  // Unpaid periods = available - paid (APPROVED only) - pending
  // Note: paidPeriods should only contain periods from APPROVED payments
  const unpaidPeriods = availablePeriods.filter(
    p => !paidPeriods.includes(p) && !pendingPeriods.includes(p)
  );

  // Get pending payments count for warga
  const myPendingPayments = myPayments.filter(p => p.status === 'PENDING');
  const myApprovedPayments = myPayments.filter(p => p.status === 'APPROVED');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    
    try {
      if (activeTab === 'my' && permissions?.canSubmitPayment) {
        const [paymentsRes, paidRes] = await Promise.all([
          api.getMyPayments(),
          api.getPaidPeriods(user?.id || ''),
        ]);
        
        if (paymentsRes.ok && paymentsRes.data) {
          setMyPayments(paymentsRes.data);
        }
        
        if (paidRes.ok && paidRes.data) {
          setPaidPeriods(paidRes.data);
        }
      }
      
      if (activeTab === 'pending' && permissions?.canApprovePayment) {
        const res = await api.getPendingPayments();
        if (res.ok && res.data) {
          setPendingPayments(res.data);
        }
      }
      
      if (activeTab === 'all' && permissions?.canViewAllPayments) {
        const res = await api.getAllPayments();
        if (res.ok && res.data) {
          setAllPayments(res.data);
        }
      }
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-500">Disetujui</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Ditolak</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const handleApprove = async (paymentId: string) => {
    const result = await api.approvePayment(paymentId);
    if (result.ok) {
      loadData();
    }
  };

  const handleReject = async (paymentId: string) => {
    const result = await api.rejectPayment(paymentId, 'Ditolak oleh admin');
    if (result.ok) {
      loadData();
    }
  };

  const handleWizardSuccess = () => {
    loadData();
  };

  const renderPaymentTable = (payments: Payment[], showActions: boolean = false) => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tanggal</TableHead>
            <TableHead>Warga</TableHead>
            <TableHead>Periode</TableHead>
            <TableHead className="text-right">Jumlah</TableHead>
            <TableHead>Status</TableHead>
            {showActions && permissions?.canApprovePayment && (
              <TableHead className="w-[150px]">Aksi</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                Tidak ada data pembayaran
              </TableCell>
            </TableRow>
          ) : (
            payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{formatDate(payment.createdAt)}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{payment.userName}</p>
                    <p className="text-xs text-muted-foreground">
                      Blok {payment.blok} - No. {payment.nomorRumah}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {payment.periods.map((period) => (
                      <Badge key={period} variant="outline" className="text-xs">
                        {period}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(payment.amount)}
                </TableCell>
                <TableCell>{getStatusBadge(payment.status)}</TableCell>
                {showActions && permissions?.canApprovePayment && payment.status === 'PENDING' && (
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleApprove(payment.id)}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(payment.id)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  if (!permissions?.canSubmitPayment && !permissions?.canApprovePayment) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Anda tidak memiliki akses untuk melihat halaman ini.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wallet className="h-5 w-5" />
              Iuran Bulanan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatCurrency(settings?.monthlyFee || 0)}</p>
            <p className="text-emerald-100 text-sm">per bulan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="h-5 w-5" />
              Belum Dibayar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-500">{unpaidPeriods.length}</p>
            <p className="text-muted-foreground text-sm">periode</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg text-yellow-700">
              <Hourglass className="h-5 w-5" />
              Menunggu Verifikasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{myPendingPayments.length}</p>
            <p className="text-yellow-600 text-sm">pembayaran</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle className="h-5 w-5" />
              Sudah Dibayar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-500">{paidPeriods.length}</p>
            <p className="text-muted-foreground text-sm">periode</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Payments Alert for Warga */}
      {permissions?.canSubmitPayment && myPendingPayments.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-yellow-700 flex items-center gap-2">
              <Hourglass className="h-5 w-5" />
              Pembayaran Menunggu Verifikasi
            </CardTitle>
            <CardDescription className="text-yellow-600">
              Pembayaran Anda sedang diproses oleh admin/bendahara
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myPendingPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-yellow-200">
                  <div>
                    <div className="flex flex-wrap gap-1 mb-1">
                      {payment.periods.map((period) => (
                        <Badge key={period} variant="outline" className="text-xs">
                          {period}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(payment.createdAt)} • {formatCurrency(payment.amount)}
                    </p>
                  </div>
                  <Badge className="bg-yellow-500">Menunggu Verifikasi</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unpaid Periods Alert */}
      {permissions?.canSubmitPayment && unpaidPeriods.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-orange-700 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Periode Belum Dibayar
            </CardTitle>
            <CardDescription className="text-orange-600">
              Periode berikut belum memiliki pembayaran yang disetujui
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              {unpaidPeriods.slice(0, 6).map((period) => (
                <Badge key={period} variant="outline" className="bg-white">
                  {period}
                </Badge>
              ))}
              {unpaidPeriods.length > 6 && (
                <Badge variant="outline" className="bg-white">
                  +{unpaidPeriods.length - 6} lainnya
                </Badge>
              )}
            </div>
            <Button onClick={() => setWizardOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Bayar Sekarang
            </Button>
          </CardContent>
        </Card>
      )}

      {/* No Unpaid Periods Message */}
      {permissions?.canSubmitPayment && unpaidPeriods.length === 0 && myPendingPayments.length === 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="py-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="font-semibold text-green-700">Semua Periode Sudah Dibayar!</p>
                <p className="text-sm text-green-600">Terima kasih telah melunasi semua iuran Anda.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {permissions?.canSubmitPayment && (
            <TabsTrigger value="my">
              <CreditCard className="h-4 w-4 mr-2" />
              Pembayaran Saya
            </TabsTrigger>
          )}
          {permissions?.canApprovePayment && (
            <TabsTrigger value="pending">
              <Clock className="h-4 w-4 mr-2" />
              Menunggu Verifikasi
            </TabsTrigger>
          )}
          {permissions?.canViewAllPayments && (
            <TabsTrigger value="all">
              Semua Pembayaran
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="my" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Pembayaran Saya</CardTitle>
              <CardDescription>Daftar pembayaran iuran Anda</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                renderPaymentTable(myPayments)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pembayaran Menunggu Verifikasi</CardTitle>
              <CardDescription>{pendingPayments.length} pembayaran menunggu persetujuan</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                renderPaymentTable(pendingPayments, true)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Semua Pembayaran</CardTitle>
              <CardDescription>Riwayat semua pembayaran warga</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                renderPaymentTable(allPayments)
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Wizard */}
      <PaymentWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSuccess={handleWizardSuccess}
        unpaidPeriods={unpaidPeriods}
        paidPeriods={paidPeriods}
        pendingPeriods={pendingPeriods}
      />
    </div>
  );
}
