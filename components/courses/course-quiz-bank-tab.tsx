'use client';

/**
 * Course question bank ("banco de questões").
 *
 * The bank is course-wide: students of any module in the course draw from the
 * same pool, and uploads/deletions happen here. AI generation is still triggered
 * per module (it reads that module's files), so the module page renders this
 * component with `readOnly` plus its own generate button in `actions`, and can
 * narrow the list to questions that came from its own material via `moduleId`.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import {
  CheckCircle2,
  ClipboardList,
  Eye,
  Loader2,
  Trash2,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { ProfessorOnly } from '@/components/auth/role-guard';
import { apiClient } from '@/lib/api';
import type { QuizQuestion, ExtractedQuestion, QuizUploadJob, TableColumn } from '@/lib/types';

interface CourseQuizBankTabProps {
  courseId: number;
  /** Module page view: browse the bank, no upload/delete/import. */
  readOnly?: boolean;
  /** Narrow the list to questions generated from this module's material. */
  moduleId?: number;
  /** Extra action buttons — the module page's "generate from this module". */
  actions?: React.ReactNode;
  /** Bump to reload from the outside (e.g. after generation finishes). */
  reloadKey?: number;
  /** Drives the empty-state copy: AI generation is a paid feature. */
  canGenerateWithAI?: boolean;
  onCountChange?: (count: number) => void;
}

