'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, CacheManager } from '@/lib/api-client';
import type { AppSettings, PublicFinanceSummary, Agenda, Information, Gallery, Review, SafeUser, StrukturOrganisasi } from '@/types';

interface AppContextType {
  settings: AppSettings | null;
  finance: PublicFinanceSummary | null;
  agendas: Agenda[];
  informations: Information[];
  galleries: Gallery[];
  reviews: Review[];
  pengurus: SafeUser[];
  strukturOrganisasi: StrukturOrganisasi | null;
  isLoading: boolean;
  
  // Refresh functions
  refreshSettings: () => Promise<void>;
  refreshFinance: () => Promise<void>;
  refreshAgendas: () => Promise<void>;
  refreshInformations: () => Promise<void>;
  refreshGalleries: () => Promise<void>;
  refreshReviews: () => Promise<void>;
  refreshPengurus: () => Promise<void>;
  refreshStrukturOrganisasi: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  siteName: 'Pradha Ciganitri',
  siteDescription: 'Sistem Manajemen Warga',
  logoUrl: '',
  monthlyFee: 150000,
  enableRegistration: true,
  enablePaymentSubmission: true,
  enableAgenda: true,
  enableGallery: true,
  enableInformation: true,
  enablePublicFinance: true,
  enableReviews: true,
  incomeCategories: ['Iuran', 'Sumbangan', 'Lainnya'],
  expenseCategories: ['Kebersihan', 'Keamanan', 'Lainnya'],
  informationCategories: ['Pengumuman', 'Kegiatan', 'Lainnya'],
  bloks: ['A', 'B', 'C', 'D'],
};

// Dummy data untuk struktur organisasi (fallback jika API belum punya data)
const dummyStrukturOrganisasi: StrukturOrganisasi = {
  blokA: {
    label: 'Blok A',
    pengurus: [
      {
        id: 'dummy-1',
        nama: 'Bpk Afip',
        blok: 'A',
        telepon: '087364848848',
        photoUrl: '',
        jabatan: 'KETUA_RT',
        jabatanLabel: 'Ketua RT',
        order: 1
      },
      {
        id: 'dummy-2',
        nama: 'Bpk Dedi',
        blok: 'A',
        telepon: '081321654987',
        photoUrl: '',
        jabatan: 'WAKIL_KETUA',
        jabatanLabel: 'Wakil Ketua RT',
        order: 2
      },
      {
        id: 'dummy-3',
        nama: 'Ibu Siti',
        blok: 'A',
        telepon: '085678912345',
        photoUrl: '',
        jabatan: 'SEKRETARIS',
        jabatanLabel: 'Sekretaris',
        order: 3
      },
      {
        id: 'dummy-4',
        nama: 'Bpk Hendra',
        blok: 'A',
        telepon: '082198765432',
        photoUrl: '',
        jabatan: 'BENDAHARA',
        jabatanLabel: 'Bendahara',
        order: 4
      }
    ]
  },
  blokB: {
    label: 'Blok B',
    pengurus: [
      {
        id: 'dummy-5',
        nama: 'Bpk Risan',
        blok: 'B',
        telepon: '08122495879',
        photoUrl: '',
        jabatan: 'KETUA_RT',
        jabatanLabel: 'Ketua RT',
        order: 1
      },
      {
        id: 'dummy-6',
        nama: 'Bpk Ahmad',
        blok: 'B',
        telepon: '085712345678',
        photoUrl: '',
        jabatan: 'WAKIL_KETUA',
        jabatanLabel: 'Wakil Ketua RT',
        order: 2
      },
      {
        id: 'dummy-7',
        nama: 'Ibu Ratna',
        blok: 'B',
        telepon: '081234567891',
        photoUrl: '',
        jabatan: 'SEKRETARIS',
        jabatanLabel: 'Sekretaris',
        order: 3
      },
      {
        id: 'dummy-8',
        nama: 'Bpk Yanto',
        blok: 'B',
        telepon: '087812345678',
        photoUrl: '',
        jabatan: 'BENDAHARA',
        jabatanLabel: 'Bendahara',
        order: 4
      }
    ]
  },
  bersama: {
    label: 'Bersama',
    pengurus: [
      {
        id: 'dummy-9',
        nama: 'Bpk Karim',
        blok: 'A',
        telepon: '085612345678',
        photoUrl: '',
        jabatan: 'SIE_KEAMANAN',
        jabatanLabel: 'Sie. Keamanan',
        order: 10
      },
      {
        id: 'dummy-10',
        nama: 'Bpk Dani',
        blok: 'B',
        telepon: '082112345678',
        photoUrl: '',
        jabatan: 'SIE_KEBERSIHAN',
        jabatanLabel: 'Sie. Kebersihan',
        order: 11
      },
      {
        id: 'dummy-11',
        nama: 'Bpk Basir',
        blok: 'B',
        telepon: '085220590365',
        photoUrl: '',
        jabatan: 'DKM_MASJID',
        jabatanLabel: 'DKM Masjid Al Birr',
        order: 12
      }
    ]
  }
};

