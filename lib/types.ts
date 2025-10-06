// Core API Types for Tutoria Platform

// User Authentication Types
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole; // 'super_admin', 'professor', or 'student'
  university_id?: number;
  is_admin?: boolean; // Only for professors: true = admin professor, false = regular professor
  assigned_courses?: number[]; // Fetched separately via API for regular professors
  created_at: string;
  updated_at: string;
}

export type UserRole = 'super_admin' | 'professor' | 'student';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface AuthResult {
  success: boolean;
  user: User;
  token?: string;
}

// University Types
export interface University {
  id: number;
  name: string;
  code: string;
  description?: string;
  created_at: string;
  updated_at: string;
  courses_count?: number;
  professors_count?: number;
  students_count?: number;
}

export interface UniversityCreate {
  name: string;
  code: string;
  description?: string;
}

export interface UniversityUpdate {
  name: string;
  code: string;
  description?: string;
}

export interface UniversityWithCourses extends University {
  courses: Course[];
}

// Course Types
export interface Course {
  id: number;
  name: string;
  code: string;
  description?: string;
  university_id: number;
  university_name?: string;
  created_at: string;
  updated_at: string;
  modules_count?: number;
  professors_count?: number;
  students_count?: number;
}

export interface CourseCreate {
  name: string;
  code: string;
  description?: string;
  university_id: number;
}

export interface CourseUpdate {
  name?: string;
  code?: string;
  description?: string;
}

export interface CourseWithDetails extends Course {
  modules: Module[];
  professors: Professor[];
  students: Student[];
}

// Module Types
export interface Module {
  id: number;
  name: string;
  code?: string;
  description?: string;
  system_prompt?: string;
  semester?: number;
  year?: number;
  course_id: number;
  course_name?: string;
  university_id?: number;
  created_at: string;
  updated_at: string;
  files_count?: number;
  tokens_count?: number;
}

export interface ModuleCreate {
  name: string;
  code?: string;
  description?: string;
  system_prompt?: string;
  semester?: number;
  year?: number;
  course_id: number;
}

export interface ModuleUpdate {
  name?: string;
  code?: string;
  description?: string;
  system_prompt?: string;
  semester?: number;
  year?: number;
  course_id?: number;
}

export interface ModuleWithDetails extends Module {
  files: File[];
  tokens: ModuleToken[];
}

// File Types
export interface File {
  id: number;
  name: string;
  file_name: string;
  file_type: string;
  file_size?: number;
  content_type?: string;
  module_id: number;
  module_name?: string;
  course_name?: string;
  blob_url: string;
  blob_container?: string;
  blob_path?: string;
  created_at: string;
  updated_at: string;
}

export interface FileUpload {
  file: File;
  module_id: number;
}

export interface FileResponse extends File {
  download_url?: string;
}

// Professor Types
export interface Professor {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  university_id: number;
  university_name?: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
  courses_count?: number;
  assigned_courses?: Course[];
}

export interface ProfessorCreate {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  university_id: number;
  is_admin: boolean;
}

export interface ProfessorUpdate {
  email?: string;
  first_name?: string;
  last_name?: string;
  is_admin?: boolean;
}

// Student Types
export interface Student {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  university_id?: number;
  university_name?: string;
  created_at: string;
  updated_at: string;
  enrolled_courses?: Course[];
}

export interface StudentCreate {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  university_id?: number;
}

export interface StudentUpdate {
  email?: string;
  first_name?: string;
  last_name?: string;
}

// Module Token Types (API Schema)
export interface ModuleAccessToken {
  id: number;
  token: string;
  name: string;
  description?: string;
  module_id: number;
  module_name?: string;
  course_name?: string;
  allow_chat: boolean;
  allow_file_access: boolean;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_used_at?: string;
  usage_count?: number;
}

export interface ModuleAccessTokenCreate {
  name: string;
  description?: string;
  module_id: number;
  allow_chat: boolean;
  allow_file_access: boolean;
  expires_in_days?: number;
}

export interface ModuleAccessTokenUpdate {
  name?: string;
  description?: string;
  allow_chat?: boolean;
  allow_file_access?: boolean;
  is_active?: boolean;
}

// Legacy Module Token Types (for backwards compatibility)
export interface ModuleToken {
  id: number;
  token: string;
  name: string;
  module_id: number;
  module_name?: string;
  course_name?: string;
  permissions: TokenPermissions;
  created_at: string;
  updated_at: string;
  last_used?: string;
  usage_count?: number;
}

export interface TokenPermissions {
  can_ask_questions: boolean;
  can_upload_files: boolean;
  max_questions_per_day?: number;
  max_file_size_mb?: number;
}

export interface ModuleTokenCreate {
  name: string;
  module_id: number;
  permissions: TokenPermissions;
}

export interface ModuleTokenUpdate {
  name?: string;
  permissions?: TokenPermissions;
}

// Super Admin Types
export interface SuperAdmin {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
  updated_at: string;
}

export interface SuperAdminCreate {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
}

export interface SystemStats {
  total_universities: number;
  total_courses: number;
  total_modules: number;
  total_professors: number;
  total_students: number;
  total_files: number;
  total_tokens: number;
  storage_used_mb: number;
  api_calls_today: number;
}

// Pagination and Filtering Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface CourseFilters extends PaginationParams {
  university_id?: number;
  professor_id?: number;
  search?: string;
}

export interface ModuleFilters extends PaginationParams {
  course_id?: number;
  university_id?: number;
  search?: string;
}

export interface ProfessorFilters extends PaginationParams {
  university_id?: number;
  is_admin?: boolean;
  search?: string;
}

export interface StudentFilters extends PaginationParams {
  university_id?: number;
  course_id?: number;
  search?: string;
}

export interface FileFilters extends PaginationParams {
  module_id?: number;
  course_id?: number;
  content_type?: string;
  search?: string;
}

export interface TokenFilters extends PaginationParams {
  module_id?: number;
  course_id?: number;
  search?: string;
}

// Permission Types
export interface Permission {
  action: 'create' | 'read' | 'update' | 'delete';
  resource: 'university' | 'course' | 'module' | 'professor' | 'student' | 'file' | 'token';
  scope?: 'global' | 'university' | 'course';
}

export interface PermissionContext {
  universityId?: number;
  courseId?: number;
  moduleId?: number;
}

// AI Tutor Types
export interface TutorQuestion {
  question: string;
  files?: File[];
  module_token: string;
}

export interface TutorResponse {
  answer: string;
  sources?: string[];
  confidence?: number;
}

// Form Types
export interface FormError {
  field: string;
  message: string;
}

export interface FormState<T> {
  data: T;
  errors: FormError[];
  isSubmitting: boolean;
  isDirty: boolean;
}

// UI Types
export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: any, item: T) => React.ReactNode;
}

export interface FilterOption {
  label: string;
  value: string | number;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

export interface NavigationItem {
  label: string;
  href: string;
  icon?: React.ComponentType<any>;
  roles?: UserRole[]; // 'super_admin', 'professor', or 'student'
  requiresAdmin?: boolean; // For professors: requires is_admin = true
  children?: NavigationItem[];
}

// API Response Types
export interface APIError {
  message: string;
  code?: string;
  details?: any;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
}