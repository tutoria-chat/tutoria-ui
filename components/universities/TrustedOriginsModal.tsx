'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, X, Globe, ShieldCheck, GraduationCap } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

export interface TrustedOriginsModalProps {
  open: boolean;
  onClose: () => void;
  universityId: number;
  universityName: string;
  onSaved?: () => void;
}

/**
 * Lets a super admin manage the list of web addresses an institution's own
 * systems (LMS / Moodle / student portal) are allowed to connect from — needed
 * so features like AUTOMATIC GRADING work when the institution calls TutorIA
 * from inside a browser. Deliberately non-technical: staff paste the address of
 * their platform, we handle the rest server-side.
 */
export function TrustedOriginsModal({
  open,
  onClose,
  universityId,
  universityName,
  onSaved,
}: TrustedOriginsModalProps) {
  const t = useTranslations('universities.trustedOrigins');

  const [addresses, setAddresses] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load the current list whenever the modal opens.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setDraft('');
    apiClient
      .getTrustedOrigins(universityId)
      .then((list) => {
        if (!cancelled) setAddresses(list);
      })
      .catch((err) => {
        console.error('Error loading trusted addresses:', err);
        if (!cancelled) {
          setAddresses([]);
          toast.error(t('loadError'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, universityId, t]);

  const addDraft = useCallback(() => {
    const value = draft.trim();
    if (!value) return;
    // Light client-side de-dupe on the raw text; the server does the real
    // normalization (lowercasing, dropping paths, etc.).
    const already = addresses.some((a) => a.toLowerCase() === value.toLowerCase());
    if (already) {
      setDraft('');
      return;
    }
    setAddresses((prev) => [...prev, value]);
    setDraft('');
  }, [draft, addresses]);

  const removeAt = useCallback((index: number) => {
    setAddresses((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addDraft();
    }
  };

  const handleSave = async () => {
    // Fold any unsubmitted text in the box into the list before saving.
    const pending = draft.trim();
    const toSave = pending && !addresses.some((a) => a.toLowerCase() === pending.toLowerCase())
      ? [...addresses, pending]
      : addresses;

    setSaving(true);
    try {
      const saved = await apiClient.updateTrustedOrigins(universityId, toSave);
      setAddresses(saved);
      setDraft('');
      toast.success(t('saveSuccess'));
      onSaved?.();
      onClose();
    } catch (err) {
      console.error('Error saving trusted addresses:', err);
      toast.error(t('saveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            {t('title')}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {t('description', { name: universityName })}
          </p>
        </DialogHeader>

        {/* Friendly "why" explainer — the automatic grading use case */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
          <div className="flex items-start gap-2">
            <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-sm text-foreground/80">{t('whyExplainer')}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <LoadingSpinner size="lg" className="text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Add a new address */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('inputLabel')}</Label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('inputPlaceholder')}
                  className="h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <Button type="button" variant="outline" size="sm" onClick={addDraft} disabled={!draft.trim()}>
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  {t('addButton')}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{t('inputHelp')}</p>
            </div>

            {/* Current list */}
            {addresses.length === 0 ? (
              <div className="rounded-lg border border-dashed py-8 text-center">
                <ShieldCheck className="mx-auto mb-2 h-6 w-6 text-muted-foreground/60" />
                <p className="text-sm text-muted-foreground">{t('emptyState')}</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {addresses.map((address, index) => (
                  <li
                    key={`${address}-${index}`}
                    className="flex items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2"
                  >
                    <span className="min-w-0 flex-1 truncate font-mono text-sm" title={address}>
                      {address}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAt(index)}
                      aria-label={t('removeLabel')}
                      title={t('removeLabel')}
                      className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                {t('saving')}
              </>
            ) : (
              t('save')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
