'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AvatarUpload } from '@/components/ui/file-upload';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Loader2,
  AlertCircle,
  CheckCircle,
  Save,
  Camera,
  Shield,
} from 'lucide-react';

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Profile form
  const [profileData, setProfileData] = useState({
    nama: user?.nama || '',
    telepon: user?.telepon || '',
    nik: user?.nik || '',
  });
  
  // Photo state
  const [photoUrl, setPhotoUrl] = useState<string | null>(user?.photoUrl || null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  
  // Password form
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Update local state when user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        nama: user.nama || '',
        telepon: user.telepon || '',
        nik: user.nik || '',
      });
      setPhotoUrl(user.photoUrl || null);
    }
  }, [user]);

  const handlePhotoUpload = async (file: File): Promise<{ ok: boolean; url?: string; error?: string }> => {
    setIsUploadingPhoto(true);
    setError(null);
    
    try {
      // Profile photos go to 'profile_photos' folder
      const result = await api.uploadFile(file, 'profile_photos');
      
      if (result.ok && result.data?.url) {
        // Update user photo URL
        const updateResult = await api.updateUser({ photoUrl: result.data.url });
        
        if (updateResult.ok) {
          setPhotoUrl(result.data.url);
          refreshUser();
          setSuccess('Foto profil berhasil diperbarui');
          setTimeout(() => setSuccess(null), 3000);
          return { ok: true, url: result.data.url };
        } else {
          return { ok: false, error: updateResult.error || 'Gagal menyimpan foto' };
        }
      }
      
      return { ok: false, error: result.error || 'Gagal mengupload foto' };
    } catch (err) {
      return { ok: false, error: 'Terjadi kesalahan saat upload' };
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await api.updateUser({
        nama: profileData.nama,
        telepon: profileData.telepon,
        nik: profileData.nik || undefined, // Only send if provided
      });
      
      if (result.ok) {
        setSuccess('Profil berhasil diperbarui');
        refreshUser();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Gagal memperbarui profil');
      }
    } catch (err) {
      setError('Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Password baru tidak cocok');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setError('Password baru minimal 6 karakter');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await api.changePassword(passwordData.oldPassword, passwordData.newPassword);
      
      if (result.ok) {
        setSuccess('Password berhasil diubah');
        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Gagal mengubah password');
      }
    } catch (err) {
      setError('Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPERADMIN':
        return <Badge className="bg-purple-500">Super Admin</Badge>;
      case 'ADMIN':
        return <Badge className="bg-blue-500">Admin</Badge>;
      case 'BENDAHARA':
        return <Badge className="bg-amber-500">Bendahara</Badge>;
      default:
        return <Badge variant="outline">Warga</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-500">Aktif</Badge>;
      case 'PENDING':
        return <Badge variant="secondary">Pending</Badge>;
      case 'BLOCKED':
        return <Badge variant="destructive">Diblokir</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold">Profil Saya</h2>
        <p className="text-muted-foreground">Kelola informasi akun Anda</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-500 text-green-800">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Profile Info Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative">
              {isUploadingPhoto ? (
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <AvatarUpload
                  onUpload={handlePhotoUpload}
                  value={photoUrl}
                  onValueChange={setPhotoUrl}
                  maxSizeMB={2}
                />
              )}
              {!isUploadingPhoto && (
                <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 cursor-pointer">
                  <Camera className="h-3 w-3" />
                </div>
              )}
            </div>
            <div className="text-center sm:text-left">
              <CardTitle>{user?.nama}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1 justify-center sm:justify-start">
                {getRoleBadge(user?.role || 'WARGA')}
                {getStatusBadge(user?.status || 'ACTIVE')}
              </CardDescription>
              <p className="text-sm text-muted-foreground mt-1">
                Klik foto untuk mengubah
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <User className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">NIK</p>
                <p className="font-medium">{user?.nik || <span className="text-muted-foreground italic">Belum diisi</span>}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Telepon</p>
                <p className="font-medium">{user?.telepon}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Alamat</p>
                <p className="font-medium">Blok {user?.blok} - No. {user?.nomorRumah}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Edit Profile and Change Password */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Edit Profil
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Keamanan
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Edit Profil
              </CardTitle>
              <CardDescription>Perbarui informasi profil Anda</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nama Lengkap</Label>
                  <Input
                    value={profileData.nama}
                    onChange={(e) => setProfileData({ ...profileData, nama: e.target.value })}
                    placeholder="Masukkan nama lengkap"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label>NIK (Opsional)</Label>
                    <span className="text-xs text-muted-foreground">- 16 digit angka</span>
                  </div>
                  <Input
                    value={profileData.nik}
                    onChange={(e) => setProfileData({ ...profileData, nik: e.target.value.replace(/\D/g, '').slice(0, 16) })}
                    placeholder="Masukkan NIK 16 digit (boleh kosong)"
                    maxLength={16}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Nomor Telepon</Label>
                  <Input
                    value={profileData.telepon}
                    onChange={(e) => setProfileData({ ...profileData, telepon: e.target.value })}
                    placeholder="Masukkan nomor telepon"
                  />
                </div>
                
                <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  <p className="font-medium mb-1">Informasi:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Nama minimal 3 karakter</li>
                    <li>NIK bersifat opsional, jika diisi harus 16 digit angka</li>
                    <li>Nomor telepon minimal 10 digit</li>
                    <li>Email tidak dapat diubah</li>
                  </ul>
                </div>
                
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Simpan Perubahan
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Ubah Password
              </CardTitle>
              <CardDescription>Perbarui password akun Anda</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label>Password Lama</Label>
                  <Input
                    type="password"
                    value={passwordData.oldPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                    placeholder="Masukkan password lama"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Password Baru</Label>
                  <Input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="Masukkan password baru"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Konfirmasi Password Baru</Label>
                  <Input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="Konfirmasi password baru"
                  />
                </div>
                
                <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  <p className="font-medium mb-1">Tips Keamanan:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Password minimal 6 karakter</li>
                    <li>Gunakan kombinasi huruf besar, kecil, angka, dan simbol</li>
                    <li>Hindari menggunakan tanggal lahir atau nama</li>
                  </ul>
                </div>
                
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Ubah Password'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
