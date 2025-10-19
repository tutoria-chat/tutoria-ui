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
import { Shield, Copy, Check, Mail, AlertCircle, Building2 } from 'lucide-react';
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
  const [resetLink, setResetLink] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [newUser, setNewUser] = useState<any>(null);
  const [universities, setUniversities] = useState<any[]>([]);
  const [loadingUniversities, setLoadingUniversities] = useState(true);
  const [passwordValidation, setPasswordValidation] = useState(validatePasswordStrength(''));

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    university_id: '',
    language_preference: 'pt-br',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const breadcrumbs: BreadcrumbItem[] = [
    { label: tCommon('breadcrumbs.professors'), href: '/professors' },
    { label: t('breadcrumbCreate'), isCurrentPage: true }
  ];

  useEffect(() => {
    const universityIdFromUrl = searchParams.get('university_id');
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
      setFormData(prev => ({ ...prev, university_id: String(university.id) }));
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
    if (!formData.first_name.trim()) newErrors.first_name = t('firstNameRequired');
    if (!formData.last_name.trim()) newErrors.last_name = t('lastNameRequired');
    if (!formData.password.trim()) newErrors.password = t('passwordRequired');
    if (formData.password.length < 6) newErrors.password = t('passwordMinLength');
    if (!formData.university_id) newErrors.university_id = t('universityRequired');

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
        ...formData,
        university_id: parseInt(formData.university_id),
        is_admin: true,
      });

      setNewUser(response);

      // Request password reset token from backend using username + user_type
      const resetResponse = await apiClient.requestPasswordReset(formData.username, 'professor');
      const resetToken = resetResponse.reset_token;
      const link = `${window.location.origin}/welcome?token=${resetToken}&username=${formData.username}`;
      setResetLink(link);

      setShowSuccess(true);
      toast.success(t('adminCreatedSuccess'));
    } catch (error: any) {
      console.error('Error creating admin professor:', error);
      toast.error(error.message || t('errorCreatingAdmin'));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(resetLink);
      setCopiedLink(true);
      toast.success(t('linkCopied'));
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      toast.error(t('errorCopyingLink'));
    }
  };

  const getUniversityName = () => {
    const university = universities.find(u => u.id === parseInt(formData.university_id));
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
                {t('successCardDescription', { firstName: newUser?.first_name, lastName: newUser?.last_name })}
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
              <CardTitle className="text-blue-900 dark:text-blue-100">{t('resetLinkTitle')}</CardTitle>
              <CardDescription className="text-blue-700 dark:text-blue-300">
                {t('resetLinkDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="text-amber-900 dark:text-amber-100">
                  <strong>{t('linkExpiresWarning')}</strong> {t('shareQuickly')}
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-blue-900 dark:text-blue-100">{t('setupLinkLabel')}</Label>
                <div className="flex space-x-2">
                  <Input
                    value={resetLink}
                    readOnly
                    className="bg-white dark:bg-blue-900 font-mono text-sm"
                  />
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    className="shrink-0"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="mr-2 h-4 w-4 text-green-600 dark:text-green-400" />
                        {t('copied')}
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        {t('copyLink')}
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-blue-900 rounded border border-blue-200 dark:border-blue-700">
                <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-2">{t('howToShare')}</p>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                  <li>{t('shareViaEmail', { email: formData.email })}</li>
                  <li>{t('shareViaMessaging')}</li>
                  <li>{t('shareInPerson')}</li>
                </ul>
              </div>
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
                first_name: '',
                last_name: '',
                password: '',
                university_id: '',
                language_preference: 'pt-br',
              });
              setResetLink('');
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
                <Label htmlFor="university_id">{t('universityLabel')}</Label>
                <Select
                  value={formData.university_id}
                  onValueChange={(value) => setFormData({ ...formData, university_id: value })}
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
                {errors.university_id && (
                  <p className="text-sm text-destructive">{errors.university_id}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">{t('firstNameLabel')}</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder={t('firstNamePlaceholder')}
                    autoComplete="off"
                  />
                  {errors.first_name && (
                    <p className="text-sm text-destructive">{errors.first_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">{t('lastNameLabel')}</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder={t('lastNamePlaceholder')}
                    autoComplete="off"
                  />
                  {errors.last_name && (
                    <p className="text-sm text-destructive">{errors.last_name}</p>
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
                <Label htmlFor="language_preference">{t('languageLabel')}</Label>
                <Select
                  value={formData.language_preference}
                  onValueChange={(value) => setFormData({ ...formData, language_preference: value })}
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
