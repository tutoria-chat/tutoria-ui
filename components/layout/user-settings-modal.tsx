'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectItem } from '@/components/ui/select';
import { useAuth } from '@/components/auth/auth-provider';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { Settings, Sun, Globe, User, Lock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UserSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function UserSettingsModal({ open, onClose }: UserSettingsModalProps) {
  const { user } = useAuth();
  const t = useTranslations('settings');
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Profile state
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [email, setEmail] = useState(user?.email || '');
  // Readonly fields from external system (no setters needed)
  const governmentId = user?.government_id || '';
  const externalId = user?.external_id || '';
  // Editable field
  const [birthdate, setBirthdate] = useState(user?.birthdate || '');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

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

  const validatePassword = (): boolean => {
    const errors: Record<string, string> = {};

    if (!currentPassword) {
      errors.currentPassword = t('currentPasswordRequired');
    }

    if (!newPassword) {
      errors.newPassword = t('newPasswordRequired');
    } else if (newPassword.length < 8) {
      errors.newPassword = t('passwordMinLength');
    }

    if (newPassword !== confirmPassword) {
      errors.confirmPassword = t('passwordMismatch');
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordChange = async () => {
    if (!validatePassword()) return;

    setPasswordLoading(true);
    try {
      await apiClient.changePassword(currentPassword, newPassword);

      toast.success(t('passwordChangeSuccess'));

      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordErrors({});
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.message || t('passwordChangeError'));
    } finally {
      setPasswordLoading(false);
    }
  };

  const handlePreferencesSave = async () => {
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {t('profileSection')}
            </TabsTrigger>
            <TabsTrigger value="password" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              {t('passwordSection')}
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

          {/* Password Tab */}
          <TabsContent value="password" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">{t('currentPasswordLabel')}</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    if (passwordErrors.currentPassword) {
                      setPasswordErrors({ ...passwordErrors, currentPassword: '' });
                    }
                  }}
                  placeholder={t('currentPasswordPlaceholder')}
                  className={passwordErrors.currentPassword ? 'border-destructive' : ''}
                />
                {passwordErrors.currentPassword && (
                  <p className="text-xs text-destructive mt-1">{passwordErrors.currentPassword}</p>
                )}
              </div>

              <div>
                <Label htmlFor="newPassword">{t('newPasswordLabel')}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (passwordErrors.newPassword) {
                      setPasswordErrors({ ...passwordErrors, newPassword: '' });
                    }
                  }}
                  placeholder={t('newPasswordPlaceholder')}
                  className={passwordErrors.newPassword ? 'border-destructive' : ''}
                />
                {passwordErrors.newPassword && (
                  <p className="text-xs text-destructive mt-1">{passwordErrors.newPassword}</p>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword">{t('confirmPasswordLabel')}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (passwordErrors.confirmPassword) {
                      setPasswordErrors({ ...passwordErrors, confirmPassword: '' });
                    }
                  }}
                  placeholder={t('confirmPasswordPlaceholder')}
                  className={passwordErrors.confirmPassword ? 'border-destructive' : ''}
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-xs text-destructive mt-1">{passwordErrors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={onClose} disabled={passwordLoading}>
                {t('cancel')}
              </Button>
              <Button onClick={handlePasswordChange} disabled={passwordLoading}>
                {passwordLoading ? t('changingPassword') : t('changePasswordButton')}
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
