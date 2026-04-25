import { PAGINATION } from './constants';
import type {
  TokenResponse,
  User,
  UserResponse,
  University,
  UniversityCreate,
  UniversityUpdate,
  UniversityWithCourses,
  Course,
  CourseCreate,
  CourseUpdate,
  CourseWithDetails,
  Module,
  ModuleCreate,
  ModuleUpdate,
  ModuleWithDetails,
  AIModel,
  AIModelCreate,
  File,
  FileResponse,
  Professor,
  ProfessorCreate,
  ProfessorUpdate,
  ProfessorAgent,
  ProfessorAgentCreate,
  ProfessorAgentUpdate,
  ProfessorAgentToken,
  ProfessorAgentTokenCreate,
  ProfessorAgentStatus,
  Student,
  StudentCreate,
  StudentUpdate,
  StudentPaginatedResponse,
  ModuleAccessToken,
  ModuleAccessTokenCreate,
  ModuleAccessTokenUpdate,
  SuperAdmin,
  SuperAdminCreate,
  SystemStats,
  PaginatedResponse,
  PaginationParams,
  CourseFilters,
  ModuleFilters,
  ProfessorFilters,
  StudentFilters,
  FileFilters,
  TokenFilters,
  TutorQuestion,
  TutorResponse,
  AddYoutubeVideoRequest,
  TranscriptionResultDto,
  TranscriptionStatusDto,
  TranscriptTextDto,
  AnalyticsFilterDto,
  CostAnalysisDto,
  TodayCostDto,
  UsageStatsDto,
  HourlyUsageResponseDto,
  UsageTrendsResponseDto,
  TopActiveStudentsResponseDto,
  ResponseQualityDto,
  ConversationMetricsDto,
  ModuleComparisonResponseDto,
  FrequentlyAskedQuestionsResponseDto,
  DashboardSummaryDto,
  UnifiedDashboardResponseDto,
  AuditLog,
  AuditLogFilters,
  ProviderKey,
  ProviderKeyCreate,
  ProviderKeyUpdate,
  CourseTypeModel,
  CourseTypeModelCreate,
  CourseTypeModelUpdate,
  Plan,
  PlanCreate,
  Subscription,
  UniversityLimits,
  UniversityRegistration,
  StudentImportResult,
  StudentImportJob,
  PermissionDefinition,
  QuizQuestion,
  ExtractedQuestion,
  UserUniversity,
  UserSearchResult,
  InvitationResponse,
  InvitationDetailsResponse,
  BulkInviteResult,
  QuestionsPerModuleDto,
  TopTopicsResponseDto,
  QuizPerformanceResponseDto,
  Assignment,
  AssignmentCreate,
  AssignmentUpdate,
} from './types';

export class ApiError extends Error {
  status: number;
  validationErrors?: Record<string, string[]>;
  constructor(message: string, status: number, validationErrors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.validationErrors = validationErrors;
  }

  get isPlanLimitError(): boolean {
    return this.status === 403 && /limit reached/i.test(this.message);
  }

  get isValidationError(): boolean {
    return this.status === 400 && !!this.validationErrors && Object.keys(this.validationErrors).length > 0;
  }
}

export const API_CONFIG = {
  // C# Unified API (Management & Auth endpoints - now combined!)
  // Management API: /api/universities, /api/courses, /api/modules, etc.
  // Auth API: /api/auth/login, /api/auth/register, /api/auth/me, etc.
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:6969',
  // Python API (AI/Tutor endpoints - improve-prompt only)
  pythonBaseURL: process.env.NEXT_PUBLIC_AI_API_URL || 'http://localhost:8000/api/v2',
  timeout: 30000,
} as const;

/**
 * Options for HTTP request methods to make calls more readable
 * @example
 * // Instead of: post(endpoint, data, false, false, true)
 * // Use: post(endpoint, data, { usePythonAPI: true })
 */
export interface RequestOptions {
  isFormData?: boolean;
  useAuthAPI?: boolean;
  usePythonAPI?: boolean;
}

class TutoriaAPIClient {
  private baseURL: string;
  private pythonBaseURL: string;
  private timeout: number;
  private token: string | null = null;
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<boolean> | null = null;
  private refreshAttempts: number = 0;
  private readonly MAX_REFRESH_ATTEMPTS = 3;

  constructor(config = API_CONFIG) {
    this.baseURL = config.baseURL;
    this.pythonBaseURL = config.pythonBaseURL;
    this.timeout = config.timeout;

    // Initialize token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('tutoria_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('tutoria_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tutoria_token');
    }
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    // Check if max refresh attempts exceeded
    if (this.refreshAttempts >= this.MAX_REFRESH_ATTEMPTS) {
      console.error('Max token refresh attempts exceeded. Clearing tokens.');
      this.clearToken();
      localStorage.removeItem('tutoria_refresh_token');
      this.refreshAttempts = 0;
      return false;
    }

    // If already refreshing, wait for that promise
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshAttempts++;

