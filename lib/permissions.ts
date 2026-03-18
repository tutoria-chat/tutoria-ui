import type { User, UserRole, Permission, PermissionContext, UniversityLimits } from './types';

// Map from the legacy Permission resource names to backend permission code prefixes
const resourceCodeMap: Record<string, string> = {
  university: 'universities',
  course: 'courses',
  module: 'modules',
  professor: 'staff',
  student: 'students',
  file: 'files',
  token: 'tokens',
  analytics: 'analytics',
  subscription: 'subscription',
};

// Legacy rolePermissions map kept as reference for offline default display in PermissionEditor.
// The main checkPermission function now uses user.permissions from the JWT/backend.
export const rolePermissions: Record<UserRole, Permission[]> = {
  super_admin: [
    // Universities
    { action: 'create', resource: 'university', scope: 'global' },
    { action: 'read', resource: 'university', scope: 'global' },
    { action: 'update', resource: 'university', scope: 'global' },
    { action: 'delete', resource: 'university', scope: 'global' },

    // Courses - Global access
    { action: 'create', resource: 'course', scope: 'global' },
    { action: 'read', resource: 'course', scope: 'global' },
    { action: 'update', resource: 'course', scope: 'global' },
    { action: 'delete', resource: 'course', scope: 'global' },

    // Modules - Global access
    { action: 'create', resource: 'module', scope: 'global' },
    { action: 'read', resource: 'module', scope: 'global' },
    { action: 'update', resource: 'module', scope: 'global' },
    { action: 'delete', resource: 'module', scope: 'global' },

    // Professors - Global access
    { action: 'create', resource: 'professor', scope: 'global' },
    { action: 'read', resource: 'professor', scope: 'global' },
    { action: 'update', resource: 'professor', scope: 'global' },
    { action: 'delete', resource: 'professor', scope: 'global' },

    // Students - Global access
    { action: 'create', resource: 'student', scope: 'global' },
    { action: 'read', resource: 'student', scope: 'global' },
    { action: 'update', resource: 'student', scope: 'global' },
    { action: 'delete', resource: 'student', scope: 'global' },

    // Files - Global access
    { action: 'create', resource: 'file', scope: 'global' },
    { action: 'read', resource: 'file', scope: 'global' },
    { action: 'update', resource: 'file', scope: 'global' },
    { action: 'delete', resource: 'file', scope: 'global' },

    // Tokens - Global access
    { action: 'create', resource: 'token', scope: 'global' },
    { action: 'read', resource: 'token', scope: 'global' },
    { action: 'update', resource: 'token', scope: 'global' },
    { action: 'delete', resource: 'token', scope: 'global' },
  ],

  manager: [
    { action: 'create', resource: 'course', scope: 'university' },
    { action: 'read', resource: 'course', scope: 'university' },
    { action: 'update', resource: 'course', scope: 'university' },
    { action: 'delete', resource: 'course', scope: 'university' },
    { action: 'create', resource: 'module', scope: 'university' },
    { action: 'read', resource: 'module', scope: 'university' },
    { action: 'update', resource: 'module', scope: 'university' },
    { action: 'delete', resource: 'module', scope: 'university' },
    { action: 'create', resource: 'professor', scope: 'university' },
    { action: 'read', resource: 'professor', scope: 'university' },
    { action: 'update', resource: 'professor', scope: 'university' },
    { action: 'delete', resource: 'professor', scope: 'university' },
    { action: 'create', resource: 'student', scope: 'university' },
    { action: 'read', resource: 'student', scope: 'university' },
    { action: 'update', resource: 'student', scope: 'university' },
    { action: 'delete', resource: 'student', scope: 'university' },
    { action: 'create', resource: 'file', scope: 'university' },
    { action: 'read', resource: 'file', scope: 'university' },
    { action: 'update', resource: 'file', scope: 'university' },
    { action: 'delete', resource: 'file', scope: 'university' },
    { action: 'create', resource: 'token', scope: 'university' },
    { action: 'read', resource: 'token', scope: 'university' },
    { action: 'update', resource: 'token', scope: 'university' },
    { action: 'delete', resource: 'token', scope: 'university' },
  ],

  tutor: [
    { action: 'create', resource: 'course', scope: 'university' },
    { action: 'read', resource: 'course', scope: 'university' },
    { action: 'update', resource: 'course', scope: 'university' },
    { action: 'delete', resource: 'course', scope: 'university' },
    { action: 'create', resource: 'module', scope: 'university' },
    { action: 'read', resource: 'module', scope: 'university' },
    { action: 'update', resource: 'module', scope: 'university' },
    { action: 'delete', resource: 'module', scope: 'university' },
    { action: 'create', resource: 'file', scope: 'university' },
    { action: 'read', resource: 'file', scope: 'university' },
    { action: 'update', resource: 'file', scope: 'university' },
    { action: 'delete', resource: 'file', scope: 'university' },
    { action: 'create', resource: 'token', scope: 'university' },
    { action: 'read', resource: 'token', scope: 'university' },
    { action: 'update', resource: 'token', scope: 'university' },
    { action: 'delete', resource: 'token', scope: 'university' },
    { action: 'read', resource: 'student', scope: 'university' },
  ],

  platform_coordinator: [
    { action: 'read', resource: 'course', scope: 'university' },
    { action: 'read', resource: 'module', scope: 'university' },
    { action: 'read', resource: 'file', scope: 'university' },
    { action: 'create', resource: 'token', scope: 'university' },
    { action: 'read', resource: 'token', scope: 'university' },
    { action: 'update', resource: 'token', scope: 'university' },
    { action: 'delete', resource: 'token', scope: 'university' },
    { action: 'read', resource: 'student', scope: 'university' },
  ],

  professor: [
    { action: 'create', resource: 'module', scope: 'course' },
    { action: 'read', resource: 'module', scope: 'course' },
    { action: 'update', resource: 'module', scope: 'course' },
    { action: 'delete', resource: 'module', scope: 'course' },
    { action: 'create', resource: 'file', scope: 'course' },
    { action: 'read', resource: 'file', scope: 'course' },
    { action: 'update', resource: 'file', scope: 'course' },
    { action: 'delete', resource: 'file', scope: 'course' },
    { action: 'create', resource: 'token', scope: 'course' },
    { action: 'read', resource: 'token', scope: 'course' },
    { action: 'update', resource: 'token', scope: 'course' },
    { action: 'delete', resource: 'token', scope: 'course' },
    { action: 'read', resource: 'student', scope: 'course' },
    { action: 'read', resource: 'course', scope: 'course' },
  ],

  student: [
    { action: 'read', resource: 'course', scope: 'course' },
    { action: 'read', resource: 'module', scope: 'course' },
    { action: 'read', resource: 'file', scope: 'course' },
  ],
};

