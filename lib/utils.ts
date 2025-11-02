import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';

  const dateObj = new Date(date);

  // Check for invalid dates or dates before 1970 (likely 0/null timestamps)
  if (isNaN(dateObj.getTime()) || dateObj.getFullYear() < 1970) {
    return 'N/A';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj);
}

export function formatDateShort(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';

  const dateObj = new Date(date);

  // Check for invalid dates or dates before 1970 (likely 0/null timestamps)
  if (isNaN(dateObj.getTime()) || dateObj.getFullYear() < 1970) {
    return 'N/A';
  }

  // Format as "26 Jul 2025" to avoid confusion between date formats
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(dateObj);
}

/**
 * Checks if an entity has been meaningfully updated (updatedAt is different from createdAt)
 * @param createdAt - Creation timestamp
 * @param updatedAt - Update timestamp
 * @returns true if the entity has been updated after creation
 */
export function hasBeenUpdated(
  createdAt: string | Date | null | undefined,
  updatedAt: string | Date | null | undefined
): boolean {
  if (!updatedAt || !createdAt) return false;

  const created = new Date(createdAt);
  const updated = new Date(updatedAt);

  // Check for invalid dates
  if (isNaN(created.getTime()) || isNaN(updated.getTime())) return false;

  // Consider updated if the difference is more than 1 second (accounts for millisecond differences)
  const diffInSeconds = Math.abs(updated.getTime() - created.getTime()) / 1000;
  return diffInSeconds > 1;
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return formatDate(date);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export interface PasswordValidationResult {
  isValid: boolean;
  messageKey: string;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

/**
 * Validate password strength against security requirements.
 *
 * Requirements:
 * - At least 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - Special characters are recommended but not required
 *
 * @returns PasswordValidationResult with messageKey for translation (use with t('common.passwordValidation.{key}'))
 */
export function validatePasswordStrength(password: string): PasswordValidationResult {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const isValid = hasMinLength && hasUppercase && hasLowercase && hasNumber;

  let messageKey = '';
  if (!hasMinLength) {
    messageKey = 'minLength';
  } else if (!hasUppercase) {
    messageKey = 'uppercase';
  } else if (!hasLowercase) {
    messageKey = 'lowercase';
  } else if (!hasNumber) {
    messageKey = 'number';
  } else if (hasSpecialChar) {
    messageKey = 'allRequirementsMet';
  } else {
    messageKey = 'validWithRecommendation';
  }

  return {
    isValid,
    messageKey,
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar,
  };
}

/**
 * Extract a user-friendly error message from API error responses.
 *
 * Handles multiple error formats:
 * - { detail: "Error message" }
 * - { message: "Error message" }
 * - Plain string errors
 * - Unknown error objects
 *
 * @param error - The error object from the API or catch block
 * @returns A user-friendly error message string
 */
export function getErrorMessage(error: any): string {
  // Check for API error response with detail field (FastAPI/Python backend)
  if (error?.detail) {
    // Handle both string and array formats of detail
    if (typeof error.detail === 'string') {
      return error.detail;
    }
    if (Array.isArray(error.detail)) {
      return error.detail.map((d: any) => d.msg || d).join(', ');
    }
  }

  // Check for generic message field (.NET backend or generic errors)
  if (error?.message && typeof error.message === 'string') {
    return error.message;
  }

  // Handle plain string errors
  if (typeof error === 'string') {
    return error;
  }

  // Fallback for unknown error formats
  return 'An unexpected error occurred';
}

/**
 * Extract YouTube video ID from various YouTube URL formats with proper URL parsing and validation.
 *
 * Security features:
 * - Uses browser URL API to validate URL structure and prevent XSS
 * - Validates domain is exactly youtube.com or youtu.be (prevents subdomain attacks)
 * - Ensures protocol is http or https (blocks javascript:, data:, etc.)
 * - Validates video ID is exactly 11 characters with allowed charset
 *
 * Supported formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://www.youtube.com/watch?v=VIDEO_ID&t=123s
 * - https://youtu.be/VIDEO_ID
 * - https://youtu.be/VIDEO_ID?t=123
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - http variants and www-less variants
 *
 * @param url - YouTube URL to parse
 * @returns Video ID if valid, null if invalid or potentially malicious
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;

  const trimmedUrl = url.trim();

  // Step 1: Parse URL using browser URL API for security validation
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmedUrl);
  } catch {
    // Invalid URL format
    return null;
  }

  // Step 2: Security - Validate protocol (block javascript:, data:, etc.)
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return null;
  }

  // Step 3: Security - Validate hostname is exactly youtube.com or youtu.be
  // This prevents attacks like evil.youtube.com.attacker.com
  const hostname = parsedUrl.hostname.toLowerCase();
  const isYouTubeDomain = hostname === 'youtube.com' ||
                          hostname === 'www.youtube.com' ||
                          hostname === 'm.youtube.com' ||
                          hostname === 'youtu.be';

  if (!isYouTubeDomain) {
    return null;
  }

  // Step 4: Extract video ID based on URL pattern
  const pathname = parsedUrl.pathname;
  const searchParams = parsedUrl.searchParams;

  // Pattern 1: youtube.com/watch?v=VIDEO_ID
  if (pathname === '/watch' && searchParams.has('v')) {
    const videoId = searchParams.get('v');
    if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return videoId;
    }
  }

  // Pattern 2: youtu.be/VIDEO_ID
  if (hostname === 'youtu.be' && pathname.length === 12 && pathname.startsWith('/')) {
    const videoId = pathname.substring(1);
    if (/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return videoId;
    }
  }

  // Pattern 3: youtube.com/embed/VIDEO_ID
  if (pathname.startsWith('/embed/') && pathname.length === 18) {
    const videoId = pathname.substring(7);
    if (/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return videoId;
    }
  }

  // Pattern 4: youtube.com/shorts/VIDEO_ID
  if (pathname.startsWith('/shorts/') && pathname.length === 19) {
    const videoId = pathname.substring(8);
    if (/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return videoId;
    }
  }

  return null;
}

/**
 * Validate if a URL is a valid YouTube URL.
 *
 * This function performs comprehensive security validation:
 * - URL structure validation via URL API
 * - Protocol whitelist (http/https only)
 * - Domain whitelist (youtube.com/youtu.be only)
 * - Video ID format validation
 *
 * @param url - URL to validate
 * @returns true if valid YouTube URL with extractable video ID
 */
export function isValidYouTubeUrl(url: string): boolean {
  return extractYouTubeVideoId(url) !== null;
}

/**
 * Format a string as Brazilian CNPJ (Cadastro Nacional da Pessoa Jurídica).
 *
 * Format: XX.XXX.XXX/XXXX-XX (14 digits)
 * Example: 12.345.678/0001-90
 *
 * @param value - Input string (digits only or with existing formatting)
 * @returns Formatted CNPJ string
 */
export function formatCNPJ(value: string): string {
  if (!value) return '';

  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');

  // Limit to 14 digits (CNPJ length)
  const limited = digits.slice(0, 14);

  // Apply mask: XX.XXX.XXX/XXXX-XX
  let formatted = limited;

  if (limited.length > 12) {
    // XX.XXX.XXX/XXXX-XX
    formatted = `${limited.slice(0, 2)}.${limited.slice(2, 5)}.${limited.slice(5, 8)}/${limited.slice(8, 12)}-${limited.slice(12, 14)}`;
  } else if (limited.length > 8) {
    // XX.XXX.XXX/XXXX
    formatted = `${limited.slice(0, 2)}.${limited.slice(2, 5)}.${limited.slice(5, 8)}/${limited.slice(8)}`;
  } else if (limited.length > 5) {
    // XX.XXX.XXX
    formatted = `${limited.slice(0, 2)}.${limited.slice(2, 5)}.${limited.slice(5)}`;
  } else if (limited.length > 2) {
    // XX.XXX
    formatted = `${limited.slice(0, 2)}.${limited.slice(2)}`;
  }

  return formatted;
}

/**
 * Format a string as Brazilian phone number.
 *
 * Formats:
 * - Mobile: (XX) XXXXX-XXXX (11 digits)
 * - Landline: (XX) XXXX-XXXX (10 digits)
 *
 * Examples:
 * - (85) 98765-4321
 * - (11) 3456-7890
 *
 * @param value - Input string (digits only or with existing formatting)
 * @returns Formatted phone string
 */
export function formatBrazilianPhone(value: string): string {
  if (!value) return '';

  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');

  // Limit to 11 digits (mobile with area code)
  const limited = digits.slice(0, 11);

  // Apply mask based on length
  let formatted = limited;

  if (limited.length > 10) {
    // Mobile: (XX) XXXXX-XXXX
    formatted = `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7, 11)}`;
  } else if (limited.length > 6) {
    // Landline or partial mobile: (XX) XXXX-XXXX
    formatted = `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6, 10)}`;
  } else if (limited.length > 2) {
    // Partial: (XX) XXXX
    formatted = `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
  } else if (limited.length > 0) {
    // Partial: (XX
    formatted = `(${limited}`;
  }

  return formatted;
}

/**
 * Format a string as Brazilian CEP (Código de Endereçamento Postal).
 *
 * Format: XXXXX-XXX (8 digits)
 * Example: 60110-123
 *
 * @param value - Input string (digits only or with existing formatting)
 * @returns Formatted CEP string
 */
export function formatCEP(value: string): string {
  if (!value) return '';

  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');

  // Limit to 8 digits (CEP length)
  const limited = digits.slice(0, 8);

  // Apply mask: XXXXX-XXX
  let formatted = limited;

  if (limited.length > 5) {
    // XXXXX-XXX
    formatted = `${limited.slice(0, 5)}-${limited.slice(5, 8)}`;
  }

  return formatted;
}

/**
 * ViaCEP API response interface
 */
export interface ViaCEPResponse {
  cep: string;
  logradouro: string; // Street name
  complemento: string; // Complement
  bairro: string; // Neighborhood
  localidade: string; // City
  uf: string; // State (2-letter code)
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean; // True if CEP not found
}

/**
 * Fetch address data from ViaCEP API based on Brazilian postal code.
 *
 * API Documentation: https://viacep.com.br/
 * Endpoint: https://viacep.com.br/ws/{cep}/json/
 *
 * @param cep - Brazilian postal code (8 digits, with or without dash)
 * @returns Promise<ViaCEPResponse | null> - Address data or null if not found/error
 *
 * @example
 * const address = await fetchViaCEP('60110-123');
 * if (address) {
 *   console.log(address.logradouro); // Street name
 *   console.log(address.bairro); // Neighborhood
 *   console.log(address.localidade); // City
 *   console.log(address.uf); // State
 * }
 */
export async function fetchViaCEP(cep: string): Promise<ViaCEPResponse | null> {
  if (!cep) return null;

  // Remove all non-digit characters
  const cleanCEP = cep.replace(/\D/g, '');

  // Validate CEP length (must be exactly 8 digits)
  if (cleanCEP.length !== 8) {
    console.warn('Invalid CEP: must be 8 digits');
    return null;
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('ViaCEP API error:', response.status, response.statusText);
      return null;
    }

    const data: ViaCEPResponse = await response.json();

    // Check if CEP was not found (API returns erro: true)
    if (data.erro) {
      console.warn('CEP not found:', cleanCEP);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to fetch ViaCEP:', error);
    return null;
  }
}
