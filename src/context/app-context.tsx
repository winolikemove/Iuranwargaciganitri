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
  monthlyFee: 0,
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
    const loadPublicData = async () => {
      setIsLoading(true);
      
      try {
        // Load all public data in parallel
        const [settingsRes, financeRes, agendasRes, infosRes, galleriesRes, reviewsRes, pengurusRes] = await Promise.all([
          api.getPublicSettings(),
          api.getPublicFinanceSummary(),
          api.getPublicAgenda(10),
          api.getPublicInfo(10),
          api.getPublicGallery(12),
          api.getPublicReviews(10),
          api.getPublicPengurus(),
        ]);
        
        if (settingsRes.ok && settingsRes.data) {
          setSettings(settingsRes.data);
        } else {
          setSettings(defaultSettings);
        }
        
        if (financeRes.ok && financeRes.data) {
          setFinance(financeRes.data);
        }
        
        if (agendasRes.ok && agendasRes.data) {
          setAgendas(agendasRes.data);
        }
        
        if (infosRes.ok && infosRes.data) {
          setInformations(infosRes.data);
        }
        
        if (galleriesRes.ok && galleriesRes.data) {
          setGalleries(galleriesRes.data);
        }
        
        if (reviewsRes.ok && reviewsRes.data) {
          setReviews(reviewsRes.data);
        }
        
        if (pengurusRes.ok && pengurusRes.data) {
          setPengurus(pengurusRes.data);
        }
      } catch (error) {
        console.error('Failed to load public data:', error);
        setSettings(defaultSettings);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPublicData();
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
