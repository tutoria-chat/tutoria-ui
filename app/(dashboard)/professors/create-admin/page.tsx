'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SuperAdminOnly } from '@/components/auth/role-guard';
import { apiClient } from '@/lib/api';
import { Shield, Mail, AlertCircle, Building2 } from 'lucide-react';
import type { BreadcrumbItem } from '@/lib/types';
import { toast } from 'sonner';
import { validatePasswordStrength } from '@/lib/utils';

export default function CreateAdminProfessorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('professors.createAdmin');
  const tCommon = useTranslations('common');
  const tPwValidation = useTranslations('common.passwordValidation');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [newUser, setNewUser] = useState<any>(null);
  const [universities, setUniversities] = useState<any[]>([]);
  const [loadingUniversities, setLoadingUniversities] = useState(true);
  const [passwordValidation, setPasswordValidation] = useState(validatePasswordStrength(''));

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    universityId: '',
    languagePreference: 'pt-br',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const breadcrumbs: BreadcrumbItem[] = [
    { label: tCommon('breadcrumbs.professors'), href: '/professors' },
    { label: t('breadcrumbCreate'), isCurrentPage: true }
  ];

  useEffect(() => {
    const universityIdFromUrl = searchParams.get('universityId');
    if (universityIdFromUrl) {
      // If university_id in URL, load that specific university first
      loadUniversityById(parseInt(universityIdFromUrl));
    } else {
      // Otherwise load all universities
      loadUniversities();
    }
  }, [searchParams]);

  // Validate password whenever it changes
  useEffect(() => {
    setPasswordValidation(validatePasswordStrength(formData.password));
  }, [formData.password]);

  const loadUniversityById = async (universityId: number) => {
    setLoadingUniversities(true);
    try {
      const university = await apiClient.getUniversity(universityId);
      // Set the selected university and also add it to the list
      setUniversities([university]);
      setFormData(prev => ({ ...prev, universityId: String(university.id) }));
    } catch (error: any) {
      console.error('Error loading university:', error);
      toast.error(t('errorLoadingUniversities'));
      // Fallback to loading all universities
      loadUniversities();
    } finally {
      setLoadingUniversities(false);
    }
  };

  const loadUniversities = async () => {
    try {
      const data = await apiClient.getUniversities();
      // Handle paginated response
      const universities = Array.isArray(data) ? data : (data.items || []);
      setUniversities(universities);
    } catch (error: any) {
      console.error('Error loading universities:', error);
      toast.error(t('errorLoadingUniversities'));
    } finally {
      setLoadingUniversities(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) newErrors.username = t('usernameRequired');
    if (!formData.email.trim()) newErrors.email = t('emailRequired');
    if (!formData.firstName.trim()) newErrors.firstName = t('firstNameRequired');
    if (!formData.lastName.trim()) newErrors.lastName = t('lastNameRequired');
    if (!formData.password.trim()) newErrors.password = t('passwordRequired');
    if (formData.password.length < 6) newErrors.password = t('passwordMinLength');
    if (!formData.universityId) newErrors.universityId = t('universityRequired');

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
      toast.error(t('fixFormErrors'));
      return;
    }

    setLoading(true);

    try {
      // Create admin professor
      const response = await apiClient.createProfessor({
        username: formData.username,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        password: formData.password,
        universityId: parseInt(formData.universityId),
        isAdmin: true,
        languagePreference: formData.languagePreference,
      });

      setNewUser(response);
      setShowSuccess(true);
      toast.success(t('adminCreatedSuccess'));
    } catch (error: any) {
      console.error('Error creating admin professor:', error);
      toast.error(error.message || t('errorCreatingAdmin'));
    } finally {
      setLoading(false);
    }
  };

  const getUniversityName = () => {
    const university = universities.find(u => u.id === parseInt(formData.universityId));
    return university?.name || '';
  };

  if (showSuccess) {
    return (
      <SuperAdminOnly>
        <div className="space-y-6">
          <PageHeader
            title={t('successTitle')}
            description={t('successDescription')}
            breadcrumbs={breadcrumbs}
          />

          <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <CardHeader>
              <CardTitle className="text-green-900 dark:text-green-100 flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                {t('successCardTitle')}
              </CardTitle>
              <CardDescription className="text-green-700 dark:text-green-300">
                {t('successCardDescription', { firstName: newUser?.firstName, lastName: newUser?.lastName })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-green-900 dark:text-green-100">{t('usernameDisplay')}</Label>
                <div className="mt-1 p-2 bg-white dark:bg-green-900 rounded border border-green-200 dark:border-green-700">
                  <code className="text-sm">{formData.username}</code>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-green-900 dark:text-green-100">{t('emailDisplay')}</Label>
                <div className="mt-1 p-2 bg-white dark:bg-green-900 rounded border border-green-200 dark:border-green-700 flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  <code className="text-sm">{formData.email}</code>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-green-900 dark:text-green-100">{t('universityDisplay')}</Label>
                <div className="mt-1 p-2 bg-white dark:bg-green-900 rounded border border-green-200 dark:border-green-700 flex items-center">
                  <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                  <code className="text-sm">{getUniversityName()}</code>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
            <CardHeader>
              <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center">
                <Mail className="mr-2 h-5 w-5" />
                {t('emailSentTitle')}
              </CardTitle>
              <CardDescription className="text-blue-700 dark:text-blue-300">
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
            <Button onClick={() => router.push('/professors')} variant="outline">
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
                universityId: '',
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
            {t('securityWarning')}
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>{t('professorInfoTitle')}</CardTitle>
              <CardDescription>
                {t('professorInfoDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="universityId">{t('universityLabel')}</Label>
                <Select
                  value={formData.universityId}
                  onValueChange={(value) => setFormData({ ...formData, universityId: value })}
                  disabled={loadingUniversities}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingUniversities ? tCommon('loading') : t('selectUniversity')} />
                  </SelectTrigger>
                  <SelectContent>
                    {universities.map((university) => (
                      <SelectItem key={university.id} value={String(university.id)}>
                        {university.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.universityId && (
                  <p className="text-sm text-destructive">{errors.universityId}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{t('firstNameLabel')}</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder={t('firstNamePlaceholder')}
                    autoComplete="off"
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
                    autoComplete="off"
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
                  autoComplete="off"
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
                  autoComplete="off"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('tempPasswordLabel')}</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={t('passwordPlaceholder')}
                  autoComplete="new-password"
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
                {formData.password && (
                  <Alert className={passwordValidation.isValid ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950' : 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950'}>
                    <AlertCircle className={`h-4 w-4 ${passwordValidation.isValid ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`} />
                    <AlertDescription className={passwordValidation.isValid ? 'text-green-900 dark:text-green-100' : 'text-amber-900 dark:text-amber-100'}>
                      {tPwValidation(passwordValidation.messageKey)}
                    </AlertDescription>
                  </Alert>
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
              onClick={() => router.push('/professors')}
              disabled={loading}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={loading || loadingUniversities}>
              {loading ? t('creating') : t('createButton')}
            </Button>
          </div>
        </form>
      </div>
    </SuperAdminOnly>
  );
}
