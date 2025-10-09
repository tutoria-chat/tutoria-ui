import { getRequestConfig } from 'next-intl/server';
import { Locale } from './config';

export default getRequestConfig(async () => {
  // We'll use client-side locale detection via localStorage
  // This is a fallback for server-side rendering
  const locale = 'pt-br' as Locale;

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
