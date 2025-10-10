'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectItem } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { ProfessorOnly } from '@/components/auth/role-guard';
import { useAuth } from '@/components/auth/auth-provider';
import { apiClient } from '@/lib/api';
import { ArrowLeft, Loader2, Upload, FileText, Trash2, Download, Sparkles } from 'lucide-react';
import { DataTable } from '@/components/shared/data-table';
import { FileUpload } from '@/components/ui/file-upload';
import { useFetch } from '@/lib/hooks';
import type { Module, ModuleUpdate, Course, File as FileType, TableColumn, BreadcrumbItem, PaginatedResponse } from '@/lib/types';

export default function EditModulePage() {
  const router = useRouter();
  const params = useParams();
  const moduleId = Number(params.id);
  const { user } = useAuth();
  const t = useTranslations('modules.edit');
  const tForm = useTranslations('modules.form');
  const tCommon = useTranslations('common');

  const [module, setModule] = useState<Module | null>(null);
  const [originalFormData, setOriginalFormData] = useState<ModuleUpdate>({
    name: '',
    code: '',
    description: '',
    system_prompt: '',
    semester: undefined,
    year: undefined,
    course_id: undefined,
  });
  const [formData, setFormData] = useState<ModuleUpdate>({
    name: '',
    code: '',
    description: '',
    system_prompt: '',
    semester: undefined,
    year: undefined,
    course_id: undefined,
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImprovingPrompt, setIsImprovingPrompt] = useState(false);
  const [remainingImprovements, setRemainingImprovements] = useState<number | null>(null);

  const { data: filesResponse, loading: filesLoading, refetch: refetchFiles } = useFetch<PaginatedResponse<FileType>>(`/files/?module_id=${moduleId}`);

  const files = filesResponse?.items || [];

  // Check if form has changes
  const hasChanges = () => {
    return (
      formData.name !== originalFormData.name ||
      formData.code !== originalFormData.code ||
      formData.description !== originalFormData.description ||
      formData.system_prompt !== originalFormData.system_prompt ||
      formData.semester !== originalFormData.semester ||
      formData.year !== originalFormData.year ||
      (user?.role === 'super_admin' && formData.course_id !== originalFormData.course_id)
    );
  };

  const loadModule = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const data = await apiClient.getModule(moduleId);

      // For regular professors, they can only see modules in their assigned courses
      // The API handles this filtering, so no additional check needed here

      setModule(data);
      const initialData = {
        name: data.name,
        code: data.code || '',
        description: data.description || '',
        system_prompt: data.system_prompt || '',
        semester: data.semester,
        year: data.year,
        course_id: data.course_id,
      };
      setFormData(initialData);
      setOriginalFormData(initialData);
    } catch (error) {
      console.error('Failed to load module:', error);
      setErrors({ load: t('loadError') });
    } finally {
      setIsLoadingData(false);
    }
  }, [moduleId, user]);

  const loadCourses = useCallback(async () => {
    if (user?.role !== 'super_admin') return;

    setLoadingCourses(true);
    try {
      // Filter courses by user's university for professors
      const params: Record<string, string | number> = { limit: 1000 };
      if (user?.university_id && user.role !== 'super_admin') {
        params.university_id = user.university_id;
      }
      const response = await apiClient.getCourses(params);
      setCourses(response.items);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoadingCourses(false);
    }
  }, [user]);

  useEffect(() => {
    loadModule();
    loadCourses();
  }, [loadModule, loadCourses]);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: tCommon('breadcrumbs.modules'), href: '/modules' },
    { label: module?.name || tCommon('loading'), href: `/modules/${moduleId}` },
    { label: tCommon('buttons.edit'), isCurrentPage: true }
  ];

  const handleChange = (field: keyof ModuleUpdate, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = tForm('nameRequired');
    }

    if (user?.role === 'super_admin' && !formData.course_id) {
      newErrors.course_id = tForm('courseRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getFileDisplayName = (file: FileType): string => {
    return file.file_name || file.name || tCommon('noData');
  };

  const handleImprovePrompt = async () => {
    if (!formData.system_prompt?.trim()) {
      toast.error(tForm('improvePromptNoContent'), {
        description: tForm('improvePromptNoContentDesc'),
      });
      return;
    }

    setIsImprovingPrompt(true);
    try {
      const response = await apiClient.post<{ improved_prompt: string; remaining_improvements: number }>(
        `/modules/${moduleId}/improve-prompt`,
        { current_prompt: formData.system_prompt }
      );

      setFormData(prev => ({ ...prev, system_prompt: response.improved_prompt }));
      setRemainingImprovements(response.remaining_improvements);

      toast.success(tForm('improveSuccess'), {
        description: tForm('improveSuccessDesc', { count: response.remaining_improvements }),
      });
    } catch (error: any) {
      console.error('Error improving prompt:', error);
      const errorMsg = error?.response?.data?.detail || error.message || tCommon('error');
      toast.error(tForm('improveError'), {
        description: errorMsg,
      });
    } finally {
      setIsImprovingPrompt(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (!selectedFile) {
      setUploadError(tForm('improvePromptNoContent', { ns: 'modules.detail' }));
      return;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setUploadError(t('fileTooLarge', { ns: 'modules.detail' }));
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setUploadError(t('fileTypeNotSupported', { ns: 'modules.detail' }));
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', selectedFile);

      // Pass module_id and file name as query parameters
      await apiClient.uploadFile(uploadFormData, moduleId, selectedFile.name);
      form.reset();
      setSelectedFile(null);
      refetchFiles?.();

      toast.success(t('fileUploadSuccess', { ns: 'modules.detail' }), {
        description: t('fileUploadSuccessDesc', { fileName: selectedFile.name, ns: 'modules.detail' }),
      });
    } catch (error) {
      console.error('Erro ao enviar arquivo:', error);
      const errorMessage = error instanceof Error ? error.message : tCommon('error');
      setUploadError(`${t('fileUploadError', { ns: 'modules.detail' })}: ${errorMessage}`);

      toast.error(t('fileUploadError', { ns: 'modules.detail' }), {
        description: errorMessage,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // Prepare data for API - remove undefined values and ensure proper types
      const updateData: ModuleUpdate = {
        name: formData.name?.trim(),
        code: formData.code?.trim() || undefined,
        description: formData.description?.trim() || undefined,
        system_prompt: formData.system_prompt?.trim() || undefined,
        semester: formData.semester,
        year: formData.year,
      };

      // Only include course_id if user is super_admin
      if (user?.role === 'super_admin' && formData.course_id) {
        updateData.course_id = formData.course_id;
      }

      await apiClient.updateModule(moduleId, updateData);
      // Go back to the course page or module details
      if (module?.course_id) {
        router.push(`/courses/${module.course_id}`);
      } else {
        router.push(`/modules/${moduleId}`);
      }
    } catch (error) {
      console.error('Failed to update module:', error);
      setErrors({ submit: t('updateError') });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <ProfessorOnly>
        <div className="space-y-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </ProfessorOnly>
    );
  }

  if (errors.load) {
    return (
      <ProfessorOnly>
        <div className="space-y-6">
          <PageHeader
            title={tCommon('error')}
            description={t('loadErrorDesc')}
            breadcrumbs={breadcrumbs}
          />
          <Card>
            <CardContent className="pt-6">
              <p className="text-destructive">{errors.load}</p>
              <Button onClick={() => router.back()} className="mt-4">
                {t('back')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </ProfessorOnly>
    );
  }

  return (
    <ProfessorOnly>
      <div className="space-y-6">
        <PageHeader
          title={t('title')}
          description={t('description', { name: module?.name || '' })}
          breadcrumbs={breadcrumbs}
          actions={
            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('back')}
            </Button>
          }
        />

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>{t('moduleInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  {t('nameLabel')}
                </label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder={t('namePlaceholder')}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-destructive mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="code" className="block text-sm font-medium mb-1">
                  {t('codeLabel')}
                </label>
                <Input
                  id="code"
                  type="text"
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value)}
                  placeholder={t('codePlaceholder')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="semester" className="block text-sm font-medium mb-1">
                    {t('semesterLabel')}
                  </label>
                  <Input
                    id="semester"
                    type="number"
                    value={formData.semester || ''}
                    onChange={(e) => handleChange('semester', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder={t('semesterPlaceholder')}
                    min="1"
                    max="12"
                  />
                </div>

                <div>
                  <label htmlFor="year" className="block text-sm font-medium mb-1">
                    {t('yearLabel')}
                  </label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year || ''}
                    onChange={(e) => handleChange('year', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder={t('yearPlaceholder')}
                    min="2000"
                    max="2100"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="course_name" className="block text-sm font-medium mb-1">
                  {t('courseLabel')}
                </label>
                <Input
                  id="course_name"
                  value={module?.course_name || tCommon('loading')}
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {t('courseCannotChange')}
                </p>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1">
                  {t('descriptionLabel')}
                </label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder={t('descriptionPlaceholder')}
                  rows={3}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="system_prompt" className="block text-sm font-medium">
                    {t('systemPromptLabel')}
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleImprovePrompt}
                    disabled={isImprovingPrompt || isLoading || !formData.system_prompt?.trim()}
                  >
                    {isImprovingPrompt ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        {tForm('improving')}
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-3 w-3" />
                        {tForm('improveWithAI')}
                      </>
                    )}
                  </Button>
                </div>
                <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    {tForm('promptExplanation')}
                  </p>
                </div>
                <Textarea
                  id="system_prompt"
                  value={formData.system_prompt}
                  onChange={(e) => handleChange('system_prompt', e.target.value)}
                  placeholder={t('systemPromptPlaceholder')}
                  rows={6}
                  className="font-mono text-sm"
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-muted-foreground">
                    {tForm('charactersCount', { count: (formData.system_prompt || '').length })}
                    {(formData.system_prompt || '').length > 0 && (
                      <span className="ml-2 text-green-600">{tForm('configured')}</span>
                    )}
                  </p>
                  {remainingImprovements !== null && (
                    <p className="text-xs text-muted-foreground">
                      {tForm('remainingImprovements', { count: remainingImprovements })}
                    </p>
                  )}
                </div>
              </div>

              {errors.submit && (
                <p className="text-sm text-destructive">{errors.submit}</p>
              )}

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={isLoading || !hasChanges()}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('saveChanges')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
                >
                  {t('cancel')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* File Upload Section */}
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>{t('moduleFiles')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleFileUpload} className="space-y-4">
              <FileUpload
                onFileSelect={setSelectedFile}
                disabled={isUploading}
                selectedFile={selectedFile}
                maxSizeMB={50}
              />

              {uploadError && (
                <div className="p-3 bg-destructive/10 border border-destructive/50 rounded-md">
                  <p className="text-sm text-destructive">{uploadError}</p>
                </div>
              )}

              <Button type="submit" disabled={isUploading || !selectedFile} variant="outline">
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('uploading')}
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    {t('uploadFile')}
                  </>
                )}
              </Button>
            </form>

            <DataTable
              data={files || []}
              columns={[
                {
                  key: 'file_name',
                  label: t('fileColumn'),
                  render: (_, file) => (
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{getFileDisplayName(file)}</span>
                    </div>
                  )
                },
                {
                  key: 'file_size',
                  label: t('sizeColumn'),
                  render: (value) => `${((value as number) / 1024 / 1024).toFixed(2)} MB`
                },
                {
                  key: 'actions',
                  label: t('actionsColumn'),
                  width: '100px',
                  render: (_, file) => (
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            const { download_url } = await apiClient.getFileDownloadUrl(file.id);
                            window.open(download_url, '_blank');
                          } catch (error) {
                            console.error('Erro ao baixar arquivo:', error);
                          }
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          if (confirm(t('confirmDelete'))) {
                            try {
                              await apiClient.deleteFile(file.id);
                              refetchFiles?.();
                            } catch (error) {
                              console.error('Erro ao deletar arquivo:', error);
                            }
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )
                }
              ] as TableColumn<FileType>[]}
              loading={filesLoading}
              emptyMessage={t('noFilesYet')}
            />
          </CardContent>
        </Card>
      </div>
    </ProfessorOnly>
  );
}