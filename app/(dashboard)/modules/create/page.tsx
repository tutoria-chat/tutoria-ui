'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/layout/page-header';
import { ModuleFormStepped } from '@/components/forms/module-form-stepped';
import { ProfessorOnly } from '@/components/auth/role-guard';
import { apiClient } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { ModuleCreate, ModuleUpdate, BreadcrumbItem, Course } from '@/lib/types';

export default function CreateModulePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');
  const [isLoading, setIsLoading] = useState(false);
  const [courseLoading, setCourseLoading] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const t = useTranslations('modules.create');
  const tCommon = useTranslations('common');

  useEffect(() => {
    if (courseId) {
      setCourseLoading(true);
      apiClient.get<Course>(`/api/courses/${courseId}`)
        .then(setCourse)
        .catch(error => console.error('Failed to fetch course:', error))
        .finally(() => setCourseLoading(false));
    }
  }, [courseId]);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: tCommon('breadcrumbs.modules'), href: '/modules' },
    { label: t('createModule'), isCurrentPage: true }
  ];

  const handleSubmit = async (data: ModuleCreate | ModuleUpdate) => {
    setIsLoading(true);
    try {
      // Criar módulo via API
      const newModule = await apiClient.post<{ id: number }>('/api/modules/', {
        name: data.name,
        code: data.code,
        systemPrompt: data.systemPrompt,
        semester: data.semester,
        year: data.year,
        courseId: data.courseId,
        description: data.description,
        courseType: data.courseType,
        tutorLanguage: data.tutorLanguage
      });

      // Redirecionar para a página de detalhes do módulo para upload de arquivos
      router.push(`/modules/${newModule.id}`);
    } catch (error) {
      console.error('Failed to create module:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (courseLoading) {
    return (
      <ProfessorOnly>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="xl" className="text-primary" />
        </div>
      </ProfessorOnly>
    );
  }

  return (
    <ProfessorOnly>
      <div className="space-y-6">
        <PageHeader
          title={t('title')}
          description={course ? `${course.name}${course.code ? ` (${course.code})` : ''}` : t('description')}
          breadcrumbs={breadcrumbs}
        />

        <div className="flex justify-center">
          <ModuleFormStepped
            courseId={courseId ? Number(courseId) : undefined}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        </div>
      </div>
    </ProfessorOnly>
  );
}