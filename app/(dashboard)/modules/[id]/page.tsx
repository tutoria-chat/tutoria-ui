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
  Lightbulb,
  Plus,
  RefreshCw,
  Brain,
  ClipboardList,
  Sparkles,
  HelpCircle
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ProfessorOnly, AdminOnly } from '@/components/auth/role-guard';
import { TokenModal } from '@/components/tokens/token-modal';
import { useAuth } from '@/components/auth/auth-provider';
import { useFetch } from '@/lib/hooks';
import { apiClient } from '@/lib/api';
import { formatDateShort, formatDateTimeShort, isValidYouTubeUrl } from '@/lib/utils';
import { APP_CONFIG } from '@/lib/constants';
import type { Module, File as FileType, ModuleAccessToken, TableColumn, BreadcrumbItem, PaginatedResponse, QuizQuestion, ExtractedQuestion, UniversityLimits } from '@/lib/types';

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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [viewingFileUrl, setViewingFileUrl] = useState<string | null>(null);
  const [viewingFileName, setViewingFileName] = useState<string>('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<number | null>(null);
  const [urlDialogOpen, setUrlDialogOpen] = useState(false);
  const [selectedTokenUrl, setSelectedTokenUrl] = useState<string>('');
  // Upload modal states
  const [fileUploadModalOpen, setFileUploadModalOpen] = useState(false);
  const [youtubeUploadModalOpen, setYoutubeUploadModalOpen] = useState(false);
  // YouTube video upload state
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeVideoName, setYoutubeVideoName] = useState('');
  const [youtubeLanguage, setYoutubeLanguage] = useState<string>('pt-br'); // Default to Portuguese, user-selectable
  const [isAddingYoutubeVideo, setIsAddingYoutubeVideo] = useState(false);
  const [youtubeError, setYoutubeError] = useState<string | null>(null);
  // AI Config update state
  const [isUpdatingAIConfig, setIsUpdatingAIConfig] = useState(false);

  // Quiz Bank state
  const tQuiz = useTranslations('quizBank');
  const [quizzes, setQuizzes] = useState<QuizQuestion[]>([]);
  const [quizzesLoading, setQuizzesLoading] = useState(false);
  const [quizUploadModalOpen, setQuizUploadModalOpen] = useState(false);
  const [quizSelectedFile, setQuizSelectedFile] = useState<File[]>([]);
  const [isExtractingQuiz, setIsExtractingQuiz] = useState(false);
  const [extractedQuestions, setExtractedQuestions] = useState<ExtractedQuestion[]>([]);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [isConfirmingQuizzes, setIsConfirmingQuizzes] = useState(false);
  const [isGeneratingQuizzes, setIsGeneratingQuizzes] = useState(false);
  const [viewQuizDialogOpen, setViewQuizDialogOpen] = useState(false);
  const [viewingQuiz, setViewingQuiz] = useState<QuizQuestion | null>(null);
  const [deleteQuizConfirmOpen, setDeleteQuizConfirmOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<number | null>(null);
  const [universityLimits, setUniversityLimits] = useState<UniversityLimits | null>(null);

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

    if (selectedFiles.length === 0) {
      setUploadError(t('fileSelectError'));
      return;
    }

    // Validate file size and type for all files
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    // Validate all files before uploading
    for (const file of selectedFiles) {
      if (file.size > maxSize) {
        setUploadError(`${file.name}: ${t('fileTooLarge')}`);
        return;
      }
      if (!allowedTypes.includes(file.type)) {
        setUploadError(`${file.name}: ${t('fileTypeNotSupported')}`);
        return;
      }
    }

    setIsUploading(true);
    setUploadError(null);

    const successfulUploads: string[] = [];
    const failedUploads: { fileName: string; error: string }[] = [];

    try {
      // Upload files sequentially to avoid overwhelming the server
      for (const file of selectedFiles) {
        try {
          const uploadFormData = new FormData();
          uploadFormData.append('File', file); // Capital 'F' - matches backend DTO property name
          await apiClient.uploadFile(uploadFormData, moduleId, file.name);
          successfulUploads.push(file.name);
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          const errorMessage = error instanceof Error ? error.message : tCommon('error');
          failedUploads.push({ fileName: file.name, error: errorMessage });
        }
      }

      // Reset form and refetch module data
      form.reset();
      setSelectedFiles([]);
      refetchModule();

      // Show results
      if (failedUploads.length === 0) {
        // All succeeded
        setFileUploadModalOpen(false);
        toast.success(t('fileUploadSuccess'), {
          description: `${successfulUploads.length} file(s) uploaded successfully`,
        });
      } else if (successfulUploads.length === 0) {
        // All failed
        setUploadError(`${t('fileUploadError')}: ${failedUploads.map(f => f.fileName).join(', ')}`);
        toast.error(t('fileUploadError'), {
          description: `Failed to upload ${failedUploads.length} file(s)`,
        });
      } else {
        // Partial success
        setFileUploadModalOpen(false);
        toast.warning('Partial Upload Success', {
          description: `${successfulUploads.length} succeeded, ${failedUploads.length} failed`,
        });
      }
    } catch (error) {
      console.error('Unexpected error during upload:', error);
      const errorMsg = error instanceof Error ? error.message : tCommon('error');
      setUploadError(`${t('fileUploadError')}: ${errorMsg}`);
      toast.error(t('fileUploadError'), {
        description: errorMsg,
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

    // Comprehensive YouTube URL validation (handles all formats including Shorts, embed, with params, etc.)
    if (!isValidYouTubeUrl(youtubeUrl)) {
      setYoutubeError(t('invalidYoutubeUrl') || 'Invalid YouTube URL format');
      return;
    }

    setIsAddingYoutubeVideo(true);
    setYoutubeError(null);

    try {
      const result = await apiClient.addYoutubeVideo({
        youtubeUrl: youtubeUrl.trim(),
        moduleId,
        language: youtubeLanguage, // Use user-selected language
        name: youtubeVideoName.trim() || undefined
      });

      // Reset form and close modal
      setYoutubeUrl('');
      setYoutubeVideoName('');
      setYoutubeLanguage('pt-br'); // Reset to default language
      setYoutubeUploadModalOpen(false);

      if (result.status === 'already_exists') {
        toast.info(t('youtubeVideoAlreadyExists') || 'This video already exists in the module', {
          description: t('youtubeVideoAlreadyExistsDesc') || 'The video is already available in your files',
        });
        // No need to refetch since file already exists
      } else {
        // Optimistic update: Refetch only files (via module refetch, but backend returns full module with updated files)
        // This is more efficient than a separate files endpoint call
        refetchModule();

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
      // Don't refetch on error - keep existing state
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

  /**
   * Triggers on-demand file text extraction for this module.
   * Quiz generation is handled separately in the Quiz Bank tab.
   */
  const handleUpdateAIConfig = async () => {
    setIsUpdatingAIConfig(true);
    try {
      const extractResult = await apiClient.extractModuleTexts(moduleId, true);

      toast.success(t('updateAIConfigSuccess'), {
        description: t('extractionResult', { count: extractResult.extracted_count }),
      });
    } catch (error) {
      console.error('AI config update error:', error);
      toast.error(t('updateAIConfigError'), {
        description: t('updateAIConfigErrorDesc'),
      });
    } finally {
      setIsUpdatingAIConfig(false);
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

  // Quiz Bank functions
  const loadQuizzes = useCallback(async () => {
    setQuizzesLoading(true);
    try {
      const data = await apiClient.getModuleQuizzes(moduleId);
      setQuizzes(data);
    } catch (err) {
      console.error('Failed to load quizzes:', err);
    } finally {
      setQuizzesLoading(false);
    }
  }, [moduleId]);

  const loadUniversityLimits = useCallback(async () => {
    try {
      const limits = await apiClient.getUniversityLimits();
      setUniversityLimits(limits);
    } catch (err) {
      console.error('Failed to load university limits:', err);
    }
  }, []);

  useEffect(() => {
    loadQuizzes();
    loadUniversityLimits();
  }, [loadQuizzes, loadUniversityLimits]);

  const handleQuizFileUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (quizSelectedFile.length === 0) return;

    setIsExtractingQuiz(true);
    try {
      const result = await apiClient.uploadQuizFile(moduleId, quizSelectedFile[0]);
      if (result.questions && result.questions.length > 0) {
        const questions = result.questions.map((q: ExtractedQuestion) => ({ ...q, selected: true }));
        setExtractedQuestions(questions);
        setQuizUploadModalOpen(false);
        setQuizSelectedFile([]);
        setReviewDialogOpen(true);
      } else {
        toast.error(tQuiz('review.noQuestionsExtracted'));
      }
    } catch (err) {
      console.error('Failed to extract quizzes:', err);
      toast.error(tQuiz('uploadError'));
    } finally {
      setIsExtractingQuiz(false);
    }
  };

  const handleConfirmQuizzes = async () => {
    const selected = extractedQuestions.filter(q => q.selected !== false);
    if (selected.length === 0) return;

    setIsConfirmingQuizzes(true);
    try {
      await apiClient.confirmExtractedQuizzes(moduleId, selected);
      toast.success(tQuiz('uploadSuccess'));
      setReviewDialogOpen(false);
      setExtractedQuestions([]);
      loadQuizzes();
    } catch (err) {
      console.error('Failed to confirm quizzes:', err);
      toast.error(tQuiz('uploadError'));
    } finally {
      setIsConfirmingQuizzes(false);
    }
  };

  const handleGenerateQuizzes = async () => {
    setIsGeneratingQuizzes(true);
    try {
      await apiClient.generateModuleQuizzes(moduleId, true, 50);
      toast.success(tQuiz('generateSuccess'));
      loadQuizzes();
    } catch (err) {
      console.error('Failed to generate quizzes:', err);
      toast.error(tQuiz('generateError'));
    } finally {
      setIsGeneratingQuizzes(false);
    }
  };

  const confirmDeleteQuiz = async () => {
    if (!quizToDelete) return;
    try {
      await apiClient.deleteQuiz(moduleId, quizToDelete);
      toast.success(tQuiz('deleteSuccess'));
      setDeleteQuizConfirmOpen(false);
      setQuizToDelete(null);
      loadQuizzes();
    } catch (err) {
      console.error('Failed to delete quiz:', err);
      toast.error(tQuiz('deleteError'));
    }
  };

  const canGenerateWithAI = user?.role === 'super_admin' || universityLimits?.hasAIQuizzes;

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
      key: 'processingStatus',
      label: t('columns.processingStatus'),
      render: (_, file) => {
        const status = file.processingStatus;
        if (!status) {
          return (
            <Badge variant="secondary" className="text-gray-600 dark:text-gray-400">
              {t('columns.statusUploaded')}
            </Badge>
          );
        }
        switch (status) {
          case 'pending':
            return (
              <Badge variant="outline" className="text-yellow-600 border-yellow-300 dark:text-yellow-400 dark:border-yellow-700">
                {t('columns.statusPreparing')}
              </Badge>
            );
          case 'processing':
            return (
              <Badge variant="outline" className="text-blue-600 border-blue-300 dark:text-blue-400 dark:border-blue-700">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                {t('columns.statusProcessing')}
              </Badge>
            );
          case 'ready':
            return (
              <Badge variant="outline" className="text-green-600 border-green-300 dark:text-green-400 dark:border-green-700">
                {t('columns.statusReady')}
              </Badge>
            );
          case 'failed':
            return (
              <Badge variant="destructive">
                {t('columns.statusFailed')}
              </Badge>
            );
          default:
            return (
              <Badge variant="secondary" className="text-gray-600 dark:text-gray-400">
                {t('columns.statusUploaded')}
              </Badge>
            );
        }
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
      render: (value) => formatDateTimeShort(value as string)
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
              title={tTokens('actionButtons.copyWidgetUrl')}
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
              title={tTokens('actionButtons.viewWidgetUrl')}
            >
              <Eye className="h-4 w-4" />
            </Button>

            {/* Open in new tab */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(widgetUrl, '_blank')}
              title={tTokens('actionButtons.openWidget')}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        );
      }
    }
  ];

  const quizColumns: TableColumn<QuizQuestion>[] = [
    {
      key: 'question_number',
      label: tQuiz('columns.number'),
      sortable: true,
      width: '60px',
      render: (value) => <span className="font-mono text-sm">{value as number}</span>,
    },
    {
      key: 'question_text',
      label: tQuiz('columns.question'),
      sortable: false,
      render: (_, quiz) => (
        <div className="max-w-[300px] truncate text-sm" title={quiz.question_text}>
          {quiz.question_text}
        </div>
      ),
    },
    {
      key: 'difficulty',
      label: tQuiz('columns.difficulty'),
      sortable: true,
      width: '100px',
      render: (value) => {
        const diff = value as string;
        const variant = diff === 'easy' ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400' :
                        diff === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-400' :
                        'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400';
        return <Badge className={variant}>{tQuiz(`difficulty.${diff}`)}</Badge>;
      },
    },
    {
      key: 'correct_answer',
      label: tQuiz('columns.answer'),
      sortable: false,
      width: '80px',
      render: (value) => <Badge variant="outline" className="font-mono">{value as string}</Badge>,
    },
    {
      key: 'source',
      label: tQuiz('columns.source'),
      sortable: true,
      width: '120px',
      render: (_, quiz) => {
        const src = quiz.source || 'ai_generated';
        return <Badge variant="secondary">{tQuiz(`source.${src}`)}</Badge>;
      },
    },
    {
      key: 'actions',
      label: t('columns.actions'),
      width: '100px',
      render: (_, quiz) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => { setViewingQuiz(quiz); setViewQuizDialogOpen(true); }}>
            <Eye className="h-4 w-4" />
          </Button>
          <ProfessorOnly>
            <Button variant="ghost" size="sm" onClick={() => { setQuizToDelete(quiz.id); setDeleteQuizConfirmOpen(true); }}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </ProfessorOnly>
        </div>
      ),
    },
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
              {module.courseId && (
                <Button variant="outline" asChild>
                  <Link href={`/modules/create?courseId=${module.courseId}`}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('createModuleInCourse')}
                  </Link>
                </Button>
              )}
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

      <Tabs defaultValue="content" className="space-y-6">
        <TabsList>
          <TabsTrigger value="content" className="gap-2">
            <FileText className="h-4 w-4" />
            {tQuiz('contentTab')}
          </TabsTrigger>
          <TabsTrigger value="quiz-bank" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            {tQuiz('tabLabel')}
            {quizzes.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">{quizzes.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-6">
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
                      <p className="text-2xl font-bold">{tokens?.length || 0}</p>
                      <p className="text-sm text-muted-foreground">{t('accessTokens')}</p>
                    </div>
                    <BookOpen className="h-8 w-8 text-purple-500" />
                  </div>
                </AdminOnly>
              </CardContent>
            </Card>
          </div>

          {/* Upload Actions */}
          <ProfessorOnly>
            <div className="flex gap-4">
              <Button
                onClick={() => setFileUploadModalOpen(true)}
                className="flex-1"
              >
                <Upload className="mr-2 h-4 w-4" />
                {t('uploadFile')}
              </Button>
              <Button
                onClick={() => setYoutubeUploadModalOpen(true)}
                variant="outline"
                className="flex-1"
              >
                <Youtube className="mr-2 h-4 w-4" />
                {t('addYoutubeVideo') || 'Add YouTube Video'}
              </Button>
              <Button
                onClick={handleUpdateAIConfig}
                variant="outline"
                className="flex-1"
                disabled={isUpdatingAIConfig || !files || files.length === 0}
                title={t('updateAIConfigDesc')}
              >
                {isUpdatingAIConfig ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('updateAIConfigRunning')}
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {t('updateAIConfig')}
                  </>
                )}
              </Button>
            </div>
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('moduleTokens')}</CardTitle>
                    <CardDescription>
                      {t('tokensGenerated')}
                    </CardDescription>
                  </div>
                  <Button onClick={() => setTokenModalOpen(true)}>
                    <Key className="mr-2 h-4 w-4" />
                    {t('createToken')}
                  </Button>
                </div>
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
        </TabsContent>

        <TabsContent value="quiz-bank" className="space-y-6">
          {/* Stats bar */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="text-sm font-medium">
              {tQuiz('totalQuestions', { count: quizzes.length })}
            </div>
            {quizzes.length > 0 && (
              <div className="flex gap-1.5">
                <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400">
                  {tQuiz('difficulty.easy')}: {quizzes.filter(q => q.difficulty === 'easy').length}
                </Badge>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400">
                  {tQuiz('difficulty.medium')}: {quizzes.filter(q => q.difficulty === 'medium').length}
                </Badge>
                <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400">
                  {tQuiz('difficulty.hard')}: {quizzes.filter(q => q.difficulty === 'hard').length}
                </Badge>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <ProfessorOnly>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setQuizUploadModalOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                {tQuiz('uploadButton')}
              </Button>

              {canGenerateWithAI ? (
                <Button
                  variant="outline"
                  onClick={handleGenerateQuizzes}
                  disabled={isGeneratingQuizzes}
                >
                  {isGeneratingQuizzes ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  {isGeneratingQuizzes ? tQuiz('generating') : tQuiz('generateButton')}
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="outline" disabled>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {tQuiz('generateButton')}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {tQuiz('generatePremiumOnly')} —{' '}
                    <Link href="/subscription" className="underline text-primary">
                      {tQuiz('upgradeLink')}
                    </Link>
                  </span>
                </div>
              )}
            </div>
          </ProfessorOnly>

          {/* Quiz DataTable */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                {tQuiz('title')}
              </CardTitle>
              <CardDescription>{tQuiz('description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={quizzes}
                columns={quizColumns}
                loading={quizzesLoading}
                emptyMessage={canGenerateWithAI ? tQuiz('emptyMessage') : tQuiz('emptyMessageStarterPlan')}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
            <DialogTitle>{t('widgetUrlTitle')}</DialogTitle>
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
                {tCommon('buttons.close')}
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
                {t('copyUrl')}
              </Button>
              <Button
                onClick={() => {
                  window.open(selectedTokenUrl, '_blank');
                  setUrlDialogOpen(false);
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {t('testUrl')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* File Upload Dialog */}
      <Dialog open={fileUploadModalOpen} onOpenChange={setFileUploadModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{t('uploadFile')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFileUpload} className="space-y-4">
            <FileUpload
              onFileSelect={setSelectedFiles}
              disabled={isUploading}
              selectedFiles={selectedFiles}
              multiple={true}
              maxSizeMB={10}
              translations={{
                clickToSelect: t('fileUpload.clickToSelect'),
                supportedFormats: t('fileUpload.supportedFormats'),
                maxSize: t('fileUpload.maxSize', { maxSizeMB: 10 }),
                filesSelected: `${selectedFiles.length} file(s) selected`
              }}
            />

            {uploadError && (
              <div className="p-3 bg-destructive/10 border border-destructive/50 rounded-md">
                <p className="text-sm text-destructive">{uploadError}</p>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFileUploadModalOpen(false)}
                disabled={isUploading}
              >
                {tCommon('buttons.cancel')}
              </Button>
              <Button type="submit" disabled={isUploading || selectedFiles.length === 0}>
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
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* YouTube Video Upload Dialog */}
      <Dialog open={youtubeUploadModalOpen} onOpenChange={setYoutubeUploadModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{t('addYoutubeVideo') || 'Add YouTube Video'}</DialogTitle>
          </DialogHeader>

          {/* Tips for better transcription */}
          <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
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

            <div className="space-y-2">
              <label htmlFor="youtubeLanguage" className="text-sm font-medium">
                {t('videoLanguage') || 'Video Language'}
              </label>
              <select
                id="youtubeLanguage"
                value={youtubeLanguage}
                onChange={(e) => setYoutubeLanguage(e.target.value)}
                disabled={isAddingYoutubeVideo}
                autoComplete="off"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="pt-br">{t('languagePortuguese') || 'Portuguese (Brazil)'}</option>
                <option value="en">{t('languageEnglish') || 'English'}</option>
                <option value="es">{t('languageSpanish') || 'Spanish'}</option>
              </select>
              <p className="text-xs text-muted-foreground">
                {t('languageHint') || 'Select the language spoken in the video for accurate transcription'}
              </p>
            </div>

            {youtubeError && (
              <div className="p-3 bg-destructive/10 border border-destructive/50 rounded-md">
                <p className="text-sm text-destructive">{youtubeError}</p>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setYoutubeUploadModalOpen(false)}
                disabled={isAddingYoutubeVideo}
              >
                {tCommon('buttons.cancel')}
              </Button>
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
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quiz File Upload Dialog */}
      <Dialog open={quizUploadModalOpen} onOpenChange={setQuizUploadModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{tQuiz('uploadButton')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleQuizFileUpload} className="space-y-4">
            <FileUpload
              onFileSelect={setQuizSelectedFile}
              accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt"
              multiple={false}
              maxSizeMB={10}
              selectedFiles={quizSelectedFile}
              translations={{
                clickToSelect: t('fileUpload.clickToSelect'),
                supportedFormats: 'PDF, DOCX, XLSX, CSV, TXT',
                maxSize: t('fileUpload.maxSize', { maxSizeMB: 10 }),
                filesSelected: `${quizSelectedFile.length} file(s) selected`
              }}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setQuizUploadModalOpen(false)}>
                {tCommon('buttons.cancel')}
              </Button>
              <Button type="submit" disabled={quizSelectedFile.length === 0 || isExtractingQuiz}>
                {isExtractingQuiz ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {tQuiz('uploading')}
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    {tQuiz('uploadButton')}
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Review Extracted Questions Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tQuiz('review.title')}</DialogTitle>
            <p className="text-sm text-muted-foreground">{tQuiz('review.description')}</p>
          </DialogHeader>

          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium">
              {tQuiz('review.selected', {
                selected: extractedQuestions.filter(q => q.selected !== false).length,
                total: extractedQuestions.length
              })}
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setExtractedQuestions(prev => prev.map(q => ({ ...q, selected: true })))}>
                {tQuiz('review.selectAll')}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setExtractedQuestions(prev => prev.map(q => ({ ...q, selected: false })))}>
                {tQuiz('review.deselectAll')}
              </Button>
            </div>
          </div>

          <div className="space-y-4 max-h-[50vh] overflow-y-auto">
            {extractedQuestions.map((q, idx) => (
              <div key={idx} className={`border rounded-lg p-4 space-y-2 ${q.selected === false ? 'opacity-50' : ''}`}>
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={q.selected !== false}
                    onCheckedChange={(checked) => {
                      setExtractedQuestions(prev => prev.map((item, i) => i === idx ? { ...item, selected: checked === true } : item));
                    }}
                  />
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-medium">{idx + 1}. {q.question}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {Object.entries(q.options || {}).map(([key, opt]) => {
                        const isCorrect = key === q.correct_answer;
                        const text = typeof opt === 'object' ? (opt as { text: string }).text : String(opt);
                        return (
                          <div key={key} className={`text-xs px-2 py-1 rounded ${isCorrect ? 'bg-green-100 dark:bg-green-950 font-medium' : 'bg-muted'}`}>
                            <span className="font-semibold">{key})</span> {text}
                          </div>
                        );
                      })}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {tQuiz(`difficulty.${q.difficulty || 'medium'}`)}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              {tQuiz('review.cancel')}
            </Button>
            <Button
              onClick={handleConfirmQuizzes}
              disabled={isConfirmingQuizzes || extractedQuestions.filter(q => q.selected !== false).length === 0}
            >
              {isConfirmingQuizzes && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {tQuiz('review.confirm')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Quiz Detail Dialog */}
      <Dialog open={viewQuizDialogOpen} onOpenChange={setViewQuizDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tQuiz('view.title')}</DialogTitle>
          </DialogHeader>
          {viewingQuiz && (
            <div className="space-y-4">
              <p className="text-sm font-medium">{viewingQuiz.question_text}</p>

              <div className="space-y-2">
                {(['A', 'B', 'C', 'D', 'E'] as const).map((key) => {
                  const optionText = viewingQuiz.options[key];
                  if (!optionText) return null;
                  const isCorrect = key === viewingQuiz.correct_answer;
                  const explanation = viewingQuiz.explanations[key];
                  return (
                    <div key={key} className={`border rounded-lg p-3 ${isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-950/50' : ''}`}>
                      <div className="flex items-center gap-2">
                        <Badge variant={isCorrect ? 'default' : 'outline'} className={isCorrect ? 'bg-green-600' : ''}>
                          {key}
                        </Badge>
                        <span className="text-sm">{optionText}</span>
                        {isCorrect && <Badge className="bg-green-600 ml-auto">{tQuiz('view.correctAnswer')}</Badge>}
                      </div>
                      {explanation && (
                        <p className="text-xs text-muted-foreground mt-2 ml-8">
                          <span className="font-medium">{tQuiz('view.explanation')}:</span> {explanation}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {viewingQuiz.concepts_covered && viewingQuiz.concepts_covered.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">{tQuiz('view.concepts')}</p>
                  <div className="flex flex-wrap gap-1">
                    {viewingQuiz.concepts_covered.map((concept, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{concept}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Badge variant="outline">
                  {tQuiz(`difficulty.${viewingQuiz.difficulty}`)}
                </Badge>
                {viewingQuiz.source && (
                  <Badge variant="secondary">
                    {tQuiz(`source.${viewingQuiz.source}`)}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Quiz Confirmation */}
      <AlertDialog open={deleteQuizConfirmOpen} onOpenChange={setDeleteQuizConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tQuiz('deleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>{tQuiz('deleteConfirmDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('buttons.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteQuiz} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {tCommon('buttons.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
