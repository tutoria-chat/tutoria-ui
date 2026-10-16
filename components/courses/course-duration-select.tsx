'use client';

import { useTranslations } from 'next-intl';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const COURSE_DURATION_MIN_MONTHS = 1;
export const COURSE_DURATION_MAX_MONTHS = 24;

const MONTH_OPTIONS = Array.from(
  { length: COURSE_DURATION_MAX_MONTHS - COURSE_DURATION_MIN_MONTHS + 1 },
  (_, i) => COURSE_DURATION_MIN_MONTHS + i,
);

interface CourseDurationSelectProps {
  id?: string;
  value: number | null;
  onChange: (months: number) => void;
  disabled?: boolean;
  invalid?: boolean;
}

/** Course duration in months (1–24), with semester/year hints. */
export function CourseDurationSelect({ id = 'durationMonths', value, onChange, disabled, invalid }: CourseDurationSelectProps) {
  const t = useTranslations('courses.duration');

  const label = (months: number) =>
    months === 6 ? t('optionSemester', { count: months })
      : months === 12 ? t('optionYear', { count: months })
        : t('option', { count: months });

  return (
    <Select
      value={value ? String(value) : undefined}
      onValueChange={(v) => onChange(parseInt(v, 10))}
      disabled={disabled}
    >
      <SelectTrigger id={id} className={invalid ? 'w-full border-destructive' : 'w-full'} aria-invalid={invalid || undefined}>
        <SelectValue placeholder={t('placeholder')} />
      </SelectTrigger>
      <SelectContent>
        {MONTH_OPTIONS.map((months) => (
          <SelectItem key={months} value={String(months)}>
            {label(months)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
