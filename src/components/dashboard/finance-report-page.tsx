'use client';

import { useAuth } from '@/context/auth-context';
import { useApp } from '@/context/app-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PieChart,
  Download,
  FileText,
  FileSpreadsheet,
  File,
  Calendar,
  ChevronLeft,
  ArrowUpDown,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { FinanceSummary, MonthlyFinance, Transaction } from '@/types';

interface FinanceReportPageProps {
  onBack?: () => void;
}

export function FinanceReportPage({ onBack }: FinanceReportPageProps) {
  const { user } = useAuth();
  const { settings } = useApp();
  const [financeData, setFinanceData] = useState<FinanceSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonths, setSelectedMonths] = useState<string>('6');
  const { toast } = useToast();

  const loadFinanceData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [financeRes, transRes] = await Promise.all([
        api.getFinanceSummary(),
        api.getTransactions({ limit: 100 }),
      ]);

      if (financeRes.ok && financeRes.data) {
        setFinanceData(financeRes.data);
      }

      if (transRes.ok && transRes.data) {
        // Filter transactions by user's block
        const userTransactions = transRes.data.filter(
          (t: Transaction) => t.blok === user?.blok
        );
        setTransactions(userTransactions);
      }
    } catch (error) {
      console.error('Error loading finance data:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data keuangan',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.blok, toast]);

  useEffect(() => {
    loadFinanceData();
  }, [loadFinanceData]);

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

  // Filter transactions by selected month range
  const filteredTransactions = useMemo(() => {
    const months = parseInt(selectedMonths);
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);

    return transactions.filter((t) => new Date(t.date) >= cutoffDate);
  }, [transactions, selectedMonths]);

  // Calculate summary from filtered transactions
  const summary = useMemo(() => {
    const totalPemasukan = filteredTransactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalPengeluaran = filteredTransactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    const saldoAwal = user?.blok === 'A' 
      ? (settings?.saldoAwalA || 0) 
      : (settings?.saldoAwalB || 0);

    return {
      totalPemasukan,
      totalPengeluaran,
      saldoAwal,
      saldoAkhir: saldoAwal + totalPemasukan - totalPengeluaran,
    };
  }, [filteredTransactions, user?.blok, settings]);

  // Group transactions by category
  const categoryBreakdown = useMemo(() => {
    const incomeByCategory: Record<string, number> = {};
    const expenseByCategory: Record<string, number> = {};

    filteredTransactions.forEach((t) => {
      if (t.type === 'INCOME') {
        incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
      } else {
        expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
      }
    });

    return { incomeByCategory, expenseByCategory };
  }, [filteredTransactions]);

  // Generate monthly data for chart
  const monthlyData = useMemo(() => {
    const months = parseInt(selectedMonths);
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];

    const now = new Date();
    const data: MonthlyFinance[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthTransactions = filteredTransactions.filter((t) => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === date.getMonth() && tDate.getFullYear() === date.getFullYear();
      });

      const pemasukan = monthTransactions
        .filter((t) => t.type === 'INCOME')
        .reduce((sum, t) => sum + t.amount, 0);

      const pengeluaran = monthTransactions
        .filter((t) => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0);

      data.push({
        month: `${monthNames[date.getMonth()]} ${date.getFullYear()}`,
        monthShort: monthShort[date.getMonth()],
        pemasukan,
        pengeluaran,
        saldo: 0, // Will be calculated later
      });
    }

    return data;
  }, [filteredTransactions, selectedMonths]);

  // Pie chart data
  const pieData = useMemo(() => {
    const total = summary.totalPemasukan + summary.totalPengeluaran;
    if (total === 0) return { pemasukanPercent: 50, pengeluaranPercent: 50 };

    return {
      pemasukanPercent: (summary.totalPemasukan / total) * 100,
      pengeluaranPercent: (summary.totalPengeluaran / total) * 100,
    };
  }, [summary]);

  // Generate line chart path
  const generateLinePath = (values: number[]): string => {
    if (values.length === 0) return '';

    const max = Math.max(...values, 1);
    const width = 100;
    const height = 50;
    const padding = 5;

    const points = values.map((v, i) => {
      const x = padding + (i * ((width - 2 * padding) / (values.length - 1 || 1)));
      const y = height - padding - (v / max) * (height - 2 * padding);
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
  };

  // Export functions
  const exportToCSV = () => {
    const headers = ['Tanggal', 'Kategori', 'Deskripsi', 'Tipe', 'Jumlah'];
    const rows = filteredTransactions.map((t) => [
      formatDate(t.date),
      t.category,
      t.description,
      t.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran',
      t.amount.toString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((r) => r.map((c) => `"${c}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Laporan_Keuangan_Blok_${user?.blok}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportToExcel = () => {
    // Simple Excel format (actually TSV that Excel can open)
    const headers = ['Tanggal', 'Kategori', 'Deskripsi', 'Tipe', 'Jumlah'];
    const rows = filteredTransactions.map((t) => [
      formatDate(t.date),
      t.category,
      t.description,
      t.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran',
      formatCurrency(t.amount),
    ]);

    const content = [
      headers.join('\t'),
      ...rows.map((r) => r.join('\t')),
    ].join('\n');

    const blob = new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Laporan_Keuangan_Blok_${user?.blok}_${new Date().toISOString().split('T')[0]}.xls`;
    link.click();
  };

  const exportToPDF = () => {
    // Create a printable HTML document
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Keuangan Blok ${user?.blok}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          h1 { color: #166534; border-bottom: 2px solid #166534; padding-bottom: 10px; }
          h2 { color: #1f2937; margin-top: 20px; }
          .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
          .summary-card { background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; }
          .summary-card.income { background: #d1fae5; }
          .summary-card.expense { background: #fee2e2; }
          .summary-card h3 { margin: 0; font-size: 14px; color: #6b7280; }
          .summary-card p { margin: 5px 0 0; font-size: 18px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
          th { background: #f9fafb; }
          .income-row { color: #166534; }
          .expense-row { color: #dc2626; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #6b7280; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>Laporan Keuangan Blok ${user?.blok}</h1>
        <p>Periode: ${selectedMonths} bulan terakhir | Dicetak: ${new Date().toLocaleDateString('id-ID')}</p>
        
        <div class="summary">
          <div class="summary-card">
            <h3>Saldo Awal</h3>
            <p>${formatCurrency(summary.saldoAwal)}</p>
          </div>
          <div class="summary-card income">
            <h3>Total Pemasukan</h3>
            <p>${formatCurrency(summary.totalPemasukan)}</p>
          </div>
          <div class="summary-card expense">
            <h3>Total Pengeluaran</h3>
            <p>${formatCurrency(summary.totalPengeluaran)}</p>
          </div>
        </div>
        
        <div class="summary">
          <div class="summary-card" style="grid-column: span 3; background: #dbeafe;">
            <h3>Saldo Akhir</h3>
            <p style="font-size: 24px;">${formatCurrency(summary.saldoAkhir)}</p>
          </div>
        </div>

        <h2>Detail Transaksi</h2>
        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Kategori</th>
              <th>Deskripsi</th>
              <th>Tipe</th>
              <th>Jumlah</th>
            </tr>
          </thead>
          <tbody>
            ${filteredTransactions
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map(
                (t) => `
              <tr class="${t.type === 'INCOME' ? 'income-row' : 'expense-row'}">
                <td>${formatDate(t.date)}</td>
                <td>${t.category}</td>
                <td>${t.description}</td>
                <td>${t.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}</td>
                <td>${formatCurrency(t.amount)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>Dokumen ini digenerate otomatis oleh Sistem Manajemen Warga</p>
          <p>Komplek Pradha Ciganitri © ${new Date().getFullYear()}</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-muted-foreground">Memuat data keuangan...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Kembali
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold">Laporan Keuangan</h1>
            <p className="text-muted-foreground">Blok {user?.blok} - Transparansi untuk warga</p>
          </div>
        </div>

        {/* Filter & Export */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={selectedMonths} onValueChange={setSelectedMonths}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Pilih periode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Bulan</SelectItem>
              <SelectItem value="3">3 Bulan</SelectItem>
              <SelectItem value="6">6 Bulan</SelectItem>
              <SelectItem value="12">1 Tahun</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportToPDF}>
              <FileText className="h-4 w-4 mr-1" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={exportToExcel}>
              <FileSpreadsheet className="h-4 w-4 mr-1" />
              Excel
            </Button>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <File className="h-4 w-4 mr-1" />
              CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-950/30 dark:to-slate-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="h-4 w-4 text-slate-500" />
              <p className="text-sm text-muted-foreground">Saldo Awal</p>
            </div>
            <p className="text-xl font-bold">{formatCurrency(summary.saldoAwal)}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200/50 dark:border-emerald-800/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <p className="text-sm text-muted-foreground">Total Pemasukan</p>
            </div>
            <p className="text-xl font-bold text-emerald-600">{formatCurrency(summary.totalPemasukan)}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-950/30 dark:to-rose-900/20 border-rose-200/50 dark:border-rose-800/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-rose-500" />
              <p className="text-sm text-muted-foreground">Total Pengeluaran</p>
            </div>
            <p className="text-xl font-bold text-rose-600">{formatCurrency(summary.totalPengeluaran)}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200/50 dark:border-blue-800/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUpDown className="h-4 w-4 text-blue-500" />
              <p className="text-sm text-muted-foreground">Saldo Akhir</p>
            </div>
            <p className="text-xl font-bold text-blue-600">{formatCurrency(summary.saldoAkhir)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tren Keuangan
            </CardTitle>
            <CardDescription>Pemasukan vs Pengeluaran per bulan</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Legend */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-sm text-muted-foreground">Pemasukan</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                <span className="text-sm text-muted-foreground">Pengeluaran</span>
              </div>
            </div>

            {/* Chart */}
            <div className="relative h-48">
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
                  d={generateLinePath(monthlyData.map((d) => d.pemasukan))}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="0.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Pengeluaran Line */}
                <path
                  d={generateLinePath(monthlyData.map((d) => d.pengeluaran))}
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="0.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              {/* X Axis Labels */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-xs text-muted-foreground">
                {monthlyData.map((d, i) => (
                  <span key={i}>{d.monthShort}</span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Komposisi
            </CardTitle>
            <CardDescription>Proporsi pemasukan vs pengeluaran</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {/* Pie Chart */}
            <div className="relative w-40 h-40 mb-6">
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
                  <p className="text-xs text-muted-foreground">Saldo</p>
                  <p className="text-sm font-bold">
                    {formatCurrency(summary.saldoAkhir).replace('Rp', '')}
                  </p>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="w-full space-y-2">
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                <span className="text-sm flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  Pemasukan
                </span>
                <span className="font-medium text-emerald-600">
                  {pieData.pemasukanPercent.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30">
                <span className="text-sm flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                  Pengeluaran
                </span>
                <span className="font-medium text-rose-600">
                  {pieData.pengeluaranPercent.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Income Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
              Kategori Pemasukan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(categoryBreakdown.incomeByCategory).length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Tidak ada data pemasukan</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(categoryBreakdown.incomeByCategory)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, amount]) => (
                    <div
                      key={category}
                      className="flex items-center justify-between p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20"
                    >
                      <span className="text-sm font-medium">{category}</span>
                      <span className="text-sm font-bold text-emerald-600">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expense Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-rose-600">
              <TrendingDown className="h-5 w-5" />
              Kategori Pengeluaran
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(categoryBreakdown.expenseByCategory).length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Tidak ada data pengeluaran</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(categoryBreakdown.expenseByCategory)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, amount]) => (
                    <div
                      key={category}
                      className="flex items-center justify-between p-3 rounded-lg bg-rose-50/50 dark:bg-rose-950/20"
                    >
                      <span className="text-sm font-medium">{category}</span>
                      <span className="text-sm font-bold text-rose-600">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Riwayat Transaksi
          </CardTitle>
          <CardDescription>{filteredTransactions.length} transaksi dalam periode ini</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>Tidak ada transaksi dalam periode ini</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredTransactions
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 20)
                .map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          tx.type === 'INCOME'
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                            : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600'
                        }`}
                      >
                        {tx.type === 'INCOME' ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{tx.description}</h4>
                        <p className="text-xs text-muted-foreground">
                          {tx.category} • {formatDate(tx.date)}
                        </p>
                      </div>
                    </div>
                    <p
                      className={`font-medium text-sm ${
                        tx.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {tx.type === 'INCOME' ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
