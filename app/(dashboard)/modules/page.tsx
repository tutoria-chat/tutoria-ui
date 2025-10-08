'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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

export default function ModulesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortColumn, setSortColumn] = useState<string | null>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>('asc');

  // Helper function to check if user can edit/delete a module
  // Note: For regular professors, the API already filters modules to show only those in assigned courses
  // So if a module appears in the list for a regular professor, they can edit it
  const canEditModule = (module: Module): boolean => {
    // Super admins and admin professors can edit all modules
    if (user?.role === 'super_admin' || (user?.role === 'professor' && user?.is_admin === true)) {
      return true;
    }
    // Regular professors (is_admin = false) can edit modules that appear in their filtered list
    // The API ensures they only see modules from their assigned courses
    if (user?.role === 'professor' && user?.is_admin === false) {
      return true;
    }
    return false;
  };

  // Check for university_id from URL query parameter
  const urlUniversityId = searchParams.get('university_id');

  // Build API URL with pagination params and university filter
  // Priority: URL parameter > user's university (for professors)
  const universityFilter = urlUniversityId
    ? `&university_id=${urlUniversityId}`
    : (user?.university_id && user.role !== 'super_admin' ? `&university_id=${user.university_id}` : '');
  const apiUrl = `/modules/?page=${page}&limit=${limit}${searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''}${universityFilter}`;

  // API call to get modules
  const { data: modulesResponse, loading, error } = useFetch<PaginatedResponse<Module>>(apiUrl);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Módulos', isCurrentPage: true }
  ];

  const columns: TableColumn<Module>[] = [
    {
      key: 'name',
      label: 'Módulo',
      sortable: true,
      render: (value, module) => (
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <div className="font-medium">{module.name}</div>
            <div className="text-sm text-muted-foreground">
              {module.course_name}
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
      label: 'Semestre',
      sortable: true,
      render: (value) => (
        <span className="text-sm font-medium">
          {value || 'N/A'}
        </span>
      )
    },
    {
      key: 'year',
      label: 'Ano',
      sortable: true,
      render: (value) => (
        <span className="text-sm font-medium">
          {value || 'N/A'}
        </span>
      )
    },
    {
      key: 'code',
      label: 'Código',
      sortable: true,
      render: (value) => (
        <span className="text-sm font-mono text-muted-foreground">
          {value || 'N/A'}
        </span>
      )
    },
    {
      key: 'ai_configured',
      label: 'Tutor IA',
      render: (_, module) => (
        <div className="flex items-center space-x-1">
          <Bot className={`h-4 w-4 ${module.system_prompt ? 'text-green-500' : 'text-muted-foreground'}`} />
          <Badge variant={module.system_prompt ? "default" : "secondary"}>
            {module.system_prompt ? 'Configurado' : 'Não Definido'}
          </Badge>
        </div>
      )
    },
    {
      key: 'created_at',
      label: 'Criado em',
      sortable: true,
      render: (value) => formatDateShort(value as string)
    },
    {
      key: 'updated_at',
      label: 'Última Atualização',
      sortable: true,
      render: (value) => (
        <div className="text-sm">
          {value ? formatDateShort(value as string) : 'Nunca'}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Ações',
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
    if (!confirm('Tem certeza que deseja deletar este módulo? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const { apiClient } = await import('@/lib/api');
      await apiClient.deleteModule(id);
      window.location.reload();
    } catch (error) {
      console.error('Erro ao deletar módulo:', error);
      alert('Erro ao deletar módulo. Tente novamente.');
    }
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

  // Estatísticas - calculate from current page data
  const stats = {
    total: totalModules,
    aiConfigured: modules.filter(module => module.system_prompt).length,
    courses: [...new Set(modules.map(module => module.course_name))].length
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Módulos"
        description={`Gerencie módulos de aprendizado e configuração de tutores IA. ${stats.total} módulos em ${stats.courses} disciplinas com ${stats.aiConfigured} tutores IA configurados`}
        breadcrumbs={breadcrumbs}
        actions={
          <ProfessorOnly>
            <div className="flex items-center space-x-2">
              <Button variant="outline" asChild>
                <Link href="/courses">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Ver Disciplinas
                </Link>
              </Button>
              <Button asChild>
                <Link href="/modules/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Módulo
                </Link>
              </Button>
            </div>
          </ProfessorOnly>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total de Módulos</h3>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>



        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Tutores IA</h3>
            <Bot className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold">{stats.aiConfigured}</div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Disciplinas</h3>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{stats.courses}</div>
        </div>
      </div>

      <DataTable
        data={paginatedModules}
        columns={columns}
        loading={loading}
        search={{
          value: searchTerm,
          placeholder: "Buscar módulos, descrições ou disciplinas...",
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
        emptyMessage="Nenhum módulo encontrado. Crie seu primeiro módulo para começar."
        onRowClick={(module) => router.push(`/modules/${module.id}`)}
      />
    </div>
  );
}