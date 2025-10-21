'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SuperAdminOnly } from '@/components/auth/role-guard';
import { apiClient } from '@/lib/api';
import { Shield, Mail, AlertCircle } from 'lucide-react';
import type { BreadcrumbItem } from '@/lib/types';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export default function CreateSuperAdminPage() {
  const router = useRouter();
  const t = useTranslations('superAdmins.create');
  const tMain = useTranslations('superAdmins');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [newUser, setNewUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    languagePreference: 'pt-br',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const breadcrumbs: BreadcrumbItem[] = [
    { label: tMain('breadcrumb'), href: '/admin' },
    { label: tMain('title'), href: '/admin/super-admins' },
    { label: t('breadcrumbCreate'), isCurrentPage: true }
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) newErrors.username = t('usernameRequired');
    if (!formData.email.trim()) newErrors.email = t('emailRequired');
    if (!formData.firstName.trim()) newErrors.firstName = t('firstNameRequired');
    if (!formData.lastName.trim()) newErrors.lastName = t('lastNameRequired');
    if (!formData.password.trim()) newErrors.password = t('passwordRequired');
    if (formData.password.length < 6) newErrors.password = t('passwordMinLength');

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = t('emailInvalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error(t('formError'));
      return;
    }

    setLoading(true);

    try {
      // Create super admin
      const response = await apiClient.createSuperAdmin(formData);

      setNewUser(response);
      setShowSuccess(true);
      toast.success(t('createSuccess'));
    } catch (error: any) {
      console.error('Error creating super admin:', error);
      toast.error(error.message || t('createError'));
    } finally {
      setLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <SuperAdminOnly>
        <div className="space-y-6">
          <PageHeader
            title={t('titleSuccess')}
            description={t('descriptionSuccess')}
            breadcrumbs={breadcrumbs}
          />

          <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <CardHeader>
              <CardTitle className="text-green-900 dark:text-green-50 flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                ✅ {t('successTitle')}
              </CardTitle>
              <CardDescription className="text-green-700 dark:text-green-200">
                {t('successDescription', { name: `${newUser?.firstName} ${newUser?.lastName}` })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-green-900 dark:text-green-50">{t('usernameDisplay')}</Label>
                <div className="mt-1 p-2 bg-white dark:bg-green-900/50 rounded border border-green-200 dark:border-green-700">
                  <code className="text-sm text-foreground">{formData.username}</code>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-green-900 dark:text-green-50">{t('emailDisplay')}</Label>
                <div className="mt-1 p-2 bg-white dark:bg-green-900/50 rounded border border-green-200 dark:border-green-700 flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  <code className="text-sm text-foreground">{formData.email}</code>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
            <CardHeader>
              <CardTitle className="text-blue-900 dark:text-blue-50 flex items-center">
                <Mail className="mr-2 h-5 w-5" />
                {t('emailSentTitle')}
              </CardTitle>
              <CardDescription className="text-blue-700 dark:text-blue-200">
                {t('emailSentDescription', { email: formData.email })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-blue-100 dark:bg-blue-900/50 border-blue-300 dark:border-blue-700">
                <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-blue-900 dark:text-blue-100">
                  {t('emailInstructions')}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <div className="flex space-x-4">
            <Button onClick={() => router.push('/admin/super-admins')} variant="outline">
              {t('backToList')}
            </Button>
            <Button onClick={() => {
              setShowSuccess(false);
              setFormData({
                username: '',
                email: '',
                firstName: '',
                lastName: '',
                password: '',
                languagePreference: 'pt-br',
              });
              setNewUser(null);
            }}>
              {t('createAnother')}
            </Button>
          </div>
        </div>
      </SuperAdminOnly>
    );
  }

  return (
    <SuperAdminOnly>
      <div className="space-y-6">
        <PageHeader
          title={t('title')}
          description={t('description')}
          breadcrumbs={breadcrumbs}
        />

        <Alert className="border-amber-200 bg-amber-50">
          <Shield className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-900">
            <strong>⚠️ {t('securityWarning')}</strong> {t('securityMessage')}
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>{t('formTitle')}</CardTitle>
              <CardDescription>
                {t('formDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{t('firstNameLabel')}</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder={t('firstNamePlaceholder')}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-destructive">{errors.firstName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">{t('lastNameLabel')}</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder={t('lastNamePlaceholder')}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-destructive">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">{t('usernameLabel')}</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder={t('usernamePlaceholder')}
                />
                {errors.username && (
                  <p className="text-sm text-destructive">{errors.username}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  {t('usernameHint')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('emailLabel')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={t('emailPlaceholder')}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  {t('emailHint')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('passwordLabel')}</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={t('passwordPlaceholder')}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  {t('passwordHint')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="languagePreference">{t('languageLabel')}</Label>
                <Select
                  value={formData.languagePreference}
                  onValueChange={(value) => setFormData({ ...formData, languagePreference: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('languagePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-br">{t('languagePortuguese')}</SelectItem>
                    <SelectItem value="en">{t('languageEnglish')}</SelectItem>
                    <SelectItem value="es">{t('languageSpanish')}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {t('languageHint')}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex space-x-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/super-admins')}
              disabled={loading}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('submitting') : t('submit')}
            </Button>
          </div>
        </form>
      </div>
    </SuperAdminOnly>
  );
}
