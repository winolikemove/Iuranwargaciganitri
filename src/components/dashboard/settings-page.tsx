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
} from 'lucide-react';
import type { AppSettings, Permissions, BankInfo, BlokCategories, SafeUser } from '@/types';

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
      const result = await api.uploadFile(file);
      
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
                    <div className="space-y-4">
                      {/* Dynamic Admin Contacts */}
                      <div className="space-y-2">
                        <Label>Kontak Admin Pengurus</Label>
                        <p className="text-xs text-muted-foreground mb-2">
                          Daftar kontak admin yang terdaftar di sistem
                        </p>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {adminUsers.length > 0 ? (
                            adminUsers.map((admin) => (
                              <div key={admin.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                                <div>
                                  <p className="font-medium">{admin.nama}</p>
                                  <p className="text-xs text-muted-foreground">{admin.role} - Blok {admin.blok}</p>
                                </div>
                                <a 
                                  href={`https://wa.me/${admin.telepon.replace(/^0/, '62')}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                >
                                  <Button size="sm" variant="outline">
                                    <Phone className="h-4 w-4 mr-2" />
                                    {admin.telepon}
                                  </Button>
                                </a>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">Belum ada admin terdaftar</p>
                          )}
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <Label>Nomor WhatsApp Admin Utama</Label>
                        <Input
                          value={settings.whatsappAdmin || ''}
                          onChange={(e) => updateSetting('whatsappAdmin', e.target.value)}
                          placeholder="08123456789"
                        />
                        <p className="text-xs text-muted-foreground">
                          Nomor utama yang akan ditampilkan di landing page
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
      </Tabs>
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

// Separator component
function Separator() {
  return <div className="border-t my-4" />;
}
