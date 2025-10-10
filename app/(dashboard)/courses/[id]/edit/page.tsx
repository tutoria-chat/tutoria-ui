'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { AdminProfessorOnly } from '@/components/auth/role-guard';
import { apiClient } from '@/lib/api';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { Course, CourseUpdate, BreadcrumbItem } from '@/lib/types';

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = Number(params.id);
  const t = useTranslations('courses.edit');
  const tForm = useTranslations('courses.form');
  const tCommon = useTranslations('common');

  const [course, setCourse] = useState<Course | null>(null);
  const [originalFormData, setOriginalFormData] = useState<CourseUpdate>({
    name: '',
    code: '',
    description: '',
  });
  const [formData, setFormData] = useState<CourseUpdate>({
    name: '',
    code: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Check if form has changes
  const hasChanges = () => {
    return (
      formData.name !== originalFormData.name ||
      formData.code !== originalFormData.code ||
      formData.description !== originalFormData.description
    );
  };

  const loadCourse = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const data = await apiClient.getCourse(courseId);
      setCourse(data);
      const initialData = {
        name: data.name,
        code: data.code,
        description: data.description || '',
      };
      setFormData(initialData);
      setOriginalFormData(initialData);
    } catch (error) {
      console.error('Failed to load course:', error);
      setErrors({ load: t('loadError') });
    } finally {
      setIsLoadingData(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: tCommon('breadcrumbs.courses'), href: '/courses' },
    { label: course?.name || tCommon('loading'), href: `/courses/${courseId}` },
    { label: tCommon('buttons.edit'), isCurrentPage: true }
  ];

  const handleChange = (field: keyof CourseUpdate, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = tForm('nameRequired');
    }

    if (!formData.code?.trim()) {
      newErrors.code = tForm('codeRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.updateCourse(courseId, formData);
      router.push(`/courses/${courseId}`);
    } catch (error) {
      console.error('Failed to update course:', error);
      setErrors({ submit: t('updateError') });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <AdminProfessorOnly>
        <div className="space-y-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </AdminProfessorOnly>
    );
  }

  if (errors.load) {
    return (
      <AdminProfessorOnly>
        <div className="space-y-6">
          <PageHeader
            title={tCommon('error')}
            description={t('loadErrorDesc')}
            breadcrumbs={breadcrumbs}
          />
          <Card>
            <CardContent className="pt-6">
              <p className="text-destructive">{errors.load}</p>
              <Button onClick={() => router.back()} className="mt-4">
                {t('back')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </AdminProfessorOnly>
    );
  }

  return (
    <AdminProfessorOnly>
      <div className="space-y-6">
        <PageHeader
          title={t('title')}
          description={t('description', { name: course?.name || '' })}
          breadcrumbs={breadcrumbs}
          actions={
            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('back')}
            </Button>
          }
        />

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>{t('courseInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  {t('nameLabel')}
                </label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder={t('namePlaceholder')}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-destructive mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="code" className="block text-sm font-medium mb-1">
                  {t('codeLabel')}
                </label>
                <Input
                  id="code"
                  type="text"
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value)}
                  placeholder={t('codePlaceholder')}
                  className={errors.code ? 'border-destructive' : ''}
                />
                {errors.code && (
                  <p className="text-sm text-destructive mt-1">{errors.code}</p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1">
                  {t('descriptionLabel')}
                </label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder={t('descriptionPlaceholder')}
                  rows={4}
                />
              </div>

              {errors.submit && (
                <p className="text-sm text-destructive">{errors.submit}</p>
              )}

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={isLoading || !hasChanges()}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('saveChanges')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
                >
                  {t('cancel')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminProfessorOnly>
  );
}