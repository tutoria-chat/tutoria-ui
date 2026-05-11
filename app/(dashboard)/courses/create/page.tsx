'use client';

import React, { useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/layout/page-header';
import { CourseForm } from '@/components/forms/course-form';
import { AdminProfessorOnly } from '@/components/auth/role-guard';
import { useAuth } from '@/components/auth/auth-provider';
import { apiClient } from '@/lib/api';
import type { CourseCreate, CourseUpdate, BreadcrumbItem } from '@/lib/types';

export default function CreateCoursePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations('courses.create');
  const tCommon = useTranslations('common');

  const universityIdParam = searchParams.get('universityId');
  const initialUniversityId = universityIdParam ? Number(universityIdParam) : undefined;

  // Captured from CourseForm when the user picks professors
  const selectedProfessorIds = useRef<number[]>([]);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: tCommon('breadcrumbs.courses'), href: '/courses' },
    { label: t('createCourse'), isCurrentPage: true }
  ];

  const handleSubmit = async (data: CourseCreate | CourseUpdate) => {
    setIsLoading(true);
    try {
      const courseData: CourseCreate = {
        name: data.name || '',
        code: data.code || '',
        description: data.description,
        universityId: 'universityId' in data ? data.universityId : user?.universityId || 1,
      };

      const newCourse = await apiClient.createCourse(courseData);

      // Assign selected professors (best-effort, non-blocking)
      if (selectedProfessorIds.current.length > 0) {
        await Promise.allSettled(
          selectedProfessorIds.current.map(professorId =>
            apiClient.assignProfessorToCourse(newCourse.id, professorId)
          )
        );
      }

      router.push(`/courses/${newCourse.id}`);
    } catch (error) {
      console.error('Failed to create course:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminProfessorOnly>
      <div className="space-y-6">
        <PageHeader
          title={t('title')}
          description={t('description')}
          breadcrumbs={breadcrumbs}
        />

        <div className="flex justify-center">
          <CourseForm
            onSubmit={handleSubmit}
            onCancel={() => router.back()}
            isLoading={isLoading}
            initialUniversityId={initialUniversityId}
            onProfessorsChange={(ids) => { selectedProfessorIds.current = ids; }}
          />
        </div>
      </div>
    </AdminProfessorOnly>
  );
}
