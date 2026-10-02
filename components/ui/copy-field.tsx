'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

/**
 * A read-only value with a copy button — for setup values an admin pastes
 * somewhere else (LMS URLs, institution id, API keys).
 */
export function CopyField({ label, value, hint }: { label: string; value: string; hint?: string }) {
  const t = useTranslations('common');
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(t('copyError'));
    }
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <code className="flex-1 truncate rounded-md border bg-muted/40 px-3 py-2 text-xs">{value}</code>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={copy}
          aria-label={t('copyLabel', { label })}
          title={copied ? t('copied') : t('copy')}
        >
          {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? t('copied') : ''}
      </span>
    </div>
  );
}
