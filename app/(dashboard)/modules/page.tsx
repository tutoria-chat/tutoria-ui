'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Plus, Edit, Trash2, Eye, Bot, Upload, BookOpen } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProfessorOnly } from '@/components/auth/role-guard';
import { useAuth } from '@/components/auth/auth-provider';
import { useFetch } from '@/lib/hooks';
import { formatDateShort } from '@/lib/utils';
import type { Module, TableColumn, BreadcrumbItem, PaginatedResponse } from '@/lib/types';
import { toast } from 'sonner';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';

export default function ModulesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('modules');
  const tCommon = useTranslations('common');

  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortColumn, setSortColumn] = useState<string | null>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>('asc');

  // Confirm dialog
  const { confirm, dialog } = useConfirmDialog();

  // Helper function to check if user can edit/delete a module
  // Note: For regular professors, the API already filters modules to show only those in assigned courses
  // So if a module appears in the list for a regular professor, they can edit it
  const canEditModule = (module: Module): boolean => {
    // Super admins and admin professors can edit all modules
    if (user?.role === 'super_admin' || (user?.role === 'professor' && user?.isAdmin === true)) {
      return true;
    }
    // Regular professors (is_admin = false) can edit modules that appear in their filtered list
    // The API ensures they only see modules from their assigned courses
    if (user?.role === 'professor' && user?.isAdmin === false) {
      return true;
    }
    return false;
  };

  // Check for university_id from URL query parameter
  const urlUniversityId = searchParams.get('universityId');

  // Build API URL with pagination params and university filter
  // Priority: URL parameter > user's university (for professors)
  const universityFilter = urlUniversityId
    ? `&universityId=${urlUniversityId}`
    : (user?.universityId && user.role !== 'super_admin' ? `&universityId=${user.universityId}` : '');
  const apiUrl = `/modules/?page=${page}&limit=${limit}${searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''}${universityFilter}`;

  // API call to get modules (paginated for display)
  const { data: modulesResponse, loading, error } = useFetch<PaginatedResponse<Module>>(apiUrl);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: t('title'), isCurrentPage: true }
  ];

  const columns: TableColumn<Module>[] = [
    {
      key: 'name',
      label: t('columns.module'),
      sortable: true,
      render: (value, module) => (
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <div className="font-medium">{module.name}</div>
            <div className="text-sm text-muted-foreground">
              {module.courseName}
            </div>
            {module.description && (
              <div className="text-xs text-muted-foreground line-clamp-1 max-w-md mt-1">
                {module.description}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'semester',
      label: t('columns.semester'),
      sortable: true,
      render: (value) => (
        <span className="text-sm font-medium">
          {value || 'N/A'}
        </span>
      )
    },
    {
      key: 'year',
      label: t('columns.year'),
      sortable: true,
      render: (value) => (
        <span className="text-sm font-medium">
          {value || 'N/A'}
        </span>
      )
    },
    {
      key: 'code',
      label: t('columns.code'),
      sortable: true,
      render: (value) => (
        <span className="text-sm font-mono text-muted-foreground">
          {value || 'N/A'}
        </span>
      )
    },
    {
      key: 'ai_configured',
      label: t('columns.aiTutor'),
      render: (_, module) => (
        <div className="flex items-center space-x-1">
          <Bot className={`h-4 w-4 ${module.systemPrompt ? 'text-green-500' : 'text-muted-foreground'}`} />
          <Badge variant={module.systemPrompt ? "default" : "secondary"}>
            {module.systemPrompt ? t('columns.configured') : t('columns.notConfigured')}
          </Badge>
        </div>
      )
    },
    {
      key: 'created_at',
      label: t('columns.createdAt'),
      sortable: true,
      render: (value) => formatDateShort(value as string)
    },
    {
      key: 'updated_at',
      label: t('columns.lastUpdate'),
      sortable: true,
      render: (value) => (
        <div className="text-sm">
          {value ? formatDateShort(value as string) : t('columns.never')}
        </div>
      )
    },
    {
      key: 'actions',
      label: t('columns.actions'),
      width: '120px',
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
                onClick={() => handleDelete(module.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </>
          )}
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
          await apiClient.deleteModule(id);
          window.location.reload();
        } catch (error) {
          console.error('Erro ao deletar módulo:', error);
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

  // Get modules from API response
  const modules = modulesResponse?.items || [];
  const totalModules = modulesResponse?.total || 0;

  // Handle API error
  if (error) {
    console.error('Error fetching modules:', error);
  }

  // Use server-side paginated data directly (API handles filtering, sorting, pagination)
  const paginatedModules = modules;

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
                <Link href="/courses">
                  <BookOpen className="mr-2 h-4 w-4" />
                  {t('viewCourses')}
                </Link>
              </Button>
              <Button asChild>
                <Link href="/modules/create">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('createButton')}
                </Link>
              </Button>
            </div>
          }
        />

      <DataTable
        data={paginatedModules}
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
          total: totalModules,
          onPageChange: setPage,
          onLimitChange: setLimit
        }}
        sorting={{
          column: sortColumn,
          direction: sortDirection,
          onSortChange: handleSortChange
        }}
        emptyMessage={t('emptyMessage')}
        onRowClick={(module) => router.push(`/modules/${module.id}`)}
      />
      {dialog}
    </div>
    </ProfessorOnly>
  );
}