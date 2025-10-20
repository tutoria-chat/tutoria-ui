'use client';

import React, { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import {
  Edit,
  Upload,
  Trash2,
  Download,
  FileText,
  Calendar,
  BookOpen,
  Bot,
  Loader2,
  ArrowLeft,
  Key,
  Copy,
  Eye,
  ExternalLink
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/shared/data-table';
import { FileUpload } from '@/components/ui/file-upload';
import { ProfessorOnly, AdminOnly } from '@/components/auth/role-guard';
import { TokenModal } from '@/components/tokens/token-modal';
import { useAuth } from '@/components/auth/auth-provider';
import { useFetch } from '@/lib/hooks';
import { apiClient } from '@/lib/api';
import { formatDateShort } from '@/lib/utils';
import { APP_CONFIG } from '@/lib/constants';
import type { Module, File as FileType, ModuleAccessToken, TableColumn, BreadcrumbItem, PaginatedResponse } from '@/lib/types';

export default function ModuleDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const moduleId = Number(params.id);
  const t = useTranslations('modules.detail');
  const tCommon = useTranslations('common');
  const tTokens = useTranslations('tokens.columns');

  // OPTIMIZED: Module endpoint returns files, so no separate call needed
  const { data: module, loading: moduleLoading, error: moduleError } = useFetch<Module & { files?: FileType[] }>(`/modules/${moduleId}`);
  const { data: tokensResponse, loading: tokensLoading, refetch: refetchTokens } = useFetch<PaginatedResponse<ModuleAccessToken>>(`/module-tokens/?moduleId=${moduleId}`);

  const files = module?.files || [];
  const tokens = tokensResponse?.items || [];

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);

  const breadcrumbs: BreadcrumbItem[] = module?.courseId ? [
    { label: tCommon('breadcrumbs.courses'), href: '/courses' },
    { label: module?.courseName || tCommon('breadcrumbs.course'), href: `/courses/${module.courseId}` },
    { label: module?.name || tCommon('loading'), isCurrentPage: true }
  ] : [
    { label: tCommon('breadcrumbs.modules'), href: '/modules' },
    { label: module?.name || tCommon('loading'), isCurrentPage: true }
  ];

  const handleFileUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (!selectedFile) {
      setUploadError(t('fileSelectError'));
      return;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setUploadError(t('fileTooLarge'));
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
      setUploadError(t('fileTypeNotSupported'));
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', selectedFile);

      // Pass module_id and file name as query parameters
      await apiClient.uploadFile(uploadFormData, moduleId, selectedFile.name);

      // Reset form and reload page to show new file
      form.reset();
      setSelectedFile(null);
      window.location.reload();

      toast.success(t('fileUploadSuccess'), {
        description: t('fileUploadSuccessDesc', { fileName: selectedFile.name }),
      });
    } catch (error) {
      console.error('Erro ao enviar arquivo:', error);
      const errorMessage = error instanceof Error ? error.message : tCommon('error');
      setUploadError(`${t('fileUploadError')}: ${errorMessage}`);

      toast.error(t('fileUploadError'), {
        description: errorMessage,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    if (!confirm(t('columns.deleteConfirm', { ns: 'modules' }))) {
      return;
    }

    try {
      await apiClient.deleteFile(fileId);
      window.location.reload();
      toast.success(t('fileDeleteSuccess'), {
        description: t('fileDeleteSuccessDesc'),
      });
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error);
      toast.error(t('fileDeleteError'), {
        description: t('fileDeleteErrorDesc'),
      });
    }
  };

  const handleDownloadFile = async (fileId: number) => {
    try {
      const { download_url } = await apiClient.getFileDownloadUrl(fileId);
      window.open(download_url, '_blank');
      toast.success(t('downloadStarted'), {
        description: t('downloadStartedDesc'),
      });
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
      toast.error(t('downloadError'), {
        description: t('downloadErrorDesc'),
      });
    }
  };

  const getFileDisplayName = (file: FileType): string => {
    return file.fileName || file.name || t('fileNameUnknown');
  };

  const getFileType = (file: FileType): string => {
    return file.contentType || file.fileType || t('fileTypeUnknown');
  };

  const fileColumns: TableColumn<FileType>[] = [
    {
      key: 'file_name',
      label: t('columns.fileName'),
      sortable: true,
      render: (_, file) => (
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="font-medium">{getFileDisplayName(file)}</div>
            <div className="text-sm text-muted-foreground">
              {getFileType(file)}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'file_size',
      label: t('columns.size'),
      sortable: true,
      render: (value) => `${((value as number) / 1024 / 1024).toFixed(2)} MB`
    },
    {
      key: 'created_at',
      label: t('columns.uploadedAt'),
      sortable: true,
      render: (value) => formatDateShort(value as string)
    },
    {
      key: 'actions',
      label: t('columns.actions'),
      width: '120px',
      render: (_, file) => (
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDownloadFile(file.id)}
          >
            <Download className="h-4 w-4" />
          </Button>

          <ProfessorOnly>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteFile(file.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </ProfessorOnly>
        </div>
      )
    }
  ];

  const tokenColumns: TableColumn<ModuleAccessToken>[] = [
    {
      key: 'name',
      label: tTokens('tokenName'),
      sortable: true,
      render: (value, token) => (
        <div>
          <div className="font-medium">{value}</div>
          {token.description && (
            <div className="text-sm text-muted-foreground line-clamp-1 max-w-xs">
              {token.description}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'token',
      label: tTokens('token'),
      render: (value) => (
        <div className="flex items-center space-x-2">
          <code className="text-xs bg-muted px-2 py-1 rounded">
            {(value as string).substring(0, 16)}...
          </code>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(value as string);
                toast.success(t('tokenCopied'));
              } catch (error) {
                toast.error(t('tokenCopyError'));
              }
            }}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      )
    },
    {
      key: 'allowChat',
      label: tTokens('chat'),
      render: (value) => (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? tTokens('allowed') : tTokens('blocked')}
        </Badge>
      )
    },
    {
      key: 'allowFileAccess',
      label: tTokens('files'),
      render: (value) => (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? tTokens('allowed') : tTokens('blocked')}
        </Badge>
      )
    },
    {
      key: 'isActive',
      label: tTokens('status'),
      render: (value) => (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? tTokens('active') : tTokens('inactive')}
        </Badge>
      )
    },
    {
      key: 'created_at',
      label: t('createdAt'),
      sortable: true,
      render: (value) => formatDateShort(value as string)
    },
    {
      key: 'actions',
      label: t('columns.actions'),
      width: '80px',
      render: (_, token) => (
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const widgetUrl = `${APP_CONFIG.widgetUrl}/?module_token=${token.token}`;
              window.open(widgetUrl, '_blank');
            }}
            title={t('openInWidget')}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  if (moduleLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (moduleError || !module) {
    // Smart back navigation based on user role and context
    const getBackUrl = () => {
      // Try to use the browser's history first
      if (typeof window !== 'undefined' && window.history.length > 1) {
        const referrer = document.referrer;
        // If came from within our app (not external), use browser back
        if (referrer && referrer.includes(window.location.origin)) {
          // Check if referrer was a course page or university page
          const courseMatch = referrer.match(/\/courses\/(\d+)/);
          const universityMatch = referrer.match(/\/universities\/(\d+)/);

          if (courseMatch) {
            return `/courses/${courseMatch[1]}`;
          }
          if (universityMatch) {
            return `/universities/${universityMatch[1]}`;
          }
        }
      }

      // Fallback based on user role
      if (user?.role === 'super_admin') {
        return '/modules';
      } else if (user?.universityId) {
        return `/universities/${user.universityId}`;
      }

      // Last resort fallback
      return '/dashboard';
    };

    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-destructive">{tCommon('error')}</p>
        <Button onClick={() => router.push(getBackUrl())}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {tCommon('buttons.back')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={module.name}
        description={`${t('moduleInfo')} - ${module.courseName || tCommon('breadcrumbs.course')}`}
        breadcrumbs={breadcrumbs}
        actions={
          <ProfessorOnly>
            <div className="flex items-center space-x-2">
              {module.courseId && (
                <Button variant="outline" asChild>
                  <Link href={`/courses/${module.courseId}`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('viewCourse')}
                  </Link>
                </Button>
              )}
              <AdminOnly>
                <Button variant="outline" onClick={() => setTokenModalOpen(true)}>
                  <Key className="mr-2 h-4 w-4" />
                  {t('createToken')}
                </Button>
              </AdminOnly>
              <Button asChild>
                <Link href={`/modules/${moduleId}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  {t('editModule')}
                </Link>
              </Button>
            </div>
          </ProfessorOnly>
        }
      />

      {/* Module Information */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('moduleInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {module.description && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">{t('description')}</h4>
                <p className="text-sm leading-relaxed">{module.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              {module.code && (
                <div>
                  <p className="text-muted-foreground">{t('code')}</p>
                  <p className="font-medium font-mono">{module.code}</p>
                </div>
              )}
              {module.semester && (
                <div>
                  <p className="text-muted-foreground">{t('semester')}</p>
                  <p className="font-medium">{module.semester}</p>
                </div>
              )}
              {module.year && (
                <div>
                  <p className="text-muted-foreground">{t('year')}</p>
                  <p className="font-medium">{module.year}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">{t('createdAt')}</p>
                <p className="font-medium">{formatDateShort(module.createdAt)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Bot className={`h-4 w-4 ${module.systemPrompt ? 'text-green-500' : 'text-muted-foreground'}`} />
              <Badge variant={module.systemPrompt ? "default" : "secondary"}>
                {module.systemPrompt ? t('aiTutorConfigured') : t('aiTutorNotConfigured')}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('stats')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{files?.length || 0}</p>
                <p className="text-sm text-muted-foreground">{t('files')}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>

            <AdminOnly>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{module.tokensCount || 0}</p>
                  <p className="text-sm text-muted-foreground">{t('accessTokens')}</p>
                </div>
                <BookOpen className="h-8 w-8 text-purple-500" />
              </div>
            </AdminOnly>
          </CardContent>
        </Card>
      </div>

      {/* File Upload Section */}
      <ProfessorOnly>
        <Card>
          <CardHeader>
            <CardTitle>{t('uploadFile')}</CardTitle>
            <CardDescription>
              {t('uploadFileDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFileUpload} className="space-y-4">
              <FileUpload
                onFileSelect={setSelectedFile}
                disabled={isUploading}
                selectedFile={selectedFile}
                maxSizeMB={50}
                translations={{
                  clickToSelect: t('fileUpload.clickToSelect'),
                  supportedFormats: t('fileUpload.supportedFormats'),
                  maxSize: t('fileUpload.maxSize', { maxSizeMB: 50 })
                }}
              />

              {uploadError && (
                <div className="p-3 bg-destructive/10 border border-destructive/50 rounded-md">
                  <p className="text-sm text-destructive">{uploadError}</p>
                </div>
              )}

              <Button type="submit" disabled={isUploading || !selectedFile}>
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('uploading')}
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    {t('uploadButton')}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </ProfessorOnly>

      {/* Files List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('moduleFiles')}</CardTitle>
          <CardDescription>
            {t('filesAvailable')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={files || []}
            columns={fileColumns}
            loading={moduleLoading}
            emptyMessage={t('noFiles')}
          />
        </CardContent>
      </Card>

      {/* Module Tokens */}
      <AdminOnly>
        <Card>
          <CardHeader>
            <CardTitle>{t('moduleTokens')}</CardTitle>
            <CardDescription>
              {t('tokensGenerated')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={tokens || []}
              columns={tokenColumns}
              loading={tokensLoading}
              emptyMessage={t('noTokens')}
            />
          </CardContent>
        </Card>
      </AdminOnly>

      {/* Token Creation Modal */}
      <TokenModal
        mode="create"
        open={tokenModalOpen}
        onClose={() => setTokenModalOpen(false)}
        onSuccess={() => {
          setTokenModalOpen(false);
          refetchTokens?.();
          toast.success(t('tokenCreatedSuccess'));
        }}
        preselectedModuleId={moduleId}
      />
    </div>
  );
}
