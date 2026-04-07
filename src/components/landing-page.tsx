'use client';

import { useState } from 'react';
import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Calendar,
  Users,
  Star,
  ArrowRight,
  MapPin,
  Phone,
  Clock,
  TrendingUp,
  TrendingDown,
  LogIn,
  UserPlus,
  Info,
  Globe,
  Mail,
  Trophy,
  Landmark,
  MessageCircle,
  X,
  Camera,
  User,
  CalendarDays,
  Building2,
  Shield,
  Sparkles,
  Home,
} from 'lucide-react';
import type { Gallery, Agenda, PengurusWithJabatan, StrukturBlok } from '@/types';

interface LandingPageProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
}

export function LandingPage({ onLoginClick, onRegisterClick }: LandingPageProps) {
  const {
    settings,
    finance,
    agendas,
    galleries,
    reviews,
    pengurus,
    strukturOrganisasi,
  } = useApp();

  const [selectedImage, setSelectedImage] = useState<Gallery | null>(null);
  const [selectedAgenda, setSelectedAgenda] = useState<Agenda | null>(null);
  const [selectedBlok, setSelectedBlok] = useState<{ key: string; label: string; data: StrukturBlok } | null>(null);

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
      });
    } catch {
      return dateStr;
    }
  };

  const formatFullDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getRoleBadge = (role: string) => {
    const roleMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      SUPERADMIN: { label: 'Super Admin', variant: 'default' },
      ADMIN: { label: 'Admin', variant: 'secondary' },
      BENDAHARA: { label: 'Bendahara', variant: 'outline' },
    };
    return roleMap[role] || { label: role, variant: 'outline' };
  };

  const getWhatsAppLink = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const waNumber = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
    return `https://wa.me/${waNumber}`;
  };

  // Calculate active residents count from struktur organisasi
  const allPengurus = [
    ...(strukturOrganisasi?.blokA?.pengurus || []),
    ...(strukturOrganisasi?.blokB?.pengurus || []),
    ...(strukturOrganisasi?.bersama?.pengurus || [])
  ];
  const activeResidents = allPengurus.length || 11;
  const totalUnits = 98; // Placeholder - total unit di komplek

  // Scroll to section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#f0fdf4] text-[#131e19] selection:bg-[#064e3b] selection:text-white">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-emerald-50/70 dark:bg-emerald-950/70 backdrop-blur-xl border-b border-emerald-200/30">
        <div className="flex justify-between items-center px-6 md:px-12 h-16 w-full max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-3">
            <img
              src={settings?.logoUrl || '/logo.jpg'}
              alt="Logo"
              className="w-8 h-8 object-contain rounded-lg"
            />
            <div className="text-lg font-bold tracking-tight text-emerald-900">
              {settings?.siteName || 'Pradha Ciganitri'}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm tracking-tight">
            <button onClick={() => scrollToSection('warga')} className="text-emerald-800/70 hover:text-emerald-950 transition-colors">Warga</button>
            <button onClick={() => scrollToSection('fasilitas')} className="text-emerald-800/70 hover:text-emerald-950 transition-colors">Fasilitas</button>
            <button onClick={() => scrollToSection('keuangan')} className="text-emerald-950 font-semibold border-b-2 border-emerald-900 pb-1">Keuangan</button>
            <button onClick={() => scrollToSection('komunitas')} className="text-emerald-800/70 hover:text-emerald-950 transition-colors">Komunitas</button>
          </div>
          <div className="flex items-center gap-3">
            {settings?.enableRegistration && (
              <Button
                variant="ghost"
                onClick={onRegisterClick}
                className="hidden sm:flex hover:bg-emerald-100/50 rounded-full text-sm"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Daftar
              </Button>
            )}
            <Button
              onClick={onLoginClick}
              className="bg-[#003527] text-white px-5 py-2 rounded-full font-semibold text-sm hover:bg-[#064e3b] transition-colors"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Masuk
            </Button>
          </div>
        </div>
      </nav>

      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative min-h-[500px] md:min-h-[600px] flex items-center px-6 md:px-12 py-16 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              alt="Banner"
              className="w-full h-full object-cover opacity-20"
              src={settings?.bannerUrl || '/banner.jpg'}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#f0fdf4]/0 via-[#f0fdf4]/40 to-[#f0fdf4]"></div>
          </div>
          <div className="relative z-10 w-full max-w-screen-2xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#131e19]">
                Pradha Ciganitri<br />
                <span className="text-[#003527]">Harmoni & Sejahtera Bersama.</span>
              </h1>
              <p className="text-base md:text-lg text-[#404944] max-w-lg leading-relaxed">
                Komplek yang penuh kebersamaan, di mana setiap warga saling mendukung menuju kesejahteraan. Kelola kehidupan warga dengan kemudahan digital untuk kemajuan bersama.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={onLoginClick}
                  className="bg-gradient-to-br from-[#003527] to-[#064e3b] text-white px-6 py-3 rounded-xl font-semibold shadow-xl hover:opacity-90 transition-opacity"
                >
                  Bergabung Sekarang
                </Button>
                <Button
                  variant="outline"
                  onClick={() => scrollToSection('keuangan')}
                  className="bg-[#deebe3] px-6 py-3 rounded-xl font-semibold text-[#003527] hover:bg-[#d9e6dd] transition-colors border-0"
                >
                  Pelajari Lebih Lanjut
                </Button>
              </div>
            </div>

            {/* Community Hub Card */}
            <div className="relative">
              <div className="bg-white/70 backdrop-blur-xl rounded-xl p-6 border border-white/20 shadow-[0px_24px_48px_rgba(19,30,25,0.06)] relative z-20">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold">Pusat Komunitas</h3>
                  <span className="px-3 py-1 bg-[#003527]/10 text-[#003527] text-xs font-bold rounded-full flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    DATA AKTIF
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[#404944] text-xs">Warga Aktif</p>
                    <p className="text-xl font-bold text-[#003527]">{activeResidents.toLocaleString('id-ID')}+</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[#404944] text-xs">Total Unit</p>
                    <p className="text-xl font-bold text-[#003527]">{totalUnits.toLocaleString('id-ID')}+</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[#404944] text-xs">Fasilitas Tersedia</p>
                    <p className="text-xl font-bold text-[#003527]">12</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[#404944] text-xs">Skor Keamanan</p>
                    <p className="text-xl font-bold text-[#003527]">9.8</p>
                  </div>
                </div>
                {pengurus.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-emerald-900/10">
                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-3">
                        {pengurus.slice(0, 3).map((p) => (
                          <Avatar key={p.id} className="w-8 h-8 border-2 border-white">
                            <AvatarImage src={p.photoUrl || undefined} alt={p.nama} />
                            <AvatarFallback className="bg-emerald-500 text-white text-xs">
                              {p.nama.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <p className="text-sm text-[#404944] font-medium">
                        {pengurus.length} pengurus aktif
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {/* Decorative Elements */}
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[#b5ede7]/40 rounded-full blur-3xl -z-10"></div>
              <div className="absolute -top-10 -left-10 w-48 h-48 bg-[#064e3b]/10 rounded-full blur-3xl -z-10"></div>
            </div>
          </div>
        </section>

        {/* Finance Preview */}
        {settings?.enablePublicFinance && finance && (
          <section id="keuangan" className="py-16 px-6 md:px-12 bg-[#eaf7ee]">
            <div className="max-w-screen-2xl mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
                <div className="space-y-3">
                  <span className="text-[#003527] font-bold tracking-widest text-xs uppercase">Transparansi Keuangan</span>
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Keuangan Lingkungan</h2>
                </div>
                <Button
                  variant="ghost"
                  onClick={onLoginClick}
                  className="text-[#003527] font-semibold flex items-center gap-2 hover:underline"
                >
                  Lihat Laporan Lengkap <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Balance Card */}
                <div className="lg:col-span-1 bg-[#003527] text-white p-6 rounded-xl flex flex-col justify-between shadow-[0px_24px_48px_rgba(19,30,25,0.06)]">
                  <div className="space-y-2">
                    <p className="text-emerald-100/70 font-medium text-sm">Total Saldo Komunitas</p>
                    <h3 className="text-2xl font-bold">{formatCurrency(finance.saldoAkhir)}</h3>
                  </div>
                  <div className="mt-8 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-emerald-100/70">Iuran Terkumpul (Bulan Ini)</span>
                      <span className="font-bold">98.2%</span>
                    </div>
                    <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-300 h-full w-[98%]"></div>
                    </div>
                  </div>
                </div>

                {/* Trend Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-[0px_24px_48px_rgba(19,30,25,0.06)] relative overflow-hidden">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="font-bold text-base">Ringkasan Arus Kas</h4>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                        <span className="text-xs font-medium">Pemasukan</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <span className="text-xs font-medium">Pengeluaran</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-emerald-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                        <span className="text-xs text-[#404944]">Pemasukan Bulan Ini</span>
                      </div>
                      <p className="text-lg font-bold text-emerald-600">{formatCurrency(finance.totalPemasukanBulanIni)}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                        <span className="text-xs text-[#404944]">Pengeluaran Bulan Ini</span>
                      </div>
                      <p className="text-lg font-bold text-red-600">{formatCurrency(finance.totalPengeluaranBulanIni)}</p>
                    </div>
                  </div>

                  {/* Mockup Graph */}
                  <div className="h-24 w-full flex items-end justify-between gap-2">
                    {[65, 45, 85, 55, 95, 70, 80].map((height, i) => (
                      <div key={i} className="w-full bg-emerald-50 rounded-t-lg relative" style={{ height: `${height}%` }}>
                        <div className="absolute bottom-0 w-full bg-emerald-100 rounded-t-lg" style={{ height: `${Math.random() * 60 + 20}%` }}></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Bento Features */}
        <section id="fasilitas" className="py-16 px-6 md:px-12 bg-[#f0fdf4]">
          <div className="max-w-screen-2xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-auto md:h-[500px]">
              {/* Finance Portal - Large */}
              <div className="md:col-span-2 md:row-span-2 bg-[#deebe3] rounded-xl p-8 flex flex-col justify-between hover:scale-[1.02] transition-transform">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#003527] flex items-center justify-center mb-4">
                    <Landmark className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Portal Keuangan</h3>
                  <p className="text-[#404944] leading-relaxed text-sm">
                    Transparansi keuangan untuk kepercayaan dan kesejahteraan bersama. Kelola iuran dan kontribusi dengan mudah dan aman.
                  </p>
                </div>
                <Button
                  onClick={onLoginClick}
                  className="w-fit bg-[#003527] text-white px-5 py-2 rounded-full font-semibold text-sm hover:bg-[#064e3b]"
                >
                  Buka Portal
                </Button>
              </div>

              {/* Agenda */}
              <div className="md:col-span-2 md:row-span-1 bg-[#b5ede7]/30 rounded-xl p-6 flex items-center gap-6 hover:scale-[1.02] transition-transform">
                <div className="bg-white p-3 rounded-xl shadow-[0px_24px_48px_rgba(19,30,25,0.06)]">
                  <Calendar className="h-8 w-8 text-[#316763]" />
                </div>
                <div>
                  <h4 className="text-lg font-bold mb-1">Agenda Lingkungan</h4>
                  <p className="text-[#404944] text-sm">Tetap update dengan acara komunitas, rapat, dan jadwal liburan.</p>
                </div>
              </div>

              {/* Information */}
              <div className="md:col-span-1 md:row-span-1 bg-[#eaf7ee] rounded-xl p-6 flex flex-col justify-between hover:scale-[1.02] transition-transform cursor-pointer" onClick={onLoginClick}>
                <Info className="h-8 w-8 text-[#064e3b]" />
                <div>
                  <h4 className="font-bold">Informasi</h4>
                  <p className="text-[#404944] text-xs mt-1">Pengumuman & peraturan resmi.</p>
                </div>
              </div>

              {/* Directory */}
              <div className="md:col-span-1 md:row-span-1 bg-[#064e3b] text-white rounded-xl p-6 flex flex-col justify-between hover:scale-[1.02] transition-transform cursor-pointer" onClick={() => scrollToSection('warga')}>
                <Users className="h-8 w-8 text-emerald-100" />
                <div>
                  <h4 className="font-bold">Direktori</h4>
                  <p className="text-emerald-100/60 text-xs mt-1">Terhubung dengan tetangga.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Agenda Timeline */}
        {settings?.enableAgenda && agendas.length > 0 && (
          <section id="komunitas" className="py-16 px-6 md:px-12 bg-[#eaf7ee]">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-3">Agenda Mendatang</h2>
                <p className="text-[#404944]">Jangan lewatkan kegiatan lingkungan berikut ini</p>
              </div>
              <div className="space-y-8">
                {agendas.slice(0, 3).map((agenda, index) => {
                  const bgColors = [
                    'bg-[#064e3b] text-white',
                    'bg-[#b5ede7] text-[#316763]',
                    'bg-[#d9e6dd] text-[#003527]'
                  ];
                  return (
                    <div 
                      key={agenda.id} 
                      className="flex gap-6 group cursor-pointer"
                      onClick={() => setSelectedAgenda(agenda)}
                    >
                      <div className="flex flex-col items-center">
                        <div className={`w-12 h-12 rounded-full ${bgColors[index % 3]} flex items-center justify-center font-bold text-sm`}>
                          {formatDate(agenda.startDate)}
                        </div>
                        {index < agendas.slice(0, 3).length - 1 && (
                          <div className="w-0.5 h-full bg-[#bfc9c3]/30 mt-4"></div>
                        )}
                      </div>
                      <div className="pb-6 flex-1">
                        <h4 className="text-lg font-bold mb-2 group-hover:text-[#003527] transition-colors">
                          {agenda.title}
                        </h4>
                        <p className="text-[#404944] text-sm leading-relaxed mb-3">
                          {agenda.description || 'Kegiatan komunitas untuk semua warga.'}
                        </p>
                        <div className="flex items-center gap-4 text-xs font-semibold text-[#404944]">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {agenda.startTime || '07:00'}
                          </span>
                          {agenda.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {agenda.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )
        }

        {/* Agenda Detail Modal - Unified Style */}
        <Dialog open={!!selectedAgenda} onOpenChange={() => setSelectedAgenda(null)}>
          <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-transparent border-0 shadow-none">
            {selectedAgenda && (
              <div className="w-full bg-[#f0fdf4]/70 backdrop-blur-xl rounded-xl shadow-[0px_24px_48px_rgba(19,30,25,0.06)] overflow-hidden">
                {/* Header with gradient */}
                <div className="bg-gradient-to-br from-[#003527] to-[#064e3b] p-6 md:p-8 text-white relative">
                  {/* Close button */}
                  <button
                    onClick={() => setSelectedAgenda(null)}
                    className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                  
                  <span className="text-emerald-200 font-bold tracking-widest text-xs uppercase">Agenda</span>
                  <h3 className="text-2xl font-bold mt-2">{selectedAgenda.title}</h3>
                  
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Badge className={
                      selectedAgenda.status === 'UPCOMING' ? 'bg-blue-500' :
                      selectedAgenda.status === 'ONGOING' ? 'bg-green-500' :
                      selectedAgenda.status === 'COMPLETED' ? 'bg-gray-500' :
                      'bg-red-500'
                    }>
                      {selectedAgenda.status === 'UPCOMING' ? 'Akan Datang' :
                       selectedAgenda.status === 'ONGOING' ? 'Berlangsung' :
                       selectedAgenda.status === 'COMPLETED' ? 'Selesai' : 'Dibatalkan'}
                    </Badge>
                    <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                      {selectedAgenda.targetBlok === 'ALL' ? 'Semua Blok' : `Blok ${selectedAgenda.targetBlok}`}
                    </Badge>
                  </div>
                </div>
                
                {/* Details Section */}
                <div className="p-6 md:p-8 bg-white space-y-4">
                  {/* Meta Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Date */}
                    <div className="flex items-center gap-3 p-4 bg-[#eaf7ee] rounded-xl">
                      <div className="w-12 h-12 rounded-full bg-[#003527] flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-[#404944] text-xs">Tanggal</p>
                        <p className="font-semibold text-[#003527]">{formatFullDate(selectedAgenda.startDate)}</p>
                      </div>
                    </div>
                    
                    {/* Time */}
                    {(selectedAgenda.startTime || selectedAgenda.endTime) && (
                      <div className="flex items-center gap-3 p-4 bg-[#eaf7ee] rounded-xl">
                        <div className="w-12 h-12 rounded-full bg-[#003527] flex items-center justify-center">
                          <Clock className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="text-[#404944] text-xs">Waktu</p>
                          <p className="font-semibold text-[#003527]">
                            {selectedAgenda.startTime || '-'}
                            {selectedAgenda.endTime && ` - ${selectedAgenda.endTime}`}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Location */}
                    {selectedAgenda.location && (
                      <div className="flex items-center gap-3 p-4 bg-[#eaf7ee] rounded-xl">
                        <div className="w-12 h-12 rounded-full bg-[#003527] flex items-center justify-center">
                          <MapPin className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="text-[#404944] text-xs">Lokasi</p>
                          <p className="font-semibold text-[#003527]">{selectedAgenda.location}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Created By */}
                    {selectedAgenda.createdBy && (
                      <div className="flex items-center gap-3 p-4 bg-[#eaf7ee] rounded-xl">
                        <div className="w-12 h-12 rounded-full bg-[#003527] flex items-center justify-center">
                          <User className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="text-[#404944] text-xs">Dibuat oleh</p>
                          <p className="font-semibold text-[#003527]">{selectedAgenda.createdBy}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Description */}
                  {selectedAgenda.description && (
                    <div className="pt-4 border-t border-gray-100">
                      <h4 className="font-semibold text-[#003527] mb-2">Deskripsi</h4>
                      <p className="text-[#404944] whitespace-pre-wrap leading-relaxed text-sm">
                        {selectedAgenda.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Testimonials */}
        {settings?.enableReviews && reviews.length > 0 && (
          <section className="py-16 px-6 md:px-12">
            <div className="max-w-screen-2xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">Kisah Warga</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {reviews.slice(0, 3).map((review, index) => {
                  const isMiddle = index === 1 && reviews.length >= 3;
                  return (
                    <div
                      key={review.id}
                      className={`${isMiddle ? 'bg-[#003527] text-white scale-105 relative z-10' : 'bg-[#eaf7ee]'} p-6 rounded-xl space-y-4 shadow-[0px_24px_48px_rgba(19,30,25,0.06)]`}
                    >
                      <div className="flex text-amber-400">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${star <= review.rating ? 'fill-current' : ''}`}
                          />
                        ))}
                      </div>
                      <p className={`italic ${isMiddle ? 'text-emerald-50' : 'text-[#404944]'} leading-relaxed`}>
                        &quot;{review.comment}&quot;
                      </p>
                      <div className="flex items-center gap-3">
                        <Avatar className={`w-10 h-10 ${isMiddle ? 'border-2 border-white/20' : ''}`}>
                          <AvatarImage src={review.userPhotoUrl || undefined} alt={review.userName} />
                          <AvatarFallback>
                            {review.userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h5 className={`font-semibold text-sm ${isMiddle ? 'text-white' : ''}`}>{review.userName}</h5>
                          <p className={`text-xs ${isMiddle ? 'text-emerald-100/70' : 'text-[#404944]'}`}>Warga</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Gallery */}
        {settings?.enableGallery && galleries.length > 0 && (
          <section className="py-16 px-6 md:px-12 bg-white">
            <div className="max-w-screen-2xl mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
                <div className="space-y-3">
                  <span className="text-[#003527] font-bold tracking-widest text-xs uppercase">Dokumentasi</span>
                  <h2 className="text-3xl md:text-4xl font-bold">Momen Kebersamaan</h2>
                </div>
                {galleries.length > 6 && (
                  <Button
                    variant="outline"
                    onClick={onLoginClick}
                    className="text-[#003527] font-semibold flex items-center gap-2 hover:underline border-[#003527]/20"
                  >
                    Lihat Lainnya <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {/* Bento Grid Gallery */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {/* First Image - Large (2x2) */}
                {galleries[0] && (
                  <div 
                    className="col-span-2 row-span-2 rounded-xl overflow-hidden shadow-lg cursor-pointer group relative aspect-square md:aspect-auto"
                    onClick={() => setSelectedImage(galleries[0])}
                  >
                    <img
                      src={galleries[0].thumbnailUrl || galleries[0].imageUrl}
                      alt={galleries[0].title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-4 left-4 right-4">
                        <p className="text-white font-semibold truncate">{galleries[0].title}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="px-2 py-1 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full flex items-center gap-1">
                            <Camera className="h-3 w-3" />
                            Lihat di sini
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Second Image - Tall (1x2) */}
                {galleries[1] && (
                  <div 
                    className="col-span-1 row-span-2 rounded-xl overflow-hidden shadow-lg cursor-pointer group relative"
                    onClick={() => setSelectedImage(galleries[1])}
                  >
                    <img
                      src={galleries[1].thumbnailUrl || galleries[1].imageUrl}
                      alt={galleries[1].title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-white font-medium text-sm truncate">{galleries[1].title}</p>
                        <div className="px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full inline-flex items-center gap-1 mt-1">
                          <Camera className="h-3 w-3" />
                          Lihat
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Third Image - Wide (2x1) */}
                {galleries[2] && (
                  <div 
                    className="col-span-1 md:col-span-2 rounded-xl overflow-hidden shadow-lg cursor-pointer group relative aspect-video"
                    onClick={() => setSelectedImage(galleries[2])}
                  >
                    <img
                      src={galleries[2].thumbnailUrl || galleries[2].imageUrl}
                      alt={galleries[2].title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-white font-medium text-sm truncate">{galleries[2].title}</p>
                        <div className="px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full inline-flex items-center gap-1 mt-1">
                          <Camera className="h-3 w-3" />
                          Lihat di sini
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Fourth Image - Small */}
                {galleries[3] && (
                  <div 
                    className="col-span-1 rounded-xl overflow-hidden shadow-lg cursor-pointer group relative aspect-square"
                    onClick={() => setSelectedImage(galleries[3])}
                  >
                    <img
                      src={galleries[3].thumbnailUrl || galleries[3].imageUrl}
                      alt={galleries[3].title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full inline-flex items-center gap-1">
                          <Camera className="h-3 w-3" />
                          Lihat
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Fifth Image - Small */}
                {galleries[4] && (
                  <div 
                    className="col-span-1 rounded-xl overflow-hidden shadow-lg cursor-pointer group relative aspect-square"
                    onClick={() => setSelectedImage(galleries[4])}
                  >
                    <img
                      src={galleries[4].thumbnailUrl || galleries[4].imageUrl}
                      alt={galleries[4].title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full inline-flex items-center gap-1">
                          <Camera className="h-3 w-3" />
                          Lihat
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Sixth Image or "View More" Card */}
                {galleries.length > 5 ? (
                  galleries[5] && (
                    <div 
                      className="col-span-2 rounded-xl overflow-hidden shadow-lg cursor-pointer group relative aspect-video"
                      onClick={() => setSelectedImage(galleries[5])}
                    >
                      <img
                        src={galleries[5].thumbnailUrl || galleries[5].imageUrl}
                        alt={galleries[5].title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                      {galleries.length > 6 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="text-center">
                            <p className="text-white text-2xl font-bold">+{galleries.length - 6}</p>
                            <p className="text-white/80 text-sm">foto lainnya</p>
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-3 left-3 right-3">
                          <p className="text-white font-medium text-sm truncate">{galleries[5].title}</p>
                          <div className="px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full inline-flex items-center gap-1 mt-1">
                            <Camera className="h-3 w-3" />
                            Lihat di sini
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                ) : null}
              </div>
            </div>
          </section>
        )}

        {/* Image Zoom Dialog with Details - Unified Style */}
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-transparent border-0 shadow-none">
            {selectedImage && (
              <div className="w-full grid md:grid-cols-12 bg-[#f0fdf4]/70 backdrop-blur-xl rounded-xl shadow-[0px_24px_48px_rgba(19,30,25,0.06)] overflow-hidden">
                {/* Left Image Column */}
                <div className="md:col-span-7 relative bg-black min-h-[300px] md:min-h-[500px]">
                  <img
                    src={selectedImage.imageUrl}
                    alt={selectedImage.title}
                    className="w-full h-full object-contain"
                  />
                  {/* Close button */}
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="absolute top-4 right-4 md:hidden bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                {/* Right Details Column */}
                <div className="col-span-12 md:col-span-5 bg-white p-6 md:p-8 relative">
                  {/* Close button - Desktop */}
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="hidden md:flex absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-400" />
                  </button>
                  
                  {/* Header */}
                  <div className="mb-6">
                    <span className="text-[#003527] font-bold tracking-widest text-xs uppercase">Galeri</span>
                    <h3 className="text-2xl font-bold text-[#003527] mt-2">{selectedImage.title}</h3>
                    {selectedImage.description && (
                      <p className="text-[#404944] mt-2 text-sm leading-relaxed">{selectedImage.description}</p>
                    )}
                  </div>
                  
                  {/* Meta Info */}
                  <div className="space-y-4">
                    {selectedImage.takenAt && (
                      <div className="flex items-center gap-3 p-3 bg-[#eaf7ee] rounded-xl">
                        <div className="w-10 h-10 rounded-full bg-[#003527] flex items-center justify-center">
                          <Camera className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-[#404944] text-xs">Tanggal Foto</p>
                          <p className="font-semibold text-sm text-[#003527]">{formatFullDate(selectedImage.takenAt)}</p>
                        </div>
                      </div>
                    )}
                    
                    {selectedImage.uploadedBy && (
                      <div className="flex items-center gap-3 p-3 bg-[#eaf7ee] rounded-xl">
                        <div className="w-10 h-10 rounded-full bg-[#003527] flex items-center justify-center">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-[#404944] text-xs">Diupload oleh</p>
                          <p className="font-semibold text-sm text-[#003527]">{selectedImage.uploadedBy}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3 p-3 bg-[#eaf7ee] rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-[#003527] flex items-center justify-center">
                        <Clock className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-[#404944] text-xs">Ditambahkan</p>
                        <p className="font-semibold text-sm text-[#003527]">{formatDateTime(selectedImage.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Struktur Organisasi - Bento Style */}
        {(strukturOrganisasi && (
          strukturOrganisasi.blokA.pengurus.length > 0 || 
          strukturOrganisasi.blokB.pengurus.length > 0 || 
          strukturOrganisasi.bersama.pengurus.length > 0
        )) && (
          <section id="warga" className="py-16 px-6 md:px-12 bg-[#f0fdf4]">
            <div className="max-w-screen-2xl mx-auto">
              <div className="text-center mb-12">
                <span className="text-[#003527] font-bold tracking-widest text-xs uppercase">Pengurus Lingkungan</span>
                <h2 className="text-3xl md:text-4xl font-bold mt-2">Struktur Organisasi</h2>
                <p className="text-[#404944] mt-3">Pengurus yang berdedikasi untuk kesejahteraan dan keharmonisan warga</p>
              </div>
              
              {/* Bento Grid Layout */}
              <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-auto md:h-[420px]">
                {/* Blok A - Large Card */}
                <div 
                  className="md:col-span-2 md:row-span-2 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-6 flex flex-col justify-between hover:scale-[1.02] transition-transform cursor-pointer border border-blue-200/30"
                  onClick={() => strukturOrganisasi?.blokA && setSelectedBlok({ key: 'A', label: 'Blok A', data: strukturOrganisasi.blokA })}
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-600/20">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-blue-900 mb-2">Blok A</h3>
                    <p className="text-blue-700/70 text-sm leading-relaxed">
                      Pengurus RT Blok A yang melayani warga dengan penuh dedikasi untuk kesejahteraan bersama.
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-6">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {strukturOrganisasi?.blokA?.pengurus?.slice(0, 3).map((p) => (
                          <Avatar key={p.id} className="w-8 h-8 border-2 border-white shadow-sm">
                            <AvatarImage src={p.photoUrl || undefined} alt={p.nama} />
                            <AvatarFallback className="bg-blue-500 text-white text-xs">
                              {p.nama.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <span className="text-xs text-blue-700 font-medium">
                        {strukturOrganisasi?.blokA?.pengurus?.length || 0} pengurus
                      </span>
                    </div>
                    <div className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                      Lihat Detail
                    </div>
                  </div>
                </div>

                {/* Blok B - Horizontal Card */}
                <div 
                  className="md:col-span-2 md:row-span-1 bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-xl p-6 flex items-center gap-6 hover:scale-[1.02] transition-transform cursor-pointer border border-emerald-200/30"
                  onClick={() => strukturOrganisasi?.blokB && setSelectedBlok({ key: 'B', label: 'Blok B', data: strukturOrganisasi.blokB })}
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/20 shrink-0">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-bold text-emerald-900">Blok B</h4>
                    <p className="text-emerald-700/70 text-sm truncate">Pengurus RT Blok B yang melayani warga dengan penuh dedikasi.</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex -space-x-2">
                      {strukturOrganisasi?.blokB?.pengurus?.slice(0, 3).map((p) => (
                        <Avatar key={p.id} className="w-7 h-7 border-2 border-white shadow-sm">
                          <AvatarImage src={p.photoUrl || undefined} alt={p.nama} />
                          <AvatarFallback className="bg-emerald-500 text-white text-xs">
                            {p.nama.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <div className="px-3 py-1 bg-emerald-600 text-white text-xs font-medium rounded-full">
                      Lihat di sini
                    </div>
                  </div>
                </div>

                {/* Bersama - Small Card */}
                <div 
                  className="md:col-span-1 md:row-span-1 bg-[#003527] text-white rounded-xl p-6 flex flex-col justify-between hover:scale-[1.02] transition-transform cursor-pointer"
                  onClick={() => strukturOrganisasi?.bersama && setSelectedBlok({ key: 'BERSAMA', label: 'Bersama', data: strukturOrganisasi.bersama })}
                >
                  <Shield className="h-8 w-8 text-emerald-300" />
                  <div>
                    <h4 className="font-bold">Bersama</h4>
                    <p className="text-emerald-200/60 text-xs mt-1">Keamanan, Kebersihan, DKM</p>
                    <div className="mt-2 inline-block px-2 py-0.5 bg-emerald-500/30 text-emerald-200 text-xs rounded-full">
                      Lihat di sini
                    </div>
                  </div>
                </div>

                {/* Kontak RT - Small Card */}
                <div className="md:col-span-1 md:row-span-1 bg-[#deebe3] rounded-xl p-6 flex flex-col justify-between hover:scale-[1.02] transition-transform">
                  <Phone className="h-8 w-8 text-[#064e3b]" />
                  <div>
                    <h4 className="font-bold text-[#003527]">Kontak RT</h4>
                    <p className="text-[#404944] text-xs mt-1">Hubungi pengurus via WhatsApp</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Blok Detail Modal - Unified Style */}
        <Dialog open={!!selectedBlok} onOpenChange={() => setSelectedBlok(null)}>
          <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-transparent border-0 shadow-none">
            {selectedBlok && (
              <div className="w-full bg-[#f0fdf4]/70 backdrop-blur-xl rounded-xl shadow-[0px_24px_48px_rgba(19,30,25,0.06)] overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header with gradient */}
                <div className={`p-6 md:p-8 text-white relative shrink-0 ${
                  selectedBlok.key === 'A' ? 'bg-gradient-to-br from-blue-600 to-blue-700' :
                  selectedBlok.key === 'B' ? 'bg-gradient-to-br from-emerald-600 to-emerald-700' :
                  'bg-gradient-to-br from-[#003527] to-[#064e3b]'
                }`}>
                  {/* Close button */}
                  <button
                    onClick={() => setSelectedBlok(null)}
                    className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                      <Building2 className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <span className="text-white/70 text-xs uppercase tracking-wider">Struktur Organisasi</span>
                      <h3 className="text-2xl font-bold">{selectedBlok.label}</h3>
                      <p className="text-white/70 text-sm mt-1">
                        {selectedBlok.key === 'BERSAMA' ? 'Sie. Keamanan, Kebersihan & DKM Masjid Al Birr' : 'Pengurus RT'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto">
                  {/* Kontak RT */}
                  {selectedBlok.data.kontakRT && (
                    <div className="p-4 md:p-6 bg-white border-b">
                      <div className="flex items-center justify-between p-4 bg-[#eaf7ee] rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-[#003527] flex items-center justify-center">
                            <Phone className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <p className="text-[#404944] text-xs">Kontak RT {selectedBlok.label}</p>
                            <p className="font-semibold text-[#003527]">{selectedBlok.data.kontakRT.nama}</p>
                          </div>
                        </div>
                        {selectedBlok.data.kontakRT.telepon && (
                          <a
                            href={getWhatsAppLink(selectedBlok.data.kontakRT.telepon)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors"
                          >
                            <MessageCircle className="h-4 w-4" />
                            WhatsApp
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Pengurus List */}
                  <div className="p-4 md:p-6 bg-white space-y-3">
                    <h4 className="font-bold text-[#003527] mb-4 flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Daftar Pengurus
                    </h4>
                    {selectedBlok.data.pengurus?.sort((a, b) => a.order - b.order).map((p) => (
                      <div key={p.id} className="flex items-center gap-4 p-4 rounded-xl bg-[#f0fdf4] hover:bg-[#eaf7ee] transition-colors">
                        <Avatar className="h-14 w-14 border-2 border-white shadow-md">
                          <AvatarImage src={p.photoUrl || undefined} alt={p.nama} />
                          <AvatarFallback className={`text-white ${
                            selectedBlok.key === 'A' ? 'bg-blue-500' :
                            selectedBlok.key === 'B' ? 'bg-emerald-500' :
                            'bg-[#003527]'
                          }`}>
                            {p.nama.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-semibold text-[#003527]">{p.nama}</h5>
                          <p className="text-sm text-[#404944]">{p.jabatanLabel}</p>
                          <div className="flex items-center gap-3 mt-1">
                            {p.nomorRumah && (
                              <span className="flex items-center gap-1 text-xs text-[#404944]/60">
                                <Home className="h-3 w-3" />
                                No. {p.nomorRumah}
                              </span>
                            )}
                            {p.telepon && (
                              <span className="text-xs text-[#404944]/60">{p.telepon}</span>
                            )}
                          </div>
                        </div>
                        {p.telepon && (
                          <a
                            href={getWhatsAppLink(p.telepon)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors"
                          >
                            <MessageCircle className="h-4 w-4" />
                            WhatsApp
                          </a>
                        )}
                      </div>
                    ))}
                    {(!selectedBlok.data.pengurus || selectedBlok.data.pengurus.length === 0) && (
                      <p className="text-center text-[#404944] py-8">
                        Belum ada data pengurus
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* CTA Section */}
        <section className="py-16 px-6 md:px-12">
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-[#003527] to-[#064e3b] rounded-xl p-10 md:p-16 text-center text-white relative overflow-hidden shadow-[0px_24px_48px_rgba(19,30,25,0.06)]">
            <div className="relative z-10 space-y-6">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                Jadilah Bagian dari<br />Keluarga Pradha Ciganitri
              </h2>
              <p className="text-emerald-100 max-w-lg mx-auto">
                Bersama kita wujudkan lingkungan yang harmonis, sejahtera, dan penuh kebersamaan. Daftarkan diri Anda untuk mengakses semua layanan digital kemurahan.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-3">
                {settings?.enableRegistration ? (
                  <Button
                    onClick={onRegisterClick}
                    className="bg-white text-[#003527] px-8 py-4 rounded-xl font-semibold hover:bg-emerald-50 transition-colors"
                  >
                    Daftar Sekarang
                  </Button>
                ) : (
                  <Button
                    onClick={onLoginClick}
                    className="bg-white text-[#003527] px-8 py-4 rounded-xl font-semibold hover:bg-emerald-50 transition-colors"
                  >
                    Masuk ke Portal
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => scrollToSection('warga')}
                  className="bg-transparent border-2 border-white/30 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition-colors"
                >
                  Hubungi Admin
                </Button>
              </div>
            </div>
            {/* Abstract BG circles */}
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full rounded-t-[2rem] mt-16 bg-emerald-950">
        <div className="flex flex-col md:flex-row justify-between items-center px-6 md:px-12 py-12 w-full text-emerald-50 text-sm font-light">
          <div className="flex flex-col items-center md:items-start gap-4 mb-8 md:mb-0">
            <div className="flex items-center gap-3">
              <img
                src={settings?.logoUrl || '/logo.jpg'}
                alt="Logo"
                className="w-6 h-6 object-contain rounded"
              />
              <span className="text-lg font-bold text-emerald-50">
                {settings?.siteName || 'Pradha Ciganitri'}
              </span>
            </div>
            <p className="text-emerald-200/60 max-w-xs text-center md:text-left text-xs">
              {settings?.siteDescription || 'Komplek Pradha Ciganitri - Bersama membangun harmoni, kesejahteraan, dan kebersamaan melalui layanan digital modern.'}
            </p>
            <p className="text-emerald-200/60 text-xs">
              © {new Date().getFullYear()} {settings?.siteName || 'Pradha Ciganitri'}. Hak cipta dilindungi.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16">
            <div className="flex flex-col gap-3">
              <span className="font-semibold text-emerald-100 mb-1 text-xs">Portal</span>
              <button onClick={onLoginClick} className="text-emerald-200/60 hover:text-emerald-50 transition-colors text-xs text-left">Portal Warga</button>
              <button onClick={onLoginClick} className="text-emerald-200/60 hover:text-emerald-50 transition-colors text-xs text-left">Login Keuangan</button>
            </div>
            <div className="flex flex-col gap-3">
              <span className="font-semibold text-emerald-100 mb-1 text-xs">Legal</span>
              <span className="text-emerald-200/60 text-xs">Kebijakan Privasi</span>
              <span className="text-emerald-200/60 text-xs">Ketentuan Layanan</span>
            </div>
            <div className="flex flex-col gap-3">
              <span className="font-semibold text-emerald-100 mb-1 text-xs">Bantuan</span>
              <span className="text-emerald-200/60 text-xs">Hubungi Bantuan</span>
              <span className="text-emerald-200/60 text-xs">Info Darurat</span>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex gap-3">
                <a href="#" className="hover:opacity-80 transition-opacity">
                  <Trophy className="h-4 w-4" />
                </a>
                <a href="#" className="hover:opacity-80 transition-opacity">
                  <Globe className="h-4 w-4" />
                </a>
                <a href="#" className="hover:opacity-80 transition-opacity">
                  <Mail className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
