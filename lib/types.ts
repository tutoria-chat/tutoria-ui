// Core API Types for Tutoria Platform
// IMPORTANT: All properties use camelCase to match C# API JSON serialization

// User Authentication Types
export interface User {
  id: number; // Maps to userId from backend
  username?: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: UserRole; // 'super_admin', 'professor', or 'student' - RECOMMENDED: Use this field
  role: UserRole; // @deprecated Alias for userType (for backwards compatibility). Prefer using userType instead.
  isActive: boolean;
  universityId?: number;
  isAdmin?: boolean; // Only for professors: true = admin professor, false = regular professor
  governmentId?: string; // CPF (Brazil), SSN (US), etc.
  externalId?: string; // Student registration ID, employee ID, etc.
  birthdate?: string; // ISO date string
  assignedCourses?: number[]; // For professors: list of course IDs they're assigned to
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
  themePreference?: string; // 'system' | 'light' | 'dark'
  languagePreference?: string; // 'pt-br' | 'en' | 'es'
}

export type UserRole = 'super_admin' | 'professor' | 'student';

// Backend UserResponse type (matches API schema)
export interface UserResponse {
  userId: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: UserRole;
  isActive: boolean;
  isAdmin?: boolean;
  universityId?: number;
  universityName?: string; // Included when joined with university table
  governmentId?: string;
  externalId?: string;
  birthdate?: string;
  studentCourseIds?: number[]; // For students
  professorCourseIds?: number[]; // For professors
  languagePreference?: string;
  themePreference?: string;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn?: number;
  // Minimal user info from login response
  userId?: number;
  username?: string;
  userType?: UserRole;
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
  taxId?: string; // CNPJ in Brazil, Tax ID in other countries
  contactEmail?: string;
  contactPhone?: string;
  contactPerson?: string;
  website?: string;
  subscriptionTier: number; // 1 = Basic, 2 = Standard, 3 = Premium
  createdAt: string;
  updatedAt: string;
  coursesCount?: number;
  professorsCount?: number;
  studentsCount?: number;
}

export interface UniversityCreate {
  name: string;
  code: string; // Fantasy Name (Nome Fantasia) - e.g., USP, BYU
  description?: string;
  address?: string;
  taxId?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactPerson?: string;
  website?: string;
  subscriptionTier?: number; // 1 = Basic, 2 = Standard, 3 = Premium
}

export interface UniversityUpdate {
  name: string;
  code: string;
  description?: string;
  address?: string;
  taxId?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactPerson?: string;
  website?: string;
  subscriptionTier?: number; // 1 = Basic, 2 = Standard, 3 = Premium
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
  universityId: number;
  universityName?: string;
  createdAt: string;
  updatedAt: string;
  modulesCount?: number;
  professorsCount?: number;
  studentsCount?: number;
}

export interface CourseCreate {
  name: string;
  code: string;
  description?: string;
  universityId: number;
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
  modelName: string;
  displayName: string;
  provider: 'openai' | 'anthropic';
  maxTokens: number;
  supportsVision: boolean;
  supportsFunctionCalling: boolean;
  inputCostPer1M?: number; // Capital M to match backend DTO
  outputCostPer1M?: number; // Capital M to match backend DTO
  requiredTier: number; // 1 = Basic/Deprecated, 2 = Standard, 3 = Premium
  isActive: boolean;
  isDeprecated: boolean;
  deprecationDate?: string;
  description?: string;
  recommendedFor?: string;
  modulesCount?: number; // For AIModelListDto
  createdAt?: string;
  updatedAt?: string;
}

// Module Types
export interface Module {
  id: number;
  name: string;
  code?: string;
  description?: string;
  systemPrompt?: string;
  semester?: number;
  year?: number;
  courseId: number;
  courseName?: string;
  universityId?: number;
  tutorLanguage?: string; // Language for AI tutor responses (pt-br, en, es)
  aiModelId?: number; // Selected AI model
  aiModel?: AIModel; // Populated AI model details
  files?: File[]; // Files included in module response (reduces API calls)
  createdAt: string;
  updatedAt: string;
  filesCount?: number;
  tokensCount?: number;
}

export interface ModuleCreate {
  name: string;
  code?: string;
  description?: string;
  systemPrompt?: string;
  semester?: number;
  year?: number;
  courseId: number;
  tutorLanguage?: string;
  aiModelId?: number;
}

