'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  Edit, 
  Plus, 
  Users, 
  GraduationCap, 
  BookOpen, 
  FileText,
  Calendar,
  Building2,
  Activity
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/shared/data-table';
import { AdminOnly, ProfessorOnly } from '@/components/auth/role-guard';
import type { Course, Module, Professor, Student, TableColumn, BreadcrumbItem } from '@/lib/types';

// Mock data - em produção viria da API
const mockCourse: Course = {
  id: 1,
  name: "Fundamentos da Ciência da Computação",
  code: "CS101",
  description: "Este curso abrangente apresenta aos estudantes os conceitos fundamentais da ciência da computação, incluindo princípios de programação, estruturas de dados, algoritmos e práticas de engenharia de software. Os estudantes terão experiência prática com linguagens de programação modernas e ferramentas de desenvolvimento.",
  university_id: 1,
  university_name: "Universidade de Tecnologia",
  created_at: "2024-01-15T08:30:00Z",
  updated_at: "2024-03-10T14:20:00Z",
  modules_count: 12,
  professors_count: 3,
  students_count: 89
};

const mockModules: Module[] = [
  {
    id: 1,
    name: "Introdução à Programação",
    description: "Conceitos básicos de programação e sintaxe",
    course_id: 1,
    course_name: "Fundamentos da Ciência da Computação",
    created_at: "2024-01-20T10:00:00Z",
    updated_at: "2024-01-20T10:00:00Z",
    files_count: 8,
    tokens_count: 2
  },
  {
    id: 2,
    name: "Estruturas de Dados",
    description: "Arrays, listas ligadas, árvores e grafos",
    course_id: 1,
    course_name: "Fundamentos da Ciência da Computação",
    created_at: "2024-02-01T09:00:00Z",
    updated_at: "2024-02-01T09:00:00Z",
    files_count: 12,
    tokens_count: 3
  },
  {
    id: 3,
    name: "Algoritmos e Complexidade",
    description: "Ordenação, busca e análise de algoritmos",
    course_id: 1,
    course_name: "Fundamentos da Ciência da Computação",
    created_at: "2024-02-15T11:00:00Z",
    updated_at: "2024-02-15T11:00:00Z",
    files_count: 15,
    tokens_count: 4
  }
];

const mockProfessors: Professor[] = [
  {
    id: 1,
    email: "joao.silva@universidade.edu.br",
    first_name: "João",
    last_name: "Silva",
    university_id: 1,
    university_name: "Universidade de Tecnologia",
    is_admin: true,
    created_at: "2024-01-10T08:00:00Z",
    updated_at: "2024-01-10T08:00:00Z",
    courses_count: 3
  },
  {
    id: 2,
    email: "maria.santos@universidade.edu.br",
    first_name: "Maria",
    last_name: "Santos",
    university_id: 1,
    university_name: "Universidade de Tecnologia",
    is_admin: false,
    created_at: "2024-01-12T09:00:00Z",
    updated_at: "2024-01-12T09:00:00Z",
    courses_count: 2
  }
];

export default function CourseDetailsPage() {
  const params = useParams();
  const courseId = params.id as string;
  
  const [course] = useState<Course>(mockCourse);
  const [modules] = useState<Module[]>(mockModules);
  const [professors] = useState<Professor[]>(mockProfessors);
  const [activeTab, setActiveTab] = useState<'modules' | 'professors' | 'students'>('modules');

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Cursos', href: '/courses' },
    { label: course.name, isCurrentPage: true }
  ];

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
      render: (value) => new Date(value as string).toLocaleDateString()
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
      label: 'Total de Cursos',
      render: (value) => `${value || 0} cursos`
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={course.name}
        description={`Curso em ${course.university_name} • Criado em ${new Date(course.created_at).toLocaleDateString()}`}
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex items-center space-x-2">
            <ProfessorOnly>
              <Button variant="outline" asChild>
                <Link href={`/modules/create?course_id=${courseId}`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Módulo
                </Link>
              </Button>
            </ProfessorOnly>
            
            <AdminOnly>
              <Button asChild>
                <Link href={`/courses/${courseId}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar Curso
                </Link>
              </Button>
            </AdminOnly>
          </div>
        }
      />

      {/* Course Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Curso</CardTitle>
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
                <span>Atualizado em {new Date(course.updated_at).toLocaleDateString()}</span>
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
            { key: 'modules', label: 'Módulos', count: modules.length },
            { key: 'professors', label: 'Professores', count: professors.length },
            { key: 'students', label: 'Estudantes', count: course.students_count }
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
              <CardTitle>Módulos do Curso</CardTitle>
              <CardDescription>
                Gerencie os módulos e conteúdo de aprendizado para este curso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={modules}
                columns={moduleColumns}
                emptyMessage="Nenhum módulo encontrado. Adicione seu primeiro módulo para começar."
              />
            </CardContent>
          </Card>
        )}

        {activeTab === 'professors' && (
          <Card>
            <CardHeader>
              <CardTitle>Professores Atribuídos</CardTitle>
              <CardDescription>
                Professores que estão ensinando ou gerenciando este curso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={professors}
                columns={professorColumns}
                emptyMessage="Nenhum professor atribuído a este curso."
              />
            </CardContent>
          </Card>
        )}

        {activeTab === 'students' && (
          <Card>
            <CardHeader>
              <CardTitle>Estudantes Inscritos</CardTitle>
              <CardDescription>
                Estudantes atualmente inscritos neste curso
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