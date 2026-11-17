'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { apiClient } from '@/lib/api';
import type { GradingMode, GradingModeSettings, InstitutionType } from '@/lib/types';

/**
 * Super_admin-only setting for the Moodle grading assistant.
 *
 * Universities and schools (under MEC/CNE) must stay in "feedback" mode: the CNE
 * Guidelines forbid AI-suggested grades on essays. "score" is only for corporate
 * training outside MEC, needs a signed contract reference, and is audit-logged.
 * The API and a database constraint refuse score mode on a non-corporate institution.
 */
export function GradingModeCard({ universityId }: { universityId: number }) {
  const t = useTranslations('universities.gradingMode');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [current, setCurrent] = useState<GradingModeSettings | null>(null);
  const [institutionType, setInstitutionType] = useState<InstitutionType>('university');
  const [gradingMode, setGradingMode] = useState<GradingMode>('feedback');
  const [contractRef, setContractRef] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    apiClient.getGradingMode(universityId)
      .then((s) => {
        if (!alive) return;
        setCurrent(s);
        setInstitutionType(s.institutionType);
        setGradingMode(s.gradingMode);
        setContractRef(s.contractRef || '');
      })
      .catch(() => alive && setError(t('loadError')))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [universityId, t]);

  // Score is only possible for corporate institutions.
  const scoreAllowed = institutionType === 'corporate';
  const effectiveMode: GradingMode = scoreAllowed ? gradingMode : 'feedback';
  const changed = !!current && (
    current.institutionType !== institutionType
    || current.gradingMode !== effectiveMode
    || (current.contractRef || '') !== contractRef.trim()
  );
  const needsContract = effectiveMode === 'score' && !contractRef.trim();

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const s = await apiClient.updateGradingMode(universityId, {
        institutionType,
        gradingMode: effectiveMode,
        contractRef: contractRef.trim() || null,
      });
      setCurrent(s);
      setGradingMode(s.gradingMode);
      toast.success(t('saved'));
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : t('saveError'));
    } finally {
      setSaving(false);
    }
  };

  const onSave = () => {
    // Turning score on is a contract decision: confirm it explicitly.
    if (effectiveMode === 'score' && current?.gradingMode !== 'score') {
      setConfirmOpen(true);
    } else {
      void save();
    }
  };

  return (
    <Card className="max-w-4xl w-full">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <LoadingSpinner size="sm" className="text-primary" />
        ) : (
          <>
            <div>
              <label htmlFor="institutionType" className="block text-sm font-medium mb-1">{t('institutionTypeLabel')}</label>
              <Select value={institutionType} onValueChange={(v) => setInstitutionType(v as InstitutionType)}>
                <SelectTrigger id="institutionType"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="university">{t('institutionUniversity')}</SelectItem>
                  <SelectItem value="corporate">{t('institutionCorporate')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="gradingMode" className="block text-sm font-medium mb-1">{t('modeLabel')}</label>
              <Select
                value={effectiveMode}
                onValueChange={(v) => setGradingMode(v as GradingMode)}
                disabled={!scoreAllowed}
              >
                <SelectTrigger id="gradingMode"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="feedback">{t('modeFeedback')}</SelectItem>
                  <SelectItem value="score">{t('modeScore')}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {scoreAllowed ? t('modeHelpCorporate') : t('modeHelpUniversity')}
              </p>
            </div>

            {effectiveMode === 'score' && (
              <div>
                <label htmlFor="contractRef" className="block text-sm font-medium mb-1">{t('contractLabel')}</label>
                <Input
                  id="contractRef"
                  value={contractRef}
                  onChange={(e) => setContractRef(e.target.value)}
                  placeholder={t('contractPlaceholder')}
                  maxLength={255}
                />
                <p className="text-xs text-muted-foreground mt-1">{t('contractHelp')}</p>
              </div>
            )}

            {current?.changedAt && (
              <p className="text-xs text-muted-foreground">
                {t('lastChanged', { date: new Date(current.changedAt).toLocaleString() })}
              </p>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="button" onClick={onSave} disabled={!changed || saving || needsContract}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('save')}
            </Button>
          </>
        )}
      </CardContent>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={() => void save()}
        title={t('confirmTitle')}
        description={t('confirmDescription')}
        confirmText={t('confirmButton')}
        cancelText={t('cancel')}
      />
    </Card>
  );
}
