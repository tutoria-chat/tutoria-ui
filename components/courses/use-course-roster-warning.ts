'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useFormatter, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';

/**
 * Warn (once per page open) when a module's course can't be used by students:
 * no students registered yet, the last class was removed because its time
 * ended, removal is coming up, or the course is marked "not in use". Without
 * students in the roster nobody gets past the widget's matrícula check.
 */
export function useCourseRosterWarning(courseId: number | null | undefined) {
  const t = useTranslations('courses.rosterWarning');
  const format = useFormatter();
  const router = useRouter();
  const shownFor = useRef<number | null>(null);

  useEffect(() => {
    if (!courseId || shownFor.current === courseId) return;
    shownFor.current = courseId;
    let cancelled = false;

    apiClient
      .getCourseLifecycle(courseId)
      .then((lifecycle) => {
        if (cancelled) return;
        const date = (iso: string | null) =>
          iso ? format.dateTime(new Date(iso), { day: 'numeric', month: 'short', year: 'numeric' }) : '';
        const action = { label: t('openCourse'), onClick: () => router.push(`/courses/${courseId}`) };
        const options = { duration: 10000, action };

        if (lifecycle.status === 'inactive') {
          toast.warning(t('inactiveTitle'), { ...options, description: t('inactive') });
        } else if (lifecycle.studentsCount === 0 && lifecycle.studentsRemovedAt) {
          toast.warning(t('endedTitle'), { ...options, description: t('ended', { date: date(lifecycle.studentsRemovedAt) }) });
        } else if (lifecycle.studentsCount === 0) {
          toast.warning(t('emptyTitle'), { ...options, description: t('empty') });
        } else if (lifecycle.status === 'removal_scheduled') {
          toast.warning(t('endingTitle'), {
            ...options,
            description: t('ending', { count: lifecycle.studentsCount, date: date(lifecycle.removalAt) }),
          });
        }
      })
      .catch(() => {
        // no access to the course lifecycle (or older API) — no warning
      });

    return () => {
      cancelled = true;
    };
  }, [courseId, format, router, t]);
}
