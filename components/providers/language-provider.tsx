'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { IntlProvider } from 'next-intl';
import type { Locale } from '@/i18n/config';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('pt-br');
  const [messages, setMessages] = useState<any>({});

  // Function to get locale from localStorage
  const getLocaleFromStorage = (): Locale => {
    const storedUser = localStorage.getItem('tutoria_user');
    let initialLocale: Locale = 'pt-br';

    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData.languagePreference) {
          initialLocale = userData.languagePreference as Locale;
        }
      } catch (error) {
        console.error('Failed to parse user data:', error);
      }
    }

    // Fallback to localStorage
    const storedLocale = localStorage.getItem('tutoria_locale') as Locale;
    if (storedLocale && (storedLocale === 'pt-br' || storedLocale === 'en' || storedLocale === 'es')) {
      initialLocale = storedLocale;
    }

    return initialLocale;
  };

  useEffect(() => {
    // Load initial locale
    setLocaleState(getLocaleFromStorage());

    // Listen for storage changes (when user logs in or updates preferences)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tutoria_user' || e.key === 'tutoria_locale') {
        const newLocale = getLocaleFromStorage();
        setLocaleState(newLocale);
      }
    };

    // Listen for custom event when user logs in or updates preferences
    const handleUserUpdate = () => {
      const newLocale = getLocaleFromStorage();
      setLocaleState(newLocale);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('tutoria_user_updated', handleUserUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('tutoria_user_updated', handleUserUpdate);
    };
  }, []);

  useEffect(() => {
    // Load messages when locale changes
    const loadMessages = async () => {
      try {
        const msgs = await import(`@/i18n/messages/${locale}.json`);
        setMessages(msgs.default);
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    };
    loadMessages();
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('tutoria_locale', newLocale);
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale }}>
      <IntlProvider locale={locale} messages={messages}>
        {children}
      </IntlProvider>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
