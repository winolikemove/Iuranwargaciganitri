// User types
export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'BENDAHARA' | 'WARGA';
export type UserStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'BLOCKED';

// Jabatan types
export type JabatanKey = 'KETUA_RT' | 'WAKIL_KETUA' | 'SEKRETARIS' | 'BENDAHARA' | 'SIE_KEAMANAN' | 'SIE_KEBERSIHAN' | 'DKM_MASJID';

export interface JabatanInfo {
  label: string;
  order: number;
  scope: 'BLOK' | 'SHARED';
}

// Dynamic Jabatan Config Item
export interface JabatanConfigItem {
  key: string;
  label: string;
  order: number;
  scope: 'BLOK' | 'SHARED';
}

// Dynamic Jabatan Configuration
export interface JabatanConfig {
  perBlok: JabatanConfigItem[];
  bersama: JabatanConfigItem[];
}

// Kontak RT per Blok
export interface KontakRT {
  nama: string;
  telepon: string;
  alamat: string;
}

export const JABATAN_PER_BLOK: Record<string, JabatanInfo> = {
  KETUA_RT: { label: 'Ketua RT', order: 1, scope: 'BLOK' },
  WAKIL_KETUA: { label: 'Wakil Ketua RT', order: 2, scope: 'BLOK' },
  SEKRETARIS: { label: 'Sekretaris', order: 3, scope: 'BLOK' },
  BENDAHARA: { label: 'Bendahara', order: 4, scope: 'BLOK' },
};

export const JABATAN_BERSAMA: Record<string, JabatanInfo> = {
  SIE_KEAMANAN: { label: 'Sie. Keamanan', order: 10, scope: 'SHARED' },
  SIE_KEBERSIHAN: { label: 'Sie. Kebersihan', order: 11, scope: 'SHARED' },
  DKM_MASJID: { label: 'DKM Masjid Al Birr', order: 12, scope: 'SHARED' },
};

export const ALL_JABATAN: Record<string, JabatanInfo> = { ...JABATAN_PER_BLOK, ...JABATAN_BERSAMA };

