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
  /**
   * Optional admin JWT — used ONLY in the live preview iframe (so the admin
   * sees the working chat, past the student verification gate). It is never
   * placed in the copyable embed code, which stays student-safe.
   */
  previewAuthToken?: string | null;
}

/**
 * Ready-to-paste iframe embed for an LMS (Moodle) HTML block. The snippet comes
 * pre-filled with the module key, allows the microphone (voice dictation) and
 * clipboard, and intentionally omits allowfullscreen so the embed can't go
 * fullscreen. Also shows the step-by-step Moodle instructions.
 */
// One-liner the customer pastes into their Moodle page's console (F12) to see
// whether the iframe survived Moodle's HTML sanitizer.
const DIAGNOSTIC =
  "(function(){var f=[].slice.call(document.querySelectorAll('iframe')).filter(function(i){return /tutoria/.test(i.src||'')});console.log(f.length?('\\u2705 Tutoria: '+f.length+' iframe(s) na p\\u00e1gina'):'\\u274c Tutoria: iframe removido pelo Moodle \\u2014 use o plugin Tutoria para Moodle');f.forEach(function(i){console.log('\\u2192',i.src)});if(f.length)console.log('Se ficar em branco, veja erros vermelhos de CSP/frame-src acima.');})();";

export function EmbedDialog({ token, onClose, previewAuthToken }: EmbedDialogProps) {
  const t = useTranslations('accessKeys.embed');
  const [copied, setCopied] = useState(false);
  const [copiedDiag, setCopiedDiag] = useState(false);

  const widgetUrl = token ? `${APP_CONFIG.widgetUrl}/?module_token=${token}` : '';
  // Preview may carry the admin token so the chat shows past the gate; the
  // copyable code below never does.
  const previewUrl =
    token && previewAuthToken
      ? `${widgetUrl}&auth_token=${encodeURIComponent(previewAuthToken)}`
      : widgetUrl;
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

  const handleCopyDiagnostic = async () => {
    try {
      await navigator.clipboard.writeText(DIAGNOSTIC);
      setCopiedDiag(true);
      toast.success(t('copied'));
      setTimeout(() => setCopiedDiag(false), 2000);
    } catch {
      toast.error(t('copyError'));
    }
  };

  const steps = [t('step1'), t('step2'), t('step3'), t('step4')];

  return (
    <Dialog open={!!token} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('intro')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Live preview — the real widget, mirroring the embed's iframe attrs. */}
          {token && (
            <div>
              <p className="mb-2 text-sm font-semibold">{t('previewLabel')}</p>
              <div className="h-[440px] overflow-hidden rounded-lg border bg-muted/30">
                <iframe
                  src={previewUrl}
                  title={t('previewLabel')}
                  className="h-full w-full border-0"
                  allow="clipboard-write; microphone"
                />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{t('previewHint')}</p>
            </div>
          )}
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

          {/* Moodle "protected"/sanitized courses often strip the iframe. */}
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">{t('troubleshootTitle')}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t('troubleshootNote')}</p>

            <div className="mt-3">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <p className="text-xs font-medium">{t('diagnosticLabel')}</p>
                <Button size="sm" variant="outline" onClick={handleCopyDiagnostic} className="h-7">
                  {copiedDiag ? (
                    <Check aria-hidden="true" className="mr-1.5 h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {copiedDiag ? t('copied') : t('copy')}
                </Button>
              </div>
              <p className="mb-1.5 text-xs text-muted-foreground">{t('diagnosticHint')}</p>
              <pre className="overflow-x-auto rounded-md border bg-background/60 p-2 text-[11px] leading-snug">
                <code>{DIAGNOSTIC}</code>
              </pre>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
