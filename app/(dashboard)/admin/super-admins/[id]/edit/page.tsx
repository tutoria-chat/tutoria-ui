'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { SuperAdminOnly } from '@/components/auth/role-guard';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import type { SuperAdmin, BreadcrumbItem, UserResponse } from '@/lib/types';

export default function EditSuperAdminPage() {
  const router = useRouter();
  const params = useParams();
  const t = useTranslations('superAdmins.edit');
  const tCommon = useTranslations('superAdmins');
  const id = parseInt(params.id as string);
  const isMountedRef = useRef(true);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [superAdmin, setSuperAdmin] = useState<SuperAdmin | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const breadcrumbs: BreadcrumbItem[] = [
    { label: tCommon('breadcrumb'), href: '/admin' },
    { label: tCommon('title'), href: '/admin/super-admins' },
    { label: t('breadcrumb') || 'Edit', isCurrentPage: true }
  ];

  const loadSuperAdmin = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch user directly by ID (efficient single API call)
      const user: UserResponse = await apiClient.getUser(id);

      // Map UserResponse to SuperAdmin
      const admin: SuperAdmin = {
        id: user.user_id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login_at: user.last_login_at,
        language_preference: user.language_preference,
        theme_preference: user.theme_preference,
      };

      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setSuperAdmin(admin);
        setFormData({
          first_name: admin.first_name,
          last_name: admin.last_name,
          email: admin.email,
          username: admin.username,
        });
      }
    } catch (error: unknown) {
      console.error('Error loading super admin:', error);
      if (isMountedRef.current) {
        const errorMessage = error instanceof Error ? error.message : t('loadError') || 'Error loading super administrator';
        toast.error(errorMessage);
        router.push('/admin/super-admins');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [id, router, t]);

  useEffect(() => {
    loadSuperAdmin();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadSuperAdmin]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = t('firstNameRequired') || 'First name is required';
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = t('lastNameRequired') || 'Last name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = t('emailRequired') || 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('emailInvalid') || 'Invalid email';
    }
    if (!formData.username.trim()) {
      newErrors.username = t('usernameRequired') || 'Username is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error(t('formError') || 'Please correct the errors in the form');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.updateUser(id, formData);
      toast.success(t('updateSuccess') || 'Super administrator updated successfully!');
      router.push('/admin/super-admins');
    } catch (error: unknown) {
      console.error('Error updating super admin:', error);
      const errorMessage = error instanceof Error ? error.message : t('updateError') || 'Error updating super administrator';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (loading) {
    return (
      <SuperAdminOnly>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="xl" className="text-primary" />
        </div>
      </SuperAdminOnly>
    );
  }

  return (
    <SuperAdminOnly>
      <div className="space-y-6">
        <PageHeader
          title={t('title') || 'Edit Super Administrator'}
          description={t('description', { name: `${superAdmin?.first_name} ${superAdmin?.last_name}` }) || `Edit super administrator information for ${superAdmin?.first_name} ${superAdmin?.last_name}`}
          breadcrumbs={breadcrumbs}
          actions={
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('back') || 'Back'}
            </Button>
          }
        />

        <Card>
          <CardHeader>
            <CardTitle>{t('formTitle') || 'Super Administrator Information'}</CardTitle>
            <CardDescription>
              {t('formDescription') || 'Update the super administrator details'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">
                    {t('firstNameLabel') || 'First Name'} *
                  </Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleChange('first_name', e.target.value)}
                    placeholder={t('firstNamePlaceholder') || 'e.g., John'}
                    disabled={submitting}
                  />
                  {errors.first_name && (
                    <p className="text-sm text-destructive">{errors.first_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">
                    {t('lastNameLabel') || 'Last Name'} *
                  </Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleChange('last_name', e.target.value)}
                    placeholder={t('lastNamePlaceholder') || 'e.g., Smith'}
                    disabled={submitting}
                  />
                  {errors.last_name && (
                    <p className="text-sm text-destructive">{errors.last_name}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">
                  {t('usernameLabel') || 'Username'} *
                </Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  placeholder={t('usernamePlaceholder') || 'e.g., john.smith'}
                  disabled={submitting}
                />
                {errors.username && (
                  <p className="text-sm text-destructive">{errors.username}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  {t('emailLabel') || 'Email'} *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder={t('emailPlaceholder') || 'e.g., john.smith@university.edu'}
                  disabled={submitting}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={submitting}>
                  {submitting ? (t('updating') || 'Updating...') : (t('update') || 'Update Super Administrator')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={submitting}
                >
                  {t('cancel') || 'Cancel'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </SuperAdminOnly>
  );
}
