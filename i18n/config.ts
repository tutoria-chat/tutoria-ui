export const locales = ['pt-br', 'en', 'es'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'pt-br';

export const localeNames: Record<Locale, { name: string; flag: string }> = {
  'pt-br': { name: 'Português (BR)', flag: '🇧🇷' },
  'en': { name: 'English', flag: '🇺🇸' },
  'es': { name: 'Español', flag: '🇪🇸' }
};
