'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/layout/page-header';
import { AdminOnly } from '@/components/auth/role-guard';
import { apiClient } from '@/lib/api';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { Professor, ProfessorUpdate, BreadcrumbItem } from '@/lib/types';

export default function EditProfessorPage() {
  const router = useRouter();
  const params = useParams();
  const professorId = Number(params.id);
  const t = useTranslations('professors.edit');
  const tCommon = useTranslations('common');

  const [professor, setProfessor] = useState<Professor | null>(null);
  const [formData, setFormData] = useState<ProfessorUpdate>({
    email: '',
    first_name: '',
    last_name: '',
    is_admin: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const loadProfessor = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const data = await apiClient.getProfessor(professorId);
      setProfessor(data);
      setFormData({
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        is_admin: data.is_admin,
      });
    } catch (error) {
      console.error('Falha ao carregar professor:', error);
      setErrors({ load: t('loadError') });
    } finally {
      setIsLoadingData(false);
    }
  }, [professorId]);

  useEffect(() => {
    loadProfessor();
  }, [loadProfessor]);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: tCommon('breadcrumbs.professors'), href: '/professors' },
    { label: professor ? `${professor.first_name} ${professor.last_name}` : tCommon('loading'), href: `/professors/${professorId}` },
    { label: t('breadcrumb'), isCurrentPage: true }
  ];

  const handleChange = (field: keyof ProfessorUpdate, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email?.trim()) {
      newErrors.email = t('emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('emailInvalid');
    }

    if (!formData.first_name?.trim()) {
      newErrors.first_name = t('firstNameRequired');
    }

    if (!formData.last_name?.trim()) {
      newErrors.last_name = t('lastNameRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await apiClient.updateProfessor(professorId, formData);
      router.push('/professors');
    } catch (error) {
      console.error('Falha ao atualizar professor:', error);
      setErrors({ submit: t('updateError') });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (errors.load) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-destructive">{errors.load}</p>
        <Button onClick={() => router.push('/professors')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('backToProfessors')}
        </Button>
      </div>
    );
  }

  return (
    <AdminOnly>
      <div className="space-y-6">
        <PageHeader
          title={t('title')}
          description={t('description', { name: `${professor?.first_name} ${professor?.last_name}` })}
          breadcrumbs={breadcrumbs}
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>{t('professorInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">{t('firstNameLabel')}</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleChange('first_name', e.target.value)}
                  placeholder={t('firstNamePlaceholder')}
                  disabled={isLoading}
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
                  onChange={(e) => handleChange('last_name', e.target.value)}
                  placeholder={t('lastNamePlaceholder')}
                  disabled={isLoading}
                />
                {errors.last_name && (
                  <p className="text-sm text-destructive">{errors.last_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('emailLabel')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder={t('emailPlaceholder')}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="is_admin">{t('adminProfessorLabel')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('adminDescription')}
                  </p>
                </div>
                <Switch
                  id="is_admin"
                  checked={formData.is_admin}
                  onCheckedChange={(checked) => handleChange('is_admin', checked)}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          {errors.submit && (
            <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-md max-w-2xl">
              <p className="text-sm text-destructive">{errors.submit}</p>
            </div>
          )}

          <div className="flex items-center justify-end space-x-4 max-w-2xl">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/professors')}
              disabled={isLoading}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('saveChanges')}
            </Button>
          </div>
        </form>
      </div>
    </AdminOnly>
  );
}
