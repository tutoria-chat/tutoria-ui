'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  AlertTriangle,
  Edit,
  Plus,
  Users,
  GraduationCap,
  BookOpen,
  FileText,
  Calendar,
  Building2,
  Eye,
  Trash2,
  Upload,
  Loader2,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  UserCheck,
  UserMinus,
  UserPlus,
  Lock,
  Download,
  ClipboardList,
  BarChart3
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { CourseCalendarTab } from '@/components/courses/course-calendar-tab';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/shared/data-table';
import { Loading } from '@/components/ui/loading-spinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AdminProfessorOnly, AdminOnly } from '@/components/auth/role-guard';
import { useAuth } from '@/components/auth/auth-provider';
import { useFetch } from '@/lib/hooks';
import { apiClient, ApiError } from '@/lib/api';
import { formatDateShort, hasBeenUpdated } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { CourseWithDetails, Module, Professor, Student, StudentImportResult, StudentUpdate, TableColumn, BreadcrumbItem, PaginatedResponse, UniversityLimits, Assignment, GradingJob } from '@/lib/types';
import { toast } from 'sonner';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';

export default function CourseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const { user } = useAuth();
  const t = useTranslations('courses.detail');
  const tCommon = useTranslations('common');
  const tModules = useTranslations('modules');
  const tStudents = useTranslations('courses.detail.studentsTab');
  const tProfTab = useTranslations('courses.detail.professorsTab');

  const [activeTab, setActiveTab] = useState<'modules' | 'professors' | 'students' | 'calendar' | 'assignments' | 'grading'>('modules');
  const tGrading = useTranslations('courses.detail.gradingTab');
  const tAssignments = useTranslations('courses.detail.assignmentsTab');

  // Fetch course basic info
  const { data: course, loading: courseLoading, error: courseError } = useFetch<CourseWithDetails>(`/api/courses/${courseId}`);

  // Pagination and filtering state for modules
  const [modulePage, setModulePage] = useState(1);
  const [moduleLimit, setModuleLimit] = useState(10);
  const [semesterFilter, setSemesterFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleSortColumn, setModuleSortColumn] = useState<string | null>('name');
  const [moduleSortDirection, setModuleSortDirection] = useState<'asc' | 'desc' | null>('asc');

  // Student tab state
  const [studentPage, setStudentPage] = useState(1);
  const [studentLimit, setStudentLimit] = useState(10);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);

  // Active students count (from backend, across all pages)
  const [activeStudentsCount, setActiveStudentsCount] = useState(0);

  // Edit student modal state
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', username: '', email: '' });
  const [isEditSaving, setIsEditSaving] = useState(false);

  // Import dialog state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<StudentImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Build modules API URL with pagination and filters
  const buildModulesApiUrl = () => {
    let filters = `courseId=${courseId}&page=${modulePage}&size=${moduleLimit}`;

    if (searchTerm) {
      filters += `&search=${encodeURIComponent(searchTerm)}`;
    }

    if (semesterFilter !== 'all') {
      filters += `&semester=${semesterFilter}`;
    }

    if (yearFilter !== 'all') {
      filters += `&year=${yearFilter}`;
    }

    return `/api/modules/?${filters}`;
  };

  // Fetch modules with pagination
  const { data: modulesResponse, loading: modulesLoading, refetch: refetchModules } = useFetch<PaginatedResponse<Module>>(buildModulesApiUrl());

  // Fetch professors
  const { data: professorsResponse, refetch: refetchProfessors } = useFetch<PaginatedResponse<Professor>>(
    `/api/professors/?courseId=${courseId}`
  );

  const modules = modulesResponse?.items || [];
  const totalModules = modulesResponse?.total || 0;
  const professors = professorsResponse?.items || [];

  // Add Professor modal state
  const [showAddProfessor, setShowAddProfessor] = useState(false);
  const [addProfessorMode, setAddProfessorMode] = useState<'choose' | 'existing'>('choose');
  const [availableProfessors, setAvailableProfessors] = useState<Professor[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [professorSearch, setProfessorSearch] = useState('');
  const [assigningId, setAssigningId] = useState<number | null>(null);

  // Assignments tab state
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  // Grading tab state
  const [gradingJobs, setGradingJobs] = useState<GradingJob[]>([]);
  const [gradingJobsLoading, setGradingJobsLoading] = useState(false);
  const [gradingFile, setGradingFile] = useState<File | null>(null);
  const [isGradingUploading, setIsGradingUploading] = useState(false);
  const [gradingCriteria, setGradingCriteria] = useState('');
  const gradingFileInputRef = useRef<HTMLInputElement>(null);

  // Get all modules for filter options (using course embedded data)
  const allModules = course?.modules || [];

  // Plan limits for over-limit checks
  const { data: limits } = useFetch<UniversityLimits>(
    user?.role !== 'super_admin' ? '/api/subscriptions/limits' : null
  );
  const overLimitModuleIds = new Set(limits?.overLimitModuleIds || []);
  const overLimitStudentIds = new Set(limits?.overLimitStudentIds || []);

  // Confirm dialog
  const { confirm, dialog } = useConfirmDialog();

  // Get unique semesters and years for filter dropdowns (using all modules from course)
  const availableSemesters = Array.from(new Set(allModules.map(m => m.semester).filter(Boolean))).sort();
  const availableYears = Array.from(new Set(allModules.map(m => m.year).filter(Boolean))).sort((a, b) => (b ?? 0) - (a ?? 0));

  // Load students for this course
  const loadStudents = useCallback(async () => {
    setStudentsLoading(true);
    try {
      const response = await apiClient.getStudents({
        courseId: parseInt(courseId),
        page: studentPage,
        size: studentLimit,
        search: studentSearch || undefined,
      });
      setStudents(response.items || []);
      setTotalStudents(response.total || 0);
      if (response.activeCount !== undefined) {
        setActiveStudentsCount(response.activeCount);
      }
    } catch (error) {
      console.error('Failed to load students:', error);
      setStudents([]);
      setTotalStudents(0);
    } finally {
      setStudentsLoading(false);
    }
  }, [courseId, studentPage, studentLimit, studentSearch]);

  // Load student count on mount so the stat card isn't stuck at 0
  useEffect(() => {
    loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload when tab becomes active, pagination changes, or search changes
  useEffect(() => {
    if (activeTab === 'students') {
      loadStudents();
    }
  }, [activeTab, loadStudents]);

  // Load assignments when tab becomes active
  const loadAssignments = useCallback(async () => {
    setAssignmentsLoading(true);
    try {
      const response = await apiClient.getAssignments({ courseId: parseInt(courseId) });
      setAssignments(response.items.filter(a => a.isPublished));
    } catch {
      setAssignments([]);
    } finally {
      setAssignmentsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (activeTab === 'assignments') {
      loadAssignments();
    }
  }, [activeTab, loadAssignments]);

  // Load grading jobs
  const loadGradingJobs = useCallback(async () => {
    setGradingJobsLoading(true);
    try {
      const jobs = await apiClient.getGradingJobs(parseInt(courseId));
      setGradingJobs(jobs);
    } catch {
      setGradingJobs([]);
    } finally {
      setGradingJobsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (activeTab === 'grading') {
      loadGradingJobs();
    }
  }, [activeTab, loadGradingJobs]);

  // Poll grading jobs every 10 seconds while any are pending/processing
  useEffect(() => {
    if (activeTab !== 'grading') return;
    const hasActive = gradingJobs.some(j => j.status === 'pending' || j.status === 'processing');
    if (!hasActive) return;
    const interval = setInterval(() => loadGradingJobs(), 10000);
    return () => clearInterval(interval);
  }, [activeTab, gradingJobs, loadGradingJobs]);

  // Check if user can add modules to this course
  const canAddModule = (): boolean => {
    if (user?.role === 'super_admin') return true;
    if (user?.role === 'manager') return true;
    if (user?.role === 'platform_coordinator') return true;
    if (user?.role === 'tutor') return true;
    if (user?.role === 'professor') return true;
    return false;
  };

  // Check if user can manage students (import, etc.)
  const canManageStudents = (): boolean => {
    if (user?.role === 'super_admin') return true;
    if (user?.role === 'manager') return true;
    if (user?.role === 'platform_coordinator') return true;
    if (user?.role === 'tutor') return true;
    if (user?.role === 'professor') return true;
    return false;
  };

  if (courseLoading) {
    return <Loading />;
  }

  if (courseError || !course) {
    return <div className="flex items-center justify-center h-64">{tCommon('error')}</div>;
  }

  const breadcrumbs: BreadcrumbItem[] = course.universityId ? [
    { label: t('breadcrumbUniversities'), href: user?.role === 'super_admin' ? '/universities' : `/universities/${course.universityId}` },
    { label: course.universityName || 'Instituição de Ensino', href: `/universities/${course.universityId}` },
    { label: course.name, isCurrentPage: true }
  ] : [
    { label: t('breadcrumbCourses'), href: '/courses' },
    { label: course.name, isCurrentPage: true }
  ];

  const canEditModule = (): boolean => {
    if (user?.role === 'super_admin') return true;
    if (user?.role === 'manager') return true;
    if (user?.role === 'platform_coordinator') return true;
    if (user?.role === 'tutor') return true;
    if (user?.role === 'professor') return true;
    return false;
  };

  const handleDeleteModule = async (moduleId: number) => {
    confirm({
      title: tModules('deleteConfirm'),
      description: tModules('deleteConfirm'),
      variant: 'destructive',
      confirmText: tCommon('buttons.delete'),
      cancelText: tCommon('buttons.cancel'),
      onConfirm: async () => {
        try {
          await apiClient.deleteModule(moduleId);
          refetchModules();
        } catch (error) {
          console.error('Erro ao deletar módulo:', error);
          toast.error(tModules('deleteError'));
        }
      }
    });
  };

  const handleModuleSortChange = (column: string) => {
    if (moduleSortColumn === column) {
      setModuleSortDirection(moduleSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setModuleSortColumn(column);
      setModuleSortDirection('asc');
    }
  };

  // Add Professor modal handlers
  const openAddProfessor = async () => {
    setAddProfessorMode('choose');
    setProfessorSearch('');
    setShowAddProfessor(true);
  };

  const loadAvailableProfessors = async () => {
    if (!course?.universityId) return;
    setLoadingAvailable(true);
    try {
      const response = await apiClient.getProfessors({ universityId: course.universityId, size: 200 });
      const assignedIds = new Set(professors.map(p => p.id));
      setAvailableProfessors(response.items.filter(p => !assignedIds.has(p.id)));
    } catch {
      toast.error(tProfTab('addModal.loadError'));
    } finally {
      setLoadingAvailable(false);
    }
  };

  const handleAssignProfessor = async (professorId: number) => {
    setAssigningId(professorId);
    try {
      await apiClient.assignProfessorToCourse(parseInt(courseId), professorId);
      toast.success(tProfTab('addModal.assignSuccess'));
      setShowAddProfessor(false);
      refetchProfessors();
    } catch {
      toast.error(tProfTab('addModal.assignError'));
    } finally {
      setAssigningId(null);
    }
  };

  // Import handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const ext = file.name.toLowerCase();
      if (ext.endsWith('.csv') || ext.endsWith('.xlsx')) {
        setSelectedFile(file);
      } else {
        toast.error('Please select a .csv or .xlsx file');
      }
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setImportResult(null);
    try {
      const result = await apiClient.importStudents(parseInt(courseId), selectedFile);
      setImportResult(result);
      toast.success(tStudents('importSuccess'));
      // Refresh the student list after import
      loadStudents();
    } catch (error) {
      console.error('Import failed:', error);
      if (error instanceof ApiError && error.isPlanLimitError) {
        toast.error(error.message);
      } else {
        toast.error(error instanceof Error ? error.message : tStudents('importError'));
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleCloseImport = () => {
    setIsImportOpen(false);
    setSelectedFile(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Grading handlers
  const handleGradingFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.json')) {
      toast.error('Please select a .json file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10 MB');
      return;
    }
    setGradingFile(file);
  };

  const handleGradingUpload = async () => {
    if (!gradingFile) return;
    setIsGradingUploading(true);
    try {
      await apiClient.createGradingJob(parseInt(courseId), gradingFile, gradingCriteria);
      toast.success(tGrading('uploadSuccess'));
      setGradingFile(null);
      if (gradingFileInputRef.current) gradingFileInputRef.current.value = '';
      loadGradingJobs();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tGrading('uploadError'));
    } finally {
      setIsGradingUploading(false);
    }
  };

  const handleGradingDownload = async (jobId: number) => {
    try {
      const { downloadUrl } = await apiClient.getGradingJobDownloadUrl(jobId);
      window.open(downloadUrl, '_blank');
    } catch {
      toast.error(tGrading('downloadError'));
    }
  };

  // Edit student handlers
  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setEditForm({
      firstName: student.firstName,
      lastName: student.lastName,
      username: student.username,
      email: student.email,
    });
  };

  const handleSaveStudent = async () => {
    if (!editingStudent) return;
    setIsEditSaving(true);
    try {
      const data: StudentUpdate = {};
      if (editForm.firstName !== editingStudent.firstName) data.firstName = editForm.firstName;
      if (editForm.lastName !== editingStudent.lastName) data.lastName = editForm.lastName;
      if (editForm.username !== editingStudent.username) data.username = editForm.username;
      // Only send email if student hasn't logged in (no account created)
      if (editForm.email !== editingStudent.email && !editingStudent.lastLoginAt) {
        data.email = editForm.email;
      }
      await apiClient.updateStudent(editingStudent.id, data);
      toast.success(tStudents('editSuccess'));
      setEditingStudent(null);
      loadStudents();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tStudents('editError'));
    } finally {
      setIsEditSaving(false);
    }
  };

  const handleUnenrollStudent = (student: Student) => {
    confirm({
      title: tStudents('unenrollTitle'),
      description: tStudents('unenrollDescription', { name: `${student.firstName} ${student.lastName}` }),
      variant: 'destructive',
      confirmText: tStudents('unenrollConfirm'),
      cancelText: tCommon('buttons.cancel'),
      onConfirm: async () => {
        try {
          await apiClient.unenrollStudent(student.id, parseInt(courseId));
          toast.success(tStudents('unenrollSuccess'));
          loadStudents();
        } catch (error) {
          toast.error(error instanceof Error ? error.message : tStudents('unenrollError'));
        }
      }
    });
  };

  const moduleColumns: TableColumn<Module>[] = [
    {
      key: 'name',
      label: t('modulesTab.title'),
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
      key: 'semester',
      label: t('modulesTab.semesterYear'),
      sortable: true,
      render: (value, module) => (
        <Badge variant="outline">
          {module.semester}º Sem / {module.year}
        </Badge>
      )
    },
    {
      key: 'filesCount',
      label: t('modulesTab.files'),
      render: (value) => (
        <div className="flex items-center space-x-1">
          <FileText className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{value || 0}</span>
        </div>
      )
    },
    {
      key: 'tokensCount',
      label: t('modulesTab.tokens'),
      render: (value) => (
        <Badge variant="outline">{t('modulesTab.tokensCount', { count: value || 0 })}</Badge>
      )
    },
    {
      key: 'updatedAt',
      label: t('modulesTab.lastUpdate'),
      render: (value, module) => {
        if (hasBeenUpdated(module.createdAt, value as string)) {
          return <span className="text-sm">{formatDateShort(value as string)}</span>;
        }
        return <span className="text-sm text-muted-foreground">{t('modulesTab.neverUpdated')}</span>;
      }
    },
    {
      key: 'actions',
      label: tCommon('buttons.edit'),
      width: '150px',
      render: (_, module) => {
        const isOverLimit = overLimitModuleIds.has(module.id);
        if (isOverLimit) {
          return (
            <div className="flex items-center space-x-1">
              <Lock className="h-4 w-4 text-muted-foreground" />
              {canEditModule() && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteModule(module.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          );
        }
        return (
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

            {canEditModule() && (
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
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteModule(module.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </>
            )}
          </div>
        );
      }
    }
  ];

  const professorColumns: TableColumn<Professor>[] = [
    {
      key: 'name',
      label: t('professorsTab.title'),
      render: (_, professor) => (
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
            <Users className="h-4 w-4 text-green-600" />
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
      label: t('professorsTab.role'),
      render: (value) => (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? t('professorsTab.adminProfessor') : t('professorsTab.regularProfessor')}
        </Badge>
      )
    }
  ];

  const studentColumns: TableColumn<Student>[] = [
    {
      key: 'firstName',
      label: tStudents('columns.name'),
      sortable: true,
      render: (_, student) => (
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <div className="font-medium">{student.firstName} {student.lastName}</div>
            <div className="text-sm text-muted-foreground">{student.username}</div>
          </div>
        </div>
      )
    },
    {
      key: 'email',
      label: tStudents('columns.email'),
      sortable: true,
      render: (value) => (
        <span className="text-sm">{value as string}</span>
      )
    },
    {
      key: 'externalId',
      label: tStudents('columns.matricula'),
      render: (value) => value ? (
        <Badge variant="outline" className="font-mono">{value as string}</Badge>
      ) : (
        <span className="text-muted-foreground text-sm">—</span>
      )
    },
    {
      key: 'isActive',
      label: tStudents('columns.status'),
      render: (value) => (
        <Badge variant={value ? 'default' : 'secondary'} className={value ? 'bg-green-600' : ''}>
          {value ? tStudents('active') : tStudents('inactive')}
        </Badge>
      )
    },
    {
      key: 'createdAt',
      label: tStudents('columns.enrolledAt'),
      sortable: true,
      render: (value) => (
        <span className="text-sm">{formatDateShort(value as string)}</span>
      )
    },
    ...(canManageStudents() ? [{
      key: 'actions' as keyof Student,
      label: tCommon('buttons.actions'),
      width: '120px',
      render: (_: unknown, student: Student) => {
        const isOverLimit = overLimitStudentIds.has(student.id);
        return (
          <div className="flex items-center space-x-1">
            {!isOverLimit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); handleEditStudent(student); }}
                title={tCommon('buttons.edit')}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); handleUnenrollStudent(student); }}
              title={tStudents('unenrollButton')}
            >
              <UserMinus className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        );
      }
    }] : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={course.name}
        description={`${course.universityName || t('courseInfo')} • ${t('updated', { date: formatDateShort(course.createdAt) })}`}
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex items-center space-x-2">
            {course.universityId && (
              <Button variant="outline" asChild>
                <Link href={`/universities/${course.universityId}`}>
                  <Building2 className="mr-2 h-4 w-4" />
                  {t('viewUniversity')}
                </Link>
              </Button>
            )}

            <AdminProfessorOnly>
              <Button asChild>
                <Link href={`/courses/${courseId}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  {t('editCourse')}
                </Link>
              </Button>
            </AdminProfessorOnly>
          </div>
        }
      />

      {/* Roster required: without imported students nobody can verify a matricula,
          so the student widget is unusable for this course */}
      {totalStudents === 0 && (
        <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="py-3 px-5">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium">{t('rosterRequired.title')}</p>
                  <p className="text-sm text-muted-foreground">{t('rosterRequired.description')}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setActiveTab('students')}>
                <Upload className="mr-2 h-4 w-4" />
                {t('rosterRequired.action')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Course Overview */}
      <div className="space-y-3">
        {/* Stat cards — compact horizontal row */}
        <div className="flex gap-4">
          <Card className="flex-1 cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setActiveTab('modules')}>
            <CardContent className="py-4 px-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{totalModules}</p>
                  <p className="text-sm text-muted-foreground">{t('modules')}</p>
                </div>
                <BookOpen className="h-6 w-6 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setActiveTab('students')}>
            <CardContent className="py-4 px-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{totalStudents}</p>
                  <p className="text-sm text-muted-foreground">{t('enrolledStudents')}</p>
                </div>
                <GraduationCap className="h-6 w-6 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <AdminOnly>
            <Card className="flex-1 cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setActiveTab('professors')}>
              <CardContent className="py-4 px-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{professors.length}</p>
                    <p className="text-sm text-muted-foreground">{t('professors')}</p>
                  </div>
                  <Users className="h-6 w-6 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </AdminOnly>
        </div>

        {/* Course info — compact single strip */}
        <Card>
          <CardContent className="py-3 px-5">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-sm">
              {course.description && (
                <span className="text-muted-foreground line-clamp-1">{course.description}</span>
              )}
              {course.universityName && (
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{course.universityName}</span>
                </div>
              )}
              {hasBeenUpdated(course.createdAt, course.updatedAt) && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{t('updated', { date: formatDateShort(course.updatedAt) })}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('modules')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'modules'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
            }`}
          >
            {t('tabs.modules')}
            <Badge variant="secondary" className="ml-2">
              {modules?.length || 0}
            </Badge>
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'students'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
            }`}
          >
            {t('tabs.students')}
            <Badge variant="secondary" className="ml-2">
              {totalStudents}
            </Badge>
          </button>

          <AdminOnly>
            <button
              onClick={() => setActiveTab('professors')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'professors'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
              }`}
            >
              {t('tabs.professors')}
              <Badge variant="secondary" className="ml-2">
                {professors?.length || 0}
              </Badge>
            </button>
          </AdminOnly>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'calendar'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
            }`}
          >
            {t('tabs.calendar')}
          </button>

          {course.university?.hasAssignments && (
            <>
              <button
                onClick={() => setActiveTab('assignments')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'assignments'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                }`}
              >
                {t('tabs.assignments')}
              </button>

              <button
                onClick={() => setActiveTab('grading')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'grading'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                }`}
              >
                {t('tabs.grading')}
              </button>
            </>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === 'calendar' && (
          <CourseCalendarTab
            courseId={Number(courseId)}
            modules={modules || []}
            canManage={true}
            onGoToAssignments={() => setActiveTab('assignments')}
          />
        )}

        {activeTab === 'modules' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('modulesTab.title')}</CardTitle>
                  <CardDescription>
                    {t('modulesTab.description')}
                  </CardDescription>
                </div>
                {canAddModule() && (
                  <Button asChild>
                    <Link href={`/modules/create?courseId=${courseId}`}>
                      <Plus className="mr-2 h-4 w-4" />
                      {t('addModule')}
                    </Link>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    placeholder={t('modulesTab.search')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoComplete="off"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
                <select
                  value={semesterFilter}
                  onChange={(e) => setSemesterFilter(e.target.value)}
                  autoComplete="off"
                  className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="all">{t('modulesTab.allSemesters')}</option>
                  {availableSemesters.map(sem => (
                    <option key={sem} value={sem}>{t('modulesTab.semester', { num: sem || 0 })}</option>
                  ))}
                </select>
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  autoComplete="off"
                  className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="all">{t('modulesTab.allYears')}</option>
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <DataTable
                data={modules || []}
                columns={moduleColumns}
                loading={modulesLoading}
                pagination={{
                  page: modulePage,
                  limit: moduleLimit,
                  total: totalModules,
                  onPageChange: setModulePage,
                  onLimitChange: setModuleLimit
                }}
                sorting={{
                  column: moduleSortColumn,
                  direction: moduleSortDirection,
                  onSortChange: handleModuleSortChange
                }}
                emptyMessage={searchTerm || semesterFilter !== 'all' || yearFilter !== 'all'
                  ? t('modulesTab.noModules')
                  : t('modulesTab.noModulesInitial')}
                onRowClick={(module) => {
                  if (!overLimitModuleIds.has(module.id)) {
                    router.push(`/modules/${module.id}`);
                  }
                }}
                rowClassName={(module) =>
                  overLimitModuleIds.has(module.id) ? 'opacity-50 bg-muted/30 cursor-not-allowed' : undefined
                }
              />
            </CardContent>
          </Card>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <>
            {/* Student Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{totalStudents}</p>
                      <p className="text-sm text-muted-foreground">{tStudents('totalStudents')}</p>
                    </div>
                    <GraduationCap className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{activeStudentsCount}</p>
                      <p className="text-sm text-muted-foreground">{tStudents('activeStudents')}</p>
                    </div>
                    <UserCheck className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Student List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{tStudents('title')}</CardTitle>
                    <CardDescription>
                      {tStudents('description')}
                    </CardDescription>
                  </div>
                  {canManageStudents() && (
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" asChild>
                        <Link href="/students">
                          {tStudents('viewAll')}
                        </Link>
                      </Button>
                      <Button onClick={() => setIsImportOpen(true)}>
                        <Upload className="mr-2 h-4 w-4" />
                        {tStudents('importButton')}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={students}
                  columns={studentColumns}
                  loading={studentsLoading}
                  search={{
                    value: studentSearch,
                    placeholder: tStudents('searchPlaceholder'),
                    onSearchChange: (val) => { setStudentSearch(val); setStudentPage(1); }
                  }}
                  pagination={{
                    page: studentPage,
                    limit: studentLimit,
                    total: totalStudents,
                    onPageChange: setStudentPage,
                    onLimitChange: setStudentLimit
                  }}
                  emptyMessage={tStudents('emptyMessage')}
                  rowClassName={(student) =>
                    overLimitStudentIds.has(student.id) ? 'opacity-50 bg-muted/30 cursor-not-allowed' : undefined
                  }
                />
              </CardContent>
            </Card>
          </>
        )}

        {/* Professors Tab - Admin only */}
        <AdminOnly>
          {activeTab === 'professors' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('professorsTab.title')}</CardTitle>
                    <CardDescription>{t('professorsTab.description')}</CardDescription>
                  </div>
                  <Button onClick={openAddProfessor}>
                    <Plus className="mr-2 h-4 w-4" />
                    {tProfTab('addButton')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={professors || []}
                  columns={professorColumns}
                  emptyMessage={t('professorsTab.emptyMessage')}
                />
              </CardContent>
            </Card>
          )}
        </AdminOnly>
        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <Card>
            <CardHeader>
              <CardTitle>{tAssignments('title')}</CardTitle>
              <CardDescription>{tAssignments('description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {assignmentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : assignments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ClipboardList className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">{tAssignments('empty')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assignments.map(assignment => (
                    <div key={assignment.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium">{assignment.title}</p>
                          {assignment.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">{assignment.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            {assignment.moduleName && (
                              <Badge variant="secondary" className="text-xs">{assignment.moduleName}</Badge>
                            )}
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDateShort(assignment.dueDate)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/modules/${assignment.moduleId}`}>
                          {tAssignments('openModule')}
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Grading Tab */}
        {activeTab === 'grading' && (
          <div className="space-y-4">
            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle>{tGrading('uploadTitle')}</CardTitle>
                <CardDescription>{tGrading('description')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Grading Criteria */}
                <div>
                  <Label htmlFor="gradingCriteria" className="text-sm font-medium">
                    {tGrading('criteriaLabel')}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">({tCommon('optional')})</span>
                  </Label>
                  <Textarea
                    id="gradingCriteria"
                    value={gradingCriteria}
                    onChange={(e) => setGradingCriteria(e.target.value)}
                    placeholder={tGrading('criteriaPlaceholder')}
                    rows={3}
                    className="mt-1"
                    maxLength={2000}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{tGrading('criteriaHelp')}</p>
                </div>

                {/* Drag/drop area */}
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => gradingFileInputRef.current?.click()}
                >
                  {gradingFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="h-5 w-5 text-green-600" />
                      <span className="font-medium">{gradingFile.name}</span>
                      <span className="text-sm text-muted-foreground">
                        ({(gradingFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium">{tGrading('uploadButton')}</p>
                      <p className="text-xs text-muted-foreground mt-1">{tGrading('uploadAccept')}</p>
                    </div>
                  )}
                </div>
                <input
                  ref={gradingFileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleGradingFileSelect}
                  className="hidden"
                />

                {/* Template downloads */}
                <div className="flex items-center gap-4 text-sm">
                  <a
                    href="/templates/grading/template.json"
                    download
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {tGrading('downloadJson')}
                  </a>
                  <a
                    href="/templates/grading/template.csv"
                    download
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {tGrading('downloadCsv')}
                  </a>
                </div>
                <p className="text-xs text-muted-foreground">{tGrading('templateNote')}</p>

                <Button
                  onClick={handleGradingUpload}
                  disabled={!gradingFile || isGradingUploading}
                  className="w-full"
                >
                  {isGradingUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {tGrading('uploadButton')}
                </Button>
              </CardContent>
            </Card>

            {/* History Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    {tGrading('historyTitle')}
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={loadGradingJobs} disabled={gradingJobsLoading}>
                    {gradingJobsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {gradingJobsLoading && gradingJobs.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : gradingJobs.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">{tGrading('emptyHistory')}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 pr-4 font-medium text-muted-foreground">{tGrading('colCreated')}</th>
                          <th className="text-left py-2 pr-4 font-medium text-muted-foreground">{tGrading('colFile')}</th>
                          <th className="text-left py-2 pr-4 font-medium text-muted-foreground">{tGrading('colUploadedBy')}</th>
                          <th className="text-left py-2 pr-4 font-medium text-muted-foreground">{tGrading('colSubmissions')}</th>
                          <th className="text-left py-2 pr-4 font-medium text-muted-foreground">{tGrading('colStatus')}</th>
                          <th className="text-left py-2 pr-4 font-medium text-muted-foreground">{tGrading('colProgress')}</th>
                          <th className="text-left py-2 font-medium text-muted-foreground">{tGrading('colActions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gradingJobs.map(job => (
                          <tr key={job.id} className="border-b last:border-0">
                            <td className="py-3 pr-4 text-sm">{formatDateShort(job.createdAt)}</td>
                            <td className="py-3 pr-4 text-sm max-w-[180px] truncate" title={job.originalFilename}>
                              {job.originalFilename ?? '—'}
                            </td>
                            <td className="py-3 pr-4 text-sm text-muted-foreground">{job.createdByName ?? '—'}</td>
                            <td className="py-3 pr-4 text-sm">{job.totalSubmissions}</td>
                            <td className="py-3 pr-4">
                              <Badge
                                variant={
                                  job.status === 'completed' ? 'default' :
                                  job.status === 'failed' ? 'destructive' :
                                  'secondary'
                                }
                                className={
                                  job.status === 'completed' ? 'bg-green-600' :
                                  job.status === 'processing' ? 'animate-pulse' : ''
                                }
                              >
                                {tGrading(`status${job.status.charAt(0).toUpperCase() + job.status.slice(1)}` as `status${string}`)}
                              </Badge>
                            </td>
                            <td className="py-3 pr-4 text-muted-foreground">
                              {job.processedSubmissions}/{job.totalSubmissions}
                            </td>
                            <td className="py-3">
                              {job.status === 'completed' && job.hasResult && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleGradingDownload(job.id)}
                                  className="flex items-center gap-1"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                  {tGrading('downloadCsvButton')}
                                </Button>
                              )}
                              {job.status === 'failed' && job.errorMessage && (
                                <span className="text-xs text-destructive">{job.errorMessage}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Edit Student Dialog */}
      <Dialog open={!!editingStudent} onOpenChange={(open) => !open && setEditingStudent(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{tStudents('editTitle')}</DialogTitle>
            <DialogDescription>{tStudents('editDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-firstName">{tStudents('columns.name').split(' ')[0] || 'First Name'}</Label>
                <Input
                  id="edit-firstName"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastName">{tStudents('editLastName')}</Label>
                <Input
                  id="edit-lastName"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-username">{tStudents('editUsername')}</Label>
              <Input
                id="edit-username"
                value={editForm.username}
                onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">{tStudents('columns.email')}</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                disabled={!!editingStudent?.lastLoginAt}
              />
              {editingStudent?.lastLoginAt && (
                <p className="text-xs text-muted-foreground">{tStudents('editEmailDisabled')}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingStudent(null)}>
              {tCommon('buttons.cancel')}
            </Button>
            <Button onClick={handleSaveStudent} disabled={isEditSaving}>
              {isEditSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tCommon('buttons.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Students Dialog */}
      <Dialog open={isImportOpen} onOpenChange={(open) => !open && handleCloseImport()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{tStudents('importTitle', { course: course.name })}</DialogTitle>
            <DialogDescription>{tStudents('importDescription')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* File Upload */}
            <div>
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-green-600" />
                    <span className="font-medium">{selectedFile.name}</span>
                    <span className="text-sm text-muted-foreground">
                      ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {tCommon('buttons.upload') || 'Drop your file here or click to browse'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">.csv, .xlsx</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Import Results */}
            {importResult && (
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  {tStudents('importSuccess')}
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-medium">{importResult.totalRows}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span className="font-medium text-green-600">{importResult.createdCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Enrolled:</span>
                    <span className="font-medium text-blue-600">{importResult.enrolledCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Skipped:</span>
                    <span className="font-medium">{importResult.skippedCount}</span>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <div className="mt-3">
                    <h5 className="text-sm font-medium text-red-600 flex items-center gap-1 mb-2">
                      <XCircle className="h-4 w-4" />
                      Errors ({importResult.errorCount})
                    </h5>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {importResult.errors.map((err, i) => (
                        <div key={i} className="text-xs bg-red-50 dark:bg-red-950/20 rounded px-2 py-1">
                          <span className="font-medium">Row {err.row}:</span>{' '}
                          {err.reason}
                          {err.email && <span className="text-muted-foreground"> ({err.email})</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseImport}>
              {tCommon('buttons.cancel')}
            </Button>
            {!importResult && (
              <Button
                onClick={handleImport}
                disabled={!selectedFile || isUploading}
              >
                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isUploading ? 'Importing...' : tStudents('importButton')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Professor Modal */}
      <Dialog open={showAddProfessor} onOpenChange={(open) => { setShowAddProfessor(open); if (!open) setAddProfessorMode('choose'); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{tProfTab('addModal.title')}</DialogTitle>
            <DialogDescription>{tProfTab('addModal.description')}</DialogDescription>
          </DialogHeader>

          {addProfessorMode === 'choose' && (
            <div className="grid grid-cols-1 gap-3 py-4">
              {/* Option A: New professor */}
              <button
                onClick={() => router.push(`/professors/create?universityId=${course?.universityId}`)}
                className="flex items-start gap-4 rounded-lg border p-4 text-left hover:bg-muted transition-colors"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <UserPlus className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{tProfTab('addModal.newTitle')}</p>
                  <p className="text-sm text-muted-foreground">{tProfTab('addModal.newDesc')}</p>
                </div>
              </button>

              {/* Option B: Existing professor */}
              <button
                onClick={() => { setAddProfessorMode('existing'); loadAvailableProfessors(); }}
                className="flex items-start gap-4 rounded-lg border p-4 text-left hover:bg-muted transition-colors"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium">{tProfTab('addModal.existingTitle')}</p>
                  <p className="text-sm text-muted-foreground">{tProfTab('addModal.existingDesc')}</p>
                </div>
              </button>
            </div>
          )}

          {addProfessorMode === 'existing' && (
            <div className="py-4 space-y-3">
              <Input
                placeholder={tProfTab('addModal.searchPlaceholder')}
                value={professorSearch}
                onChange={(e) => setProfessorSearch(e.target.value)}
              />
              <div className="max-h-64 overflow-y-auto space-y-1">
                {loadingAvailable ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">{tProfTab('addModal.loading')}</p>
                ) : availableProfessors.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">{tProfTab('addModal.noProfessors')}</p>
                ) : (
                  availableProfessors
                    .filter(p => {
                      const q = professorSearch.toLowerCase();
                      return !q || `${p.firstName} ${p.lastName} ${p.email}`.toLowerCase().includes(q);
                    })
                    .map(p => (
                      <div key={p.id} className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted">
                        <div>
                          <p className="text-sm font-medium">{p.firstName} {p.lastName}</p>
                          <p className="text-xs text-muted-foreground">{p.email}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAssignProfessor(p.id)}
                          disabled={assigningId === p.id}
                        >
                          {assigningId === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : tProfTab('addModal.assign')}
                        </Button>
                      </div>
                    ))
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setAddProfessorMode('choose')}>
                ← {tCommon('buttons.back')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {dialog}
    </div>
  );
}
