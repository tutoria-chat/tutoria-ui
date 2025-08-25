'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '@/lib/auth';
import { checkPermission } from '@/lib/permissions';
import type { User, Permission, PermissionContext } from '@/lib/types';

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
    // Initialize auth state
    const currentUser = authService.getUser();
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Mock users para desenvolvimento
      const mockUsers = {
        'admin': {
          id: 1,
          email: 'admin@tutoria.com',
          first_name: 'Super',
          last_name: 'Admin',
          role: 'super_admin' as const,
          university_id: 1,
          is_admin: true,
          assigned_courses: [1, 2, 3],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        'professor': {
          id: 2,
          email: 'professor@university.edu',
          first_name: 'John',
          last_name: 'Smith',
          role: 'admin_professor' as const,
          university_id: 1,
          is_admin: true,
          assigned_courses: [1, 2, 3, 4],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        'teacher': {
          id: 3,
          email: 'teacher@university.edu',
          first_name: 'Sarah',
          last_name: 'Johnson',
          role: 'regular_professor' as const,
          university_id: 1,
          is_admin: false,
          assigned_courses: [2, 3],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      };

      // Mock authentication - using only local data
      if (password === 'admin') {
        // Simular delay de API
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockUser = mockUsers[email as keyof typeof mockUsers];
        if (mockUser) {
          setUser(mockUser);
          return { success: true, user: mockUser };
        }
      }
      
      // Invalid credentials
      return { 
        success: false, 
        error: 'Credenciais inválidas. Tente: admin/admin, professor/admin ou teacher/admin' 
      };
    } catch (error) {
      return { 
        success: false, 
        error: 'Falha no login. Tente: admin/admin, professor/admin ou teacher/admin' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      // Mock logout - just clear user state
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
    return await authService.changePassword(currentPassword, newPassword);
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