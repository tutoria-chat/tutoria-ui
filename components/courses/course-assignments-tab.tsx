'use client';

/**
 * Course assignments tab.
 *
 * Assignments belong to the course, not to a module: this is the single place
 * where they are created, edited, published and deleted. The module page renders
 * the same component with `readOnly`, so professors can see what the course
 * expects of their students without a second source of truth.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import {
  Calendar,
  ClipboardList,
  Edit,
  FileCheck2,
  FileText,
  Loader2,
  Plus,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { apiClient } from '@/lib/api';
import { formatDateTimeShort } from '@/lib/utils';
import type { Assignment } from '@/lib/types';

interface CourseAssignmentsTabProps {
  courseId: number;
  /** Module page view: published assignments only, no create/edit/delete. */
  readOnly?: boolean;
  onCountChange?: (count: number) => void;
  /**
   * null while unknown, false once the API says the university/plan doesn't
   * include assignments — callers use it to hide the tab entirely.
   */
  onFeatureAvailabilityChange?: (enabled: boolean | null) => void;
}

export function CourseAssignmentsTab({
  courseId,
  readOnly = false,
  onCountChange,
  onFeatureAvailabilityChange,
}: CourseAssignmentsTabProps) {
  const t = useTranslations('assignments');
  const tCommon = useTranslations('common');

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Assignment | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [gradingCriteria, setGradingCriteria] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [contextFiles, setContextFiles] = useState<globalThis.File[]>([]);
  const [file, setFile] = useState<globalThis.File | null>(null);
  const [rubricFile, setRubricFile] = useState<globalThis.File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const data = await apiClient.getAssignments(courseId, { publishedOnly: readOnly });
      setAssignments(data.items);
      onCountChange?.(data.items.length);
      onFeatureAvailabilityChange?.(true);
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 400 || status === 403) {
        // Feature explicitly disabled for this university, or access denied
        onFeatureAvailabilityChange?.(false);
      } else {
        // Transient error (500, network, …) — don't hide the tab permanently
        console.error('Failed to load assignments:', err);
        onFeatureAvailabilityChange?.(true);
      }
    } finally {
      setLoading(false);
    }
    // onCountChange / onFeatureAvailabilityChange are notification callbacks:
    // depending on them would re-run the fetch on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, readOnly]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setDescription('');
    setGradingCriteria('');
    setDueDate('');
    setKeywords([]);
    setKeywordInput('');
    setFile(null);
    setRubricFile(null);
    setContextFiles([]);
    setFormOpen(true);
  };

  const openEdit = (a: Assignment) => {
    setEditing(a);
    setTitle(a.title);
    setDescription(a.description || '');
    setGradingCriteria(a.gradingCriteria || '');
    setDueDate(a.dueDate ? a.dueDate.slice(0, 16) : '');
    setKeywords(a.keywords || []);
    setKeywordInput('');
    setFile(null);
    setRubricFile(null);
    setContextFiles([]);
    setFormOpen(true);
  };

  const addKeyword = (raw: string) => {
    const kw = raw.trim().replace(/[,;.]+$/, '').trim();
    if (kw && !keywords.includes(kw)) {
      setKeywords(prev => [...prev, kw]);
    }
    setKeywordInput('');
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ',' || e.key === ';' || e.key === '.' || e.key === 'Enter') {
      e.preventDefault();
      addKeyword(keywordInput);
    } else if (e.key === 'Backspace' && keywordInput === '' && keywords.length > 0) {
      setKeywords(prev => prev.slice(0, -1));
    }
  };

  const removeKeyword = (kw: string) => setKeywords(prev => prev.filter(k => k !== kw));

  const handleSave = async () => {
    if (!title.trim() || !dueDate) return;
    setIsSaving(true);
    try {
      if (editing) {
        await apiClient.updateAssignment(editing.id, {
          title,
          description: description || undefined,
          dueDate,
          keywords: keywords.length ? keywords : undefined,
          gradingCriteria: gradingCriteria || undefined,
        });
        toast.success(t('toastUpdated'));
      } else {
        if (!file) { toast.error(t('toastFileRequired')); return; }
        await apiClient.createAssignment({
          courseId,
          title,
          description: description || undefined,
          dueDate,
          keywords: keywords.length ? keywords : undefined,
          gradingCriteria: gradingCriteria || undefined,
          file,
          rubricFile: rubricFile || undefined,
          contextFiles: contextFiles.length ? contextFiles : undefined,
        });
        toast.success(t('toastCreated'));
      }
      setFormOpen(false);
      load();
    } catch (err) {
      console.error('Failed to save assignment:', err);
      toast.error(t('toastSaveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublish = async (id: number) => {
    const current = assignments.find(a => a.id === id);
    try {
      await apiClient.togglePublishAssignment(id);
      toast.success(current?.isPublished ? t('toastUnpublished') : t('toastPublished'));
      load();
    } catch (err) {
      console.error('Failed to toggle publish:', err);
      toast.error(t('toastPublishError'));
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await apiClient.deleteAssignment(toDelete);
      toast.success(t('toastDeleted'));
      setDeleteConfirmOpen(false);
      load();
    } catch (err) {
      console.error('Failed to delete assignment:', err);
      toast.error(t('toastDeleteError'));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{readOnly ? t('courseAssignmentsTitle') : t('title')}</CardTitle>
            <CardDescription>
              {readOnly ? t('courseAssignmentsDescription') : t('description')}
            </CardDescription>
          </div>
          {!readOnly && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {t('newButton')}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">
                {readOnly ? t('courseAssignmentsEmpty') : t('emptyTitle')}
              </p>
              {!readOnly && <p className="text-xs mt-1">{t('emptyDescription')}</p>}
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.map((a) => {
                const isPastDue = new Date(a.dueDate) < new Date();
                return (
                  <div
                    key={a.id}
                    className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                      readOnly ? 'bg-muted/20' : 'bg-card hover:bg-muted/30'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0 mr-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">{a.title}</span>
                        {a.isPublished ? (
                          <Badge variant={readOnly ? 'outline' : 'default'} className="text-xs shrink-0">
                            {t('badgePublished')}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs shrink-0">{t('badgeDraft')}</Badge>
                        )}
                        {a.rubricOriginalFileName && (
                          <Badge variant="outline" className="text-xs shrink-0 gap-1">
                            <FileCheck2 className="h-3 w-3" />
                            {t('rubricIndicator')}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 shrink-0" />
                        <span className={isPastDue ? 'text-destructive font-medium' : ''}>
                          {t('dueLabel')} {formatDateTimeShort(a.dueDate)}
                          {isPastDue && ` ${t('pastDue')}`}
                        </span>
                        <span>·</span>
                        <span className="truncate">{a.originalFileName}</span>
                      </div>
                      {a.keywords?.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Tag className="h-3 w-3 text-muted-foreground shrink-0" />
                          {a.keywords.map(kw => (
                            <span key={kw} className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground text-xs">{kw}</span>
                          ))}
                        </div>
                      )}
                      {a.contextFiles?.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap text-xs text-muted-foreground">
                          <FileText className="h-3 w-3 shrink-0" />
                          <span>{t('contextFilesCount', { count: a.contextFiles.length })}</span>
                        </div>
                      )}
                    </div>
                    {!readOnly && (
                      <div className="flex items-center gap-2 shrink-0">
                        <Switch
                          checked={a.isPublished}
                          onCheckedChange={() => handleTogglePublish(a.id)}
                          title={a.isPublished ? t('switchUnpublishTitle') : t('switchPublishTitle')}
                        />
                        <Button variant="ghost" size="sm" onClick={() => openEdit(a)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => { setToDelete(a.id); setDeleteConfirmOpen(true); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignment Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? t('formEditTitle') : t('formCreateTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-1">{t('fieldTitle')}</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('fieldTitlePlaceholder')}
              />
            </div>

            {/* Instructions */}
            <div>
              <label className="block text-sm font-medium mb-1">{t('fieldInstructions')}</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('fieldInstructionsPlaceholder')}
                rows={4}
              />
            </div>

            {/* Grading Criteria */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('fieldGradingCriteria')}
                <span className="ml-1 text-xs font-normal text-muted-foreground">({tCommon('optional')})</span>
              </label>
              <Textarea
                value={gradingCriteria}
                onChange={(e) => setGradingCriteria(e.target.value)}
                placeholder={t('fieldGradingCriteriaPlaceholder')}
                rows={3}
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground mt-1">{t('fieldGradingCriteriaHelp')}</p>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium mb-1">{t('fieldDueDate')}</label>
              <DateTimePicker
                value={dueDate}
                onChange={setDueDate}
                placeholder={t('fieldDueDatePlaceholder')}
                fromDate={new Date()}
              />
            </div>

            {/* Keywords chip input */}
            <div>
              <label className="block text-sm font-medium mb-1">{t('fieldKeywords')}</label>
              <div className="flex flex-wrap gap-1.5 p-2 border rounded-md min-h-[42px] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0 bg-background">
                {keywords.map(kw => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium"
                  >
                    {kw}
                    <button
                      type="button"
                      onClick={() => removeKeyword(kw)}
                      className="hover:opacity-70 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v.endsWith(',') || v.endsWith(';') || v.endsWith('.')) { addKeyword(v); }
                    else { setKeywordInput(v); }
                  }}
                  onKeyDown={handleKeywordKeyDown}
                  onBlur={() => { if (keywordInput.trim()) addKeyword(keywordInput); }}
                  placeholder={keywords.length === 0 ? t('fieldKeywordsPlaceholder') : ''}
                  className="flex-1 min-w-[140px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t('fieldKeywordsHelp')}</p>
            </div>

            {/* Files — only on create */}
            {!editing && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('fieldFile')}</label>
                  <input
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/80 cursor-pointer"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  {file && <p className="text-xs text-muted-foreground mt-1">{file.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{t('fieldRubric')}</label>
                  <input
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/80 cursor-pointer"
                    onChange={(e) => setRubricFile(e.target.files?.[0] || null)}
                  />
                  {rubricFile ? (
                    <p className="text-xs text-muted-foreground mt-1">{rubricFile.name}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">{t('fieldRubricHelp')}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{t('fieldContextFiles')}</label>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/80 cursor-pointer"
                    onChange={(e) => setContextFiles(e.target.files ? Array.from(e.target.files) : [])}
                  />
                  {contextFiles.length > 0 ? (
                    <ul className="mt-1 space-y-0.5">
                      {contextFiles.map((f, i) => (
                        <li key={i} className="text-xs text-muted-foreground">• {f.name}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">{t('fieldContextFilesHelp')}</p>
                  )}
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setFormOpen(false)}>
                {t('cancelButton')}
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || !title.trim() || !dueDate}
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? t('saveButton') : t('createButton')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Assignment Confirm */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('deleteCancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('deleteConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
