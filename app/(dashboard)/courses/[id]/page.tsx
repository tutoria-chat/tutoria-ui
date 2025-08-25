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
  name: "Computer Science Fundamentals",
  description: "This comprehensive course introduces students to the fundamental concepts of computer science, including programming principles, data structures, algorithms, and software engineering practices. Students will gain hands-on experience with modern programming languages and development tools.",
  university_id: 1,
  university_name: "University of Technology",
  created_at: "2024-01-15T08:30:00Z",
  updated_at: "2024-03-10T14:20:00Z",
  modules_count: 12,
  professors_count: 3,
  students_count: 89
};

const mockModules: Module[] = [
  {
    id: 1,
    name: "Introduction to Programming",
    description: "Basic programming concepts and syntax",
    course_id: 1,
    course_name: "Computer Science Fundamentals",
    created_at: "2024-01-20T10:00:00Z",
    updated_at: "2024-01-20T10:00:00Z",
    files_count: 8,
    tokens_count: 2
  },
  {
    id: 2,
    name: "Data Structures",
    description: "Arrays, linked lists, trees, and graphs",
    course_id: 1,
    course_name: "Computer Science Fundamentals",
    created_at: "2024-02-01T09:00:00Z",
    updated_at: "2024-02-01T09:00:00Z",
    files_count: 12,
    tokens_count: 3
  },
  {
    id: 3,
    name: "Algorithms and Complexity",
    description: "Sorting, searching, and algorithm analysis",
    course_id: 1,
    course_name: "Computer Science Fundamentals",
    created_at: "2024-02-15T11:00:00Z",
    updated_at: "2024-02-15T11:00:00Z",
    files_count: 15,
    tokens_count: 4
  }
];

const mockProfessors: Professor[] = [
  {
    id: 1,
    email: "john.smith@university.edu",
    first_name: "John",
    last_name: "Smith",
    university_id: 1,
    university_name: "University of Technology",
    is_admin: true,
    created_at: "2024-01-10T08:00:00Z",
    updated_at: "2024-01-10T08:00:00Z",
    courses_count: 3
  },
  {
    id: 2,
    email: "sarah.johnson@university.edu",
    first_name: "Sarah",
    last_name: "Johnson",
    university_id: 1,
    university_name: "University of Technology",
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
    { label: 'Courses', href: '/courses' },
    { label: course.name, isCurrentPage: true }
  ];

  const moduleColumns: TableColumn<Module>[] = [
    {
      key: 'name',
      label: 'Module',
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
      label: 'Files',
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
      label: 'Last Updated',
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
      label: 'Role',
      render: (value) => (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? "Admin Professor" : "Regular Professor"}
        </Badge>
      )
    },
    {
      key: 'courses_count',
      label: 'Total Courses',
      render: (value) => `${value || 0} courses`
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={course.name}
        description={`Course in ${course.university_name} • Created ${new Date(course.created_at).toLocaleDateString()}`}
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex items-center space-x-2">
            <ProfessorOnly>
              <Button variant="outline" asChild>
                <Link href={`/modules/create?course_id=${courseId}`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Module
                </Link>
              </Button>
            </ProfessorOnly>
            
            <AdminOnly>
              <Button asChild>
                <Link href={`/courses/${courseId}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Course
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
            <CardTitle>Course Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Description</h4>
              <p className="text-sm leading-relaxed">{course.description}</p>
            </div>
            
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{course.university_name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Updated {new Date(course.updated_at).toLocaleDateString()}</span>
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
                  <p className="text-sm text-muted-foreground">Modules</p>
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
                  <p className="text-sm text-muted-foreground">Students Enrolled</p>
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
                  <p className="text-sm text-muted-foreground">Professors</p>
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
            { key: 'modules', label: 'Modules', count: modules.length },
            { key: 'professors', label: 'Professors', count: professors.length },
            { key: 'students', label: 'Students', count: course.students_count }
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
              <CardTitle>Course Modules</CardTitle>
              <CardDescription>
                Manage the modules and learning content for this course
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={modules}
                columns={moduleColumns}
                emptyMessage="No modules found. Add your first module to get started."
              />
            </CardContent>
          </Card>
        )}

        {activeTab === 'professors' && (
          <Card>
            <CardHeader>
              <CardTitle>Assigned Professors</CardTitle>
              <CardDescription>
                Professors who are teaching or managing this course
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={professors}
                columns={professorColumns}
                emptyMessage="No professors assigned to this course."
              />
            </CardContent>
          </Card>
        )}

        {activeTab === 'students' && (
          <Card>
            <CardHeader>
              <CardTitle>Enrolled Students</CardTitle>
              <CardDescription>
                Students currently enrolled in this course
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold">Student Management</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Student management interface will be implemented here
                </p>
                <div className="mt-4">
                  <Button variant="outline" asChild>
                    <Link href="/students">
                      View All Students
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