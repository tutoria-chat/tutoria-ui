'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PageHeader } from '@/components/layout/page-header';
import { ProfessorOnly } from '@/components/auth/role-guard';
import { useAuth } from '@/components/auth/auth-provider';
import { apiClient } from '@/lib/api';
import { ArrowLeft, Loader2, Upload, FileText, Trash2, Download, Sparkles, Cpu, Bot, Eye } from 'lucide-react';
import { DataTable } from '@/components/shared/data-table';
import { FileUpload } from '@/components/ui/file-upload';
import type { Module, ModuleUpdate, Course, File as FileType, TableColumn, BreadcrumbItem, AIModel } from '@/lib/types';
import { AIModelSelector } from '@/components/modules/ai-model-selector';
import Image from 'next/image';

export default function EditModulePage() {
  const router = useRouter();
  const params = useParams();
  const moduleId = Number(params.id);
  const { user } = useAuth();
  const t = useTranslations('modules.edit');
  const tForm = useTranslations('modules.form');
  const tCommon = useTranslations('common');
  const tAI = useTranslations('aiModels');

  const [module, setModule] = useState<Module | null>(null);
  const [originalFormData, setOriginalFormData] = useState<ModuleUpdate>({
    name: '',
    code: '',
    description: '',
    systemPrompt: '',
    tutorLanguage: 'pt-br',
    semester: undefined,
    year: undefined,
    courseId: undefined,
    aiModelId: undefined,
  });
  const [formData, setFormData] = useState<ModuleUpdate>({
    name: '',
    code: '',
    description: '',
    systemPrompt: '',
    tutorLanguage: 'pt-br',
    semester: undefined,
    year: undefined,
    courseId: undefined,
    aiModelId: undefined,
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
  const [selectedAIModel, setSelectedAIModel] = useState<AIModel | null>(null);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [files, setFiles] = useState<FileType[]>([]);
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [viewingFileUrl, setViewingFileUrl] = useState<string | null>(null);
  const [viewingFileName, setViewingFileName] = useState<string>('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<number | null>(null);

  // Check if form has changes
  const hasChanges = () => {
    return (
      formData.name !== originalFormData.name ||
      formData.code !== originalFormData.code ||
      formData.description !== originalFormData.description ||
      formData.systemPrompt !== originalFormData.systemPrompt ||
      formData.tutorLanguage !== originalFormData.tutorLanguage ||
      formData.semester !== originalFormData.semester ||
      formData.year !== originalFormData.year ||
      formData.aiModelId !== originalFormData.aiModelId ||
      (user?.role === 'super_admin' && formData.courseId !== originalFormData.courseId)
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
        systemPrompt: data.systemPrompt || '',
        tutorLanguage: data.tutorLanguage || 'pt-br',
        semester: data.semester,
        year: data.year,
        courseId: data.courseId,
        aiModelId: data.aiModelId,
      };
      setFormData(initialData);
      setOriginalFormData(initialData);

      // Set AI model if available
      if (data.aiModel) {
        setSelectedAIModel(data.aiModel);
      }

      // Set files from module response (reduces API calls)
      if (data.files) {
        setFiles(data.files);
      }
    } catch (error) {
      console.error('Failed to load module:', error);
      setErrors({ load: t('loadError') });
    } finally {
      setIsLoadingData(false);
    }
  }, [moduleId, user, t]);

  const loadCourses = useCallback(async () => {
    if (user?.role !== 'super_admin') return;

    setLoadingCourses(true);
    try {
      // Filter courses by user's university for professors
      const params: Record<string, string | number> = { limit: 1000 };
      if (user?.universityId && user.role !== 'super_admin') {
        params.universityId = user.universityId;
      }
      const response = await apiClient.getCourses(params);
      setCourses(response.items);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoadingCourses(false);
    }
  }, [user]);

  const handleDeleteFile = (fileId: number) => {
    setFileToDelete(fileId);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteFile = async () => {
    if (!fileToDelete) return;

    try {
      await apiClient.deleteFile(fileToDelete);
      setDeleteConfirmOpen(false);
      setFileToDelete(null);
      // Reload module to get updated files list
      await loadModule();
      toast.success(t('fileDeleteSuccess') || 'File deleted', {
        description: t('fileDeleteSuccessDesc') || 'The file has been removed',
      });
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error);
      toast.error(t('fileDeleteError') || 'Error deleting file');
    }
  };

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

    if (user?.role === 'super_admin' && !formData.courseId) {
      newErrors.courseId = tForm('courseRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getFileDisplayName = (file: FileType): string => {
    return file.fileName || file.name || tCommon('noData');
  };

  const handleImprovePrompt = async () => {
    if (!formData.systemPrompt?.trim()) {
      toast.error(tForm('improvePromptNoContent'), {
        description: tForm('improvePromptNoContentDesc'),
      });
      return;
    }

    setIsImprovingPrompt(true);
    try {
      const response = await apiClient.post<{ improved_prompt: string; remaining_improvements: number }>(
        `/modules/${moduleId}/improve-prompt`,
        { current_prompt: formData.systemPrompt }
      );

      setFormData(prev => ({ ...prev, systemPrompt: response.improved_prompt }));
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

      // API client adds moduleId and name to FormData for backend DTO binding
      await apiClient.uploadFile(uploadFormData, moduleId, selectedFile.name);
      form.reset();
      setSelectedFile(null);
      // Reload module to get updated files list
      await loadModule();

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
        systemPrompt: formData.systemPrompt?.trim() || undefined,
        tutorLanguage: formData.tutorLanguage,
        semester: formData.semester,
        year: formData.year,
        aiModelId: selectedAIModel?.id,
      };

      // Only include course_id if user is super_admin
      if (user?.role === 'super_admin' && formData.courseId) {
        updateData.courseId = formData.courseId;
      }

      await apiClient.updateModule(moduleId, updateData);
      toast.success(t('updateSuccess'), {
        description: t('updateSuccessDesc'),
      });
      // Go back to the module details page
      router.push(`/modules/${moduleId}`);
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

        <div className="flex justify-center">
          <Card className="max-w-4xl w-full">
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
                  value={module?.courseName || tCommon('loading')}
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

              {/* AI Tutor Configuration Section */}
              <div className="border-t pt-6 space-y-6">
                <div className="flex items-center space-x-2 mb-2">
                  <Bot className="h-5 w-5 text-blue-500" />
                  <h3 className="text-lg font-semibold">{tForm('aiConfig')}</h3>
                </div>

                {/* AI Model Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Cpu className="h-4 w-4" />
                        {tAI('selectModel')}
                      </div>
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowModelSelector(true)}
                    >
                      {selectedAIModel ? tAI('changeModel') : tAI('selectModelButton')}
                    </Button>
                  </div>
                  <div className="mb-3 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
                    <p className="text-sm text-green-900 dark:text-green-100">
                      {tForm('modelSelectionHint')}
                    </p>
                  </div>
                  {selectedAIModel ? (
                    <div className="p-3 border rounded-md bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Image
                          src={selectedAIModel.provider === 'openai' ? '/openai-logo.svg' : '/anthropic-logo.svg'}
                          alt={selectedAIModel.provider}
                          width={24}
                          height={24}
                        />
                        <div>
                          <span className="font-medium">{selectedAIModel.displayName}</span>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {selectedAIModel.provider === 'openai' ? 'OpenAI' : 'Anthropic'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{tAI('noModelSelected')}</p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="systemPrompt" className="block text-sm font-medium">
                    {t('systemPromptLabel')}
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleImprovePrompt}
                    disabled={isImprovingPrompt || isLoading || !formData.systemPrompt?.trim()}
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
                  id="systemPrompt"
                  value={formData.systemPrompt}
                  onChange={(e) => handleChange('systemPrompt', e.target.value)}
                  placeholder={t('systemPromptPlaceholder')}
                  rows={6}
                  className="font-mono text-sm"
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-muted-foreground">
                    {tForm('charactersCount', { count: (formData.systemPrompt || '').length })}
                    {(formData.systemPrompt || '').length > 0 && (
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

              <div>
                <label htmlFor="tutorLanguage" className="block text-sm font-medium mb-1">
                  {tForm('tutorLanguageLabel')}
                </label>
                <select
                  id="tutorLanguage"
                  value={formData.tutorLanguage || 'pt-br'}
                  onChange={(e) => handleChange('tutorLanguage', e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="pt-br">Português (Brasil)</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
                <p className="text-sm text-muted-foreground mt-1">
                  {tForm('tutorLanguageHint')}
                </p>
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
        </div>

        {/* File Upload Section */}
        <div className="flex justify-center">
          <Card className="max-w-4xl w-full">
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
                translations={{
                  clickToSelect: t('fileUploadClick'),
                  supportedFormats: t('fileUploadFormats'),
                  maxSize: t('fileUploadMaxSize', { maxSizeMB: 50 }),
                }}
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
                  key: 'fileName',
                  label: t('fileColumn'),
                  render: (_, file) => (
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{getFileDisplayName(file)}</span>
                    </div>
                  )
                },
                {
                  key: 'fileSize',
                  label: t('sizeColumn'),
                  render: (value) => value ? `${((value as number) / 1024 / 1024).toFixed(2)} MB` : 'N/A'
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
                            const { downloadUrl } = await apiClient.getFileDownloadUrl(file.id);

                            // Extract filename from URL or use file.fileName
                            const urlParts = downloadUrl.split('/');
                            const fileNameWithParams = urlParts[urlParts.length - 1];
                            const fileName = file.fileName || fileNameWithParams.split('?')[0];

                            setViewingFileUrl(downloadUrl);
                            setViewingFileName(fileName);
                            setFileViewerOpen(true);
                          } catch (error) {
                            console.error('Error loading file:', error);
                            toast.error('Error loading file');
                          }
                        }}
                        title="View file"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFile(file.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )
                }
              ] as TableColumn<FileType>[]}
              loading={isLoadingData}
              emptyMessage={t('noFilesYet')}
            />
          </CardContent>
        </Card>
        </div>

        {/* AI Model Selector Modal */}
        <AIModelSelector
          open={showModelSelector}
          onClose={() => setShowModelSelector(false)}
          selectedModelId={selectedAIModel?.id}
          onSelectModel={(model) => {
            setSelectedAIModel(model);
            handleChange('aiModelId', model.id);
          }}
        />

        {/* File Viewer Dialog */}
        <Dialog open={fileViewerOpen} onOpenChange={setFileViewerOpen}>
          <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] flex flex-col p-0">
            <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
              <DialogTitle className="text-lg">{viewingFileName}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 px-6 pb-6 overflow-hidden">
              {viewingFileUrl && (
                <iframe
                  src={viewingFileUrl}
                  className="w-full h-full border border-border rounded-md"
                  title={viewingFileName}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete File</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this file? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setFileToDelete(null)}>
                {tCommon('buttons.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteFile} className="bg-destructive hover:bg-destructive/90">
                {tCommon('buttons.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ProfessorOnly>
  );
}