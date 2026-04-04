// API Client with Cache and Timeout Management for Google Apps Script Backend

import type { ApiResponse, SafeUser, AppSettings, Permissions, User, Transaction, Payment, Agenda, Information, Gallery, Review, FinanceSummary, PublicFinanceSummary, AuthResponse, LoginRequest, RegisterRequest } from '@/types';

// Configuration
const API_URL = process.env.NEXT_PUBLIC_GAS_API_URL || '';
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const CACHE_PREFIX = 'warga_cache_';

// Cache entry interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// In-memory cache for client-side
const memoryCache = new Map<string, CacheEntry<unknown>>();

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

// Main API client
class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number;
  
  constructor(baseUrl: string, defaultTimeout: number = DEFAULT_TIMEOUT) {
    this.baseUrl = baseUrl;
    this.defaultTimeout = defaultTimeout;
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
  
  async updateUser(data: { telepon?: string; nama?: string; photoUrl?: string }): Promise<ApiResponse<SafeUser>> {
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
    CacheManager.clearPattern('payment');
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
  
  async uploadFile(file: string, filename: string): Promise<ApiResponse<{ url: string }>> {
    return this.request<{ url: string }>('file.upload', { file, filename });
  }
}

// Export singleton instance
export const api = new ApiClient(API_URL);

// Export utilities
export { TokenManager, CacheManager };
