'use client';

/**
 * Import course calendar events from a PDF/document.
 *
 * Upload → the worker AI-extracts candidate events → professor reviews/edits a
 * table → confirm creates CourseEvents. Times from the AI are treated as
 * Brasília (America/São_Paulo) local and converted to UTC on confirm, matching
 * the manual create flow.
 */
import React, { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FileUp, Link as LinkIcon, Loader2, Plus, Trash2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { apiClient } from '@/lib/api';
import type { CourseEventCreate, CourseEventType, ExtractedCalendarEvent } from '@/lib/types';
import { toast } from 'sonner';

const SP_OFFSET = '-03:00';
const TYPES: CourseEventType[] = ['test', 'assignment', 'holiday', 'field_event', 'other'];

function spToUtcIso(date: string, time: string): string {
  return new Date(`${date}T${time || '08:00'}:00${SP_OFFSET}`).toISOString();
}

interface ReviewRow extends ExtractedCalendarEvent {
  _id: number;
}

interface CalendarImportDialogProps {
  courseId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}

export function CalendarImportDialog({ courseId, open, onOpenChange, onImported }: CalendarImportDialogProps) {
  const t = useTranslations('courses.detail.calendarTab');

  const [phase, setPhase] = useState<'upload' | 'review'>('upload');
  const [source, setSource] = useState<'file' | 'url'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [icsUrl, setIcsUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [reminders, setReminders] = useState({ d7: false, d3: false, d2: false, h24: true });
  const nextId = useRef(1);
  const jobId = useRef<number | null>(null);

  const reset = () => {
    setPhase('upload');
    setSource('file');
    setFile(null);
    setIcsUrl('');
    setRows([]);
    setBusy(false);
    jobId.current = null;
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const canExtract = source === 'file' ? !!file : icsUrl.trim().length > 0;

  const handleExtract = async () => {
    if (!canExtract) return;
    setBusy(true);
    try {
      const job =
        source === 'file'
          ? await apiClient.createCalendarImportJob(courseId, file!)
          : await apiClient.createCalendarImportFromUrl(courseId, icsUrl.trim());
      jobId.current = job.id;
      if (job.status === 'failed') {
        toast.error(job.errorMessage || t('import.failed'));
        return;
      }
      const events = job.events ?? [];
      if (events.length === 0) {
        toast.info(t('import.noEvents'));
        return;
      }
      setRows(events.map((e) => ({ ...e, _id: nextId.current++ })));
      setPhase('review');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      toast.error(msg || t('import.failed'));
    } finally {
      setBusy(false);
    }
  };

  const updateRow = (id: number, patch: Partial<ReviewRow>) =>
    setRows((prev) => prev.map((r) => (r._id === id ? { ...r, ...patch } : r)));
  const removeRow = (id: number) => setRows((prev) => prev.filter((r) => r._id !== id));
  const addRow = () =>
    setRows((prev) => [
      ...prev,
      { _id: nextId.current++, title: '', eventType: 'test', date: '', time: '', description: '' },
    ]);

  const handleConfirm = async () => {
    if (jobId.current == null) return;
    const valid = rows.filter((r) => r.title.trim() && r.date && /^\d{4}-\d{2}-\d{2}$/.test(r.date));
    if (valid.length === 0) {
      toast.error(t('validationError'));
      return;
    }
    setBusy(true);
    try {
      const events: CourseEventCreate[] = valid.map((r) => ({
        courseId,
        title: r.title.trim(),
        description: r.description || undefined,
        eventType: r.eventType,
        startsAtUtc: spToUtcIso(r.date!, r.time || ''),
        moduleId: null,
        remind7Days: reminders.d7,
        remind3Days: reminders.d3,
        remind2Days: reminders.d2,
        remind24Hours: reminders.h24,
      }));
      const res = await apiClient.confirmCalendarImport(jobId.current, events);
      toast.success(t('import.confirmSuccess', { count: res.created }));
      onImported();
      handleOpenChange(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      toast.error(msg || t('saveError'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t('import.dialogTitle')}
          </DialogTitle>
          <DialogDescription>{t('import.dialogDesc')}</DialogDescription>
        </DialogHeader>

        {phase === 'upload' ? (
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={source === 'file' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSource('file')}
              >
                <FileUp className="mr-1 h-4 w-4" />
                {t('import.fromFile')}
              </Button>
              <Button
                type="button"
                variant={source === 'url' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSource('url')}
              >
                <LinkIcon className="mr-1 h-4 w-4" />
                {t('import.fromUrl')}
              </Button>
            </div>

            {source === 'file' ? (
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-8 text-center hover:bg-muted/40">
                <FileUp className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm font-medium">{file ? file.name : t('import.pickFile')}</span>
                <span className="text-xs text-muted-foreground">PDF, DOCX, XLSX, CSV, TXT — máx 10 MB</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
            ) : (
              <div className="space-y-2">
                <Input
                  type="url"
                  inputMode="url"
                  placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
                  value={icsUrl}
                  onChange={(e) => setIcsUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">{t('import.urlHint')}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">{t('import.reviewHint')}</p>

            <div className="max-h-[45vh] space-y-2 overflow-y-auto pr-1">
              {rows.map((r) => (
                <div key={r._id} className="flex flex-wrap items-center gap-2 rounded-md border border-border p-2">
                  <Input
                    value={r.title}
                    onChange={(e) => updateRow(r._id, { title: e.target.value })}
                    placeholder={t('form.titlePlaceholder')}
                    className="min-w-[160px] flex-1"
                  />
                  <select
                    value={r.eventType}
                    onChange={(e) => updateRow(r._id, { eventType: e.target.value as CourseEventType })}
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                  >
                    {TYPES.map((ty) => (
                      <option key={ty} value={ty}>{t(`types.${ty}`)}</option>
                    ))}
                  </select>
                  <Input
                    type="date"
                    value={r.date ?? ''}
                    onChange={(e) => updateRow(r._id, { date: e.target.value })}
                    className="w-[150px]"
                  />
                  <Input
                    type="time"
                    value={r.time ?? ''}
                    onChange={(e) => updateRow(r._id, { time: e.target.value })}
                    className="w-[110px]"
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeRow(r._id)} aria-label={t('import.removeRow')}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addRow}>
                <Plus className="mr-1 h-4 w-4" />
                {t('addEvent')}
              </Button>
            </div>

            <div className="rounded-md bg-muted/40 p-3">
              <p className="mb-2 text-xs font-medium">{t('import.applyReminders')}</p>
              <div className="flex flex-wrap gap-3 text-sm">
                {([['d7', 'remind7d'], ['d3', 'remind3d'], ['d2', 'remind2d'], ['h24', 'remind24h']] as const).map(
                  ([key, label]) => (
                    <label key={key} className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={reminders[key]}
                        onChange={(e) => setReminders((prev) => ({ ...prev, [key]: e.target.checked }))}
                      />
                      {t(`form.${label}`)}
                    </label>
                  ),
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {phase === 'upload' ? (
            <Button onClick={handleExtract} disabled={!canExtract || busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {busy ? t('import.extracting') : t('import.extract')}
            </Button>
          ) : (
            <Button onClick={handleConfirm} disabled={busy || rows.length === 0}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {busy ? t('import.confirming') : t('import.confirm')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
