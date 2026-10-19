'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFormatter, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  AlertTriangle,
  CalendarClock,
  CalendarPlus,
  Hourglass,
  PauseCircle,
  PlayCircle,
  Power,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import { apiClient } from '@/lib/api';
import type { CourseLifecycle, CourseLifecycleAction } from '@/lib/types';

interface CourseLifecycleCardProps {
  courseId: number;
  /** Changes when the roster changes (e.g. the student count), to refetch. */
  refreshKey?: number;
  /** Called after any change, e.g. so the page can grey out an inactive course. */
  onChanged?: (lifecycle: CourseLifecycle) => void;
}

/**
 * The course's duration timer and the actions around it: pause auto-removal,
 * hold 7 more days, "course not in use", reactivate, remove from the list.
 * Everyone who can see the course sees the status; only the assigned
 * professor and higher roles (lifecycle.canManage) get the buttons.
 */
export function CourseLifecycleCard({ courseId, refreshKey, onChanged }: CourseLifecycleCardProps) {
  const t = useTranslations('courses.lifecycle');
  const tCommon = useTranslations('common');
  const format = useFormatter();
  const router = useRouter();
  const { confirm, dialog } = useConfirmDialog();
  const [lifecycle, setLifecycle] = useState<CourseLifecycle | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLifecycle(await apiClient.getCourseLifecycle(courseId));
    } catch {
      setLifecycle(null); // older API or no access — the page works without the card
    }
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  if (!lifecycle) return null;

  const date = (iso: string | null) =>
    iso ? format.dateTime(new Date(iso), { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const run = async (action: CourseLifecycleAction, successKey: string) => {
    setBusy(action);
    try {
      const next = await apiClient.updateCourseLifecycle(courseId, action);
      setLifecycle(next);
      onChanged?.(next);
      toast.success(t(successKey));
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : t('actionError'));
    } finally {
      setBusy(null);
    }
  };

  const deactivate = () =>
    confirm({
      title: t('deactivateConfirm.title'),
      description: t('deactivateConfirm.description'),
      confirmText: t('actions.deactivate'),
      cancelText: tCommon('buttons.cancel'),
      onConfirm: () => run('deactivate', 'toasts.deactivated'),
    });

  const removeFromList = () =>
    confirm({
      title: t('removeConfirm.title'),
      description: t('removeConfirm.description'),
      confirmText: t('actions.remove'),
      cancelText: tCommon('buttons.cancel'),
      variant: 'destructive',
      onConfirm: async () => {
        setBusy('remove');
        try {
          await apiClient.removeCourseFromList(courseId);
          toast.success(t('toasts.removed'));
          router.push('/courses');
        } catch (error) {
          toast.error(error instanceof Error && error.message ? error.message : t('actionError'));
        } finally {
          setBusy(null);
        }
      },
    });

  const { status, canManage } = lifecycle;
  const inactive = status === 'inactive';
  const scheduled = status === 'removal_scheduled';

  const tone = inactive
    ? 'border-muted-foreground/30 bg-muted/40'
    : scheduled
      ? 'border-amber-500/50 bg-amber-50 dark:bg-amber-950/20'
      : '';

  const Icon = inactive ? Power : scheduled ? AlertTriangle : status === 'paused' ? PauseCircle : Hourglass;

  const summary = (() => {
    switch (status) {
      case 'inactive':
        return t('summary.inactive', { date: date(lifecycle.deactivatedAt) });
      case 'no_duration':
        return t('summary.noDuration');
      case 'waiting_students':
        return t('summary.waitingStudents', { count: lifecycle.durationMonths ?? 0 });
      case 'paused':
        return t('summary.paused');
      case 'removal_scheduled':
        return t('summary.removalScheduled', { count: lifecycle.studentsCount, date: date(lifecycle.removalAt) });
      default:
        return t('summary.running', { date: date(lifecycle.removalAt) });
    }
  })();

  const showTimeline = lifecycle.startedAt && !inactive && status !== 'no_duration';

  return (
    <Card className={tone}>
      <CardContent className="py-4 px-5 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <Icon
              aria-hidden="true"
              className={`mt-0.5 h-5 w-5 shrink-0 ${
                scheduled ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
              }`}
            />
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">{t('title')}</p>
                <Badge variant={inactive ? 'outline' : scheduled ? 'destructive' : 'secondary'}>
                  {t(`status.${status}`)}
                </Badge>
                {lifecycle.durationMonths && (
                  <span className="text-xs text-muted-foreground">
                    {t('duration', { count: lifecycle.durationMonths })}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{summary}</p>
              {showTimeline && (
                <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <CalendarClock aria-hidden="true" className="h-3.5 w-3.5" />
                    {t('timeline.started', { date: date(lifecycle.startedAt) })}
                  </span>
                  <span>{t('timeline.ends', { date: date(lifecycle.expiresAt) })}</span>
                  {!lifecycle.paused && <span>{t('timeline.removal', { date: date(lifecycle.removalAt) })}</span>}
                  {lifecycle.extensionDays > 0 && (
                    <span>{t('timeline.held', { days: lifecycle.extensionDays })}</span>
                  )}
                </p>
              )}
              {lifecycle.unusedAlertActive && (
                <p className="text-xs text-amber-700 dark:text-amber-400">{t('unusedNote')}</p>
              )}
            </div>
          </div>
        </div>

        {canManage && (
          <div className="flex flex-wrap gap-2">
            {inactive ? (
              <>
                <Button size="sm" onClick={() => run('reactivate', 'toasts.reactivated')} disabled={!!busy}>
                  <RotateCcw aria-hidden="true" className="mr-2 h-4 w-4" />
                  {t('actions.reactivate')}
                </Button>
                <Button size="sm" variant="outline" onClick={removeFromList} disabled={!!busy}
                  className="text-destructive hover:text-destructive">
                  <Trash2 aria-hidden="true" className="mr-2 h-4 w-4" />
                  {t('actions.remove')}
                </Button>
              </>
            ) : (
              <>
                {(status === 'running' || status === 'removal_scheduled') && (
                  <Button size="sm" variant={scheduled ? 'default' : 'outline'}
                    onClick={() => run('extend', 'toasts.extended')} disabled={!!busy}>
                    <CalendarPlus aria-hidden="true" className="mr-2 h-4 w-4" />
                    {t('actions.extend')}
                  </Button>
                )}
                {(status === 'running' || status === 'removal_scheduled' || status === 'waiting_students') && (
                  <Button size="sm" variant="outline" onClick={() => run('pause', 'toasts.paused')} disabled={!!busy}>
                    <PauseCircle aria-hidden="true" className="mr-2 h-4 w-4" />
                    {t('actions.pause')}
                  </Button>
                )}
                {status === 'paused' && (
                  <Button size="sm" variant="outline" onClick={() => run('resume', 'toasts.resumed')} disabled={!!busy}>
                    <PlayCircle aria-hidden="true" className="mr-2 h-4 w-4" />
                    {t('actions.resume')}
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={deactivate} disabled={!!busy}>
                  <Power aria-hidden="true" className="mr-2 h-4 w-4" />
                  {t('actions.deactivate')}
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
      {dialog}
    </Card>
  );
}
