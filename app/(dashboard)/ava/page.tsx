'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Blocks,
  Code2,
  Download,
  Check,
  ArrowRight,
  KeyRound,
  RefreshCw,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProfessorOnly } from '@/components/auth/role-guard';
import { AVA_PLUGINS } from '@/lib/ava-plugins';
import { formatDateShort } from '@/lib/utils';
import { cn } from '@/lib/utils';

type Method = 'block' | 'iframe';

const METHODS: { id: Method; icon: typeof Blocks; recommended?: boolean }[] = [
  { id: 'block', icon: Blocks, recommended: true },
  { id: 'iframe', icon: Code2 },
];

export default function AvaConfigPage() {
  const t = useTranslations('ava');
  const [method, setMethod] = useState<Method>('block');

  const steps = t.raw(`${method}.steps`) as string[];
  const plugin = method === 'block' ? AVA_PLUGINS.block : null;

  return (
    <ProfessorOnly>
      <div className="space-y-6">
        <PageHeader
          title={t('title')}
          description={t('description')}
          breadcrumbs={[{ label: t('title'), isCurrentPage: true }]}
        />

        {/* Method chooser */}
        <div>
          <p className="mb-3 text-sm font-medium text-muted-foreground">{t('chooseMethod')}</p>
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={t('chooseMethod')}>
            {METHODS.map(({ id, icon: Icon, recommended }) => {
              const selected = method === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setMethod(id)}
                  className={cn(
                    'relative rounded-xl border-2 p-4 text-left transition-all hover:border-primary/50',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    selected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border',
                  )}
                >
                  {recommended && (
                    <Badge className="absolute right-3 top-3" variant="secondary">
                      {t('recommended')}
                    </Badge>
                  )}
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </div>
                  <p className="mt-3 font-semibold">{t(`${id}.name`)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t(`${id}.tagline`)}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected method detail */}
        <Card>
          <CardContent className="space-y-6 pt-6">
            {/* Plugin download */}
            {plugin && (
              <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold">{t('download.title', { name: t(`${method}.name`) })}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>v{plugin.version}</span>
                    <span className="inline-flex items-center gap-1">
                      <RefreshCw aria-hidden="true" className="h-3 w-3" />
                      {t('download.updated', { date: formatDateShort(plugin.updatedAt) })}
                    </span>
                    <span>{plugin.size}</span>
                  </p>
                </div>
                <Button asChild className="shrink-0">
                  <a href={plugin.file} download>
                    <Download aria-hidden="true" className="mr-2 h-4 w-4" />
                    {t('download.button')}
                  </a>
                </Button>
              </div>
            )}

            {/* Steps */}
            <div>
              <p className="mb-3 text-sm font-semibold">{t('stepsTitle')}</p>
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

            {/* Method-specific footer */}
            {method === 'iframe' ? (
              <div className="space-y-3">
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground">
                  {t('iframe.note')}
                </div>
                <Button asChild variant="outline">
                  <Link href="/tokens">
                    <KeyRound aria-hidden="true" className="mr-2 h-4 w-4" />
                    {t('iframe.goToKeys')}
                    <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-lg bg-primary/5 p-3 text-xs text-muted-foreground">
                <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{t('pluginNote')}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProfessorOnly>
  );
}
