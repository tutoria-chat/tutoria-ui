'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { ModuleForm } from '@/components/forms/module-form';
import { ProfessorOnly } from '@/components/auth/role-guard';
import { apiClient } from '@/lib/api';
import type { ModuleCreate, BreadcrumbItem } from '@/lib/types';

export default function CreateModulePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('course_id');
  const [isLoading, setIsLoading] = useState(false);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Modules', href: '/modules' },
    { label: 'Create Module', isCurrentPage: true }
  ];

  const handleSubmit = async (data: ModuleCreate) => {
    setIsLoading(true);
    try {
      // Em produção, isso chamaria a API real
      console.log('Creating module:', data);
      
      // Simular criação bem-sucedida
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Redirecionar para a lista de módulos
      router.push('/modules');
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
          title="Create New Module"
          description="Create a new learning module with AI tutor configuration for your course"
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