// Dummy data untuk reviews (fallback jika API belum punya data)
const dummyReviews: Review[] = [
  {
    id: 'review-1',
    userId: 'user-1',
    userName: 'Bpk Ahmad Hidayat',
    userPhotoUrl: '',
    rating: 5,
    comment: 'Lingkungan yang sangat nyaman dan harmonis. Pengurus RT sangat responsif dan peduli dengan keluhan warga. Sangat bangga menjadi bagian dari Pradha Ciganitri!',
    status: 'APPROVED',
    createdAt: '2026-03-15T10:30:00Z'
  },
  {
    id: 'review-2',
    userId: 'user-2',
    userName: 'Ibu Siti Nurhaliza',
    userPhotoUrl: '',
    rating: 5,
    comment: 'Keamanan komplek sangat terjaga, petugas security ramah dan sigap. Fasilitas umum juga bersih dan terawat dengan baik. Recommended!',
    status: 'APPROVED',
    createdAt: '2026-03-10T14:20:00Z'
  },
  {
    id: 'review-3',
    userId: 'user-3',
    userName: 'Bpk Dedi Kurniawan',
    userPhotoUrl: '',
    rating: 4,
    comment: 'Sistem pembayaran iuran online sangat memudahkan. Transparansi keuangan juga bagus, bisa langsung cek di aplikasi. Mantap!',
    status: 'APPROVED',
    createdAt: '2026-03-05T09:15:00Z'
  },
  {
    id: 'review-4',
    userId: 'user-4',
    userName: 'Ibu Ratna Dewi',
    userPhotoUrl: '',
    rating: 5,
    comment: 'Acara-acara komunitas selalu seru dan menghibur. Kegiatan bersih-bersih dan pengajian rutin membuat warga semakin akrab. Terima kasih pengurus!',
    status: 'APPROVED',
    createdAt: '2026-02-28T16:45:00Z'
  },
  {
    id: 'review-5',
    userId: 'user-5',
    userName: 'Bpk Hendra Wijaya',
    userPhotoUrl: '',
    rating: 5,
    comment: 'Anak-anak sangat senang bermain di taman komplek. Lingkungan asri dan aman untuk keluarga. Perfect place untuk tinggal!',
    status: 'APPROVED',
    createdAt: '2026-02-20T11:00:00Z'
  }
];

// Dummy data untuk agendas (fallback jika API belum punya data)
const dummyAgendas: Agenda[] = [
  {
    id: 'agenda-1',
    title: 'Kerja Bakti Bersih Lingkungan',
    description: 'Kegiatan gotong royong bersih-bersih komplek bersama seluruh warga. Mari bergabung untuk menjaga kebersihan dan keindahan lingkungan kita.',
    startDate: '2026-04-12',
    endDate: '2026-04-12',
    startTime: '07:00',
    endTime: '10:00',
    location: 'Halaman Komplek Blok A & B',
    targetBlok: 'ALL',
    status: 'UPCOMING',
    createdBy: 'Ketua RT',
    createdAt: '2026-04-01T08:00:00Z'
  },
  {
    id: 'agenda-2',
    title: 'Rapat Bulanan Pengurus RT',
    description: 'Rapat koordinasi rutin bulanan untuk membahas program kerja, evaluasi kegiatan, dan perencanaan ke depan.',
    startDate: '2026-04-15',
    endDate: '2026-04-15',
    startTime: '19:30',
    endTime: '21:00',
    location: 'Aula Masjid Al Birr',
    targetBlok: 'ALL',
    status: 'UPCOMING',
    createdBy: 'Sekretaris RT',
    createdAt: '2026-04-05T10:00:00Z'
  },
  {
    id: 'agenda-3',
    title: 'Pengajian Rutin Ibu-Ibu',
    description: 'Kegiatan pengajian mingguan untuk ibu-ibu warga Pradha Ciganitri. Tempat berbagi ilmu dan mempererat silaturahmi.',
    startDate: '2026-04-18',
    endDate: '2026-04-18',
    startTime: '09:00',
    endTime: '11:00',
    location: 'Masjid Al Birr',
    targetBlok: 'ALL',
    status: 'UPCOMING',
    createdBy: 'Ibu Siti',
    createdAt: '2026-04-10T09:00:00Z'
  },
  {
    id: 'agenda-4',
    title: 'Turnamen Futsal Antar Blok',
    description: 'Kompetisi futsal antar blok untuk mempererat tali silaturahmi dan sportivitas antar warga.',
    startDate: '2026-04-20',
    endDate: '2026-04-21',
    startTime: '15:00',
    endTime: '18:00',
    location: 'Lapangan Futsal Pradha',
    targetBlok: 'ALL',
    status: 'UPCOMING',
    createdBy: 'Sie. Olahraga',
    createdAt: '2026-04-08T14:00:00Z'
  },
  {
    id: 'agenda-5',
    title: 'Vaksinasi Gratis untuk Warga',
    description: 'Program vaksinasi gratis bekerja sama dengan Puskesmas setempat. Dapatkan layanan kesehatan gratis untuk keluarga.',
    startDate: '2026-04-25',
    endDate: '2026-04-25',
    startTime: '08:00',
    endTime: '12:00',
    location: 'Posyandu Blok A',
    targetBlok: 'ALL',
    status: 'UPCOMING',
    createdBy: 'Admin',
    createdAt: '2026-04-12T07:00:00Z'
  }
];

