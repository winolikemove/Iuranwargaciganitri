// API Client with Cache and Timeout Management for Google Apps Script Backend

import type { ApiResponse, SafeUser, AppSettings, Permissions, User, Transaction, Payment, Agenda, Information, Gallery, Review, FinanceSummary, PublicFinanceSummary, AuthResponse, LoginRequest, RegisterRequest } from '@/types';

// Configuration
const API_URL = process.env.NEXT_PUBLIC_GAS_API_URL || '';
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const CACHE_PREFIX = 'warga_cache_';

// Demo mode - set to true if API URL is not configured or invalid
const DEMO_MODE = !API_URL || API_URL.includes('YOUR_SCRIPT_ID');

// Cache entry interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// In-memory cache for client-side
const memoryCache = new Map<string, CacheEntry<unknown>>();

// Helper function to get dynamic dates for demo data
const getDemoDates = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  
  // Format date as YYYY-MM-DD
  const formatDate = (y: number, m: number, d: number) => {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };
  
  // Format datetime as ISO string
  const formatDateTime = (y: number, m: number, d: number, h: number = 0, min: number = 0) => {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}T${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:00Z`;
  };
  
  // Get next occurrence of a day (0=Sunday, 1=Monday, etc.)
  const getNextDay = (dayOfWeek: number) => {
    const result = new Date(now);
    result.setDate(now.getDate() + ((dayOfWeek + 7 - now.getDay()) % 7 || 7));
    return result;
  };
  
  // Add days to a date
  const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };
  
  return {
    year,
    month,
    monthName: monthNames[month],
    periodLabel: `${monthNames[month]} ${year}`,
    formatDate,
    formatDateTime,
    getNextDay,
    addDays,
    now: now.toISOString(),
  };
};

// Generate dynamic demo data
const generateDemoData = () => {
  const dates = getDemoDates();
  
  // Next Saturday for kerja bakti
  const kerjaBaktiDate = dates.getNextDay(6); // Saturday
  // Next Sunday for rapat
  const rapatDate = dates.addDays(kerjaBaktiDate, 1); // Sunday after
  
  return {
    settings: {
      siteName: 'Pradha Ciganitri',
      siteDescription: 'Sistem Manajemen Warga Modern',
      logoUrl: '',
      bannerUrl: '',
      primaryColor: '#2563eb',
      monthlyFee: 150000,
      enableRegistration: true,
      enablePaymentSubmission: true,
      enableAgenda: true,
      enableGallery: true,
      enableInformation: true,
      enablePublicFinance: true,
      enableReviews: true,
      bloks: ['A', 'B'],
      // Bank Info per Blok (NEW)
      bankInfoA: {
        bankName: 'BCA',
        bankAccount: '1234567890',
        bankHolder: 'RT Pradha Ciganitri Blok A',
      },
      bankInfoB: {
        bankName: 'Mandiri',
        bankAccount: '0987654321',
        bankHolder: 'RT Pradha Ciganitri Blok B',
      },
      // Legacy bank info (for backward compatibility)
      bankName: 'BCA',
      bankAccount: '1234567890',
      bankHolder: 'RT Pradha Ciganitri',
      // Categories per Blok (NEW)
      categoriesA: {
        income: ['Iuran Bulanan', 'Dana Sosial', 'Sumbangan', 'Lainnya'],
        expense: ['Kebersihan', 'Keamanan', 'Perbaikan', 'Listrik', 'Kegiatan', 'Lainnya'],
        information: ['Pengumuman', 'Berita', 'Info Penting'],
      },
      categoriesB: {
        income: ['Iuran Bulanan', 'Dana Sosial', 'Sumbangan', 'Lainnya'],
        expense: ['Kebersihan', 'Keamanan', 'Perbaikan', 'Listrik', 'Kegiatan', 'Lainnya'],
        information: ['Pengumuman', 'Berita', 'Info Penting'],
      },
      // Legacy categories (for backward compatibility)
      incomeCategories: ['Iuran', 'Sumbangan', 'Kegiatan', 'Lainnya'],
      expenseCategories: ['Kebersihan', 'Keamanan', 'Pemeliharaan', 'Kegiatan', 'Lainnya'],
      informationCategories: ['Pengumuman', 'Kegiatan', 'Peringatan', 'Lainnya'],
      // Saldo Awal
      saldoAwalA: 1000000,
      saldoAwalB: 500000,
      // Contact & Location
      whatsappAdmin: '081234567890',
      rtName: 'RT 011',
      rwName: 'RW 005',
      address: 'Komplek Pradha Ciganitri',
      kelurahan: 'Ciganitri',
      kecamatan: 'Bojongsoang',
      kota: 'Bandung',
      googleMapsEmbedUrl: '',
      socialMediaLinks: [],
    } as AppSettings,
    
    publicFinance: {
      saldoAkhir: 2000000,
      totalPemasukanBulanIni: 4500000,
      totalPengeluaranBulanIni: 2500000,
      periodLabel: dates.periodLabel,
      lastUpdated: dates.now,
    } as PublicFinanceSummary,
    
    agendas: [
      {
        id: '1',
        title: 'Kerja Bakti Bulanan',
        description: 'Kerja bakti bersih-bersih lingkungan komplek',
        location: 'Area Komplek Pradha Ciganitri',
        startDate: dates.formatDate(kerjaBaktiDate.getFullYear(), kerjaBaktiDate.getMonth(), kerjaBaktiDate.getDate()),
        startTime: '07:00',
        endDate: dates.formatDate(kerjaBaktiDate.getFullYear(), kerjaBaktiDate.getMonth(), kerjaBaktiDate.getDate()),
        endTime: '10:00',
        status: 'UPCOMING',
        targetBlok: 'all',
        createdBy: 'admin',
        createdAt: dates.formatDateTime(dates.year, dates.month, 1),
        updatedAt: dates.formatDateTime(dates.year, dates.month, 1),
      },
      {
        id: '2',
        title: 'Rapat Bulanan Warga',
        description: 'Rapat koordinasi bulanan warga komplek',
        location: 'Aula Pradha Ciganitri',
        startDate: dates.formatDate(rapatDate.getFullYear(), rapatDate.getMonth(), rapatDate.getDate()),
        startTime: '19:00',
        endDate: dates.formatDate(rapatDate.getFullYear(), rapatDate.getMonth(), rapatDate.getDate()),
        endTime: '21:00',
        status: 'UPCOMING',
        targetBlok: 'all',
        createdBy: 'admin',
        createdAt: dates.formatDateTime(dates.year, dates.month, 2),
        updatedAt: dates.formatDateTime(dates.year, dates.month, 2),
      },
    ] as Agenda[],
    
    informations: [
      {
        id: '1',
        title: `Pembayaran Iuran Bulan ${dates.monthName}`,
        content: `Diharapkan kepada seluruh warga untuk segera melakukan pembayaran iuran bulan ${dates.monthName} paling lambat tanggal 15 ${dates.monthName} ${dates.year}.`,
        category: 'Pengumuman',
        isPinned: true,
        targetBlok: 'all',
        publishedAt: dates.formatDateTime(dates.year, dates.month, 1),
        expiredAt: null,
        createdBy: 'admin',
        createdAt: dates.formatDateTime(dates.year, dates.month, 1),
      },
      {
        id: '2',
        title: 'Perbaikan Jalan Utama',
        content: 'Akan dilakukan perbaikan jalan utama komplek minggu depan. Mohon pengertiannya.',
        category: 'Pengumuman',
        isPinned: false,
        targetBlok: 'all',
        publishedAt: dates.formatDateTime(dates.year, dates.month, 3),
        expiredAt: null,
        createdBy: 'admin',
        createdAt: dates.formatDateTime(dates.year, dates.month, 3),
      },
    ] as Information[],
    
    galleries: [
      {
        id: '1',
        title: `Kerja Bakti ${dates.monthName} ${dates.year}`,
        description: 'Dokumentasi kegiatan kerja bakti bulan ini',
        imageUrl: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800',
        thumbnailUrl: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400',
        agendaId: null,
        takenAt: dates.formatDateTime(dates.year, dates.month, 15),
        uploadedBy: 'admin',
        createdAt: dates.formatDateTime(dates.year, dates.month, 15),
      },
      {
        id: '2',
        title: `Rapat Warga Q1 ${dates.year}`,
        description: 'Rapat koordinasi warga kuartal pertama',
        imageUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800',
        thumbnailUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=400',
        agendaId: null,
        takenAt: dates.formatDateTime(dates.year, dates.month, 20, 19),
        uploadedBy: 'admin',
        createdAt: dates.formatDateTime(dates.year, dates.month, 20, 19),
      },
    ] as Gallery[],
    
    reviews: [
      {
        id: '1',
        userId: 'user1',
        userName: 'Budi Santoso',
        userBlok: 'A',
        rating: 5,
        comment: 'Komplek yang sangat nyaman dan terawat. Pengurus sangat aktif dan responsif.',
        status: 'APPROVED',
        createdAt: dates.formatDateTime(dates.year, dates.month, 25, 15),
      },
      {
        id: '2',
        userId: 'user2',
        userName: 'Siti Rahayu',
        userBlok: 'B',
        rating: 4,
        comment: 'Lingkungan yang asri dan aman. Cocok untuk keluarga.',
        status: 'APPROVED',
        createdAt: dates.formatDateTime(dates.year, dates.month, 28, 10),
      },
    ] as Review[],
    
    pengurus: [
      {
        id: 'admin1',
        nama: 'Ahmad Hidayat',
        email: 'ahmad@pradha.id',
        nik: '3201010101010001',
        blok: 'A',
        nomorRumah: '1',
        telepon: '08123456789',
        role: 'ADMIN',
        status: 'ACTIVE',
        photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
      },
      {
        id: 'pengurus1',
        nama: 'Dewi Lestari',
        email: 'dewi@pradha.id',
        nik: '3201010101010002',
        blok: 'B',
        nomorRumah: '3',
        telepon: '08123456790',
        role: 'ADMIN',
        status: 'ACTIVE',
        photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
      },
    ] as SafeUser[],
    
    // SUPERADMIN - Full access including global settings and role management
    superadminPermissions: {
      canViewAllUsers: true,
      canViewOwnBlokUsers: true,
      canApproveUsers: true,
      canRejectUsers: true,
      canChangeUserRole: true,
      canBlockUsers: true,
      canViewFinance: true,
      canCreateTransaction: true,
      canEditTransaction: true,
      canDeleteTransaction: true,
      canSubmitPayment: true,
      canApprovePayment: true,
      canRejectPayment: true,
      canViewAllPayments: true,
      canCreateAgenda: true,
      canEditAgenda: true,
      canDeleteAgenda: true,
      canCreateInformation: true,
      canEditInformation: true,
      canDeleteInformation: true,
      canUploadGallery: true,
      canDeleteGallery: true,
      canApproveReviews: true,
      canDeleteReviews: true,
      canManageSettings: true,  // Only SUPERADMIN can manage global settings
      canManageRoles: true,      // Only SUPERADMIN can manage roles
    } as Permissions,
    
    // ADMIN - Can manage blok-level, but NOT global settings or roles
    adminPermissions: {
      canViewAllUsers: false,      // Only users in their blok
      canViewOwnBlokUsers: true,
      canApproveUsers: true,
      canRejectUsers: true,
      canChangeUserRole: false,    // Cannot change roles
      canBlockUsers: true,
      canViewFinance: true,
      canCreateTransaction: true,
      canEditTransaction: true,
      canDeleteTransaction: false, // Cannot delete transactions
      canSubmitPayment: false,     // Admin doesn't submit payments
      canApprovePayment: true,
      canRejectPayment: true,
      canViewAllPayments: true,
      canCreateAgenda: true,
      canEditAgenda: true,
      canDeleteAgenda: true,
      canCreateInformation: true,
      canEditInformation: true,
      canDeleteInformation: true,
      canUploadGallery: true,
      canDeleteGallery: true,
      canApproveReviews: true,
      canDeleteReviews: true,
      canManageSettings: false,    // Cannot manage global settings
      canManageRoles: false,       // Cannot manage roles
    } as Permissions,
    
    // BENDAHARA - Focus on finance
    bendaharaPermissions: {
      canViewAllUsers: false,
      canViewOwnBlokUsers: true,
      canApproveUsers: false,
      canRejectUsers: false,
      canChangeUserRole: false,
      canBlockUsers: false,
      canViewFinance: true,
      canCreateTransaction: true,
      canEditTransaction: true,
      canDeleteTransaction: false,
      canSubmitPayment: false,
      canApprovePayment: true,
      canRejectPayment: true,
      canViewAllPayments: true,
      canCreateAgenda: false,
      canEditAgenda: false,
      canDeleteAgenda: false,
      canCreateInformation: false,
      canEditInformation: false,
      canDeleteInformation: false,
      canUploadGallery: false,
      canDeleteGallery: false,
      canApproveReviews: false,
      canDeleteReviews: false,
      canManageSettings: false,
      canManageRoles: false,
    } as Permissions,
    
    // WARGA - Basic user permissions
    wargaPermissions: {
      canViewAllUsers: false,
      canViewOwnBlokUsers: false,
      canApproveUsers: false,
      canRejectUsers: false,
      canChangeUserRole: false,
      canBlockUsers: false,
      canViewFinance: false,
      canCreateTransaction: false,
      canEditTransaction: false,
      canDeleteTransaction: false,
      canSubmitPayment: true,      // Can submit their own payments
      canApprovePayment: false,
      canRejectPayment: false,
      canViewAllPayments: false,
      canCreateAgenda: false,
      canEditAgenda: false,
      canDeleteAgenda: false,
      canCreateInformation: false,
      canEditInformation: false,
      canDeleteInformation: false,
      canUploadGallery: false,
      canDeleteGallery: false,
      canApproveReviews: false,
      canDeleteReviews: false,
      canManageSettings: false,
      canManageRoles: false,
    } as Permissions,
    
    // Demo users for different roles
    demoUsers: {
      superadmin: {
        id: 'demo-superadmin',
        nama: 'Super Admin',
        email: 'superadmin@pradha.id',
        nik: '3201010101010001',
        blok: 'A',
        nomorRumah: '1',
        telepon: '081234567801',
        role: 'SUPERADMIN',
        status: 'ACTIVE',
        photoUrl: null,
      } as SafeUser,
      admin: {
        id: 'demo-admin',
        nama: 'Admin Blok A',
        email: 'admin@pradha.id',
        nik: '3201010101010002',
        blok: 'A',
        nomorRumah: '5',
        telepon: '081234567802',
        role: 'ADMIN',
        status: 'ACTIVE',
        photoUrl: null,
      } as SafeUser,
      adminB: {
        id: 'demo-admin-b',
        nama: 'Admin Blok B',
        email: 'admin.b@pradha.id',
        nik: '3201010101010003',
        blok: 'B',
        nomorRumah: '3',
        telepon: '081234567803',
        role: 'ADMIN',
        status: 'ACTIVE',
        photoUrl: null,
      } as SafeUser,
      bendahara: {
        id: 'demo-bendahara',
        nama: 'Bendahara',
        email: 'bendahara@pradha.id',
        nik: '3201010101010004',
        blok: 'B',
        nomorRumah: '2',
        telepon: '081234567804',
        role: 'BENDAHARA',
        status: 'ACTIVE',
        photoUrl: null,
      } as SafeUser,
      warga: {
        id: 'demo-warga',
        nama: 'Warga Demo',
        email: 'warga@pradha.id',
        nik: '3201010101010005',
        blok: 'B',
        nomorRumah: '10',
        telepon: '081234567805',
        role: 'WARGA',
        status: 'ACTIVE',
        photoUrl: null,
      } as SafeUser,
      wargaA: {
        id: 'demo-warga-a',
        nama: 'Budi Santoso',
        email: 'warga.a@pradha.id',
        nik: '3201010101010006',
        blok: 'A',
        nomorRumah: '12',
        telepon: '081234567806',
        role: 'WARGA',
        status: 'ACTIVE',
        photoUrl: null,
      } as SafeUser,
    },
    
    // Current demo user (will be set on login)
    demoUser: null as SafeUser | null,
  };
};

// Cache manager
const CacheManager = {
  // Get from cache
  get<T>(key: string): T | null {
    const fullKey = CACHE_PREFIX + key;
    
    // Try memory cache first
    const memEntry = memoryCache.get(fullKey) as CacheEntry<T> | undefined;
    if (memEntry && Date.now() - memEntry.timestamp < memEntry.ttl) {
      return memEntry.data;
    }
    
    // Try localStorage (client-side only)
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(fullKey);
        if (stored) {
          const entry = JSON.parse(stored) as CacheEntry<T>;
          if (Date.now() - entry.timestamp < entry.ttl) {
            // Restore to memory cache
            memoryCache.set(fullKey, entry);
            return entry.data;
          }
          // Expired, remove
          localStorage.removeItem(fullKey);
        }
      } catch {
        // Ignore localStorage errors
      }
    }
    
    return null;
  },
  
  // Set cache
  set<T>(key: string, data: T, ttl: number): void {
    const fullKey = CACHE_PREFIX + key;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    
    // Set in memory cache
    memoryCache.set(fullKey, entry);
    
    // Set in localStorage (client-side only)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(fullKey, JSON.stringify(entry));
      } catch {
        // Ignore localStorage errors (quota exceeded, etc.)
      }
    }
  },
  
  // Remove from cache
  remove(key: string): void {
    const fullKey = CACHE_PREFIX + key;
    memoryCache.delete(fullKey);
    
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(fullKey);
      } catch {
        // Ignore
      }
    }
  },
  
  // Clear all cache
  clear(): void {
    // Clear memory cache
    for (const key of memoryCache.keys()) {
      if (key.startsWith(CACHE_PREFIX)) {
        memoryCache.delete(key);
      }
    }
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(CACHE_PREFIX)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      } catch {
        // Ignore
      }
    }
  },
  
  // Clear cache by pattern
  clearPattern(pattern: string): void {
    const regex = new RegExp(pattern);
    
    // Clear memory cache
    for (const key of memoryCache.keys()) {
      if (key.startsWith(CACHE_PREFIX) && regex.test(key)) {
        memoryCache.delete(key);
      }
    }
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(CACHE_PREFIX) && regex.test(key)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      } catch {
        // Ignore
      }
    }
  },
};

// Timeout manager with AbortController
const createTimeoutController = (timeout: number): {
  controller: AbortController;
  timeoutId: NodeJS.Timeout;
  clear: () => void;
} => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(new Error('Request timeout'));
  }, timeout);
  
  return {
    controller,
    timeoutId,
    clear: () => clearTimeout(timeoutId),
  };
};

// Token manager
const TokenManager = {
  get(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  },
  
  set(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('auth_token', token);
  },
  
  remove(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('auth_token');
  },
};

// Simulate network delay for demo mode
const simulateDelay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Store current demo user in memory (for demo mode)
let currentDemoUser: SafeUser | null = null;

// Main API client
class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number;
  private demoMode: boolean;
  private demoData: ReturnType<typeof generateDemoData>;
  
  constructor(baseUrl: string, defaultTimeout: number = DEFAULT_TIMEOUT) {
    this.baseUrl = baseUrl;
    this.defaultTimeout = defaultTimeout;
    this.demoMode = DEMO_MODE;
    // Generate demo data once at initialization
    this.demoData = generateDemoData();
  }
  
  // Core request method
  private async request<T>(
    action: string,
    payload: Record<string, unknown> = {},
    options: {
      timeout?: number;
      useCache?: boolean;
      cacheTTL?: number;
      cacheKey?: string;
      requireAuth?: boolean;
    } = {}
  ): Promise<ApiResponse<T>> {
    const {
      timeout = this.defaultTimeout,
      useCache = false,
      cacheTTL = 5 * 60 * 1000, // 5 minutes default
      cacheKey,
      requireAuth = true,
    } = options;
    
    // Check cache
    if (useCache && cacheKey) {
      const cached = CacheManager.get<ApiResponse<T>>(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    // Handle demo mode
    if (this.demoMode) {
      return this.handleDemoRequest<T>(action, payload, requireAuth, useCache, cacheKey, cacheTTL);
    }
    
    // Get token if required
    let token: string | null = null;
    if (requireAuth) {
      token = TokenManager.get();
      if (!token) {
        return { ok: false, error: 'Tidak terautentikasi' };
      }
    }
    
    // Create timeout controller
    const { controller, timeoutId, clear } = createTimeoutController(timeout);
    
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action,
          token,
          payload,
        }),
        signal: controller.signal,
      });
      
      clear();
      
      if (!response.ok) {
        return { ok: false, error: `HTTP error: ${response.status}` };
      }
      
      const result = await response.json() as ApiResponse<T>;
      
      // Cache successful response
      if (useCache && cacheKey && result.ok) {
        CacheManager.set(cacheKey, result, cacheTTL);
      }
      
      return result;
    } catch (error) {
      clear();
      
      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.message === 'Request timeout') {
          return { ok: false, error: 'Request timeout. Silakan coba lagi.' };
        }
        return { ok: false, error: error.message };
      }
      
      return { ok: false, error: 'Terjadi kesalahan jaringan' };
    }
  }
  
  // Handle demo mode requests
  private async handleDemoRequest<T>(
    action: string,
    payload: Record<string, unknown>,
    requireAuth: boolean,
    useCache: boolean,
    cacheKey: string | undefined,
    cacheTTL: number
  ): Promise<ApiResponse<T>> {
    await simulateDelay(300);
    
    // Check auth for protected routes
    if (requireAuth && !TokenManager.get()) {
      return { ok: false, error: 'Tidak terautentikasi' };
    }
    
    let result: ApiResponse<T>;
    
    // Handle different actions
    switch (action) {
      // Auth
      case 'auth.login':
        if (payload.email && payload.password) {
          // Select demo user based on email
          const email = payload.email as string;
          const demoUsers = this.demoData.demoUsers;
          
          let selectedUser: SafeUser | null = null;
          
          // Match email to demo user
          if (email === 'superadmin@pradha.id' || email === 'superadmin') {
            selectedUser = demoUsers.superadmin;
          } else if (email === 'admin@pradha.id' || email === 'admin') {
            selectedUser = demoUsers.admin;
          } else if (email === 'admin.b@pradha.id') {
            selectedUser = demoUsers.adminB;
          } else if (email === 'bendahara@pradha.id' || email === 'bendahara') {
            selectedUser = demoUsers.bendahara;
          } else if (email === 'warga@pradha.id' || email === 'warga') {
            selectedUser = demoUsers.warga;
          } else if (email === 'warga.a@pradha.id') {
            selectedUser = demoUsers.wargaA;
          } else {
            // Default to superadmin for any other email in demo mode
            selectedUser = demoUsers.superadmin;
          }
          
          // Store the current demo user
          currentDemoUser = selectedUser;
          TokenManager.set('demo-token-' + Date.now());
          
          result = { 
            ok: true, 
            data: { 
              user: selectedUser, 
              token: 'demo-token-' + Date.now() 
            } as T 
          };
        } else {
          result = { ok: false, error: 'Email dan password diperlukan' };
        }
        break;
        
      case 'auth.register':
        result = { ok: true, data: { message: 'Registrasi berhasil, menunggu persetujuan' } as T };
        break;
        
      case 'auth.me':
        result = { ok: true, data: (currentDemoUser || this.demoData.demoUsers.superadmin) as T };
        break;
        
      case 'auth.changePassword':
        result = { ok: true, data: { message: 'Password berhasil diubah' } as T };
        break;
        
      case 'role.permissions':
        // Return permissions based on user's role
        const userRole = (currentDemoUser || this.demoData.demoUsers.superadmin).role;
        let permissions: Permissions;
        switch (userRole) {
          case 'SUPERADMIN':
            permissions = this.demoData.superadminPermissions;
            break;
          case 'ADMIN':
            permissions = this.demoData.adminPermissions;
            break;
          case 'BENDAHARA':
            permissions = this.demoData.bendaharaPermissions;
            break;
          case 'WARGA':
          default:
            permissions = this.demoData.wargaPermissions;
        }
        result = { ok: true, data: permissions as T };
        break;
        
      // Public
      case 'settings.public':
        result = { ok: true, data: this.demoData.settings as T };
        break;
        
      case 'finance.publicSummary':
        result = { ok: true, data: this.demoData.publicFinance as T };
        break;
        
      case 'agenda.publicList':
        result = { ok: true, data: this.demoData.agendas as T };
        break;
        
      case 'info.publicList':
        result = { ok: true, data: this.demoData.informations as T };
        break;
        
      case 'gallery.publicList':
        result = { ok: true, data: this.demoData.galleries as T };
        break;
        
      case 'review.publicList':
        result = { ok: true, data: this.demoData.reviews as T };
        break;
        
      case 'pengurus.publicList':
        result = { ok: true, data: this.demoData.pengurus as T };
        break;
        
      // Settings
      case 'settings.all':
        result = { ok: true, data: this.demoData.settings as T };
        break;
        
      case 'settings.update':
        result = { ok: true, data: { message: 'Pengaturan berhasil disimpan' } as T };
        break;
        
      // Finance
      case 'finance.summary':
        result = { 
          ok: true, 
          data: {
            ...this.demoData.publicFinance,
            saldoAwal: 1500000,
            totalPemasukan: 4500000,
            totalPengeluaran: 2500000,
            transactions: [],
            monthlyBreakdown: [],
          } as T 
        };
        break;
        
      case 'finance.transactions':
        result = { ok: true, data: [] as T };
        break;
        
      case 'finance.create':
        result = { ok: true, data: { message: 'Transaksi berhasil dibuat', id: 'txn-' + Date.now() } as T };
        break;
        
      // Users
      case 'user.list':
        // Include all demo users in the list
        const allDemoUsers = Object.values(this.demoData.demoUsers);
        result = { ok: true, data: [...this.demoData.pengurus, ...allDemoUsers] as T };
        break;
        
      case 'user.pending':
        result = { ok: true, data: [] as T };
        break;
        
      case 'user.approve':
        result = { ok: true, data: { message: 'Pengguna berhasil disetujui' } as T };
        break;
        
      case 'user.reject':
        result = { ok: true, data: { message: 'Pengguna ditolak' } as T };
        break;
        
      case 'user.updateRole':
        result = { ok: true, data: { message: 'Role berhasil diubah' } as T };
        break;
        
      case 'user.block':
        result = { ok: true, data: { message: 'Pengguna diblokir' } as T };
        break;
        
      case 'user.update':
        // Update current demo user
        if (currentDemoUser && payload) {
          currentDemoUser = {
            ...currentDemoUser,
            ...(payload.nama && { nama: payload.nama as string }),
            ...(payload.telepon && { telepon: payload.telepon as string }),
            ...(payload.photoUrl !== undefined && { photoUrl: payload.photoUrl as string | null }),
          };
          result = { ok: true, data: currentDemoUser as T };
        } else {
          result = { ok: false, error: 'Gagal memperbarui profil' };
        }
        break;
        
      // Agenda
      case 'agenda.list':
        result = { ok: true, data: this.demoData.agendas as T };
        break;
        
      case 'agenda.create':
        result = { ok: true, data: { message: 'Agenda berhasil dibuat', id: 'agenda-' + Date.now() } as T };
        break;
        
      case 'agenda.update':
        result = { ok: true, data: { message: 'Agenda berhasil diperbarui' } as T };
        break;
        
      case 'agenda.delete':
        result = { ok: true, data: { message: 'Agenda berhasil dihapus' } as T };
        break;
        
      // Information
      case 'info.list':
        result = { ok: true, data: this.demoData.informations as T };
        break;
        
      case 'info.create':
        result = { ok: true, data: { message: 'Informasi berhasil dibuat', id: 'info-' + Date.now() } as T };
        break;
        
      case 'info.update':
        result = { ok: true, data: { message: 'Informasi berhasil diperbarui' } as T };
        break;
        
      case 'info.delete':
        result = { ok: true, data: { message: 'Informasi berhasil dihapus' } as T };
        break;
        
      // Gallery
      case 'gallery.list':
        result = { ok: true, data: this.demoData.galleries as T };
        break;
        
      case 'gallery.upload':
        result = { ok: true, data: { message: 'Gambar berhasil diunggah', id: 'gallery-' + Date.now() } as T };
        break;
        
      case 'gallery.delete':
        result = { ok: true, data: { message: 'Gambar berhasil dihapus' } as T };
        break;
        
      // Reviews
      case 'review.myReview':
        result = { ok: true, data: null as T };
        break;
        
      case 'review.pending':
        result = { ok: true, data: [] as T };
        break;
        
      case 'review.all':
        result = { ok: true, data: this.demoData.reviews as T };
        break;
        
      case 'review.submit':
        result = { ok: true, data: { message: 'Review berhasil dikirim', id: 'review-' + Date.now() } as T };
        break;
        
      case 'review.approve':
        result = { ok: true, data: { message: 'Review berhasil disetujui' } as T };
        break;
        
      case 'review.delete':
        result = { ok: true, data: { message: 'Review berhasil dihapus' } as T };
        break;
        
      // Payments
      case 'payment.myPayments':
        result = { ok: true, data: [] as T };
        break;
        
      case 'payment.pending':
        result = { ok: true, data: [] as T };
        break;
        
      case 'payment.all':
        result = { ok: true, data: [] as T };
        break;
        
      case 'payment.submit':
        result = { ok: true, data: { message: 'Pembayaran berhasil dikirim', id: 'payment-' + Date.now() } as T };
        break;
        
      case 'payment.approve':
        // When payment is approved, backend should:
        // 1. Update payment status to APPROVED
        // 2. Create an income transaction in the finance system
        // 3. Add the periods to the user's paid periods
        result = { ok: true, data: { message: 'Pembayaran berhasil disetujui dan dicatat sebagai pemasukan' } as T };
        break;
        
      case 'payment.reject':
        result = { ok: true, data: { message: 'Pembayaran ditolak' } as T };
        break;
        
      case 'payment.paidPeriods':
        // Return demo paid periods based on user
        const paidPeriodsUser = currentDemoUser || this.demoData.demoUsers.superadmin;
        const now = new Date();
        const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        
        // Demo: some users have paid some periods
        let demoPaidPeriods: string[] = [];
        if (paidPeriodsUser.role === 'WARGA') {
          // Warga has paid 2 months ago and 3 months ago
          const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const prevPrevMonth = new Date(now.getFullYear(), now.getMonth() - 2, 1);
          demoPaidPeriods = [
            `${monthNames[prevMonth.getMonth()]} ${prevMonth.getFullYear()}`,
            `${monthNames[prevPrevMonth.getMonth()]} ${prevPrevMonth.getFullYear()}`,
          ];
        }
        result = { ok: true, data: demoPaidPeriods as T };
        break;
        
      case 'payment.unpaidUsers':
        result = { ok: true, data: [] as T };
        break;
        
      // Permissions
      case 'role.allPermissions':
        result = { 
          ok: true, 
          data: {
            SUPERADMIN: this.demoData.superadminPermissions,
            ADMIN: this.demoData.adminPermissions,
            BENDAHARA: this.demoData.bendaharaPermissions,
            WARGA: this.demoData.wargaPermissions,
          } as T 
        };
        break;
        
      case 'role.updatePermissions':
        result = { ok: true, data: { message: 'Permission berhasil diperbarui' } as T };
        break;
        
      case 'file.upload':
        // File upload is handled separately in uploadFile method
        // This case shouldn't be reached in normal flow
        result = { ok: false, error: 'Gunakan method uploadFile untuk upload file' };
        break;
        
      default:
        result = { ok: false, error: `Unknown action: ${action}` };
    }
    
    // Cache successful response
    if (useCache && cacheKey && result.ok) {
      CacheManager.set(cacheKey, result, cacheTTL);
    }
    
    return result;
  }
  
  // ==================== AUTH API ====================
  
  async login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const result = await this.request<AuthResponse>('auth.login', data, {
      requireAuth: false,
    });
    
    if (result.ok && result.data) {
      TokenManager.set(result.data.token);
      // Clear cache on login
      CacheManager.clear();
    }
    
    return result;
  }
  
  async register(data: RegisterRequest): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>('auth.register', data, {
      requireAuth: false,
    });
  }
  
  async getMe(): Promise<ApiResponse<SafeUser>> {
    return this.request<SafeUser>('auth.me', {}, {
      useCache: true,
      cacheKey: 'auth_me',
      cacheTTL: 60 * 1000, // 1 minute
    });
  }
  
  async changePassword(oldPassword: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    CacheManager.remove('auth_me');
    return this.request<{ message: string }>('auth.changePassword', { oldPassword, newPassword });
  }
  
  logout(): void {
    TokenManager.remove();
    CacheManager.clear();
    currentDemoUser = null; // Reset demo user on logout
  }
  
  // ==================== PUBLIC API ====================
  
  async getPublicSettings(): Promise<ApiResponse<AppSettings>> {
    return this.request<AppSettings>('settings.public', {}, {
      requireAuth: false,
      useCache: true,
      cacheKey: 'public_settings',
      cacheTTL: 10 * 60 * 1000, // 10 minutes
    });
  }
  
  async getPublicFinanceSummary(): Promise<ApiResponse<PublicFinanceSummary>> {
    return this.request<PublicFinanceSummary>('finance.publicSummary', {}, {
      requireAuth: false,
      useCache: true,
      cacheKey: 'public_finance',
      cacheTTL: 6 * 60 * 60 * 1000, // 6 hours (same as GAS cache)
    });
  }
  
  async getPublicAgenda(limit?: number): Promise<ApiResponse<Agenda[]>> {
    return this.request<Agenda[]>('agenda.publicList', { limit }, {
      requireAuth: false,
      useCache: true,
      cacheKey: `public_agenda_${limit || 'all'}`,
      cacheTTL: 5 * 60 * 1000, // 5 minutes
    });
  }
  
  async getPublicInfo(limit?: number): Promise<ApiResponse<Information[]>> {
    return this.request<Information[]>('info.publicList', { limit }, {
      requireAuth: false,
      useCache: true,
      cacheKey: `public_info_${limit || 'all'}`,
      cacheTTL: 5 * 60 * 1000,
    });
  }
  
  async getPublicPengurus(): Promise<ApiResponse<SafeUser[]>> {
    return this.request<SafeUser[]>('pengurus.publicList', {}, {
      requireAuth: false,
      useCache: true,
      cacheKey: 'public_pengurus',
      cacheTTL: 60 * 60 * 1000, // 1 hour
    });
  }
  
  async getPublicReviews(limit?: number): Promise<ApiResponse<Review[]>> {
    return this.request<Review[]>('review.publicList', { limit }, {
      requireAuth: false,
      useCache: true,
      cacheKey: `public_reviews_${limit || 'all'}`,
      cacheTTL: 10 * 60 * 1000,
    });
  }
  
  async getPublicGallery(limit?: number): Promise<ApiResponse<Gallery[]>> {
    return this.request<Gallery[]>('gallery.publicList', { limit }, {
      requireAuth: false,
      useCache: true,
      cacheKey: `public_gallery_${limit || 'all'}`,
      cacheTTL: 30 * 60 * 1000, // 30 minutes
    });
  }
  
  // ==================== USER MANAGEMENT ====================
  
  async getUsers(filters?: { blok?: string; status?: string; search?: string }): Promise<ApiResponse<SafeUser[]>> {
    return this.request<SafeUser[]>('user.list', filters || {}, {
      useCache: true,
      cacheKey: `users_${JSON.stringify(filters || {})}`,
      cacheTTL: 60 * 1000, // 1 minute
    });
  }
  
  async getUserDetail(userId: string): Promise<ApiResponse<SafeUser>> {
    return this.request<SafeUser>('user.detail', { userId });
  }
  
  async getPendingUsers(): Promise<ApiResponse<SafeUser[]>> {
    return this.request<SafeUser[]>('user.pending', {}, {
      useCache: true,
      cacheKey: 'users_pending',
      cacheTTL: 30 * 1000, // 30 seconds
    });
  }
  
  async approveUser(userId: string): Promise<ApiResponse<{ message: string }>> {
    CacheManager.clearPattern('users');
    return this.request<{ message: string }>('user.approve', { userId });
  }
  
  async rejectUser(userId: string, reason?: string): Promise<ApiResponse<{ message: string }>> {
    CacheManager.clearPattern('users');
    return this.request<{ message: string }>('user.reject', { userId, reason });
  }
  
  async updateUserRole(userId: string, role: string): Promise<ApiResponse<{ message: string }>> {
    CacheManager.clearPattern('users');
    return this.request<{ message: string }>('user.updateRole', { userId, role });
  }
  
  async blockUser(userId: string, reason?: string): Promise<ApiResponse<{ message: string }>> {
    CacheManager.clearPattern('users');
    return this.request<{ message: string }>('user.block', { userId, reason });
  }
  
  async unblockUser(userId: string): Promise<ApiResponse<{ message: string }>> {
    CacheManager.clearPattern('users');
    return this.request<{ message: string }>('user.unblock', { userId });
  }
  
  async updateUser(data: { telepon?: string; nama?: string; photoUrl?: string; nik?: string }): Promise<ApiResponse<SafeUser>> {
    CacheManager.remove('auth_me');
    return this.request<SafeUser>('user.update', data);
  }
  
  // ==================== FINANCE ====================
  
  async getFinanceSummary(year?: number, month?: number): Promise<ApiResponse<FinanceSummary>> {
    return this.request<FinanceSummary>('finance.summary', { year, month }, {
      useCache: true,
      cacheKey: `finance_summary_${year || 'current'}_${month || 'all'}`,
      cacheTTL: 60 * 1000,
    });
  }
  
  async getTransactions(filters?: { year?: number; month?: number; type?: string; limit?: number }): Promise<ApiResponse<Transaction[]>> {
    return this.request<Transaction[]>('finance.transactions', filters || {}, {
      useCache: true,
      cacheKey: `transactions_${JSON.stringify(filters || {})}`,
      cacheTTL: 60 * 1000,
    });
  }
  
  async createTransaction(data: { type: string; category: string; amount: number; description: string; date?: string }): Promise<ApiResponse<{ message: string; id: string }>> {
    CacheManager.clearPattern('finance');
    CacheManager.clearPattern('transactions');
    CacheManager.remove('public_finance');
    return this.request<{ message: string; id: string }>('finance.create', data);
  }
  
  async updateTransaction(id: string, data: { category?: string; amount?: number; description?: string; date?: string }): Promise<ApiResponse<{ message: string }>> {
    CacheManager.clearPattern('finance');
    CacheManager.clearPattern('transactions');
    CacheManager.remove('public_finance');
    return this.request<{ message: string }>('finance.update', { id, ...data });
  }
  
  async deleteTransaction(id: string): Promise<ApiResponse<{ message: string }>> {
    CacheManager.clearPattern('finance');
    CacheManager.clearPattern('transactions');
    CacheManager.remove('public_finance');
    return this.request<{ message: string }>('finance.delete', { id });
  }
  
  async setSaldoAwal(blok: string, year: number, amount: number): Promise<ApiResponse<{ message: string }>> {
    CacheManager.clearPattern('finance');
    return this.request<{ message: string }>('finance.setSaldoAwal', { blok, year, amount });
  }
  
  // ==================== PAYMENT ====================
  
  async submitPayment(periods: string[], buktiUrl: string): Promise<ApiResponse<{ message: string; id: string }>> {
    CacheManager.clearPattern('payment');
    return this.request<{ message: string; id: string }>('payment.submit', { periods, buktiUrl });
  }
  
  async getMyPayments(): Promise<ApiResponse<Payment[]>> {
    return this.request<Payment[]>('payment.myPayments', {}, {
      useCache: true,
      cacheKey: 'my_payments',
      cacheTTL: 30 * 1000,
    });
  }
  
  async getPendingPayments(): Promise<ApiResponse<Payment[]>> {
    return this.request<Payment[]>('payment.pending', {}, {
      useCache: true,
      cacheKey: 'payments_pending',
      cacheTTL: 30 * 1000,
    });
  }
  
  async getAllPayments(filters?: { status?: string; blok?: string }): Promise<ApiResponse<Payment[]>> {
    return this.request<Payment[]>('payment.all', filters || {}, {
      useCache: true,
      cacheKey: `payments_all_${JSON.stringify(filters || {})}`,
      cacheTTL: 60 * 1000,
    });
  }
  
  async approvePayment(paymentId: string): Promise<ApiResponse<{ message: string }>> {
    // Clear all related caches when payment is approved
    // This will refresh: payments, finance summary, paid periods
    CacheManager.clearPattern('payment');
    CacheManager.clearPattern('finance');
    CacheManager.clearPattern('transactions');
    CacheManager.remove('public_finance');
    return this.request<{ message: string }>('payment.approve', { paymentId });
  }
  
  async rejectPayment(paymentId: string, reason: string): Promise<ApiResponse<{ message: string }>> {
    CacheManager.clearPattern('payment');
    return this.request<{ message: string }>('payment.reject', { paymentId, reason });
  }
  
  async getPaidPeriods(userId: string): Promise<ApiResponse<string[]>> {
    return this.request<string[]>('payment.paidPeriods', { userId }, {
      useCache: true,
      cacheKey: `paid_periods_${userId}`,
      cacheTTL: 60 * 1000,
    });
  }
  
  async getUnpaidUsers(): Promise<ApiResponse<User[]>> {
    return this.request<User[]>('payment.unpaidUsers', {}, {
      useCache: true,
      cacheKey: 'unpaid_users',
      cacheTTL: 60 * 1000,
    });
  }
  
  // ==================== AGENDA ====================
  
  async getAgenda(filters?: { status?: string; blok?: string }): Promise<ApiResponse<Agenda[]>> {
    return this.request<Agenda[]>('agenda.list', filters || {}, {
      useCache: true,
      cacheKey: `agenda_${JSON.stringify(filters || {})}`,
      cacheTTL: 60 * 1000,
    });
  }
  
  async getAgendaDetail(id: string): Promise<ApiResponse<Agenda>> {
    return this.request<Agenda>('agenda.detail', { id });
  }
  
  async createAgenda(data: { title: string; description?: string; location?: string; startDate: string; endDate?: string; startTime?: string; endTime?: string; targetBlok?: string }): Promise<ApiResponse<{ message: string; id: string }>> {
    CacheManager.clearPattern('agenda');
    return this.request<{ message: string; id: string }>('agenda.create', data);
  }
  
  async updateAgenda(id: string, data: Partial<Agenda>): Promise<ApiResponse<{ message: string }>> {
    CacheManager.clearPattern('agenda');
    return this.request<{ message: string }>('agenda.update', { id, ...data });
  }
  
  async updateAgendaStatus(id: string, status: string): Promise<ApiResponse<{ message: string }>> {
    CacheManager.clearPattern('agenda');
    return this.request<{ message: string }>('agenda.updateStatus', { id, status });
  }
  
  async deleteAgenda(id: string): Promise<ApiResponse<{ message: string }>> {
    CacheManager.clearPattern('agenda');
    return this.request<{ message: string }>('agenda.delete', { id });
  }
  
  // ==================== INFORMATION ====================
  
  async getInfo(filters?: { category?: string }): Promise<ApiResponse<Information[]>> {
    return this.request<Information[]>('info.list', filters || {}, {
      useCache: true,
      cacheKey: `info_${JSON.stringify(filters || {})}`,
      cacheTTL: 60 * 1000,
    });
  }
  
  async getInfoDetail(id: string): Promise<ApiResponse<Information>> {
    return this.request<Information>('info.detail', { id });
  }
  
  async createInfo(data: { title: string; content: string; category?: string; isPinned?: boolean; targetBlok?: string; expiredAt?: string }): Promise<ApiResponse<{ message: string; id: string }>> {
    CacheManager.clearPattern('info');
    return this.request<{ message: string; id: string }>('info.create', data);
  }
  
  async updateInfo(id: string, data: Partial<Information>): Promise<ApiResponse<{ message: string }>> {
    CacheManager.clearPattern('info');
    return this.request<{ message: string }>('info.update', { id, ...data });
  }
  
  async togglePinInfo(id: string): Promise<ApiResponse<{ message: string }>> {
    CacheManager.clearPattern('info');
    return this.request<{ message: string }>('info.togglePin', { id });
  }
  
  async deleteInfo(id: string): Promise<ApiResponse<{ message: string }>> {
    CacheManager.clearPattern('info');
    return this.request<{ message: string }>('info.delete', { id });
  }
  
  // ==================== GALLERY ====================
  
  async getGallery(): Promise<ApiResponse<Gallery[]>> {
    return this.request<Gallery[]>('gallery.list', {}, {
      useCache: true,
      cacheKey: 'gallery',
      cacheTTL: 5 * 60 * 1000,
    });
  }
  
  async uploadGallery(data: { title: string; description?: string; imageUrl: string; thumbnailUrl?: string; agendaId?: string; takenAt?: string }): Promise<ApiResponse<{ message: string; id: string }>> {
    CacheManager.clearPattern('gallery');
    return this.request<{ message: string; id: string }>('gallery.upload', data);
  }
  
  async deleteGallery(id: string): Promise<ApiResponse<{ message: string }>> {
    CacheManager.clearPattern('gallery');
    return this.request<{ message: string }>('gallery.delete', { id });
  }
  
  // ==================== REVIEWS ====================
  
  async submitReview(rating: number, comment: string): Promise<ApiResponse<{ message: string; id: string }>> {
    CacheManager.clearPattern('review');
    return this.request<{ message: string; id: string }>('review.submit', { rating, comment });
  }
  
  async getMyReview(): Promise<ApiResponse<Review | null>> {
    return this.request<Review | null>('review.myReview', {}, {
      useCache: true,
      cacheKey: 'my_review',
      cacheTTL: 60 * 1000,
    });
  }
  
  async getPendingReviews(): Promise<ApiResponse<Review[]>> {
    return this.request<Review[]>('review.pending', {}, {
      useCache: true,
      cacheKey: 'reviews_pending',
      cacheTTL: 30 * 1000,
    });
  }
  
  async getAllReviews(): Promise<ApiResponse<Review[]>> {
    return this.request<Review[]>('review.all', {}, {
      useCache: true,
      cacheKey: 'reviews_all',
      cacheTTL: 60 * 1000,
    });
  }
  
  async approveReview(reviewId: string): Promise<ApiResponse<{ message: string }>> {
    CacheManager.clearPattern('review');
    return this.request<{ message: string }>('review.approve', { reviewId });
  }
  
  async rejectReview(reviewId: string): Promise<ApiResponse<{ message: string }>> {
    CacheManager.clearPattern('review');
    return this.request<{ message: string }>('review.reject', { reviewId });
  }
  
  async deleteReview(reviewId: string): Promise<ApiResponse<{ message: string }>> {
    CacheManager.clearPattern('review');
    return this.request<{ message: string }>('review.delete', { reviewId });
  }
  
  // ==================== SETTINGS ====================
  
  async getAllSettings(): Promise<ApiResponse<AppSettings>> {
    return this.request<AppSettings>('settings.all', {}, {
      useCache: true,
      cacheKey: 'all_settings',
      cacheTTL: 60 * 1000,
    });
  }
  
  async updateSettings(settings: Partial<AppSettings>): Promise<ApiResponse<{ message: string }>> {
    CacheManager.remove('all_settings');
    CacheManager.remove('public_settings');
    return this.request<{ message: string }>('settings.update', settings);
  }
  
  async updateCategories(type: 'income' | 'expense' | 'information', categories: string[]): Promise<ApiResponse<{ message: string }>> {
    CacheManager.remove('all_settings');
    CacheManager.remove('public_settings');
    return this.request<{ message: string }>('settings.updateCategories', { type, categories });
  }
  
  // ==================== PERMISSIONS ====================
  
  async getMyPermissions(): Promise<ApiResponse<Permissions>> {
    return this.request<Permissions>('role.permissions', {}, {
      useCache: true,
      cacheKey: 'my_permissions',
      cacheTTL: 5 * 60 * 1000,
    });
  }
  
  async getAllPermissions(): Promise<ApiResponse<Record<string, Permissions>>> {
    return this.request<Record<string, Permissions>>('role.allPermissions', {}, {
      useCache: true,
      cacheKey: 'all_permissions',
      cacheTTL: 5 * 60 * 1000,
    });
  }
  
  async updatePermissions(role: string, permissions: Permissions): Promise<ApiResponse<{ message: string }>> {
    CacheManager.clearPattern('permissions');
    return this.request<{ message: string }>('role.updatePermissions', { role, permissions });
  }
  
  // ==================== FILE UPLOAD ====================
  
  async uploadFile(file: File): Promise<ApiResponse<{ url: string }>> {
    // For demo mode, return a mock URL
    if (this.demoMode) {
      return this.handleDemoFileUpload(file);
    }
    
    // Convert file to base64
    const base64 = await this.fileToBase64(file);
    
    const result = await this.request<{ url: string }>('file.upload', {
      fileName: file.name,
      mimeType: file.type,
      base64: base64,
    });
    
    return result;
  }
  
  // Helper to convert File to base64
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:xxx;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  
  // Demo mode file upload - returns a local object URL for preview
  private async handleDemoFileUpload(file: File): Promise<ApiResponse<{ url: string }>> {
    await simulateDelay(500);
    
    // In demo mode, we create a local object URL for the file
    // This won't persist after page refresh, but allows testing the UI
    const objectUrl = URL.createObjectURL(file);
    
    // Store in localStorage as base64 for demo persistence
    try {
      const base64 = await this.fileToBase64(file);
      const demoFileKey = `demo_file_${Date.now()}`;
      localStorage.setItem(demoFileKey, JSON.stringify({
        name: file.name,
        type: file.type,
        base64: `data:${file.type};base64,${base64}`,
      }));
      
      // Return a data URL that will work
      return {
        ok: true,
        data: {
          url: `data:${file.type};base64,${base64}`,
        },
      };
    } catch {
      // Fallback to object URL
      return {
        ok: true,
        data: { url: objectUrl },
      };
    }
  }
}

// Export singleton instance
export const api = new ApiClient(API_URL);

// Export utilities
export { TokenManager, CacheManager };
