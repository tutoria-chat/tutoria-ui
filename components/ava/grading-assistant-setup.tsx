'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  BookOpen,
  CheckCircle2,
  Download,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CopyField } from '@/components/ui/copy-field';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import { AdminOnly } from '@/components/auth/role-guard';
import { useAuth } from '@/components/auth/auth-provider';
import { apiClient, API_CONFIG } from '@/lib/api';
import { AVA_PLUGINS } from '@/lib/ava-plugins';
import { formatDateShort } from '@/lib/utils';
import type {
  CreatedUniversityApiKey,
  UniversityApiKey,
  UniversityApiKeySetupInfo,
} from '@/lib/types';

/**
 * "Assistente de Correção" tab of the AVA setup page: everything needed to
 * install the Moodle grading assistant (quiz_tutoria) and use it — the plugin
 * download, the three values to paste (with the institution's own API key,
 * managed here by managers/super admins), install steps and a usage guide.
 */
export function GradingAssistantSetup() {
  const t = useTranslations('ava.grading');
  const tAva = useTranslations('ava');
  const { user } = useAuth();
  const universityId = user?.universityId ?? null;
  const plugin = AVA_PLUGINS.grading;

  const installSteps = t.raw('install.steps') as string[];
  const usageSteps = t.raw('usage.steps') as string[];
  const troubleshooting = t.raw('troubleshooting.items') as { problem: string; fix: string }[];

  return (
    <div className="space-y-6">
      {/* What it is — and the CNE rule up front */}
      <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0">
          <p className="font-semibold">{t('intro.title')}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t('intro.body')}</p>
        </div>
      </div>

      {/* The full illustrated guide — the same steps, to forward to the Moodle admin and teachers */}
      {plugin.guide && (
        <div className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <BookOpen aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="font-semibold">{t('guide.button')}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t('guide.note')}</p>
            </div>
          </div>
          <Button asChild variant="outline" className="shrink-0">
            <a href={plugin.guide} target="_blank" rel="noopener noreferrer">
              <Download aria-hidden="true" className="mr-2 h-4 w-4" />
              {t('guide.open')}
            </a>
          </Button>
        </div>
      )}

      {/* 1. One-time setup */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('setup.title')}</CardTitle>
          <CardDescription>{t('setup.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {universityId && (
            <AdminOnly>
              <StatusBanner universityId={universityId} />
            </AdminOnly>
          )}

          {/* Plugin download — same treatment as the other AVA plugins */}
          <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-semibold">{t('download.title')}</p>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>v{plugin.version}</span>
                <span className="inline-flex items-center gap-1">
                  <RefreshCw aria-hidden="true" className="h-3 w-3" />
                  {tAva('download.updated', { date: formatDateShort(plugin.updatedAt) })}
                </span>
                <span>{plugin.size}</span>
              </p>
            </div>
            <Button asChild className="shrink-0">
              <a href={plugin.file} download>
                <Download aria-hidden="true" className="mr-2 h-4 w-4" />
                {tAva('download.button')}
              </a>
            </Button>
          </div>

          {/* The three values the plugin needs */}
          <section aria-labelledby="grading-values-title" className="space-y-4">
            <div>
              <p id="grading-values-title" className="text-sm font-semibold">{t('values.title')}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t('values.description')}</p>
            </div>

            <CopyField label={t('values.url')} value={API_CONFIG.baseURL} hint={t('values.urlHint')} />

            {universityId ? (
              <CopyField
                label={t('values.institutionId')}
                value={String(universityId)}
                hint={t('values.institutionIdHint')}
              />
            ) : (
              <p className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
                {t('values.noInstitution')}
              </p>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t('values.key')}</Label>
              <AdminOnly
                hideIfNoAccess={false}
                fallback={
                  <p className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
                    {t('keys.askManager')}
                  </p>
                }
              >
                {universityId ? (
                  <KeyManager universityId={universityId} />
                ) : (
                  <p className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
                    {t('values.noInstitution')}
                  </p>
                )}
              </AdminOnly>
            </div>
          </section>

          <Steps title={t('install.title')} steps={installSteps} />
        </CardContent>
      </Card>

      {/* 2. Usage guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('usage.title')}</CardTitle>
          <CardDescription>{t('usage.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Steps steps={usageSteps} />

          <p className="text-sm text-muted-foreground">{t('usage.inMoodle')}</p>

          <div className="flex items-start gap-2 rounded-lg bg-primary/5 p-3 text-xs text-muted-foreground">
            <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{t('usage.audit')}</span>
          </div>

          <details className="group rounded-lg border">
            <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium">
              {t('troubleshooting.title')}
            </summary>
            <dl className="divide-y border-t">
              {troubleshooting.map((item) => (
                <div
                  key={item.problem}
                  className="grid gap-1 px-4 py-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-4"
                >
                  <dt className="text-sm font-medium">{item.problem}</dt>
                  <dd className="text-sm text-muted-foreground">{item.fix}</dd>
                </div>
              ))}
            </dl>
          </details>
        </CardContent>
      </Card>
    </div>
  );
}

/** Numbered steps — same look as the rest of the AVA setup page. */
function Steps({ title, steps }: { title?: string; steps: string[] }) {
  return (
    <div>
      {title && <p className="mb-3 text-sm font-semibold">{title}</p>}
      <ol className="space-y-3">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3 text-sm">
            <span
              aria-hidden="true"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
            >
              {i + 1}
            </span>
            <span className="pt-0.5 text-muted-foreground">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Is AI grading enabled for this institution? (managers/super admins only) */
function StatusBanner({ universityId }: { universityId: number }) {
  const t = useTranslations('ava.grading.status');
  const [info, setInfo] = useState<UniversityApiKeySetupInfo | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .getApiKeySetupInfo(universityId)
      .then((data) => !cancelled && setInfo(data))
      .catch(() => !cancelled && setInfo(null));
    return () => {
      cancelled = true;
    };
  }, [universityId]);

  if (!info) return null;

  return info.enabled ? (
    <div className="flex items-start gap-2 rounded-lg border border-green-500/30 bg-green-500/5 p-3 text-sm">
      <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
      <span>{t('enabled', { name: info.universityName })}</span>
    </div>
  ) : (
    <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
      <TriangleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      <span>{t('disabled', { name: info.universityName })}</span>
    </div>
  );
}

/**
 * The institution's API keys: generate (shown ONCE, then only a prefix),
 * see when each was last used, and revoke.
 */
function KeyManager({ universityId }: { universityId: number }) {
  const t = useTranslations('ava.grading.keys');
  const [keys, setKeys] = useState<UniversityApiKey[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<CreatedUniversityApiKey | null>(null);
  const { confirm, dialog } = useConfirmDialog();

  const load = useCallback(async () => {
    try {
      setKeys(await apiClient.getUniversityApiKeys(universityId));
      setLoadError(false);
    } catch {
      setKeys([]);
      setLoadError(true);
    }
  }, [universityId]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const result = await apiClient.createUniversityApiKey(universityId, name.trim() || t('defaultName'));
      setCreated(result);
      // The list never holds the full key — only what every row shows.
      const row: UniversityApiKey = {
        id: result.id,
        name: result.name,
        keyPrefix: result.keyPrefix,
        createdAt: result.createdAt,
        lastUsedAt: result.lastUsedAt,
        revokedAt: result.revokedAt,
        isActive: result.isActive,
      };
      setKeys((prev) => [row, ...(prev ?? [])]);
      setName('');
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : t('createError'));
    } finally {
      setCreating(false);
    }
  };

  const revoke = (key: UniversityApiKey) =>
    confirm({
      title: t('revokeTitle'),
      description: t('revokeDescription', { name: key.name, prefix: key.keyPrefix }),
      confirmText: t('revoke'),
      cancelText: t('cancel'),
      variant: 'destructive',
      onConfirm: async () => {
        try {
          await apiClient.revokeUniversityApiKey(universityId, key.id);
          setKeys((prev) =>
            (prev ?? []).map((k) =>
              k.id === key.id ? { ...k, isActive: false, revokedAt: new Date().toISOString() } : k,
            ),
          );
          if (created?.id === key.id) setCreated(null);
          toast.success(t('revoked'));
        } catch {
          toast.error(t('revokeError'));
        }
      },
    });

  return (
    <div className="space-y-4 rounded-xl border p-4">
      <p className="text-sm text-muted-foreground">{t('intro')}</p>

      {/* Just created: the only time the full key is visible */}
      {created && (
        <div
          role="status"
          className="space-y-3 rounded-lg border-2 border-primary/40 bg-primary/5 p-4"
        >
          <p className="flex items-center gap-2 font-semibold">
            <KeyRound aria-hidden="true" className="h-4 w-4 text-primary" />
            {t('newTitle')}
          </p>
          <CopyField label={created.name} value={created.key} />
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <TriangleAlert aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
            {t('newWarning')}
          </p>
          <Button type="button" variant="outline" size="sm" onClick={() => setCreated(null)}>
            {t('done')}
          </Button>
        </div>
      )}

      <form onSubmit={create} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="grading-key-name" className="text-xs">{t('nameLabel')}</Label>
          <Input
            id="grading-key-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('namePlaceholder')}
            maxLength={100}
          />
        </div>
        <Button type="submit" disabled={creating} className="shrink-0">
          {creating ? (
            <LoadingSpinner size="sm" className="mr-2" />
          ) : (
            <KeyRound aria-hidden="true" className="mr-2 h-4 w-4" />
          )}
          {creating ? t('generating') : t('generate')}
        </Button>
      </form>

      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">{t('listTitle')}</p>
        {keys === null ? (
          <div className="flex justify-center py-4">
            <LoadingSpinner size="md" className="text-primary" />
          </div>
        ) : loadError ? (
          <p className="text-sm text-destructive">{t('loadError')}</p>
        ) : keys.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {keys.map((key) => (
              <li key={key.id} className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5">
                <div className="min-w-0">
                  {/* A div, not a p: Badge renders a div (invalid inside <p>). */}
                  <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    <span className="truncate">{key.name}</span>
                    <Badge variant={key.isActive ? 'secondary' : 'outline'}>
                      {key.isActive ? t('active') : t('revokedBadge')}
                    </Badge>
                  </div>
                  <p className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <code>{key.keyPrefix}…</code>
                    {key.createdAt && <span>{t('created', { date: formatDateShort(key.createdAt) })}</span>}
                    <span>
                      {key.lastUsedAt
                        ? t('lastUsed', { date: formatDateShort(key.lastUsedAt) })
                        : t('neverUsed')}
                    </span>
                  </p>
                </div>
                {key.isActive && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => revoke(key)}
                    className="text-destructive hover:text-destructive"
                    aria-label={t('revokeAria', { name: key.name })}
                  >
                    <Trash2 aria-hidden="true" className="mr-1.5 h-4 w-4" />
                    {t('revoke')}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {dialog}
    </div>
  );
}