// Dummy data untuk gallery (fallback jika API belum punya data)
const dummyGalleries: Gallery[] = [
  {
    id: 'gallery-1',
    agendaId: '',
    title: 'Kerja Bakti Bersih Lingkungan',
    description: 'Kegiatan gotong royong bersih-bersih komplek yang diikuti oleh warga blok A dan B',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    takenAt: '2026-03-01',
    uploadedBy: 'Admin',
    createdAt: '2026-03-01T08:00:00Z'
  },
  {
    id: 'gallery-2',
    agendaId: '',
    title: 'Peringatan Maulid Nabi',
    description: 'Acara peringatan Maulid Nabi Muhammad SAW di Masjid Al Birr',
    imageUrl: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=400',
    takenAt: '2026-02-28',
    uploadedBy: 'Admin',
    createdAt: '2026-02-28T18:00:00Z'
  },
  {
    id: 'gallery-3',
    agendaId: '',
    title: 'Rapat Koordinasi Pengurus RT',
    description: 'Rapat rutin pengurus RT membahas program kerja dan keuangan',
    imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400',
    takenAt: '2026-02-15',
    uploadedBy: 'Admin',
    createdAt: '2026-02-15T19:00:00Z'
  },
  {
    id: 'gallery-4',
    agendaId: '',
    title: 'Turnamen Futsal Antar Blok',
    description: 'Kompetisi futsal antar blok untuk mempererat tali silaturahmi',
    imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400',
    takenAt: '2026-02-10',
    uploadedBy: 'Admin',
    createdAt: '2026-02-10T15:00:00Z'
  },
  {
    id: 'gallery-5',
    agendaId: '',
    title: 'Pengajian Rutin Ibu-Ibu',
    description: 'Kegiatan pengajian mingguan ibu-ibu warga Pradha Ciganitri',
    imageUrl: 'https://images.unsplash.com/photo-1585036156171-384164a8c675?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1585036156171-384164a8c675?w=400',
    takenAt: '2026-01-25',
    uploadedBy: 'Admin',
    createdAt: '2026-01-25T10:00:00Z'
  },
  {
    id: 'gallery-6',
    agendaId: '',
    title: 'Penyerahan Sembako',
    description: 'Penyerahan paket sembako untuk warga kurang mampu',
    imageUrl: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=400',
    takenAt: '2026-01-15',
    uploadedBy: 'Admin',
    createdAt: '2026-01-15T12:00:00Z'
  },
  {
    id: 'gallery-7',
    agendaId: '',
    title: 'Senam Pagi Bersama',
    description: 'Kegiatan senam pagi setiap minggu untuk kesehatan warga',
    imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400',
    takenAt: '2026-03-08',
    uploadedBy: 'Admin',
    createdAt: '2026-03-08T07:00:00Z'
  },
  {
    id: 'gallery-8',
    agendaId: '',
    title: 'Lomba 17 Agustus',
    description: 'Perayaan HUT RI dengan berbagai lomba tradisional',
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400',
    takenAt: '2026-08-17',
    uploadedBy: 'Admin',
    createdAt: '2026-08-17T08:00:00Z'
  },
  {
    id: 'gallery-9',
    agendaId: '',
    title: 'Bakti Sosial',
    description: 'Kegiatan bakti sosial dan pembagian sembako',
    imageUrl: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=400',
    takenAt: '2026-02-20',
    uploadedBy: 'Admin',
    createdAt: '2026-02-20T10:00:00Z'
  },
  {
    id: 'gallery-10',
    agendaId: '',
    title: 'Pelatihan Digital',
    description: 'Workshop digital untuk warga lanjut usia',
    imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400',
    takenAt: '2026-03-05',
    uploadedBy: 'Admin',
    createdAt: '2026-03-05T14:00:00Z'
  }
];