    this.refreshPromise = (async () => {
      try {
        const refreshToken = localStorage.getItem('tutoria_refresh_token');
        if (!refreshToken) {
          return false;
        }

        // Call refresh endpoint
        const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${refreshToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          return false;
        }

        const data: TokenResponse = await response.json();

        // Update tokens
        this.setToken(data.accessToken);
        localStorage.setItem('tutoria_token', data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem('tutoria_refresh_token', data.refreshToken);
        }

        // Reset refresh attempts on success
        this.refreshAttempts = 0;

        return true;
      } catch (error) {
        console.error('Token refresh failed:', error);
        return false;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    useAuthAPI: boolean = false,
    usePythonAPI: boolean = false
  ): Promise<T> {
    // Determine which API host to use (Python API or unified C# API)
    const baseUrl = usePythonAPI ? this.pythonBaseURL : this.baseURL;

    // Normalize URL to avoid double slashes (remove trailing slash from base, ensure endpoint starts with /)
    const normalizedBase = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`; // Ensure leading slash
    const url = `${normalizedBase}${normalizedEndpoint}`;

    // Build headers - don't set Content-Type if it's explicitly null (for FormData)
    const headers: Record<string, string> = {
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
    };

    let hasContentType = false;
    let contentTypeIsNull = false;

    // Add other headers, excluding Content-Type if it's null (for FormData)
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        if (key === 'Content-Type') {
          hasContentType = true;
          if (value === null) {
            contentTypeIsNull = true;
          } else {
            headers[key] = value as string;
          }
        } else if (value !== null) {
          headers[key] = value as string;
        }
      });
    }

    // Add default Content-Type for non-FormData requests (only if not explicitly set to null)
    if (!hasContentType || (!contentTypeIsNull && !headers['Content-Type'])) {
      headers['Content-Type'] = 'application/json';
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    // Debug: Log request details (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('API Request:', {
        url,
        method: options.method,
        headers,
        bodyType: options.body instanceof FormData ? 'FormData' : typeof options.body,
        body: options.body instanceof FormData ? 'FormData instance' : options.body
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      if (response.status === 401 && !endpoint.includes('/auth/')) {
        // Token expired or invalid - try to refresh
        const refreshed = await this.refreshAccessToken();

        if (refreshed) {
          // Retry the original request with new token
          return this.request<T>(endpoint, options, useAuthAPI, usePythonAPI);
        } else {
          // Refresh failed, clear token and redirect to login
          this.clearToken();
          if (typeof window !== 'undefined') {
            localStorage.removeItem('tutoria_user');
            localStorage.removeItem('tutoria_token');
            localStorage.removeItem('tutoria_refresh_token');
            window.location.href = '/login';
          }
          throw new Error('Unauthorized');
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // Backend uses 'detail' (FastAPI standard) or 'message' for error messages
        const errorMessage = errorData.detail || errorData.message || errorData.title || `HTTP error! status: ${response.status}`;
        // ASP.NET Core ModelState validation returns { errors: { FieldName: ["error1", "error2"] } }
        const validationErrors = errorData.errors as Record<string, string[]> | undefined;
        throw new ApiError(errorMessage, response.status, validationErrors);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async get<T>(endpoint: string, params?: Record<string, unknown> | object, useAuthAPI = false, usePythonAPI = false): Promise<T> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    const queryString = searchParams.toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;

    return this.request<T>(url, { method: 'GET' }, useAuthAPI, usePythonAPI);
  }

  /**
   * POST request with improved API using options object
   * @param endpoint - API endpoint
   * @param data - Request payload
   * @param options - Request options (isFormData, useAuthAPI, usePythonAPI) or legacy boolean for backward compatibility
   */
  async post<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions | boolean,
    // Legacy parameters for backward compatibility
    useAuthAPI_DEPRECATED?: boolean,
    usePythonAPI_DEPRECATED?: boolean
  ): Promise<T> {
    // Handle backward compatibility: if options is a boolean, it's the old isFormData parameter
    let isFormData = false;
    let useAuthAPI = false;
    let usePythonAPI = false;

    if (typeof options === 'boolean') {
      // Legacy call: post(endpoint, data, isFormData, useAuthAPI, usePythonAPI)
      isFormData = options;
      useAuthAPI = useAuthAPI_DEPRECATED ?? false;
      usePythonAPI = usePythonAPI_DEPRECATED ?? false;
    } else if (options) {
      // New call: post(endpoint, data, { isFormData, useAuthAPI, usePythonAPI })
      isFormData = options.isFormData ?? false;
      useAuthAPI = options.useAuthAPI ?? false;
      usePythonAPI = options.usePythonAPI ?? false;
    }

    const headers: Record<string, string | null> = {};

    // For FormData, DON'T set Content-Type - browser will auto-set with boundary
    if (isFormData) {
      // Explicitly set to null to prevent default Content-Type from being added
      headers['Content-Type'] = null;

      // Debug: Log FormData contents (development only)
      if (process.env.NODE_ENV === 'development' && data instanceof FormData) {
        console.log('FormData contents:');
        for (const [key, value] of (data as FormData).entries()) {
          console.log(`  ${key}:`, value);
        }
      }
    } else {
      headers['Content-Type'] = 'application/json';
    }

    return this.request<T>(endpoint, {
      method: 'POST',
      headers: headers as unknown as HeadersInit,
      body: isFormData ? (data as FormData) : (data ? JSON.stringify(data) : undefined),
    }, useAuthAPI, usePythonAPI);
  }

  async put<T>(endpoint: string, data?: unknown, useAuthAPI = false, usePythonAPI = false): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }, useAuthAPI, usePythonAPI);
  }

  async delete<T>(endpoint: string, useAuthAPI = false, usePythonAPI = false): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' }, useAuthAPI, usePythonAPI);
  }

  async patch<T>(endpoint: string, data?: unknown, useAuthAPI = false, usePythonAPI = false): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }, useAuthAPI, usePythonAPI);
  }

  // Authentication endpoints (use Next.js API route for secure server-side client authentication)
  async login(credentials: { username: string; password: string }): Promise<TokenResponse> {
    // Call Next.js API route instead of Auth API directly
    // This keeps client_id/client_secret secure on the server
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || errorData.message || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }

    const data: TokenResponse = await response.json();

    if (data.accessToken) {
      this.setToken(data.accessToken);
    }

    return data;
  }

  async refreshToken(): Promise<TokenResponse> {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('tutoria_refresh_token') : null;
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    const response = await this.post<TokenResponse>('/api/auth/refresh', { refreshToken });
    if (response.accessToken) {
      this.setToken(response.accessToken);
    }
    return response;
  }

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    return this.post('/api/auth/password-reset-request', { email });
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return this.post('/api/auth/password-reset', { token, newPassword });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    return this.put('/api/auth/me/password', { currentPassword, newPassword });
  }

  async getCurrentUser(): Promise<UserResponse> {
    return this.get('/api/auth/me');
  }

  async updateUserPreferences(data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    themePreference?: string;
    languagePreference?: string;
    birthdate?: string;
  }): Promise<UserResponse> {
    return this.put('/api/auth/me', data);
  }

  async deactivateUser(userId: number): Promise<User> {
    return this.patch(`/api/users/${userId}/deactivate`, undefined, false);
  }

  async activateUser(userId: number): Promise<User> {
    return this.patch(`/api/users/${userId}/activate`, undefined, false);
  }

  async deleteUserPermanently(userId: number): Promise<{ message: string; user_id: number; deleted: boolean }> {
    return this.delete(`/api/users/${userId}`, false);
  }

  async getUsersByType(userType: 'student' | 'professor' | 'super_admin'): Promise<UserResponse[]> {
    // Backend returns PaginatedResponse, extract items array
    // Request all items by using maximum page size as a workaround
    const response = await this.get<PaginatedResponse<UserResponse>>('/api/users/', { userType, page: 1, size: PAGINATION.MAX_PAGE_SIZE }, false);
    return response.items;
  }

  async getUser(userId: number): Promise<UserResponse> {
    return this.get(`/api/users/${userId}`, undefined, false); // Management API
  }

  async updateUser(userId: number, data: { firstName?: string; lastName?: string; email?: string; username?: string; birthdate?: string }): Promise<UserResponse> {
    return this.put(`/api/users/${userId}`, data, false); // Management API
  }

  // University endpoints
  async getUniversities(params?: PaginationParams): Promise<PaginatedResponse<University>> {
    return this.get('/api/universities/', params);
  }

  async createUniversity(data: UniversityCreate): Promise<University> {
    return this.post('/api/universities/', data);
  }

  async getUniversity(id: number): Promise<UniversityWithCourses> {
    return this.get(`/api/universities/${id}`);
  }

  async updateUniversity(id: number, data: UniversityUpdate): Promise<University> {
    return this.put(`/api/universities/${id}`, data);
  }

  async deleteUniversity(id: number): Promise<void> {
    return this.delete(`/api/universities/${id}`);
  }

  // Course endpoints
  async getCourses(params?: CourseFilters): Promise<PaginatedResponse<Course>> {
    return this.get('/api/courses/', params);
  }

  async createCourse(data: CourseCreate): Promise<Course> {
    return this.post('/api/courses/', data);
  }

  async getCourse(id: number): Promise<CourseWithDetails> {
    return this.get(`/api/courses/${id}`);
  }

  async updateCourse(id: number, data: CourseUpdate): Promise<Course> {
    return this.put(`/api/courses/${id}`, data);
  }

  async deleteCourse(id: number): Promise<void> {
    return this.delete(`/api/courses/${id}`);
  }

  async getCoursesByUniversity(universityId: number): Promise<Course[]> {
    const response = await this.get<PaginatedResponse<Course>>(`/api/courses/`, { universityId, size: PAGINATION.MAX_PAGE_SIZE });
    return response.items;
  }

  async assignProfessorToCourse(courseId: number, professorId: number): Promise<void> {
    return this.post(`/api/courses/${courseId}/professors/${professorId}`);
  }

  async unassignProfessorFromCourse(courseId: number, professorId: number): Promise<void> {
    return this.delete(`/api/courses/${courseId}/professors/${professorId}`);
  }

  // Module endpoints
  async getModules(params?: ModuleFilters): Promise<PaginatedResponse<Module>> {
    return this.get('/api/modules/', params);
  }

  async createModule(data: ModuleCreate): Promise<Module> {
    return this.post('/api/modules/', data);
  }

  async getModule(id: number): Promise<ModuleWithDetails> {
    return this.get(`/api/modules/${id}`);
  }

  async updateModule(id: number, data: ModuleUpdate): Promise<Module> {
    return this.put(`/api/modules/${id}`, data);
  }

  async deleteModule(id: number): Promise<void> {
    return this.delete(`/api/modules/${id}`);
  }

  // AI/Tutor endpoints (Python API)
  async improveSystemPrompt(moduleId: number, currentPrompt: string): Promise<{ improved_prompt: string; remaining_improvements: number }> {
    // This endpoint uses the Python API - must stay snake_case
    return this.post(`/modules/${moduleId}/improve-prompt`, { current_prompt: currentPrompt }, { usePythonAPI: true });
  }

  async extractModuleTexts(moduleId: number, force: boolean = true): Promise<{ queued_count: number; total_files: number; message: string }> {
    return this.post(`/api/modules/${moduleId}/extract-text?force=${force}`, {});
  }

  async generateModuleQuizzes(moduleId: number, upsert: boolean = true, count: number = 50): Promise<{ status: string; message: string }> {
    return this.post(`/api/modules/${moduleId}/generate-quizzes?count=${count}`, {});
  }

  async getModuleQuizzes(moduleId: number, difficulty?: string, source?: string): Promise<QuizQuestion[]> {
    const params: Record<string, string> = {};
    if (difficulty) params.difficulty = difficulty;
    if (source) params.source = source;
    const response = await this.get<{ quizzes: QuizQuestion[]; total: number; module_id: number }>(
      `/modules/${moduleId}/quizzes`, params, false, true
    );
    // Backend returns { quizzes: [...], total, module_id } — unwrap to array
    return Array.isArray(response) ? response : (response?.quizzes ?? []);
  }

  async uploadQuizFile(moduleId: number, file: globalThis.File): Promise<{ status: string; message: string; extracted_count: number; questions: ExtractedQuestion[]; module_id: number; job_id?: number }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.post(`/modules/${moduleId}/upload-quiz-file`, formData, { isFormData: true, usePythonAPI: true });
  }

  async confirmExtractedQuizzes(moduleId: number, questions: ExtractedQuestion[], uploadedFileId?: number): Promise<{ status: string; message: string; saved_count: number; module_id: number }> {
    const body: Record<string, unknown> = { questions };
    if (uploadedFileId !== undefined) body.uploaded_file_id = uploadedFileId;
    return this.post(`/modules/${moduleId}/confirm-extracted-quizzes`, body, { usePythonAPI: true });
  }

  async deleteQuiz(moduleId: number, quizId: number): Promise<void> {
    return this.delete(`/modules/${moduleId}/quizzes/${quizId}`, false, true);
  }

  // Assignment endpoints
  async getAssignments(moduleId: number, page = 1, size = 20): Promise<PaginatedResponse<Assignment>> {
    return this.get('/api/assignments', { moduleId, page, size });
  }

  async getAssignment(id: number): Promise<Assignment> {
    return this.get(`/api/assignments/${id}`);
  }

  async createAssignment(data: AssignmentCreate): Promise<Assignment> {
    const formData = new FormData();
    formData.append('ModuleId', data.moduleId.toString());
    formData.append('Title', data.title);
    if (data.description) formData.append('Description', data.description);
    formData.append('DueDate', data.dueDate);
    if (data.keywords?.length) formData.append('Keywords', data.keywords.join(','));
    formData.append('File', data.file);
    if (data.rubricFile) formData.append('RubricFile', data.rubricFile);
    return this.post('/api/assignments', formData, { isFormData: true });
  }

  async updateAssignment(id: number, data: AssignmentUpdate): Promise<Assignment> {
    return this.put(`/api/assignments/${id}`, {
      ...data,
      keywords: data.keywords?.length ? data.keywords.join(',') : undefined,
    });
  }

  async deleteAssignment(id: number): Promise<void> {
    return this.delete(`/api/assignments/${id}`);
  }

  async togglePublishAssignment(id: number): Promise<Assignment> {
    return this.post(`/api/assignments/${id}/publish`, {});
  }

  // AI Model endpoints
  async getAIModels(params?: { provider?: string; is_active?: boolean; include_deprecated?: boolean }): Promise<AIModel[]> {
    return this.get('/api/ai-models/', params);
  }

  async getAIModel(id: number): Promise<AIModel> {
    return this.get(`/api/ai-models/${id}`);
  }

  async createAIModel(data: AIModelCreate): Promise<AIModel> {
    return this.post('/api/ai-models/', data);
  }

  async updateAIModel(id: number, data: Partial<AIModelCreate>): Promise<AIModel> {
    return this.put(`/api/ai-models/${id}`, data);
  }

  async deleteAIModel(id: number): Promise<void> {
    return this.delete(`/api/ai-models/${id}`);
  }

  // File endpoints (all go to TutoriaApi unified API)
  async getFiles(params?: FileFilters): Promise<PaginatedResponse<File>> {
    return this.get('/api/files/', params);
  }

  async uploadFile(formData: FormData, moduleId: number, fileName?: string): Promise<FileResponse> {
    // Add ModuleId and Name to the FormData (matches TutoriaApi UploadFileRequest DTO)
    formData.append('ModuleId', moduleId.toString());
    if (fileName) {
      formData.append('Name', fileName);
    }
    return this.post('/api/files', formData, { isFormData: true });
  }

  async getFile(id: number): Promise<FileResponse> {
    return this.get(`/api/files/${id}`);
  }

  async updateFile(id: number, data: Partial<File>): Promise<File> {
    return this.put(`/api/files/${id}`, data);
  }

  async deleteFile(id: number): Promise<void> {
    return this.delete(`/api/files/${id}`);
  }

  async getFileDownloadUrl(id: number): Promise<{ downloadUrl: string }> {
    return this.get(`/api/files/${id}/download`);
  }

  // YouTube Video Transcription endpoints
  async addYoutubeVideo(request: AddYoutubeVideoRequest): Promise<TranscriptionResultDto> {
    return this.post('/api/videos/youtube', request);
  }

  async getTranscriptionStatus(fileId: number): Promise<TranscriptionStatusDto> {
    return this.get(`/api/videos/status/${fileId}`);
  }

  async getTranscriptText(fileId: number): Promise<TranscriptTextDto> {
    return this.get(`/api/videos/transcript/${fileId}`);
  }

  async retryTranscription(fileId: number): Promise<TranscriptionResultDto> {
    return this.post(`/api/videos/retry/${fileId}`, {});
  }

  async deleteTranscription(fileId: number): Promise<void> {
    return this.delete(`/api/videos/${fileId}`);
  }

  // Professor endpoints
  async getProfessors(params?: ProfessorFilters): Promise<PaginatedResponse<Professor>> {
    // Use unified Users API with userType filter
    const usersResponse = await this.get<PaginatedResponse<UserResponse>>('/api/users', {
      ...params,
      userType: 'professor'
    });

    // Map UserResponse[] to Professor[]
    const professors: Professor[] = usersResponse.items.map((user: UserResponse) => ({
      id: user.userId,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      universityId: user.universityId || 0,
      universityName: user.universityName,
      isAdmin: user.isAdmin || false,
      isActive: user.isActive,
      createdAt: user.createdAt || new Date().toISOString(),
      updatedAt: user.updatedAt || new Date().toISOString(),
      lastLoginAt: user.lastLoginAt,
      languagePreference: user.languagePreference,
      themePreference: user.themePreference,
    }));

    return {
      ...usersResponse,
      items: professors
    };
  }

  async createProfessor(data: ProfessorCreate): Promise<Professor> {
    // Use the unified /api/users endpoint (Management API)
    interface BackendUserResponse {
      userId: number;
      username: string;
      email: string;
      firstName: string;
      lastName: string;
      userType: 'super_admin' | 'professor' | 'student';
      isActive: boolean;
      isAdmin?: boolean;
      universityId?: number;
      universityName?: string;
      createdAt: string;
      updatedAt: string;
      lastLoginAt?: string | null;
      languagePreference?: string;
      themePreference?: string;
    }

    const response = await this.post<BackendUserResponse>('/api/users', {
      username: data.username,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      password: data.password,
      userType: 'professor',
      universityId: data.universityId,
      isAdmin: data.isAdmin,
      languagePreference: data.languagePreference || 'pt-br',
    }, false, false);

    // Map backend UserResponse to Professor interface
    return {
      id: response.userId,
      username: response.username,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      universityId: response.universityId || 0,
      universityName: response.universityName,
      isAdmin: response.isAdmin || false,
      isActive: response.isActive,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
      lastLoginAt: response.lastLoginAt,
      languagePreference: response.languagePreference,
      themePreference: response.themePreference,
    };
  }

  async getProfessor(id: number): Promise<Professor> {
    // Use unified Users API
    interface BackendUserResponse {
      userId: number;
      username: string;
      email: string;
      firstName: string;
      lastName: string;
      userType: 'super_admin' | 'professor' | 'student';
      isActive: boolean;
      isAdmin?: boolean;
      universityId?: number;
      universityName?: string;
      createdAt: string;
      updatedAt: string;
      lastLoginAt?: string | null;
      languagePreference?: string;
      themePreference?: string;
    }

    const user = await this.get<BackendUserResponse>(`/api/users/${id}`);

    // Map backend UserResponse to Professor interface
    return {
      id: user.userId,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      universityId: user.universityId || 0,
      universityName: user.universityName,
      isAdmin: user.isAdmin || false,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
      languagePreference: user.languagePreference,
      themePreference: user.themePreference,
    };
  }

  async updateProfessor(id: number, data: ProfessorUpdate): Promise<Professor> {
    // Use unified Users API
    interface BackendUserResponse {
      userId: number;
      username: string;
      email: string;
      firstName: string;
      lastName: string;
      userType: 'super_admin' | 'professor' | 'student';
      isActive: boolean;
      isAdmin?: boolean;
      universityId?: number;
      universityName?: string;
      createdAt: string;
      updatedAt: string;
      lastLoginAt?: string | null;
      languagePreference?: string;
      themePreference?: string;
    }

    const response = await this.put<BackendUserResponse>(`/api/users/${id}`, {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
    });

    // Map backend UserResponse to Professor interface
    return {
      id: response.userId,
      username: response.username,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      universityId: response.universityId || 0,
      universityName: response.universityName,
      isAdmin: response.isAdmin || false,
      isActive: response.isActive,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
      lastLoginAt: response.lastLoginAt,
      languagePreference: response.languagePreference,
      themePreference: response.themePreference,
    };
  }

  async updateProfessorPassword(id: number, newPassword: string): Promise<{ message: string }> {
    // Use unified Users API
    return this.put(`/api/users/${id}/password`, { newPassword });
  }

  async getProfessorCourses(id: number): Promise<{ courseIds: number[] }> {
    return this.get(`/api/professors/${id}/courses`);
  }

  async deleteProfessor(id: number): Promise<void> {
    // Use unified Users API
    return this.delete(`/api/users/${id}`);
  }

  // Student endpoints
  async getStudents(params?: StudentFilters): Promise<StudentPaginatedResponse> {
    return this.get('/api/students/', params);
  }

  async createStudent(data: StudentCreate): Promise<Student> {
    return this.post('/api/students/', data);
  }

  async getStudent(id: number): Promise<Student> {
    return this.get(`/api/students/${id}`);
  }

  async updateStudent(id: number, data: StudentUpdate): Promise<Student> {
    return this.put(`/api/students/${id}`, data);
  }

  async deleteStudent(id: number): Promise<void> {
    return this.delete(`/api/students/${id}`);
  }

  async unenrollStudent(studentId: number, courseId: number): Promise<void> {
    return this.delete(`/api/students/${studentId}/courses/${courseId}`);
  }

  // Student Import endpoints
  async importStudents(courseId: number, file: globalThis.File): Promise<StudentImportResult> {
    const formData = new FormData();
    formData.append('courseId', courseId.toString());
    formData.append('file', file);
    return this.post('/api/students/import', formData, { isFormData: true });
  }

  async getImportJobs(courseId?: number): Promise<StudentImportJob[]> {
    const params = courseId ? { courseId } : {};
    return this.get('/api/students/import-jobs', params);
  }

  async getImportJob(id: number): Promise<StudentImportJob> {
    return this.get(`/api/students/import-jobs/${id}`);
  }

  // Module Token endpoints
  async getModuleTokens(params?: TokenFilters): Promise<PaginatedResponse<ModuleAccessToken>> {
    return this.get('/api/moduleaccesstokens/', params);
  }

  async createModuleToken(data: ModuleAccessTokenCreate): Promise<ModuleAccessToken> {
    return this.post('/api/moduleaccesstokens/', data);
  }

  async getModuleToken(id: number): Promise<ModuleAccessToken> {
    return this.get(`/api/moduleaccesstokens/${id}`);
  }

  async updateModuleToken(id: number, data: ModuleAccessTokenUpdate): Promise<ModuleAccessToken> {
    return this.put(`/api/moduleaccesstokens/${id}`, data);
  }

  async deleteModuleToken(id: number): Promise<void> {
    return this.delete(`/api/moduleaccesstokens/${id}`);
  }

  // Super Admin endpoints
  async getSystemStats(): Promise<SystemStats> {
    return this.get('/api/super-admin/stats');
  }

  async getSuperAdmins(params?: PaginationParams): Promise<PaginatedResponse<SuperAdmin>> {
    // Use unified Users API with userType filter
    const usersResponse = await this.get<PaginatedResponse<UserResponse>>('/api/users', {
      ...params,
      userType: 'super_admin'
    });

    // Map UserResponse[] to SuperAdmin[]
    const superAdmins: SuperAdmin[] = usersResponse.items.map((user: UserResponse) => ({
      id: user.userId,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
      languagePreference: user.languagePreference,
      themePreference: user.themePreference,
    }));

    return {
      ...usersResponse,
      items: superAdmins
    };
  }

  async createSuperAdmin(data: SuperAdminCreate): Promise<SuperAdmin> {
    // Use the unified /api/users endpoint (Management API)
    interface BackendUserResponse {
      userId: number;
      username: string;
      email: string;
      firstName: string;
      lastName: string;
      userType: 'super_admin' | 'professor' | 'student';
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
      lastLoginAt?: string | null;
      languagePreference?: string;
      themePreference?: string;
    }

    const response = await this.post<BackendUserResponse>('/api/users', {
      username: data.username,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      password: data.password,
      userType: 'super_admin',
      isAdmin: true, // Super admins are always admins
      languagePreference: data.languagePreference || 'pt-br',
    });

    // Map backend UserResponse to SuperAdmin interface
    return {
      id: response.userId,
      username: response.username,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      isActive: response.isActive,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
      lastLoginAt: response.lastLoginAt,
      languagePreference: response.languagePreference,
      themePreference: response.themePreference,
    };
  }

  async updateSuperAdmin(id: number, data: Partial<SuperAdminCreate>): Promise<SuperAdmin> {
    // Use unified Users API
    interface BackendUserResponse {
      userId: number;
      username: string;
      email: string;
      firstName: string;
      lastName: string;
      userType: 'super_admin' | 'professor' | 'student';
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
      lastLoginAt?: string | null;
      languagePreference?: string;
      themePreference?: string;
    }

    const response = await this.put<BackendUserResponse>(`/api/users/${id}`, {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
    });

    // Map backend UserResponse to SuperAdmin interface
    return {
      id: response.userId,
      username: response.username,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      isActive: response.isActive,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
      lastLoginAt: response.lastLoginAt,
      languagePreference: response.languagePreference,
      themePreference: response.themePreference,
    };
  }

  async getAllUniversities(params?: PaginationParams): Promise<PaginatedResponse<University>> {
    return this.get('/api/super-admin/universities/all', params);
  }

  async getAllProfessors(params?: PaginationParams): Promise<PaginatedResponse<Professor>> {
    // Use unified Users API with userType filter
    const usersResponse = await this.get<PaginatedResponse<UserResponse>>('/api/users', {
      ...params,
      userType: 'professor'
    });

    // Map UserResponse[] to Professor[]
    const professors: Professor[] = usersResponse.items.map((user: UserResponse) => ({
      id: user.userId,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      universityId: user.universityId || 0,
      universityName: user.universityName,
      isAdmin: user.isAdmin || false,
      isActive: user.isActive,
      createdAt: user.createdAt || new Date().toISOString(),
      updatedAt: user.updatedAt || new Date().toISOString(),
      lastLoginAt: user.lastLoginAt,
      languagePreference: user.languagePreference,
      themePreference: user.themePreference,
    }));

    return {
      ...usersResponse,
      items: professors
    };
  }

  // Professor Agent endpoints
  async getMyProfessorAgent(): Promise<ProfessorAgent> {
    return this.get('/api/professoragents/my-agent');
  }

  async getAllProfessorAgents(universityId?: number): Promise<ProfessorAgent[]> {
    const params = universityId ? { universityId } : undefined;
    return this.get('/api/professoragents', params);
  }

  async createProfessorAgent(data: ProfessorAgentCreate): Promise<ProfessorAgent> {
    return this.post('/api/professoragents', data);
  }

  async updateProfessorAgent(id: number, data: ProfessorAgentUpdate): Promise<ProfessorAgent> {
    return this.put(`/api/professoragents/${id}`, data);
  }

  async deleteProfessorAgent(id: number): Promise<void> {
    return this.delete(`/api/professoragents/${id}`);
  }

  async createProfessorAgentToken(agentId: number, data: ProfessorAgentTokenCreate): Promise<ProfessorAgentToken> {
    return this.post(`/api/professoragents/${agentId}/tokens`, data);
  }

  async getProfessorAgentStatus(universityId?: number): Promise<ProfessorAgentStatus[]> {
    const params = universityId ? { universityId } : undefined;
    return this.get('/api/professoragents/by-professor', params);
  }

  async activateProfessorAgent(agentId: number): Promise<void> {
    return this.patch(`/api/professoragents/${agentId}/activate`, {});
  }

  async deactivateProfessorAgent(agentId: number): Promise<void> {
    return this.patch(`/api/professoragents/${agentId}/deactivate`, {});
  }

  // AI Tutor endpoints
  async askTutor(question: TutorQuestion): Promise<TutorResponse> {
    return this.post('/api/tutor/ask', question);
  }

  // Analytics endpoints
  async getAnalyticsDashboardSummary(filters?: AnalyticsFilterDto): Promise<DashboardSummaryDto> {
    return this.get('/api/analytics/dashboard/summary', filters);
  }

  // Unified dashboard endpoint - combines summary, trends, todayUsage, and todayCost
  async getAnalyticsDashboardUnified(filters?: AnalyticsFilterDto): Promise<UnifiedDashboardResponseDto> {
    return this.get('/api/analytics/dashboard/unified', filters);
  }

  async getAnalyticsCostAnalysis(filters?: AnalyticsFilterDto): Promise<CostAnalysisDto> {
    return this.get('/api/analytics/costs/detailed', filters);
  }

  async getAnalyticsTodayCost(filters?: AnalyticsFilterDto): Promise<TodayCostDto> {
    return this.get('/api/analytics/costs/today', filters);
  }

  async getAnalyticsTodayUsage(filters?: AnalyticsFilterDto): Promise<UsageStatsDto> {
    return this.get('/api/analytics/usage/today', filters);
  }

  async getAnalyticsUsageTrends(filters?: AnalyticsFilterDto): Promise<UsageTrendsResponseDto> {
    return this.get('/api/analytics/usage/trends', filters);
  }

  async getAnalyticsHourlyUsage(filters?: AnalyticsFilterDto): Promise<HourlyUsageResponseDto> {
    return this.get('/api/analytics/usage/hourly', filters);
  }

  async getAnalyticsTopActiveStudents(filters?: AnalyticsFilterDto): Promise<TopActiveStudentsResponseDto> {
    return this.get('/api/analytics/students/top-active', filters);
  }

  async getAnalyticsResponseQuality(filters?: AnalyticsFilterDto): Promise<ResponseQualityDto> {
    return this.get('/api/analytics/performance/response-quality', filters);
  }

  async getAnalyticsConversationMetrics(filters?: AnalyticsFilterDto): Promise<ConversationMetricsDto> {
    return this.get('/api/analytics/engagement/conversations', filters);
  }

  async getAnalyticsModuleComparison(moduleIds: number[], filters?: Omit<AnalyticsFilterDto, 'moduleId'>): Promise<ModuleComparisonResponseDto> {
    return this.get('/api/analytics/modules/compare', {
      ...filters,
      moduleIds: moduleIds.join(','),
    });
  }

  async getAnalyticsFrequentQuestions(filters?: AnalyticsFilterDto): Promise<FrequentlyAskedQuestionsResponseDto> {
    return this.get('/api/analytics/questions/frequently-asked', filters);
  }

  async getAnalyticsQuestionsPerModule(filters?: AnalyticsFilterDto): Promise<QuestionsPerModuleDto> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.universityId) params.append('universityId', filters.universityId.toString());
    const query = params.toString();
    return this.request(`/api/analytics/modules/questions-per-module${query ? `?${query}` : ''}`);
  }

  async getAnalyticsTopTopics(filters?: AnalyticsFilterDto): Promise<TopTopicsResponseDto> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.moduleId) params.append('moduleId', filters.moduleId.toString());
    const query = params.toString();
    return this.request(`/api/analytics/topics/most-demanded${query ? `?${query}` : ''}`);
  }

  async getAnalyticsQuizPerformance(moduleId?: number): Promise<QuizPerformanceResponseDto> {
    const params = new URLSearchParams();
    if (moduleId) params.append('moduleId', moduleId.toString());
    const query = params.toString();
    return this.request(`/api/analytics/quiz/performance${query ? `?${query}` : ''}`);
  }

  // Audit Logs
  async getAuditLogs(params?: AuditLogFilters): Promise<PaginatedResponse<AuditLog>> {
    return this.get('/api/audit-logs', params);
  }

  // Provider Key endpoints (Super Admin only)
  async getProviderKeys(): Promise<ProviderKey[]> {
    return this.get('/api/provider-keys/');
  }

  async createProviderKey(data: ProviderKeyCreate): Promise<ProviderKey> {
    return this.post('/api/provider-keys/', data);
  }

  async updateProviderKey(id: number, data: ProviderKeyUpdate): Promise<ProviderKey> {
    return this.put(`/api/provider-keys/${id}`, data);
  }

  async deleteProviderKey(id: number): Promise<void> {
    return this.delete(`/api/provider-keys/${id}`);
  }

  // Course Type Model endpoints (Super Admin only)
  async getCourseTypeModels(courseType?: string): Promise<CourseTypeModel[]> {
    const params = courseType ? { courseType } : undefined;
    return this.get('/api/course-type-models/', params);
  }

  async createCourseTypeModel(data: CourseTypeModelCreate): Promise<CourseTypeModel> {
    return this.post('/api/course-type-models/', data);
  }

  async updateCourseTypeModel(id: number, data: CourseTypeModelUpdate): Promise<CourseTypeModel> {
    return this.put(`/api/course-type-models/${id}`, data);
  }

  async deleteCourseTypeModel(id: number): Promise<void> {
    return this.delete(`/api/course-type-models/${id}`);
  }

  // Plan endpoints
  async getPlans(): Promise<Plan[]> {
    return this.get('/api/plans/');
  }

  async getAllPlans(): Promise<Plan[]> {
    return this.get('/api/plans/all');
  }

  async getPlan(id: number): Promise<Plan> {
    return this.get(`/api/plans/${id}`);
  }

  async createPlan(data: PlanCreate): Promise<Plan> {
    return this.post('/api/plans/', data);
  }

  async updatePlan(id: number, data: PlanCreate): Promise<Plan> {
    return this.put(`/api/plans/${id}`, data);
  }

  async deletePlan(id: number): Promise<void> {
    return this.delete(`/api/plans/${id}`);
  }

  // Subscription endpoints
  async getAllSubscriptions(): Promise<Subscription[]> {
    return this.get('/api/subscriptions/admin/all');
  }

  async getCurrentSubscription(): Promise<Subscription> {
    return this.get('/api/subscriptions/current');
  }

  async getUniversityLimits(): Promise<UniversityLimits> {
    return this.get('/api/subscriptions/limits');
  }

  async createCheckoutSession(planSlug: string): Promise<{ checkoutUrl: string }> {
    return this.post('/api/subscriptions/checkout', { planSlug });
  }

  async cancelSubscription(): Promise<void> {
    return this.post('/api/subscriptions/cancel');
  }

  // University Registration (public - no auth required)
  async registerUniversity(data: UniversityRegistration): Promise<{ checkoutUrl?: string; universityId: number }> {
    return this.post('/api/auth/register/university', data);
  }

  // User Registration (public - no auth required, self-signup without university)
  async registerUser(data: { email: string; password: string; firstName: string; lastName: string; username?: string }): Promise<{ userId: number; email: string; message: string }> {
    return this.post('/api/auth/register/user', data);
  }

  async exportAuditLogs(filters?: Omit<AuditLogFilters, 'page' | 'size'>): Promise<Blob> {
    const searchParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }

    const url = `${this.baseURL}/api/audit-logs/export?${searchParams}`;
    const headers: HeadersInit = {};

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    return await response.blob();
  }

  // ==================== Permissions API ====================

  async getAllPermissions(): Promise<PermissionDefinition[]> {
    return this.request('/api/permissions');
  }

  async getRolePermissions(role: string): Promise<PermissionDefinition[]> {
    return this.request(`/api/permissions/roles/${role}`);
  }

  async getUserExtraPermissions(userId: number): Promise<PermissionDefinition[]> {
    return this.request(`/api/permissions/users/${userId}/extra`);
  }

  async setUserExtraPermissions(userId: number, permissionIds: number[]): Promise<void> {
    await this.request(`/api/permissions/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ permissionIds }),
    });
  }

  async createPermission(data: Omit<PermissionDefinition, 'id'>): Promise<PermissionDefinition> {
    return this.request('/api/permissions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePermission(id: number, data: Partial<PermissionDefinition>): Promise<PermissionDefinition> {
    return this.request(`/api/permissions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePermission(id: number): Promise<void> {
    await this.request(`/api/permissions/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== Multi-Tenancy / University Membership API ====================

  async switchUniversity(universityId: number): Promise<{ accessToken: string; refreshToken: string; universities: UserUniversity[] }> {
    return this.post('/api/auth/switch-university', { universityId });
  }

  async getUserUniversities(userId: number): Promise<UserUniversity[]> {
    return this.get(`/api/users/${userId}/universities`);
  }

  async addUserToUniversity(userId: number, universityId: number): Promise<void> {
    return this.post(`/api/users/${userId}/universities`, { universityId });
  }

  async removeUserFromUniversity(userId: number, universityId: number): Promise<void> {
    return this.delete(`/api/users/${userId}/universities/${universityId}`);
  }

  async searchUsers(query: string, excludeUniversityId?: number, page?: number, size?: number): Promise<{ items: UserSearchResult[]; total: number }> {
    const params: Record<string, unknown> = { query };
    if (excludeUniversityId !== undefined) params.excludeUniversityId = excludeUniversityId;
    if (page !== undefined) params.page = page;
    if (size !== undefined) params.size = size;
    return this.get('/api/users/search', params);
  }

  // ==================== Invitations ====================

  // Create a single invitation (admin, requires auth)
  async createInvitation(data: { email: string; userType: string; universityId?: number; isAdmin?: boolean; languagePreference?: string }): Promise<InvitationResponse> {
    return this.post('/api/invitations', data);
  }

  // Bulk invite - handles both existing and new users (admin, requires auth)
  async bulkInvite(data: { emails: string[]; userType: string; universityId?: number; isAdmin?: boolean; languagePreference?: string }): Promise<BulkInviteResult> {
    return this.post('/api/invitations/bulk', data);
  }

  // Get invitation details by token (public, no auth)
  async getInvitationByToken(token: string): Promise<InvitationDetailsResponse> {
    const baseUrl = this.baseURL;
    const response = await fetch(`${baseUrl}/api/auth/invitations/${encodeURIComponent(token)}`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Invitation not found' }));
      throw new Error(error.message || 'Invitation not found');
    }
    return response.json();
  }

  // Accept invitation (public, no auth)
  async acceptInvitation(data: { token: string; username: string; firstName: string; lastName: string; password: string }): Promise<{ userId: number; email: string; message: string }> {
    const baseUrl = this.baseURL;
    const response = await fetch(`${baseUrl}/api/auth/accept-invitation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to accept invitation' }));
      throw new Error(error.message || 'Failed to accept invitation');
    }
    return response.json();
  }
}

export const apiClient = new TutoriaAPIClient();