'use client';

import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Wallet, 
  Calendar, 
  Bell, 
  Users, 
  Star, 
  Image as ImageIcon,
  ArrowRight,
  MapPin,
  Phone,
  Clock,
  TrendingUp,
  TrendingDown,
  LogIn,
  UserPlus
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
    isLoading 
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <div>
              <h1 className="font-bold text-lg">{settings?.siteName || 'Pradha Ciganitri'}</h1>
              <p className="text-xs text-muted-foreground">{settings?.siteDescription || 'Sistem Manajemen Warga'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {settings?.enableRegistration && (
              <Button variant="ghost" onClick={onRegisterClick}>
                <UserPlus className="h-4 w-4 mr-2" />
                Daftar
              </Button>
            )}
            <Button onClick={onLoginClick}>
              <LogIn className="h-4 w-4 mr-2" />
              Masuk
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-4" variant="secondary">Selamat Datang</Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            {settings?.siteName || 'Pradha Ciganitri'}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            {settings?.siteDescription || 'Sistem manajemen warga modern untuk mengelola keuangan, pembayaran, agenda, dan informasi warga secara digital.'}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" onClick={onLoginClick}>
              Mulai Sekarang
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            {settings?.enableRegistration && (
              <Button size="lg" variant="outline" onClick={onRegisterClick}>
                Daftar Sebagai Warga
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Finance Summary */}
      {settings?.enablePublicFinance && finance && (
        <section className="py-12 px-4 bg-emerald-500/5">
          <div className="container mx-auto">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">Ringkasan Keuangan</h3>
              <p className="text-muted-foreground">Periode: {finance.periodLabel}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Saldo Akhir
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-emerald-600">{formatCurrency(finance.saldoAkhir)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Pemasukan Bulan Ini
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(finance.totalPemasukanBulanIni)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" />
                    Pengeluaran Bulan Ini
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(finance.totalPengeluaranBulanIni)}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-2">Fitur Unggulan</h3>
            <p className="text-muted-foreground">Semua yang Anda butuhkan untuk mengelola warga</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-2">
                  <Wallet className="h-6 w-6 text-emerald-600" />
                </div>
                <CardTitle className="text-lg">Keuangan</CardTitle>
                <CardDescription>Kelola keuangan warga dengan transparan</CardDescription>
              </CardHeader>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-2">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg">Agenda</CardTitle>
                <CardDescription>Jadwal kegiatan dan acara warga</CardDescription>
              </CardHeader>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center mb-2">
                  <Bell className="h-6 w-6 text-amber-600" />
                </div>
                <CardTitle className="text-lg">Informasi</CardTitle>
                <CardDescription>Pengumuman dan berita terkini</CardDescription>
              </CardHeader>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-2">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-lg">Warga</CardTitle>
                <CardDescription>Manajemen data warga lengkap</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pengurus */}
      {pengurus.length > 0 && (
        <section className="py-12 px-4 bg-muted/30">
          <div className="container mx-auto">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">Pengurus</h3>
              <p className="text-muted-foreground">Tim pengurus yang siap membantu</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {pengurus.map((p) => {
                const badge = getRoleBadge(p.role);
                return (
                  <Card key={p.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-14 w-14">
                          <AvatarImage src={p.photoUrl || undefined} alt={p.nama} />
                          <AvatarFallback className="bg-emerald-500 text-white">
                            {p.nama.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">{p.nama}</h4>
                          <Badge variant={badge.variant} className="mt-1">{badge.label}</Badge>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <Phone className="h-3 w-3" />
                            <span className="truncate">{p.telepon}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Agenda */}
      {settings?.enableAgenda && agendas.length > 0 && (
        <section className="py-12 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">Agenda Mendatang</h3>
              <p className="text-muted-foreground">Kegiatan yang akan datang</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {agendas.slice(0, 3).map((agenda) => (
                <Card key={agenda.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{agenda.title}</CardTitle>
                        {agenda.location && (
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {agenda.location}
                          </CardDescription>
                        )}
                      </div>
                      <Badge variant={agenda.status === 'UPCOMING' ? 'default' : 'secondary'}>
                        {agenda.status === 'UPCOMING' ? 'Akan Datang' : 'Berlangsung'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{formatDate(agenda.startDate)}</span>
                      {agenda.startTime && <span>- {agenda.startTime}</span>}
                    </div>
                    {agenda.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {agenda.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Information */}
      {settings?.enableInformation && informations.length > 0 && (
        <section className="py-12 px-4 bg-muted/30">
          <div className="container mx-auto">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">Informasi Terkini</h3>
              <p className="text-muted-foreground">Pengumuman dan berita terbaru</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {informations.slice(0, 4).map((info) => (
                <Card key={info.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{info.title}</CardTitle>
                      {info.isPinned && (
                        <Badge variant="secondary" className="ml-2">Disematkan</Badge>
                      )}
                    </div>
                    <CardDescription className="text-xs">{formatDate(info.publishedAt)}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">{info.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Reviews */}
      {settings?.enableReviews && reviews.length > 0 && (
        <section className="py-12 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">Testimoni Warga</h3>
              <p className="text-muted-foreground">Apa kata warga tentang kami</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {reviews.slice(0, 3).map((review) => (
                <Card key={review.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= review.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{review.comment}</p>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={review.userPhotoUrl || undefined} alt={review.userName} />
                        <AvatarFallback>
                          {review.userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{review.userName}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gallery */}
      {settings?.enableGallery && galleries.length > 0 && (
        <section className="py-12 px-4 bg-muted/30">
          <div className="container mx-auto">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">Galeri</h3>
              <p className="text-muted-foreground">Dokumentasi kegiatan warga</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {galleries.slice(0, 8).map((gallery) => (
                <div
                  key={gallery.id}
                  className="aspect-square rounded-lg overflow-hidden bg-muted hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <img
                    src={gallery.thumbnailUrl || gallery.imageUrl}
                    alt={gallery.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <Card className="max-w-2xl mx-auto text-center bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0">
            <CardHeader>
              <CardTitle className="text-2xl">Siap untuk Bergabung?</CardTitle>
              <CardDescription className="text-emerald-100">
                Daftar sekarang dan nikmati kemudahan mengakses informasi warga
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap justify-center gap-4">
                <Button size="lg" variant="secondary" onClick={onLoginClick}>
                  Masuk
                </Button>
                {settings?.enableRegistration && (
                  <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white/10" onClick={onRegisterClick}>
                    Daftar Sekarang
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} {settings?.siteName || 'Pradha Ciganitri'}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
