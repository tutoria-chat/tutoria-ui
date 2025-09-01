'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { CourseForm } from '@/components/forms/course-form';
import { AdminOnly } from '@/components/auth/role-guard';
import { apiClient } from '@/lib/api';
import type { CourseCreate, BreadcrumbItem } from '@/lib/types';

export default function CreateCoursePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Cursos', href: '/courses' },
    { label: 'Criar Curso', isCurrentPage: true }
  ];

  const handleSubmit = async (data: CourseCreate) => {
    setIsLoading(true);
    try {
      // Em produção, isso chamaria a API real
      console.log('Creating course:', data);
      
      // Simular criação bem-sucedida
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirecionar para a lista de cursos
      router.push('/courses');
    } catch (error) {
      console.error('Failed to create course:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <AdminOnly>
      <div className="space-y-6">
        <PageHeader
          title="Criar Novo Curso"
          description="Adicione um novo curso ao catálogo acadêmico da sua universidade"
          breadcrumbs={breadcrumbs}
        />

        <div className="flex justify-center">
          <CourseForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        </div>
      </div>
    </AdminOnly>
  );
}