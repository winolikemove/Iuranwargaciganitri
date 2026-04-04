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
import {
  Settings,
  Loader2,
  AlertCircle,
  Save,
  Shield,
  Tags,
  CheckCircle,
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
    
    try {
      const result = await api.updateSettings(settings || {});
      if (result.ok) {
        setSuccess('Pengaturan berhasil disimpan');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSavePermissions = async (role: string, perms: Permissions) => {
    setIsSubmitting(true);
    setSuccess(null);
    
    try {
      const result = await api.updatePermissions(role, perms);
      if (result.ok) {
        setSuccess('Permission berhasil disimpan');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Failed to save permissions:', err);
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {permissions?.canManageSettings && (
            <TabsTrigger value="general">
              <Settings className="h-4 w-4 mr-2" />
              Umum
            </TabsTrigger>
          )}
          {permissions?.canManageRoles && (
            <TabsTrigger value="permissions">
              <Shield className="h-4 w-4 mr-2" />
              Permissions
            </TabsTrigger>
          )}
          {permissions?.canManageSettings && (
            <TabsTrigger value="categories">
              <Tags className="h-4 w-4 mr-2" />
              Kategori
            </TabsTrigger>
          )}
        </TabsList>

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
                          value={settings.siteName}
                          onChange={(e) => updateSetting('siteName', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Iuran Bulanan</Label>
                        <Input
                          type="number"
                          value={settings.monthlyFee}
                          onChange={(e) => updateSetting('monthlyFee', parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Deskripsi Situs</Label>
                      <Textarea
                        value={settings.siteDescription}
                        onChange={(e) => updateSetting('siteDescription', e.target.value)}
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
