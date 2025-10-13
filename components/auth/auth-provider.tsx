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
    const initializeAuth = async () => {
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('tutoria_user');
        const storedToken = localStorage.getItem('tutoria_token');

        if (storedUser && storedToken) {
          try {
            // Verify token is still valid by checking if it's not expired
            const decoded = jwtDecode<JWTPayload>(storedToken);
            const now = Date.now() / 1000;

            if (decoded.exp > now) {
              // Token is still valid, set token in apiClient
              apiClient.setToken(storedToken);

              const parsedUser = JSON.parse(storedUser);

              // Check if user data is missing first_name (old format)
              if (!parsedUser.first_name) {
                console.log('Refreshing user data from /me endpoint...');
                try {
                  // Fetch fresh user data from /me endpoint
                  const userData = await apiClient.getCurrentUser();

                  const user: User = {
                    id: userData.id,
                    username: userData.username,
                    email: userData.email,
                    first_name: userData.first_name,
                    last_name: userData.last_name,
                    user_type: userData.user_type || userData.role,
                    role: userData.role,
                    is_active: userData.is_active !== undefined ? userData.is_active : true,
                    university_id: userData.university_id,
                    is_admin: userData.is_admin || false,
                    assigned_courses: userData.assigned_courses || [],
                    created_at: userData.created_at || new Date().toISOString(),
                    updated_at: userData.updated_at || new Date().toISOString(),
                    last_login_at: userData.last_login_at,
                    theme_preference: userData.theme_preference,
                    language_preference: userData.language_preference,
                  };

                  localStorage.setItem('tutoria_user', JSON.stringify(user));
                  setUser(user);
                } catch (error) {
                  console.error('Failed to refresh user data:', error);
                  // Use old user data as fallback
                  setUser(parsedUser);
                }
              } else {
                // User data is up to date
                setUser(parsedUser);
              }
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
        // Set token first so the /me endpoint can use it
        apiClient.setToken(response.access_token);

        // Fetch full user data from /me endpoint
        const userData = await apiClient.getCurrentUser();

        const user: User = {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          user_type: userData.user_type || userData.role,
          role: userData.role,
          is_active: userData.is_active !== undefined ? userData.is_active : true,
          university_id: userData.university_id,
          is_admin: userData.is_admin || false,
          assigned_courses: userData.assigned_courses || [],
          created_at: userData.created_at || new Date().toISOString(),
          updated_at: userData.updated_at || new Date().toISOString(),
          last_login_at: userData.last_login_at,
          theme_preference: userData.theme_preference,
          language_preference: userData.language_preference,
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