// Dummy data untuk finance bulanan (untuk grafik)
const dummyMonthlyFinance = [
  { month: 'Januari', pemasukan: 4500000, pengeluaran: 2800000 },
  { month: 'Februari', pemasukan: 5200000, pengeluaran: 3100000 },
  { month: 'Maret', pemasukan: 4800000, pengeluaran: 2500000 },
  { month: 'April', pemasukan: 5100000, pengeluaran: 3200000 },
  { month: 'Mei', pemasukan: 4700000, pengeluaran: 2900000 },
  { month: 'Juni', pemasukan: 5500000, pengeluaran: 3400000 },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [finance, setFinance] = useState<PublicFinanceSummary | null>(null);
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [informations, setInformations] = useState<Information[]>([]);
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [pengurus, setPengurus] = useState<SafeUser[]>([]);
  const [strukturOrganisasi, setStrukturOrganisasi] = useState<StrukturOrganisasi | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial public data
  useEffect(() => {
    let mounted = true;
    
    const loadPublicData = async () => {
      if (!mounted) return;
      setIsLoading(true);
      
      try {
        // Load all public data in parallel with error handling for each
        const results = await Promise.allSettled([
          api.getPublicSettings(),
          api.getPublicFinanceSummary(),
          api.getPublicAgenda(10),
          api.getPublicInfo(10),
          api.getPublicGallery(12),
          api.getPublicReviews(10),
          api.getPublicPengurus(),
          api.getStrukturOrganisasi(),
        ]);
        
        if (!mounted) return;
        
        // Process settings
        if (results[0].status === 'fulfilled' && results[0].value.ok && results[0].value.data) {
          setSettings(results[0].value.data);
        } else {
          setSettings(defaultSettings);
        }
        
        // Process finance - use dummy if empty
        if (results[1].status === 'fulfilled' && results[1].value.ok && results[1].value.data) {
          const financeData = results[1].value.data;
          if (financeData.saldoAkhir !== undefined) {
            setFinance(financeData);
          } else {
            setFinance({
              saldoAkhir: 15500000,
              totalPemasukanBulanIni: 4800000,
              totalPengeluaranBulanIni: 2500000,
              periodLabel: 'April 2026',
              lastUpdated: new Date().toISOString()
            });
          }
        } else {
          setFinance({
            saldoAkhir: 15500000,
            totalPemasukanBulanIni: 4800000,
            totalPengeluaranBulanIni: 2500000,
            periodLabel: 'April 2026',
            lastUpdated: new Date().toISOString()
          });
        }
        
        // Process agendas - use dummy if empty
        if (results[2].status === 'fulfilled' && results[2].value.ok && results[2].value.data) {
          const agendaData = results[2].value.data;
          if (agendaData && agendaData.length > 0) {
            setAgendas(agendaData);
          } else {
            setAgendas(dummyAgendas);
          }
        } else {
          setAgendas(dummyAgendas);
        }
        
        // Process informations
        if (results[3].status === 'fulfilled' && results[3].value.ok && results[3].value.data) {
          setInformations(results[3].value.data);
        }
        
        // Process galleries - use dummy if empty
        if (results[4].status === 'fulfilled' && results[4].value.ok && results[4].value.data) {
          const galleryData = results[4].value.data;
          if (galleryData && galleryData.length > 0) {
            setGalleries(galleryData);
          } else {
            setGalleries(dummyGalleries);
          }
        } else {
          setGalleries(dummyGalleries);
        }
        
        // Process reviews - use dummy if empty
        if (results[5].status === 'fulfilled' && results[5].value.ok && results[5].value.data) {
          const reviewData = results[5].value.data;
          if (reviewData && reviewData.length > 0) {
            setReviews(reviewData);
          } else {
            setReviews(dummyReviews);
          }
        } else {
          setReviews(dummyReviews);
        }
        
        // Process pengurus
        if (results[6].status === 'fulfilled' && results[6].value.ok && results[6].value.data) {
          setPengurus(results[6].value.data);
        }
        
        // Process struktur organisasi
        if (results[7].status === 'fulfilled' && results[7].value.ok && results[7].value.data) {
          // Check if data has actual pengurus, otherwise use dummy
          const data = results[7].value.data;
          const hasPengurus = 
            data.blokA?.pengurus?.length > 0 || 
            data.blokB?.pengurus?.length > 0 || 
            data.bersama?.pengurus?.length > 0;
          
          if (hasPengurus) {
            setStrukturOrganisasi(data);
          } else {
            // Use dummy data if no real data exists
            setStrukturOrganisasi(dummyStrukturOrganisasi);
          }
        } else {
          // Use dummy data if API fails
          setStrukturOrganisasi(dummyStrukturOrganisasi);
        }
        
      } catch (error) {
        console.error('Failed to load public data:', error);
        if (mounted) {
          setSettings(defaultSettings);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadPublicData();
    
    return () => {
      mounted = false;
    };
  }, []);

  const refreshSettings = useCallback(async () => {
    CacheManager.remove('public_settings');
    const result = await api.getPublicSettings();
    if (result.ok && result.data) {
      setSettings(result.data);
    }
  }, []);

  const refreshFinance = useCallback(async () => {
    CacheManager.remove('public_finance');
    const result = await api.getPublicFinanceSummary();
    if (result.ok && result.data) {
      setFinance(result.data);
    }
  }, []);

  const refreshAgendas = useCallback(async () => {
    CacheManager.clearPattern('public_agenda');
    const result = await api.getPublicAgenda(10);
    if (result.ok && result.data && result.data.length > 0) {
      setAgendas(result.data);
    } else {
      setAgendas(dummyAgendas);
    }
  }, []);

  const refreshInformations = useCallback(async () => {
    CacheManager.clearPattern('public_info');
    const result = await api.getPublicInfo(10);
    if (result.ok && result.data) {
      setInformations(result.data);
    }
  }, []);

  const refreshGalleries = useCallback(async () => {
    CacheManager.clearPattern('public_gallery');
    const result = await api.getPublicGallery(12);
    if (result.ok && result.data) {
      setGalleries(result.data);
    }
  }, []);

  const refreshReviews = useCallback(async () => {
    CacheManager.clearPattern('public_reviews');
    const result = await api.getPublicReviews(10);
    if (result.ok && result.data) {
      setReviews(result.data);
    }
  }, []);

  const refreshPengurus = useCallback(async () => {
    CacheManager.remove('public_pengurus');
    const result = await api.getPublicPengurus();
    if (result.ok && result.data) {
      setPengurus(result.data);
    }
  }, []);

  const refreshStrukturOrganisasi = useCallback(async () => {
    CacheManager.remove('struktur_organisasi');
    const result = await api.getStrukturOrganisasi();
    if (result.ok && result.data) {
      // Check if data has actual pengurus, otherwise use dummy
      const data = result.data;
      const hasPengurus = 
        data.blokA?.pengurus?.length > 0 || 
        data.blokB?.pengurus?.length > 0 || 
        data.bersama?.pengurus?.length > 0;
      
      if (hasPengurus) {
        setStrukturOrganisasi(data);
      } else {
        setStrukturOrganisasi(dummyStrukturOrganisasi);
      }
    } else {
      setStrukturOrganisasi(dummyStrukturOrganisasi);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshSettings(),
      refreshFinance(),
      refreshAgendas(),
      refreshInformations(),
      refreshGalleries(),
      refreshReviews(),
      refreshPengurus(),
      refreshStrukturOrganisasi(),
    ]);
  }, [refreshSettings, refreshFinance, refreshAgendas, refreshInformations, refreshGalleries, refreshReviews, refreshPengurus, refreshStrukturOrganisasi]);

  const value: AppContextType = {
    settings,
    finance,
    agendas,
    informations,
    galleries,
    reviews,
    pengurus,
    strukturOrganisasi,
    isLoading,
    refreshSettings,
    refreshFinance,
    refreshAgendas,
    refreshInformations,
    refreshGalleries,
    refreshReviews,
    refreshPengurus,
    refreshStrukturOrganisasi,
    refreshAll,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  
  return context;
}