/**
 * Check if a user has a specific permission.
 * Uses the user.permissions array from JWT/backend (claims-based).
 * Falls back to legacy rolePermissions map if permissions array is not available.
 */
export function checkPermission(
  user: User | null,
  action: Permission['action'],
  resource: Permission['resource'],
  context?: PermissionContext
): boolean {
  if (!user) return false;

  // Map legacy resource:action to backend permission code
  const code = `${resourceCodeMap[resource] || resource}:${action}`;

  // Use claims-based permissions if available
  if (user.permissions && user.permissions.length > 0) {
    // Check if user has this permission code
    if (!user.permissions.includes(code)) {
      return false;
    }

    // Permission exists, now check scope context
    // Super admin always passes scope checks (global scope)
    if (user.role === 'super_admin') return true;

    // For university-scoped permissions, check university match
    if (context?.universityId && user.universityId) {
      if (user.universityId !== context.universityId) return false;
    }

    // For course-scoped permissions (professors), check course assignment
    if (context?.courseId && user.role === 'professor' && !user.isAdmin) {
      if (!user.assignedCourses?.includes(context.courseId)) return false;
    }

    return true;
  }

  // Fallback: Legacy role-based permission check (when permissions array not loaded yet)
  const userPermissions = rolePermissions[user.role];
  if (!userPermissions) return false;

  return userPermissions.some(permission => {
    if (permission.action !== action || permission.resource !== resource) {
      return false;
    }

    switch (permission.scope) {
      case 'global':
        return user.role === 'super_admin';
      case 'university':
        if (user.role === 'super_admin') return true;
        if (['manager', 'tutor', 'platform_coordinator'].includes(user.role) &&
            user.universityId === context?.universityId) return true;
        if (user.role === 'professor' && user.isAdmin === true &&
            user.universityId === context?.universityId) return true;
        return false;
      case 'course':
        if (user.role === 'super_admin') return true;
        if (user.role === 'manager' &&
            user.universityId === context?.universityId) return true;
        if (user.role === 'professor' && user.isAdmin === true &&
            user.universityId === context?.universityId) return true;
        if (user.role === 'professor' && !user.isAdmin &&
            context?.courseId &&
            user.assignedCourses?.includes(context.courseId)) return true;
        if (user.role === 'student' &&
            context?.courseId &&
            user.assignedCourses?.includes(context.courseId)) return true;
        return false;
      default:
        return true;
    }
  });
}

export function getUserRoleDisplayName(role: UserRole): string {
  switch (role) {
    case 'super_admin':
      return 'Super Administrador';
    case 'manager':
      return 'Gestor';
    case 'tutor':
      return 'Tutor';
    case 'platform_coordinator':
      return 'Coordenador de Plataforma';
    case 'professor':
      return 'Professor';
    case 'student':
      return 'Estudante';
    default:
      return role;
  }
}

/**
 * Check if user can access a page based on their permissions.
 * Uses claims-based permission codes when available.
 */
