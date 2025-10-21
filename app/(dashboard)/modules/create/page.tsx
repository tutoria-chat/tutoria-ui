'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/layout/page-header';
import { ModuleForm } from '@/components/forms/module-form';
import { ProfessorOnly } from '@/components/auth/role-guard';
import { apiClient } from '@/lib/api';
import type { ModuleCreate, ModuleUpdate, BreadcrumbItem } from '@/lib/types';

export default function CreateModulePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations('modules.create');
  const tCommon = useTranslations('common');

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
        aiModelId: data.aiModelId,
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

  return (
    <ProfessorOnly>
      <div className="space-y-6">
        <PageHeader
          title={t('title')}
          description={t('description')}
          breadcrumbs={breadcrumbs}
        />

        <div className="flex justify-center">
          <ModuleForm
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