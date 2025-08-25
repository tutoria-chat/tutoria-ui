'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Eye, Building2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SuperAdminOnly } from '@/components/auth/role-guard';
import type { University, TableColumn, BreadcrumbItem } from '@/lib/types';

// Mock data - in real app this would come from API
const mockUniversities: University[] = [
  {
    id: 1,
    name: "University of Technology",
    description: "Leading technology university with innovative programs",
    created_at: "2024-01-15T08:30:00Z",
    updated_at: "2024-01-15T08:30:00Z",
    courses_count: 45,
    professors_count: 23,
    students_count: 892
  },
  {
    id: 2,
    name: "State University",
    description: "Public university offering comprehensive education",
    created_at: "2024-01-20T10:15:00Z",
    updated_at: "2024-01-20T10:15:00Z",
    courses_count: 67,
    professors_count: 34,
    students_count: 1245
  },
  {
    id: 3,
    name: "Business College",
    description: "Specialized business and management education",
    created_at: "2024-02-01T14:20:00Z",
    updated_at: "2024-02-01T14:20:00Z",
    courses_count: 28,
    professors_count: 18,
    students_count: 456
  }
];

export default function UniversitiesPage() {
  const [universities] = useState<University[]>(mockUniversities);
  const [loading] = useState(false);
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
      key: 'courses_count',
      label: 'Cursos',
      sortable: true,
      render: (value) => (
        <Badge variant="secondary">
          {value || 0} cursos
        </Badge>
      )
    },
    {
      key: 'professors_count',
      label: 'Professores',
      sortable: true,
      render: (value) => (
        <Badge variant="outline">
          {value || 0} professores
        </Badge>
      )
    },
    {
      key: 'students_count',
      label: 'Estudantes',
      sortable: true,
      render: (value) => (
        <Badge variant="outline">
          {value || 0} estudantes
        </Badge>
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

  const handleDelete = (id: number) => {
    // In real app, this would call the API to delete the university
    console.log('Delete university:', id);
  };

  const handleSortChange = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

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