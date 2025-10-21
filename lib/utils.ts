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
