'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import { useApp } from '@/context/app-context';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Search, 
  Filter,
  Calendar,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  Building2,
  ArrowRight,
  Settings,
  Link,
  CreditCard,
  Save,
  Users,
  Upload,
  X,
  Check,
} from 'lucide-react';
import { FinanceChart } from '@/components/ui/finance-chart';
import { useToast } from '@/hooks/use-toast';
import type { Transaction, FinanceSummary, MonthlyFinance } from '@/types';

export function FinancePage() {
  const { user, permissions } = useAuth();
  const { settings, refreshSettings } = useApp();
  const { toast } = useToast();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterMonth, setFilterMonth] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterBlok, setFilterBlok] = useState<string>(user?.blok || 'A');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Add Dialog
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: 'INCOME',
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  
  // Edit Dialog
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editFormData, setEditFormData] = useState({
    category: '',
    amount: '',
    description: '',
    date: '',
  });
  
  // Delete Dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  
  // Saldo Awal Dialog
  const [showSaldoDialog, setShowSaldoDialog] = useState(false);
  const [saldoFormData, setSaldoFormData] = useState({
    blok: user?.blok || 'A',
    year: new Date().getFullYear(),
    amount: '',
  });

  // Payment for Resident Dialog
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentBlok, setPaymentBlok] = useState<string>(user?.blok || 'A');
  const [residents, setResidents] = useState<Array<{
    id: string;
    nama: string;
    nomorRumah: string;
    blok: string;
    telepon: string;
    unpaidPeriods: string[];
    paidPeriods: string[];
    pendingPeriods: string[];
    unpaidCount: number;
    totalUnpaid: number;
  }>>([]);
  const [selectedResident, setSelectedResident] = useState<string>('');
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
  const [monthlyFee, setMonthlyFee] = useState(0);
  const [isLoadingResidents, setIsLoadingResidents] = useState(false);
  const [buktiFile, setBuktiFile] = useState<File | null>(null);
  const [buktiPreview, setBuktiPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  // Get monthly finance data for chart from API response
  const monthlyData = useMemo(() => {
    // If summary has monthlyBreakdown, use it
    if (summary?.monthlyBreakdown && summary.monthlyBreakdown.length > 0) {
      return summary.monthlyBreakdown;
    }
    // Return empty array if no data
    return [];
  }, [summary?.monthlyBreakdown]);

  const months = [
    { value: 'ALL', label: 'Semua Bulan' },
    { value: '1', label: 'Januari' },
    { value: '2', label: 'Februari' },
    { value: '3', label: 'Maret' },
    { value: '4', label: 'April' },
    { value: '5', label: 'Mei' },
    { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' },
    { value: '8', label: 'Agustus' },
    { value: '9', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const [formError, setFormError] = useState<string | null>(null);
  
  // Can view all bloks (superadmin) - defined early for use in loadData
  const canViewAllBloks = permissions?.canViewAllUsers || user?.role === 'SUPERADMIN';

  useEffect(() => {
    loadData();
  }, [filterYear, filterMonth, filterType, filterBlok]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Pass filterBlok for superadmin, otherwise backend uses user's blok
      const blokParam = canViewAllBloks ? filterBlok : undefined;
      
      const summaryRes = await api.getFinanceSummary(
        parseInt(filterYear),
        filterMonth !== 'ALL' ? parseInt(filterMonth) : undefined,
        blokParam
      );
      if (summaryRes.ok && summaryRes.data) {
        setSummary(summaryRes.data);
      }
      
      const transRes = await api.getTransactions({
        year: parseInt(filterYear),
        month: filterMonth !== 'ALL' ? parseInt(filterMonth) : undefined,
        type: filterType !== 'ALL' ? filterType : undefined,
        limit: 100,
        blok: blokParam,
      });
      if (transRes.ok && transRes.data) {
        // Filter by blok if not superadmin (frontend fallback)
        let filteredTrans = transRes.data;
        if (!permissions?.canViewAllUsers && user?.blok) {
          filteredTrans = transRes.data.filter(t => t.blok === user.blok);
        }
        setTransactions(filteredTrans);
      }
    } catch (err) {
      setError('Gagal memuat data keuangan');
    } finally {
      setIsLoading(false);
    }
  };

  // Add Transaction
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (!formData.category) {
      setFormError('Kategori harus dipilih');
      return;
    }
    
    const amount = parseInt(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setFormError('Nominal harus berupa angka positif');
      return;
    }
    
    if (!formData.description.trim()) {
      setFormError('Keterangan harus diisi');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await api.createTransaction({
        type: formData.type,
        category: formData.category,
        amount: amount,
        description: formData.description,
        date: formData.date,
      });
      
      if (result.ok) {
        toast({
          title: 'Berhasil',
          description: 'Transaksi berhasil ditambahkan',
        });
        setShowAddDialog(false);
        setFormData({
          type: 'INCOME',
          category: '',
          amount: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
        });
        loadData();
      } else {
        setFormError(result.error || 'Gagal menambah transaksi');
      }
    } catch (err) {
      setFormError('Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Transaction
  const handleEditClick = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditFormData({
      category: transaction.category,
      amount: transaction.amount.toString(),
      description: transaction.description,
      date: transaction.date,
    });
    setShowEditDialog(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;
    
    const amount = parseInt(editFormData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Error',
        description: 'Nominal harus berupa angka positif',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await api.updateTransaction(editingTransaction.id, {
        category: editFormData.category,
        amount: amount,
        description: editFormData.description,
        date: editFormData.date,
      });
      
      if (result.ok) {
        toast({
          title: 'Berhasil',
          description: 'Transaksi berhasil diperbarui',
        });
        setShowEditDialog(false);
        setEditingTransaction(null);
        loadData();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Gagal memperbarui transaksi',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Transaction
  const handleDeleteClick = (transaction: Transaction) => {
    setDeletingTransaction(transaction);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTransaction) return;
    
    setIsSubmitting(true);
    
    try {
      const result = await api.deleteTransaction(deletingTransaction.id);
      
      if (result.ok) {
        toast({
          title: 'Berhasil',
          description: 'Transaksi berhasil dihapus',
        });
        setShowDeleteDialog(false);
        setDeletingTransaction(null);
        loadData();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Gagal menghapus transaksi',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Set Saldo Awal
  const handleSaldoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseInt(saldoFormData.amount);
    if (isNaN(amount) || amount < 0) {
      toast({
        title: 'Error',
        description: 'Nominal tidak valid',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await api.setSaldoAwal(
        saldoFormData.blok,
        saldoFormData.year,
        amount
      );
      
      if (result.ok) {
        toast({
          title: 'Berhasil',
          description: `Saldo awal Blok ${saldoFormData.blok} tahun ${saldoFormData.year} berhasil diatur`,
        });
        setShowSaldoDialog(false);
        refreshSettings?.();
        loadData();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Gagal mengatur saldo awal',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load residents for payment dialog
  const loadResidents = async (blok: string) => {
    setIsLoadingResidents(true);
    try {
      const result = await api.getResidentsByBlok(blok);
      if (result.ok && result.data) {
        setResidents(result.data.residents);
        setMonthlyFee(result.data.monthlyFee);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Gagal memuat data warga',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat memuat data warga',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingResidents(false);
    }
  };

  // Handle file upload for bukti transfer
  const handleBuktiUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: 'Error',
          description: 'Ukuran file maksimal 2MB',
          variant: 'destructive',
        });
        return;
      }
      
      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        toast({
          title: 'Error',
          description: 'Format file harus JPG, PNG, GIF, atau WEBP',
          variant: 'destructive',
        });
        return;
      }
      
      setBuktiFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setBuktiPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload file to server
  const uploadBuktiFile = async (file: File): Promise<string | null> => {
    try {
      const result = await api.uploadFile(file, 'payment_proofs');
      if (result.ok && result.data) {
        return result.data.url;
      }
      return null;
    } catch {
      return null;
    }
  };

  // Handle payment for resident
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedResident) {
      toast({
        title: 'Error',
        description: 'Pilih warga terlebih dahulu',
        variant: 'destructive',
      });
      return;
    }
    
    if (selectedPeriods.length === 0) {
      toast({
        title: 'Error',
        description: 'Pilih minimal 1 periode pembayaran',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Upload bukti if provided
      let buktiUrl = '';
      if (buktiFile) {
        setIsUploading(true);
        buktiUrl = (await uploadBuktiFile(buktiFile)) || '';
        setIsUploading(false);
      }
      
      // Submit payment
      const result = await api.payForResident(selectedResident, selectedPeriods, buktiUrl);
      
      if (result.ok) {
        toast({
          title: 'Berhasil',
          description: result.data?.message || 'Pembayaran iuran berhasil dicatat',
        });
        setShowPaymentDialog(false);
        setSelectedResident('');
        setSelectedPeriods([]);
        setBuktiFile(null);
        setBuktiPreview('');
        loadData();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Gagal mencatat pembayaran',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  // Toggle period selection
  const togglePeriod = (period: string) => {
    setSelectedPeriods(prev => 
      prev.includes(period) 
        ? prev.filter(p => p !== period)
        : [...prev, period]
    );
  };

  // Get selected resident info
  const selectedResidentInfo = residents.find(r => r.id === selectedResident);
  
  // Calculate total payment
  const totalPayment = selectedPeriods.length * monthlyFee;

  // Format period for display
  const formatPeriod = (period: string) => {
    const [year, month] = period.split('-');
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
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

  const filteredTransactions = transactions.filter(t => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        t.description.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Get categories based on selected blok
  const blokCategories = filterBlok === 'A' ? settings?.categoriesA : settings?.categoriesB;
  
  const categories = formData.type === 'INCOME' 
    ? blokCategories?.income || settings?.incomeCategories || ['Iuran', 'Sumbangan', 'Lainnya']
    : formData.type === 'EXPENSE'
    ? blokCategories?.expense || settings?.expenseCategories || ['Kebersihan', 'Keamanan', 'Lainnya']
    : [];

  // Get saldo awal based on blok
  const saldoAwal = filterBlok === 'A' ? settings?.saldoAwalA : settings?.saldoAwalB;

  // Can manage saldo awal - SUPERADMIN can manage both bloks, others only their own
  const isSuperAdmin = user?.role === 'SUPERADMIN';
  const canManageSaldo = permissions?.canCreateTransaction && (
    isSuperAdmin || // SUPERADMIN can manage any blok
    user?.blok === filterBlok // Others can only manage their own blok
  );
  // For the saldo dialog, determine which bloks user can select
  const canSelectBlok = isSuperAdmin; // Only SUPERADMIN can select different blok

  if (!permissions?.canViewFinance) {
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
      {/* Blok Selector (for superadmin) */}
      {canViewAllBloks && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Lihat Keuangan Blok</p>
                  <p className="text-sm text-muted-foreground">Pilih blok untuk melihat data keuangan</p>
                </div>
              </div>
              <div className="flex gap-2">
                {settings?.bloks?.map((blok) => (
                  <Button
                    key={blok}
                    variant={filterBlok === blok ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterBlok(blok)}
                  >
                    Blok {blok}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards - Bento Style */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 pt-4">
            <CardDescription className="flex items-center gap-2 text-xs">
              <Wallet className="h-3 w-3" />
              Saldo Awal Blok {filterBlok}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-xl md:text-2xl font-bold">{formatCurrency(saldoAwal || summary?.saldoAwal || 0)}</p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 pt-4">
            <CardDescription className="flex items-center gap-2 text-xs">
              <TrendingUp className="h-3 w-3" />
              Total Pemasukan
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-xl md:text-2xl font-bold text-emerald-600">{formatCurrency(summary?.totalPemasukan || 0)}</p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 pt-4">
            <CardDescription className="flex items-center gap-2 text-xs">
              <TrendingDown className="h-3 w-3" />
              Total Pengeluaran
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-xl md:text-2xl font-bold text-destructive">{formatCurrency(summary?.totalPengeluaran || 0)}</p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 pt-4">
            <CardDescription className="flex items-center gap-2 text-xs">
              <Wallet className="h-3 w-3" />
              Saldo Akhir
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-xl md:text-2xl font-bold">{formatCurrency(summary?.saldoAkhir || 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">{summary?.periodLabel}</p>
          </CardContent>
        </Card>
      </div>

      {/* Finance Chart */}
      <FinanceChart 
        data={monthlyData} 
        title={`Grafik Keuangan Blok ${filterBlok}`}
        description={`Pemasukan vs Pengeluaran Tahun ${filterYear}`}
        formatCurrency={formatCurrency}
      />

      {/* Transactions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Transaksi Blok {filterBlok}</CardTitle>
              <CardDescription>Daftar transaksi keuangan</CardDescription>
            </div>
            <div className="flex gap-2">
              {/* Set Saldo Awal Button */}
              {canManageSaldo && (
                <Dialog open={showSaldoDialog} onOpenChange={setShowSaldoDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Atur Saldo Awal
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Atur Saldo Awal</DialogTitle>
                      <DialogDescription>
                        {isSuperAdmin 
                          ? 'Tentukan saldo awal untuk blok dan tahun tertentu'
                          : `Atur saldo awal untuk Blok ${user?.blok}`
                        }
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaldoSubmit} className="space-y-4">
                      {canSelectBlok ? (
                        <div className="space-y-2">
                          <Label>Blok</Label>
                          <Select
                            value={saldoFormData.blok}
                            onValueChange={(value) => setSaldoFormData({ ...saldoFormData, blok: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="A">Blok A</SelectItem>
                              <SelectItem value="B">Blok B</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label>Blok</Label>
                          <Input 
                            value={`Blok ${user?.blok}`} 
                            disabled 
                            className="bg-muted"
                          />
                          <p className="text-xs text-muted-foreground">
                            Anda hanya dapat mengatur saldo untuk blok Anda sendiri
                          </p>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <Label>Tahun</Label>
                        <Select
                          value={saldoFormData.year.toString()}
                          onValueChange={(value) => setSaldoFormData({ ...saldoFormData, year: parseInt(value) })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {years.map((year) => (
                              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Jumlah Saldo Awal</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={saldoFormData.amount}
                          onChange={(e) => setSaldoFormData({ ...saldoFormData, amount: e.target.value })}
                        />
                      </div>
                      
                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Menyimpan...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Simpan Saldo Awal
                          </>
                        )}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
              
              {/* Pay Resident Iuran Button */}
              {permissions?.canApprovePayment && (
                <Dialog open={showPaymentDialog} onOpenChange={(open) => {
                  setShowPaymentDialog(open);
                  if (open) {
                    loadResidents(paymentBlok);
                  } else {
                    setSelectedResident('');
                    setSelectedPeriods([]);
                    setBuktiFile(null);
                    setBuktiPreview('');
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Users className="h-4 w-4 mr-2" />
                      Bayar Iuran Warga
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Bayar Iuran Warga</DialogTitle>
                      <DialogDescription>
                        Bayarkan iuran bulanan untuk warga di blok {paymentBlok}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePaymentSubmit} className="space-y-4">
                      {/* Blok Selector for SuperAdmin */}
                      {isSuperAdmin && (
                        <div className="space-y-2">
                          <Label>Pilih Blok</Label>
                          <Select
                            value={paymentBlok}
                            onValueChange={(value) => {
                              setPaymentBlok(value);
                              setSelectedResident('');
                              setSelectedPeriods([]);
                              loadResidents(value);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="A">Blok A</SelectItem>
                              <SelectItem value="B">Blok B</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      
                      {/* Resident Selection */}
                      <div className="space-y-2">
                        <Label>Pilih Warga</Label>
                        {isLoadingResidents ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin" />
                          </div>
                        ) : residents.length === 0 ? (
                          <p className="text-sm text-muted-foreground py-4 text-center">
                            Tidak ada data warga
                          </p>
                        ) : (
                          <div className="border rounded-md max-h-48 overflow-y-auto">
                            {residents.map((resident) => (
                              <div
                                key={resident.id}
                                className={`flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 border-b last:border-b-0 ${
                                  selectedResident === resident.id ? 'bg-muted' : ''
                                }`}
                                onClick={() => {
                                  setSelectedResident(resident.id);
                                  setSelectedPeriods([]);
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-4 h-4 rounded-full border ${
                                    selectedResident === resident.id 
                                      ? 'bg-primary border-primary' 
                                      : 'border-muted-foreground'
                                  } flex items-center justify-center`}>
                                    {selectedResident === resident.id && (
                                      <Check className="h-3 w-3 text-primary-foreground" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-medium">{resident.nama}</p>
                                    <p className="text-sm text-muted-foreground">
                                      No. {resident.nomorRumah} {resident.unpaidCount > 0 && (
                                        <span className="text-destructive">
                                          • {resident.unpaidCount} bulan belum dibayar
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                </div>
                                {resident.unpaidCount > 0 && (
                                  <Badge variant="destructive">
                                    {formatCurrency(resident.totalUnpaid)}
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Period Selection */}
                      {selectedResidentInfo && selectedResidentInfo.unpaidPeriods.length > 0 && (
                        <div className="space-y-2">
                          <Label>Pilih Periode Pembayaran</Label>
                          <p className="text-sm text-muted-foreground">
                            Tarif iuran: {formatCurrency(monthlyFee)}/bulan
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {selectedResidentInfo.unpaidPeriods.map((period) => (
                              <Badge
                                key={period}
                                variant={selectedPeriods.includes(period) ? 'default' : 'outline'}
                                className="cursor-pointer"
                                onClick={() => togglePeriod(period)}
                              >
                                {formatPeriod(period)}
                              </Badge>
                            ))}
                          </div>
                          
                          {/* Also show paid periods */}
                          {selectedResidentInfo.paidPeriods.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-muted-foreground mb-1">Sudah dibayar:</p>
                              <div className="flex flex-wrap gap-1">
                                {selectedResidentInfo.paidPeriods.map((period) => (
                                  <Badge key={period} variant="secondary" className="text-xs">
                                    {formatPeriod(period)}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Total Payment */}
                      {selectedPeriods.length > 0 && (
                        <div className="p-3 bg-muted rounded-md">
                          <div className="flex justify-between items-center">
                            <span>Total Pembayaran:</span>
                            <span className="text-lg font-bold">{formatCurrency(totalPayment)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {selectedPeriods.length} bulan × {formatCurrency(monthlyFee)}
                          </p>
                        </div>
                      )}
                      
                      {/* Bukti Transfer Upload */}
                      <div className="space-y-2">
                        <Label>Bukti Transfer (Opsional)</Label>
                        <div className="border-2 border-dashed rounded-md p-4">
                          {buktiPreview ? (
                            <div className="relative">
                              <img 
                                src={buktiPreview} 
                                alt="Bukti Transfer" 
                                className="max-h-32 mx-auto rounded"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-0 right-0 h-6 w-6"
                                onClick={() => {
                                  setBuktiFile(null);
                                  setBuktiPreview('');
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center cursor-pointer">
                              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                              <span className="text-sm text-muted-foreground">
                                Klik untuk upload bukti transfer
                              </span>
                              <span className="text-xs text-muted-foreground">
                                (JPG, PNG, GIF, WEBP - Max 2MB)
                              </span>
                              <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleBuktiUpload}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={isSubmitting || !selectedResident || selectedPeriods.length === 0}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {isUploading ? 'Mengupload bukti...' : 'Memproses...'}
                          </>
                        ) : (
                          <>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Bayar Iuran
                          </>
                        )}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
              
              {/* Add Transaction Button */}
              {permissions?.canCreateTransaction && (
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Transaksi
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Tambah Transaksi Baru</DialogTitle>
                      <DialogDescription>Masukkan detail transaksi untuk Blok {filterBlok}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {formError && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{formError}</AlertDescription>
                        </Alert>
                      )}
                      
                      <div className="space-y-2">
                        <Label>Tipe</Label>
                        <Select
                          value={formData.type}
                          onValueChange={(value) => setFormData({ ...formData, type: value, category: '' })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="INCOME">Pemasukan</SelectItem>
                            <SelectItem value="EXPENSE">Pengeluaran</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Kategori</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => setFormData({ ...formData, category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih kategori" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Nominal</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Keterangan</Label>
                        <Textarea
                          placeholder="Keterangan transaksi"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Tanggal</Label>
                        <Input
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        />
                      </div>
                      
                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Menyimpan...
                          </>
                        ) : (
                          'Simpan'
                        )}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter Controls */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Semua Bulan" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Semua Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Tipe</SelectItem>
                <SelectItem value="INCOME">Pemasukan</SelectItem>
                <SelectItem value="EXPENSE">Pengeluaran</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari transaksi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Transactions Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  {permissions?.canEditTransaction && <TableHead className="w-[100px]">Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Tidak ada transaksi
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{formatDate(tx.date)}</TableCell>
                      <TableCell>{tx.category}</TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="flex items-center gap-2">
                          <span className="truncate">{tx.description}</span>
                          {tx.paymentId && (
                            <Badge variant="outline" className="text-xs flex-shrink-0">
                              <CreditCard className="h-3 w-3 mr-1" />
                              Iuran
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={tx.type === 'INCOME' ? 'default' : 'destructive'}>
                          {tx.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-medium ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </TableCell>
                      {permissions?.canEditTransaction && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEditClick(tx)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {permissions?.canDeleteTransaction && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-destructive"
                                onClick={() => handleDeleteClick(tx)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Transaction Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaksi</DialogTitle>
            <DialogDescription>Ubah detail transaksi</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select
                value={editFormData.category}
                onValueChange={(value) => setEditFormData({ ...editFormData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Nominal</Label>
              <Input
                type="number"
                placeholder="0"
                value={editFormData.amount}
                onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Keterangan</Label>
              <Textarea
                placeholder="Keterangan transaksi"
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Tanggal</Label>
              <Input
                type="date"
                value={editFormData.date}
                onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Perubahan'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Transaksi?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus transaksi "{deletingTransaction?.description}"?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                'Hapus'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
