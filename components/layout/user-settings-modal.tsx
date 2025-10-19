'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/components/auth/auth-provider';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { Settings, Sun, Globe, User, Lock, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { useTranslations } from 'next-intl';
import { useLanguage } from '@/components/providers/language-provider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Locale } from '@/i18n/config';

interface UserSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function UserSettingsModal({ open, onClose }: UserSettingsModalProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { setLocale } = useLanguage();
  const t = useTranslations('settings');
  const [loading, setLoading] = useState(false);

  // Profile state
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [email, setEmail] = useState(user?.email || '');
  // Readonly fields from external system (no setters needed)
  const governmentId = user?.government_id || '';
  const externalId = user?.external_id || '';
  // Editable field
  const [birthdate, setBirthdate] = useState(user?.birthdate || '');

  // Preferences state
  const [themePreference, setThemePreference] = useState(user?.theme_preference || 'system');
  const [languagePreference, setLanguagePreference] = useState(user?.language_preference || 'pt-br');

  const handleProfileUpdate = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await apiClient.updateUser(user.id, {
        first_name: firstName,
        last_name: lastName,
        email: email,
        // Only send birthdate (governmentId and externalId are readonly, set by external system)
        birthdate: birthdate,
      });

      // Update user in localStorage
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('tutoria_user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          userData.first_name = firstName;
          userData.last_name = lastName;
          userData.email = email;
          userData.birthdate = birthdate;
          // governmentId and externalId remain unchanged (from external system)
          localStorage.setItem('tutoria_user', JSON.stringify(userData));
        }
      }

      toast.success(t('profileUpdateSuccess'));
      // Reload to update user context
      window.location.reload();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || t('profileUpdateError'));
    } finally {
      setLoading(false);
    }
  };


  const handlePreferencesSave = async () => {
    setLoading(true);

    // Capture old language preference before any updates
    const oldLanguagePreference = user?.language_preference;
    const languageChanged = languagePreference !== oldLanguagePreference;

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

      // Close the modal first
      onClose();

      // If language changed, update the locale and reload
      if (languageChanged) {
        // Update the locale using the LanguageProvider
        setLocale(languagePreference as Locale);

        // Dispatch custom event to notify other components
        window.dispatchEvent(new Event('tutoria_user_updated'));

        // Reload page to apply language change
        setTimeout(() => {
          window.location.reload();
        }, 500);
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {t('profileSection')}
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {t('preferencesSection')}
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="firstName">{t('firstNameLabel')}</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={t('firstNamePlaceholder')}
                  maxLength={100}
                />
              </div>

              <div>
                <Label htmlFor="lastName">{t('lastNameLabel')}</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={t('lastNamePlaceholder')}
                  maxLength={100}
                />
              </div>

              <div>
                <Label htmlFor="email">{t('emailLabel')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('emailPlaceholder')}
                  maxLength={255}
                />
              </div>

              {user?.username && (
                <div>
                  <Label>{t('usernameLabel')}</Label>
                  <Input
                    value={user.username}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('usernameReadonly')}
                  </p>
                </div>
              )}

              {governmentId && (
                <div>
                  <Label htmlFor="governmentId">{t('governmentIdLabel')}</Label>
                  <Input
                    id="governmentId"
                    value={governmentId}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('governmentIdReadonly')}
                  </p>
                </div>
              )}

              {externalId && user.role !== 'super_admin' && (
                <div>
                  <Label htmlFor="externalId">{t('externalIdLabel')}</Label>
                  <Input
                    id="externalId"
                    value={externalId}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('externalIdReadonly')}
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="birthdate">{t('birthdateLabel')}</Label>
                <Input
                  id="birthdate"
                  type="date"
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                />
              </div>

              <Separator />

              {/* Password Change Section */}
              <div className="space-y-3">
                <Label className="flex items-center text-sm font-medium">
                  <Lock className="mr-2 h-4 w-4" />
                  {t('passwordLabel')}
                </Label>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    onClose();
                    router.push('/change-password');
                  }}
                >
                  <Lock className="mr-2 h-4 w-4" />
                  {t('changePasswordButton')}
                  <ExternalLink className="ml-auto h-4 w-4" />
                </Button>
                <p className="text-xs text-muted-foreground">
                  {t('passwordChangeHint')}
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                {t('cancel')}
              </Button>
              <Button onClick={handleProfileUpdate} disabled={loading}>
                {loading ? t('saving') : t('save')}
              </Button>
            </div>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-4 mt-4">
            <div className="space-y-6">
              {/* Theme Settings */}
              <div className="space-y-3">
                <Label className="flex items-center text-sm font-medium">
                  <Sun className="mr-2 h-4 w-4" />
                  {t('themeLabel')}
                </Label>
                <Select value={themePreference} onValueChange={setThemePreference}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">{t('themeSystem')}</SelectItem>
                    <SelectItem value="light">{t('themeLight')}</SelectItem>
                    <SelectItem value="dark">{t('themeDark')}</SelectItem>
                  </SelectContent>
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
                  >
                    <SelectTrigger className="pl-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-br">{t('languagePtBr')}</SelectItem>
                      <SelectItem value="en">{t('languageEn')}</SelectItem>
                      <SelectItem value="es">{t('languageEs')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('languageDesc')}
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                {t('cancel')}
              </Button>
              <Button onClick={handlePreferencesSave} disabled={loading}>
                {loading ? t('saving') : t('save')}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
