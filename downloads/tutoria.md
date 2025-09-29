# 🎓 Tutoria Frontend Implementation Plan

A comprehensive NextJS frontend implementation plan for the Tutoria API educational platform with role-based access control.

## 📋 Table of Contents

1. [Overview](#overview)
2. [API Analysis](#api-analysis)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Frontend Architecture](#frontend-architecture)
5. [Technology Stack](#technology-stack)
6. [Project Structure](#project-structure)
7. [Key Features](#key-features)
8. [Page-by-Page Implementation](#page-by-page-implementation)
9. [Authentication & Authorization](#authentication--authorization)
10. [State Management](#state-management)
11. [API Integration](#api-integration)
12. [UI/UX Guidelines](#uiux-guidelines)
13. [Development Roadmap](#development-roadmap)
14. [Security Considerations](#security-considerations)

## 🔍 Overview

The Tutoria API is an AI-powered educational platform with a hierarchical content organization structure: **Universities → Courses → Modules → Files**. The frontend needs to manage three distinct user types with specific permission levels and provide a comprehensive administrative interface.

### Core Requirements
- **Multi-university support** with scoped access control
- **Role-based authentication** (Super Admin, Admin Professor, Regular Professor)
- **Hierarchical content management** (Universities → Courses → Modules → Files)
- **AI tutoring integration** with module-specific system prompts
- **File management** with Azure Blob Storage
- **Module token system** for widget authentication
- **Responsive design** for all device types

## 🔗 API Analysis

Based on the codebase analysis, the API provides the following endpoint categories:

### Authentication Endpoints
```
POST /api/v2/auth/login                    # Login (all user types)
POST /api/v2/auth/refresh                  # JWT token refresh
POST /api/v2/auth/reset-password-request   # Password reset (Super Admin only)
POST /api/v2/auth/reset-password           # Reset with token
PUT  /api/v2/auth/password                 # Update current user password
```

### Super Admin Endpoints
```
GET  /api/v2/super-admins/stats            # System statistics
GET  /api/v2/super-admins/super-admins/    # List super admins
POST /api/v2/super-admins/super-admins/    # Create super admin
PUT  /api/v2/super-admins/super-admins/{id} # Update super admin
GET  /api/v2/super-admins/universities/all # All universities
GET  /api/v2/super-admins/professors/all   # All professors
```

### University Management
```
GET    /api/v2/universities/               # List universities
POST   /api/v2/universities/               # Create university (super admin only)
GET    /api/v2/universities/{id}           # Get university details
PUT    /api/v2/universities/{id}           # Update university
DELETE /api/v2/universities/{id}           # Delete university
```

### Course Management
```
GET    /api/v2/courses/                    # List courses (access-controlled)
POST   /api/v2/courses/                    # Create course (admin only)
GET    /api/v2/courses/{id}                # Get course details
PUT    /api/v2/courses/{id}                # Update course
DELETE /api/v2/courses/{id}                # Delete course
POST   /api/v2/courses/{id}/professors/{prof_id}    # Assign professor
DELETE /api/v2/courses/{id}/professors/{prof_id}    # Unassign professor
```

### Module Management
```
GET    /api/v2/modules/                    # List modules (for assigned courses)
POST   /api/v2/modules/                    # Create module
GET    /api/v2/modules/{id}                # Get module details
PUT    /api/v2/modules/{id}                # Update module (including system prompt)
DELETE /api/v2/modules/{id}                # Delete module
```

### File Management
```
GET    /api/v2/files/                      # List files (access-controlled)
POST   /api/v2/files/                      # Upload file to Azure Blob Storage
GET    /api/v2/files/{id}                  # Get file metadata
PUT    /api/v2/files/{id}                  # Update file metadata
DELETE /api/v2/files/{id}                  # Delete file
GET    /api/v2/files/{id}/download         # Download file (SAS URL redirect)
```

### Professor Management
```
GET    /api/v2/professors/                 # List professors
POST   /api/v2/professors/                 # Create professor
GET    /api/v2/professors/{id}             # Get professor details
PUT    /api/v2/professors/{id}             # Update professor
DELETE /api/v2/professors/{id}             # Delete professor
```

### Student Management
```
GET    /api/v2/students/                   # List students
POST   /api/v2/students/                   # Create student
GET    /api/v2/students/{id}               # Get student details
PUT    /api/v2/students/{id}               # Update student
DELETE /api/v2/students/{id}               # Delete student
```

### Module Token Management
```
GET    /api/v2/module-tokens/              # List tokens for professor's modules
POST   /api/v2/module-tokens/              # Create new widget token
PUT    /api/v2/module-tokens/{id}          # Update token permissions
DELETE /api/v2/module-tokens/{id}          # Delete token
```

### AI Tutoring
```
POST /api/v2/tutor/ask                     # Main Q&A endpoint (with file upload)
```

## 👥 User Roles & Permissions

### Super Admin
**Access Level:** Global across all universities
**Capabilities:**
- ✅ Create and manage universities
- ✅ Create other super admin accounts
- ✅ Create admin professor accounts for any university
- ✅ View system-wide statistics and analytics
- ✅ Access all data across all universities
- ✅ Reset passwords for any user type
- ✅ View all professors and universities globally

**UI Features:**
- System dashboard with global statistics
- University creation and management interface
- Super admin management panel
- Global search and filtering across all entities
- System-wide reporting and analytics

### Admin Professor (`IsAdmin = True`)
**Access Level:** University-scoped
**Capabilities:**
- ✅ Create and manage courses within their university
- ✅ Create regular professor accounts in their university
- ✅ Assign professors to courses within their university
- ✅ Create and manage modules for any course in their university
- ✅ Create module access tokens
- ✅ Manage all students within their university
- ✅ Upload and manage files for any module in their university

**UI Features:**
- University-scoped dashboard
- Course creation and management
- Professor creation and course assignment interface
- Module and file management across all university courses
- Student management for university courses
- Module token creation and analytics

### Regular Professor (`IsAdmin = False`)
**Access Level:** Course-specific (via ProfessorCourses table)
**Capabilities:**
- ✅ View and manage only assigned courses
- ✅ Create and manage modules for assigned courses
- ✅ Upload and manage files for their modules
- ✅ Create module access tokens for their modules
- ✅ Manage students in their assigned courses
- ✅ Configure AI system prompts for their modules

**UI Features:**
- Course-scoped dashboard
- Module creation and management for assigned courses
- File upload and organization for their modules
- Module token creation for their content
- Student management for assigned courses
- AI tutor configuration interface

## 🏗️ Frontend Architecture

### Technology Stack

**Core Framework:**
- **NextJS 14** with App Router for modern React development
- **TypeScript** for type safety and better developer experience
- **Tailwind CSS** for utility-first styling
- **shadcn/ui** for consistent, accessible UI components

**State Management:**
- **Zustand** for global state (auth, user preferences)
- **TanStack Query (React Query)** for server state management and caching
- **React Hook Form** for form state and validation
- **Zod** for runtime type validation

**HTTP & File Handling:**
- **Axios** with interceptors for API communication
- **React Dropzone** for file upload functionality
- **SWR** for data fetching fallbacks

**UI & Visualization:**
- **TanStack Table** for data tables with sorting, filtering, pagination
- **Recharts** for analytics dashboards and data visualization
- **Lucide React** for consistent iconography
- **React Hot Toast** for notifications

**Development Tools:**
- **ESLint** and **Prettier** for code quality
- **Husky** for git hooks
- **TypeScript** strict mode
- **Tailwind CSS IntelliSense**

## 📁 Project Structure

```
src/
├── app/                          # NextJS App Router
│   ├── (auth)/                   # Authentication routes group
│   │   ├── login/
│   │   │   └── page.tsx          # Login page
│   │   ├── forgot-password/
│   │   │   └── page.tsx          # Password reset request
│   │   ├── reset-password/
│   │   │   └── page.tsx          # Password reset with token
│   │   └── layout.tsx            # Auth layout (minimal, centered)
│   │
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── layout.tsx            # Main dashboard layout with navigation
│   │   ├── page.tsx              # Dashboard home (role-specific)
│   │   ├── loading.tsx           # Global loading UI
│   │   ├── error.tsx             # Global error boundary
│   │   │
│   │   ├── universities/         # University Management
│   │   │   ├── page.tsx          # Universities list
│   │   │   ├── create/
│   │   │   │   └── page.tsx      # Create university (Super Admin only)
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # University details
│   │   │       ├── edit/
│   │   │       │   └── page.tsx  # Edit university
│   │   │       └── courses/
│   │   │           └── page.tsx  # University courses
│   │   │
│   │   ├── courses/              # Course Management
│   │   │   ├── page.tsx          # Courses list (filtered by permissions)
│   │   │   ├── create/
│   │   │   │   └── page.tsx      # Create course (Admin Professor only)
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # Course details
│   │   │       ├── edit/
│   │   │       │   └── page.tsx  # Edit course
│   │   │       ├── professors/
│   │   │       │   └── page.tsx  # Assign/manage professors
│   │   │       ├── modules/
│   │   │       │   └── page.tsx  # Course modules
│   │   │       └── students/
│   │   │           └── page.tsx  # Course students
│   │   │
│   │   ├── modules/              # Module Management
│   │   │   ├── page.tsx          # Modules list (filtered by permissions)
│   │   │   ├── create/
│   │   │   │   └── page.tsx      # Create module
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # Module details
│   │   │       ├── edit/
│   │   │       │   └── page.tsx  # Edit module & AI prompt
│   │   │       ├── files/
│   │   │       │   └── page.tsx  # Module files
│   │   │       └── tokens/
│   │   │           └── page.tsx  # Module access tokens
│   │   │
│   │   ├── professors/           # Professor Management
│   │   │   ├── page.tsx          # Professors list
│   │   │   ├── create/
│   │   │   │   └── page.tsx      # Create professor (Admin+ only)
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # Professor profile
│   │   │       ├── edit/
│   │   │       │   └── page.tsx  # Edit professor
│   │   │       └── courses/
│   │   │           └── page.tsx  # Professor's courses
│   │   │
│   │   ├── students/             # Student Management
│   │   │   ├── page.tsx          # Students list
│   │   │   ├── create/
│   │   │   │   └── page.tsx      # Create student
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # Student profile
│   │   │       └── edit/
│   │   │           └── page.tsx  # Edit student
│   │   │
│   │   ├── files/                # File Management
│   │   │   ├── page.tsx          # Files list (filtered by permissions)
│   │   │   ├── upload/
│   │   │   │   └── page.tsx      # File upload interface
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # File details
│   │   │       └── edit/
│   │   │           └── page.tsx  # Edit file metadata
│   │   │
│   │   ├── tokens/               # Module Token Management
│   │   │   ├── page.tsx          # Tokens list
│   │   │   ├── create/
│   │   │   │   └── page.tsx      # Create token
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # Token details & analytics
│   │   │       └── edit/
│   │   │           └── page.tsx  # Edit token permissions
│   │   │
│   │   ├── admin/                # Super Admin Only
│   │   │   ├── page.tsx          # System overview
│   │   │   ├── super-admins/
│   │   │   │   ├── page.tsx      # Super admins list
│   │   │   │   ├── create/
│   │   │   │   │   └── page.tsx  # Create super admin
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx  # Super admin details
│   │   │   ├── system-stats/
│   │   │   │   └── page.tsx      # System analytics
│   │   │   └── global-search/
│   │   │       └── page.tsx      # Global search interface
│   │   │
│   │   └── profile/              # User Profile
│   │       ├── page.tsx          # View profile
│   │       ├── edit/
│   │       │   └── page.tsx      # Edit profile
│   │       └── change-password/
│   │           └── page.tsx      # Change password
│   │
│   ├── api/                      # API routes (optional, for caching)
│   │   └── revalidate/
│   │       └── route.ts          # Cache revalidation
│   │
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   ├── loading.tsx               # Global loading component
│   ├── error.tsx                 # Global error boundary
│   └── not-found.tsx             # 404 page
│
├── components/                   # Reusable components
│   ├── ui/                       # Base UI components (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── table.tsx
│   │   ├── dialog.tsx
│   │   ├── select.tsx
│   │   ├── textarea.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── toast.tsx
│   │   └── ...
│   │
│   ├── layout/                   # Layout components
│   │   ├── Header.tsx            # Main header with user menu
│   │   ├── Sidebar.tsx           # Navigation sidebar
│   │   ├── Breadcrumbs.tsx       # Breadcrumb navigation
│   │   ├── PageHeader.tsx        # Page title and actions
│   │   └── Footer.tsx            # Footer component
│   │
│   ├── auth/                     # Authentication components
│   │   ├── LoginForm.tsx         # Login form
│   │   ├── ProtectedRoute.tsx    # Route protection wrapper
│   │   ├── RoleGuard.tsx         # Role-based rendering
│   │   └── AuthProvider.tsx      # Auth context provider
│   │
│   ├── forms/                    # Form components
│   │   ├── UniversityForm.tsx    # University create/edit form
│   │   ├── CourseForm.tsx        # Course create/edit form
│   │   ├── ModuleForm.tsx        # Module create/edit form
│   │   ├── ProfessorForm.tsx     # Professor create/edit form
│   │   ├── StudentForm.tsx       # Student create/edit form
│   │   ├── FileUploadForm.tsx    # File upload form
│   │   └── TokenForm.tsx         # Module token form
│   │
│   ├── tables/                   # Data table components
│   │   ├── UniversitiesTable.tsx # Universities data table
│   │   ├── CoursesTable.tsx      # Courses data table
│   │   ├── ModulesTable.tsx      # Modules data table
│   │   ├── ProfessorsTable.tsx   # Professors data table
│   │   ├── StudentsTable.tsx     # Students data table
│   │   ├── FilesTable.tsx        # Files data table
│   │   ├── TokensTable.tsx       # Tokens data table
│   │   └── DataTable.tsx         # Generic table wrapper
│   │
│   ├── dashboard/                # Dashboard-specific components
│   │   ├── StatsCard.tsx         # Statistics display card
│   │   ├── RecentActivity.tsx    # Recent activity feed
│   │   ├── QuickActions.tsx      # Quick action buttons
│   │   └── SystemHealth.tsx      # System status indicators
│   │
│   └── shared/                   # Shared utility components
│       ├── LoadingSpinner.tsx    # Loading indicator
│       ├── ErrorBoundary.tsx     # Error boundary wrapper
│       ├── ConfirmDialog.tsx     # Confirmation modal
│       ├── SearchInput.tsx       # Search input component
│       ├── FilterDropdown.tsx    # Filter dropdown
│       ├── Pagination.tsx        # Pagination controls
│       ├── FilePreview.tsx       # File preview modal
│       └── CopyButton.tsx        # Copy to clipboard button
│
├── lib/                          # Core utilities
│   ├── api.ts                    # API client configuration
│   ├── auth.ts                   # Authentication utilities
│   ├── types.ts                  # TypeScript type definitions
│   ├── utils.ts                  # General utility functions
│   ├── validations.ts            # Zod validation schemas
│   ├── constants.ts              # Application constants
│   └── permissions.ts            # Permission checking utilities
│
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts                # Authentication hook
│   ├── usePermissions.ts         # Permission checking hook
│   ├── usePagination.ts          # Pagination hook
│   ├── useDebounce.ts            # Debounce hook
│   ├── useLocalStorage.ts        # Local storage hook
│   └── api/                      # API-specific hooks
│       ├── useUniversities.ts    # Universities data hooks
│       ├── useCourses.ts         # Courses data hooks
│       ├── useModules.ts         # Modules data hooks
│       ├── useProfessors.ts      # Professors data hooks
│       ├── useStudents.ts        # Students data hooks
│       ├── useFiles.ts           # Files data hooks
│       └── useTokens.ts          # Tokens data hooks
│
├── store/                        # Global state management
│   ├── authStore.ts              # Authentication state
│   ├── uiStore.ts                # UI state (sidebar, theme, etc.)
│   └── cacheStore.ts             # Client-side cache management
│
├── styles/                       # Additional styles
│   ├── globals.css               # Global CSS variables
│   └── components.css            # Component-specific styles
│
└── middleware.ts                 # NextJS middleware for auth
```

## 🔑 Key Features Implementation

### 1. Role-Based Dashboard

Each user type sees a customized dashboard upon login:

**Super Admin Dashboard:**
- System-wide statistics (total universities, courses, professors, students)
- Recent activity across all universities
- Quick actions: Create University, Create Admin Professor, View System Health
- Global search functionality
- System alerts and notifications

**Admin Professor Dashboard:**
- University-scoped statistics and metrics
- Course management overview for their university
- Professor and student counts for their university
- Quick actions: Create Course, Create Professor, Manage Students
- University-specific activity feed

**Regular Professor Dashboard:**
- Personal course assignments and module overview
- Student count for assigned courses
- Recent student interactions and AI tutor usage
- Quick actions: Create Module, Upload Files, Create Token
- Module-specific analytics

### 2. Hierarchical Navigation

Implement breadcrumb navigation that reflects the data hierarchy:
```
Universities > University of Technology > Computer Science > Module 1 > Files
```

### 3. Permission-Based UI Rendering

```typescript
// Example component usage
<RoleGuard allowedRoles={['super_admin', 'admin_professor']}>
  <Button onClick={createCourse}>Create Course</Button>
</RoleGuard>

<PermissionGuard action="create" resource="university">
  <CreateUniversityButton />
</PermissionGuard>
```

### 4. Advanced Data Tables

Implement sophisticated data tables with:
- Server-side pagination, sorting, and filtering
- Column customization based on user role
- Bulk actions (where appropriate)
- Export functionality
- Real-time updates

### 5. File Management System

- Drag-and-drop file upload interface
- File preview capabilities (PDF, images, documents)
- Azure Blob Storage integration
- Progress indicators for uploads
- File organization by module
- Download tracking and analytics

### 6. Module Token Management

- Token creation wizard with permission configuration
- Token usage analytics and monitoring
- Token sharing interface for LMS integration
- Embed code generation for widgets
- Usage limits and expiration management

## 🔐 Authentication & Authorization

### JWT Token Management

```typescript
// lib/auth.ts
export class AuthService {
  private static instance: AuthService;
  
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    const response = await api.post('/auth/login', credentials);
    const { access_token, token_type } = response.data;
    
    // Store token securely
    this.setToken(access_token);
    
    // Decode and store user info
    const userInfo = this.decodeToken(access_token);
    this.setUser(userInfo);
    
    return { success: true, user: userInfo };
  }
  
  async refreshToken(): Promise<void> {
    const response = await api.post('/auth/refresh');
    this.setToken(response.data.access_token);
  }
  
  getUser(): User | null {
    return this.user;
  }
  
  hasPermission(action: string, resource: string): boolean {
    return checkPermission(this.user, action, resource);
  }
}
```

### Permission System

```typescript
// lib/permissions.ts
export interface Permission {
  action: 'create' | 'read' | 'update' | 'delete';
  resource: 'university' | 'course' | 'module' | 'professor' | 'student' | 'file' | 'token';
  scope?: 'global' | 'university' | 'course';
}

export const rolePermissions: Record<UserRole, Permission[]> = {
  super_admin: [
    { action: 'create', resource: 'university', scope: 'global' },
    { action: 'create', resource: 'professor', scope: 'global' },
    // ... all permissions
  ],
  admin_professor: [
    { action: 'create', resource: 'course', scope: 'university' },
    { action: 'create', resource: 'professor', scope: 'university' },
    // ... university-scoped permissions
  ],
  regular_professor: [
    { action: 'create', resource: 'module', scope: 'course' },
    { action: 'create', resource: 'file', scope: 'course' },
    // ... course-scoped permissions
  ]
};

export function checkPermission(
  user: User, 
  action: string, 
  resource: string,
  context?: { universityId?: number; courseId?: number }
): boolean {
  const userPermissions = rolePermissions[user.role];
  
  return userPermissions.some(permission => {
    if (permission.action !== action || permission.resource !== resource) {
      return false;
    }
    
    // Check scope-specific permissions
    switch (permission.scope) {
      case 'global':
        return user.role === 'super_admin';
      case 'university':
        return user.role === 'super_admin' || 
               (user.role === 'admin_professor' && user.university_id === context?.universityId);
      case 'course':
        return user.role === 'super_admin' ||
               (user.role === 'admin_professor' && user.university_id === context?.universityId) ||
               (user.role === 'regular_professor' && user.assigned_courses?.includes(context?.courseId));
      default:
        return true;
    }
  });
}
```

### Route Protection

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  try {
    const user = await verifyToken(token);
    
    // Check role-based access
    const path = request.nextUrl.pathname;
    if (path.startsWith('/admin') && user.role !== 'super_admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    return NextResponse.next();
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*']
};
```

## 🗄️ State Management

### Authentication Store

```typescript
// store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  hasPermission: (action: string, resource: string, context?: any) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: async (credentials) => {
        const auth = new AuthService();
        const result = await auth.login(credentials);
        
        set({
          user: result.user,
          token: result.token,
          isAuthenticated: true
        });
      },
      
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false
        });
      },
      
      refreshToken: async () => {
        const auth = new AuthService();
        await auth.refreshToken();
      },
      
      hasPermission: (action, resource, context) => {
        const { user } = get();
        return user ? checkPermission(user, action, resource, context) : false;
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        isAuthenticated: state.isAuthenticated 
      })
    }
  )
);
```

### Data Fetching with TanStack Query

```typescript
// hooks/api/useUniversities.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useUniversities(params?: PaginationParams) {
  return useQuery({
    queryKey: ['universities', params],
    queryFn: () => api.getUniversities(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateUniversity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: UniversityCreate) => api.createUniversity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['universities'] });
    },
  });
}

export function useUniversity(id: number) {
  return useQuery({
    queryKey: ['university', id],
    queryFn: () => api.getUniversity(id),
    enabled: !!id,
  });
}
```

## 🌐 API Integration

### API Client Configuration

```typescript
// lib/api.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/authStore';

class TutoriaAPIClient {
  private client: AxiosInstance;
  
  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
      timeout: 30000,
    });
    
    this.setupInterceptors();
  }
  
  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const { token } = useAuthStore.getState();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Response interceptor for token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            await useAuthStore.getState().refreshToken();
            return this.client(originalRequest);
          } catch (refreshError) {
            useAuthStore.getState().logout();
            window.location.href = '/login';
          }
        }
        
        return Promise.reject(error);
      }
    );
  }
  
  // Authentication
  async login(credentials: LoginCredentials): Promise<TokenResponse> {
    const response = await this.client.post('/api/v2/auth/login', credentials);
    return response.data;
  }
  
  // Universities
  async getUniversities(params?: PaginationParams): Promise<PaginatedResponse<University>> {
    const response = await this.client.get('/api/v2/universities/', { params });
    return response.data;
  }
  
  async createUniversity(data: UniversityCreate): Promise<University> {
    const response = await this.client.post('/api/v2/universities/', data);
    return response.data;
  }
  
  async getUniversity(id: number): Promise<UniversityWithCourses> {
    const response = await this.client.get(`/api/v2/universities/${id}`);
    return response.data;
  }
  
  async updateUniversity(id: number, data: UniversityUpdate): Promise<University> {
    const response = await this.client.put(`/api/v2/universities/${id}`, data);
    return response.data;
  }
  
  async deleteUniversity(id: number): Promise<void> {
    await this.client.delete(`/api/v2/universities/${id}`);
  }
  
  // Courses
  async getCourses(params?: CourseFilters): Promise<PaginatedResponse<Course>> {
    const response = await this.client.get('/api/v2/courses/', { params });
    return response.data;
  }
  
  async createCourse(data: CourseCreate): Promise<Course> {
    const response = await this.client.post('/api/v2/courses/', data);
    return response.data;
  }
  
  async assignProfessorToCourse(courseId: number, professorId: number): Promise<void> {
    await this.client.post(`/api/v2/courses/${courseId}/professors/${professorId}`);
  }
  
  // Modules
  async getModules(params?: ModuleFilters): Promise<PaginatedResponse<Module>> {
    const response = await this.client.get('/api/v2/modules/', { params });
    return response.data;
  }
  
  async createModule(data: ModuleCreate): Promise<Module> {
    const response = await this.client.post('/api/v2/modules/', data);
    return response.data;
  }
  
  async updateModule(id: number, data: ModuleUpdate): Promise<Module> {
    const response = await this.client.put(`/api/v2/modules/${id}`, data);
    return response.data;
  }
  
  // Files
  async uploadFile(data: FormData): Promise<FileResponse> {
    const response = await this.client.post('/api/v2/files/', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        const progress = progressEvent.total 
          ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
          : 0;
        // Handle progress updates
      }
    });
    return response.data;
  }
  
  async getFileDownloadUrl(id: number): Promise<string> {
    const response = await this.client.get(`/api/v2/files/${id}/download`);
    return response.data.download_url;
  }
  
  // Module Tokens
  async getModuleTokens(params?: TokenFilters): Promise<PaginatedResponse<ModuleToken>> {
    const response = await this.client.get('/api/v2/module-tokens/', { params });
    return response.data;
  }
  
  async createModuleToken(data: ModuleTokenCreate): Promise<ModuleToken> {
    const response = await this.client.post('/api/v2/module-tokens/', data);
    return response.data;
  }
  
  // Professors
  async getProfessors(params?: ProfessorFilters): Promise<PaginatedResponse<Professor>> {
    const response = await this.client.get('/api/v2/professors/', { params });
    return response.data;
  }
  
  async createProfessor(data: ProfessorCreate): Promise<Professor> {
    const response = await this.client.post('/api/v2/professors/', data);
    return response.data;
  }
  
  // Students
  async getStudents(params?: StudentFilters): Promise<PaginatedResponse<Student>> {
    const response = await this.client.get('/api/v2/students/', { params });
    return response.data;
  }
  
  async createStudent(data: StudentCreate): Promise<Student> {
    const response = await this.client.post('/api/v2/students/', data);
    return response.data;
  }
  
  // Super Admin
  async getSystemStats(): Promise<SystemStats> {
    const response = await this.client.get('/api/v2/super-admins/stats');
    return response.data;
  }
  
  async getSuperAdmins(params?: PaginationParams): Promise<PaginatedResponse<SuperAdmin>> {
    const response = await this.client.get('/api/v2/super-admins/super-admins/', { params });
    return response.data;
  }
  
  async createSuperAdmin(data: SuperAdminCreate): Promise<SuperAdmin> {
    const response = await this.client.post('/api/v2/super-admins/super-admins/', data);
    return response.data;
  }
}

