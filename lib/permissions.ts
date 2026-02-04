import type { User, UserRole, Permission, PermissionContext } from './types';

// Note: Permissions are scoped to user roles and their assigned universities/courses
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

  // Manager - Full university permissions + analytics (formerly "Admin Professor")
  // - Can create/edit courses, manage staff in their university
  // - Has access to analytics dashboard
  manager: [
    // Courses - University scope
    { action: 'create', resource: 'course', scope: 'university' },
    { action: 'read', resource: 'course', scope: 'university' },
    { action: 'update', resource: 'course', scope: 'university' },
    { action: 'delete', resource: 'course', scope: 'university' },

    // Modules - University scope
    { action: 'create', resource: 'module', scope: 'university' },
    { action: 'read', resource: 'module', scope: 'university' },
    { action: 'update', resource: 'module', scope: 'university' },
    { action: 'delete', resource: 'module', scope: 'university' },

    // Staff (Tutors, Platform Coordinators, Professors, Students) - University scope
    { action: 'create', resource: 'professor', scope: 'university' },
    { action: 'read', resource: 'professor', scope: 'university' },
    { action: 'update', resource: 'professor', scope: 'university' },
    { action: 'delete', resource: 'professor', scope: 'university' },

    { action: 'create', resource: 'student', scope: 'university' },
    { action: 'read', resource: 'student', scope: 'university' },
    { action: 'update', resource: 'student', scope: 'university' },
    { action: 'delete', resource: 'student', scope: 'university' },

    // Files - University scope
    { action: 'create', resource: 'file', scope: 'university' },
    { action: 'read', resource: 'file', scope: 'university' },
    { action: 'update', resource: 'file', scope: 'university' },
    { action: 'delete', resource: 'file', scope: 'university' },

    // Tokens - University scope
    { action: 'create', resource: 'token', scope: 'university' },
    { action: 'read', resource: 'token', scope: 'university' },
    { action: 'update', resource: 'token', scope: 'university' },
    { action: 'delete', resource: 'token', scope: 'university' },
  ],

  // Tutor - Can create courses/modules/tokens, NO analytics
  tutor: [
    // Courses - University scope
    { action: 'create', resource: 'course', scope: 'university' },
    { action: 'read', resource: 'course', scope: 'university' },
    { action: 'update', resource: 'course', scope: 'university' },
    { action: 'delete', resource: 'course', scope: 'university' },

    // Modules - University scope
    { action: 'create', resource: 'module', scope: 'university' },
    { action: 'read', resource: 'module', scope: 'university' },
    { action: 'update', resource: 'module', scope: 'university' },
    { action: 'delete', resource: 'module', scope: 'university' },

    // Files - University scope
    { action: 'create', resource: 'file', scope: 'university' },
    { action: 'read', resource: 'file', scope: 'university' },
    { action: 'update', resource: 'file', scope: 'university' },
    { action: 'delete', resource: 'file', scope: 'university' },

    // Tokens - University scope
    { action: 'create', resource: 'token', scope: 'university' },
    { action: 'read', resource: 'token', scope: 'university' },
    { action: 'update', resource: 'token', scope: 'university' },
    { action: 'delete', resource: 'token', scope: 'university' },

    // Students - Read only
    { action: 'read', resource: 'student', scope: 'university' },
  ],

  // Platform Coordinator (AVA Manager) - View courses/modules, generate tokens only
  platform_coordinator: [
    // Courses - Read only
    { action: 'read', resource: 'course', scope: 'university' },

    // Modules - Read only
    { action: 'read', resource: 'module', scope: 'university' },

    // Files - Read only
    { action: 'read', resource: 'file', scope: 'university' },

    // Tokens - Can create and manage
    { action: 'create', resource: 'token', scope: 'university' },
    { action: 'read', resource: 'token', scope: 'university' },
    { action: 'update', resource: 'token', scope: 'university' },
    { action: 'delete', resource: 'token', scope: 'university' },

    // Students - Read only
    { action: 'read', resource: 'student', scope: 'university' },
  ],

  // Professor - Legacy role (to be rethought later)
  // - Regular professors: can only create/edit modules in their assigned courses
  professor: [
    // Modules - Course scope (filtered by assignment)
    { action: 'create', resource: 'module', scope: 'course' },
    { action: 'read', resource: 'module', scope: 'course' },
    { action: 'update', resource: 'module', scope: 'course' },
    { action: 'delete', resource: 'module', scope: 'course' },

    // Files - Course scope
    { action: 'create', resource: 'file', scope: 'course' },
    { action: 'read', resource: 'file', scope: 'course' },
    { action: 'update', resource: 'file', scope: 'course' },
    { action: 'delete', resource: 'file', scope: 'course' },

    // Tokens - Course scope
    { action: 'create', resource: 'token', scope: 'course' },
    { action: 'read', resource: 'token', scope: 'course' },
    { action: 'update', resource: 'token', scope: 'course' },
    { action: 'delete', resource: 'token', scope: 'course' },

    // Students - Read only
    { action: 'read', resource: 'student', scope: 'course' },

    // Courses - Read only
    { action: 'read', resource: 'course', scope: 'course' },
  ],

  student: [
    // Students have very limited permissions - mostly read access to their own data
    { action: 'read', resource: 'course', scope: 'course' },
    { action: 'read', resource: 'module', scope: 'course' },
    { action: 'read', resource: 'file', scope: 'course' },
  ],
};

