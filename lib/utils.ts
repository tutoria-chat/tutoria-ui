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
 * Extract YouTube video ID from various YouTube URL formats.
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
 * @returns Video ID if valid, null if invalid
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;

  const trimmedUrl = url.trim();

  // Pattern 1: youtube.com/watch?v=VIDEO_ID
  const watchPattern = /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/;
  const watchMatch = trimmedUrl.match(watchPattern);
  if (watchMatch) return watchMatch[1];

  // Pattern 2: youtu.be/VIDEO_ID
  const shortPattern = /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const shortMatch = trimmedUrl.match(shortPattern);
  if (shortMatch) return shortMatch[1];

  // Pattern 3: youtube.com/embed/VIDEO_ID
  const embedPattern = /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
  const embedMatch = trimmedUrl.match(embedPattern);
  if (embedMatch) return embedMatch[1];

  // Pattern 4: youtube.com/shorts/VIDEO_ID
  const shortsPattern = /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
  const shortsMatch = trimmedUrl.match(shortsPattern);
  if (shortsMatch) return shortsMatch[1];

  return null;
}

/**
 * Validate if a URL is a valid YouTube URL.
 *
 * @param url - URL to validate
 * @returns true if valid YouTube URL with extractable video ID
 */
export function isValidYouTubeUrl(url: string): boolean {
  return extractYouTubeVideoId(url) !== null;
}
