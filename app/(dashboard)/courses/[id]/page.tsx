'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Edit,
  Plus,
  Users,
  GraduationCap,
  BookOpen,
  FileText,
  Calendar,
  Building2,
  Activity,
  Eye,
  Trash2
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/shared/data-table';
import { Loading } from '@/components/ui/loading-spinner';
import { AdminProfessorOnly, ProfessorOnly, AdminOnly } from '@/components/auth/role-guard';
import { useAuth } from '@/components/auth/auth-provider';
import { useFetch } from '@/lib/hooks';
import { formatDateShort } from '@/lib/utils';
import type { CourseWithDetails, Module, Professor, Student, TableColumn, BreadcrumbItem, PaginatedResponse } from '@/lib/types';
import { toast } from 'sonner';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';

export default function CourseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const { user } = useAuth();
  const t = useTranslations('courses.detail');
  const tCommon = useTranslations('common');
  const tModules = useTranslations('modules');

  const [activeTab, setActiveTab] = useState<'modules' | 'professors' | 'students'>('modules');

  // OPTIMIZED: Single API call returns course + modules + students
  const { data: course, loading: courseLoading, error: courseError } = useFetch<CourseWithDetails>(`/courses/${courseId}`);

  // Fetch professors (kept on page load due to backend authorization issues with lazy loading)
  const { data: professorsResponse, loading: professorsLoading } = useFetch<PaginatedResponse<Professor>>(
    `/professors/?courseId=${courseId}`
  );

  const allModules = course?.modules || [];
  const professors = professorsResponse?.items || [];
  const [semesterFilter, setSemesterFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Confirm dialog
  const { confirm, dialog } = useConfirmDialog();

  // Filter modules
  const modules = allModules.filter(module => {
    const matchesSemester = semesterFilter === 'all' || module.semester?.toString() === semesterFilter;
    const matchesYear = yearFilter === 'all' || module.year?.toString() === yearFilter;
    const matchesSearch = !searchTerm ||
      module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSemester && matchesYear && matchesSearch;
  });

  // Get unique semesters and years for filters
  const availableSemesters = Array.from(new Set(allModules.map(m => m.semester).filter(Boolean))).sort();
  const availableYears = Array.from(new Set(allModules.map(m => m.year).filter(Boolean))).sort((a, b) => (b ?? 0) - (a ?? 0));

  // Check if user can add modules to this course
  const canAddModule = (): boolean => {
    // Super admins can add modules to any course
    if (user?.role === 'super_admin') {
      return true;
    }
    // Admin professors can add modules to courses in their university
    if (user?.role === 'professor' && user?.isAdmin === true) {
      return true;
    }
    // Regular professors: For now, allow them to see the button
    // The module form will handle filtering courses by assignment
    if (user?.role === 'professor' && user?.isAdmin === false) {
      return true;
    }
    return false;
  };

  if (courseLoading) {
    return <Loading />;
  }

  if (courseError || !course) {
    return <div className="flex items-center justify-center h-64">{tCommon('error')}</div>;
  }

  const breadcrumbs: BreadcrumbItem[] = course.universityId ? [
    { label: t('breadcrumbUniversities'), href: user?.role === 'super_admin' ? '/universities' : `/universities/${course.universityId}` },
    { label: course.universityName || 'University', href: `/universities/${course.universityId}` },
    { label: course.name, isCurrentPage: true }
  ] : [
    { label: t('breadcrumbCourses'), href: '/courses' },
    { label: course.name, isCurrentPage: true }
  ];

  const canEditModule = (module: Module): boolean => {
    if (user?.role === 'super_admin' || (user?.role === 'professor' && user?.isAdmin === true)) {
      return true;
    }
    if (user?.role === 'professor' && user?.isAdmin === false) {
      return true;
    }
    return false;
  };

  const handleDeleteModule = async (moduleId: number) => {
    confirm({
      title: tModules('deleteConfirm'),
      description: tModules('deleteConfirm'),
      variant: 'destructive',
      confirmText: tCommon('buttons.delete'),
      cancelText: tCommon('buttons.cancel'),
      onConfirm: async () => {
        try {
          const { apiClient } = await import('@/lib/api');
          await apiClient.delete(`/modules/${moduleId}`);
          window.location.reload();
        } catch (error) {
          console.error('Erro ao deletar módulo:', error);
          toast.error(tModules('deleteError'));
        }
      }
    });
  };

  const moduleColumns: TableColumn<Module>[] = [
    {
      key: 'name',
      label: t('modulesTab.title'),
      sortable: true,
      render: (value, module) => (
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <div className="font-medium">{module.name}</div>
            {module.description && (
              <div className="text-sm text-muted-foreground line-clamp-1">
                {module.description}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'semester',
      label: t('modulesTab.semesterYear'),
      sortable: true,
      render: (value, module) => (
        <Badge variant="outline">
          {module.semester}º Sem / {module.year}
        </Badge>
      )
    },
    {
      key: 'filesCount',
      label: t('modulesTab.files'),
      render: (value) => (
        <div className="flex items-center space-x-1">
          <FileText className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{value || 0}</span>
        </div>
      )
    },
    {
      key: 'tokensCount',
      label: t('modulesTab.tokens'),
      render: (value) => (
        <Badge variant="outline">{t('modulesTab.tokensCount', { count: value || 0 })}</Badge>
      )
    },
    {
      key: 'updatedAt',
      label: t('modulesTab.lastUpdate'),
      render: (value) => formatDateShort(value as string)
    },
    {
      key: 'actions',
      label: tCommon('buttons.edit'),
      width: '150px',
      render: (_, module) => (
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            asChild
          >
            <Link href={`/modules/${module.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>

          {canEditModule(module) && (
            <>
              <Button
                variant="ghost"
                size="sm"
                asChild
              >
                <Link href={`/modules/${module.id}/edit`}>
                  <Edit className="h-4 w-4" />
                </Link>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteModule(module.id);
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </>
          )}
        </div>
      )
    }
  ];

  const professorColumns: TableColumn<Professor>[] = [
    {
      key: 'name',
      label: t('professorsTab.title'),
      render: (_, professor) => (
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
            <Users className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <div className="font-medium">{professor.firstName} {professor.lastName}</div>
            <div className="text-sm text-muted-foreground">{professor.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'isAdmin',
      label: t('professorsTab.role'),
      render: (value) => (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? t('professorsTab.adminProfessor') : t('professorsTab.regularProfessor')}
        </Badge>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={course.name}
        description={`${course.universityName || t('courseInfo')} • ${t('updated', { date: formatDateShort(course.createdAt) })}`}
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex items-center space-x-2">
            {course.universityId && (
              <Button variant="outline" asChild>
                <Link href={`/universities/${course.universityId}`}>
                  <Building2 className="mr-2 h-4 w-4" />
                  {t('viewUniversity')}
                </Link>
              </Button>
            )}

            {canAddModule() && (
              <Button variant="outline" asChild>
                <Link href={`/modules/create?courseId=${courseId}`}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('addModule')}
                </Link>
              </Button>
            )}

            <AdminProfessorOnly>
              <Button asChild>
                <Link href={`/courses/${courseId}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  {t('editCourse')}
                </Link>
              </Button>
            </AdminProfessorOnly>
          </div>
        }
      />

      {/* Course Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('courseInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">{t('description')}</h4>
              <p className="text-sm leading-relaxed">{course.description}</p>
            </div>

            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{course.universityName || t('courseInfo')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{t('updated', { date: formatDateShort(course.updatedAt) })}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setActiveTab('modules')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{allModules.length}</p>
                  <p className="text-sm text-muted-foreground">{t('modules')}</p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setActiveTab('students')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{course?.students?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">{t('enrolledStudents')}</p>
                </div>
                <GraduationCap className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          {/* Professors Card - Admin only */}
          <AdminOnly>
            <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setActiveTab('professors')}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{professors.length}</p>
                    <p className="text-sm text-muted-foreground">{t('professors')}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </AdminOnly>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('modules')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'modules'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
            }`}
          >
            {t('tabs.modules')}
            <Badge variant="secondary" className="ml-2">
              {modules?.length || 0}
            </Badge>
          </button>

          <AdminOnly>
            <button
              onClick={() => setActiveTab('professors')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'professors'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
              }`}
            >
              {t('tabs.professors')}
              <Badge variant="secondary" className="ml-2">
                {professors?.length || 0}
              </Badge>
            </button>
          </AdminOnly>

          <button
            onClick={() => setActiveTab('students')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'students'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
            }`}
          >
            {t('tabs.students')}
            <Badge variant="secondary" className="ml-2">
              {course?.students?.length || 0}
            </Badge>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === 'modules' && (
          <Card>
            <CardHeader>
              <CardTitle>{t('modulesTab.title')}</CardTitle>
              <CardDescription>
                {t('modulesTab.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    placeholder={t('modulesTab.search')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
                <select
                  value={semesterFilter}
                  onChange={(e) => setSemesterFilter(e.target.value)}
                  className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="all">{t('modulesTab.allSemesters')}</option>
                  {availableSemesters.map(sem => (
                    <option key={sem} value={sem}>{t('modulesTab.semester', { num: sem || 0 })}</option>
                  ))}
                </select>
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="all">{t('modulesTab.allYears')}</option>
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <DataTable
                data={modules || []}
                columns={moduleColumns}
                emptyMessage={searchTerm || semesterFilter !== 'all' || yearFilter !== 'all'
                  ? t('modulesTab.noModules')
                  : t('modulesTab.noModulesInitial')}
                onRowClick={(module) => router.push(`/modules/${module.id}`)}
              />
            </CardContent>
          </Card>
        )}

        {/* Professors Tab - Admin only */}
        <AdminOnly>
          {activeTab === 'professors' && (
            <Card>
              <CardHeader>
                <CardTitle>{t('professorsTab.title')}</CardTitle>
                <CardDescription>
                  {t('professorsTab.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={professors || []}
                  columns={professorColumns}
                  emptyMessage={t('professorsTab.emptyMessage')}
                />
              </CardContent>
            </Card>
          )}
        </AdminOnly>

        {activeTab === 'students' && (
          <Card>
            <CardHeader>
              <CardTitle>{t('studentsTab.title')}</CardTitle>
              <CardDescription>
                {t('studentsTab.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold">{t('studentsTab.managementTitle')}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('studentsTab.managementDescription')}
                </p>
                <div className="mt-4">
                  <Button variant="outline" asChild>
                    <Link href="/students">
                      {t('studentsTab.viewAll')}
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      {dialog}
    </div>
  );
}