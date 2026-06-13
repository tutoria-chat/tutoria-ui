'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { GraduationCap, RefreshCw, Download } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/components/auth/auth-provider';
import { apiClient } from '@/lib/api';
import type { EnemBankStatus } from '@/lib/types';
import { toast } from 'sonner';

const AREAS = ['linguagens', 'humanas', 'natureza', 'matematica'] as const;

export default function EnemBankPage() {
  const t = useTranslations('enem');
  const { user } = useAuth();
  const isSuperAdmin = user?.userType === 'super_admin';

  const [bank, setBank] = useState<EnemBankStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setBank(await apiClient.getEnemBank());
    } catch {
      toast.error(t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const runImport = async (years?: string[]) => {
    setImporting(years?.[0] ?? 'all');
    try {
      await apiClient.triggerEnemImport(years);
      toast.success(t('importStarted'));
      // Imports run server-side in the background; give it a moment, then refresh.
      setTimeout(() => { load(); setImporting(null); }, 6000);
    } catch {
      toast.error(t('importError'));
      setImporting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="xl" className="text-primary" />
      </div>
    );
  }

  const total = bank?.total ?? 0;
  const byArea = bank?.by_area ?? {};
  const byYear = bank?.by_year ?? {};
  const availableYears = bank?.available_years ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('subtitle')} />

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            {t('total', { count: total })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* By area */}
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">{t('byArea')}</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {AREAS.map((a) => (
                <div key={a} className="rounded-xl border border-border p-4 text-center">
                  <p className="text-2xl font-bold">{byArea[a] ?? 0}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t(`areas.${a}`)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* By year */}
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">{t('byYear')}</p>
            {Object.keys(byYear).length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('noneYet')}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {Object.entries(byYear)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([year, count]) => (
                    <Badge key={year} variant="secondary">
                      ENEM {year}: {count}
                    </Badge>
                  ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Import — super admin only */}
      {isSuperAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>{t('manageTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{t('adminHint')}</p>
            <div className="flex flex-wrap items-center gap-2">
              {availableYears.map((year) => (
                <Button
                  key={year}
                  variant="outline"
                  size="sm"
                  disabled={!!importing}
                  onClick={() => runImport([year])}
                >
                  {importing === year ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  ENEM {year}
                </Button>
              ))}
              <Button disabled={!!importing} onClick={() => runImport()}>
                {importing === 'all' ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                {t('importAll')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
