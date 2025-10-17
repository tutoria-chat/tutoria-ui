// Core API Types for Tutoria Platform

// User Authentication Types
export interface User {
  id: number; // Maps to user_id from backend
  username?: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: UserRole; // 'super_admin', 'professor', or 'student'
  role: UserRole; // Alias for user_type (for backwards compatibility)
  is_active: boolean;
  university_id?: number;
  is_admin?: boolean; // Only for professors: true = admin professor, false = regular professor
  government_id?: string; // CPF (Brazil), SSN (US), etc.
  external_id?: string; // Student registration ID, employee ID, etc.
  birthdate?: string; // ISO date string
  assigned_courses?: number[]; // For professors: list of course IDs they're assigned to
  created_at: string;
  updated_at: string;
  last_login_at?: string | null;
  theme_preference?: string; // 'system' | 'light' | 'dark'
  language_preference?: string; // 'pt-br' | 'en' | 'es'
}

export type UserRole = 'super_admin' | 'professor' | 'student';

// Backend UserResponse type (matches API schema)
export interface UserResponse {
  user_id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: UserRole;
  is_active: boolean;
  is_admin?: boolean;
  university_id?: number;
  university_name?: string; // Included when joined with university table
  government_id?: string;
  external_id?: string;
  birthdate?: string;
  language_preference?: string;
  theme_preference?: string;
  created_at?: string;
  updated_at?: string;
  last_login_at?: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in?: number;
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
  code: string; // Fantasy Name (Nome Fantasia) - e.g., USP, BYU
  description?: string;
  address?: string;
  tax_id?: string; // CNPJ in Brazil, Tax ID in other countries
  contact_email?: string;
  contact_phone?: string;
  contact_person?: string;
  website?: string;
  subscription_tier: number; // 1 = Basic, 2 = Standard, 3 = Premium
  created_at: string;
  updated_at: string;
  courses_count?: number;
  professors_count?: number;
  students_count?: number;
}

export interface UniversityCreate {
  name: string;
  code: string; // Fantasy Name (Nome Fantasia) - e.g., USP, BYU
  description?: string;
  address?: string;
  tax_id?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_person?: string;
  website?: string;
}

export interface UniversityUpdate {
  name: string;
  code: string;
  description?: string;
  address?: string;
  tax_id?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_person?: string;
  website?: string;
  subscription_tier?: number; // 1 = Basic, 2 = Standard, 3 = Premium
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
  university?: University;
  modules: Module[];
  professors: Professor[];
  students: Student[];
}

// AI Model Types
export interface AIModel {
  id: number;
  model_name: string;
  display_name: string;
  provider: 'openai' | 'anthropic';
  max_tokens: number;
  supports_vision: boolean;
  supports_function_calling: boolean;
  input_cost_per_1m?: number;
  output_cost_per_1m?: number;
  required_tier: number; // 1 = Basic/Deprecated, 2 = Standard, 3 = Premium
  is_active: boolean;
  is_deprecated: boolean;
  deprecation_date?: string;
  description?: string;
  recommended_for?: string;
  created_at: string;
  updated_at?: string;
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
  tutor_language?: string; // Language for AI tutor responses (pt-br, en, es)
  ai_model_id?: number; // Selected AI model
  ai_model?: AIModel; // Populated AI model details
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
  tutor_language?: string;
  ai_model_id?: number;
}

export interface ModuleUpdate {
  name?: string;
  code?: string;
  description?: string;
  system_prompt?: string;
  semester?: number;
  year?: number;
  course_id?: number;
  tutor_language?: string;
  ai_model_id?: number;
}

export interface ModuleWithDetails extends Module {
  course?: Course;
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
// Note: Professors are now stored in the unified Users table
// This interface maps to UserResponse from backend with user_type='professor'
export interface Professor {
  id: number; // Maps to user_id from backend UserResponse
  username?: string;
  email: string;
  first_name: string;
  last_name: string;
  university_id: number;
  university_name?: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at?: string | null;
  language_preference?: string;
  theme_preference?: string;
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
// Note: SuperAdmins are now stored in the unified Users table
// This interface maps to UserResponse from backend with user_type='super_admin'
export interface SuperAdmin {
  id: number; // Maps to user_id from backend UserResponse
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  last_login_at?: string | null;
  language_preference?: string;
  theme_preference?: string;
}

export interface SuperAdminCreate {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  language_preference?: string; // 'pt-br' | 'en' | 'es'
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