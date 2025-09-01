'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Eye, BookOpen, Users, GraduationCap, Building2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdminOnly, ProfessorOnly } from '@/components/auth/role-guard';
import { useAuth } from '@/components/auth/auth-provider';
import type { Course, TableColumn, BreadcrumbItem } from '@/lib/types';

// Mock data - em produção viria da API
const mockCourses: Course[] = [
  {
    id: 1,
    name: "Fundamentos da Ciência da Computação",
    description: "Introdução aos conceitos de programação, estruturas de dados e algoritmos",
    university_id: 1,
    university_name: "Universidade de Tecnologia",
    created_at: "2024-01-15T08:30:00Z",
    updated_at: "2024-01-15T08:30:00Z",
    modules_count: 12,
    professors_count: 3,
    students_count: 89
  },
  {
    id: 2,
    name: "Bootcamp de Desenvolvimento Web",
    description: "Desenvolvimento web full-stack usando frameworks e tecnologias modernas",
    university_id: 1,
    university_name: "Universidade de Tecnologia",
    created_at: "2024-01-20T10:15:00Z",
    updated_at: "2024-01-20T10:15:00Z",
    modules_count: 8,
    professors_count: 2,
    students_count: 67
  },
  {
    id: 3,
    name: "Ciência de Dados e Análises",
    description: "Estatísticas, aprendizado de máquina e técnicas de visualização de dados",
    university_id: 2,
    university_name: "Universidade Estadual",
    created_at: "2024-02-01T14:20:00Z",
    updated_at: "2024-02-01T14:20:00Z",
    modules_count: 15,
    professors_count: 4,
    students_count: 123
  },
  {
    id: 4,
    name: "Gestão Empresarial",
    description: "Planejamento estratégico, operações e princípios de liderança",
    university_id: 3,
    university_name: "Faculdade de Negócios",
    created_at: "2024-02-10T09:45:00Z",
    updated_at: "2024-02-10T09:45:00Z",
    modules_count: 10,
    professors_count: 2,
    students_count: 45
  },
  {
    id: 5,
    name: "Marketing Digital",
    description: "Redes sociais, SEO, marketing de conteúdo e análises",
    university_id: 3,
    university_name: "Faculdade de Negócios",
    created_at: "2024-02-15T16:30:00Z",
    updated_at: "2024-02-15T16:30:00Z",
    modules_count: 6,
    professors_count: 2,
    students_count: 34
  }
];

export default function CoursesPage() {
  const { user } = useAuth();
  const [courses] = useState<Course[]>(mockCourses);
  const [loading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortColumn, setSortColumn] = useState<string | null>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>('asc');

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Cursos', isCurrentPage: true }
  ];

  const columns: TableColumn<Course>[] = [
    {
      key: 'name',
      label: 'Curso',
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
      key: 'university_name',
      label: 'Universidade',
      sortable: true,
      render: (value, course) => (
        <div className="flex items-center space-x-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{course.university_name}</span>
        </div>
      )
    },
    {
      key: 'modules_count',
      label: 'Módulos',
      sortable: true,
      render: (value) => (
        <Badge variant="secondary">
          {value || 0} módulos
        </Badge>
      )
    },
    {
      key: 'professors_count',
      label: 'Professores',
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-1">
          <Users className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{value || 0}</span>
        </div>
      )
    },
    {
      key: 'students_count',
      label: 'Estudantes',
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-1">
          <GraduationCap className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{value || 0}</span>
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
          
          <AdminOnly>
            <Button
              variant="ghost"
              size="sm"
              asChild
            >
              <Link href={`/courses/${course.id}/edit`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
            
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

  const handleDelete = (id: number) => {
    // Em produção, chamaria a API para deletar o curso
    console.log('Delete course:', id);
  };

  const handleSortChange = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Filtrar cursos baseado na busca e permissões do usuário
  const filteredCourses = courses.filter(course => {
    // Filtro de busca
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (course.university_name && course.university_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!matchesSearch) return false;

    // Filtro por permissões
    if (user?.role === 'super_admin') return true;
    if (user?.role === 'admin_professor') return course.university_id === user.university_id;
    if (user?.role === 'regular_professor') return user.assigned_courses?.includes(course.id);
    
    return false;
  });

  // Ordenar cursos
  const sortedCourses = [...filteredCourses].sort((a, b) => {
    if (!sortColumn || !sortDirection) return 0;
    
    const aValue = a[sortColumn as keyof Course];
    const bValue = b[sortColumn as keyof Course];
    
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    const result = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    return sortDirection === 'asc' ? result : -result;
  });

  // Paginar cursos
  const startIndex = (page - 1) * limit;
  const paginatedCourses = sortedCourses.slice(startIndex, startIndex + limit);

  // Estatísticas baseadas no papel do usuário
  const stats = {
    total: filteredCourses.length,
    totalStudents: filteredCourses.reduce((sum, course) => sum + (course.students_count || 0), 0),
    totalModules: filteredCourses.reduce((sum, course) => sum + (course.modules_count || 0), 0),
    universities: [...new Set(filteredCourses.map(course => course.university_name))].length
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cursos"
        description={`Gerencie cursos e programas acadêmicos. Mostrando ${stats.total} cursos com ${stats.totalStudents} estudantes em ${stats.totalModules} módulos`}
        breadcrumbs={breadcrumbs}
        actions={
          <AdminOnly>
            <Button asChild>
              <Link href="/courses/create">
                <Plus className="mr-2 h-4 w-4" />
                Criar Curso
              </Link>
            </Button>
          </AdminOnly>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total de Cursos</h3>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total de Estudantes</h3>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{stats.totalStudents}</div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total de Módulos</h3>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{stats.totalModules}</div>
        </div>

        {user?.role === 'super_admin' && (
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Universidades</h3>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{stats.universities}</div>
          </div>
        )}
      </div>

      <DataTable
        data={paginatedCourses}
        columns={columns}
        loading={loading}
        search={{
          value: searchTerm,
          placeholder: "Buscar cursos, descrições ou universidades...",
          onSearchChange: setSearchTerm
        }}
        pagination={{
          page,
          limit,
          total: sortedCourses.length,
          onPageChange: setPage,
          onLimitChange: setLimit
        }}
        sorting={{
          column: sortColumn,
          direction: sortDirection,
          onSortChange: handleSortChange
        }}
        emptyMessage="Nenhum curso encontrado. Crie seu primeiro curso para começar."
      />
    </div>
  );
}