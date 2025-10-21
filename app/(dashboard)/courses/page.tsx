'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Plus, Edit, Trash2, Eye, BookOpen, Users, GraduationCap, Building2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProfessorOnly, AdminOnly } from '@/components/auth/role-guard';
import { useAuth } from '@/components/auth/auth-provider';
import { useFetch } from '@/lib/hooks';
import { formatDateShort } from '@/lib/utils';
import type { Course, TableColumn, BreadcrumbItem, PaginatedResponse } from '@/lib/types';
import { toast } from 'sonner';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';

export default function CoursesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('courses');
  const tCommon = useTranslations('common');

  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortColumn, setSortColumn] = useState<string | null>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>('asc');

  // Confirm dialog
  const { confirm, dialog } = useConfirmDialog();

  // Check for university_id from URL query parameter
  const urlUniversityId = searchParams.get('universityId');

  // Build API URL with pagination params and filters
  // Backend now handles role-based filtering:
  // - Super admins: see all courses (no filter)
  // - Admin professors: see all courses in their university (universityId filter)
  // - Regular professors: see ONLY their assigned courses (professorId filter)
  const buildApiUrl = () => {
    let filters = `page=${page}&limit=${limit}`;

    if (searchTerm) {
      filters += `&search=${encodeURIComponent(searchTerm)}`;
    }

    // If URL has universityId, use it (for navigation from university page)
    if (urlUniversityId) {
      filters += `&universityId=${urlUniversityId}`;
    }
    // Regular professor (not admin) - backend filters by professorId
    else if (user?.role === 'professor' && user.isAdmin === false && user.id) {
      filters += `&professorId=${user.id}`;
    }
    // Admin professor - backend filters by universityId
    else if (user?.universityId && user.role !== 'super_admin') {
      filters += `&universityId=${user.universityId}`;
    }
    // Super admin sees all courses (no filter)

    return `/api/courses/?${filters}`;
  };

  // API call to get courses
  const { data: coursesResponse, loading, error } = useFetch<PaginatedResponse<Course>>(buildApiUrl());

  const breadcrumbs: BreadcrumbItem[] = [
    { label: t('title'), isCurrentPage: true }
  ];

  const columns: TableColumn<Course>[] = [
    {
      key: 'name',
      label: t('columns.discipline'),
      sortable: true,
      render: (value, course) => (
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="font-medium">{course.name}</div>
            {course.description && (
              <div className="text-sm text-muted-foreground line-clamp-1 max-w-xs">
                {course.description}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'universityName',
      label: t('columns.university'),
      sortable: true,
      render: (value, course) => (
        <div className="flex items-center space-x-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{course.universityName}</span>
        </div>
      )
    },
    {
      key: 'modulesCount',
      label: t('columns.modules'),
      sortable: true,
      render: (value) => (
        <Badge variant="secondary">
          {t('columns.modulesCount', { count: value || 0 })}
        </Badge>
      )
    },
    {
      key: 'professorsCount',
      label: t('columns.professors'),
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-1">
          <Users className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{value || 0}</span>
        </div>
      )
    },
    {
      key: 'studentsCount',
      label: t('columns.students'),
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-1">
          <GraduationCap className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{value || 0}</span>
        </div>
      )
    },
    {
      key: 'createdAt',
      label: t('columns.createdAt'),
      sortable: true,
      render: (value) => formatDateShort(value as string)
    },
    {
      key: 'actions',
      label: t('columns.actions'),
      width: '120px',
      render: (_, course) => (
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            asChild
          >
            <Link href={`/courses/${course.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            asChild
          >
            <Link href={`/courses/${course.id}/edit`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>

          <AdminOnly>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(course.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </AdminOnly>
        </div>
      )
    }
  ];

  const handleDelete = async (id: number) => {
    confirm({
      title: t('deleteConfirm'),
      description: t('deleteConfirm'),
      variant: 'destructive',
      confirmText: tCommon('buttons.delete'),
      cancelText: tCommon('buttons.cancel'),
      onConfirm: async () => {
        try {
          const { apiClient } = await import('@/lib/api');
          await apiClient.deleteCourse(id);
          window.location.reload();
        } catch (error) {
          console.error('Erro ao deletar disciplina:', error);
          toast.error(t('deleteError'));
        }
      }
    });
  };

  const handleSortChange = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Get courses from API response
  const courses = coursesResponse?.items || [];
  const totalCourses = coursesResponse?.total || 0;

  // Handle API error
  if (error) {
    console.error('Error fetching courses:', error);
  }

  // Use server-side paginated data directly (API handles filtering, sorting, pagination)
  const paginatedCourses = courses;

  return (
    <ProfessorOnly>
      <div className="space-y-6">
        <PageHeader
          title={t('title')}
          description={t('descriptionSimple')}
          breadcrumbs={breadcrumbs}
          actions={
            <div className="flex items-center space-x-2">
              <Button variant="outline" asChild>
                <Link href="/modules">
                  <BookOpen className="mr-2 h-4 w-4" />
                  {t('viewModules')}
                </Link>
              </Button>
              <Button asChild>
                <Link href="/courses/create">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('createButton')}
                </Link>
              </Button>
            </div>
          }
        />

      <DataTable
        data={paginatedCourses}
        columns={columns}
        loading={loading}
        search={{
          value: searchTerm,
          placeholder: t('searchPlaceholder'),
          onSearchChange: setSearchTerm
        }}
        pagination={{
          page,
          limit,
          total: totalCourses,
          onPageChange: setPage,
          onLimitChange: setLimit
        }}
        sorting={{
          column: sortColumn,
          direction: sortDirection,
          onSortChange: handleSortChange
        }}
        emptyMessage={t('emptyMessage')}
        onRowClick={(course) => router.push(`/courses/${course.id}`)}
      />
      {dialog}
    </div>
    </ProfessorOnly>
  );
}