export interface ModuleUpdate {
  name?: string;
  code?: string;
  description?: string;
  systemPrompt?: string;
  semester?: number;
  year?: number;
  courseId?: number;
  tutorLanguage?: string;
  aiModelId?: number;
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
  fileName: string;
  fileType: string;
  fileSize?: number;
  contentType?: string;
  moduleId: number;
  moduleName?: string;
  courseName?: string;
  blobUrl: string;
  blobContainer?: string;
  blobPath?: string;
  // Video/Transcription fields
  sourceType?: 'upload' | 'youtube' | 'url';
  sourceUrl?: string;
  transcriptionStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  transcriptText?: string;
  transcriptLanguage?: string;
  transcriptJobId?: string;
  videoDurationSeconds?: number;
  transcriptedAt?: string;
  transcriptWordCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface FileUpload {
  file: File;
  moduleId: number;
}

export interface FileResponse extends File {
  downloadUrl?: string;
}

// YouTube Transcription Types
export interface AddYoutubeVideoRequest {
  youtubeUrl: string;
  moduleId: number;
  language?: string; // 'pt-br' | 'en' | 'es'
  name?: string;
}

export interface TranscriptionResultDto {
  fileId: number;
  status: string;
  wordCount?: number;
  durationSeconds?: number;
  source: string;
  costUsd?: number;
  language: string;
  transcriptPreview?: string;
}

export interface TranscriptionStatusDto {
  fileId: number;
  name: string;
  status: string;
  wordCount?: number;
  durationSeconds?: number;
  language?: string;
  sourceUrl?: string;
  sourceType?: string;
  completedAt?: string;
  hasTranscript: boolean;
}

export interface TranscriptTextDto {
  fileId: number;
  transcript: string;
  wordCount: number;
  language: string;
}

// Professor Types
// Note: Professors are now stored in the unified Users table
// This interface maps to UserResponse from backend with userType='professor'
export interface Professor {
  id: number; // Maps to userId from backend UserResponse
  username?: string;
  email: string;
  firstName: string;
  lastName: string;
  universityId: number;
  universityName?: string;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
  languagePreference?: string;
  themePreference?: string;
  coursesCount?: number;
  assignedCourses?: Course[];
}

export interface ProfessorCreate {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  universityId: number;
  isAdmin: boolean;
  languagePreference?: string; // 'pt-br' | 'en' | 'es'
}

export interface ProfessorUpdate {
  email?: string;
  firstName?: string;
  lastName?: string;
  isAdmin?: boolean;
}

// Student Types
export interface Student {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  universityId?: number;
  universityName?: string;
  createdAt: string;
  updatedAt: string;
  enrolledCourses?: Course[];
}

export interface StudentCreate {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  universityId?: number;
}

export interface StudentUpdate {
  email?: string;
  firstName?: string;
  lastName?: string;
}

// Module Token Types (API Schema)
export interface ModuleAccessToken {
  id: number;
  token: string;
  name: string;
  description?: string;
  moduleId: number;
  moduleName?: string;
  courseName?: string;
  allowChat: boolean;
  allowFileAccess: boolean;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
  usageCount?: number;
}

export interface ModuleAccessTokenCreate {
  name: string;
  description?: string;
  moduleId: number;
  allowChat: boolean;
  allowFileAccess: boolean;
  expiresInDays?: number;
}

export interface ModuleAccessTokenUpdate {
  name?: string;
  description?: string;
  allowChat?: boolean;
  allowFileAccess?: boolean;
  isActive?: boolean;
}

// Legacy Module Token Types (for backwards compatibility)
export interface ModuleToken {
  id: number;
  token: string;
  name: string;
  moduleId: number;
  moduleName?: string;
  courseName?: string;
  permissions: TokenPermissions;
  createdAt: string;
  updatedAt: string;
  lastUsed?: string;
  usageCount?: number;
}

export interface TokenPermissions {
  canAskQuestions: boolean;
  canUploadFiles: boolean;
  maxQuestionsPerDay?: number;
  maxFileSizeMb?: number;
}

export interface ModuleTokenCreate {
  name: string;
  moduleId: number;
  permissions: TokenPermissions;
}

export interface ModuleTokenUpdate {
  name?: string;
  permissions?: TokenPermissions;
}

// Super Admin Types
// Note: SuperAdmins are now stored in the unified Users table
// This interface maps to UserResponse from backend with userType='super_admin'
export interface SuperAdmin {
  id: number; // Maps to userId from backend UserResponse
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string | null;
  languagePreference?: string;
  themePreference?: string;
}

export interface SuperAdminCreate {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  languagePreference?: string; // 'pt-br' | 'en' | 'es'
}

export interface SystemStats {
  totalUniversities: number;
  totalCourses: number;
  totalModules: number;
  totalProfessors: number;
  totalStudents: number;
  totalFiles: number;
  totalTokens: number;
  storageUsedMb: number;
  apiCallsToday: number;
}

// Pagination and Filtering Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CourseFilters extends PaginationParams {
  universityId?: number;
  professorId?: number;
  search?: string;
}

export interface ModuleFilters extends PaginationParams {
  courseId?: number;
  universityId?: number;
  search?: string;
}

export interface ProfessorFilters extends PaginationParams {
  universityId?: number;
  isAdmin?: boolean;
  search?: string;
}

export interface StudentFilters extends PaginationParams {
  universityId?: number;
  courseId?: number;
  search?: string;
}

export interface FileFilters extends PaginationParams {
  moduleId?: number;
  courseId?: number;
  contentType?: string;
  search?: string;
}

export interface TokenFilters extends PaginationParams {
  moduleId?: number;
  courseId?: number;
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
  moduleToken: string;
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
  requiresAdmin?: boolean; // For professors: requires isAdmin = true
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