export function checkPermission(
  user: User | null,
  action: Permission['action'],
  resource: Permission['resource'],
  context?: PermissionContext
): boolean {
  if (!user) return false;

  const userPermissions = rolePermissions[user.role];

  return userPermissions.some(permission => {
    // Check if action and resource match
    if (permission.action !== action || permission.resource !== resource) {
      return false;
    }

    // Check scope-specific permissions
    switch (permission.scope) {
      case 'global':
        return user.role === 'super_admin';

      case 'university':
        // Super admin has global access
        if (user.role === 'super_admin') return true;

        // Manager, Tutor, Platform Coordinator have university-scoped access
        if (['manager', 'tutor', 'platform_coordinator'].includes(user.role) &&
            user.universityId === context?.universityId) return true;

        // Legacy: Support old professor with isAdmin flag
        if (user.role === 'professor' && user.isAdmin === true &&
            user.universityId === context?.universityId) return true;

        return false;

      case 'course':
        // Super admin has access to everything
        if (user.role === 'super_admin') return true;

        // Manager has access to courses in their university (via course lookup)
        if (user.role === 'manager' &&
            user.universityId === context?.universityId) return true;

        // Legacy: Admin professor has access to courses in their university
        if (user.role === 'professor' && user.isAdmin === true &&
            user.universityId === context?.universityId) return true;

        // Regular professor has access to assigned courses
        if (user.role === 'professor' && !user.isAdmin &&
            context?.courseId &&
            user.assignedCourses?.includes(context.courseId)) return true;

        // Student has access to enrolled courses
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

export function canAccessPage(
  user: User | null,
  pagePath: string,
  context?: PermissionContext
): boolean {
  if (!user) return false;

  // Define page access rules
  const pageRules: Record<string, (user: User, context?: PermissionContext) => boolean> = {
    '/admin': (user) => user.role === 'super_admin',
    '/universities': (user) => user.role === 'super_admin',
    '/universities/create': (user) => user.role === 'super_admin',
    '/analytics': (user) => ['super_admin', 'manager'].includes(user.role),
    '/courses': (user) => ['super_admin', 'manager', 'tutor', 'platform_coordinator', 'professor'].includes(user.role),
    '/courses/create': (user) => ['super_admin', 'manager', 'tutor'].includes(user.role) || (user.role === 'professor' && user.isAdmin === true),
    '/modules': (user) => ['super_admin', 'manager', 'tutor', 'platform_coordinator', 'professor'].includes(user.role),
    '/modules/create': (user) => ['super_admin', 'manager', 'tutor', 'professor'].includes(user.role),
    '/professors': (user) => ['super_admin', 'manager'].includes(user.role) || (user.role === 'professor' && user.isAdmin === true),
    '/professors/create': (user) => ['super_admin', 'manager'].includes(user.role) || (user.role === 'professor' && user.isAdmin === true),
    '/students': (user) => ['super_admin', 'manager', 'tutor', 'platform_coordinator', 'professor'].includes(user.role),
    '/files': (user) => ['super_admin', 'manager', 'tutor', 'platform_coordinator', 'professor'].includes(user.role),
    '/tokens': (user) => ['super_admin', 'manager', 'tutor', 'platform_coordinator', 'professor'].includes(user.role),
  };

  const rule = pageRules[pagePath];
  return rule ? rule(user, context) : true;
}
