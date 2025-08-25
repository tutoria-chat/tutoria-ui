'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-provider';
import { canAccessPage } from '@/lib/permissions';
import type { UserRole, PermissionContext } from '@/lib/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
  redirectTo?: string;
  context?: PermissionContext;
}

export function ProtectedRoute({ 
  children, 
  allowedRoles = [], 
  requireAuth = true,
  redirectTo = '/login',
  context 
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Check authentication requirement
    if (requireAuth && !isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    // Check role-based access
    if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
      router.push('/dashboard');
      return;
    }

    // Check page-specific permissions using current path
    if (typeof window !== 'undefined' && user) {
      const currentPath = window.location.pathname;
      if (!canAccessPage(user, currentPath, context)) {
        router.push('/dashboard');
        return;
      }
    }
  }, [user, isAuthenticated, isLoading, router, allowedRoles, requireAuth, redirectTo, context]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render children if user doesn't have access
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}