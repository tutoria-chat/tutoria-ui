'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { APP_CONFIG } from '@/lib/constants';
import { toast } from 'sonner';

interface EmbedDialogProps {
  /** The module access key (module_token). Dialog is open while non-null. */
  token: string | null;
  onClose: () => void;
}

/**
 * Ready-to-paste iframe embed for an LMS (Moodle) HTML block. The snippet comes
 * pre-filled with the module key, allows the microphone (voice dictation) and
 * clipboard, and intentionally omits allowfullscreen so the embed can't go
 * fullscreen. Also shows the step-by-step Moodle instructions.
 */
export function EmbedDialog({ token, onClose }: EmbedDialogProps) {
  const t = useTranslations('accessKeys.embed');
  const [copied, setCopied] = useState(false);

  const widgetUrl = token ? `${APP_CONFIG.widgetUrl}/?module_token=${token}` : '';
  const code = token
    ? `<iframe
  src="${widgetUrl}"
  width="100%"
  height="800"
  style="border:0; width:100%; min-height:800px;"
  allow="clipboard-write; microphone"
  title="Tutoria">
</iframe>`
    : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success(t('copied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('copyError'));
    }
  };

  const steps = [t('step1'), t('step2'), t('step3'), t('step4')];

  return (
    <Dialog open={!!token} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('intro')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Moodle steps */}
          <div>
            <p className="mb-2 text-sm font-semibold">{t('moodleStepsTitle')}</p>
            <ol className="space-y-2">
              {steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                  <span
                    aria-hidden="true"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
                  >
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Code to paste */}
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">{t('codeLabel')}</p>
              <Button size="sm" variant="outline" onClick={handleCopy} className="h-8">
                {copied ? (
                  <Check aria-hidden="true" className="mr-1.5 h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />
                )}
                {copied ? t('copied') : t('copy')}
              </Button>
            </div>
            <pre className="max-h-56 overflow-auto rounded-lg border bg-muted/50 p-3 text-xs leading-relaxed">
              <code>{code}</code>
            </pre>
          </div>

          <p className="text-xs text-muted-foreground">{t('note')}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
