'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { checkPermission } from '@/lib/permissions';
import { apiClient } from '@/lib/api';
import { jwtDecode } from 'jwt-decode';
import type { User, Permission, PermissionContext, UserRole } from '@/lib/types';

interface JWTPayload {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  type: UserRole;
  university_id?: number;
  is_admin?: boolean;
  assigned_courses?: number[];
  exp: number;
  iat: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasPermission: (action: Permission['action'], resource: Permission['resource'], context?: PermissionContext) => boolean;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize auth state from stored token
    const initializeAuth = () => {
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('tutoria_user');
        const storedToken = localStorage.getItem('tutoria_token');

        if (storedUser && storedToken) {
          try {
            // Verify token is still valid by checking if it's not expired
            const decoded = jwtDecode<JWTPayload>(storedToken);
            const now = Date.now() / 1000;

            if (decoded.exp > now) {
              // Token is still valid, restore user and set token in apiClient
              const user = JSON.parse(storedUser);
              apiClient.setToken(storedToken);
              setUser(user);
            } else {
              // Token expired, clear auth
              localStorage.removeItem('tutoria_user');
              localStorage.removeItem('tutoria_token');
              localStorage.removeItem('tutoria_refresh_token');
              apiClient.clearToken();
            }
          } catch (error) {
            // Invalid token or user data, clear auth
            console.error('Invalid stored auth data:', error);
            localStorage.removeItem('tutoria_user');
            localStorage.removeItem('tutoria_token');
            localStorage.removeItem('tutoria_refresh_token');
            apiClient.clearToken();
          }
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      // Make API call directly since we need to send 'username' not 'email'
      const response = await apiClient.login({ username, password });

      if (response.access_token) {
        // Decode JWT token to extract user information
        const decoded = jwtDecode<JWTPayload>(response.access_token);

        const user: User = {
          id: decoded.user_id,
          email: decoded.email,
          first_name: decoded.first_name,
          last_name: decoded.last_name,
          role: decoded.type,
          university_id: decoded.university_id,
          is_admin: decoded.is_admin || false,
          assigned_courses: decoded.assigned_courses || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Store in localStorage for persistence
        if (typeof window !== 'undefined') {
          localStorage.setItem('tutoria_user', JSON.stringify(user));
          localStorage.setItem('tutoria_token', response.access_token);
          if (response.refresh_token) {
            localStorage.setItem('tutoria_refresh_token', response.refresh_token);
          }
        }

        setUser(user);
        return { success: true, user };
      }

      return {
        success: false,
        error: 'Credenciais inválidas. Tente novamente.'
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Falha no login. Tente novamente.'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      // Clear stored token and user data
      apiClient.clearToken();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('tutoria_user');
        localStorage.removeItem('tutoria_token');
        localStorage.removeItem('tutoria_refresh_token');
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const hasPermission = (
    action: Permission['action'],
    resource: Permission['resource'],
    context?: PermissionContext
  ) => {
    return checkPermission(user, action, resource, context);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      await apiClient.changePassword(currentPassword, newPassword);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Password change failed'
      };
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    hasPermission,
    changePassword,
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