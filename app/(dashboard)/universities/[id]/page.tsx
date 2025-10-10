'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Edit,
  Plus,
  Users,
  BookOpen,
  Building2,
  GraduationCap,
  Folder,
  Trash2
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/shared/data-table';
import { Loading } from '@/components/ui/loading-spinner';
import { AdminOnly, ProfessorOnly, SuperAdminOnly } from '@/components/auth/role-guard';
import { useAuth } from '@/components/auth/auth-provider';
import { useFetch } from '@/lib/hooks';
import { formatDateShort } from '@/lib/utils';
import type { University, Course, Professor, TableColumn, BreadcrumbItem, PaginatedResponse } from '@/lib/types';

export default function UniversityDetailsPage() {
  const params = useParams();
  const { user } = useAuth();
  const universityId = params.id as string;
  const t = useTranslations('universities.detail');

  // For professors, ensure they can only access their own university
  React.useEffect(() => {
    if (user && user.role !== 'super_admin' && user.university_id) {
      if (Number(universityId) !== user.university_id) {
        // Redirect to their own university if they try to access another
        window.location.href = `/universities/${user.university_id}`;
      }
    }
  }, [user, universityId]);

  const { data: university, loading: universityLoading } = useFetch<University>(`/universities/${universityId}`);
  const { data: coursesResponse, loading: coursesLoading } = useFetch<PaginatedResponse<Course>>(`/courses/?university_id=${universityId}&limit=100`);
  const { data: professorsResponse, loading: professorsLoading } = useFetch<PaginatedResponse<Professor>>(`/professors/?university_id=${universityId}&limit=100`);

  const courses = coursesResponse?.items || [];
  const professors = professorsResponse?.items || [];

  const [activeTab, setActiveTab] = useState<'courses' | 'professors'>('courses');

  const tCommon = useTranslations('common');

  const breadcrumbs: BreadcrumbItem[] = [
    { label: t('breadcrumb'), href: '/universities' },
    { label: university?.name || tCommon('loading'), isCurrentPage: true }
  ];

  const courseColumns: TableColumn<Course>[] = [
    {
      key: 'name',
      label: t('courseColumns.name'),
      sortable: true,
      render: (value, course) => (
        <Link href={`/courses/${course.id}`} className="hover:underline">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="font-medium">{course.name}</div>
              {course.code && (
                <div className="text-sm text-muted-foreground">{course.code}</div>
              )}
            </div>
          </div>
        </Link>
      )
    },
    {
      key: 'modules_count',
      label: t('courseColumns.modules'),
      render: (value) => (
        <Badge variant="outline">{t('courseColumns.modulesCount', { count: value || 0 })}</Badge>
      )
    },
    {
      key: 'professors_count',
      label: t('courseColumns.professors'),
      render: (value) => (
        <Badge variant="outline">{t('courseColumns.professorsCount', { count: value || 0 })}</Badge>
      )
    },
    {
      key: 'created_at',
      label: t('courseColumns.createdAt'),
      sortable: true,
      render: (value) => formatDateShort(value as string)
    },
    {
      key: 'actions',
      label: t('courseColumns.actions'),
      width: '120px',
      render: (_, course) => (
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/courses/${course.id}`}>
              <Folder className="h-4 w-4" />
            </Link>
          </Button>
          <AdminOnly>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/courses/${course.id}/edit`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteCourse(course.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </AdminOnly>
        </div>
      )
    }
  ];

  const professorColumns: TableColumn<Professor>[] = [
    {
      key: 'first_name',
      label: t('professorColumns.name'),
      sortable: true,
      render: (_, professor) => (
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="font-medium">{professor.first_name} {professor.last_name}</div>
            <div className="text-sm text-muted-foreground">{professor.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'is_admin',
      label: t('professorColumns.type'),
      render: (value) => (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? t('professorColumns.admin') : t('professorColumns.professor')}
        </Badge>
      )
    },
    {
      key: 'courses_count',
      label: t('professorColumns.courses'),
      render: (value) => (
        <span className="text-sm">{t('professorColumns.coursesCount', { count: value || 0 })}</span>
      )
    }
  ];

  const handleDeleteCourse = async (id: number) => {
    if (!confirm(t('deleteConfirm'))) {
      return;
    }

    try {
      const { apiClient } = await import('@/lib/api');
      await apiClient.deleteCourse(id);
      window.location.reload();
    } catch (error) {
      console.error('Erro ao deletar disciplina:', error);
      alert(t('deleteError'));
    }
  };

  if (universityLoading) {
    return <Loading />;
  }

  if (!university) {
    return <div>{t('notFound')}</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={university.name}
        description={university.description || `Universidade ${university.code}`}
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex items-center space-x-2">
            <SuperAdminOnly>
              <Button variant="outline" asChild>
                <Link href={`/universities/${universityId}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  {t('edit')}
                </Link>
              </Button>
            </SuperAdminOnly>
          </div>
        }
      />

      {/* University Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.courses')}</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.professors')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{professors.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.code')}</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{university.code}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b">
        <button
          onClick={() => setActiveTab('courses')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'courses'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <BookOpen className="inline-block mr-2 h-4 w-4" />
          {t('tabs.courses')}
        </button>
        <button
          onClick={() => setActiveTab('professors')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'professors'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="inline-block mr-2 h-4 w-4" />
          {t('tabs.professors')}
        </button>
      </div>

      {/* Courses Tab */}
      {activeTab === 'courses' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('coursesTab.title')}</CardTitle>
                <CardDescription>
                  {t('coursesTab.description')}
                </CardDescription>
              </div>
              <AdminOnly>
                <Button asChild>
                  <Link href={`/courses/create?university_id=${universityId}`}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('coursesTab.newCourse')}
                  </Link>
                </Button>
              </AdminOnly>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              data={courses}
              columns={courseColumns}
              loading={coursesLoading}
              emptyMessage={t('coursesTab.emptyMessage')}
            />
          </CardContent>
        </Card>
      )}

      {/* Professors Tab */}
      {activeTab === 'professors' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('professorsTab.title')}</CardTitle>
                <CardDescription>
                  {t('professorsTab.description')}
                </CardDescription>
              </div>
              <AdminOnly>
                <Button asChild>
                  <Link href={`/professors/create?university_id=${universityId}`}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('professorsTab.newProfessor')}
                  </Link>
                </Button>
              </AdminOnly>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              data={professors}
              columns={professorColumns}
              loading={professorsLoading}
              emptyMessage={t('professorsTab.emptyMessage')}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
