'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { ProfessorOnly } from '@/components/auth/role-guard';
import { apiClient } from '@/lib/api';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { ModuleFormStepped } from '@/components/forms/module-form-stepped';
import type { Module, ModuleUpdate, BreadcrumbItem } from '@/lib/types';

export default function EditModulePage() {
  const router = useRouter();
  const params = useParams();
  const moduleId = Number(params.id);
  const t = useTranslations('modules.edit');
  const tCommon = useTranslations('common');

  const [module, setModule] = useState<Module | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadModule = useCallback(async () => {
    setIsLoadingData(true);
    setLoadError(null);
    try {
      const data = await apiClient.getModule(moduleId);
      setModule(data);
    } catch (error) {
      console.error('Failed to load module:', error);
      setLoadError(t('loadError'));
    } finally {
      setIsLoadingData(false);
    }
  }, [moduleId, t]);

  useEffect(() => {
    loadModule();
  }, [loadModule]);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: tCommon('breadcrumbs.modules'), href: '/modules' },
    { label: module?.name || tCommon('loading'), href: `/modules/${moduleId}` },
    { label: tCommon('buttons.edit'), isCurrentPage: true }
  ];

  const handleSubmit = async (data: ModuleUpdate) => {
    setIsLoading(true);
    try {
      await apiClient.updateModule(moduleId, {
        name: data.name,
        code: data.code,
        description: data.description,
        systemPrompt: data.systemPrompt,
        tutorLanguage: data.tutorLanguage,
        semester: data.semester,
        year: data.year,
        courseType: data.courseType,
      });
      toast.success(t('updateSuccess'), {
        description: t('updateSuccessDesc'),
      });
      router.push(`/modules/${moduleId}`);
    } catch (error) {
      console.error('Failed to update module:', error);
      throw error; // Let ModuleFormStepped handle the error
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoadingData) {
    return (
      <ProfessorOnly>
        <div className="space-y-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </ProfessorOnly>
    );
  }

  if (loadError || !module) {
    return (
      <ProfessorOnly>
        <div className="space-y-6">
          <PageHeader
            title={tCommon('error')}
            description={t('loadErrorDesc')}
            breadcrumbs={breadcrumbs}
          />
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <p className="text-destructive">{loadError}</p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {tCommon('buttons.back')}
            </Button>
          </div>
        </div>
      </ProfessorOnly>
    );
  }

  return (
    <ProfessorOnly>
      <div className="space-y-6">
        <PageHeader
          title={t('title')}
          description={t('description', { name: module.name })}
          breadcrumbs={breadcrumbs}
          actions={
            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {tCommon('buttons.back')}
            </Button>
          }
        />

        <div className="flex justify-center">
          <ModuleFormStepped
            module={module}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        </div>
      </div>
    </ProfessorOnly>
  );
}
