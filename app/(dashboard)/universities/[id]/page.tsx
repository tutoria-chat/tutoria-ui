'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Edit,
  Plus,
  Users,
  BookOpen,
  Building2,
  GraduationCap,
  Folder,
  Trash2,
  Shield,
  Mail,
  Phone,
  UserCircle,
  Globe,
  MapPin,
  FileText
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/shared/data-table';
import { Loading } from '@/components/ui/loading-spinner';
import { AdminOnly, ProfessorOnly, SuperAdminOnly } from '@/components/auth/role-guard';
import { useAuth } from '@/components/auth/auth-provider';
import { useFetch } from '@/lib/hooks';
import { formatDateShort } from '@/lib/utils';
import type { UniversityWithCourses, Course, Professor, TableColumn, BreadcrumbItem, PaginatedResponse } from '@/lib/types';
import { toast } from 'sonner';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function UniversityDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const universityId = params.id as string;
  const t = useTranslations('universities.detail');
  const tProf = useTranslations('professors.selectTypeDialog');
  const tCommon = useTranslations('common');
  const tTiers = useTranslations('universities.subscription');

  const [activeTab, setActiveTab] = useState<'courses' | 'professors'>('courses');
  const [showProfessorTypeDialog, setShowProfessorTypeDialog] = useState(false);

  // Search, pagination, and sorting state for courses
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const [coursePage, setCoursePage] = useState(1);
  const [courseLimit, setCourseLimit] = useState(10);
  const [courseSortColumn, setCourseSortColumn] = useState<string | null>('name');
  const [courseSortDirection, setCourseSortDirection] = useState<'asc' | 'desc' | null>('asc');

  // Search, pagination, and sorting state for professors
  const [professorSearchTerm, setProfessorSearchTerm] = useState('');
  const [professorPage, setProfessorPage] = useState(1);
  const [professorLimit, setProfessorLimit] = useState(10);
  const [professorSortColumn, setProfessorSortColumn] = useState<string | null>('firstName');
  const [professorSortDirection, setProfessorSortDirection] = useState<'asc' | 'desc' | null>('asc');

  // Confirm dialog
  const { confirm, dialog } = useConfirmDialog();

  // For professors, ensure they can only access their own university
  React.useEffect(() => {
    if (user && user.role !== 'super_admin' && user.universityId) {
      if (Number(universityId) !== user.universityId) {
        // Redirect to their own university if they try to access another
        window.location.href = `/universities/${user.universityId}`;
      }
    }
  }, [user, universityId]);

  // Fetch university details
  const { data: university, loading: universityLoading } = useFetch<UniversityWithCourses>(`/universities/${universityId}`);

  // Build courses API URL with pagination params and filters
  // Backend now handles role-based filtering:
  // - Super admins: see all courses (no filter beyond universityId)
  // - Admin professors: see all courses in their university (universityId filter)
  // - Regular professors: see ONLY their assigned courses (professorId filter)
  const buildCoursesApiUrl = () => {
    let filters = `page=${coursePage}&limit=${courseLimit}`;

    if (courseSearchTerm) {
      filters += `&search=${encodeURIComponent(courseSearchTerm)}`;
    }

    // Always filter by university when on university detail page
    filters += `&universityId=${universityId}`;

    // Regular professor (not admin) - backend filters by professorId
    if (user?.role === 'professor' && user.isAdmin === false && user.id) {
      filters += `&professorId=${user.id}`;
    }

    return `/courses/?${filters}`;
  };

  // Fetch courses with pagination
  const { data: coursesResponse, loading: coursesLoading } = useFetch<PaginatedResponse<Course>>(buildCoursesApiUrl());

  // Build professors API URL with pagination params and filters
  const buildProfessorsApiUrl = () => {
    let filters = `page=${professorPage}&limit=${professorLimit}`;

    if (professorSearchTerm) {
      filters += `&search=${encodeURIComponent(professorSearchTerm)}`;
    }

    filters += `&universityId=${universityId}`;

    return `/professors/?${filters}`;
  };

  // Fetch professors ONLY for admin users (super admin or admin professor)
  // Regular professors get 403 Forbidden and don't need this data
  const isAdmin = user?.role === 'super_admin' || (user?.role === 'professor' && user?.isAdmin);
  const professorsApiUrl = isAdmin ? buildProfessorsApiUrl() : null;
  const { data: professorsResponse, loading: professorsLoading } = useFetch<PaginatedResponse<Professor>>(
    professorsApiUrl
  );

  const courses = coursesResponse?.items || [];
  const totalCourses = coursesResponse?.total || 0;
  const professors = professorsResponse?.items || [];
  const totalProfessors = professorsResponse?.total || 0;

  const breadcrumbs: BreadcrumbItem[] = [
    { label: t('breadcrumb'), href: '/universities' },
    { label: university?.name || tCommon('loading'), isCurrentPage: true }
  ];

  const handleAddProfessor = () => {
    // If super admin, show dialog to choose type
    if (user?.role === 'super_admin') {
      setShowProfessorTypeDialog(true);
    } else {
      // If admin professor, go directly to create regular professor
      router.push(`/professors/create?universityId=${universityId}`);
    }
  };

  const handleSelectProfessorType = (type: 'regular' | 'admin') => {
    setShowProfessorTypeDialog(false);
    if (type === 'admin') {
      router.push(`/professors/create-admin?universityId=${universityId}`);
    } else {
      router.push(`/professors/create?universityId=${universityId}`);
    }
  };

  const courseColumns: TableColumn<Course>[] = [
    {
      key: 'name',
      label: t('courseColumns.name'),
      sortable: true,
      render: (value, course) => (
        <Link href={`/courses/${course.id}`} className="hover:underline">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="font-medium">{course.name}</div>
              {course.code && (
                <div className="text-sm text-muted-foreground">{course.code}</div>
              )}
            </div>
          </div>
        </Link>
      )
    },
    {
      key: 'modulesCount',
      label: t('courseColumns.modules'),
      render: (value) => (
        <Badge variant="outline">{t('courseColumns.modulesCount', { count: value || 0 })}</Badge>
      )
    },
    {
      key: 'professorsCount',
      label: t('courseColumns.professors'),
      render: (value) => (
        <Badge variant="outline">{t('courseColumns.professorsCount', { count: value || 0 })}</Badge>
      )
    },
    {
      key: 'createdAt',
      label: t('courseColumns.createdAt'),
      sortable: true,
      render: (value) => formatDateShort(value as string)
    },
    {
      key: 'actions',
      label: t('courseColumns.actions'),
      width: '120px',
      render: (_, course) => (
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/courses/${course.id}`}>
              <Folder className="h-4 w-4" />
            </Link>
          </Button>
          <AdminOnly>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/courses/${course.id}/edit`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteCourse(course.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </AdminOnly>
        </div>
      )
    }
  ];

  const professorColumns: TableColumn<Professor>[] = [
    {
      key: 'firstName',
      label: t('professorColumns.name'),
      sortable: true,
      render: (_, professor) => (
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="font-medium">{professor.firstName} {professor.lastName}</div>
            <div className="text-sm text-muted-foreground">{professor.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'isAdmin',
      label: t('professorColumns.type'),
      render: (value) => (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? t('professorColumns.admin') : t('professorColumns.professor')}
        </Badge>
      )
    },
    {
      key: 'coursesCount',
      label: t('professorColumns.courses'),
      render: (value) => (
        <span className="text-sm">{t('professorColumns.coursesCount', { count: value || 0 })}</span>
      )
    },
    {
      key: 'actions',
      label: t('professorColumns.actions'),
      width: '80px',
      render: (_, professor) => (
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/professors/${professor.id}/edit?returnUrl=${encodeURIComponent(`/universities/${universityId}`)}`}>
              <Edit className="h-4 w-4 text-blue-600" />
            </Link>
          </Button>
        </div>
      )
    }
  ];

  const handleDeleteCourse = async (id: number) => {
    confirm({
      title: t('deleteConfirm'),
      description: t('deleteConfirm'),
      variant: 'destructive',
      confirmText: tCommon('buttons.delete'),
      cancelText: tCommon('buttons.cancel'),
      onConfirm: async () => {
        try {
          const { apiClient } = await import('@/lib/api');
          await apiClient.deleteCourse(id);
          window.location.reload();
        } catch (error) {
          console.error('Erro ao deletar disciplina:', error);
          toast.error(t('deleteError'));
        }
      }
    });
  };

  const handleCourseSortChange = (column: string) => {
    if (courseSortColumn === column) {
      setCourseSortDirection(courseSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setCourseSortColumn(column);
      setCourseSortDirection('asc');
    }
  };

  const handleProfessorSortChange = (column: string) => {
    if (professorSortColumn === column) {
      setProfessorSortDirection(professorSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setProfessorSortColumn(column);
      setProfessorSortDirection('asc');
    }
  };

  if (universityLoading) {
    return <Loading />;
  }

  if (!university) {
    return <div>{t('notFound')}</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={university.name}
        description={university.description || `Universidade ${university.code}`}
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex items-center space-x-2">
            <SuperAdminOnly>
              <Button variant="outline" asChild>
                <Link href={`/universities/${universityId}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  {t('edit')}
                </Link>
              </Button>
            </SuperAdminOnly>
          </div>
        }
      />

      {/* University Information Card - Super Admin Only */}
      <SuperAdminOnly>
        <Card>
          <CardHeader>
            <CardTitle>{t('info.title')}</CardTitle>
            <CardDescription>{t('info.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">{t('info.code')}</p>
                    <p className="text-base">{university.code}</p>
                  </div>
                </div>

                {university.contactEmail && (
                  <div className="flex items-start space-x-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">{t('info.contactEmail')}</p>
                      <a href={`mailto:${university.contactEmail}`} className="text-base hover:underline text-primary">
                        {university.contactEmail}
                      </a>
                    </div>
                  </div>
                )}

                {university.contactPhone && (
                  <div className="flex items-start space-x-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">{t('info.contactPhone')}</p>
                      <a href={`tel:${university.contactPhone}`} className="text-base hover:underline text-primary">
                        {university.contactPhone}
                      </a>
                    </div>
                  </div>
                )}

                {university.contactPerson && (
                  <div className="flex items-start space-x-3">
                    <UserCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">{t('info.contactPerson')}</p>
                      <p className="text-base">{university.contactPerson}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {university.website && (
                  <div className="flex items-start space-x-3">
                    <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">{t('info.website')}</p>
                      <a
                        href={university.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-base hover:underline text-primary"
                      >
                        {university.website}
                      </a>
                    </div>
                  </div>
                )}

                {university.address && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">{t('info.address')}</p>
                      <p className="text-base">{university.address}</p>
                    </div>
                  </div>
                )}

                {university.taxId && (
                  <div className="flex items-start space-x-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">{t('info.taxId')}</p>
                      <p className="text-base">{university.taxId}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </SuperAdminOnly>

      {/* University Stats */}
      <div className={`grid gap-4 ${user?.role === 'super_admin' || user?.isAdmin ? 'md:grid-cols-4' : 'md:grid-cols-2'}`}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.courses')}</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{university?.coursesCount ?? 0}</div>
          </CardContent>
        </Card>

        {/* Professors Card - Admin only */}
        <AdminOnly>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.professors')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{university?.professorsCount ?? 0}</div>
            </CardContent>
          </Card>
        </AdminOnly>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.code')}</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{university.code}</div>
          </CardContent>
        </Card>

        {/* Subscription Card - Admin only */}
        <AdminOnly>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.subscription')}</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {university.subscriptionTier === 1 ? tTiers('tierBasic') :
                 university.subscriptionTier === 2 ? tTiers('tierStandard') :
                 tTiers('tierPremium')}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{tTiers('tierLabel')}</p>
            </CardContent>
          </Card>
        </AdminOnly>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b">
        <button
          onClick={() => setActiveTab('courses')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'courses'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <BookOpen className="inline-block mr-2 h-4 w-4" />
          {t('tabs.courses')}
        </button>
        {/* Only admin professors and super admins can see professors tab */}
        <AdminOnly>
          <button
            onClick={() => setActiveTab('professors')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'professors'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="inline-block mr-2 h-4 w-4" />
            {t('tabs.professors')}
          </button>
        </AdminOnly>
      </div>

      {/* Courses Tab */}
      {activeTab === 'courses' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('coursesTab.title')}</CardTitle>
                <CardDescription>
                  {t('coursesTab.description')}
                </CardDescription>
              </div>
              <AdminOnly>
                <Button asChild>
                  <Link href={`/courses/create?universityId=${universityId}`}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('coursesTab.newCourse')}
                  </Link>
                </Button>
              </AdminOnly>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              data={courses}
              columns={courseColumns}
              loading={coursesLoading}
              search={{
                value: courseSearchTerm,
                placeholder: t('coursesTab.searchPlaceholder'),
                onSearchChange: setCourseSearchTerm
              }}
              pagination={{
                page: coursePage,
                limit: courseLimit,
                total: totalCourses,
                onPageChange: setCoursePage,
                onLimitChange: setCourseLimit
              }}
              sorting={{
                column: courseSortColumn,
                direction: courseSortDirection,
                onSortChange: handleCourseSortChange
              }}
              emptyMessage={t('coursesTab.emptyMessage')}
            />
          </CardContent>
        </Card>
      )}

      {/* Professors Tab - Admin only */}
      <AdminOnly>
        {activeTab === 'professors' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('professorsTab.title')}</CardTitle>
                  <CardDescription>
                    {t('professorsTab.description')}
                  </CardDescription>
                </div>
                <Button onClick={handleAddProfessor}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('professorsTab.newProfessor')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                data={professors}
                columns={professorColumns}
                loading={professorsLoading}
                search={{
                  value: professorSearchTerm,
                  placeholder: t('professorsTab.searchPlaceholder'),
                  onSearchChange: setProfessorSearchTerm
                }}
                pagination={{
                  page: professorPage,
                  limit: professorLimit,
                  total: totalProfessors,
                  onPageChange: setProfessorPage,
                  onLimitChange: setProfessorLimit
                }}
                sorting={{
                  column: professorSortColumn,
                  direction: professorSortDirection,
                  onSortChange: handleProfessorSortChange
                }}
                emptyMessage={t('professorsTab.emptyMessage')}
              />
            </CardContent>
          </Card>
        )}
      </AdminOnly>

      {/* Professor Type Selection Dialog */}
      <Dialog open={showProfessorTypeDialog} onOpenChange={setShowProfessorTypeDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{tProf('title')}</DialogTitle>
            <DialogDescription>
              {tProf('description')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 py-4">
            <Button
              variant="outline"
              className="h-auto flex items-start justify-start p-4 hover:bg-blue-50 hover:border-blue-500 dark:hover:bg-blue-950"
              onClick={() => handleSelectProfessorType('regular')}
            >
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4 text-left flex-1">
                <div className="font-semibold text-base mb-1">{tProf('regularProfessor')}</div>
                <p className="text-sm text-muted-foreground">
                  {tProf('regularDescription')}
                </p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex items-start justify-start p-4 hover:bg-purple-50 hover:border-purple-500 dark:hover:bg-purple-950"
              onClick={() => handleSelectProfessorType('admin')}
            >
              <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4 text-left flex-1">
                <div className="font-semibold text-base mb-1">{tProf('adminProfessor')}</div>
                <p className="text-sm text-muted-foreground">
                  {tProf('adminDescription')}
                </p>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {dialog}
    </div>
  );
}
