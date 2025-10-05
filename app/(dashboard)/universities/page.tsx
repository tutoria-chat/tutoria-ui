'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Eye, Building2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { SuperAdminOnly } from '@/components/auth/role-guard';
import { useFetch } from '@/lib/hooks';
import type { University, TableColumn, BreadcrumbItem, PaginatedResponse } from '@/lib/types';

export default function UniversitiesPage() {
  // API call to get universities
  const { data: universitiesResponse, loading, error, refetch } = useFetch<PaginatedResponse<University>>('/universities/');

  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortColumn, setSortColumn] = useState<string | null>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>('asc');

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Universidades', isCurrentPage: true }
  ];

  const columns: TableColumn<University>[] = [
    {
      key: 'name',
      label: 'Nome da Universidade',
      sortable: true,
      render: (value, university) => (
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="font-medium">{university.name}</div>
            {university.description && (
              <div className="text-sm text-muted-foreground truncate max-w-xs">
                {university.description}
              </div>
            )}
          </div>
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
      key: 'actions',
      label: 'Ações',
      width: '120px',
      render: (_, university) => (
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            asChild
          >
            <Link href={`/universities/${university.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          
          <SuperAdminOnly>
            <Button
              variant="ghost"
              size="sm"
              asChild
            >
              <Link href={`/universities/${university.id}/edit`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(university.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </SuperAdminOnly>
        </div>
      )
    }
  ];

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar esta universidade? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const { apiClient } = await import('@/lib/api');
      await apiClient.deleteUniversity(id);
      window.location.reload();
    } catch (error) {
      console.error('Erro ao deletar universidade:', error);
      alert('Erro ao deletar universidade. Tente novamente.');
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

  // Get universities from API response
  const universities = universitiesResponse?.items || [];

  // Handle API error
  if (error) {
    console.error('Error fetching universities:', error);
  }

  // Filter universities based on search term
  const filteredUniversities = universities.filter(university =>
    university.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (university.description && university.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Sort universities
  const sortedUniversities = [...filteredUniversities].sort((a, b) => {
    if (!sortColumn || !sortDirection) return 0;
    
    const aValue = a[sortColumn as keyof University];
    const bValue = b[sortColumn as keyof University];
    
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    const result = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    return sortDirection === 'asc' ? result : -result;
  });

  // Paginate universities
  const startIndex = (page - 1) * limit;
  const paginatedUniversities = sortedUniversities.slice(startIndex, startIndex + limit);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Universidades"
        description="Gerencie universidades e seus programas acadêmicos"
        breadcrumbs={breadcrumbs}
        actions={
          <SuperAdminOnly>
            <Button asChild>
              <Link href="/universities/create">
                <Plus className="mr-2 h-4 w-4" />
                Criar Universidade
              </Link>
            </Button>
          </SuperAdminOnly>
        }
      />

      <DataTable
        data={paginatedUniversities}
        columns={columns}
        loading={loading}
        search={{
          value: searchTerm,
          placeholder: "Buscar universidades...",
          onSearchChange: setSearchTerm
        }}
        pagination={{
          page,
          limit,
          total: sortedUniversities.length,
          onPageChange: setPage,
          onLimitChange: setLimit
        }}
        sorting={{
          column: sortColumn,
          direction: sortDirection,
          onSortChange: handleSortChange
        }}
        emptyMessage="Nenhuma universidade encontrada"
      />
    </div>
  );
}