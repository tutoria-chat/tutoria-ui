'use client';

import { useTranslations } from 'next-intl';
import { Award, Sparkles } from 'lucide-react';
import type { EquippedTitle } from '@/lib/types';

/**
 * Renders a student's equipped academic title as a small pill, localized from
 * the structured EquippedTitle (key/type/track/tier). Returns null when the
 * student hasn't equipped a title.
 */
export function TitleBadge({ title, className = '' }: { title?: EquippedTitle | null; className?: string }) {
  const t = useTranslations('titles');
  if (!title) return null;

  let label: string;
  if (title.type === 'hidden') {
    label = t('hidden');
  } else if (title.type === 'global') {
    label = t(`globals.${title.key}` as never);
  } else if (title.type === 'track' && title.track && title.tier) {
    label = `${t(`tiers.${title.tier}` as never)} · ${t(`tracks.${title.track}` as never)}`;
  } else {
    return null;
  }

  const isHidden = title.type === 'hidden';

  return (
    <span
      title={label}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
        isHidden
          ? 'border-transparent bg-gradient-to-r from-[#5e17eb] to-[#5ce1e6] text-white'
          : 'border-primary/20 bg-primary/10 text-primary'
      } ${className}`}
    >
      {isHidden ? <Sparkles className="h-3 w-3" /> : <Award className="h-3 w-3" />}
      {label}
    </span>
  );
}
