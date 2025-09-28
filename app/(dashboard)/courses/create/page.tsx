'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { CourseForm } from '@/components/forms/course-form';
import { AdminOnly } from '@/components/auth/role-guard';
import { useAuth } from '@/components/auth/auth-provider';
import { apiClient } from '@/lib/api';
import type { CourseCreate, CourseUpdate, BreadcrumbItem } from '@/lib/types';

export default function CreateCoursePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Cursos', href: '/courses' },
    { label: 'Criar Curso', isCurrentPage: true }
  ];

  const handleSubmit = async (data: CourseCreate | CourseUpdate) => {
    setIsLoading(true);
    try {
      // Ensure we have all required fields for course creation
      const courseData: CourseCreate = {
        name: data.name || '',
        code: data.code || '',
        description: data.description,
        university_id: 'university_id' in data ? data.university_id :
                      user?.university_id || 1,
      };

      // Make POST request to courses/ endpoint
      const newCourse = await apiClient.createCourse(courseData);
      console.log('Course created successfully:', newCourse);

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