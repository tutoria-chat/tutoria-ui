'use client';

/**
 * Course calendar tab: month grid + upcoming list of CourseEvents.
 *
 * UX rules:
 * - Type-first creation; choosing "Atividade" redirects to the Assignments tab
 *   (assignments keep their own creation flow and appear here automatically).
 * - Synthesized assignment entries (due dates without a linked event) are
 *   read-only; "enable reminders" creates the linked event in one click.
 * - Times are entered/displayed in America/Sao_Paulo (UTC-3, no DST) and
 *   stored in UTC.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Edit,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { CalendarImportDialog } from './calendar-import-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { apiClient } from '@/lib/api';
import type { CourseEvent, CourseEventCreate, CourseEventType, Module } from '@/lib/types';
import { toast } from 'sonner';

const SP_OFFSET = '-03:00'; // America/Sao_Paulo — no DST since 2019

const TYPE_STYLES: Record<CourseEventType, string> = {
  test: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
  assignment: 'bg-primary/15 text-primary border-primary/30',
  holiday: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
  field_event: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-500/30',
  other: 'bg-muted text-muted-foreground border-border',
};

function spToUtcIso(date: string, time: string): string {
  return new Date(`${date}T${time || '00:00'}:00${SP_OFFSET}`).toISOString();
}

function utcToSpParts(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(d).map((p) => [p.type, p.value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour === '24' ? '00' : parts.hour}:${parts.minute}`,
  };
}

interface EventForm {
  title: string;
  description: string;
  eventType: CourseEventType;
  date: string;
  time: string;
  moduleId: string;
  remind7Days: boolean;
  remind3Days: boolean;
  remind2Days: boolean;
  remind24Hours: boolean;
}

const EMPTY_FORM: EventForm = {
  title: '',
  description: '',
  eventType: 'test',
  date: '',
  time: '08:00',
  moduleId: '',
  remind7Days: false,
  remind3Days: false,
  remind2Days: false,
  remind24Hours: true,
};

interface CourseCalendarTabProps {
  courseId: number;
  modules: Module[];
  canManage: boolean;
  onGoToAssignments: () => void;
}

export function CourseCalendarTab({ courseId, modules, canManage, onGoToAssignments }: CourseCalendarTabProps) {
  const t = useTranslations('courses.detail.calendarTab');
  const tCommon = useTranslations('common');

  const [events, setEvents] = useState<CourseEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Dialog state — editing keeps the event; enabling reminders keeps the synthesized source
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CourseEvent | null>(null);
  const [linkingAssignment, setLinkingAssignment] = useState<CourseEvent | null>(null);
  const [form, setForm] = useState<EventForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const loadEvents = useCallback(async () => {
    try {
      const data = await apiClient.getCourseEvents(courseId);
      setEvents(data);
    } catch (error) {
      console.error('Failed to load calendar:', error);
      toast.error(t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [courseId, t]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // ── Month grid math (days keyed by São Paulo dates) ───────────────────────
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CourseEvent[]>();
    for (const ev of events) {
      const { date } = utcToSpParts(ev.startsAtUtc);
      const list = map.get(date) ?? [];
      list.push(ev);
      map.set(date, list);
    }
    return map;
  }, [events]);

  const gridDays = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (string | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
    return cells;
  }, [monthCursor]);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return [...events]
      .filter((e) => new Date(e.startsAtUtc).getTime() >= now)
      .sort((a, b) => a.startsAtUtc.localeCompare(b.startsAtUtc))
      .slice(0, 8);
  }, [events]);

  const todaySp = utcToSpParts(new Date().toISOString()).date;

  // ── Dialog flows ───────────────────────────────────────────────────────────
  const openCreate = (date?: string) => {
    setEditingEvent(null);
    setLinkingAssignment(null);
    setForm({ ...EMPTY_FORM, date: date ?? todaySp });
    setDialogOpen(true);
  };

  const openEdit = (ev: CourseEvent) => {
    const { date, time } = utcToSpParts(ev.startsAtUtc);
    setEditingEvent(ev);
    setLinkingAssignment(null);
    setForm({
      title: ev.title,
      description: ev.description ?? '',
      eventType: ev.eventType,
      date,
      time,
      moduleId: ev.moduleId ? String(ev.moduleId) : '',
      remind7Days: ev.remind7Days,
      remind3Days: ev.remind3Days,
      remind2Days: ev.remind2Days,
      remind24Hours: ev.remind24Hours,
    });
    setDialogOpen(true);
  };

  /** Synthesized assignment → create the linked event so reminders can fire. */
  const openEnableReminders = (ev: CourseEvent) => {
    const { date, time } = utcToSpParts(ev.startsAtUtc);
    setEditingEvent(null);
    setLinkingAssignment(ev);
    setForm({
      title: ev.title,
      description: ev.description ?? '',
      eventType: 'assignment',
      date,
      time,
      moduleId: ev.moduleId ? String(ev.moduleId) : '',
      remind7Days: false,
      remind3Days: true,
      remind2Days: false,
      remind24Hours: true,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.date) {
      toast.error(t('validationError'));
      return;
    }
    setSaving(true);
    try {
      const startsAtUtc = spToUtcIso(form.date, form.time);
      if (editingEvent?.id) {
        await apiClient.updateCourseEvent(editingEvent.id, {
          title: form.title,
          description: form.description || undefined,
          eventType: form.eventType,
          startsAtUtc,
          moduleId: form.moduleId ? Number(form.moduleId) : null,
          remind7Days: form.remind7Days,
          remind3Days: form.remind3Days,
          remind2Days: form.remind2Days,
          remind24Hours: form.remind24Hours,
        });
        toast.success(t('updateSuccess'));
      } else {
        const payload: CourseEventCreate = {
          courseId,
          moduleId: form.moduleId ? Number(form.moduleId) : null,
          assignmentId: linkingAssignment?.assignmentId ?? null,
          title: form.title,
          description: form.description || undefined,
          eventType: linkingAssignment ? 'assignment' : form.eventType,
          startsAtUtc,
          remind7Days: form.remind7Days,
          remind3Days: form.remind3Days,
          remind2Days: form.remind2Days,
          remind24Hours: form.remind24Hours,
        };
        await apiClient.createCourseEvent(payload);
        toast.success(t('createSuccess'));
      }
      setDialogOpen(false);
      loadEvents();
    } catch (error) {
      console.error('Failed to save event:', error);
      toast.error(t('saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ev: CourseEvent) => {
    if (!ev.id) return;
    try {
      await apiClient.deleteCourseEvent(ev.id);
      toast.success(t('deleteSuccess'));
      setDialogOpen(false);
      loadEvents();
    } catch (error) {
      console.error('Failed to delete event:', error);
      toast.error(t('deleteError'));
    }
  };

  const formatEventDate = (iso: string) => {
    return new Date(iso).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  };

  const typeLabel = (type: CourseEventType) => t(`types.${type}`);
  const monthLabel = monthCursor.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const weekdays: string[] = t('weekdays').split(',');
  const remindersEnabled =
    form.remind7Days || form.remind3Days || form.remind2Days || form.remind24Hours;

  return (
    <div className="space-y-4">
      {/* Month grid */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 capitalize">
              <CalendarDays className="h-5 w-5" />
              {monthLabel}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              {canManage && (
                <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
                  <Sparkles className="mr-1 h-4 w-4" />
                  {t('import.button')}
                </Button>
              )}
              {canManage && (
                <Button size="sm" onClick={() => openCreate()}>
                  <Plus className="mr-1 h-4 w-4" />
                  {t('addEvent')}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">{tCommon('buttons.loading')}</p>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {weekdays.map((wd) => (
                <div key={wd} className="py-1 text-center text-xs font-medium text-muted-foreground">
                  {wd}
                </div>
              ))}
              {gridDays.map((day, idx) =>
                day === null ? (
                  <div key={`pad-${idx}`} />
                ) : (
                  <button
                    key={day}
                    onClick={() => canManage && openCreate(day)}
                    className={`min-h-20 rounded-md border p-1 text-left align-top transition-colors hover:bg-muted/50 ${
                      day === todaySp ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <span className={`text-xs ${day === todaySp ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                      {Number(day.slice(-2))}
                    </span>
                    <div className="mt-0.5 space-y-0.5">
                      {(eventsByDay.get(day) ?? []).slice(0, 3).map((ev, i) => (
                        <div
                          key={`${ev.id ?? 'a' + ev.assignmentId}-${i}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!canManage) return;
                            if (ev.isSynthesized) openEnableReminders(ev);
                            else openEdit(ev);
                          }}
                          title={`${typeLabel(ev.eventType)}: ${ev.title}`}
                          className={`truncate rounded border px-1 text-[10px] leading-4 ${TYPE_STYLES[ev.eventType]} ${
                            ev.isSynthesized ? 'border-dashed' : ''
                          }`}
                        >
                          {ev.title}
                        </div>
                      ))}
                      {(eventsByDay.get(day)?.length ?? 0) > 3 && (
                        <p className="text-[10px] text-muted-foreground">
                          +{(eventsByDay.get(day)?.length ?? 0) - 3}
                        </p>
                      )}
                    </div>
                  </button>
                )
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('upcoming')}</CardTitle>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">{t('empty')}</p>
          ) : (
            <div className="space-y-2">
              {upcoming.map((ev, i) => (
                <div
                  key={`${ev.id ?? 'a' + ev.assignmentId}-${i}`}
                  className="flex items-center justify-between gap-3 rounded-md border p-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${TYPE_STYLES[ev.eventType]}`}>
                        {typeLabel(ev.eventType)}
                      </span>
                      <p className="truncate text-sm font-medium">{ev.title}</p>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatEventDate(ev.startsAtUtc)} (Brasília)
                      {ev.moduleName ? ` · ${ev.moduleName}` : ''}
                      {(ev.remind7Days || ev.remind3Days || ev.remind2Days || ev.remind24Hours) && (
                        <Bell className="ml-1 inline h-3 w-3 text-primary" />
                      )}
                    </p>
                  </div>
                  {canManage && (
                    <div className="flex shrink-0 items-center gap-1">
                      {ev.isSynthesized ? (
                        <Button variant="outline" size="sm" onClick={() => openEnableReminders(ev)}>
                          <Bell className="mr-1 h-3 w-3" />
                          {t('enableReminders')}
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => openEdit(ev)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingEvent
                ? t('editEvent')
                : linkingAssignment
                ? t('enableRemindersTitle')
                : t('addEvent')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Type picker (locked for assignment-link mode) */}
            {!linkingAssignment && (
              <div>
                <label className="mb-1 block text-sm font-medium">{t('form.type')}</label>
                <div className="flex flex-wrap gap-2">
                  {(['test', 'assignment', 'holiday', 'field_event', 'other'] as CourseEventType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setForm((f) => ({ ...f, eventType: type }))}
                      className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                        form.eventType === type ? TYPE_STYLES[type] + ' font-semibold' : 'border-border text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {typeLabel(type)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Assignment type redirects to the assignments flow */}
            {!editingEvent && !linkingAssignment && form.eventType === 'assignment' ? (
              <div className="rounded-md border border-primary/30 bg-primary/5 p-4 text-sm">
                <p className="flex items-start gap-2">
                  <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {t('assignmentRedirectHint')}
                </p>
                <Button
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    setDialogOpen(false);
                    onGoToAssignments();
                  }}
                >
                  {t('goToAssignments')}
                </Button>
              </div>
            ) : (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium">{t('form.title')}</label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder={t('form.titlePlaceholder')}
                    disabled={!!linkingAssignment}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium">{t('form.date')}</label>
                    <Input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                      disabled={!!linkingAssignment}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">{t('form.time')}</label>
                    <Input
                      type="time"
                      value={form.time}
                      onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                      disabled={!!linkingAssignment}
                    />
                  </div>
                </div>
                <p className="-mt-2 text-xs text-muted-foreground">{t('form.timezoneHint')}</p>

                {!linkingAssignment && (
                  <>
                    <div>
                      <label className="mb-1 block text-sm font-medium">{t('form.module')}</label>
                      <select
                        value={form.moduleId}
                        onChange={(e) => setForm((f) => ({ ...f, moduleId: e.target.value }))}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">{t('form.allModules')}</option>
                        {modules.map((m) => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">{t('form.description')}</label>
                      <Textarea
                        rows={2}
                        value={form.description}
                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      />
                    </div>
                  </>
                )}

                {/* Reminder schedule */}
                <div className="rounded-md border p-3">
                  <p className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <Bell className="h-4 w-4" />
                    {t('form.reminders')}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        ['remind7Days', t('form.remind7d')],
                        ['remind3Days', t('form.remind3d')],
                        ['remind2Days', t('form.remind2d')],
                        ['remind24Hours', t('form.remind24h')],
                      ] as const
                    ).map(([key, label]) => (
                      <label key={key} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                        <span>{label}</span>
                        <Switch
                          checked={form[key]}
                          onCheckedChange={(v) => setForm((f) => ({ ...f, [key]: v }))}
                        />
                      </label>
                    ))}
                  </div>
                  {!remindersEnabled && (
                    <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <AlertTriangle className="h-3 w-3" />
                      {t('form.noRemindersHint')}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {!(form.eventType === 'assignment' && !editingEvent && !linkingAssignment) && (
            <DialogFooter className="flex items-center justify-between sm:justify-between">
              {editingEvent?.id ? (
                <Button variant="ghost" onClick={() => handleDelete(editingEvent)}>
                  <Trash2 className="mr-1 h-4 w-4 text-destructive" />
                  {t('deleteEvent')}
                </Button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  {tCommon('buttons.cancel')}
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? tCommon('loading') : tCommon('buttons.save')}
                </Button>
              </div>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {canManage && (
        <CalendarImportDialog
          courseId={courseId}
          open={importOpen}
          onOpenChange={setImportOpen}
          onImported={loadEvents}
        />
      )}
    </div>
  );
}
