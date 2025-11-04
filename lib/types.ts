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
  // Address fields
  address?: string; // Deprecated - Use individual address fields below
  postalCode?: string; // Postal code (ZIP in US, CEP in Brazil, etc.)
  street?: string;
  streetNumber?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  country?: string;
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
  // Address fields
  address?: string; // Deprecated - Use individual address fields below
  postalCode?: string | null;
  street?: string | null;
  streetNumber?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
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
  // Address fields
  address?: string; // Deprecated - Use individual address fields below
  postalCode?: string | null;
  street?: string | null;
  streetNumber?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
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
  courseType?: 'math-logic' | 'programming' | 'theory-text'; // Course type - backend selects AI model based on this
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
  courseType?: 'math-logic' | 'programming' | 'theory-text';
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
  courseType?: 'math-logic' | 'programming' | 'theory-text';
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
  language: string; // 'pt-br' | 'en' | 'es' - REQUIRED by backend
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
  assignedCourseIds?: number[]; // Course IDs assigned to this professor
  assignedCourses?: Course[]; // Full course objects (for compatibility)
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

// Professor Agent Types
export interface ProfessorAgent {
  id: number;
  professorId: number;
  professorName?: string;
  professorEmail?: string;
  universityId: number;
  universityName?: string;
  name: string;
  description?: string;
  systemPrompt?: string;
  openAIAssistantId?: string;
  openAIVectorStoreId?: string;
  tutorLanguage: string;
  aiModelId?: number;
  aiModelDisplayName?: string;
  isActive: boolean;
  tokensCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ProfessorAgentCreate {
  professorId: number;
  name: string;
  description?: string;
  systemPrompt?: string;
  tutorLanguage?: string;
  aiModelId?: number;
}

export interface ProfessorAgentUpdate {
  name?: string;
  description?: string;
  systemPrompt?: string;
  tutorLanguage?: string;
  aiModelId?: number;
  isActive?: boolean;
}

export interface ProfessorAgentToken {
  id: number;
  token: string;
  professorAgentId: number;
  professorId: number;
  name: string;
  description?: string;
  allowChat: boolean;
  expiresAt?: string;
  isExpired: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ProfessorAgentTokenCreate {
  professorAgentId: number;
  name: string;
  description?: string;
  allowChat?: boolean;
  expiresAt?: string;
}

export interface ProfessorAgentStatus {
  professorId: number;
  professorName: string;
  professorEmail: string;
  hasAgent: boolean;
  agentId?: number;
  agentName?: string;
  agentIsActive?: boolean;
  agentCreatedAt?: string;
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
  size?: number; // Backend uses 'size' not 'limit'
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number; // Backend returns 'size' not 'limit'
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

// Analytics Types
export interface AnalyticsFilterDto {
  startDate?: string;
  endDate?: string;
  universityId?: number;
  courseId?: number;
  moduleId?: number;
  period?: 'day' | 'week' | 'month' | 'year' | 'all';
  limit?: number;
}

export interface ProviderCostDto {
  provider: string;
  totalMessages: number;
  totalTokens: number;
  estimatedCostUSD: number;
}

export interface ModelCostDto {
  modelName: string;
  totalMessages: number;
  totalTokens: number;
  estimatedCostUSD: number;
}

export interface CostAnalysisDto {
  totalMessages: number;
  totalTokens: number;
  estimatedCostUSD: number;
  startDate?: string;
  endDate?: string;
  costByProvider: { [key: string]: ProviderCostDto };
  costByModel: { [key: string]: ModelCostDto };
  costByModule: { [key: number]: number }; // moduleId -> cost
  costByCourse: { [key: number]: number }; // courseId -> cost
  costByUniversity: { [key: number]: number }; // universityId -> cost
}

export interface TodayCostDto {
  date: string;
  totalMessages: number;
  totalTokens: number;
  estimatedCostUSD: number;
  comparedToYesterday: {
    messagesDiff: number;
    tokensDiff: number;
    costDiff: number;
    messagesPercentChange: number;
    tokensPercentChange: number;
    costPercentChange: number;
  };
  // Video Transcription Costs
  transcriptionCostUSD: number;
  transcriptionVideoCount: number;
  projectedDailyTranscriptionCost: number;
}

export interface PeakHourDto {
  hour: number; // 0-23
  messageCount: number;
  percentage: number;
}

export interface UsageStatsDto {
  date: string;
  totalMessages: number;
  uniqueStudents: number;
  uniqueConversations: number;
  activeModules: number;
  totalTokens: number;
  averageResponseTime: number; // milliseconds
  estimatedCostUSD: number;
  messagesByProvider: { [key: string]: number };
  messagesByModel: { [key: string]: number };
  peakHour?: PeakHourDto;
}

export interface HourlyUsageDto {
  hour: number; // 0-23
  messageCount: number;
  uniqueStudents: number;
  totalTokens: number;
  estimatedCostUSD: number;
}

export interface HourlyUsageResponseDto {
  date: string;
  totalMessages: number;
  hourlyBreakdown: HourlyUsageDto[];
}

export interface DailyTrendDto {
  date: string;
  messageCount: number;
  uniqueStudents: number;
  totalTokens: number;
  estimatedCostUSD: number;
}

export interface UsageTrendsResponseDto {
  startDate: string;
  endDate: string;
  totalMessages: number;
  trends: DailyTrendDto[];
}

export interface StudentActivitySummaryDto {
  studentId: number;
  studentName?: string;
  studentEmail?: string;
  messageCount: number;
  conversationCount: number;
  totalTokens: number;
  estimatedCostUSD: number;
  lastActivityAt: string;
}

export interface TopActiveStudentsResponseDto {
  startDate?: string;
  endDate?: string;
  totalStudents: number;
  topStudents: StudentActivitySummaryDto[];
}

export interface ResponseQualityDto {
  averageResponseTimeMs: number;
  medianResponseTimeMs: number;
  averageTokensPerMessage: number;
  totalMessages: number;
}

export interface ConversationMetricsDto {
  totalConversations: number;
  averageMessagesPerConversation: number;
  medianMessagesPerConversation: number;
  completionRate: number; // percentage of conversations with > 1 message
}

export interface ModuleComparisonItemDto {
  moduleId: number;
  moduleName: string;
  totalMessages: number;
  uniqueStudents: number;
  totalTokens: number;
  estimatedCostUSD: number;
  averageResponseTimeMs: number;
}

export interface ModuleComparisonResponseDto {
  startDate?: string;
  endDate?: string;
  modules: ModuleComparisonItemDto[];
}

export interface FrequentQuestionDto {
  question: string;
  count: number;
  percentage: number;
  similarQuestions: string[];
  category?: string;
  firstAskedAt: string;
  lastAskedAt: string;
}

export interface FrequentlyAskedQuestionsResponseDto {
  totalUniqueQuestions: number;
  startDate?: string;
  endDate?: string;
  questions: FrequentQuestionDto[];
}

export interface DashboardSummaryDto {
  period: string;
  dateRange: {
    start: string;
    end: string;
  };
  overview: {
    totalMessages: number;
    totalCostUSD: number;
    uniqueStudents: number;
    activeModules: number;
    activeCourses: number;
    activeUniversities: number;
  };
  growth: {
    messagesGrowth: number;
    studentGrowth: number;
    costGrowth: number;
  };
  topPerformers: {
    topModule?: {
      moduleId: number;
      moduleName: string;
      messages: number;
    };
    topStudent?: {
      studentId: number;
      studentName: string;
      messages: number;
    };
    topCourse?: {
      courseId: number;
      courseName: string;
      messages: number;
    };
  };
  costBreakdown: {
    byProvider: Record<string, number>;
  };
  healthIndicators: {
    systemHealth: string;
    averageResponseTime: number;
    errorRate: number;
    uptime: number;
  };
}
