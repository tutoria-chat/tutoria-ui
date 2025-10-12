'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SuperAdminOnly } from '@/components/auth/role-guard';
import { apiClient } from '@/lib/api';
import { Shield, Copy, Check, Mail, AlertCircle } from 'lucide-react';
import type { BreadcrumbItem } from '@/lib/types';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export default function CreateSuperAdminPage() {
  const router = useRouter();
  const t = useTranslations('superAdmins.create');
  const tMain = useTranslations('superAdmins');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [resetLink, setResetLink] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [newUser, setNewUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
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
    if (!formData.first_name.trim()) newErrors.first_name = t('firstNameRequired');
    if (!formData.last_name.trim()) newErrors.last_name = t('lastNameRequired');
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

      // Generate reset link (in production, backend would return this)
      const resetToken = 'temp-token-' + Math.random().toString(36).substring(7);
      const link = `${window.location.origin}/setup-password?token=${resetToken}&username=${formData.username}`;
      setResetLink(link);

      setShowSuccess(true);
      toast.success(t('createSuccess'));
    } catch (error: any) {
      console.error('Error creating super admin:', error);
      toast.error(error.message || t('createError'));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(resetLink);
      setCopiedLink(true);
      toast.success(t('linkCopySuccess'));
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      toast.error(t('linkCopyError'));
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

          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-900 flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                ✅ {t('successTitle')}
              </CardTitle>
              <CardDescription className="text-green-700">
                {t('successDescription', { name: `${newUser?.first_name} ${newUser?.last_name}` })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-green-900">{t('usernameDisplay')}</Label>
                <div className="mt-1 p-2 bg-white rounded border border-green-200">
                  <code className="text-sm">{formData.username}</code>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-green-900">{t('emailDisplay')}</Label>
                <div className="mt-1 p-2 bg-white rounded border border-green-200 flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  <code className="text-sm">{formData.email}</code>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900">🔗 {t('resetLinkTitle')}</CardTitle>
              <CardDescription className="text-blue-700">
                {t('resetLinkDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-900">
                  <strong>⏱️ {t('resetLinkExpiry')}</strong> {t('resetLinkExpiryWarning')}
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-blue-900">{t('resetLinkLabel')}</Label>
                <div className="flex space-x-2">
                  <Input
                    value={resetLink}
                    readOnly
                    className="bg-white font-mono text-sm"
                  />
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    className="shrink-0"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="mr-2 h-4 w-4 text-green-600" />
                        {t('linkCopied')}
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

              <div className="p-4 bg-white rounded border border-blue-200">
                <p className="text-sm text-blue-900 font-medium mb-2">📋 {t('shareTitle')}</p>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>{t('shareEmail')} <strong>{formData.email}</strong></li>
                  <li>{t('shareMessaging')}</li>
                  <li>{t('shareSecure')}</li>
                </ul>
              </div>
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
                first_name: '',
                last_name: '',
                password: '',
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
                  <Label htmlFor="first_name">{t('firstNameLabel')}</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder={t('firstNamePlaceholder')}
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
