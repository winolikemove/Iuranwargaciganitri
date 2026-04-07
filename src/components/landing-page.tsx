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
  FileText,
  AlertTriangle,
  Trash2,
  Car,
  DollarSign,
  AlertCircle,
  Siren,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
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
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [galleryPage, setGalleryPage] = useState(0);
  const [agendaIndex, setAgendaIndex] = useState(0);

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
  const totalUnits = 98; // Total unit di komplek Pradha Ciganitri

  // Data keuangan bulanan untuk grafik
  const monthlyFinanceData = [
    { month: 'Jan', fullName: 'Januari', pemasukan: 4500000, pengeluaran: 2800000 },
    { month: 'Feb', fullName: 'Februari', pemasukan: 5200000, pengeluaran: 3100000 },
    { month: 'Mar', fullName: 'Maret', pemasukan: 4800000, pengeluaran: 2500000 },
    { month: 'Apr', fullName: 'April', pemasukan: 5100000, pengeluaran: 3200000 },
    { month: 'Mei', fullName: 'Mei', pemasukan: 4700000, pengeluaran: 2900000 },
    { month: 'Jun', fullName: 'Juni', pemasukan: 5500000, pengeluaran: 3400000 },
  ];

  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

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
                {allPengurus.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-emerald-900/10">
                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-3">
                        {allPengurus.slice(0, 3).map((p) => (
                          <Avatar key={p.id} className="w-8 h-8 border-2 border-white">
                            <AvatarImage src={p.photoUrl || undefined} alt={p.nama} />
                            <AvatarFallback className="bg-emerald-500 text-white text-xs">
                              {p.nama.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <p className="text-sm text-[#404944] font-medium">
                        {allPengurus.length} pengurus aktif
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
                    <p className="text-emerald-100/70 font-medium text-sm">Total Saldo Kas RT Pradha Ciganitri</p>
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
                        <div className="w-3 h-3 rounded-full bg-gradient-to-t from-emerald-600 to-emerald-400"></div>
                        <span className="text-xs font-medium">Pemasukan</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-t from-rose-500 to-rose-300"></div>
                        <span className="text-xs font-medium">Pengeluaran</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4 rounded-xl border border-emerald-200/30">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                          <TrendingUp className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-xs text-[#404944]">Pemasukan Bulan Ini</span>
                      </div>
                      <p className="text-lg font-bold text-emerald-600">{formatCurrency(finance.totalPemasukanBulanIni)}</p>
                    </div>
                    <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 p-4 rounded-xl border border-rose-200/30">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-rose-500 flex items-center justify-center">
                          <TrendingDown className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-xs text-[#404944]">Pengeluaran Bulan Ini</span>
                      </div>
                      <p className="text-lg font-bold text-rose-600">{formatCurrency(finance.totalPengeluaranBulanIni)}</p>
                    </div>
                  </div>

                  {/* Modern Graph with Background Lines */}
                  <div className="relative h-40 w-full">
                    {/* Background grid lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-full h-px bg-gray-100"></div>
                      ))}
                    </div>

                    {/* Bars container */}
                    <div className="relative h-full flex items-end justify-between gap-3 px-1">
                      {monthlyFinanceData.map((data, i) => {
                        const maxValue = Math.max(...monthlyFinanceData.map(d => Math.max(d.pemasukan, d.pengeluaran)));
                        const pemasukanHeight = (data.pemasukan / maxValue) * 100;
                        const pengeluaranHeight = (data.pengeluaran / maxValue) * 100;
                        return (
                          <div
                            key={i}
                            className="flex-1 flex flex-col items-center gap-2 relative group"
                            onMouseEnter={() => setHoveredBar(i)}
                            onMouseLeave={() => setHoveredBar(null)}
                          >
                            {/* Modern Tooltip */}
                            {hoveredBar === i && (
                              <div className="absolute -top-28 left-1/2 -translate-x-1/2 z-20">
                                <div className="bg-gradient-to-br from-[#003527] to-[#064e3b] text-white p-4 rounded-xl shadow-xl min-w-[160px] border border-white/10">
                                  <p className="font-bold mb-3 text-center text-sm">{data.fullName}</p>
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                        <span className="text-xs text-white/70">Masuk</span>
                                      </div>
                                      <span className="text-xs font-semibold">{formatCurrency(data.pemasukan)}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                                        <span className="text-xs text-white/70">Keluar</span>
                                      </div>
                                      <span className="text-xs font-semibold">{formatCurrency(data.pengeluaran)}</span>
                                    </div>
                                  </div>
                                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#064e3b] rotate-45 rounded-sm"></div>
                                </div>
                              </div>
                            )}

                            {/* Bars with gradient and shadow */}
                            <div className="w-full flex gap-1 h-28 items-end">
                              {/* Income bar */}
                              <div
                                className="flex-1 rounded-t-lg transition-all duration-300 cursor-pointer relative overflow-hidden group/b bar"
                                style={{ height: `${pemasukanHeight}%` }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-t from-emerald-600 via-emerald-500 to-emerald-400"></div>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover/b:opacity-100 transition-opacity"></div>
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-300/50"></div>
                              </div>

                              {/* Expense bar */}
                              <div
                                className="flex-1 rounded-t-lg transition-all duration-300 cursor-pointer relative overflow-hidden group/b bar"
                                style={{ height: `${pengeluaranHeight}%` }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-t from-rose-500 via-rose-400 to-rose-300"></div>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover/b:opacity-100 transition-opacity"></div>
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-200/50"></div>
                              </div>
                            </div>

                            {/* Month label */}
                            <span className={`text-xs font-medium transition-colors ${hoveredBar === i ? 'text-[#003527] font-bold' : 'text-[#404944]'}`}>
                              {data.month}
                            </span>
                          </div>
                        );
                      })}
                    </div>
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
              <div 
                className="md:col-span-2 md:row-span-1 bg-[#b5ede7]/30 rounded-xl p-6 flex items-center gap-6 hover:scale-[1.02] transition-transform cursor-pointer"
                onClick={onLoginClick}
              >
                <div className="bg-white p-3 rounded-xl shadow-[0px_24px_48px_rgba(19,30,25,0.06)]">
                  <Calendar className="h-8 w-8 text-[#316763]" />
                </div>
                <div>
                  <h4 className="text-lg font-bold mb-1">Agenda Lingkungan</h4>
                  <p className="text-[#404944] text-sm">Tetap update dengan acara komunitas, rapat, dan jadwal liburan.</p>
                </div>
              </div>

              {/* Information */}
              <div 
                className="md:col-span-1 md:row-span-1 bg-[#eaf7ee] rounded-xl p-6 flex flex-col justify-between hover:scale-[1.02] transition-transform cursor-pointer"
                onClick={() => setShowInfoModal(true)}
              >
                <Info className="h-8 w-8 text-[#064e3b]" />
                <div>
                  <h4 className="font-bold">Informasi</h4>
                  <p className="text-[#404944] text-xs mt-1">Pengumuman & peraturan resmi.</p>
                  <div className="mt-2 inline-block px-2 py-0.5 bg-[#003527]/10 text-[#003527] text-xs font-medium rounded-full">
                    Lihat di sini
                  </div>
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

              {/* Agenda List with Navigation */}
              <div className="relative">
                <div className="space-y-8">
                  {agendas.slice(agendaIndex, agendaIndex + 3).map((agenda, index) => {
                    const bgColors = [
                      'bg-[#064e3b] text-white',
                      'bg-[#b5ede7] text-[#316763]',
                      'bg-[#d9e6dd] text-[#003527]'
                    ];
                    const visibleCount = Math.min(3, agendas.length - agendaIndex);
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
                          {index < visibleCount - 1 && (
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

                {/* Navigation Buttons */}
                {agendas.length > 3 && (
                  <div className="absolute right-0 bottom-0 flex flex-col gap-2">
                    <button
                      onClick={() => setAgendaIndex(prev => Math.max(0, prev - 1))}
                      disabled={agendaIndex === 0}
                      className="p-2 rounded-full bg-[#003527] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#064e3b] transition-colors shadow-lg"
                      title="Agenda sebelumnya"
                    >
                      <ChevronUp className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setAgendaIndex(prev => Math.min(agendas.length - 3, prev + 1))}
                      disabled={agendaIndex >= agendas.length - 3}
                      className="p-2 rounded-full bg-[#003527] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#064e3b] transition-colors shadow-lg"
                      title="Agenda selanjutnya"
                    >
                      <ChevronDown className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Page indicator */}
              {agendas.length > 3 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <span className="text-sm text-[#404944]">
                    {agendaIndex + 1}-{Math.min(agendaIndex + 3, agendas.length)} dari {agendas.length} agenda
                  </span>
                </div>
              )}
            </div>
          </section>
        )
        }

        {/* Agenda Detail Modal - Unified Style */}
        <Dialog open={!!selectedAgenda} onOpenChange={() => setSelectedAgenda(null)}>
          <DialogContent showCloseButton={false} className="sm:max-w-2xl p-0 overflow-hidden bg-transparent border-0 shadow-none">
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
              <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
                <h2 className="text-3xl font-bold text-center md:text-left">Kisah Warga</h2>
                {reviews.length > 3 && (
                  <Button
                    variant="outline"
                    onClick={() => setShowReviewsModal(true)}
                    className="text-[#003527] font-semibold flex items-center gap-2 hover:underline border-[#003527]/20"
                  >
                    Lihat Semua Ulasan <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {reviews.slice(0, 3).map((review, index) => {
                  const isMiddle = index === 1 && reviews.length >= 3;
                  return (
                    <div
                      key={review.id}
                      className={`${isMiddle ? 'bg-[#003527] text-white scale-105 relative z-10' : 'bg-[#eaf7ee]'} p-6 rounded-xl space-y-4 shadow-[0px_24px_48px_rgba(19,30,25,0.06)] cursor-pointer hover:scale-[1.02] transition-transform`}
                      onClick={() => setShowReviewsModal(true)}
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
                      <div className={`pt-2 text-xs ${isMiddle ? 'text-emerald-200/60' : 'text-[#404944]/60'}`}>
                        Klik untuk lihat ulasan lainnya
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Reviews Modal - Unified Style */}
        <Dialog open={showReviewsModal} onOpenChange={setShowReviewsModal}>
          <DialogContent showCloseButton={false} className="sm:max-w-2xl p-0 overflow-hidden bg-transparent border-0 shadow-none">
            <div className="w-full bg-[#f0fdf4]/70 backdrop-blur-xl rounded-xl shadow-[0px_24px_48px_rgba(19,30,25,0.06)] overflow-hidden max-h-[90vh] flex flex-col">
              {/* Header with gradient */}
              <div className="bg-gradient-to-br from-[#003527] to-[#064e3b] p-6 md:p-8 text-white relative shrink-0">
                {/* Close button */}
                <button
                  onClick={() => setShowReviewsModal(false)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
                
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                    <MessageCircle className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <span className="text-white/70 text-xs uppercase tracking-wider">Testimoni</span>
                    <h3 className="text-2xl font-bold">Kisah Warga</h3>
                    <p className="text-white/70 text-sm mt-1">
                      {reviews.length} ulasan dari warga Pradha Ciganitri
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-white">
                <div className="space-y-4">
                  {reviews.map((review, index) => (
                    <div 
                      key={review.id} 
                      className={`p-4 rounded-xl ${index % 2 === 0 ? 'bg-[#f0fdf4]' : 'bg-[#eaf7ee]'} hover:shadow-md transition-shadow`}
                    >
                      <div className="flex items-start gap-4">
                        <Avatar className="w-12 h-12 border-2 border-white shadow-sm shrink-0">
                          <AvatarImage src={review.userPhotoUrl || undefined} alt={review.userName} />
                          <AvatarFallback className="bg-[#003527] text-white">
                            {review.userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <h5 className="font-semibold text-[#003527]">{review.userName}</h5>
                            <div className="flex text-amber-400 shrink-0">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-3.5 w-3.5 ${star <= review.rating ? 'fill-current' : 'opacity-30'}`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-[#404944] text-sm leading-relaxed italic">
                            &quot;{review.comment}&quot;
                          </p>
                          {review.createdAt && (
                            <p className="text-[#404944]/50 text-xs mt-2">
                              {formatDateTime(review.createdAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Information/Rules Modal - Unified Style */}
        <Dialog open={showInfoModal} onOpenChange={setShowInfoModal}>
          <DialogContent showCloseButton={false} className="sm:max-w-3xl p-0 overflow-hidden bg-transparent border-0 shadow-none">
            <div className="w-full bg-[#f0fdf4]/70 backdrop-blur-xl rounded-xl shadow-[0px_24px_48px_rgba(19,30,25,0.06)] overflow-hidden max-h-[90vh] flex flex-col">
              {/* Header with gradient */}
              <div className="bg-gradient-to-br from-[#003527] to-[#064e3b] p-6 md:p-8 text-white relative shrink-0">
                {/* Close button */}
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
                
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                    <FileText className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <span className="text-white/70 text-xs uppercase tracking-wider">Informasi Resmi</span>
                    <h3 className="text-2xl font-bold">Pengumuman & Peraturan</h3>
                    <p className="text-white/70 text-sm mt-1">
                      Tata Tertib Warga Komplek Pradha Ciganitri
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-white">
                {/* Intro */}
                <div className="mb-6 p-4 bg-[#eaf7ee] rounded-xl border-l-4 border-[#003527]">
                  <p className="text-[#404944] leading-relaxed text-sm">
                    Demi menciptakan lingkungan hunian yang <strong className="text-[#003527]">Aman, Nyaman, Bersih, dan Harmonis</strong>, Pengurus Komplek menetapkan peraturan dan tata tertib yang berlaku bagi seluruh warga (pemilik maupun penyewa).
                  </p>
                </div>

                {/* Section 1: Keamanan */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Shield className="h-4 w-4 text-blue-600" />
                    </div>
                    <h4 className="font-bold text-[#003527]">1. Keamanan & Akses Keluar Masuk</h4>
                  </div>
                  <div className="space-y-2 pl-11">
                    <div className="flex gap-2 text-sm text-[#404944]">
                      <span className="text-[#003527] font-bold">•</span>
                      <p><strong>Tamu Berkunjung:</strong> Tamu yang berkunjung lebih dari pukul 22.00 WIB wajib melapor kepada petugas keamanan (Security).</p>
                    </div>
                    <div className="flex gap-2 text-sm text-[#404944]">
                      <span className="text-[#003527] font-bold">•</span>
                      <p><strong>Tamu Menginap:</strong> Tamu yang menginap lebih dari 1x24 jam wajib melapor kepada Ketua RT/Pengurus dengan menyerahkan salinan identitas (KTP).</p>
                    </div>
                    <div className="flex gap-2 text-sm text-[#404944]">
                      <span className="text-[#003527] font-bold">•</span>
                      <p><strong>Portal/Gate:</strong> Harap membuka kaca mobil atau membuka helm saat memasuki gerbang komplek demi memudahkan verifikasi identitas oleh petugas.</p>
                    </div>
                    <div className="flex gap-2 text-sm text-[#404944]">
                      <span className="text-[#003527] font-bold">•</span>
                      <p><strong>Jam Tenang:</strong> Dimulai pukul 22.00 WIB. Warga diharapkan menjaga ketenangan dan tidak melakukan aktivitas yang menimbulkan kebisingan (musik keras, renovasi berat, dsb).</p>
                    </div>
                  </div>
                </div>

                {/* Section 2: Kebersihan */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                      <Trash2 className="h-4 w-4 text-green-600" />
                    </div>
                    <h4 className="font-bold text-[#003527]">2. Kebersihan Lingkungan</h4>
                  </div>
                  <div className="space-y-2 pl-11">
                    <div className="flex gap-2 text-sm text-[#404944]">
                      <span className="text-[#003527] font-bold">•</span>
                      <p><strong>Pengelolaan Sampah:</strong> Sampah rumah tangga wajib diletakkan di dalam tempat sampah tertutup di depan rumah masing-masing sesuai jadwal pengambilan.</p>
                    </div>
                    <div className="flex gap-2 text-sm text-[#404944]">
                      <span className="text-[#003527] font-bold">•</span>
                      <p><strong>Dilarang Membakar Sampah:</strong> Mengingat kepadatan hunian, warga dilarang keras membakar sampah di area komplek kecuali tempat terbuka dengan intensitas kecil.</p>
                    </div>
                    <div className="flex gap-2 text-sm text-[#404944]">
                      <span className="text-[#003527] font-bold">•</span>
                      <p><strong>Saluran Air:</strong> Warga bertanggung jawab menjaga kebersihan selokan di depan rumah masing-masing agar tidak terjadi penyumbatan.</p>
                    </div>
                  </div>
                </div>

                {/* Section 3: Ketertiban */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Car className="h-4 w-4 text-amber-600" />
                    </div>
                    <h4 className="font-bold text-[#003527]">3. Ketertiban Parkir & Fasilitas Umum</h4>
                  </div>
                  <div className="space-y-2 pl-11">
                    <div className="flex gap-2 text-sm text-[#404944]">
                      <span className="text-[#003527] font-bold">•</span>
                      <p><strong>Parkir Kendaraan:</strong> Gunakan area carport masing-masing. Hindari memarkir kendaraan di bahu jalan yang dapat mengganggu akses kendaraan lain atau mobil darurat (Ambulans/Pemadam Kebakaran).</p>
                    </div>
                    <div className="flex gap-2 text-sm text-[#404944]">
                      <span className="text-[#003527] font-bold">•</span>
                      <p><strong>Kecepatan Berkendara:</strong> Batas kecepatan maksimal di dalam komplek adalah <strong className="text-[#003527]">10-15 km/jam</strong>. Harap mengutamakan pejalan kaki dan anak-anak yang bermain.</p>
                    </div>
                    <div className="flex gap-2 text-sm text-[#404944]">
                      <span className="text-[#003527] font-bold">•</span>
                      <p><strong>Hewan Peliharaan:</strong> Pemilik wajib memastikan hewan peliharaan tidak berkeliaran tanpa pengawasan dan wajib membersihkan kotoran hewan jika berada di area publik.</p>
                    </div>
                  </div>
                </div>

                {/* Section 4: IPL */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-purple-600" />
                    </div>
                    <h4 className="font-bold text-[#003527]">4. Iuran Pengelolaan Lingkungan (IPL)</h4>
                  </div>
                  <div className="space-y-2 pl-11">
                    <div className="flex gap-2 text-sm text-[#404944]">
                      <span className="text-[#003527] font-bold">•</span>
                      <p>Pembayaran IPL (Keamanan, Kebersihan, dan Kas) dilakukan paling lambat tanggal <strong className="text-[#003527]">10 setiap bulannya</strong>.</p>
                    </div>
                    <div className="flex gap-2 text-sm text-[#404944]">
                      <span className="text-[#003527] font-bold">•</span>
                      <p>Pembayaran dapat dilakukan melalui Transfer/datang ke rumah Bendahara RT masing-masing blok.</p>
                    </div>
                  </div>
                </div>

                {/* Emergency Info */}
                <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-200">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <h5 className="font-bold text-red-700 mb-1">Keadaan Darurat</h5>
                      <p className="text-sm text-red-600">
                        Jika terdapat hal-hal yang mencurigakan, tindak kriminal, atau bencana (kebakaran/banjir), segera hubungi <strong>pos keamanan</strong> atau <strong>pengurus RT</strong>.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Note */}
                <div className="p-4 bg-[#f0fdf4] rounded-xl text-sm text-[#404944]">
                  <p className="mb-2">Segala bentuk pelanggaran terhadap peraturan ini akan dikenakan sanksi teguran secara lisan maupun tertulis demi kebaikan bersama.</p>
                  <p className="text-xs text-[#404944]/60">Demikian pengumuman ini dibuat untuk diperhatikan dan dilaksanakan dengan penuh tanggung jawab.</p>
                </div>

                {/* Signature */}
                <div className="mt-6 text-right">
                  <p className="text-xs text-[#404944]/60 mb-1">Hormat kami,</p>
                  <p className="font-bold text-[#003527]">Pengurus Komplek Pradha Ciganitri</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Gallery */}
        {settings?.enableGallery && galleries.length > 0 && (
          <section className="py-16 px-6 md:px-12 bg-white">
            <div className="max-w-screen-2xl mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
                <div className="space-y-3">
                  <span className="text-[#003527] font-bold tracking-widest text-xs uppercase">Dokumentasi</span>
                  <h2 className="text-3xl md:text-4xl font-bold">Momen Kebersamaan</h2>
                </div>
              </div>
              
              {/* Bento Grid Gallery with Navigation */}
              <div className="relative">
                {/* Gallery Grid - Clean Bento Layout */}
                {(() => {
                  const itemsPerPage = 6;
                  const startIndex = galleryPage * itemsPerPage;
                  const currentGalleries = galleries.slice(startIndex, startIndex + itemsPerPage);
                  
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-6 md:grid-rows-2 gap-3 md:gap-4 h-auto md:h-[480px]">
                      {/* First Image - Large (2 cols x 2 rows) */}
                      {currentGalleries[0] && (
                        <div 
                          className="col-span-2 row-span-2 rounded-xl overflow-hidden shadow-lg cursor-pointer group relative"
                          onClick={() => setSelectedImage(currentGalleries[0])}
                        >
                          <img
                            src={currentGalleries[0].thumbnailUrl || currentGalleries[0].imageUrl}
                            alt={currentGalleries[0].title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-4 left-4 right-4">
                              <p className="text-white font-semibold truncate">{currentGalleries[0].title}</p>
                              <div className="px-2 py-1 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full inline-flex items-center gap-1 mt-2">
                                <Camera className="h-3 w-3" />
                                Lihat detail
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Second Image - Medium Wide (2 cols x 1 row) */}
                      {currentGalleries[1] && (
                        <div 
                          className="col-span-2 row-span-1 rounded-xl overflow-hidden shadow-lg cursor-pointer group relative"
                          onClick={() => setSelectedImage(currentGalleries[1])}
                        >
                          <img
                            src={currentGalleries[1].thumbnailUrl || currentGalleries[1].imageUrl}
                            alt={currentGalleries[1].title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-3 left-3 right-3">
                              <p className="text-white font-medium text-sm truncate">{currentGalleries[1].title}</p>
                              <div className="px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full inline-flex items-center gap-1 mt-1">
                                <Camera className="h-3 w-3" />
                                Lihat detail
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Third Image - Small Square */}
                      {currentGalleries[2] && (
                        <div 
                          className="col-span-1 row-span-1 rounded-xl overflow-hidden shadow-lg cursor-pointer group relative"
                          onClick={() => setSelectedImage(currentGalleries[2])}
                        >
                          <img
                            src={currentGalleries[2].thumbnailUrl || currentGalleries[2].imageUrl}
                            alt={currentGalleries[2].title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-2 left-2 right-2">
                              <div className="px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full inline-flex items-center gap-1">
                                <Camera className="h-3 w-3" />
                                Lihat detail
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Fourth Image - Small Square */}
                      {currentGalleries[3] && (
                        <div 
                          className="col-span-1 row-span-1 rounded-xl overflow-hidden shadow-lg cursor-pointer group relative"
                          onClick={() => setSelectedImage(currentGalleries[3])}
                        >
                          <img
                            src={currentGalleries[3].thumbnailUrl || currentGalleries[3].imageUrl}
                            alt={currentGalleries[3].title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-2 left-2 right-2">
                              <div className="px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full inline-flex items-center gap-1">
                                <Camera className="h-3 w-3" />
                                Lihat detail
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Fifth Image - Medium Wide (2 cols x 1 row) */}
                      {currentGalleries[4] && (
                        <div 
                          className="col-span-2 row-span-1 rounded-xl overflow-hidden shadow-lg cursor-pointer group relative"
                          onClick={() => setSelectedImage(currentGalleries[4])}
                        >
                          <img
                            src={currentGalleries[4].thumbnailUrl || currentGalleries[4].imageUrl}
                            alt={currentGalleries[4].title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-3 left-3 right-3">
                              <p className="text-white font-medium text-sm truncate">{currentGalleries[4].title}</p>
                              <div className="px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full inline-flex items-center gap-1 mt-1">
                                <Camera className="h-3 w-3" />
                                Lihat detail
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Sixth Image - Small Square */}
                      {currentGalleries[5] && (
                        <div 
                          className="col-span-1 row-span-1 rounded-xl overflow-hidden shadow-lg cursor-pointer group relative"
                          onClick={() => setSelectedImage(currentGalleries[5])}
                        >
                          <img
                            src={currentGalleries[5].thumbnailUrl || currentGalleries[5].imageUrl}
                            alt={currentGalleries[5].title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-2 left-2 right-2">
                              <div className="px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full inline-flex items-center gap-1">
                                <Camera className="h-3 w-3" />
                                Lihat detail
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Seventh Image - Small Square */}
                      {currentGalleries[6] && (
                        <div 
                          className="col-span-1 row-span-1 rounded-xl overflow-hidden shadow-lg cursor-pointer group relative"
                          onClick={() => setSelectedImage(currentGalleries[6])}
                        >
                          <img
                            src={currentGalleries[6].thumbnailUrl || currentGalleries[6].imageUrl}
                            alt={currentGalleries[6].title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-2 left-2 right-2">
                              <div className="px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full inline-flex items-center gap-1">
                                <Camera className="h-3 w-3" />
                                Lihat detail
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
                
                {/* Navigation Buttons */}
                {galleries.length > 6 && (
                  <div className="flex items-center justify-end gap-3 mt-6">
                    <span className="text-sm text-[#404944]">
                      Halaman {galleryPage + 1} dari {Math.ceil(galleries.length / 6)}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setGalleryPage(prev => Math.max(0, prev - 1))}
                        disabled={galleryPage === 0}
                        className="p-2 rounded-full bg-[#003527] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#064e3b] transition-colors"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setGalleryPage(prev => Math.min(Math.ceil(galleries.length / 6) - 1, prev + 1))}
                        disabled={galleryPage >= Math.ceil(galleries.length / 6) - 1}
                        className="p-2 rounded-full bg-[#003527] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#064e3b] transition-colors"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Image Zoom Dialog with Details - Unified Style */}
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent showCloseButton={false} className="sm:max-w-4xl p-0 overflow-hidden bg-transparent border-0 shadow-none">
            {selectedImage && (
              <div className="w-full flex flex-col md:grid md:grid-cols-12 bg-[#f0fdf4]/70 backdrop-blur-xl rounded-xl shadow-[0px_24px_48px_rgba(19,30,25,0.06)] overflow-hidden max-h-[90vh]">
                {/* Left Image Column */}
                <div className="md:col-span-7 relative bg-black aspect-[4/3] md:aspect-auto md:min-h-[500px] shrink-0">
                  <img
                    src={selectedImage.imageUrl}
                    alt={selectedImage.title}
                    className="w-full h-full object-contain"
                  />
                  {/* Close button - Mobile */}
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="absolute top-4 right-4 md:hidden bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                {/* Right Details Column */}
                <div className="md:col-span-5 bg-white p-6 md:p-8 relative overflow-y-auto flex-1">
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
                      Lihat detail
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
                      Lihat detail
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
          <DialogContent showCloseButton={false} className="sm:max-w-2xl p-0 overflow-hidden bg-transparent border-0 shadow-none">
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
                Bersama kita wujudkan lingkungan yang harmonis, sejahtera, dan penuh kebersamaan. Daftarkan diri Anda untuk mengakses semua layanan digital.
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
