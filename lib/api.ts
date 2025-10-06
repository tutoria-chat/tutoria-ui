import type {
  TokenResponse,
  User,
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

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    // Build headers - don't set Content-Type if it's explicitly null (for FormData)
    const headers: Record<string, string> = {
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
    };

    // Add other headers, excluding Content-Type if it's null (for FormData)
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        if (value !== null) {
          headers[key] = value as string;
        }
      });
    }

    // Add default Content-Type for non-FormData requests
    if (!options.headers || !('Content-Type' in options.headers)) {
      headers['Content-Type'] = 'application/json';
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      if (response.status === 401) {
        // Token expired or invalid
        this.clearToken();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('Unauthorized');
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

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
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
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    } else {
      // Mark that we explicitly want no Content-Type for FormData
      headers['Content-Type'] = null;
    }

    return this.request<T>(endpoint, {
      method: 'POST',
      headers,
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

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    return this.post('/auth/reset-password-request', { email });
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return this.post('/auth/reset-password', { token, new_password: newPassword });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    return this.put('/auth/password', { current_password: currentPassword, new_password: newPassword });
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
    return this.get('/super-admins/stats');
  }

  async getSuperAdmins(params?: PaginationParams): Promise<PaginatedResponse<SuperAdmin>> {
    return this.get('/super-admins/super-admins/', params);
  }

  async createSuperAdmin(data: SuperAdminCreate): Promise<SuperAdmin> {
    return this.post('/super-admins/super-admins/', data);
  }

  async updateSuperAdmin(id: number, data: Partial<SuperAdminCreate>): Promise<SuperAdmin> {
    return this.put(`/super-admins/super-admins/${id}`, data);
  }

  async getAllUniversities(): Promise<University[]> {
    return this.get('/super-admins/universities/all');
  }

  async getAllProfessors(): Promise<Professor[]> {
    return this.get('/super-admins/professors/all');
  }

  // AI Tutor endpoints
  async askTutor(question: TutorQuestion): Promise<TutorResponse> {
    return this.post('/tutor/ask', question);
  }
}

export const apiClient = new TutoriaAPIClient();