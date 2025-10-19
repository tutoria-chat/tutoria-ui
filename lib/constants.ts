export const APP_CONFIG = {
  name: 'Tutoria UI',
  version: '0.1.0',
  description: 'A modern frontend application',
  widgetUrl: process.env.NEXT_PUBLIC_WIDGET_URL || 'http://localhost:4321',
} as const;

export const ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  CONTACT: '/contact',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  SETTINGS: '/settings',
} as const;

export const API_ENDPOINTS = {
  USERS: '/users',
  POSTS: '/posts',
  COMMENTS: '/comments',
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
  },
} as const;

export const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const STORAGE_KEYS = {
  USER: 'user',
  TOKEN: 'token',
  THEME: 'theme',
  PREFERENCES: 'preferences',
} as const;

export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  MIN_PASSWORD_LENGTH: 8,
  MAX_INPUT_LENGTH: 255,
} as const;

export const FEATURE_FLAGS = {
  TUTORIALS_ENABLED: process.env.NEXT_PUBLIC_TUTORIALS_ENABLED === 'true',
} as const;