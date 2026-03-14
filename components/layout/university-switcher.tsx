'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Building2, Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/auth-provider';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'sonner';

export function UniversitySwitcher() {
  const { user, switchUniversity } = useAuth();
  const t = useTranslations('header.universitySwitcher');
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open]);

  if (!user?.universities || user.universities.length < 2) {
    return null;
  }

  const activeUniversity = user.universities.find(u => u.id === user.universityId);

  const handleSwitch = async (universityId: number) => {
    if (universityId === user.universityId) {
      setOpen(false);
      return;
    }

    setSwitching(true);
    try {
      await switchUniversity(universityId);
      // Page will reload after switch
    } catch (error) {
      console.error('Failed to switch university:', error);
      toast.error(t('error'));
      setSwitching(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        disabled={switching}
        className="flex items-center gap-2 max-w-[200px] sm:max-w-[280px]"
      >
        {switching ? (
          <LoadingSpinner size="sm" />
        ) : (
          <Building2 className="h-4 w-4 shrink-0" />
        )}
        <span className="truncate text-xs sm:text-sm">
          {switching ? t('switching') : (activeUniversity?.name || t('select'))}
        </span>
        <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50" />
      </Button>

      {open && !switching && (
        <div className="absolute left-0 top-full mt-2 w-64 rounded-md border bg-popover p-1 shadow-md z-50">
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            {t('label')}
          </div>
          {user.universities.map((university) => (
            <button
              key={university.id}
              onClick={() => handleSwitch(university.id)}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
            >
              <Check
                className={`h-4 w-4 shrink-0 ${
                  university.id === user.universityId ? 'opacity-100' : 'opacity-0'
                }`}
              />
              <div className="flex flex-col items-start min-w-0">
                <span className="truncate w-full">{university.name}</span>
                <span className="text-xs text-muted-foreground">{university.code}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
