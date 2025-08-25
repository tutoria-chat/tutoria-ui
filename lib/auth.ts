import { apiClient } from './api';
import type { User, LoginCredentials, TokenResponse } from './types';

class AuthService {
  private static instance: AuthService;
  private user: User | null = null;
  private token: string | null = null;
  private refreshTimeout: NodeJS.Timeout | null = null;

  constructor() {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('tutoria_user');
      const storedToken = localStorage.getItem('tutoria_token');
      
      if (storedUser && storedToken) {
        try {
          this.user = JSON.parse(storedUser);
          this.token = storedToken;
          apiClient.setToken(storedToken);
          this.scheduleTokenRefresh();
        } catch (error) {
          this.clearAuth();
        }
      }
    }
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(credentials: LoginCredentials): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response: TokenResponse = await apiClient.login(credentials);
      
      // Decode JWT token to get user info (simplified - in production use a JWT library)
      const userInfo = this.decodeToken(response.access_token);
      
      if (!userInfo) {
        throw new Error('Invalid token received');
      }

      this.user = userInfo;
      this.token = response.access_token;
      
      // Store in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('tutoria_user', JSON.stringify(userInfo));
        localStorage.setItem('tutoria_token', response.access_token);
      }
      
      // Schedule token refresh
      this.scheduleTokenRefresh();
      
      return { success: true, user: userInfo };
    } catch (error) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      };
    }
  }

  async logout(): Promise<void> {
    this.clearAuth();
    
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  private clearAuth(): void {
    this.user = null;
    this.token = null;
    
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }
    
    apiClient.clearToken();
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tutoria_user');
      localStorage.removeItem('tutoria_token');
    }
  }

  private decodeToken(token: string): User | null {
    try {
      // This is a simplified JWT decode - in production, use a proper JWT library
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      const payload = JSON.parse(jsonPayload);
      
      // Map JWT payload to User object
      return {
        id: payload.sub || payload.user_id,
        email: payload.email,
        first_name: payload.first_name,
        last_name: payload.last_name,
        role: payload.role,
        university_id: payload.university_id,
        is_admin: payload.is_admin,
        assigned_courses: payload.assigned_courses,
        created_at: payload.created_at,
        updated_at: payload.updated_at,
      };
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }

  private scheduleTokenRefresh(): void {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
    
    // Refresh token 5 minutes before expiration (default 50 minutes)
    const refreshIn = 45 * 60 * 1000; // 45 minutes
    
    this.refreshTimeout = setTimeout(async () => {
      try {
        const response = await apiClient.refreshToken();
        
        if (response.access_token) {
          this.token = response.access_token;
          
          if (typeof window !== 'undefined') {
            localStorage.setItem('tutoria_token', response.access_token);
          }
          
          // Schedule next refresh
          this.scheduleTokenRefresh();
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        this.logout();
      }
    }, refreshIn);
  }

  getUser(): User | null {
    return this.user;
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return this.user !== null && this.token !== null;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      await apiClient.changePassword(currentPassword, newPassword);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Password change failed' 
      };
    }
  }

  async requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      await apiClient.requestPasswordReset(email);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Password reset request failed' 
      };
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      await apiClient.resetPassword(token, newPassword);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Password reset failed' 
      };
    }
  }
}

export const authService = AuthService.getInstance();