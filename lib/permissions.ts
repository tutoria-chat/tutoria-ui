import type { User, UserRole, Permission, PermissionContext } from './types';

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
  
  admin_professor: [
    // Courses - University scoped
    { action: 'create', resource: 'course', scope: 'university' },
    { action: 'read', resource: 'course', scope: 'university' },
    { action: 'update', resource: 'course', scope: 'university' },
    { action: 'delete', resource: 'course', scope: 'university' },
    
    // Modules - University scoped
    { action: 'create', resource: 'module', scope: 'university' },
    { action: 'read', resource: 'module', scope: 'university' },
    { action: 'update', resource: 'module', scope: 'university' },
    { action: 'delete', resource: 'module', scope: 'university' },
    
    // Professors - University scoped
    { action: 'create', resource: 'professor', scope: 'university' },
    { action: 'read', resource: 'professor', scope: 'university' },
    { action: 'update', resource: 'professor', scope: 'university' },
    { action: 'delete', resource: 'professor', scope: 'university' },
    
    // Students - University scoped
    { action: 'create', resource: 'student', scope: 'university' },
    { action: 'read', resource: 'student', scope: 'university' },
    { action: 'update', resource: 'student', scope: 'university' },
    { action: 'delete', resource: 'student', scope: 'university' },
    
    // Files - University scoped
    { action: 'create', resource: 'file', scope: 'university' },
    { action: 'read', resource: 'file', scope: 'university' },
    { action: 'update', resource: 'file', scope: 'university' },
    { action: 'delete', resource: 'file', scope: 'university' },
    
    // Tokens - University scoped
    { action: 'create', resource: 'token', scope: 'university' },
    { action: 'read', resource: 'token', scope: 'university' },
    { action: 'update', resource: 'token', scope: 'university' },
    { action: 'delete', resource: 'token', scope: 'university' },
  ],
  
  regular_professor: [
    // Modules - Course scoped (only for assigned courses)
    { action: 'create', resource: 'module', scope: 'course' },
    { action: 'read', resource: 'module', scope: 'course' },
    { action: 'update', resource: 'module', scope: 'course' },
    { action: 'delete', resource: 'module', scope: 'course' },
    
    // Students - Course scoped
    { action: 'read', resource: 'student', scope: 'course' },
    { action: 'update', resource: 'student', scope: 'course' },
    
    // Files - Course scoped
    { action: 'create', resource: 'file', scope: 'course' },
    { action: 'read', resource: 'file', scope: 'course' },
    { action: 'update', resource: 'file', scope: 'course' },
    { action: 'delete', resource: 'file', scope: 'course' },
    
    // Tokens - Course scoped
    { action: 'create', resource: 'token', scope: 'course' },
    { action: 'read', resource: 'token', scope: 'course' },
    { action: 'update', resource: 'token', scope: 'course' },
    { action: 'delete', resource: 'token', scope: 'course' },
    
    // Courses - Read only for assigned courses
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
        return user.role === 'super_admin' || 
               (user.role === 'admin_professor' && 
                user.university_id === context?.universityId);
                
      case 'course':
        // Super admin has access to everything
        if (user.role === 'super_admin') return true;
        
        // Admin professor has access to courses in their university
        if (user.role === 'admin_professor' && 
            user.university_id === context?.universityId) return true;
        
        // Regular professor has access to assigned courses
        if (user.role === 'regular_professor' && 
            context?.courseId && 
            user.assigned_courses?.includes(context.courseId)) return true;
            
        // Student has access to enrolled courses
        if (user.role === 'student' && 
            context?.courseId && 
            user.assigned_courses?.includes(context.courseId)) return true;
            
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
    case 'admin_professor':
      return 'Professor Administrador';
    case 'regular_professor':
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
    '/courses': (user) => ['super_admin', 'admin_professor', 'regular_professor'].includes(user.role),
    '/courses/create': (user) => ['super_admin', 'admin_professor'].includes(user.role),
    '/modules': (user) => ['super_admin', 'admin_professor', 'regular_professor'].includes(user.role),
    '/professors': (user) => ['super_admin', 'admin_professor'].includes(user.role),
    '/professors/create': (user) => ['super_admin', 'admin_professor'].includes(user.role),
    '/students': (user) => ['super_admin', 'admin_professor', 'regular_professor'].includes(user.role),
    '/files': (user) => ['super_admin', 'admin_professor', 'regular_professor'].includes(user.role),
    '/tokens': (user) => ['super_admin', 'admin_professor', 'regular_professor'].includes(user.role),
  };
  
  const rule = pageRules[pagePath];
  return rule ? rule(user, context) : true;
}