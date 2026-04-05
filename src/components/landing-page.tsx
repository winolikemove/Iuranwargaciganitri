'use client';

import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Wallet,
  Calendar,
  Bell,
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
} from 'lucide-react';

interface LandingPageProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
}

export function LandingPage({ onLoginClick, onRegisterClick }: LandingPageProps) {
  const {
    settings,
    finance,
    agendas,
    informations,
    galleries,
    reviews,
    pengurus,
    users,
    isLoading,
  } = useApp();

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

  const formatDateLong = (dateStr: string) => {
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

  const getRoleBadge = (role: string) => {
    const roleMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      SUPERADMIN: { label: 'Super Admin', variant: 'default' },
      ADMIN: { label: 'Admin', variant: 'secondary' },
      BENDAHARA: { label: 'Bendahara', variant: 'outline' },
    };
    return roleMap[role] || { label: role, variant: 'outline' };
  };

  // Calculate active residents count
  const activeResidents = users?.filter(u => u.status === 'ACTIVE' && u.role === 'WARGA').length || 0;
  const totalUnits = users?.filter(u => u.role === 'WARGA').length || 0;

  return (
    <div className="min-h-screen bg-[#f0fdf4] text-[#131e19] selection:bg-[#064e3b] selection:text-white">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-emerald-50/70 dark:bg-emerald-950/70 backdrop-blur-xl border-b border-emerald-200/30">
        <div className="flex justify-between items-center px-6 md:px-12 h-20 w-full max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-3">
            <img
              src={settings?.logoUrl || '/logo.jpg'}
              alt="Logo"
              className="w-10 h-10 object-contain rounded-lg"
            />
            <div className="text-xl font-bold tracking-tight text-emerald-900">
              {settings?.siteName || 'Pradha Ciganitri'}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm tracking-tight">
            <a href="#warga" className="text-emerald-800/70 hover:text-emerald-950 transition-colors">Warga</a>
            <a href="#fasilitas" className="text-emerald-800/70 hover:text-emerald-950 transition-colors">Fasilitas</a>
            <a href="#keuangan" className="text-emerald-950 font-semibold border-b-2 border-emerald-900 pb-1">Keuangan</a>
            <a href="#komunitas" className="text-emerald-800/70 hover:text-emerald-950 transition-colors">Komunitas</a>
          </div>
          <div className="flex items-center gap-4">
            {settings?.enableRegistration && (
              <Button
                variant="ghost"
                onClick={onRegisterClick}
                className="hidden sm:flex hover:bg-emerald-100/50 rounded-full"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Daftar
              </Button>
            )}
            <Button
              onClick={onLoginClick}
              className="bg-[#003527] text-white px-6 py-2.5 rounded-full font-semibold text-sm hover:bg-[#064e3b] transition-colors"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Masuk
            </Button>
          </div>
        </div>
      </nav>

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative min-h-[600px] md:min-h-[700px] flex items-center px-6 md:px-12 py-20 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              alt="Banner"
              className="w-full h-full object-cover opacity-20"
              src={settings?.bannerUrl || '/banner.jpg'}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#f0fdf4]/0 via-[#f0fdf4]/40 to-[#f0fdf4]"></div>
          </div>
          <div className="relative z-10 w-full max-w-screen-2xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#131e19]">
                Hidup dalam<br />
                <span className="text-[#003527]">Keselarasan Sempurna.</span>
              </h1>
              <p className="text-lg text-[#404944] max-w-lg leading-relaxed">
                Rasakan tempat perlindungan di mana kehidupan modern bertemu dengan pertumbuhan komunitas yang alami. Kelola, terhubung, dan berkembang di lingkungan digital-first kami.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  onClick={onLoginClick}
                  className="bg-gradient-to-br from-[#003527] to-[#064e3b] text-white px-8 py-6 rounded-xl font-bold shadow-xl hover:opacity-90 transition-opacity text-lg"
                >
                  Jelajahi Komunitas
                </Button>
                <Button
                  variant="outline"
                  onClick={onRegisterClick}
                  className="bg-[#deebe3] px-8 py-6 rounded-xl font-bold text-[#003527] hover:bg-[#d9e6dd] transition-colors text-lg border-0"
                >
                  Pelajari Lebih Lanjut
                </Button>
              </div>
            </div>

            {/* Community Hub Card */}
            <div className="relative">
              <div className="bg-white/70 backdrop-blur-xl rounded-xl p-8 border border-white/20 shadow-[0px_24px_48px_rgba(19,30,25,0.06)] relative z-20">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold">Pusat Komunitas</h3>
                  <span className="px-3 py-1 bg-[#003527]/10 text-[#003527] text-xs font-bold rounded-full flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    DATA AKTIF
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[#404944] text-sm">Warga Aktif</p>
                    <p className="text-3xl font-extrabold text-[#003527]">{activeResidents.toLocaleString('id-ID')}+</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[#404944] text-sm">Total Unit</p>
                    <p className="text-3xl font-extrabold text-[#003527]">{totalUnits.toLocaleString('id-ID')}+</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[#404944] text-sm">Fasilitas Tersedia</p>
                    <p className="text-3xl font-extrabold text-[#003527]">12</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[#404944] text-sm">Skor Keamanan</p>
                    <p className="text-3xl font-extrabold text-[#003527]">9.8</p>
                  </div>
                </div>
                {pengurus.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-emerald-900/10">
                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-3">
                        {pengurus.slice(0, 3).map((p) => (
                          <Avatar key={p.id} className="w-10 h-10 border-2 border-white">
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
          <section id="keuangan" className="py-24 px-6 md:px-12 bg-[#eaf7ee]">
            <div className="max-w-screen-2xl mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                <div className="space-y-4">
                  <span className="text-[#003527] font-bold tracking-widest text-sm uppercase">Transparansi Keuangan</span>
                  <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Keuangan Lingkungan</h2>
                </div>
                <Button
                  variant="ghost"
                  onClick={onLoginClick}
                  className="text-[#003527] font-bold flex items-center gap-2 hover:underline"
                >
                  Lihat Laporan Lengkap <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Balance Card */}
                <div className="lg:col-span-1 bg-[#003527] text-white p-10 rounded-xl flex flex-col justify-between shadow-[0px_24px_48px_rgba(19,30,25,0.06)]">
                  <div className="space-y-2">
                    <p className="text-emerald-100/70 font-medium">Total Saldo Komunitas</p>
                    <h3 className="text-4xl font-bold">{formatCurrency(finance.saldoAkhir)}</h3>
                  </div>
                  <div className="mt-12 space-y-4">
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
                <div className="lg:col-span-2 bg-white p-8 rounded-xl shadow-[0px_24px_48px_rgba(19,30,25,0.06)] relative overflow-hidden">
                  <div className="flex items-center justify-between mb-8">
                    <h4 className="font-bold text-lg">Ringkasan Arus Kas</h4>
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
                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                        <span className="text-sm text-[#404944]">Pemasukan Bulan Ini</span>
                      </div>
                      <p className="text-2xl font-bold text-emerald-600">{formatCurrency(finance.totalPemasukanBulanIni)}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingDown className="h-5 w-5 text-red-600" />
                        <span className="text-sm text-[#404944]">Pengeluaran Bulan Ini</span>
                      </div>
                      <p className="text-2xl font-bold text-red-600">{formatCurrency(finance.totalPengeluaranBulanIni)}</p>
                    </div>
                  </div>

                  {/* Mockup Graph */}
                  <div className="h-32 w-full flex items-end justify-between gap-2">
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
        <section className="py-24 px-6 md:px-12 bg-[#f0fdf4]">
          <div className="max-w-screen-2xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-6 h-auto md:h-[600px]">
              {/* Finance Portal - Large */}
              <div className="md:col-span-2 md:row-span-2 bg-[#deebe3] rounded-xl p-10 flex flex-col justify-between hover:scale-[1.02] transition-transform">
                <div>
                  <div className="w-16 h-16 rounded-xl bg-[#003527] flex items-center justify-center mb-6">
                    <Landmark className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold mb-4">Portal Keuangan</h3>
                  <p className="text-[#404944] leading-relaxed">
                    Pembayaran yang aman, transparan, dan bebas repot untuk iuran bulanan dan kontribusi proyek khusus Anda.
                  </p>
                </div>
                <Button
                  onClick={onLoginClick}
                  className="w-fit bg-[#003527] text-white px-6 py-3 rounded-full font-bold hover:bg-[#064e3b]"
                >
                  Buka Portal
                </Button>
              </div>

              {/* Agenda */}
              <div className="md:col-span-2 md:row-span-1 bg-[#b5ede7]/30 rounded-xl p-8 flex items-center gap-8 hover:scale-[1.02] transition-transform">
                <div className="bg-white p-4 rounded-xl shadow-[0px_24px_48px_rgba(19,30,25,0.06)]">
                  <Calendar className="h-10 w-10 text-[#316763]" />
                </div>
                <div>
                  <h4 className="text-xl font-bold mb-2">Agenda Lingkungan</h4>
                  <p className="text-[#404944] text-sm">Tetap update dengan acara komunitas, rapat, dan jadwal liburan.</p>
                </div>
              </div>

              {/* Information */}
              <div className="md:col-span-1 md:row-span-1 bg-[#eaf7ee] rounded-xl p-8 flex flex-col justify-between hover:scale-[1.02] transition-transform">
                <Info className="h-10 w-10 text-[#064e3b]" />
                <div>
                  <h4 className="text-lg font-bold">Informasi</h4>
                  <p className="text-[#404944] text-xs mt-1">Pengumuman & peraturan resmi.</p>
                </div>
              </div>

              {/* Directory */}
              <div className="md:col-span-1 md:row-span-1 bg-[#064e3b] text-white rounded-xl p-8 flex flex-col justify-between hover:scale-[1.02] transition-transform">
                <Users className="h-10 w-10 text-emerald-100" />
                <div>
                  <h4 className="text-lg font-bold">Direktori</h4>
                  <p className="text-emerald-100/60 text-xs mt-1">Terhubung dengan tetangga.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Agenda Timeline */}
        {settings?.enableAgenda && agendas.length > 0 && (
          <section id="komunitas" className="py-24 px-6 md:px-12 bg-[#eaf7ee]">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-4">Agenda Mendatang</h2>
                <p className="text-[#404944]">Jangan lewatkan kegiatan lingkungan berikut ini</p>
              </div>
              <div className="space-y-12">
                {agendas.slice(0, 3).map((agenda, index) => {
                  const bgColors = [
                    'bg-[#064e3b] text-white',
                    'bg-[#b5ede7] text-[#316763]',
                    'bg-[#d9e6dd] text-[#003527]'
                  ];
                  return (
                    <div key={agenda.id} className="flex gap-8 group">
                      <div className="flex flex-col items-center">
                        <div className={`w-14 h-14 rounded-full ${bgColors[index % 3]} flex items-center justify-center font-bold text-sm`}>
                          {formatDate(agenda.startDate)}
                        </div>
                        {index < agendas.slice(0, 3).length - 1 && (
                          <div className="w-0.5 h-full bg-[#bfc9c3]/30 mt-4"></div>
                        )}
                      </div>
                      <div className="pb-8">
                        <h4 className="text-xl font-bold mb-2 group-hover:text-[#003527] transition-colors">
                          {agenda.title}
                        </h4>
                        <p className="text-[#404944] text-sm leading-relaxed mb-4">
                          {agenda.description || 'Kegiatan komunitas untuk semua warga.'}
                        </p>
                        <div className="flex items-center gap-4 text-xs font-bold text-[#404944]">
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
        )}

        {/* Testimonials */}
        {settings?.enableReviews && reviews.length > 0 && (
          <section className="py-24 px-6 md:px-12">
            <div className="max-w-screen-2xl mx-auto">
              <h2 className="text-4xl font-bold text-center mb-16">Kisah Warga</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {reviews.slice(0, 3).map((review, index) => {
                  const isMiddle = index === 1 && reviews.length >= 3;
                  return (
                    <div
                      key={review.id}
                      className={`${isMiddle ? 'bg-[#003527] text-white scale-105 relative z-10' : 'bg-[#eaf7ee]'} p-10 rounded-xl space-y-6 shadow-[0px_24px_48px_rgba(19,30,25,0.06)]`}
                    >
                      <div className="flex text-amber-400">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-5 w-5 ${star <= review.rating ? 'fill-current' : ''}`}
                          />
                        ))}
                      </div>
                      <p className={`italic ${isMiddle ? 'text-emerald-50' : 'text-[#404944]'} leading-relaxed text-lg`}>
                        &quot;{review.comment}&quot;
                      </p>
                      <div className="flex items-center gap-4">
                        <Avatar className={`w-12 h-12 ${isMiddle ? 'border-2 border-white/20' : ''}`}>
                          <AvatarImage src={review.userPhotoUrl || undefined} alt={review.userName} />
                          <AvatarFallback>
                            {review.userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h5 className={`font-bold ${isMiddle ? 'text-white' : ''}`}>{review.userName}</h5>
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
          <section className="py-24 px-6 md:px-12 bg-white">
            <div className="max-w-screen-2xl mx-auto">
              <div className="text-center mb-16 space-y-4">
                <h2 className="text-4xl font-bold">Kehidupan Komunitas</h2>
                <p className="text-[#404944] max-w-2xl mx-auto">
                  Sekilas momen sehari-hari dan pengalaman bersama di dalam tempat perlindungan kami.
                </p>
              </div>
              <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                {galleries.slice(0, 6).map((gallery) => (
                  <div key={gallery.id} className="rounded-xl overflow-hidden shadow-[0px_24px_48px_rgba(19,30,25,0.06)]">
                    <img
                      src={gallery.thumbnailUrl || gallery.imageUrl}
                      alt={gallery.title}
                      className="w-full hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Pengurus Section */}
        {pengurus.length > 0 && (
          <section id="warga" className="py-24 px-6 md:px-12 bg-[#eaf7ee]">
            <div className="max-w-screen-2xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-4">Tim Pengurus</h2>
                <p className="text-[#404944]">Pengurus yang siap membantu kebutuhan warga</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {pengurus.map((p) => {
                  const badge = getRoleBadge(p.role);
                  return (
                    <div key={p.id} className="bg-white p-6 rounded-xl shadow-[0px_24px_48px_rgba(19,30,25,0.06)] hover:scale-[1.02] transition-transform">
                      <div className="flex flex-col items-center text-center">
                        <Avatar className="h-16 w-16 mb-4">
                          <AvatarImage src={p.photoUrl || undefined} alt={p.nama} />
                          <AvatarFallback className="bg-emerald-500 text-white text-lg">
                            {p.nama.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <h4 className="font-semibold">{p.nama}</h4>
                        <Badge variant="secondary" className="mt-1">{badge.label}</Badge>
                        <div className="flex items-center gap-1 text-sm text-[#404944] mt-2">
                          <Phone className="h-3 w-3" />
                          <span>{p.telepon}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="py-24 px-6 md:px-12">
          <div className="max-w-5xl mx-auto bg-gradient-to-br from-[#003527] to-[#064e3b] rounded-xl p-12 md:p-20 text-center text-white relative overflow-hidden shadow-[0px_24px_48px_rgba(19,30,25,0.06)]">
            <div className="relative z-10 space-y-8">
              <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight">
                Siap bergabung<br />dengan komunitas?
              </h2>
              <p className="text-emerald-100 text-lg max-w-xl mx-auto">
                Rasakan masa depan kehidupan perumahan. Daftarkan unit Anda hari ini dan buka pengalaman komunitas yang lengkap.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                {settings?.enableRegistration ? (
                  <Button
                    onClick={onRegisterClick}
                    className="bg-white text-[#003527] px-10 py-5 rounded-xl font-bold text-lg hover:bg-emerald-50 transition-colors"
                  >
                    Daftar Sekarang
                  </Button>
                ) : (
                  <Button
                    onClick={onLoginClick}
                    className="bg-white text-[#003527] px-10 py-5 rounded-xl font-bold text-lg hover:bg-emerald-50 transition-colors"
                  >
                    Masuk ke Portal
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={onLoginClick}
                  className="bg-transparent border-2 border-white/30 text-white px-10 py-5 rounded-xl font-bold text-lg hover:bg-white/10 transition-colors"
                >
                  Hubungi Admin
                </Button>
              </div>
            </div>
            {/* Abstract BG circles */}
            <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full rounded-t-[3rem] mt-20 bg-emerald-950">
        <div className="flex flex-col md:flex-row justify-between items-center px-6 md:px-16 py-20 w-full text-emerald-50 text-sm font-light">
          <div className="flex flex-col items-center md:items-start gap-6 mb-12 md:mb-0">
            <div className="flex items-center gap-3">
              <img
                src={settings?.logoUrl || '/logo.jpg'}
                alt="Logo"
                className="w-8 h-8 object-contain rounded-lg"
              />
              <span className="text-xl font-bold text-emerald-50">
                {settings?.siteName || 'Pradha Ciganitri'}
              </span>
            </div>
            <p className="text-emerald-200/60 max-w-xs text-center md:text-left">
              {settings?.siteDescription || 'Tempat perlindungan untuk kehidupan yang mengalir, di mana komunitas bertemu dengan inovasi digital.'}
            </p>
            <p className="text-emerald-200/60">
              © {new Date().getFullYear()} {settings?.siteName || 'Pradha Ciganitri'}. Hak cipta dilindungi.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-24">
            <div className="flex flex-col gap-4">
              <span className="font-bold text-emerald-100 mb-2">Portal</span>
              <a href="#" onClick={onLoginClick} className="text-emerald-200/60 hover:text-emerald-50 transition-colors">Portal Warga</a>
              <a href="#" onClick={onLoginClick} className="text-emerald-200/60 hover:text-emerald-50 transition-colors">Login Keuangan</a>
            </div>
            <div className="flex flex-col gap-4">
              <span className="font-bold text-emerald-100 mb-2">Legal</span>
              <a href="#" className="text-emerald-200/60 hover:text-emerald-50 transition-colors">Kebijakan Privasi</a>
              <a href="#" className="text-emerald-200/60 hover:text-emerald-50 transition-colors">Ketentuan Layanan</a>
            </div>
            <div className="flex flex-col gap-4">
              <span className="font-bold text-emerald-100 mb-2">Bantuan</span>
              <a href="#" className="text-emerald-200/60 hover:text-emerald-50 transition-colors">Hubungi Bantuan</a>
              <a href="#" className="text-emerald-200/60 hover:text-emerald-50 transition-colors">Info Darurat</a>
            </div>
            <div className="flex flex-col gap-6">
              <div className="flex gap-4">
                <a href="#" className="hover:opacity-80 transition-opacity">
                  <Trophy className="h-5 w-5" />
                </a>
                <a href="#" className="hover:opacity-80 transition-opacity">
                  <Globe className="h-5 w-5" />
                </a>
                <a href="#" className="hover:opacity-80 transition-opacity">
                  <Mail className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
