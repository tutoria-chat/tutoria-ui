'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Eye, Bot, Upload, BookOpen } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProfessorOnly } from '@/components/auth/role-guard';
import { useAuth } from '@/components/auth/auth-provider';
import { useFetch } from '@/lib/hooks';
import type { Module, TableColumn, BreadcrumbItem, PaginatedResponse } from '@/lib/types';

export default function ModulesPage() {
  const { user } = useAuth();

  // API call to get modules
  const { data: modulesResponse, loading, error } = useFetch<PaginatedResponse<Module>>('/modules/');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortColumn, setSortColumn] = useState<string | null>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>('asc');

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
      render: (value) => new Date(value as string).toLocaleDateString()
    },
    {
      key: 'updated_at',
      label: 'Última Atualização',
      sortable: true,
      render: (value) => (
        <div className="text-sm">
          {new Date(value as string).toLocaleDateString()}
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

          <ProfessorOnly>
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
          </ProfessorOnly>
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

  // Handle API error
  if (error) {
    console.error('Error fetching modules:', error);
  }

  // Filtrar módulos baseado na busca e permissões do usuário
  const filteredModules = modules.filter(module => {
    // Filtro de busca
    const matchesSearch = module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (module.description && module.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (module.course_name && module.course_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!matchesSearch) return false;

    // Filtro por permissões
    if (user?.role === 'super_admin') return true;
    if (user?.role === 'admin_professor') return module.university_id === user.university_id;
    if (user?.role === 'regular_professor') return user.assigned_courses?.some(courseId => 
      // Em produção, isso seria baseado nos cursos reais do módulo
      [1, 2, 3].includes(courseId)
    );
    
    return false;
  });

  // Ordenar módulos
  const sortedModules = [...filteredModules].sort((a, b) => {
    if (!sortColumn || !sortDirection) return 0;
    
    const aValue = a[sortColumn as keyof Module];
    const bValue = b[sortColumn as keyof Module];
    
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    const result = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    return sortDirection === 'asc' ? result : -result;
  });

  // Paginar módulos
  const startIndex = (page - 1) * limit;
  const paginatedModules = sortedModules.slice(startIndex, startIndex + limit);

  // Estatísticas
  const stats = {
    total: filteredModules.length,
    aiConfigured: filteredModules.filter(module => module.system_prompt).length,
    courses: [...new Set(filteredModules.map(module => module.course_name))].length
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Módulos"
        description={`Gerencie módulos de aprendizado e configuração de tutores IA. ${stats.total} módulos em ${stats.courses} cursos com ${stats.aiConfigured} tutores IA configurados`}
        breadcrumbs={breadcrumbs}
        actions={
          <ProfessorOnly>
            <Button asChild>
              <Link href="/modules/create">
                <Plus className="mr-2 h-4 w-4" />
                Criar Módulo
              </Link>
            </Button>
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
            <h3 className="tracking-tight text-sm font-medium">Cursos</h3>
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
          placeholder: "Buscar módulos, descrições ou cursos...",
          onSearchChange: setSearchTerm
        }}
        pagination={{
          page,
          limit,
          total: sortedModules.length,
          onPageChange: setPage,
          onLimitChange: setLimit
        }}
        sorting={{
          column: sortColumn,
          direction: sortDirection,
          onSortChange: handleSortChange
        }}
        emptyMessage="Nenhum módulo encontrado. Crie seu primeiro módulo para começar."
      />
    </div>
  );
}