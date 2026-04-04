'use client';

import { useState } from 'react';
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
  });
  
  // Password form
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await api.updateUser({
        nama: profileData.nama,
        telepon: profileData.telepon,
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
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.photoUrl || undefined} />
              <AvatarFallback className="bg-emerald-500 text-white text-xl">
                {user?.nama?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{user?.nama}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                {getRoleBadge(user?.role || 'WARGA')}
                {getStatusBadge(user?.status || 'ACTIVE')}
              </CardDescription>
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
              <div>
                <p className="text-xs text-muted-foreground">NIK</p>
                <p className="font-medium">{user?.nik}</p>
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

      {/* Update Profile Form */}
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
              />
            </div>
            
            <div className="space-y-2">
              <Label>Nomor Telepon</Label>
              <Input
                value={profileData.telepon}
                onChange={(e) => setProfileData({ ...profileData, telepon: e.target.value })}
              />
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

      {/* Change Password Form */}
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
              />
            </div>
            
            <div className="space-y-2">
              <Label>Password Baru</Label>
              <Input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Konfirmasi Password Baru</Label>
              <Input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              />
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
    </div>
  );
}
