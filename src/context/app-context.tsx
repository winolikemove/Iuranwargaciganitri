'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, CacheManager } from '@/lib/api-client';
import type { AppSettings, PublicFinanceSummary, Agenda, Information, Gallery, Review, SafeUser } from '@/types';

interface AppContextType {
  settings: AppSettings | null;
  finance: PublicFinanceSummary | null;
  agendas: Agenda[];
  informations: Information[];
  galleries: Gallery[];
  reviews: Review[];
  pengurus: SafeUser[];
  isLoading: boolean;
  
  // Refresh functions
  refreshSettings: () => Promise<void>;
  refreshFinance: () => Promise<void>;
  refreshAgendas: () => Promise<void>;
  refreshInformations: () => Promise<void>;
  refreshGalleries: () => Promise<void>;
  refreshReviews: () => Promise<void>;
  refreshPengurus: () => Promise<void>;
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

  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshSettings(),
      refreshFinance(),
      refreshAgendas(),
      refreshInformations(),
      refreshGalleries(),
      refreshReviews(),
      refreshPengurus(),
    ]);
  }, [refreshSettings, refreshFinance, refreshAgendas, refreshInformations, refreshGalleries, refreshReviews, refreshPengurus]);

  const value: AppContextType = {
    settings,
    finance,
    agendas,
    informations,
    galleries,
    reviews,
    pengurus,
    isLoading,
    refreshSettings,
    refreshFinance,
    refreshAgendas,
    refreshInformations,
    refreshGalleries,
    refreshReviews,
    refreshPengurus,
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
