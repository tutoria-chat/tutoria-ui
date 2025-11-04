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
  DashboardSummaryDto
} from './types';

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
    const url = `${baseUrl}${endpoint}`;

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
        const errorMessage = errorData.detail || errorData.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
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
    const response = await this.post<TokenResponse>('/api/auth/refresh', undefined, false, true);
    if (response.accessToken) {
      this.setToken(response.accessToken);
    }
    return response;
  }

  async requestPasswordReset(username: string, userType: 'student' | 'professor' | 'super_admin'): Promise<{ message: string; resetToken: string }> {
    return this.post('/api/auth/reset-password-request', { username, userType }, { useAuthAPI: true });
  }

  async verifyResetToken(username: string, token: string): Promise<{ valid: boolean; username: string; firstName: string; lastName: string; email: string; languagePreference: string; userType: string }> {
    return this.get('/api/auth/verify-reset-token', { username, resetToken: token }, true);
  }

  async resetPassword(username: string, token: string, newPassword: string): Promise<{ message: string }> {
    return this.post(`/api/auth/reset-password?username=${username}&resetToken=${token}`, { newPassword }, { useAuthAPI: true });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    return this.put('/api/auth/password', { currentPassword, newPassword }, true);
  }

  async getCurrentUser(): Promise<UserResponse> {
    return this.get('/api/auth/me', undefined, true);
  }

  async updateUserPreferences(data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    themePreference?: string;
    languagePreference?: string;
    birthdate?: string;
  }): Promise<UserResponse> {
    return this.put('/api/auth/me', data, true);
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

  // AI Model endpoints
  async getAIModels(params?: { provider?: string; is_active?: boolean; include_deprecated?: boolean }): Promise<AIModel[]> {
    return this.get('/api/ai-models/', params);
  }

  async getAIModel(id: number): Promise<AIModel> {
    return this.get(`/api/ai-models/${id}`);
  }

  // File endpoints
  async getFiles(params?: FileFilters): Promise<PaginatedResponse<File>> {
    return this.get('/api/files/', params);
  }

  async uploadFile(formData: FormData, moduleId: number, fileName?: string): Promise<FileResponse> {
    // Add moduleId and name to the FormData (not query params)
    // Backend expects these in the form body as part of UploadFileRequest DTO
    formData.append('moduleId', moduleId.toString());
    if (fileName) {
      formData.append('name', fileName);
    }
    return this.post('/api/files/', formData, true);
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
    return this.get('/api/professors/', params);
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
    return this.get(`/api/professors/${id}`);
  }

  async updateProfessor(id: number, data: ProfessorUpdate): Promise<Professor> {
    return this.put(`/api/professors/${id}`, data);
  }

  async updateProfessorPassword(id: number, newPassword: string): Promise<{ message: string }> {
    return this.put(`/api/professors/${id}/password`, { newPassword });
  }

  async getProfessorCourses(id: number): Promise<{ courseIds: number[] }> {
    return this.get(`/api/professors/${id}/courses`);
  }

  async deleteProfessor(id: number): Promise<void> {
    return this.delete(`/api/professors/${id}`);
  }

  // Student endpoints
  async getStudents(params?: StudentFilters): Promise<PaginatedResponse<Student>> {
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
    return this.get('/api/super-admin/super-admins/', params);
  }

  async createSuperAdmin(data: SuperAdminCreate): Promise<SuperAdmin> {
    // Use the unified /api/auth/users/create endpoint
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

    const response = await this.post<BackendUserResponse>('/api/auth/users/create', {
      username: data.username,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      password: data.password,
      userType: 'super_admin',
      isAdmin: true, // Super admins are always admins
      languagePreference: data.languagePreference || 'pt-br',
    }, false, true);

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
    return this.put(`/api/super-admin/super-admins/${id}`, data);
  }

  async getAllUniversities(params?: PaginationParams): Promise<PaginatedResponse<University>> {
    return this.get('/api/super-admin/universities/all', params);
  }

  async getAllProfessors(params?: PaginationParams): Promise<PaginatedResponse<Professor>> {
    return this.get('/api/super-admin/professors/all', params);
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
}

export const apiClient = new TutoriaAPIClient();