import { db } from './db';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'Pradha_Ciganitri_Secret_2026_xYz';
const TOKEN_EXPIRY_DAYS = 7;

// Hash password using SHA256
export function hashPassword(password: string): string {
  return crypto
    .createHash('sha256')
    .update(password + JWT_SECRET)
    .digest('base64');
}

// Create JWT token
export function createToken(userId: string): string {
  const payload = {
    userId,
    exp: Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64');
  const signature = crypto
    .createHash('sha256')
    .update(payloadB64 + JWT_SECRET)
    .digest('base64');
  return `${payloadB64}.${signature}`;
}

// Validate JWT token
export async function validateToken(token: string): Promise<{
  valid: boolean;
  user?: {
    id: string;
    nama: string;
    email: string;
    nik: string;
    telepon: string;
    blok: string;
    nomorRumah: string;
    role: string;
    status: string;
    photoUrl: string | null;
  } | null;
}> {
  if (!token) {
    return { valid: false, user: null };
  }

  try {
    const [payloadB64, signature] = token.split('.');
    
    if (!payloadB64 || !signature) {
      return { valid: false, user: null };
    }

    const expectedSig = crypto
      .createHash('sha256')
      .update(payloadB64 + JWT_SECRET)
      .digest('base64');

    if (signature !== expectedSig) {
      return { valid: false, user: null };
    }

    const payload = JSON.parse(
      Buffer.from(payloadB64, 'base64').toString('utf-8')
    );

    if (payload.exp < Date.now()) {
      return { valid: false, user: null };
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        nama: true,
        email: true,
        nik: true,
        telepon: true,
        blok: true,
        nomorRumah: true,
        role: true,
        status: true,
        photoUrl: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      return { valid: false, user: null };
    }

    return { valid: true, user };
  } catch (error) {
    console.error('Token validation error:', error);
    return { valid: false, user: null };
  }
}

// Get user permissions based on role
export function getDefaultPermissions(role: string): Record<string, boolean> {
  const defaults: Record<string, Record<string, boolean>> = {
    SUPERADMIN: {
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
      canManageSettings: true,
      canManageRoles: true,
    },
    ADMIN: {
      canViewAllUsers: false,
      canViewOwnBlokUsers: true,
      canApproveUsers: true,
      canRejectUsers: true,
      canChangeUserRole: false,
      canBlockUsers: true,
      canViewFinance: true,
      canCreateTransaction: false,
      canEditTransaction: false,
      canDeleteTransaction: false,
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
      canManageSettings: false,
      canManageRoles: false,
    },
    BENDAHARA: {
      canViewAllUsers: false,
      canViewOwnBlokUsers: false,
      canApproveUsers: false,
      canRejectUsers: false,
      canChangeUserRole: false,
      canBlockUsers: false,
      canViewFinance: true,
      canCreateTransaction: true,
      canEditTransaction: true,
      canDeleteTransaction: false,
      canSubmitPayment: true,
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
    },
    WARGA: {
      canViewAllUsers: false,
      canViewOwnBlokUsers: false,
      canApproveUsers: false,
      canRejectUsers: false,
      canChangeUserRole: false,
      canBlockUsers: false,
      canViewFinance: true,
      canCreateTransaction: false,
      canEditTransaction: false,
      canDeleteTransaction: false,
      canSubmitPayment: true,
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
    },
  };

  return defaults[role] || defaults.WARGA;
}

// Get user permissions (with custom overrides from database)
export async function getUserPermissions(role: string): Promise<Record<string, boolean>> {
  const customPerm = await db.permission.findUnique({
    where: { role },
  });

  if (customPerm && customPerm.permissions) {
    try {
      return JSON.parse(customPerm.permissions);
    } catch (e) {
      console.error('Failed to parse permissions:', e);
    }
  }

  return getDefaultPermissions(role);
}

// Check if user has specific permission
export async function hasPermission(role: string, permission: string): Promise<boolean> {
  const perms = await getUserPermissions(role);
  return perms[permission] === true;
}
