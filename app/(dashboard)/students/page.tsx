'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/shared/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Upload, Loader2, CheckCircle2, XCircle, AlertCircle, FileSpreadsheet, Clock, AlertTriangle, GraduationCap } from 'lucide-react';
import { ProfessorOnly, SuperAdminOnly } from '@/components/auth/role-guard';
import { useAuth } from '@/components/auth/auth-provider';
import { apiClient, ApiError } from '@/lib/api';
import { useFetch } from '@/lib/hooks';
import type { Course, Student, StudentImportResult, StudentImportJob, University, PaginatedResponse, TableColumn, UniversityLimits } from '@/lib/types';
import { toast } from 'sonner';
import { formatDateShort } from '@/lib/utils';

export default function StudentsPage() {
  const t = useTranslations('students');
  const tImport = useTranslations('students.import');
  const tList = useTranslations('students.list');
  const tAlerts = useTranslations('students.alerts');
  const { user } = useAuth();

  // Filters
  const [selectedUniversityId, setSelectedUniversityId] = useState<number | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Import dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [importCourseId, setImportCourseId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<StudentImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSuperAdmin = user?.role === 'super_admin';

  // Auto-set universityId for non-super-admins
  const effectiveUniversityId = isSuperAdmin ? selectedUniversityId : user?.universityId ?? null;

  // Fetch universities list (super admin only)
  const { data: universitiesResponse } = useFetch<PaginatedResponse<University>>(
    isSuperAdmin ? '/api/universities/?size=100' : null
  );
  const universities = universitiesResponse?.items || [];

  // Fetch courses for filter
  const [courses, setCourses] = useState<Course[]>([]);
  const loadCourses = useCallback(async () => {
    try {
      if (effectiveUniversityId) {
        const data = await apiClient.getCoursesByUniversity(effectiveUniversityId);
        setCourses(data);
      } else if (!isSuperAdmin && user?.universityId) {
        const data = await apiClient.getCoursesByUniversity(user.universityId);
        setCourses(data);
      } else {
        const response = await apiClient.getCourses({ size: 100 });
        setCourses(response.items);
      }
    } catch (error) {
      console.error('Failed to load courses:', error);
    }
  }, [effectiveUniversityId, isSuperAdmin, user]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  // Build students API URL
  const buildStudentsUrl = () => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('size', limit.toString());
    if (effectiveUniversityId) params.set('universityId', effectiveUniversityId.toString());
    if (selectedCourseId) params.set('courseId', selectedCourseId.toString());
    if (searchTerm) params.set('search', searchTerm);
    return `/api/students/?${params.toString()}`;
  };

  // For super admins: require university selection first
  const shouldFetchStudents = !isSuperAdmin || selectedUniversityId !== null;
  const { data: studentsResponse, loading: studentsLoading } = useFetch<PaginatedResponse<Student>>(
    shouldFetchStudents ? buildStudentsUrl() : null
  );
  const students = studentsResponse?.items || [];
  const totalStudents = studentsResponse?.total || 0;

  // Fetch limits for alert
  const { data: limitsData } = useFetch<UniversityLimits>(
    effectiveUniversityId && !isSuperAdmin ? `/api/subscriptions/limits` : null
  );

  // MaxStudents alert logic
  const maxStudents = limitsData?.maxStudents;
  const currentStudents = limitsData?.currentStudents ?? totalStudents;
  const studentPercent = maxStudents ? Math.round((currentStudents / maxStudents) * 100) : 0;
  const showAlert = maxStudents && studentPercent >= 80;
  const limitReached = maxStudents && currentStudents >= maxStudents;

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
    if (!importCourseId || !selectedFile) return;

    setIsUploading(true);
    setImportResult(null);
    try {
      const result = await apiClient.importStudents(importCourseId, selectedFile);
      setImportResult(result);
      toast.success(tImport('importSuccess'));
    } catch (error) {
      console.error('Import failed:', error);
      if (error instanceof ApiError && error.isPlanLimitError) {
        toast.error(error.message, {
          action: { label: tAlerts('upgrade'), onClick: () => window.location.href = '/subscription' },
        });
      } else {
        toast.error(error instanceof Error ? error.message : tImport('importError'));
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedFile(null);
    setImportResult(null);
    setImportCourseId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Student table columns
  const studentColumns: TableColumn<Student>[] = [
    {
      key: 'firstName',
      label: tList('columns.name'),
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
      label: tList('columns.email'),
      sortable: true,
      render: (value) => (
        <span className="text-sm">{value as string}</span>
      )
    },
    {
      key: 'externalId',
      label: tList('columns.matricula'),
      render: (value) => value ? (
        <Badge variant="outline" className="font-mono">{value as string}</Badge>
      ) : (
        <span className="text-muted-foreground text-sm">—</span>
      )
    },
    {
      key: 'enrolledCourses',
      label: tList('columns.courses'),
      render: (_, student) => {
        if (!student.enrolledCourses || student.enrolledCourses.length === 0) {
          return <span className="text-muted-foreground text-sm">{tList('noCourses')}</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {student.enrolledCourses.map((ec) => (
              <Badge key={ec.courseId} variant="secondary" className="text-xs">
                {ec.courseName}
              </Badge>
            ))}
          </div>
        );
      }
    },
    {
      key: 'isActive',
      label: tList('columns.status'),
      render: (value) => (
        <Badge variant={value ? 'default' : 'secondary'} className={value ? 'bg-green-600' : ''}>
          {value ? tList('active') : tList('inactive')}
        </Badge>
      )
    },
    {
      key: 'createdAt',
      label: tList('columns.createdAt'),
      sortable: true,
      render: (value) => formatDateShort(value as string)
    },
  ];

  return (
    <ProfessorOnly>
      <div className="space-y-6">
        <PageHeader
          title={t('title')}
          description={t('description')}
          actions={
            <Button
              onClick={() => setIsDialogOpen(true)}
              disabled={!!limitReached}
              title={limitReached ? tAlerts('reached', { current: currentStudents, max: maxStudents }) : undefined}
            >
              {limitReached ? <AlertTriangle className="mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
              {tImport('button')}
            </Button>
          }
        />

        {/* MaxStudents Alert */}
        {showAlert && (
          <div className={`flex items-center gap-3 p-4 rounded-lg border ${
            limitReached
              ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
              : 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800'
          }`}>
            <AlertTriangle className={`h-5 w-5 shrink-0 ${
              limitReached ? 'text-red-600' : 'text-yellow-600'
            }`} />
            <p className={`text-sm flex-1 ${
              limitReached ? 'text-red-800 dark:text-red-200' : 'text-yellow-800 dark:text-yellow-200'
            }`}>
              {limitReached
                ? tAlerts('reached', { current: currentStudents, max: maxStudents })
                : tAlerts('approaching', { current: currentStudents, max: maxStudents, percent: studentPercent })
              }
            </p>
            <Button variant="outline" size="sm" asChild>
              <a href="/subscription">{tAlerts('upgrade')}</a>
            </Button>
          </div>
        )}

        {/* Super Admin: University Filter */}
        {isSuperAdmin && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">{tList('filterByUniversity')}</label>
                  <Select
                    value={selectedUniversityId?.toString() || 'all'}
                    onValueChange={(val) => {
                      setSelectedUniversityId(val === 'all' ? null : parseInt(val));
                      setSelectedCourseId(null);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={tList('filterByUniversityPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{tList('allUniversities')}</SelectItem>
                      {universities.map((uni) => (
                        <SelectItem key={uni.id} value={uni.id.toString()}>
                          {uni.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">{tList('filterByCourse')}</label>
                  <Select
                    value={selectedCourseId?.toString() || 'all'}
                    onValueChange={(val) => {
                      setSelectedCourseId(val === 'all' ? null : parseInt(val));
                      setPage(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={tList('filterByCoursePlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{tList('allCourses')}</SelectItem>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id.toString()}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Non-super-admin: Course filter */}
        {!isSuperAdmin && (
          <div className="flex items-center gap-4">
            <div className="w-64">
              <Select
                value={selectedCourseId?.toString() || 'all'}
                onValueChange={(val) => {
                  setSelectedCourseId(val === 'all' ? null : parseInt(val));
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={tList('filterByCoursePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tList('allCourses')}</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Super admin must select university first */}
        {isSuperAdmin && !selectedUniversityId ? (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground">
                {tList('filterByUniversityPlaceholder')}
              </p>
            </CardContent>
          </Card>
        ) : (
          /* Student List Table */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                {tList('title')}
                {totalStudents > 0 && (
                  <Badge variant="secondary">{totalStudents}</Badge>
                )}
              </CardTitle>
              <CardDescription>{tList('description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={students}
                columns={studentColumns}
                loading={studentsLoading}
                search={{
                  value: searchTerm,
                  placeholder: tList('searchPlaceholder'),
                  onSearchChange: (val) => { setSearchTerm(val); setPage(1); }
                }}
                pagination={{
                  page,
                  limit,
                  total: totalStudents,
                  onPageChange: setPage,
                  onLimitChange: setLimit
                }}
                emptyMessage={tList('emptyMessage')}
              />
            </CardContent>
          </Card>
        )}

        {/* Import Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{tImport('title')}</DialogTitle>
              <DialogDescription>{tImport('description')}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Course Select */}
              <div>
                <label className="block text-sm font-medium mb-2">{tImport('selectCourse')}</label>
                <Select
                  value={importCourseId?.toString() || ''}
                  onValueChange={(val) => setImportCourseId(parseInt(val))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={tImport('selectCoursePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">{tImport('selectFile')}</label>
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
                      <p className="text-sm text-muted-foreground">{tImport('dropzone')}</p>
                      <p className="text-xs text-muted-foreground mt-1">{tImport('acceptedFormats')}</p>
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
                    {tImport('results')}
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{tImport('totalRows')}:</span>
                      <span className="font-medium">{importResult.totalRows}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{tImport('created')}:</span>
                      <span className="font-medium text-green-600">{importResult.createdCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{tImport('enrolled')}:</span>
                      <span className="font-medium text-blue-600">{importResult.enrolledCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{tImport('skipped')}:</span>
                      <span className="font-medium">{importResult.skippedCount}</span>
                    </div>
                  </div>

                  {importResult.errors.length > 0 && (
                    <div className="mt-3">
                      <h5 className="text-sm font-medium text-red-600 flex items-center gap-1 mb-2">
                        <XCircle className="h-4 w-4" />
                        {tImport('errorDetails')} ({importResult.errorCount})
                      </h5>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {importResult.errors.map((err, i) => (
                          <div key={i} className="text-xs bg-red-50 dark:bg-red-950/20 rounded px-2 py-1">
                            <span className="font-medium">{tImport('row')} {err.row}:</span>{' '}
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
              <Button variant="outline" onClick={handleCloseDialog}>
                {tImport('cancel')}
              </Button>
              {!importResult && (
                <Button
                  onClick={handleImport}
                  disabled={!importCourseId || !selectedFile || isUploading}
                >
                  {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isUploading ? tImport('uploading') : tImport('upload')}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProfessorOnly>
  );
}