export function canAccessPage(
  user: User | null,
  pagePath: string,
  _context?: PermissionContext
): boolean {
  if (!user) return false;

  // Super admin has full access, except the user-facing subscription page
  // (super_admin uses /admin/subscriptions instead)
  if (user.role === 'super_admin') return pagePath !== '/subscription';

  // If permissions are loaded, use permission-based page access
  if (user.permissions && user.permissions.length > 0) {
    const pagePermissions: Record<string, string[]> = {
      '/admin': ['universities:read'],
      '/universities': ['universities:read'],
      '/universities/create': ['universities:create'],
      '/analytics': ['analytics:read'],
      '/courses': ['courses:read'],
      '/courses/create': ['courses:create'],
      '/modules': ['modules:read'],
      '/modules/create': ['modules:create'],
      '/professors': ['staff:read'],
      '/professors/create': ['staff:create'],
      '/students': ['students:read'],
      '/files': ['files:read'],
      '/tokens': ['tokens:read'],
      '/models': ['universities:read'],
      '/admin/plans': ['universities:read'],
      '/admin/subscriptions': ['universities:read'],
      '/admin/permissions': ['universities:read'],
      '/subscription': ['subscription:manage'],
    };

    const requiredPerms = pagePermissions[pagePath];
    if (!requiredPerms) return true; // No specific requirements

    return requiredPerms.some(perm => user.permissions?.includes(perm));
  }

  // Fallback: Legacy role-based page access
  const pageRules: Record<string, (u: User) => boolean> = {
    '/admin': (u) => u.role === 'super_admin',
    '/universities': (u) => u.role === 'super_admin',
    '/universities/create': (u) => u.role === 'super_admin',
    '/analytics': (u) => ['super_admin', 'manager'].includes(u.role),
    '/courses': (u) => ['super_admin', 'manager', 'tutor', 'platform_coordinator', 'professor'].includes(u.role),
    '/courses/create': (u) => ['super_admin', 'manager', 'tutor'].includes(u.role) || (u.role === 'professor' && u.isAdmin === true),
    '/modules': (u) => ['super_admin', 'manager', 'tutor', 'platform_coordinator', 'professor'].includes(u.role),
    '/modules/create': (u) => ['super_admin', 'manager', 'tutor', 'professor'].includes(u.role),
    '/professors': (u) => ['super_admin', 'manager'].includes(u.role) || (u.role === 'professor' && u.isAdmin === true),
    '/professors/create': (u) => ['super_admin', 'manager'].includes(u.role) || (u.role === 'professor' && u.isAdmin === true),
    '/students': (u) => ['super_admin', 'manager', 'tutor', 'platform_coordinator', 'professor'].includes(u.role),
    '/files': (u) => ['super_admin', 'manager', 'tutor', 'platform_coordinator', 'professor'].includes(u.role),
    '/tokens': (u) => ['super_admin', 'manager', 'tutor', 'platform_coordinator', 'professor'].includes(u.role),
    '/models': (u) => u.role === 'super_admin',
    '/admin/plans': (u) => u.role === 'super_admin',
    '/admin/subscriptions': (u) => u.role === 'super_admin',
    '/admin/permissions': (u) => u.role === 'super_admin',
    '/subscription': (u) => ['manager', 'professor'].includes(u.role),
  };

  const rule = pageRules[pagePath];
  return rule ? rule(user) : true;
}

// ==================== Helper Permission Checks ====================

/**
 * Check if user has a specific permission code string (e.g. 'courses:read')
 */
export function hasPermissionCode(user: User | null, code: string): boolean {
  if (!user) return false;
  if (user.role === 'super_admin') return true;
  return user.permissions?.includes(code) ?? false;
}

/**
 * Check if user can access the AI Models management page (super_admin only)
 */
export function canAccessModelsPage(user: User | null): boolean {
  if (!user) return false;
  if (user.permissions?.length) {
    return user.permissions.includes('universities:read');
  }
  return user.role === 'super_admin';
}

/**
 * Check if user can access the Subscription page (non-enterprise universities only)
 * Enterprise universities manage limits directly via super_admin, not via subscription.
 */
export function canAccessSubscription(user: User | null, isEnterprise?: boolean): boolean {
  if (!user) return false;
  // Super admin manages subscriptions via /admin/subscriptions, not the user-facing page
  if (user.role === 'super_admin') return false;
  if (isEnterprise) return false;
  if (user.permissions?.length) {
    return user.permissions.includes('subscription:manage');
  }
  return ['manager', 'professor'].includes(user.role);
}

/**
 * Check if the user's university can create a new course, based on plan limits.
 * Returns true if within limits, false if at or over the limit.
 */
export function canCreateCourse(user: User | null, limits?: UniversityLimits | null): boolean {
  if (!user) return false;
  // If no limits data available, allow (will be enforced server-side)
  if (!limits) return true;
  return limits.currentCourses < limits.maxCourses;
}

/**
 * Check if the user's university can create a new module, based on plan limits.
 * Returns true if within limits, false if at or over the limit.
 */
export function canCreateModule(user: User | null, limits?: UniversityLimits | null): boolean {
  if (!user) return false;
  // If no limits data available, allow (will be enforced server-side)
  if (!limits) return true;
  return limits.currentModules < limits.maxModules;
}
