'use client';

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useApp } from '@/context/app-context';
import { api } from '@/lib/api-client';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  Home,
  Key,
  HelpCircle,
  Shield,
  FileText,
  Loader2,
  CheckCircle2,
  X,
  ArrowLeft,
} from 'lucide-react';
import type { LoginRequest, RegisterRequest } from '@/types';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'login' | 'register' | 'forgot-password';
  onModeChange: (mode: 'login' | 'register' | 'forgot-password') => void;
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

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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

    // NIK is optional - only validate if provided
    if (registerData.nik && registerData.nik.length > 0) {
      if (registerData.nik.length !== 16 || !/^\d+$/.test(registerData.nik)) {
        errors.nik = 'NIK harus 16 digit angka';
      }
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate email
    if (!forgotEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      setError('Masukkan alamat email yang valid');
      return;
    }

    setIsLoading(true);

    try {
      const result = await api.forgotPassword(forgotEmail);

      if (result.ok) {
        setSuccess(result.data?.message || 'Link reset password telah dikirim ke email Anda.');
        setForgotEmail('');
      } else {
        setError(result.error || 'Gagal mengirim link reset password');
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (newMode: 'login' | 'register') => {
    onModeChange(newMode);
    setError(null);
    setFieldErrors({});
    setSuccess(null);
  };

  const handleBackToLogin = () => {
    onModeChange('login');
    setError(null);
    setSuccess(null);
    setForgotEmail('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-transparent border-0 shadow-none">
        <div className="w-full grid md:grid-cols-12 bg-[#f0fdf4]/70 backdrop-blur-xl rounded-xl shadow-[0px_24px_48px_rgba(19,30,25,0.06)] overflow-hidden">
          {/* Left Branding Column (Hidden on mobile) */}
          <div className="hidden md:flex md:col-span-5 flex-col justify-between p-8 bg-gradient-to-br from-[#003527] to-[#064e3b] text-white">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <img
                  src={settings?.logoUrl || '/logo.jpg'}
                  alt="Logo"
                  className="w-10 h-10 object-contain rounded-lg bg-white/10 p-1"
                />
                <h1 className="text-xl font-bold tracking-tight">
                  {settings?.siteName || 'Pradha Ciganitri'}
                </h1>
              </div>
              <div className="pt-8">
                <h2 className="text-3xl font-extrabold leading-tight mb-4">
                  The Digital Sanctuary
                </h2>
                <p className="text-emerald-100 text-base leading-relaxed opacity-90">
                  Selamat datang di portal warga modern Anda. Kelola rumah, komunitas, dan layanan dalam satu tempat yang nyaman.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs opacity-60">
              <span>© {new Date().getFullYear()} {settings?.siteName || 'Pradha Ciganitri'}</span>
              <span className="w-1 h-1 rounded-full bg-white"></span>
              <span>Portal Warga Terverifikasi</span>
            </div>
          </div>

          {/* Right Form Column */}
          <div className="col-span-12 md:col-span-7 bg-white p-6 md:p-8 lg:p-10 overflow-y-auto max-h-[90vh] md:max-h-[600px] relative">
            {/* Close Button */}
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>

            {/* Tab Switcher - Only show for login/register */}
            {mode !== 'forgot-password' && (
              <div className="flex bg-[#eaf7ee] p-1.5 rounded-full mb-8 w-fit mx-auto md:mx-0">
                <button
                  onClick={() => handleTabChange('login')}
                  className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                    mode === 'login'
                      ? 'bg-white text-[#003527] shadow-sm'
                      : 'text-[#404944] hover:text-[#003527]'
                  }`}
                >
                  Masuk
                </button>
                <button
                  onClick={() => handleTabChange('register')}
                  disabled={!settings?.enableRegistration}
                  className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                    mode === 'register'
                      ? 'bg-white text-[#003527] shadow-sm'
                      : 'text-[#404944] hover:text-[#003527] disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  Daftar
                </button>
              </div>
            )}

            {/* Login Section */}
            {mode === 'login' && (
              <section className="space-y-6">
                <header>
                  <h3 className="text-2xl font-bold text-[#003527] mb-2">Selamat Datang</h3>
                  <p className="text-[#404944]">Silakan masuk untuk mengakses dasbor warga Anda.</p>
                </header>

                {error && (
                  <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#131e19]">Alamat Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#003527] transition-colors" />
                      <Input
                        type="email"
                        placeholder="nama@email.com"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-[#deebe3] border-none rounded-xl focus:ring-2 focus:ring-[#003527]/20 text-[#131e19]"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#131e19]">Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#003527] transition-colors" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        className="w-full pl-12 pr-12 py-3 bg-[#deebe3] border-none rounded-xl focus:ring-2 focus:ring-[#003527]/20 text-[#131e19]"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#003527]"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <Checkbox
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                        className="border-gray-300 data-[state=checked]:bg-[#003527] data-[state=checked]:border-[#003527]"
                      />
                      <span className="text-sm text-[#404944] group-hover:text-[#003527]">Ingat saya</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => onModeChange('forgot-password')}
                      className="text-sm font-semibold text-[#003527] hover:underline"
                    >
                      Lupa password?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 rounded-xl bg-gradient-to-br from-[#003527] to-[#064e3b] text-white font-semibold hover:opacity-90 transition-all shadow-lg shadow-[#003527]/20"
                  >
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
              </section>
            )}

            {/* Forgot Password Section */}
            {mode === 'forgot-password' && (
              <section className="space-y-6">
                <header>
                  <h3 className="text-2xl font-bold text-[#003527] mb-2">Pulihkan Akses</h3>
                  <p className="text-[#404944]">
                    Masukkan alamat email yang terdaftar. Kami akan mengirimkan link aman untuk mereset password Anda.
                  </p>
                </header>

                {error && (
                  <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 rounded-lg text-sm flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Berhasil!</p>
                      <p className="text-xs opacity-80">{success}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleForgotPassword} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#131e19]">Alamat Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#003527] transition-colors" />
                      <Input
                        type="email"
                        placeholder="warga@email.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-[#deebe3] border-none rounded-xl focus:ring-2 focus:ring-[#003527]/20 text-[#131e19]"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 rounded-full bg-gradient-to-br from-[#003527] to-[#064e3b] text-white font-semibold hover:opacity-90 transition-all shadow-lg shadow-[#003527]/20"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      'Kirim Link Reset'
                    )}
                  </Button>
                </form>

                {/* Back to Login */}
                <div className="flex flex-col items-center gap-4 pt-4">
                  <button
                    onClick={handleBackToLogin}
                    className="group flex items-center gap-2 text-[#003527] font-semibold hover:text-[#064e3b] transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
                    <span>Kembali ke Login</span>
                  </button>
                </div>

                {/* Help Link */}
                <div className="mt-6 flex justify-center">
                  <div className="bg-[#deebe3]/80 px-6 py-3 rounded-full flex items-center gap-3 text-sm">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                      <HelpCircle className="h-4 w-4 text-emerald-700" />
                    </div>
                    <p className="text-[#404944]">
                      Butuh bantuan?{' '}
                      <span className="underline underline-offset-2 decoration-[#003527]/30 text-[#003527] cursor-pointer hover:text-[#064e3b]">
                        Hubungi Admin
                      </span>
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Registration Section */}
            {mode === 'register' && (
              <section className="space-y-6">
                <header>
                  <h3 className="text-2xl font-bold text-[#003527] mb-2">Pendaftaran Warga</h3>
                  <p className="text-[#404944]">Lengkapi data diri Anda untuk bergabung dalam komunitas.</p>
                </header>

                {error && (
                  <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 rounded-lg text-sm flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="font-semibold">Berhasil!</p>
                      <p className="text-xs opacity-80">{success}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  {/* Name & Email Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#404944]">Nama Lengkap</label>
                      <div className="relative group">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-[#003527]" />
                        <Input
                          type="text"
                          placeholder="John Doe"
                          value={registerData.nama}
                          onChange={(e) => setRegisterData({ ...registerData, nama: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 bg-[#deebe3] border-none rounded-xl focus:ring-2 focus:ring-[#003527]/20"
                        />
                      </div>
                      {fieldErrors.nama && (
                        <p className="text-xs text-red-500">{fieldErrors.nama}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#404944]">Email</label>
                      <div className="relative group">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-[#003527]" />
                        <Input
                          type="email"
                          placeholder="john@email.com"
                          value={registerData.email}
                          onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 bg-[#deebe3] border-none rounded-xl focus:ring-2 focus:ring-[#003527]/20"
                        />
                      </div>
                      {fieldErrors.email && (
                        <p className="text-xs text-red-500">{fieldErrors.email}</p>
                      )}
                    </div>
                  </div>

                  {/* Phone & NIK Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#404944]">No. Telepon</label>
                      <div className="relative group">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-[#003527]" />
                        <Input
                          type="tel"
                          placeholder="0812..."
                          value={registerData.telepon}
                          onChange={(e) => setRegisterData({ ...registerData, telepon: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 bg-[#deebe3] border-none rounded-xl focus:ring-2 focus:ring-[#003527]/20"
                        />
                      </div>
                      {fieldErrors.telepon && (
                        <p className="text-xs text-red-500">{fieldErrors.telepon}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#404944]">NIK <span className="normal-case font-normal">(Opsional)</span></label>
                      <Input
                        type="text"
                        placeholder="320..."
                        maxLength={16}
                        value={registerData.nik}
                        onChange={(e) => setRegisterData({ ...registerData, nik: e.target.value.replace(/\D/g, '') })}
                        className="w-full px-4 py-3 bg-[#deebe3] border-none rounded-xl focus:ring-2 focus:ring-[#003527]/20"
                      />
                      {fieldErrors.nik && (
                        <p className="text-xs text-red-500">{fieldErrors.nik}</p>
                      )}
                    </div>
                  </div>

                  {/* Block & House No Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#404944]">Blok</label>
                      <Select
                        value={registerData.blok}
                        onValueChange={(value) => setRegisterData({ ...registerData, blok: value })}
                      >
                        <SelectTrigger className="w-full px-4 py-3 bg-[#deebe3] border-none rounded-xl focus:ring-2 focus:ring-[#003527]/20">
                          <SelectValue placeholder="Pilih Blok" />
                        </SelectTrigger>
                        <SelectContent>
                          {settings?.bloks?.map((blok) => (
                            <SelectItem key={blok} value={blok}>Blok {blok}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldErrors.blok && (
                        <p className="text-xs text-red-500">{fieldErrors.blok}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#404944]">No. Rumah</label>
                      <div className="relative group">
                        <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-[#003527]" />
                        <Input
                          type="text"
                          placeholder="12"
                          value={registerData.nomorRumah}
                          onChange={(e) => setRegisterData({ ...registerData, nomorRumah: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 bg-[#deebe3] border-none rounded-xl focus:ring-2 focus:ring-[#003527]/20"
                        />
                      </div>
                      {fieldErrors.nomorRumah && (
                        <p className="text-xs text-red-500">{fieldErrors.nomorRumah}</p>
                      )}
                    </div>
                  </div>

                  {/* Passwords Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#404944]">Password</label>
                      <div className="relative group">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-[#003527]" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={registerData.password}
                          onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                          className="w-full pl-10 pr-10 py-3 bg-[#deebe3] border-none rounded-xl focus:ring-2 focus:ring-[#003527]/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#003527]"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {fieldErrors.password && (
                        <p className="text-xs text-red-500">{fieldErrors.password}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#404944]">Konfirmasi Password</label>
                      <div className="relative group">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-[#003527]" />
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={registerData.confirmPassword}
                          onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                          className="w-full pl-10 pr-10 py-3 bg-[#deebe3] border-none rounded-xl focus:ring-2 focus:ring-[#003527]/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#003527]"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {fieldErrors.confirmPassword && (
                        <p className="text-xs text-red-500">{fieldErrors.confirmPassword}</p>
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 rounded-xl bg-gradient-to-br from-[#003527] to-[#064e3b] text-white font-semibold hover:opacity-90 transition-all shadow-lg shadow-[#003527]/20 mt-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      'Daftar Sekarang'
                    )}
                  </Button>
                </form>
              </section>
            )}

            {/* Support Links */}
            {mode !== 'forgot-password' && (
              <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-[#404944]">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  <span>Butuh bantuan akses?</span>
                </div>
                <div className="flex gap-6">
                  <span className="flex items-center gap-1 hover:text-[#003527] transition-colors cursor-pointer">
                    <Shield className="h-4 w-4" />
                    Kebijakan Privasi
                  </span>
                  <span className="flex items-center gap-1 hover:text-[#003527] transition-colors cursor-pointer">
                    <FileText className="h-4 w-4" />
                    Ketentuan Layanan
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
