'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/ui/file-upload';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Settings,
  Loader2,
  AlertCircle,
  Save,
  Shield,
  Tags,
  CheckCircle,
  Image as ImageIcon,
  Palette,
  CreditCard,
  MessageSquare,
  MapPin,
  Building2,
  Wallet,
  Plus,
  X,
  Phone,
  MessageCircle,
  User,
  Users,
  Pencil,
  Trash2,
  GripVertical,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { AppSettings, Permissions, BankInfo, BlokCategories, SafeUser, StrukturOrganisasi, JabatanConfigItem, JabatanConfig, KontakRT } from '@/types';

export function SettingsPage() {
  const { user, permissions } = useAuth();
  
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Record<string, Permissions>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adminUsers, setAdminUsers] = useState<SafeUser[]>([]);
  const [strukturOrganisasi, setStrukturOrganisasi] = useState<StrukturOrganisasi | null>(null);
  
  // State for jabatan editor
  const [isJabatanDialogOpen, setIsJabatanDialogOpen] = useState(false);
  const [editingJabatan, setEditingJabatan] = useState<JabatanConfigItem | null>(null);
  const [jabatanForm, setJabatanForm] = useState<{ label: string; scope: 'BLOK' | 'SHARED' }>({ label: '', scope: 'BLOK' });
  const [deleteJabatanKey, setDeleteJabatanKey] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    
    try {
      if (permissions?.canManageSettings) {
        const settingsRes = await api.getAllSettings();
        if (settingsRes.ok && settingsRes.data) {
          setSettings(settingsRes.data);
        }
      }
      
      if (permissions?.canManageRoles) {
        const permRes = await api.getAllPermissions();
        if (permRes.ok && permRes.data) {
          setRolePermissions(permRes.data);
        }
      }
      
      // Fetch admin users for contact settings
      const usersRes = await api.getUsers({ status: 'ACTIVE' });
      if (usersRes.ok && usersRes.data) {
        const admins = usersRes.data.filter(u => 
          ['SUPERADMIN', 'ADMIN', 'BENDAHARA'].includes(u.role)
        );
        setAdminUsers(admins);
      }

      // Fetch struktur organisasi for contact settings
      const strukturRes = await api.getStrukturOrganisasi();
      if (strukturRes.ok && strukturRes.data) {
        setStrukturOrganisasi(strukturRes.data);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSubmitting(true);
    setSuccess(null);
    setError(null);
    
    try {
      const result = await api.updateSettings(settings || {});
      if (result.ok) {
        setSuccess('Pengaturan berhasil disimpan');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Gagal menyimpan pengaturan');
      }
    } catch (err) {
      setError('Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSavePermissions = async (role: string, perms: Permissions) => {
    setIsSubmitting(true);
    setSuccess(null);
    setError(null);
    
    try {
      const result = await api.updatePermissions(role, perms);
      if (result.ok) {
        setSuccess('Permission berhasil disimpan');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Gagal menyimpan permission');
      }
    } catch (err) {
      setError('Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (file: File, settingKey: string) => {
    setError(null);
    
    try {
      // Logo & banner uploads go to 'logo_banner' folder
      const result = await api.uploadFile(file, 'logo_banner');
      
      if (result.ok && result.data?.url) {
        updateSetting(settingKey, result.data.url);
        return { ok: true, url: result.data.url };
      } else {
        setError(result.error || 'Gagal mengupload file');
        return { ok: false, error: result.error || 'Gagal mengupload file' };
      }
    } catch (err) {
      setError('Terjadi kesalahan saat upload');
      return { ok: false, error: 'Terjadi kesalahan saat upload' };
    }
  };

  // Handle saldo awal save
  const handleSaveSaldoAwal = async (blok: 'A' | 'B', amount: number) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const year = new Date().getFullYear();
      const result = await api.setSaldoAwal(blok, year, amount);
      if (result.ok) {
        setSuccess(`Saldo awal Blok ${blok} berhasil disimpan`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Gagal menyimpan saldo awal');
      }
    } catch (err) {
      setError('Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!permissions?.canManageSettings && !permissions?.canManageRoles) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Anda tidak memiliki akses untuk melihat halaman ini.
        </AlertDescription>
      </Alert>
    );
  }

  const updateSetting = (key: string, value: unknown) => {
    setSettings(prev => prev ? { ...prev, [key]: value } : null);
  };

  // Helper function to handle number input without leading zeros
  const handleNumberInput = (key: string, value: string) => {
    // Remove leading zeros but keep at least one digit
    const normalizedValue = value.replace(/^0+/, '') || '0';
    const numericValue = parseInt(normalizedValue) || 0;
    updateSetting(key, numericValue);
  };

  // Update bank info for specific blok
  const updateBankInfo = (blok: 'A' | 'B', field: keyof BankInfo, value: string) => {
    const key = blok === 'A' ? 'bankInfoA' : 'bankInfoB';
    const currentInfo = settings?.[key] as BankInfo | undefined;
    setSettings(prev => prev ? {
      ...prev,
      [key]: {
        bankName: currentInfo?.bankName || '',
        bankAccount: currentInfo?.bankAccount || '',
        bankHolder: currentInfo?.bankHolder || '',
        [field]: value,
      }
    } : null);
  };

  // Update categories for specific blok
  const updateCategories = (blok: 'A' | 'B', type: 'income' | 'expense' | 'information', categories: string[]) => {
    const key = blok === 'A' ? 'categoriesA' : 'categoriesB';
    const currentCategories = settings?.[key] as BlokCategories | undefined;
    setSettings(prev => prev ? {
      ...prev,
      [key]: {
        income: currentCategories?.income || [],
        expense: currentCategories?.expense || [],
        information: currentCategories?.information || [],
        [type]: categories,
      }
    } : null);
  };

  // Jabatan Config handlers
  const getJabatanConfig = (): JabatanConfig => {
    return settings?.jabatanConfig || {
      perBlok: [
        { key: 'KETUA_RT', label: 'Ketua RT', order: 1, scope: 'BLOK' },
        { key: 'WAKIL_KETUA', label: 'Wakil Ketua RT', order: 2, scope: 'BLOK' },
        { key: 'SEKRETARIS', label: 'Sekretaris', order: 3, scope: 'BLOK' },
        { key: 'BENDAHARA', label: 'Bendahara', order: 4, scope: 'BLOK' },
      ],
      bersama: [
        { key: 'SIE_KEAMANAN', label: 'Sie. Keamanan', order: 10, scope: 'SHARED' },
        { key: 'SIE_KEBERSIHAN', label: 'Sie. Kebersihan', order: 11, scope: 'SHARED' },
        { key: 'DKM_MASJID', label: 'DKM Masjid Al Birr', order: 12, scope: 'SHARED' },
      ],
    };
  };

  const generateJabatanKey = (label: string): string => {
    return label
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .replace(/^_+|_+$/g, '');
  };

  const openAddJabatanDialog = (scope: 'BLOK' | 'SHARED') => {
    setEditingJabatan(null);
    setJabatanForm({ label: '', scope });
    setIsJabatanDialogOpen(true);
  };

  const openEditJabatanDialog = (jabatan: JabatanConfigItem) => {
    setEditingJabatan(jabatan);
    setJabatanForm({ label: jabatan.label, scope: jabatan.scope });
    setIsJabatanDialogOpen(true);
  };

  const handleSaveJabatan = () => {
    if (!jabatanForm.label.trim()) {
      setError('Label jabatan tidak boleh kosong');
      return;
    }

    const config = getJabatanConfig();
    const key = editingJabatan?.key || generateJabatanKey(jabatanForm.label);
    
    if (jabatanForm.scope === 'BLOK') {
      const existingIndex = config.perBlok.findIndex(j => j.key === key);
      const maxOrder = Math.max(...config.perBlok.map(j => j.order), 0);
      
      if (existingIndex >= 0) {
        // Update existing
        config.perBlok[existingIndex] = {
          ...config.perBlok[existingIndex],
          label: jabatanForm.label,
          scope: jabatanForm.scope,
        };
      } else {
        // Add new
        config.perBlok.push({
          key,
          label: jabatanForm.label,
          order: maxOrder + 1,
          scope: jabatanForm.scope,
        });
      }
      
      // Sort by order
      config.perBlok.sort((a, b) => a.order - b.order);
    } else {
      const existingIndex = config.bersama.findIndex(j => j.key === key);
      const maxOrder = Math.max(...config.bersama.map(j => j.order), 9);
      
      if (existingIndex >= 0) {
        // Update existing
        config.bersama[existingIndex] = {
          ...config.bersama[existingIndex],
          label: jabatanForm.label,
          scope: jabatanForm.scope,
        };
      } else {
        // Add new
        config.bersama.push({
          key,
          label: jabatanForm.label,
          order: maxOrder + 1,
          scope: jabatanForm.scope,
        });
      }
      
      // Sort by order
      config.bersama.sort((a, b) => a.order - b.order);
    }

    updateSetting('jabatanConfig', config);
    setIsJabatanDialogOpen(false);
    setEditingJabatan(null);
    setJabatanForm({ label: '', scope: 'BLOK' });
  };

  const handleDeleteJabatan = () => {
    if (!deleteJabatanKey) return;

    const config = getJabatanConfig();
    config.perBlok = config.perBlok.filter(j => j.key !== deleteJabatanKey);
    config.bersama = config.bersama.filter(j => j.key !== deleteJabatanKey);
    
    updateSetting('jabatanConfig', config);
    setDeleteJabatanKey(null);
  };

  const moveJabatanUp = (key: string, scope: 'BLOK' | 'SHARED') => {
    const config = getJabatanConfig();
    const list = scope === 'BLOK' ? config.perBlok : config.bersama;
    const index = list.findIndex(j => j.key === key);
    
    if (index > 0) {
      // Swap orders
      const temp = list[index].order;
      list[index].order = list[index - 1].order;
      list[index - 1].order = temp;
      
      // Sort
      list.sort((a, b) => a.order - b.order);
      
      if (scope === 'BLOK') {
        config.perBlok = list;
      } else {
        config.bersama = list;
      }
      
      updateSetting('jabatanConfig', config);
    }
  };

  const moveJabatanDown = (key: string, scope: 'BLOK' | 'SHARED') => {
    const config = getJabatanConfig();
    const list = scope === 'BLOK' ? config.perBlok : config.bersama;
    const index = list.findIndex(j => j.key === key);
    
    if (index < list.length - 1) {
      // Swap orders
      const temp = list[index].order;
      list[index].order = list[index + 1].order;
      list[index + 1].order = temp;
      
      // Sort
      list.sort((a, b) => a.order - b.order);
      
      if (scope === 'BLOK') {
        config.perBlok = list;
      } else {
        config.bersama = list;
      }
      
      updateSetting('jabatanConfig', config);
    }
  };

  // Kontak RT handlers
  const updateKontakRT = (blok: 'A' | 'B', field: keyof KontakRT, value: string) => {
    const key = blok === 'A' ? 'kontakRTA' : 'kontakRTB';
    const currentKontak = settings?.[key] as KontakRT | undefined;
    setSettings(prev => prev ? {
      ...prev,
      [key]: {
        nama: currentKontak?.nama || '',
        telepon: currentKontak?.telepon || '',
        alamat: currentKontak?.alamat || '',
        [field]: value,
      }
    } : null);
  };

  const updatePermission = (role: string, key: keyof Permissions, value: boolean) => {
    setRolePermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [key]: value,
      },
    }));
  };

  const roles = ['SUPERADMIN', 'ADMIN', 'BENDAHARA', 'WARGA'];
  const permissionLabels: Record<keyof Permissions, string> = {
    canViewAllUsers: 'Lihat Semua Warga',
    canViewOwnBlokUsers: 'Lihat Warga Blok Sendiri',
    canApproveUsers: 'Setujui Warga',
    canRejectUsers: 'Tolak Warga',
    canChangeUserRole: 'Ubah Role Warga',
    canBlockUsers: 'Blokir Warga',
    canViewFinance: 'Lihat Keuangan',
    canCreateTransaction: 'Buat Transaksi',
    canEditTransaction: 'Edit Transaksi',
    canDeleteTransaction: 'Hapus Transaksi',
    canSubmitPayment: 'Submit Pembayaran',
    canApprovePayment: 'Setujui Pembayaran',
    canRejectPayment: 'Tolak Pembayaran',
    canViewAllPayments: 'Lihat Semua Pembayaran',
    canCreateAgenda: 'Buat Agenda',
    canEditAgenda: 'Edit Agenda',
    canDeleteAgenda: 'Hapus Agenda',
    canCreateInformation: 'Buat Informasi',
    canEditInformation: 'Edit Informasi',
    canDeleteInformation: 'Hapus Informasi',
    canUploadGallery: 'Upload Galeri',
    canDeleteGallery: 'Hapus Galeri',
    canApproveReviews: 'Setujui Testimoni',
    canDeleteReviews: 'Hapus Testimoni',
    canManageSettings: 'Kelola Pengaturan',
    canManageRoles: 'Kelola Permission',
  };

  // Default categories for each blok
  const defaultIncomeCategories = ['Iuran Bulanan', 'Dana Sosial', 'Sumbangan', 'Lain-lain'];
  const defaultExpenseCategories = ['Kebersihan', 'Keamanan', 'Perbaikan', 'Listrik', 'Kegiatan', 'Administrasi', 'Lain-lain'];
  const defaultInformationCategories = ['Pengumuman', 'Berita', 'Info Penting'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Pengaturan</h2>
          <p className="text-muted-foreground">Kelola pengaturan aplikasi</p>
        </div>
      </div>

      {success && (
        <Alert className="bg-green-50 border-green-500 text-green-800">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          {permissions?.canManageSettings && (
            <>
              <TabsTrigger value="general">
                <Settings className="h-4 w-4 mr-2" />
                Umum
              </TabsTrigger>
              <TabsTrigger value="appearance">
                <ImageIcon className="h-4 w-4 mr-2" />
                Tampilan
              </TabsTrigger>
              <TabsTrigger value="payment">
                <CreditCard className="h-4 w-4 mr-2" />
                Pembayaran
              </TabsTrigger>
              <TabsTrigger value="saldo">
                <Wallet className="h-4 w-4 mr-2" />
                Saldo Awal
              </TabsTrigger>
              <TabsTrigger value="categories">
                <Tags className="h-4 w-4 mr-2" />
                Kategori
              </TabsTrigger>
              <TabsTrigger value="jabatan">
                <Users className="h-4 w-4 mr-2" />
                Struktur Organisasi
              </TabsTrigger>
              <TabsTrigger value="contact">
                <MessageSquare className="h-4 w-4 mr-2" />
                Kontak
              </TabsTrigger>
            </>
          )}
          {permissions?.canManageRoles && (
            <TabsTrigger value="permissions">
              <Shield className="h-4 w-4 mr-2" />
              Permissions
            </TabsTrigger>
          )}
        </TabsList>

        {/* General Settings */}
        {permissions?.canManageSettings && (
          <TabsContent value="general" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Pengaturan Umum</CardTitle>
                <CardDescription>Konfigurasi dasar aplikasi</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {settings && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nama Situs</Label>
                        <Input
                          value={settings.siteName || ''}
                          onChange={(e) => updateSetting('siteName', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Iuran Bulanan (Rp)</Label>
                        <Input
                          type="number"
                          value={settings.monthlyFee || ''}
                          onChange={(e) => handleNumberInput('monthlyFee', e.target.value)}
                          min="0"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Deskripsi Situs</Label>
                      <Textarea
                        value={settings.siteDescription || ''}
                        onChange={(e) => updateSetting('siteDescription', e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-4">
                      <Label>Fitur</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">Registrasi</p>
                            <p className="text-sm text-muted-foreground">Izinkan pendaftaran warga baru</p>
                          </div>
                          <Switch
                            checked={settings.enableRegistration}
                            onCheckedChange={(checked) => updateSetting('enableRegistration', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">Pembayaran</p>
                            <p className="text-sm text-muted-foreground">Izinkan submit pembayaran</p>
                          </div>
                          <Switch
                            checked={settings.enablePaymentSubmission}
                            onCheckedChange={(checked) => updateSetting('enablePaymentSubmission', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">Agenda</p>
                            <p className="text-sm text-muted-foreground">Tampilkan fitur agenda</p>
                          </div>
                          <Switch
                            checked={settings.enableAgenda}
                            onCheckedChange={(checked) => updateSetting('enableAgenda', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">Galeri</p>
                            <p className="text-sm text-muted-foreground">Tampilkan fitur galeri</p>
                          </div>
                          <Switch
                            checked={settings.enableGallery}
                            onCheckedChange={(checked) => updateSetting('enableGallery', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">Informasi</p>
                            <p className="text-sm text-muted-foreground">Tampilkan fitur informasi</p>
                          </div>
                          <Switch
                            checked={settings.enableInformation}
                            onCheckedChange={(checked) => updateSetting('enableInformation', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">Keuangan Publik</p>
                            <p className="text-sm text-muted-foreground">Tampilkan ringkasan keuangan di landing page</p>
                          </div>
                          <Switch
                            checked={settings.enablePublicFinance}
                            onCheckedChange={(checked) => updateSetting('enablePublicFinance', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">Testimoni</p>
                            <p className="text-sm text-muted-foreground">Tampilkan fitur testimoni</p>
                          </div>
                          <Switch
                            checked={settings.enableReviews}
                            onCheckedChange={(checked) => updateSetting('enableReviews', checked)}
                          />
                        </div>
                      </div>
                    </div>

                    <Button onClick={handleSaveSettings} disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Simpan
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Appearance Settings */}
        {permissions?.canManageSettings && (
          <TabsContent value="appearance" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Logo & Banner
                </CardTitle>
                <CardDescription>Upload logo dan banner untuk tampilan aplikasi (maksimal 2MB)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {settings && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Logo Upload */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-semibold">Logo</Label>
                          {settings.logoUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateSetting('logoUrl', '')}
                              className="text-destructive"
                            >
                              Hapus
                            </Button>
                          )}
                        </div>
                        <FileUpload
                          onUpload={(file) => handleFileUpload(file, 'logoUrl')}
                          value={settings.logoUrl || null}
                          onValueChange={(url) => updateSetting('logoUrl', url)}
                          accept="image/*"
                          maxSizeMB={2}
                          label="Logo Aplikasi"
                          description="Format: JPG, PNG, WEBP. Disarankan ukuran persegi (1:1)"
                          previewClassName="h-32"
                        />
                        {/* Show preview - either uploaded logo or dummy */}
                        <div className="p-4 bg-muted rounded-lg flex flex-col items-center justify-center">
                          <img
                            src={settings.logoUrl || '/logo.jpg'}
                            alt="Logo Preview"
                            className="max-h-20 object-contain"
                          />
                          {!settings.logoUrl && (
                            <p className="text-xs text-muted-foreground mt-2">Logo default (upload untuk mengganti)</p>
                          )}
                        </div>
                      </div>

                      {/* Banner Upload */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-semibold">Banner</Label>
                          {settings.bannerUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateSetting('bannerUrl', '')}
                              className="text-destructive"
                            >
                              Hapus
                            </Button>
                          )}
                        </div>
                        <FileUpload
                          onUpload={(file) => handleFileUpload(file, 'bannerUrl')}
                          value={settings.bannerUrl || null}
                          onValueChange={(url) => updateSetting('bannerUrl', url)}
                          accept="image/*"
                          maxSizeMB={2}
                          label="Banner Aplikasi"
                          description="Format: JPG, PNG, WEBP. Disarankan rasio 16:9"
                          previewClassName="h-32"
                        />
                        {/* Show preview - either uploaded banner or dummy */}
                        <div className="p-4 bg-muted rounded-lg">
                          <img
                            src={settings.bannerUrl || '/banner.jpg'}
                            alt="Banner Preview"
                            className="w-full h-32 object-cover rounded"
                          />
                          {!settings.bannerUrl && (
                            <p className="text-xs text-muted-foreground mt-2 text-center">Banner default (upload untuk mengganti)</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button onClick={handleSaveSettings} disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Simpan Tampilan
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Warna & Tema
                </CardTitle>
                <CardDescription>Kustomisasi warna aplikasi</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Warna Primer</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={settings.primaryColor || '#2563eb'}
                            onChange={(e) => updateSetting('primaryColor', e.target.value)}
                            className="w-16 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={settings.primaryColor || '#2563eb'}
                            onChange={(e) => updateSetting('primaryColor', e.target.value)}
                            placeholder="#2563eb"
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                      <div className="flex gap-2">
                        <Button style={{ backgroundColor: settings.primaryColor || '#2563eb' }}>
                          Tombol Primer
                        </Button>
                        <Button variant="outline" style={{ borderColor: settings.primaryColor || '#2563eb', color: settings.primaryColor || '#2563eb' }}>
                          Tombol Outline
                        </Button>
                      </div>
                    </div>

                    <Button onClick={handleSaveSettings} disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Simpan Warna
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Payment Settings - Per Blok */}
        {permissions?.canManageSettings && (
          <TabsContent value="payment" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Pengaturan Pembayaran Per Blok
                </CardTitle>
                <CardDescription>Konfigurasi nomor rekening untuk masing-masing blok</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {settings && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Iuran Bulanan (Rp)</Label>
                        <Input
                          type="number"
                          value={settings.monthlyFee || ''}
                          onChange={(e) => handleNumberInput('monthlyFee', e.target.value)}
                          min="0"
                        />
                        <p className="text-xs text-muted-foreground">
                          Nominal iuran warga per bulan
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {/* Bank Info Blok A */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        <Label className="text-base font-semibold">Rekening Blok A</Label>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="space-y-2">
                          <Label>Nama Bank</Label>
                          <Input
                            value={settings.bankInfoA?.bankName || ''}
                            onChange={(e) => updateBankInfo('A', 'bankName', e.target.value)}
                            placeholder="Contoh: BCA, Mandiri, BRI"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Nomor Rekening</Label>
                          <Input
                            value={settings.bankInfoA?.bankAccount || ''}
                            onChange={(e) => updateBankInfo('A', 'bankAccount', e.target.value)}
                            placeholder="1234567890"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Nama Pemilik Rekening</Label>
                          <Input
                            value={settings.bankInfoA?.bankHolder || ''}
                            onChange={(e) => updateBankInfo('A', 'bankHolder', e.target.value)}
                            placeholder="Nama lengkap"
                          />
                        </div>
                      </div>
                      {settings.bankInfoA?.bankName && (
                        <div className="bg-background p-3 rounded border border-blue-200">
                          <p className="font-medium">{settings.bankInfoA.bankName}</p>
                          <p className="text-lg font-bold">{settings.bankInfoA.bankAccount}</p>
                          <p className="text-sm text-muted-foreground">a.n. {settings.bankInfoA.bankHolder}</p>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Bank Info Blok B */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-green-600" />
                        <Label className="text-base font-semibold">Rekening Blok B</Label>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="space-y-2">
                          <Label>Nama Bank</Label>
                          <Input
                            value={settings.bankInfoB?.bankName || ''}
                            onChange={(e) => updateBankInfo('B', 'bankName', e.target.value)}
                            placeholder="Contoh: BCA, Mandiri, BRI"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Nomor Rekening</Label>
                          <Input
                            value={settings.bankInfoB?.bankAccount || ''}
                            onChange={(e) => updateBankInfo('B', 'bankAccount', e.target.value)}
                            placeholder="1234567890"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Nama Pemilik Rekening</Label>
                          <Input
                            value={settings.bankInfoB?.bankHolder || ''}
                            onChange={(e) => updateBankInfo('B', 'bankHolder', e.target.value)}
                            placeholder="Nama lengkap"
                          />
                        </div>
                      </div>
                      {settings.bankInfoB?.bankName && (
                        <div className="bg-background p-3 rounded border border-green-200">
                          <p className="font-medium">{settings.bankInfoB.bankName}</p>
                          <p className="text-lg font-bold">{settings.bankInfoB.bankAccount}</p>
                          <p className="text-sm text-muted-foreground">a.n. {settings.bankInfoB.bankHolder}</p>
                        </div>
                      )}
                    </div>

                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Informasi pembayaran akan ditampilkan kepada warga sesuai dengan blok mereka.
                        Warga Blok A akan melihat rekening Blok A, dan sebaliknya.
                      </p>
                    </div>

                    <Button onClick={handleSaveSettings} disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Simpan Pembayaran
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Saldo Awal Settings */}
        {permissions?.canManageSettings && (
          <TabsContent value="saldo" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Saldo Awal Per Blok
                </CardTitle>
                <CardDescription>
                  Atur saldo awal untuk tahun {new Date().getFullYear()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {settings && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Saldo Awal Blok A */}
                      <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-blue-600" />
                          <Label className="text-base font-semibold">Saldo Awal Blok A</Label>
                        </div>
                        <div className="space-y-2">
                          <Label>Nominal (Rp)</Label>
                          <Input
                            type="number"
                            value={settings.saldoAwalA || ''}
                            onChange={(e) => handleNumberInput('saldoAwalA', e.target.value)}
                            placeholder="0"
                            min="0"
                          />
                          <p className="text-xs text-muted-foreground">
                            Saldo awal tahun {new Date().getFullYear()} untuk Blok A
                          </p>
                        </div>
                        <Button 
                          onClick={() => handleSaveSaldoAwal('A', settings.saldoAwalA || 0)}
                          disabled={isSubmitting}
                          className="w-full"
                        >
                          {isSubmitting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="mr-2 h-4 w-4" />
                          )}
                          Simpan Saldo A
                        </Button>
                      </div>

                      {/* Saldo Awal Blok B */}
                      <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-green-600" />
                          <Label className="text-base font-semibold">Saldo Awal Blok B</Label>
                        </div>
                        <div className="space-y-2">
                          <Label>Nominal (Rp)</Label>
                          <Input
                            type="number"
                            value={settings.saldoAwalB || ''}
                            onChange={(e) => handleNumberInput('saldoAwalB', e.target.value)}
                            placeholder="0"
                            min="0"
                          />
                          <p className="text-xs text-muted-foreground">
                            Saldo awal tahun {new Date().getFullYear()} untuk Blok B
                          </p>
                        </div>
                        <Button 
                          onClick={() => handleSaveSaldoAwal('B', settings.saldoAwalB || 0)}
                          disabled={isSubmitting}
                          className="w-full"
                        >
                          {isSubmitting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="mr-2 h-4 w-4" />
                          )}
                          Simpan Saldo B
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Saldo awal adalah jumlah uang yang ada di kas blok pada awal tahun.
                        Ini akan digunakan untuk menghitung saldo akhir di laporan keuangan.
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Contact Settings */}
        {permissions?.canManageSettings && (
          <TabsContent value="contact" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Kontak & Lokasi
                </CardTitle>
                <CardDescription>Informasi kontak dan lokasi komplek</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {settings && (
                  <>
                    {/* Kontak Pengurus Per Blok */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        <Label className="text-base font-semibold">Kontak Pengurus Per Blok</Label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Kontak pengurus diambil dari Struktur Organisasi. Untuk mengubah, silakan edit di menu Struktur Organisasi.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Blok A */}
                        <div className="border rounded-lg p-4 bg-blue-50/50 border-blue-200">
                          <h4 className="font-semibold text-blue-700 mb-3 flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Blok A
                          </h4>
                          <div className="space-y-2">
                            {strukturOrganisasi?.blokA?.pengurus && strukturOrganisasi.blokA.pengurus.length > 0 ? (
                              strukturOrganisasi.blokA.pengurus
                                .sort((a, b) => a.order - b.order)
                                .map((p) => (
                                  <div key={p.id} className="flex items-center justify-between p-2 bg-white rounded border border-blue-100">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage src={p.photoUrl || undefined} alt={p.nama} />
                                        <AvatarFallback className="bg-blue-500 text-white text-xs">
                                          {p.nama.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="min-w-0">
                                        <p className="font-medium text-sm truncate">{p.nama}</p>
                                        <p className="text-xs text-muted-foreground">{p.jabatanLabel}</p>
                                      </div>
                                    </div>
                                    {p.telepon && (
                                      <a
                                        href={`https://wa.me/${p.telepon.replace(/^0/, '62')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded-full transition-colors"
                                      >
                                        <MessageCircle className="h-3 w-3" />
                                        <span>Hubungi</span>
                                      </a>
                                    )}
                                  </div>
                                ))
                            ) : (
                              <p className="text-sm text-muted-foreground text-center py-2">Belum ada pengurus</p>
                            )}
                          </div>
                        </div>

                        {/* Blok B */}
                        <div className="border rounded-lg p-4 bg-green-50/50 border-green-200">
                          <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Blok B
                          </h4>
                          <div className="space-y-2">
                            {strukturOrganisasi?.blokB?.pengurus && strukturOrganisasi.blokB.pengurus.length > 0 ? (
                              strukturOrganisasi.blokB.pengurus
                                .sort((a, b) => a.order - b.order)
                                .map((p) => (
                                  <div key={p.id} className="flex items-center justify-between p-2 bg-white rounded border border-green-100">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage src={p.photoUrl || undefined} alt={p.nama} />
                                        <AvatarFallback className="bg-green-500 text-white text-xs">
                                          {p.nama.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="min-w-0">
                                        <p className="font-medium text-sm truncate">{p.nama}</p>
                                        <p className="text-xs text-muted-foreground">{p.jabatanLabel}</p>
                                      </div>
                                    </div>
                                    {p.telepon && (
                                      <a
                                        href={`https://wa.me/${p.telepon.replace(/^0/, '62')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded-full transition-colors"
                                      >
                                        <MessageCircle className="h-3 w-3" />
                                        <span>Hubungi</span>
                                      </a>
                                    )}
                                  </div>
                                ))
                            ) : (
                              <p className="text-sm text-muted-foreground text-center py-2">Belum ada pengurus</p>
                            )}
                          </div>
                        </div>

                        {/* Bersama */}
                        <div className="border rounded-lg p-4 bg-emerald-50/50 border-emerald-200">
                          <h4 className="font-semibold text-emerald-700 mb-3 flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Bersama
                          </h4>
                          <p className="text-xs text-muted-foreground mb-2">Sie. Keamanan, Kebersihan & DKM</p>
                          <div className="space-y-2">
                            {strukturOrganisasi?.bersama?.pengurus && strukturOrganisasi.bersama.pengurus.length > 0 ? (
                              strukturOrganisasi.bersama.pengurus
                                .sort((a, b) => a.order - b.order)
                                .map((p) => (
                                  <div key={p.id} className="flex items-center justify-between p-2 bg-white rounded border border-emerald-100">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage src={p.photoUrl || undefined} alt={p.nama} />
                                        <AvatarFallback className="bg-emerald-500 text-white text-xs">
                                          {p.nama.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="min-w-0">
                                        <p className="font-medium text-sm truncate">{p.nama}</p>
                                        <p className="text-xs text-muted-foreground">{p.jabatanLabel}</p>
                                      </div>
                                    </div>
                                    {p.telepon && (
                                      <a
                                        href={`https://wa.me/${p.telepon.replace(/^0/, '62')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded-full transition-colors"
                                      >
                                        <MessageCircle className="h-3 w-3" />
                                        <span>Hubungi</span>
                                      </a>
                                    )}
                                  </div>
                                ))
                            ) : (
                              <p className="text-sm text-muted-foreground text-center py-2">Belum ada pengurus</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Kontak RT Per Blok */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Phone className="h-5 w-5" />
                        <Label className="text-base font-semibold">Kontak RT Per Blok</Label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Informasi kontak RT untuk masing-masing blok yang akan ditampilkan di landing page.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Kontak RT Blok A */}
                        <div className="border rounded-lg p-4 bg-blue-50/50 border-blue-200 space-y-3">
                          <h4 className="font-semibold text-blue-700 flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Kontak RT Blok A
                          </h4>
                          <div className="space-y-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Nama</Label>
                              <Input
                                value={settings.kontakRTA?.nama || ''}
                                onChange={(e) => updateKontakRT('A', 'nama', e.target.value)}
                                placeholder="Nama Ketua RT Blok A"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Telepon</Label>
                              <Input
                                value={settings.kontakRTA?.telepon || ''}
                                onChange={(e) => updateKontakRT('A', 'telepon', e.target.value)}
                                placeholder="08123456789"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Alamat</Label>
                              <Input
                                value={settings.kontakRTA?.alamat || ''}
                                onChange={(e) => updateKontakRT('A', 'alamat', e.target.value)}
                                placeholder="Alamat RT Blok A"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Kontak RT Blok B */}
                        <div className="border rounded-lg p-4 bg-green-50/50 border-green-200 space-y-3">
                          <h4 className="font-semibold text-green-700 flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Kontak RT Blok B
                          </h4>
                          <div className="space-y-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Nama</Label>
                              <Input
                                value={settings.kontakRTB?.nama || ''}
                                onChange={(e) => updateKontakRT('B', 'nama', e.target.value)}
                                placeholder="Nama Ketua RT Blok B"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Telepon</Label>
                              <Input
                                value={settings.kontakRTB?.telepon || ''}
                                onChange={(e) => updateKontakRT('B', 'telepon', e.target.value)}
                                placeholder="08123456789"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Alamat</Label>
                              <Input
                                value={settings.kontakRTB?.alamat || ''}
                                onChange={(e) => updateKontakRT('B', 'alamat', e.target.value)}
                                placeholder="Alamat RT Blok B"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Nomor WhatsApp Admin Utama */}
                    <div className="space-y-2">
                      <Label>Nomor WhatsApp Admin Utama</Label>
                      <Input
                        value={settings.whatsappAdmin || ''}
                        onChange={(e) => updateSetting('whatsappAdmin', e.target.value)}
                        placeholder="08123456789"
                      />
                      <p className="text-xs text-muted-foreground">
                        Nomor utama yang akan ditampilkan di landing page untuk dihubungi
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nama RT</Label>
                        <Input
                          value={settings.rtName || ''}
                          onChange={(e) => updateSetting('rtName', e.target.value)}
                          placeholder="RT 011"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Nama RW</Label>
                        <Input
                          value={settings.rwName || ''}
                          onChange={(e) => updateSetting('rwName', e.target.value)}
                          placeholder="RW 005"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Alamat Lengkap</Label>
                      <Textarea
                        value={settings.address || ''}
                        onChange={(e) => updateSetting('address', e.target.value)}
                        placeholder="Alamat lengkap komplek"
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Kelurahan</Label>
                        <Input
                          value={settings.kelurahan || ''}
                          onChange={(e) => updateSetting('kelurahan', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Kecamatan</Label>
                        <Input
                          value={settings.kecamatan || ''}
                          onChange={(e) => updateSetting('kecamatan', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Kota</Label>
                        <Input
                          value={settings.kota || ''}
                          onChange={(e) => updateSetting('kota', e.target.value)}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        <Label className="text-base font-semibold">Google Maps Embed URL</Label>
                      </div>
                      <Textarea
                        value={settings.googleMapsEmbedUrl || ''}
                        onChange={(e) => updateSetting('googleMapsEmbedUrl', e.target.value)}
                        placeholder="https://www.google.com/maps/embed?pb=..."
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">
                        Salin URL embed dari Google Maps untuk menampilkan peta lokasi di landing page
                      </p>
                    </div>

                    <Button onClick={handleSaveSettings} disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Simpan Kontak
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Permissions Tab */}
        {permissions?.canManageRoles && (
          <TabsContent value="permissions" className="mt-4">
            <div className="space-y-4">
              {roles.map((role) => (
                <Card key={role}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Badge className={
                            role === 'SUPERADMIN' ? 'bg-purple-500' :
                            role === 'ADMIN' ? 'bg-blue-500' :
                            role === 'BENDAHARA' ? 'bg-amber-500' : ''
                          }>
                            {role}
                          </Badge>
                          {role === 'SUPERADMIN' && (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              Fixed - Tidak dapat diubah
                            </Badge>
                          )}
                        </CardTitle>
                      </div>
                      {role !== 'SUPERADMIN' && (
                        <Button
                          size="sm"
                          onClick={() => handleSavePermissions(role, rolePermissions[role])}
                          disabled={isSubmitting}
                        >
                          Simpan
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {(Object.keys(permissionLabels) as (keyof Permissions)[]).map((perm) => (
                        <div key={perm} className="flex items-center space-x-2">
                          <Switch
                            id={`${role}-${perm}`}
                            checked={rolePermissions[role]?.[perm] || false}
                            onCheckedChange={(checked) => updatePermission(role, perm, checked)}
                            disabled={role === 'SUPERADMIN'}
                          />
                          <Label 
                            htmlFor={`${role}-${perm}`} 
                            className={`text-sm ${role === 'SUPERADMIN' ? 'text-muted-foreground' : ''}`}
                          >
                            {permissionLabels[perm]}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        )}

        {/* Categories Tab - Per Blok */}
        {permissions?.canManageSettings && (
          <TabsContent value="categories" className="mt-4">
            <div className="space-y-6">
              {/* Blok A Categories */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    Kategori Blok A
                  </CardTitle>
                  <CardDescription>Kategori untuk transaksi dan informasi Blok A</CardDescription>
                </CardHeader>
                <CardContent>
                  {settings && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <CategoryEditor
                        title="Kategori Pemasukan"
                        categories={settings.categoriesA?.income || settings.incomeCategories || defaultIncomeCategories}
                        onChange={(cats) => updateCategories('A', 'income', cats)}
                      />
                      <CategoryEditor
                        title="Kategori Pengeluaran"
                        categories={settings.categoriesA?.expense || settings.expenseCategories || defaultExpenseCategories}
                        onChange={(cats) => updateCategories('A', 'expense', cats)}
                      />
                      <CategoryEditor
                        title="Kategori Informasi"
                        categories={settings.categoriesA?.information || settings.informationCategories || defaultInformationCategories}
                        onChange={(cats) => updateCategories('A', 'information', cats)}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Blok B Categories */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-green-600" />
                    Kategori Blok B
                  </CardTitle>
                  <CardDescription>Kategori untuk transaksi dan informasi Blok B</CardDescription>
                </CardHeader>
                <CardContent>
                  {settings && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <CategoryEditor
                        title="Kategori Pemasukan"
                        categories={settings.categoriesB?.income || settings.incomeCategories || defaultIncomeCategories}
                        onChange={(cats) => updateCategories('B', 'income', cats)}
                      />
                      <CategoryEditor
                        title="Kategori Pengeluaran"
                        categories={settings.categoriesB?.expense || settings.expenseCategories || defaultExpenseCategories}
                        onChange={(cats) => updateCategories('B', 'expense', cats)}
                      />
                      <CategoryEditor
                        title="Kategori Informasi"
                        categories={settings.categoriesB?.information || settings.informationCategories || defaultInformationCategories}
                        onChange={(cats) => updateCategories('B', 'information', cats)}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Kategori yang dipisahkan per blok akan memudahkan input laporan keuangan.
                  Setiap blok dapat memiliki kategori pemasukan, pengeluaran, dan informasi yang berbeda.
                </p>
              </div>
              
              <Button onClick={handleSaveSettings} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Simpan Kategori
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        )}

        {/* Struktur Organisasi Tab - Jabatan Config */}
        {permissions?.canManageSettings && (
          <TabsContent value="jabatan" className="mt-4">
            <div className="space-y-6">
              {/* Jabatan Per Blok */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        Jabatan Per Blok
                      </CardTitle>
                      <CardDescription>
                        Jabatan yang ada di masing-masing blok (Ketua RT, Wakil, Sekretaris, Bendahara, dll)
                      </CardDescription>
                    </div>
                    <Button onClick={() => openAddJabatanDialog('BLOK')} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Jabatan
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {settings && (
                    <div className="space-y-2">
                      {getJabatanConfig().perBlok.map((jabatan, index, arr) => (
                        <div
                          key={jabatan.key}
                          className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200"
                        >
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => moveJabatanUp(jabatan.key, 'BLOK')}
                              disabled={index === 0}
                            >
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => moveJabatanDown(jabatan.key, 'BLOK')}
                              disabled={index === arr.length - 1}
                            >
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                          </div>
                          <Badge className="bg-blue-500 text-white">{jabatan.order}</Badge>
                          <div className="flex-1">
                            <p className="font-medium">{jabatan.label}</p>
                            <p className="text-xs text-muted-foreground">{jabatan.key}</p>
                          </div>
                          <Badge variant="outline" className="border-blue-300 text-blue-700">BLOK</Badge>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditJabatanDialog(jabatan)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteJabatanKey(jabatan.key)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Jabatan Bersama */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-emerald-600" />
                        Jabatan Bersama
                      </CardTitle>
                      <CardDescription>
                        Jabatan yang bersifat bersama untuk kedua blok (Sie. Keamanan, Kebersihan, DKM, dll)
                      </CardDescription>
                    </div>
                    <Button onClick={() => openAddJabatanDialog('SHARED')} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Jabatan
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {settings && (
                    <div className="space-y-2">
                      {getJabatanConfig().bersama.map((jabatan, index, arr) => (
                        <div
                          key={jabatan.key}
                          className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200"
                        >
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => moveJabatanUp(jabatan.key, 'SHARED')}
                              disabled={index === 0}
                            >
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => moveJabatanDown(jabatan.key, 'SHARED')}
                              disabled={index === arr.length - 1}
                            >
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                          </div>
                          <Badge className="bg-emerald-500 text-white">{jabatan.order}</Badge>
                          <div className="flex-1">
                            <p className="font-medium">{jabatan.label}</p>
                            <p className="text-xs text-muted-foreground">{jabatan.key}</p>
                          </div>
                          <Badge variant="outline" className="border-emerald-300 text-emerald-700">SHARED</Badge>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditJabatanDialog(jabatan)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteJabatanKey(jabatan.key)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Konfigurasi jabatan ini akan digunakan untuk Struktur Organisasi. 
                  Jabatan Per Blok akan tersedia untuk masing-masing blok (A dan B), 
                  sedangkan Jabatan Bersama akan ditampilkan sebagai pengurus yang melayani kedua blok.
                </p>
              </div>
              
              <Button onClick={handleSaveSettings} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Simpan Struktur Organisasi
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Dialog for Add/Edit Jabatan */}
      <Dialog open={isJabatanDialogOpen} onOpenChange={setIsJabatanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingJabatan ? 'Edit Jabatan' : 'Tambah Jabatan Baru'}
            </DialogTitle>
            <DialogDescription>
              {editingJabatan 
                ? 'Ubah label jabatan sesuai kebutuhan.' 
                : 'Tambahkan jabatan baru untuk struktur organisasi.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="label">Label Jabatan</Label>
              <Input
                id="label"
                value={jabatanForm.label}
                onChange={(e) => setJabatanForm(prev => ({ ...prev, label: e.target.value }))}
                placeholder="Contoh: Ketua RT, Sie. Keamanan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scope">Tipe Jabatan</Label>
              <Select
                value={jabatanForm.scope}
                onValueChange={(value: 'BLOK' | 'SHARED') => 
                  setJabatanForm(prev => ({ ...prev, scope: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe jabatan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BLOK">Per Blok (masing-masing blok punya)</SelectItem>
                  <SelectItem value="SHARED">Bersama (melayani kedua blok)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!editingJabatan && jabatanForm.label && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Key yang akan di-generate: <code className="font-mono bg-background px-1 rounded">{generateJabatanKey(jabatanForm.label)}</code>
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsJabatanDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveJabatan}>
              {editingJabatan ? 'Simpan Perubahan' : 'Tambah Jabatan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog for Delete Confirmation */}
      <AlertDialog open={!!deleteJabatanKey} onOpenChange={() => setDeleteJabatanKey(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Jabatan?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Jabatan ini akan dihapus dari konfigurasi struktur organisasi.
              Warga yang saat ini memiliki jabatan ini tidak akan terpengaruh, namun jabatan tidak akan tersedia untuk warga baru.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteJabatan} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Category Editor Component
function CategoryEditor({ 
  title, 
  categories, 
  onChange 
}: { 
  title: string; 
  categories: string[]; 
  onChange: (cats: string[]) => void;
}) {
  const [newCategory, setNewCategory] = useState('');

  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      onChange([...categories, newCategory.trim()]);
      setNewCategory('');
    }
  };

  const removeCategory = (index: number) => {
    onChange(categories.filter((_, i) => i !== index));
  };

  const updateCategory = (index: number, value: string) => {
    const newCategories = [...categories];
    newCategories[index] = value;
    onChange(newCategories);
  };

  return (
    <div className="space-y-3">
      <Label className="font-semibold">{title}</Label>
      <div className="space-y-2">
        {categories.map((cat, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              value={cat}
              onChange={(e) => updateCategory(index, e.target.value)}
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeCategory(index)}
              className="text-destructive hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="Kategori baru..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addCategory();
            }
          }}
        />
        <Button variant="outline" size="sm" onClick={addCategory}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
