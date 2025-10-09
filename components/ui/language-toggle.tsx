'use client';

import * as React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { locales, localeNames, type Locale } from '@/i18n/config';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function LanguageToggle() {
  const { locale, setLocale } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 w-9 px-0">
          <span className="text-lg">{localeNames[locale].flag}</span>
          <span className="sr-only">Alternar idioma</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => setLocale(loc)}
            className={locale === loc ? 'bg-accent' : ''}
          >
            <span className="mr-2 text-lg">{localeNames[loc].flag}</span>
            <span>{localeNames[loc].name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