export function CourseQuizBankTab({
  courseId,
  readOnly = false,
  moduleId,
  actions,
  reloadKey = 0,
  canGenerateWithAI = true,
  onCountChange,
}: CourseQuizBankTabProps) {
  const t = useTranslations('quizBank');
  const tCommon = useTranslations('common');

  const [quizzes, setQuizzes] = useState<QuizQuestion[]>([]);
  const [quizzesLoading, setQuizzesLoading] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<globalThis.File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [extractedQuestions, setExtractedQuestions] = useState<ExtractedQuestion[]>([]);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingQuiz, setViewingQuiz] = useState<QuizQuestion | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<number | null>(null);
  const [uploadJobs, setUploadJobs] = useState<QuizUploadJob[]>([]);
  const [uploadJobsLoading, setUploadJobsLoading] = useState(false);
  const [reviewingJobId, setReviewingJobId] = useState<number | null>(null);
  const [activeReviewJobId, setActiveReviewJobId] = useState<number | null>(null);
  const [importedJobIds, setImportedJobIds] = useState<Set<number>>(new Set());

  const loadQuizzes = useCallback(async () => {
    if (!courseId) return;
    setQuizzesLoading(true);
    try {
      const data = await apiClient.getCourseQuizzes(courseId, undefined, undefined, moduleId);
      setQuizzes(data);
      onCountChange?.(data.length);
    } catch (err) {
      console.error('Failed to load quizzes:', err);
    } finally {
      setQuizzesLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, moduleId, reloadKey]);

  const loadUploadJobs = useCallback(async () => {
    if (!courseId || readOnly) return;
    setUploadJobsLoading(true);
    try {
      const data = await apiClient.getQuizUploadJobs(courseId);
      setUploadJobs(data);
    } catch (err) {
      console.error('Failed to load quiz upload jobs:', err);
    } finally {
      setUploadJobsLoading(false);
    }
  }, [courseId, readOnly]);

  useEffect(() => { loadQuizzes(); }, [loadQuizzes]);
  useEffect(() => { loadUploadJobs(); }, [loadUploadJobs]);

  // Poll upload jobs every 10s while any is pending/processing
  useEffect(() => {
    const hasPending = uploadJobs.some(j => j.status === 'pending' || j.status === 'processing');
    if (!hasPending) return;
    const interval = setInterval(() => loadUploadJobs(), 10000);
    return () => clearInterval(interval);
  }, [uploadJobs, loadUploadJobs]);

  const handleFileUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedFile.length === 0) return;

    setIsUploading(true);
    try {
      await apiClient.uploadQuizFile(courseId, selectedFile[0]);
      setUploadModalOpen(false);
      setSelectedFile([]);
      toast.success(t('uploadQueued'));
      loadUploadJobs();
    } catch (err) {
      console.error('Failed to upload quiz file:', err);
      toast.error(t('uploadError'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleReviewJob = async (jobId: number) => {
    setReviewingJobId(jobId);
    try {
      const result = await apiClient.getQuizUploadJobQuestions(jobId);
      if (result.questions && result.questions.length > 0) {
        setExtractedQuestions(result.questions.map((q: ExtractedQuestion) => ({ ...q, selected: true })));
        setActiveReviewJobId(jobId);
        setReviewDialogOpen(true);
      } else {
        toast.error(t('review.noQuestionsExtracted'));
      }
    } catch (err) {
      console.error('Failed to load quiz job questions:', err);
      toast.error(t('uploadError'));
    } finally {
      setReviewingJobId(null);
    }
  };

  const handleConfirmQuizzes = async () => {
    const selected = extractedQuestions.filter(q => q.selected !== false);
    if (selected.length === 0) return;

    setIsConfirming(true);
    try {
      await apiClient.confirmExtractedQuizzes(courseId, selected);
      toast.success(t('uploadSuccess'));
      if (activeReviewJobId !== null) {
        setImportedJobIds(prev => new Set(prev).add(activeReviewJobId));
      }
      setReviewDialogOpen(false);
      setExtractedQuestions([]);
      setActiveReviewJobId(null);
      loadQuizzes();
    } catch (err) {
      console.error('Failed to confirm quizzes:', err);
      toast.error(t('uploadError'));
    } finally {
      setIsConfirming(false);
    }
  };

  const confirmDeleteQuiz = async () => {
    if (!quizToDelete) return;
    try {
      await apiClient.deleteQuiz(courseId, quizToDelete);
      toast.success(t('deleteSuccess'));
      setDeleteConfirmOpen(false);
      setQuizToDelete(null);
      loadQuizzes();
    } catch (err) {
      console.error('Failed to delete quiz:', err);
      toast.error(t('deleteError'));
    }
  };

  const quizColumns: TableColumn<QuizQuestion>[] = [
    {
      key: 'question_number',
      label: t('columns.number'),
      sortable: true,
      width: '60px',
      render: (value) => <span className="font-mono text-sm">{value as number}</span>,
    },
    {
      key: 'question_text',
      label: t('columns.question'),
      sortable: false,
      render: (_, quiz) => (
        <div className="max-w-[300px] truncate text-sm" title={quiz.question_text}>
          {quiz.question_text}
        </div>
      ),
    },
    {
      key: 'difficulty',
      label: t('columns.difficulty'),
      sortable: true,
      width: '100px',
      render: (value) => {
        const diff = value as string;
        const variant = diff === 'easy' ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400' :
                        diff === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-400' :
                        'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400';
        return <Badge className={variant}>{t(`difficulty.${diff}`)}</Badge>;
      },
    },
    {
      key: 'correct_answer',
      label: t('columns.answer'),
      sortable: false,
      width: '80px',
      render: (value) => <Badge variant="outline" className="font-mono">{value as string}</Badge>,
    },
    {
      key: 'source',
      label: t('columns.source'),
      sortable: true,
      width: '120px',
      render: (_, quiz) => {
        const src = quiz.source || 'ai_generated';
        return <Badge variant="secondary">{t(`source.${src}`)}</Badge>;
      },
    },
    {
      key: 'actions',
      label: t('columns.actions'),
      width: '100px',
      render: (_, quiz) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => { setViewingQuiz(quiz); setViewDialogOpen(true); }}>
            <Eye className="h-4 w-4" />
          </Button>
          {!readOnly && (
            <ProfessorOnly>
              <Button variant="ghost" size="sm" onClick={() => { setQuizToDelete(quiz.id); setDeleteConfirmOpen(true); }}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </ProfessorOnly>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="text-sm font-medium">
          {t('totalQuestions', { count: quizzes.length })}
        </div>
        {quizzes.length > 0 && (
          <div className="flex gap-1.5">
            <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400">
              {t('difficulty.easy')}: {quizzes.filter(q => q.difficulty === 'easy').length}
            </Badge>
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400">
              {t('difficulty.medium')}: {quizzes.filter(q => q.difficulty === 'medium').length}
            </Badge>
            <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400">
              {t('difficulty.hard')}: {quizzes.filter(q => q.difficulty === 'hard').length}
            </Badge>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <ProfessorOnly>
        <div className="flex flex-wrap gap-2">
          {!readOnly && (
            <Button onClick={() => setUploadModalOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              {t('uploadButton')}
            </Button>
          )}
          {actions}
        </div>
      </ProfessorOnly>

      {/* Quiz DataTable */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            {t('title')}
          </CardTitle>
          <CardDescription>
            {readOnly ? t('moduleScopeHint') : t('description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={quizzes}
            columns={quizColumns}
            loading={quizzesLoading}
            emptyMessage={
              readOnly
                ? t('emptyMessageModule')
                : canGenerateWithAI ? t('emptyMessage') : t('emptyMessageStarterPlan')
            }
          />
        </CardContent>
      </Card>

      {/* Upload Jobs History */}
      {!readOnly && (
        <ProfessorOnly>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('uploadJobsTitle')}</CardTitle>
              <CardDescription>{t('uploadJobsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              {uploadJobsLoading && uploadJobs.length === 0 ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : uploadJobs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">{t('uploadJobsEmpty')}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">{t('colFile')}</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">{t('colStatus')}</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">{t('colExtracted')}</th>
                        <th className="text-left py-2 font-medium text-muted-foreground">{t('colActions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadJobs.map(job => (
                        <tr key={job.id} className="border-b last:border-0">
                          <td className="py-2 pr-4 text-muted-foreground max-w-[200px] truncate">{job.originalFilename || '-'}</td>
                          <td className="py-2 pr-4">
                            {job.status === 'pending' && (
                              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-400 border-0">{t('statusPending')}</Badge>
                            )}
                            {job.status === 'processing' && (
                              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400 border-0">
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />{t('statusProcessing')}
                              </Badge>
                            )}
                            {job.status === 'completed' && (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400 border-0">{t('statusCompleted')}</Badge>
                            )}
                            {job.status === 'failed' && (
                              <Badge className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400 border-0">{t('statusFailed')}</Badge>
                            )}
                          </td>
                          <td className="py-2 pr-4">{job.status === 'completed' ? job.extractedCount : '-'}</td>
                          <td className="py-2">
                            {job.status === 'completed' && job.extractedCount > 0 && (
                              importedJobIds.has(job.id) ? (
                                <span className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400 font-medium">
                                  <CheckCircle2 className="h-4 w-4" />
                                  {t('importedLabel')}
                                </span>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={reviewingJobId === job.id}
                                  onClick={() => handleReviewJob(job.id)}
                                >
                                  {reviewingJobId === job.id ? (
                                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                  ) : (
                                    <Eye className="mr-1 h-3 w-3" />
                                  )}
                                  {t('reviewButton')}
                                </Button>
                              )
                            )}
                            {job.status === 'failed' && job.errorMessage && (
                              <span className="text-xs text-red-600 dark:text-red-400">{job.errorMessage}</span>
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
        </ProfessorOnly>
      )}

      {/* Quiz File Upload Dialog */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('uploadButton')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFileUpload} className="space-y-4">
            <FileUpload
              onFileSelect={setSelectedFile}
              accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt"
              multiple={false}
              maxSizeMB={10}
              selectedFiles={selectedFile}
              translations={{
                clickToSelect: t('fileUpload.clickToSelect'),
                supportedFormats: 'PDF, DOCX, XLSX, CSV, TXT',
                maxSize: t('fileUpload.maxSize', { maxSizeMB: 10 }),
                filesSelected: `${selectedFile.length} file(s) selected`
              }}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setUploadModalOpen(false)}>
                {tCommon('buttons.cancel')}
              </Button>
              <Button type="submit" disabled={selectedFile.length === 0 || isUploading}>
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

      {/* Review Extracted Questions Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('review.title')}</DialogTitle>
            <p className="text-sm text-muted-foreground">{t('review.description')}</p>
          </DialogHeader>

          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium">
              {t('review.selected', {
                selected: extractedQuestions.filter(q => q.selected !== false).length,
                total: extractedQuestions.length
              })}
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setExtractedQuestions(prev => prev.map(q => ({ ...q, selected: true })))}>
                {t('review.selectAll')}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setExtractedQuestions(prev => prev.map(q => ({ ...q, selected: false })))}>
                {t('review.deselectAll')}
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
                      {t(`difficulty.${q.difficulty || 'medium'}`)}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              {t('review.cancel')}
            </Button>
            <Button
              onClick={handleConfirmQuizzes}
              disabled={isConfirming || extractedQuestions.filter(q => q.selected !== false).length === 0}
            >
              {isConfirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('review.confirm')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Quiz Detail Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('view.title')}</DialogTitle>
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
                        {isCorrect && <Badge className="bg-green-600 ml-auto">{t('view.correctAnswer')}</Badge>}
                      </div>
                      {explanation && (
                        <p className="text-xs text-muted-foreground mt-2 ml-8">
                          <span className="font-medium">{t('view.explanation')}:</span> {explanation}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {viewingQuiz.concepts_covered && viewingQuiz.concepts_covered.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">{t('view.concepts')}</p>
                  <div className="flex flex-wrap gap-1">
                    {viewingQuiz.concepts_covered.map((concept, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{concept}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Badge variant="outline">{t(`difficulty.${viewingQuiz.difficulty}`)}</Badge>
                {viewingQuiz.source && (
                  <Badge variant="secondary">{t(`source.${viewingQuiz.source}`)}</Badge>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Quiz Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteConfirmDesc')}</AlertDialogDescription>
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
