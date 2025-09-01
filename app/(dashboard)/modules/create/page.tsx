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
    { label: 'Módulos', href: '/modules' },
    { label: 'Criar Módulo', isCurrentPage: true }
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
          title="Criar Novo Módulo"
          description="Crie um novo módulo de aprendizado com configuração de tutor IA para seu curso"
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