export const api = new TutoriaAPIClient();
```

## 🎨 UI/UX Guidelines

### Design System

**Color Palette:**
- Primary: Blue (#3B82F6) for main actions and branding
- Secondary: Purple (#8B5CF6) for accent elements
- Success: Green (#10B981) for positive actions
- Warning: Amber (#F59E0B) for cautions
- Error: Red (#EF4444) for errors and destructive actions
- Neutral: Gray scale for text and backgrounds

**Typography:**
- Headings: Inter font family, weights 600-700
- Body text: Inter font family, weights 400-500
- Code: JetBrains Mono for code snippets and tokens

**Spacing:**
- Base unit: 4px (0.25rem)
- Components: 16px (1rem) standard spacing
- Sections: 24px (1.5rem) between major sections
- Pages: 32px (2rem) page margins

### Component Guidelines

**Data Tables:**
- Consistent column widths and alignment
- Sortable headers with clear indicators
- Pagination controls at bottom
- Loading states with skeleton screens
- Empty states with helpful messaging

**Forms:**
- Clear field labels and validation messages
- Progressive disclosure for complex forms
- Auto-save where appropriate
- Loading states during submission

**Navigation:**
- Consistent sidebar navigation with role-based visibility
- Breadcrumbs for hierarchical navigation
- Active states for current page/section
- Mobile-responsive hamburger menu

**File Upload:**
- Drag-and-drop zones with clear visual feedback
- Progress indicators for uploads
- File type and size restrictions clearly communicated
- Preview capabilities for supported file types

## 🚀 Development Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [ ] Project setup with NextJS 14 and TypeScript
- [ ] Authentication system implementation
- [ ] Basic UI components with shadcn/ui
- [ ] API client setup with Axios
- [ ] Role-based routing and middleware
- [ ] State management with Zustand and TanStack Query

### Phase 2: Core Entities (Weeks 3-5)
- [ ] University management (Super Admin)
- [ ] Course management (Admin Professor)
- [ ] Professor management and assignment
- [ ] Basic dashboard for each role
- [ ] Permission system implementation
- [ ] Data tables with pagination and filtering

### Phase 3: Content Management (Weeks 6-8)
- [ ] Module creation and management
- [ ] File upload and management system
- [ ] Azure Blob Storage integration
- [ ] Module token creation and management
- [ ] AI system prompt configuration
- [ ] Student management

### Phase 4: Advanced Features (Weeks 9-11)
- [ ] Analytics dashboards
- [ ] Advanced search and filtering
- [ ] Bulk operations
- [ ] Export functionality
- [ ] Token usage analytics
- [ ] System health monitoring

### Phase 5: Polish & Testing (Weeks 12-14)
- [ ] Comprehensive testing suite
- [ ] Performance optimization
- [ ] Accessibility improvements
- [ ] Mobile responsiveness
- [ ] Error handling and edge cases
- [ ] Documentation and deployment

## 🔒 Security Considerations

### Authentication Security
- **JWT Token Storage:** Use httpOnly cookies for token storage
- **Token Refresh:** Implement automatic token refresh mechanism
- **Session Management:** Clear tokens on logout and implement session timeouts

### Authorization Security
- **Server-Side Validation:** Always validate permissions on the server
- **Resource Scoping:** Ensure users can only access their permitted resources
- **API Security:** Implement rate limiting and request validation

### Data Security
- **Input Validation:** Validate all user inputs with Zod schemas
- **XSS Prevention:** Sanitize user-generated content
- **CSRF Protection:** Implement CSRF tokens for state-changing operations
- **File Upload Security:** Validate file types and implement virus scanning

### Privacy & Compliance
- **Data Minimization:** Only collect and display necessary user data
- **Audit Logging:** Log all significant user actions for audit trails
- **Error Handling:** Don't expose sensitive information in error messages

## 📊 Monitoring & Analytics

### User Analytics
- Track user engagement and feature usage
- Monitor login patterns and session durations
- Analyze module and file access patterns

### Performance Monitoring
- Monitor API response times and error rates
- Track file upload success rates and performance
- Monitor authentication and authorization performance

### System Health
- Database connection monitoring
- Azure Blob Storage availability
- API endpoint health checks

This comprehensive implementation plan provides a solid foundation for building a production-ready frontend for the Tutoria API platform. The modular architecture, robust permission system, and focus on user experience will ensure the platform scales effectively while maintaining security and performance standards.