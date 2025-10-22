'use client';

import React, { useState, useCallback, useEffect } from 'react';
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
  ExternalLink,
  Youtube,
  Info,
  Lightbulb
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/shared/data-table';
import { FileUpload } from '@/components/ui/file-upload';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  const { data: module, loading: moduleLoading, error: moduleError, refetch: refetchModule } = useFetch<Module & { files?: FileType[] }>(`/api/modules/${moduleId}`);
  const { data: tokensResponse, loading: tokensLoading, refetch: refetchTokens } = useFetch<PaginatedResponse<ModuleAccessToken>>(`/api/moduleaccesstokens/?moduleId=${moduleId}`);

  const files = module?.files || [];
  const tokens = tokensResponse?.items || [];

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [viewingFileUrl, setViewingFileUrl] = useState<string | null>(null);
  const [viewingFileName, setViewingFileName] = useState<string>('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<number | null>(null);
  const [urlDialogOpen, setUrlDialogOpen] = useState(false);
  const [selectedTokenUrl, setSelectedTokenUrl] = useState<string>('');
  // YouTube video upload state
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeVideoName, setYoutubeVideoName] = useState('');
  const [isAddingYoutubeVideo, setIsAddingYoutubeVideo] = useState(false);
  const [youtubeError, setYoutubeError] = useState<string | null>(null);

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

      // Reset form and refetch module data to show new file
      form.reset();
      setSelectedFile(null);
      refetchModule();

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

  const handleAddYoutubeVideo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!youtubeUrl.trim()) {
      setYoutubeError(t('youtubeUrlRequired') || 'YouTube URL is required');
      return;
    }

    // Basic YouTube URL validation
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;
    if (!youtubeRegex.test(youtubeUrl)) {
      setYoutubeError(t('invalidYoutubeUrl') || 'Invalid YouTube URL format');
      return;
    }

    setIsAddingYoutubeVideo(true);
    setYoutubeError(null);

    try {
      const result = await apiClient.addYoutubeVideo({
        youtubeUrl: youtubeUrl.trim(),
        moduleId,
        language: module?.tutorLanguage || 'pt-br',
        name: youtubeVideoName.trim() || undefined
      });

      // Reset form and refetch module data
      setYoutubeUrl('');
      setYoutubeVideoName('');
      refetchModule();

      if (result.status === 'already_exists') {
        toast.info(t('youtubeVideoAlreadyExists') || 'This video already exists in the module', {
          description: t('youtubeVideoAlreadyExistsDesc') || 'The video is already available in your files',
        });
      } else {
        toast.success(t('youtubeVideoAdded') || 'Video sent for upload', {
          description: t('youtubeVideoAddedDesc') || 'Please come back later to verify the full status',
        });
      }
    } catch (error) {
      console.error('Error adding YouTube video:', error);
      const errorMessage = error instanceof Error ? error.message : tCommon('error');
      setYoutubeError(`${t('youtubeError') || 'Error adding YouTube video'}: ${errorMessage}`);

      toast.error(t('youtubeError') || 'Error adding YouTube video', {
        description: errorMessage,
      });
    } finally {
      setIsAddingYoutubeVideo(false);
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    setFileToDelete(fileId);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteFile = async () => {
    if (!fileToDelete) return;

    try {
      await apiClient.deleteFile(fileToDelete);
      setDeleteConfirmOpen(false);
      setFileToDelete(null);
      refetchModule();
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

  const handleViewFile = async (file: FileType) => {
    try {
      // Check if it's a YouTube video (by sourceType or fileType)
      const isYouTube = file.sourceType === 'youtube' || file.fileType === 'video/youtube';

      if (isYouTube) {
        let youtubeUrl = file.sourceUrl;

        // If sourceUrl is missing, fetch from API (happens if .NET API wasn't restarted)
        if (!youtubeUrl) {
          const fileDetails = await apiClient.getFile(file.id);
          youtubeUrl = fileDetails.sourceUrl;
        }

        if (youtubeUrl) {
          // Extract video ID from YouTube URL for embedded player
          const videoId = youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1];
          if (videoId) {
            // Use YouTube embed URL for iframe
            setViewingFileUrl(`https://www.youtube.com/embed/${videoId}`);
            setViewingFileName(file.name || 'YouTube Video');
            setFileViewerOpen(true);
            return;
          }
        }

        // If we still don't have URL, show error
        toast.error(t('viewError') || 'Error loading video', {
          description: 'YouTube URL not found for this video',
        });
        return;
      }

      // For regular files, get download URL and open in viewer
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
      toast.error(t('viewError') || 'Error loading file', {
        description: t('viewErrorDesc') || 'Could not load the file for viewing',
      });
    }
  };

  const getFileDisplayName = (file: FileType): string => {
    return file.fileName || file.name || t('fileNameUnknown');
  };

  const getFileType = (file: FileType): string => {
    // Check if it's a YouTube video (sourceType or fileType)
    if (file.sourceType === 'youtube' || file.fileType === 'video/youtube') {
      return 'YouTube Video';
    }
    return file.contentType || file.fileType || t('fileTypeUnknown');
  };

  const fileColumns: TableColumn<FileType>[] = [
    {
      key: 'fileName',
      label: t('columns.fileName'),
      sortable: true,
      render: (_, file) => {
        const isYouTube = file.sourceType === 'youtube' || file.fileType === 'video/youtube';
        return (
          <div className="flex items-center space-x-3">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
              isYouTube ? 'bg-red-100' : 'bg-blue-100'
            }`}>
              {isYouTube ? (
                <Youtube className="h-5 w-5 text-red-600" />
              ) : (
                <FileText className="h-5 w-5 text-blue-600" />
              )}
            </div>
            <div>
              <div className="font-medium">{getFileDisplayName(file)}</div>
              <div className="text-sm text-muted-foreground">
                {getFileType(file)}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      key: 'sourceType',
      label: t('columns.type') || 'Type',
      sortable: true,
      render: (_, file) => {
        const isYouTube = file.sourceType === 'youtube' || file.fileType === 'video/youtube';
        return (
          <div className="flex flex-col space-y-1">
            <Badge variant={isYouTube ? 'default' : 'secondary'}>
              {isYouTube ? 'YouTube' : t('columns.fileUpload') || 'File'}
            </Badge>
            {isYouTube && file.transcriptionStatus && (
              <Badge
                variant={
                  file.transcriptionStatus === 'completed' ? 'outline' :
                  file.transcriptionStatus === 'failed' ? 'destructive' :
                  'secondary'
                }
              >
                {file.transcriptionStatus === 'completed' ? '✓ ' + (t('columns.transcribed') || 'Transcribed') :
                 file.transcriptionStatus === 'processing' ? (t('columns.processing') || 'Processing...') :
                 file.transcriptionStatus === 'failed' ? (t('columns.failed') || 'Failed') :
                 (t('columns.pending') || 'Pending')}
              </Badge>
            )}
          </div>
        );
      }
    },
    {
      key: 'fileSize',
      label: t('columns.size'),
      sortable: true,
      render: (_, file) => {
        const isYouTube = file.sourceType === 'youtube' || file.fileType === 'video/youtube';

        if (isYouTube) {
          // For YouTube videos, show duration or word count
          if (file.videoDurationSeconds) {
            const minutes = Math.floor(file.videoDurationSeconds / 60);
            const seconds = file.videoDurationSeconds % 60;
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
          }
          if (file.transcriptWordCount) {
            return `${file.transcriptWordCount} ${t('columns.words') || 'words'}`;
          }
          return 'N/A';
        }

        return file.fileSize ? `${((file.fileSize as number) / 1024 / 1024).toFixed(2)} MB` : 'N/A';
      }
    },
    {
      key: 'createdAt',
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
            onClick={() => handleViewFile(file)}
            title={file.sourceType === 'youtube' ? (t('watchOnYoutube') || 'Watch on YouTube') : (t('viewFile') || 'View file')}
          >
            {file.sourceType === 'youtube' ? (
              <ExternalLink className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
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
      key: 'createdAt',
      label: t('createdAt'),
      sortable: true,
      render: (value) => formatDateShort(value as string)
    },
    {
      key: 'actions',
      label: t('columns.actions'),
      width: '140px',
      render: (_, token) => {
        const widgetUrl = `${APP_CONFIG.widgetUrl}/?module_token=${token.token}`;
        return (
          <div className="flex items-center space-x-1">
            {/* Copy URL */}
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(widgetUrl);
                  toast.success(tTokens('copyWidgetUrlSuccess'));
                } catch (error) {
                  toast.error(tTokens('copyError'));
                }
              }}
              title="Copy widget URL"
            >
              <Copy className="h-4 w-4" />
            </Button>

            {/* View URL */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedTokenUrl(widgetUrl);
                setUrlDialogOpen(true);
              }}
              title="View widget URL"
            >
              <Eye className="h-4 w-4" />
            </Button>

            {/* Open in new tab */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(widgetUrl, '_blank')}
              title={t('openInWidget')}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        );
      }
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

        {/* YouTube Video Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>{t('addYoutubeVideo') || 'Add YouTube Video'}</CardTitle>
            <CardDescription>
              {t('addYoutubeVideoDesc') || 'Add a YouTube video URL to transcribe and use as course material'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Tips for better transcription */}
            <Alert className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
              <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-medium mb-2">{t('youtubeTranscriptionTips') || 'Tips for Best Results:'}</p>
                <ul className="space-y-1 ml-4 list-disc text-blue-800 dark:text-blue-200">
                  <li>{t('enableYoutubeTranscripts') || 'Enable subtitles/transcripts on your video for more accurate results'}</li>
                  <li>{t('avoidRegionLocks') || 'Avoid region-restricted videos when possible for faster processing'}</li>
                  <li>{t('publicVideos') || 'Use public or unlisted videos (private videos cannot be processed)'}</li>
                </ul>
              </AlertDescription>
            </Alert>

            <form onSubmit={handleAddYoutubeVideo} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="youtubeUrl" className="text-sm font-medium">
                  {t('youtubeUrl') || 'YouTube URL'}
                </label>
                <input
                  id="youtubeUrl"
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  disabled={isAddingYoutubeVideo}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="youtubeVideoName" className="text-sm font-medium">
                  {t('videoName') || 'Video Name'} ({t('optional') || 'optional'})
                </label>
                <input
                  id="youtubeVideoName"
                  type="text"
                  value={youtubeVideoName}
                  onChange={(e) => setYoutubeVideoName(e.target.value)}
                  placeholder={t('videoNamePlaceholder') || 'e.g., Lecture 1: Introduction'}
                  disabled={isAddingYoutubeVideo}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              {youtubeError && (
                <div className="p-3 bg-destructive/10 border border-destructive/50 rounded-md">
                  <p className="text-sm text-destructive">{youtubeError}</p>
                </div>
              )}

              <Button type="submit" disabled={isAddingYoutubeVideo || !youtubeUrl.trim()}>
                {isAddingYoutubeVideo ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('processing') || 'Processing...'}
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    {t('addVideoButton') || 'Add Video'}
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

      {/* File Viewer Dialog */}
      <Dialog open={fileViewerOpen} onOpenChange={setFileViewerOpen}>
        <DialogContent className={`${
          viewingFileUrl?.includes('youtube.com/embed')
            ? '!max-w-[1400px] !w-[90vw]'
            : '!max-w-[95vw] !w-[95vw] !h-[95vh]'
        } flex flex-col !p-0`}>
          <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
            <DialogTitle className="text-lg">{viewingFileName}</DialogTitle>
          </DialogHeader>
          <div className={`${
            viewingFileUrl?.includes('youtube.com/embed')
              ? 'px-6 pb-6'
              : 'flex-1 px-6 pb-6 overflow-hidden'
          }`}>
            {viewingFileUrl && (
              <iframe
                src={viewingFileUrl}
                className={`w-full border border-border rounded-md ${
                  viewingFileUrl?.includes('youtube.com/embed')
                    ? 'aspect-video'
                    : 'h-full'
                }`}
                title={viewingFileName}
                allow={viewingFileUrl?.includes('youtube.com/embed') ? "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" : undefined}
                allowFullScreen={viewingFileUrl?.includes('youtube.com/embed')}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('columns.deleteFileTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('columns.deleteFileDescription')}
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

      {/* Widget URL Viewer Dialog */}
      <Dialog open={urlDialogOpen} onOpenChange={setUrlDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Widget URL</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-md">
              <code className="text-sm break-all">{selectedTokenUrl}</code>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setUrlDialogOpen(false)}
              >
                Close
              </Button>
              <Button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(selectedTokenUrl);
                    toast.success(tTokens('copyWidgetUrlSuccess'));
                  } catch (error) {
                    toast.error(tTokens('copyError'));
                  }
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy URL
              </Button>
              <Button
                onClick={() => {
                  window.open(selectedTokenUrl, '_blank');
                  setUrlDialogOpen(false);
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Test URL
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
