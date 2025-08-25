'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Eye, FileText, Bot, Key, Upload, BookOpen } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProfessorOnly } from '@/components/auth/role-guard';
import { useAuth } from '@/components/auth/auth-provider';
import type { Module, TableColumn, BreadcrumbItem } from '@/lib/types';

// Mock data - em produção viria da API baseado nas permissões do usuário
const mockModules: Module[] = [
  {
    id: 1,
    name: "Introduction to Programming",
    description: "Basic programming concepts, variables, control structures, and simple algorithms",
    course_id: 1,
    course_name: "Computer Science Fundamentals",
    university_id: 1,
    system_prompt: "You are a programming tutor helping beginners learn fundamental concepts...",
    created_at: "2024-01-20T10:00:00Z",
    updated_at: "2024-03-15T14:30:00Z",
    files_count: 8,
    tokens_count: 2
  },
  {
    id: 2,
    name: "Data Structures",
    description: "Arrays, linked lists, stacks, queues, trees, and their implementations",
    course_id: 1,
    course_name: "Computer Science Fundamentals",
    university_id: 1,
    system_prompt: "You are an expert in data structures helping students understand...",
    created_at: "2024-02-01T09:00:00Z",
    updated_at: "2024-03-10T16:45:00Z",
    files_count: 12,
    tokens_count: 3
  },
  {
    id: 3,
    name: "Web Development Basics",
    description: "HTML, CSS, JavaScript fundamentals and responsive design principles",
    course_id: 2,
    course_name: "Web Development Bootcamp",
    university_id: 1,
    system_prompt: "You are a web development mentor specializing in frontend technologies...",
    created_at: "2024-02-10T11:15:00Z",
    updated_at: "2024-03-12T09:20:00Z",
    files_count: 15,
    tokens_count: 4
  },
  {
    id: 4,
    name: "Database Design",
    description: "Relational database concepts, SQL, normalization, and query optimization",
    course_id: 2,
    course_name: "Web Development Bootcamp",
    university_id: 1,
    system_prompt: "You are a database expert helping students learn relational concepts...",
    created_at: "2024-02-15T13:30:00Z",
    updated_at: "2024-03-08T11:10:00Z",
    files_count: 10,
    tokens_count: 2
  },
  {
    id: 5,
    name: "Statistics Fundamentals",
    description: "Descriptive statistics, probability distributions, hypothesis testing",
    course_id: 3,
    course_name: "Data Science and Analytics",
    university_id: 2,
    system_prompt: "You are a statistics tutor helping students understand mathematical concepts...",
    created_at: "2024-02-20T15:45:00Z",
    updated_at: "2024-03-14T12:30:00Z",
    files_count: 18,
    tokens_count: 5
  },
  {
    id: 6,
    name: "Machine Learning Basics",
    description: "Supervised learning, regression, classification, and model evaluation",
    course_id: 3,
    course_name: "Data Science and Analytics",
    university_id: 2,
    created_at: "2024-03-01T10:20:00Z",
    updated_at: "2024-03-16T08:45:00Z",
    files_count: 22,
    tokens_count: 6
  }
];

export default function ModulesPage() {
  const { user } = useAuth();
  const [modules] = useState<Module[]>(mockModules);
  const [loading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortColumn, setSortColumn] = useState<string | null>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>('asc');

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Modules', isCurrentPage: true }
  ];

  const columns: TableColumn<Module>[] = [
    {
      key: 'name',
      label: 'Module',
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
      key: 'files_count',
      label: 'Files',
      sortable: true,
      render: (value, module) => (
        <div className="flex items-center space-x-1">
          <FileText className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{value || 0}</span>
        </div>
      )
    },
    {
      key: 'tokens_count',
      label: 'Tokens',
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-1">
          <Key className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{value || 0}</span>
        </div>
      )
    },
    {
      key: 'ai_configured',
      label: 'AI Tutor',
      render: (_, module) => (
        <div className="flex items-center space-x-1">
          <Bot className={`h-4 w-4 ${module.system_prompt ? 'text-green-500' : 'text-muted-foreground'}`} />
          <Badge variant={module.system_prompt ? "default" : "secondary"}>
            {module.system_prompt ? 'Configured' : 'Not Set'}
          </Badge>
        </div>
      )
    },
    {
      key: 'updated_at',
      label: 'Last Updated',
      sortable: true,
      render: (value) => (
        <div className="text-sm">
          {new Date(value as string).toLocaleDateString()}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '160px',
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
              asChild
            >
              <Link href={`/modules/${module.id}/files`}>
                <Upload className="h-4 w-4" />
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

  const handleDelete = (id: number) => {
    // Em produção, chamaria a API para deletar o módulo
    console.log('Delete module:', id);
  };

  const handleSortChange = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

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
    totalFiles: filteredModules.reduce((sum, module) => sum + (module.files_count || 0), 0),
    totalTokens: filteredModules.reduce((sum, module) => sum + (module.tokens_count || 0), 0),
    aiConfigured: filteredModules.filter(module => module.system_prompt).length,
    courses: [...new Set(filteredModules.map(module => module.course_name))].length
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Modules"
        description={`Manage learning modules and AI tutoring configuration. ${stats.total} modules across ${stats.courses} courses with ${stats.aiConfigured} AI tutors configured`}
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex items-center space-x-2">
            <ProfessorOnly>
              <Button variant="outline" asChild>
                <Link href="/files/upload">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Files
                </Link>
              </Button>
              
              <Button asChild>
                <Link href="/modules/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Module
                </Link>
              </Button>
            </ProfessorOnly>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total Modules</h3>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total Files</h3>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{stats.totalFiles}</div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Access Tokens</h3>
            <Key className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{stats.totalTokens}</div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">AI Tutors</h3>
            <Bot className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold">{stats.aiConfigured}</div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Courses</h3>
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
          placeholder: "Search modules, descriptions, or courses...",
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
        emptyMessage="No modules found. Create your first module to get started."
      />
    </div>
  );
}