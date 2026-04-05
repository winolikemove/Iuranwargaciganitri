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
        
        // Process finance
        if (results[1].status === 'fulfilled' && results[1].value.ok && results[1].value.data) {
          setFinance(results[1].value.data);
        }
        
        // Process agendas
        if (results[2].status === 'fulfilled' && results[2].value.ok && results[2].value.data) {
          setAgendas(results[2].value.data);
        }
        
        // Process informations
        if (results[3].status === 'fulfilled' && results[3].value.ok && results[3].value.data) {
          setInformations(results[3].value.data);
        }
        
        // Process galleries
        if (results[4].status === 'fulfilled' && results[4].value.ok && results[4].value.data) {
          setGalleries(results[4].value.data);
        }
        
        // Process reviews
        if (results[5].status === 'fulfilled' && results[5].value.ok && results[5].value.data) {
          setReviews(results[5].value.data);
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
    if (result.ok && result.data) {
      setAgendas(result.data);
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
