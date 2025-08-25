'use client';

import React from 'react';
import { useAuth } from './auth-provider';
import type { UserRole, Permission, PermissionContext } from '@/lib/types';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredPermission?: {
    action: Permission['action'];
    resource: Permission['resource'];
    context?: PermissionContext;
  };
  fallback?: React.ReactNode;
  hideIfNoAccess?: boolean;
}

export function RoleGuard({ 
  children, 
  allowedRoles = [], 
  requiredPermission,
  fallback = null,
  hideIfNoAccess = true 
}: RoleGuardProps) {
  const { user, hasPermission } = useAuth();

  // No user means no access
  if (!user) {
    return hideIfNoAccess ? null : fallback;
  }

  // Check role-based access
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return hideIfNoAccess ? null : fallback;
  }

  // Check permission-based access
  if (requiredPermission) {
    const { action, resource, context } = requiredPermission;
    if (!hasPermission(action, resource, context)) {
      return hideIfNoAccess ? null : fallback;
    }
  }

  return <>{children}</>;
}

// Convenience components for specific roles
export function SuperAdminOnly({ children, fallback, hideIfNoAccess = true }: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  hideIfNoAccess?: boolean;
}) {
  return (
    <RoleGuard 
      allowedRoles={['super_admin']} 
      fallback={fallback} 
      hideIfNoAccess={hideIfNoAccess}
    >
      {children}
    </RoleGuard>
  );
}

export function AdminOnly({ children, fallback, hideIfNoAccess = true }: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  hideIfNoAccess?: boolean;
}) {
  return (
    <RoleGuard 
      allowedRoles={['super_admin', 'admin_professor']} 
      fallback={fallback} 
      hideIfNoAccess={hideIfNoAccess}
    >
      {children}
    </RoleGuard>
  );
}

export function ProfessorOnly({ children, fallback, hideIfNoAccess = true }: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  hideIfNoAccess?: boolean;
}) {
  return (
    <RoleGuard 
      allowedRoles={['super_admin', 'admin_professor', 'regular_professor']} 
      fallback={fallback} 
      hideIfNoAccess={hideIfNoAccess}
    >
      {children}
    </RoleGuard>
  );
}