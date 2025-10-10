'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectItem } from '@/components/ui/select';
import { useAuth } from '@/components/auth/auth-provider';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { Settings, Sun, Globe } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useTranslations } from 'next-intl';

interface UserSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function UserSettingsModal({ open, onClose }: UserSettingsModalProps) {
  const { user } = useAuth();
  const t = useTranslations('settings');
  const [loading, setLoading] = useState(false);

  const [themePreference, setThemePreference] = useState(user?.theme_preference || 'system');
  const [languagePreference, setLanguagePreference] = useState(user?.language_preference || 'pt-br');

  const handleSave = async () => {
    setLoading(true);
    try {
      // Call API to update user preferences
      await apiClient.updateUserPreferences({
        theme_preference: themePreference,
        language_preference: languagePreference
      });

      // Update localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', themePreference);
        localStorage.setItem('language', languagePreference);

        // Apply theme immediately
        const root = document.documentElement;
        if (themePreference === 'dark') {
          root.classList.add('dark');
        } else if (themePreference === 'light') {
          root.classList.remove('dark');
        } else {
          // System theme
          const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (systemDark) {
            root.classList.add('dark');
          } else {
            root.classList.remove('dark');
          }
        }

        // Update user in localStorage
        const storedUser = localStorage.getItem('tutoria_user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          userData.theme_preference = themePreference;
          userData.language_preference = languagePreference;
          localStorage.setItem('tutoria_user', JSON.stringify(userData));
        }
      }

      toast.success(t('saveSuccess'));

      if (languagePreference !== user?.language_preference) {
        toast.info(t('languageChangeInfo'));
        setTimeout(() => window.location.reload(), 1000);
      } else {
        onClose();
      }
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(error.message || t('saveError'));
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* User Info */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('userLabel')}</Label>
            <div className="rounded-lg border p-3 bg-muted/50">
              <p className="font-medium">{user.first_name} {user.last_name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <Separator />

          {/* Theme Settings */}
          <div className="space-y-3">
            <Label className="flex items-center text-sm font-medium">
              <Sun className="mr-2 h-4 w-4" />
              {t('themeLabel')}
            </Label>
            <Select value={themePreference} onValueChange={setThemePreference}>
              <SelectItem value="system">{t('themeSystem')}</SelectItem>
              <SelectItem value="light">{t('themeLight')}</SelectItem>
              <SelectItem value="dark">{t('themeDark')}</SelectItem>
            </Select>
            <p className="text-xs text-muted-foreground">
              {themePreference === 'system' && t('themeSystemDesc')}
              {themePreference === 'light' && t('themeLightDesc')}
              {themePreference === 'dark' && t('themeDarkDesc')}
            </p>
          </div>

          <Separator />

          {/* Language Settings */}
          <div className="space-y-3">
            <Label className="flex items-center text-sm font-medium">
              <Globe className="mr-2 h-4 w-4" />
              {t('languageLabel')}
            </Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-xl z-10">
                {languagePreference === 'pt-br' && '🇧🇷'}
                {languagePreference === 'en' && '🇺🇸'}
                {languagePreference === 'es' && '🇪🇸'}
              </div>
              <Select
                value={languagePreference}
                onValueChange={setLanguagePreference}
                className="pl-12"
              >
                <SelectItem value="pt-br">{t('languagePtBr')}</SelectItem>
                <SelectItem value="en">{t('languageEn')}</SelectItem>
                <SelectItem value="es">{t('languageEs')}</SelectItem>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('languageDesc')}
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? t('saving') : t('save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
