'use client';

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useApp } from '@/context/app-context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { LoginRequest, RegisterRequest } from '@/types';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'login' | 'register';
  onModeChange: (mode: 'login' | 'register') => void;
}

export function AuthModal({ open, onOpenChange, mode, onModeChange }: AuthModalProps) {
  const { login, register } = useAuth();
  const { settings } = useApp();
  
  // Login state
  const [loginData, setLoginData] = useState<LoginRequest>({
    email: '',
    password: '',
  });
  
  // Register state
  const [registerData, setRegisterData] = useState<RegisterRequest>({
    nama: '',
    email: '',
    password: '',
    confirmPassword: '',
    nik: '',
    telepon: '',
    blok: '',
    nomorRumah: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      const result = await login(loginData);
      
      if (result.ok) {
        onOpenChange(false);
        setLoginData({ email: '', password: '' });
      } else {
        setError(result.error || 'Login gagal');
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setSuccess(null);
    
    // Client-side validation
    const errors: Record<string, string> = {};
    
    if (!registerData.nama || registerData.nama.length < 3) {
      errors.nama = 'Nama minimal 3 karakter';
    }
    
    if (!registerData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerData.email)) {
      errors.email = 'Format email tidak valid';
    }
    
    if (!registerData.password || registerData.password.length < 6) {
      errors.password = 'Password minimal 6 karakter';
    }
    
    if (registerData.password !== registerData.confirmPassword) {
      errors.confirmPassword = 'Password tidak cocok';
    }
    
    if (!registerData.nik || registerData.nik.length !== 16 || !/^\d+$/.test(registerData.nik)) {
      errors.nik = 'NIK harus 16 digit angka';
    }
    
    if (!registerData.telepon || registerData.telepon.length < 10) {
      errors.telepon = 'Telepon minimal 10 digit';
    }
    
    if (!registerData.blok) {
      errors.blok = 'Pilih blok';
    }
    
    if (!registerData.nomorRumah) {
      errors.nomorRumah = 'Nomor rumah wajib diisi';
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { confirmPassword, ...dataToSend } = registerData;
      const result = await register(dataToSend);
      
      if (result.ok) {
        setSuccess(result.data?.message || 'Registrasi berhasil. Menunggu persetujuan admin.');
        setRegisterData({
          nama: '',
          email: '',
          password: '',
          confirmPassword: '',
          nik: '',
          telepon: '',
          blok: '',
          nomorRumah: '',
        });
        // Switch to login tab after 2 seconds
        setTimeout(() => {
          onModeChange('login');
          setSuccess(null);
        }, 2000);
      } else {
        if (result.errors) {
          setFieldErrors(result.errors);
        } else {
          setError(result.error || 'Registrasi gagal');
        }
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    onModeChange(value as 'login' | 'register');
    setError(null);
    setFieldErrors({});
    setSuccess(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'login' ? 'Masuk' : 'Daftar Akun'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'login' 
              ? 'Masuk ke akun Anda untuk mengakses dashboard'
              : 'Daftar sebagai warga baru'}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={mode} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Masuk</TabsTrigger>
            <TabsTrigger value="register" disabled={!settings?.enableRegistration}>
              Daftar
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="mt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="email@example.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Masuk'
                )}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="register" className="mt-4">
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert className="border-green-500 bg-green-50 text-green-800">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="register-nama">Nama Lengkap</Label>
                <Input
                  id="register-nama"
                  type="text"
                  placeholder="Nama lengkap Anda"
                  value={registerData.nama}
                  onChange={(e) => setRegisterData({ ...registerData, nama: e.target.value })}
                />
                {fieldErrors.nama && (
                  <p className="text-xs text-destructive">{fieldErrors.nama}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="email@example.com"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  />
                  {fieldErrors.email && (
                    <p className="text-xs text-destructive">{fieldErrors.email}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-telepon">No. Telepon</Label>
                  <Input
                    id="register-telepon"
                    type="tel"
                    placeholder="08xxxxxxxxxx"
                    value={registerData.telepon}
                    onChange={(e) => setRegisterData({ ...registerData, telepon: e.target.value })}
                  />
                  {fieldErrors.telepon && (
                    <p className="text-xs text-destructive">{fieldErrors.telepon}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="register-nik">NIK (16 digit)</Label>
                <Input
                  id="register-nik"
                  type="text"
                  placeholder="3515xxxxxxxxxxxx"
                  maxLength={16}
                  value={registerData.nik}
                  onChange={(e) => setRegisterData({ ...registerData, nik: e.target.value.replace(/\D/g, '') })}
                />
                {fieldErrors.nik && (
                  <p className="text-xs text-destructive">{fieldErrors.nik}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="register-blok">Blok</Label>
                  <Select
                    value={registerData.blok}
                    onValueChange={(value) => setRegisterData({ ...registerData, blok: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih blok" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Blok A</SelectItem>
                      <SelectItem value="B">Blok B</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldErrors.blok && (
                    <p className="text-xs text-destructive">{fieldErrors.blok}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-nomorRumah">No. Rumah</Label>
                  <Input
                    id="register-nomorRumah"
                    type="text"
                    placeholder="Contoh: 12"
                    value={registerData.nomorRumah}
                    onChange={(e) => setRegisterData({ ...registerData, nomorRumah: e.target.value })}
                  />
                  {fieldErrors.nomorRumah && (
                    <p className="text-xs text-destructive">{fieldErrors.nomorRumah}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="Min. 6 karakter"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  />
                  {fieldErrors.password && (
                    <p className="text-xs text-destructive">{fieldErrors.password}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-confirmPassword">Ulangi Password</Label>
                  <Input
                    id="register-confirmPassword"
                    type="password"
                    placeholder="Ulangi password"
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                  />
                  {fieldErrors.confirmPassword && (
                    <p className="text-xs text-destructive">{fieldErrors.confirmPassword}</p>
                  )}
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Daftar'
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
