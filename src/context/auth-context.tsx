'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, TokenManager, CacheManager } from '@/lib/api-client';
import type { SafeUser, Permissions, LoginRequest, RegisterRequest, ApiResponse, AuthResponse } from '@/types';

interface AuthContextType {
  user: SafeUser | null;
  permissions: Permissions | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<ApiResponse<AuthResponse>>;
  register: (data: RegisterRequest) => Promise<ApiResponse<{ message: string }>>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  refreshPermissions: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default permissions for unauthenticated users
const defaultPermissions: Permissions = {
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
  canSubmitPayment: false,
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
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user has a valid token on mount
  useEffect(() => {
    let mounted = true;
    
    const initAuth = async () => {
      const token = TokenManager.get();
      
      if (!token) {
        if (mounted) setIsLoading(false);
        return;
      }

      try {
        // Fetch user data
        const userResult = await api.getMe();
        
        if (!mounted) return;
        
        if (userResult.ok && userResult.data) {
          setUser(userResult.data);
          
          // Fetch permissions
          const permResult = await api.getMyPermissions();
          if (mounted) {
            if (permResult.ok && permResult.data) {
              setPermissions(permResult.data);
            } else {
              setPermissions(defaultPermissions);
            }
          }
        } else {
          // Token invalid, clear
          TokenManager.remove();
          setUser(null);
          setPermissions(null);
        }
      } catch (error) {
        console.error('Auth init error:', error);
        if (mounted) {
          TokenManager.remove();
          setUser(null);
          setPermissions(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();
    
    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    const result = await api.login(data);
    
    if (result.ok && result.data) {
      setUser(result.data.user);
      
      // Fetch permissions after login
      const permResult = await api.getMyPermissions();
      if (permResult.ok && permResult.data) {
        setPermissions(permResult.data);
      }
    }
    
    return result;
  }, []);

  const register = useCallback(async (data: RegisterRequest): Promise<ApiResponse<{ message: string }>> => {
    return api.register(data);
  }, []);

  const logout = useCallback(() => {
    api.logout();
    setUser(null);
    setPermissions(null);
  }, []);

  const refreshUser = useCallback(async () => {
    CacheManager.remove('auth_me');
    const result = await api.getMe();
    
    if (result.ok && result.data) {
      setUser(result.data);
    }
  }, []);

  const refreshPermissions = useCallback(async () => {
    CacheManager.remove('my_permissions');
    const result = await api.getMyPermissions();
    
    if (result.ok && result.data) {
      setPermissions(result.data);
    }
  }, []);

  const value: AuthContextType = {
    user,
    permissions,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
    refreshPermissions,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// Hook to check specific permission
export function usePermission(permission: keyof Permissions): boolean {
  const { permissions } = useAuth();
  return permissions?.[permission] ?? false;
}

// Hook to check multiple permissions
export function usePermissions(requiredPermissions: (keyof Permissions)[]): { hasAll: boolean; missing: string[] } {
  const { permissions } = useAuth();
  
  if (!permissions) {
    return { hasAll: false, missing: requiredPermissions };
  }
  
  const missing = requiredPermissions.filter(p => !permissions[p]);
  
  return {
    hasAll: missing.length === 0,
    missing,
  };
}