export interface User {
  id: string;
  nama: string;
  email: string;
  nik: string;
  telepon: string;
  blok: string;
  nomorRumah: string;
  role: UserRole;
  status: UserStatus;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SafeUser {
  id: string;
  nama: string;
  email: string;
  nik: string;
  telepon: string;
  blok: string;
  nomorRumah: string;
  role: UserRole;
  status: UserStatus;
  photoUrl: string | null;
  jabatan?: string;
  jabatanLabel?: string;
}

// Transaction types
export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Transaction {
  id: string;
  blok: string;
  type: TransactionType;
  category: string;
  amount: number;
  description: string;
  date: string;
  paymentId?: string; // Reference to payment if transaction is from approved payment
  createdBy: string;
  createdAt: string;
}

// Payment types
export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Payment {
  id: string;
  userId: string;
  userName: string;
  blok: string;
  nomorRumah: string;
  periods: string[];
  amount: number;
  buktiUrl: string | null;
  status: PaymentStatus;
  processedBy: string | null;
  processedAt: string | null;
  rejectReason: string | null;
  createdAt: string;
}

// Payment with bukti preview for UI
export interface PaymentWithPreview extends Payment {
  buktiPreview?: string;
}

// Agenda types
export type AgendaStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';

export interface Agenda {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startDate: string;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  status: AgendaStatus;
  targetBlok: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Information types
export interface Information {
  id: string;
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
  targetBlok: string;
  publishedAt: string;
  expiredAt: string | null;
  createdBy: string;
  createdAt: string;
}

// Gallery types
export interface Gallery {
  id: string;
  agendaId: string | null;
  title: string;
  description: string | null;
  imageUrl: string;
  thumbnailUrl: string | null;
  takenAt: string | null;
  uploadedBy: string;
  createdAt: string;
}

// Review types
export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userPhotoUrl: string | null;
  rating: number;
  comment: string;
  status: ReviewStatus;
  createdAt: string;
}

// Bank Info per Blok
export interface BankInfo {
  bankName: string;
  bankAccount: string;
  bankHolder: string;
}

// Saldo Awal per Blok
export interface SaldoAwal {
  blok: string;
  year: number;
  amount: number;
}

// Categories per Blok
export interface BlokCategories {
  income: string[];
  expense: string[];
  information: string[];
}

// Setting types
export interface AppSettings {
  siteName: string;
  siteDescription: string;
  logoUrl: string;
  bannerUrl: string;
  primaryColor: string;
  monthlyFee: number;
  enableRegistration: boolean;
  enablePaymentSubmission: boolean;
  enableAgenda: boolean;
  enableGallery: boolean;
  enableInformation: boolean;
  enablePublicFinance: boolean;
  enableReviews: boolean;
  bloks: string[];
  // Bank Info per Blok (NEW)
  bankInfoA?: BankInfo;
  bankInfoB?: BankInfo;
  // Legacy bank info (for backward compatibility)
  bankName?: string;
  bankAccount?: string;
  bankHolder?: string;
  // Categories per Blok (NEW)
  categoriesA?: BlokCategories;
  categoriesB?: BlokCategories;
  // Legacy categories (for backward compatibility)
  incomeCategories: string[];
  expenseCategories: string[];
  informationCategories: string[];
  // Saldo Awal
  saldoAwalA?: number;
  saldoAwalB?: number;
  // Contact & Location
  whatsappAdmin?: string;
  rtName?: string;
  rwName?: string;
  address?: string;
  kelurahan?: string;
  kecamatan?: string;
  kota?: string;
  googleMapsEmbedUrl?: string;
  socialMediaLinks?: string[];
  // Dynamic Jabatan Configuration (NEW)
  jabatanConfig?: JabatanConfig;
  // Kontak RT per Blok (NEW)
  kontakRTA?: KontakRT;
  kontakRTB?: KontakRT;
  [key: string]: unknown;
}

// Permission types
export interface Permissions {
  canViewAllUsers: boolean;
  canViewOwnBlokUsers: boolean;
  canApproveUsers: boolean;
  canRejectUsers: boolean;
  canChangeUserRole: boolean;
  canBlockUsers: boolean;
  canViewFinance: boolean;
  canCreateTransaction: boolean;
  canEditTransaction: boolean;
  canDeleteTransaction: boolean;
  canSubmitPayment: boolean;
  canApprovePayment: boolean;
  canRejectPayment: boolean;
  canViewAllPayments: boolean;
  canCreateAgenda: boolean;
  canEditAgenda: boolean;
  canDeleteAgenda: boolean;
  canCreateInformation: boolean;
  canEditInformation: boolean;
  canDeleteInformation: boolean;
  canUploadGallery: boolean;
  canDeleteGallery: boolean;
  canApproveReviews: boolean;
  canDeleteReviews: boolean;
  canManageSettings: boolean;
  canManageRoles: boolean;
}

// API Response types
export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string>;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nama: string;
  email: string;
  password: string;
  nik: string;
  telepon: string;
  blok: string;
  nomorRumah: string;
}

export interface AuthResponse {
  user: SafeUser;
  token: string;
}

// Finance Summary
export interface FinanceSummary {
  saldoAwal: number;
  totalPemasukan: number;
  totalPengeluaran: number;
  saldoAkhir: number;
  periodLabel: string;
  blok?: string;
  monthlyBreakdown?: MonthlyFinance[];
}

// Monthly Finance for Charts
export interface MonthlyFinance {
  month: string;
  monthShort: string;
  pemasukan: number;
  pengeluaran: number;
  saldo: number;
}

export interface PublicFinanceSummary {
  saldoAkhir: number;
  totalPemasukanBulanIni: number;
  totalPengeluaranBulanIni: number;
  periodLabel: string;
  lastUpdated: string;
}

// Struktur Organisasi
export interface PengurusWithJabatan {
  id: string;
  nama: string;
  blok: string;
  telepon: string;
  photoUrl: string;
  jabatan: string;
  jabatanLabel: string;
  order: number;
  nomorRumah?: string;
}

export interface StrukturBlok {
  label: string;
  kontakRT?: KontakRT | null;
  pengurus: PengurusWithJabatan[];
}

export interface StrukturOrganisasi {
  blokA: StrukturBlok;
  blokB: StrukturBlok;
  bersama: StrukturBlok;
}
