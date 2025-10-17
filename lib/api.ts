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
  TutorResponse
} from './types';

export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://tutoria-api-dev.orangesmoke-8addc8f4.eastus2.azurecontainerapps.io/api/v2',
  timeout: 30000,
} as const;

class TutoriaAPIClient {
  private baseURL: string;
  private timeout: number;
  private token: string | null = null;
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(config = API_CONFIG) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout;

    // Initialize token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth-token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth-token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-token');
    }
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    // If already refreshing, wait for that promise
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const refreshToken = localStorage.getItem('tutoria_refresh_token');
        if (!refreshToken) {
          return false;
        }

        // Call refresh endpoint
        const response = await fetch(`${this.baseURL}/auth/refresh`, {
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
        this.setToken(data.access_token);
        localStorage.setItem('tutoria_token', data.access_token);
        if (data.refresh_token) {
          localStorage.setItem('tutoria_refresh_token', data.refresh_token);
        }

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
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

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
          return this.request<T>(endpoint, options);
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
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
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

  async get<T>(endpoint: string, params?: Record<string, unknown> | object): Promise<T> {
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
    
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown, isFormData = false): Promise<T> {
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
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Authentication endpoints
  async login(credentials: { username: string; password: string }): Promise<TokenResponse> {
    const response = await this.post<TokenResponse>('/auth/login', credentials);
    if (response.access_token) {
      this.setToken(response.access_token);
    }
    return response;
  }

  async refreshToken(): Promise<TokenResponse> {
    const response = await this.post<TokenResponse>('/auth/refresh');
    if (response.access_token) {
      this.setToken(response.access_token);
    }
    return response;
  }

  async requestPasswordReset(username: string, userType: 'student' | 'professor' | 'super_admin'): Promise<{ message: string; reset_token: string }> {
    return this.post('/auth/reset-password-request', { username, user_type: userType });
  }

  async verifyResetToken(username: string, token: string): Promise<{ valid: boolean; username: string; language_preference: string; user_type: string }> {
    return this.get('/auth/verify-reset-token', { username, reset_token: token });
  }

  async resetPassword(username: string, token: string, newPassword: string): Promise<{ message: string }> {
    return this.post(`/auth/reset-password?username=${username}&reset_token=${token}`, { new_password: newPassword });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    return this.put('/auth/password', { current_password: currentPassword, new_password: newPassword });
  }

  async getCurrentUser(): Promise<User> {
    return this.get('/auth/me');
  }

  async updateUserPreferences(data: { theme_preference?: string; language_preference?: string }): Promise<{ message: string }> {
    return this.put('/auth/preferences', data);
  }

  async deactivateUser(userId: number): Promise<User> {
    return this.patch(`/auth/users/${userId}/deactivate`);
  }

  async activateUser(userId: number): Promise<User> {
    return this.patch(`/auth/users/${userId}/activate`);
  }

  async deleteUserPermanently(userId: number): Promise<{ message: string; user_id: number; deleted: boolean }> {
    return this.delete(`/auth/users/${userId}`);
  }

  async getUsersByType(userType: 'student' | 'professor' | 'super_admin'): Promise<UserResponse[]> {
    return this.get('/auth/users/', { user_type: userType });
  }

  async getUser(userId: number): Promise<UserResponse> {
    return this.get(`/auth/users/${userId}`);
  }

  async updateUser(userId: number, data: { first_name?: string; last_name?: string; email?: string; username?: string }): Promise<UserResponse> {
    return this.put(`/auth/users/${userId}`, data);
  }

  // University endpoints
  async getUniversities(params?: PaginationParams): Promise<PaginatedResponse<University>> {
    return this.get('/universities/', params);
  }

  async createUniversity(data: UniversityCreate): Promise<University> {
    return this.post('/universities/', data);
  }

  async getUniversity(id: number): Promise<UniversityWithCourses> {
    return this.get(`/universities/${id}`);
  }

  async updateUniversity(id: number, data: UniversityUpdate): Promise<University> {
    return this.put(`/universities/${id}`, data);
  }

  async deleteUniversity(id: number): Promise<void> {
    return this.delete(`/universities/${id}`);
  }

  // Course endpoints
  async getCourses(params?: CourseFilters): Promise<PaginatedResponse<Course>> {
    return this.get('/courses/', params);
  }

  async createCourse(data: CourseCreate): Promise<Course> {
    return this.post('/courses/', data);
  }

  async getCourse(id: number): Promise<CourseWithDetails> {
    return this.get(`/courses/${id}`);
  }

  async updateCourse(id: number, data: CourseUpdate): Promise<Course> {
    return this.put(`/courses/${id}`, data);
  }

  async deleteCourse(id: number): Promise<void> {
    return this.delete(`/courses/${id}`);
  }

  async getCoursesByUniversity(universityId: number): Promise<Course[]> {
    return this.get(`/courses/`, { university_id: universityId });
  }

  async assignProfessorToCourse(courseId: number, professorId: number): Promise<void> {
    return this.post(`/courses/${courseId}/professors/${professorId}`);
  }

  async unassignProfessorFromCourse(courseId: number, professorId: number): Promise<void> {
    return this.delete(`/courses/${courseId}/professors/${professorId}`);
  }

  // Module endpoints
  async getModules(params?: ModuleFilters): Promise<PaginatedResponse<Module>> {
    return this.get('/modules/', params);
  }

  async createModule(data: ModuleCreate): Promise<Module> {
    return this.post('/modules/', data);
  }

  async getModule(id: number): Promise<ModuleWithDetails> {
    return this.get(`/modules/${id}`);
  }

  async updateModule(id: number, data: ModuleUpdate): Promise<Module> {
    return this.put(`/modules/${id}`, data);
  }

  async deleteModule(id: number): Promise<void> {
    return this.delete(`/modules/${id}`);
  }

  // AI Model endpoints
  async getAIModels(params?: { provider?: string; is_active?: boolean; include_deprecated?: boolean }): Promise<AIModel[]> {
    return this.get('/ai-models/', params);
  }

  async getAIModel(id: number): Promise<AIModel> {
    return this.get(`/ai-models/${id}`);
  }

  // File endpoints
  async getFiles(params?: FileFilters): Promise<PaginatedResponse<File>> {
    return this.get('/files/', params);
  }

  async uploadFile(formData: FormData, moduleId: number, fileName?: string): Promise<FileResponse> {
    const params = new URLSearchParams();
    params.append('module_id', moduleId.toString());
    if (fileName) {
      params.append('name', fileName);
    }
    return this.post(`/files/?${params.toString()}`, formData, true);
  }

  async getFile(id: number): Promise<FileResponse> {
    return this.get(`/files/${id}`);
  }

  async updateFile(id: number, data: Partial<File>): Promise<File> {
    return this.put(`/files/${id}`, data);
  }

  async deleteFile(id: number): Promise<void> {
    return this.delete(`/files/${id}`);
  }

  async getFileDownloadUrl(id: number): Promise<{ download_url: string }> {
    return this.get(`/files/${id}/download`);
  }

  // Professor endpoints
  async getProfessors(params?: ProfessorFilters): Promise<PaginatedResponse<Professor>> {
    return this.get('/professors/', params);
  }

  async createProfessor(data: ProfessorCreate): Promise<Professor> {
    return this.post('/professors/', data);
  }

  async getProfessor(id: number): Promise<Professor> {
    return this.get(`/professors/${id}`);
  }

  async updateProfessor(id: number, data: ProfessorUpdate): Promise<Professor> {
    return this.put(`/professors/${id}`, data);
  }

  async deleteProfessor(id: number): Promise<void> {
    return this.delete(`/professors/${id}`);
  }

  // Student endpoints
  async getStudents(params?: StudentFilters): Promise<PaginatedResponse<Student>> {
    return this.get('/students/', params);
  }

  async createStudent(data: StudentCreate): Promise<Student> {
    return this.post('/students/', data);
  }

  async getStudent(id: number): Promise<Student> {
    return this.get(`/students/${id}`);
  }

  async updateStudent(id: number, data: StudentUpdate): Promise<Student> {
    return this.put(`/students/${id}`, data);
  }

  async deleteStudent(id: number): Promise<void> {
    return this.delete(`/students/${id}`);
  }

  // Module Token endpoints
  async getModuleTokens(params?: TokenFilters): Promise<PaginatedResponse<ModuleAccessToken>> {
    return this.get('/module-tokens/', params);
  }

  async createModuleToken(data: ModuleAccessTokenCreate): Promise<ModuleAccessToken> {
    return this.post('/module-tokens/', data);
  }

  async getModuleToken(id: number): Promise<ModuleAccessToken> {
    return this.get(`/module-tokens/${id}`);
  }

  async updateModuleToken(id: number, data: ModuleAccessTokenUpdate): Promise<ModuleAccessToken> {
    return this.put(`/module-tokens/${id}`, data);
  }

  async deleteModuleToken(id: number): Promise<void> {
    return this.delete(`/module-tokens/${id}`);
  }

  // Super Admin endpoints
  async getSystemStats(): Promise<SystemStats> {
    return this.get('/super-admin/stats');
  }

  async getSuperAdmins(params?: PaginationParams): Promise<PaginatedResponse<SuperAdmin>> {
    return this.get('/super-admin/super-admins/', params);
  }

  async createSuperAdmin(data: SuperAdminCreate): Promise<SuperAdmin> {
    // Use the unified /auth/users/create endpoint
    interface BackendUserResponse {
      user_id: number;
      username: string;
      email: string;
      first_name: string;
      last_name: string;
      user_type: 'super_admin' | 'professor' | 'student';
      is_active: boolean;
      created_at: string;
      updated_at: string;
      last_login_at?: string | null;
      language_preference?: string;
      theme_preference?: string;
    }

    const response = await this.post<BackendUserResponse>('/auth/users/create', {
      username: data.username,
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      password: data.password,
      user_type: 'super_admin',
      is_admin: true, // Super admins are always admins
      language_preference: data.language_preference || 'pt-br',
    });

    // Map backend UserResponse to SuperAdmin interface
    return {
      id: response.user_id,
      username: response.username,
      email: response.email,
      first_name: response.first_name,
      last_name: response.last_name,
      is_active: response.is_active,
      created_at: response.created_at,
      updated_at: response.updated_at,
      last_login_at: response.last_login_at,
      language_preference: response.language_preference,
      theme_preference: response.theme_preference,
    };
  }

  async updateSuperAdmin(id: number, data: Partial<SuperAdminCreate>): Promise<SuperAdmin> {
    return this.put(`/super-admin/super-admins/${id}`, data);
  }

  async getAllUniversities(params?: PaginationParams): Promise<PaginatedResponse<University>> {
    return this.get('/super-admin/universities/all', params);
  }

  async getAllProfessors(params?: PaginationParams): Promise<PaginatedResponse<Professor>> {
    return this.get('/super-admin/professors/all', params);
  }

  // AI Tutor endpoints
  async askTutor(question: TutorQuestion): Promise<TutorResponse> {
    return this.post('/tutor/ask', question);
  }
}

export const apiClient = new TutoriaAPIClient();