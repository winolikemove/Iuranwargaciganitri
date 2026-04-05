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
} from 'lucide-react';
import type { AppSettings, Permissions } from '@/types';

export function SettingsPage() {
  const { user, permissions } = useAuth();
  
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Record<string, Permissions>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
              <TabsTrigger value="contact">
                <MessageSquare className="h-4 w-4 mr-2" />
                Kontak
              </TabsTrigger>
              <TabsTrigger value="categories">
                <Tags className="h-4 w-4 mr-2" />
                Kategori
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
                          value={settings.monthlyFee || 0}
                          onChange={(e) => updateSetting('monthlyFee', parseInt(e.target.value) || 0)}
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
                        {settings.logoUrl && (
                          <div className="p-4 bg-muted rounded-lg flex items-center justify-center">
                            <img 
                              src={settings.logoUrl} 
                              alt="Logo Preview" 
                              className="max-h-20 object-contain"
                            />
                          </div>
                        )}
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
                        {settings.bannerUrl && (
                          <div className="p-4 bg-muted rounded-lg">
                            <img 
                              src={settings.bannerUrl} 
                              alt="Banner Preview" 
                              className="w-full h-32 object-cover rounded"
                            />
                          </div>
                        )}
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

        {/* Payment Settings */}
        {permissions?.canManageSettings && (
          <TabsContent value="payment" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Pengaturan Pembayaran
                </CardTitle>
                <CardDescription>Konfigurasi metode pembayaran iuran</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {settings && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Iuran Bulanan (Rp)</Label>
                        <Input
                          type="number"
                          value={settings.monthlyFee || 0}
                          onChange={(e) => updateSetting('monthlyFee', parseInt(e.target.value) || 0)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Nominal iuran warga per bulan
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <Label className="text-base font-semibold">Informasi Bank</Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Nama Bank</Label>
                          <Input
                            value={settings.bankName || ''}
                            onChange={(e) => updateSetting('bankName', e.target.value)}
                            placeholder="Contoh: BCA, Mandiri, BRI"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Nomor Rekening</Label>
                          <Input
                            value={settings.bankAccount || ''}
                            onChange={(e) => updateSetting('bankAccount', e.target.value)}
                            placeholder="1234567890"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Nama Pemilik Rekening</Label>
                          <Input
                            value={settings.bankHolder || ''}
                            onChange={(e) => updateSetting('bankHolder', e.target.value)}
                            placeholder="Nama lengkap"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">
                        Informasi pembayaran akan ditampilkan saat warga melakukan pembayaran iuran.
                      </p>
                      {settings.bankName && (
                        <div className="bg-background p-3 rounded border">
                          <p className="font-medium">{settings.bankName}</p>
                          <p className="text-lg font-bold">{settings.bankAccount}</p>
                          <p className="text-sm text-muted-foreground">a.n. {settings.bankHolder}</p>
                        </div>
                      )}
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
                      <div className="space-y-2">
                        <Label>Nomor WhatsApp Admin</Label>
                        <Input
                          value={settings.whatsappAdmin || ''}
                          onChange={(e) => updateSetting('whatsappAdmin', e.target.value)}
                          placeholder="08123456789"
                        />
                        <p className="text-xs text-muted-foreground">
                          Nomor yang akan ditampilkan untuk kontak admin
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
                        </CardTitle>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleSavePermissions(role, rolePermissions[role])}
                        disabled={isSubmitting}
                      >
                        Simpan
                      </Button>
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
                          />
                          <Label htmlFor={`${role}-${perm}`} className="text-sm">
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

        {/* Categories Tab */}
        {permissions?.canManageSettings && (
          <TabsContent value="categories" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Kategori Pemasukan</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={settings?.incomeCategories?.join('\n') || ''}
                    onChange={(e) => updateSetting('incomeCategories', e.target.value.split('\n').filter(Boolean))}
                    placeholder="Satu kategori per baris"
                    rows={5}
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Kategori Pengeluaran</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={settings?.expenseCategories?.join('\n') || ''}
                    onChange={(e) => updateSetting('expenseCategories', e.target.value.split('\n').filter(Boolean))}
                    placeholder="Satu kategori per baris"
                    rows={5}
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Kategori Informasi</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={settings?.informationCategories?.join('\n') || ''}
                    onChange={(e) => updateSetting('informationCategories', e.target.value.split('\n').filter(Boolean))}
                    placeholder="Satu kategori per baris"
                    rows={5}
                  />
                </CardContent>
              </Card>
            </div>
            
            <Button onClick={handleSaveSettings} disabled={isSubmitting} className="mt-4">
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
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

// Separator component
function Separator() {
  return <div className="border-t my-4" />;
}
