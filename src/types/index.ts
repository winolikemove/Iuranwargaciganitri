// User types
export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'BENDAHARA' | 'WARGA';
export type UserStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'BLOCKED';

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

// Setting types
export interface AppSettings {
  siteName: string;
  siteDescription: string;
  logoUrl: string;
  monthlyFee: number;
  enableRegistration: boolean;
  enablePaymentSubmission: boolean;
  enableAgenda: boolean;
  enableGallery: boolean;
  enableInformation: boolean;
  enablePublicFinance: boolean;
  enableReviews: boolean;
  incomeCategories: string[];
  expenseCategories: string[];
  informationCategories: string[];
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
}

export interface PublicFinanceSummary {
  saldoAkhir: number;
  totalPemasukanBulanIni: number;
  totalPengeluaranBulanIni: number;
  periodLabel: string;
  lastUpdated: string;
}
