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
  /** Permission code string to check directly (e.g. 'courses:read') */
  permissionCode?: string;
  fallback?: React.ReactNode;
  hideIfNoAccess?: boolean;
}

export function RoleGuard({
  children,
  allowedRoles = [],
  requiredPermission,
  permissionCode,
  fallback = null,
  hideIfNoAccess = true
}: RoleGuardProps) {
  const { user, hasPermission } = useAuth();

  // No user means no access
  if (!user) {
    return hideIfNoAccess ? null : fallback;
  }

  // Super admin always has full access
  if (user.role === 'super_admin') {
    return <>{children}</>;
  }

  // Check permission code directly if provided
  if (permissionCode) {
    const hasAccess = user.permissions?.includes(permissionCode) ?? false;
    if (!hasAccess) {
      return hideIfNoAccess ? null : fallback;
    }
  }

  // Check role-based access (legacy support)
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return hideIfNoAccess ? null : fallback;
  }

  // Check permission-based access (legacy Permission object)
  if (requiredPermission) {
    const { action, resource, context } = requiredPermission;
    if (!hasPermission(action, resource, context)) {
      return hideIfNoAccess ? null : fallback;
    }
  }

  return <>{children}</>;
}

// Convenience components using permission codes

/**
 * SuperAdminOnly - Renders children only if user has 'universities:read' permission
 * (only super_admins have global university access)
 */
export function SuperAdminOnly({ children, fallback, hideIfNoAccess = true }: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  hideIfNoAccess?: boolean;
}) {
  const { user } = useAuth();
  const hasAccess = user?.role === 'super_admin' || (user?.permissions?.includes('universities:read') ?? false);

  if (!hasAccess) {
    return hideIfNoAccess ? null : fallback;
  }

  return <>{children}</>;
}

/**
 * AdminOnly - Renders children only if user has 'staff:create' permission
 * (managers and above can create staff)
 */
export function AdminOnly({ children, fallback, hideIfNoAccess = true }: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  hideIfNoAccess?: boolean;
}) {
  const { user } = useAuth();
  const hasAccess = user?.role === 'super_admin' || (user?.permissions?.includes('staff:create') ?? false);

  if (!hasAccess) {
    return hideIfNoAccess ? null : fallback;
  }

  return <>{children}</>;
}

/**
 * AdminProfessorOnly - Same as AdminOnly (managers and above)
 */
export function AdminProfessorOnly({ children, fallback, hideIfNoAccess = true }: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  hideIfNoAccess?: boolean;
}) {
  const { user } = useAuth();
  const hasAccess = user?.role === 'super_admin' || (user?.permissions?.includes('staff:create') ?? false);

  if (!hasAccess) {
    return hideIfNoAccess ? null : fallback;
  }

  return <>{children}</>;
}

/**
 * ProfessorOnly - Renders children only if user has 'students:read' permission
 * (all staff roles have students:read, but the student role does not)
 */
export function ProfessorOnly({ children, fallback, hideIfNoAccess = true }: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  hideIfNoAccess?: boolean;
}) {
  const { user } = useAuth();
  const hasAccess = user?.role === 'super_admin' || (user?.permissions?.includes('students:read') ?? false);

  if (!hasAccess) {
    return hideIfNoAccess ? null : fallback;
  }

  return <>{children}</>;
}
