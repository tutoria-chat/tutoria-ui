'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
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
  Eye
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/shared/data-table';
import { AdminProfessorOnly, ProfessorOnly } from '@/components/auth/role-guard';
import { useAuth } from '@/components/auth/auth-provider';
import { useFetch } from '@/lib/hooks';
import { formatDateShort } from '@/lib/utils';
import type { Course, Module, Professor, Student, TableColumn, BreadcrumbItem, PaginatedResponse } from '@/lib/types';

export default function CourseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const { user } = useAuth();

  // Fetch course data from API
  const { data: course, loading: courseLoading, error: courseError } = useFetch<Course>(`/courses/${courseId}`);
  const { data: modulesResponse, loading: modulesLoading } = useFetch<PaginatedResponse<Module>>(`/modules/?course_id=${courseId}`);
  const { data: professorsResponse, loading: professorsLoading } = useFetch<PaginatedResponse<Professor>>(`/professors/?course_id=${courseId}`);

  const modules = modulesResponse?.items || [];
  const professors = professorsResponse?.items || [];

  const [activeTab, setActiveTab] = useState<'modules' | 'professors' | 'students'>('modules');

  // Check if user can add modules to this course
  const canAddModule = (): boolean => {
    // Super admins can add modules to any course
    if (user?.role === 'super_admin') {
      return true;
    }
    // Admin professors can add modules to courses in their university
    if (user?.role === 'professor' && user?.is_admin === true) {
      return true;
    }
    // Regular professors: For now, allow them to see the button
    // The module form will handle filtering courses by assignment
    if (user?.role === 'professor' && user?.is_admin === false) {
      return true;
    }
    return false;
  };

  const breadcrumbs: BreadcrumbItem[] = course?.university_id ? [
    { label: 'Universidades', href: user?.role === 'super_admin' ? '/universities' : `/universities/${course.university_id}` },
    { label: course?.university_name || 'Universidade', href: `/universities/${course.university_id}` },
    { label: course?.name || 'Carregando...', isCurrentPage: true }
  ] : [
    { label: 'Disciplinas', href: '/courses' },
    { label: course?.name || 'Carregando...', isCurrentPage: true }
  ];

  if (courseLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (courseError || !course) {
    return <div className="flex items-center justify-center h-64">Error loading course</div>;
  }

  const canEditModule = (module: Module): boolean => {
    if (user?.role === 'super_admin' || (user?.role === 'professor' && user?.is_admin === true)) {
      return true;
    }
    if (user?.role === 'professor' && user?.is_admin === false) {
      return true;
    }
    return false;
  };

  const moduleColumns: TableColumn<Module>[] = [
    {
      key: 'name',
      label: 'Módulo',
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
      key: 'files_count',
      label: 'Arquivos',
      render: (value) => (
        <div className="flex items-center space-x-1">
          <FileText className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{value || 0}</span>
        </div>
      )
    },
    {
      key: 'tokens_count',
      label: 'Tokens',
      render: (value) => (
        <Badge variant="outline">{value || 0} tokens</Badge>
      )
    },
    {
      key: 'updated_at',
      label: 'Última Atualização',
      render: (value) => formatDateShort(value as string)
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
            <Button
              variant="ghost"
              size="sm"
              asChild
            >
              <Link href={`/modules/${module.id}/edit`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      )
    }
  ];

  const professorColumns: TableColumn<Professor>[] = [
    {
      key: 'name',
      label: 'Professor',
      render: (_, professor) => (
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
            <Users className="h-4 w-4 text-green-600" />
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
      label: 'Função',
      render: (value) => (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? "Professor Administrador" : "Professor Regular"}
        </Badge>
      )
    },
    {
      key: 'courses_count',
      label: 'Total de Disciplinas',
      render: (value) => `${value || 0} disciplinas`
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={course.name}
        description={`Disciplina em ${course.university_name} • Criado em ${formatDateShort(course.created_at)}`}
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex items-center space-x-2">
            {course.university_id && (
              <Button variant="outline" asChild>
                <Link href={`/universities/${course.university_id}`}>
                  <Building2 className="mr-2 h-4 w-4" />
                  Ver Universidade
                </Link>
              </Button>
            )}

            {canAddModule() && (
              <Button variant="outline" asChild>
                <Link href={`/modules/create?course_id=${courseId}`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Módulo
                </Link>
              </Button>
            )}

            <AdminProfessorOnly>
              <Button asChild>
                <Link href={`/courses/${courseId}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar Disciplina
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
            <CardTitle>Informações da Disciplina</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Descrição</h4>
              <p className="text-sm leading-relaxed">{course.description}</p>
            </div>
            
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{course.university_name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Atualizado em {formatDateShort(course.updated_at)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{course.modules_count}</p>
                  <p className="text-sm text-muted-foreground">Módulos</p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{course.students_count}</p>
                  <p className="text-sm text-muted-foreground">Estudantes Inscritos</p>
                </div>
                <GraduationCap className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{course.professors_count}</p>
                  <p className="text-sm text-muted-foreground">Professores</p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'modules', label: 'Módulos', count: modules?.length || 0 },
            { key: 'professors', label: 'Professores', count: professors?.length || 0 },
            { key: 'students', label: 'Estudantes', count: course.students_count || 0 }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
              }`}
            >
              {tab.label}
              <Badge variant="secondary" className="ml-2">
                {tab.count}
              </Badge>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === 'modules' && (
          <Card>
            <CardHeader>
              <CardTitle>Módulos da Disciplina</CardTitle>
              <CardDescription>
                Gerencie os módulos e conteúdo de aprendizado para esta disciplina
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={modules || []}
                columns={moduleColumns}
                emptyMessage="Nenhum módulo encontrado. Adicione seu primeiro módulo para começar."
                onRowClick={(module) => router.push(`/modules/${module.id}`)}
              />
            </CardContent>
          </Card>
        )}

        {activeTab === 'professors' && (
          <Card>
            <CardHeader>
              <CardTitle>Professores Atribuídos</CardTitle>
              <CardDescription>
                Professores que estão ensinando ou gerenciando esta disciplina
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={professors || []}
                columns={professorColumns}
                emptyMessage="Nenhum professor atribuído a esta disciplina."
              />
            </CardContent>
          </Card>
        )}

        {activeTab === 'students' && (
          <Card>
            <CardHeader>
              <CardTitle>Estudantes Inscritos</CardTitle>
              <CardDescription>
                Estudantes atualmente inscritos nesta disciplina
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold">Gerenciamento de Estudantes</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  A interface de gerenciamento de estudantes será implementada aqui
                </p>
                <div className="mt-4">
                  <Button variant="outline" asChild>
                    <Link href="/students">
                      Ver Todos os Estudantes
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}