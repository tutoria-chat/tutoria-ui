'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Download, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/shared/data-table';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import type { AuditLog, TableColumn } from '@/lib/types';

export default function AuditLogsPage() {
  const t = useTranslations('auditLogs');
  const tCommon = useTranslations('common');

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchLogs();
  }, [page, size, actionFilter, entityTypeFilter]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchLogs();
      } else {
        setPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        size,
        search: search || undefined,
      };

      if (actionFilter !== 'all') params.action = actionFilter;
      if (entityTypeFilter !== 'all') params.entityType = entityTypeFilter;

      const response = await apiClient.getAuditLogs(params);
      setLogs(response.items);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      toast.error(t('errors.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const filters: any = {};
      if (actionFilter !== 'all') filters.action = actionFilter;
      if (entityTypeFilter !== 'all') filters.entityType = entityTypeFilter;
      if (search) filters.search = search;

      const blob = await apiClient.exportAuditLogs(filters);

      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(t('exportSuccess'));
    } catch (error) {
      toast.error(t('errors.exportFailed'));
    } finally {
      setExporting(false);
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'Create':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Update':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Delete':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const parseChanges = (changesJson?: string) => {
    if (!changesJson) return null;
    try {
      const changes = JSON.parse(changesJson);
      return Object.entries(changes).map(([key, value]: [string, any]) =>
        `${key}: ${value.Old}→${value.New}`
      ).join(', ');
    } catch {
      return changesJson;
    }
  };

  const columns: TableColumn<AuditLog>[] = [
    {
      key: 'createdAt',
      label: t('table.timestamp'),
      sortable: true,
      render: (value: string) => new Date(value).toLocaleString(),
    },
    {
      key: 'username',
      label: t('table.user'),
      sortable: true,
    },
    {
      key: 'action',
      label: t('table.action'),
      sortable: true,
      render: (value: string) => (
        <Badge className={getActionBadgeColor(value)}>
          {value}
        </Badge>
      ),
    },
    {
      key: 'entityType',
      label: t('table.entityType'),
      sortable: true,
    },
    {
      key: 'entityName',
      label: t('table.entity'),
      render: (_: any, log: AuditLog) => log.entityName || `ID: ${log.entityId}`,
    },
    {
      key: 'changes',
      label: t('table.changes'),
      render: (_: any, log: AuditLog) => {
        const changes = parseChanges(log.changes);
        return changes ? (
          <span className="text-sm text-muted-foreground truncate max-w-xs block" title={changes}>
            {changes}
          </span>
        ) : '—';
      },
    },
  ];

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="xl" className="text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
      >
        <Button onClick={handleExport} disabled={exporting}>
          <Download className="mr-2 h-4 w-4" />
          {exporting ? t('exporting') : t('exportButton')}
        </Button>
      </PageHeader>

      {/* Stats Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('stats.totalLogs')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{total.toLocaleString()}</div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t('filters.action')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.allActions')}</SelectItem>
            <SelectItem value="Create">{t('filters.create')}</SelectItem>
            <SelectItem value="Update">{t('filters.update')}</SelectItem>
            <SelectItem value="Delete">{t('filters.delete')}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t('filters.entityType')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.allTypes')}</SelectItem>
            <SelectItem value="User">{t('entities.user')}</SelectItem>
            <SelectItem value="University">{t('entities.university')}</SelectItem>
            <SelectItem value="Course">{t('entities.course')}</SelectItem>
            <SelectItem value="Module">{t('entities.module')}</SelectItem>
            <SelectItem value="File">{t('entities.file')}</SelectItem>
            <SelectItem value="ModuleAccessToken">{t('entities.token')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={logs}
        pagination={{
          page,
          limit: size,
          total,
          onPageChange: setPage,
          onLimitChange: setSize,
        }}
        loading={loading}
      />
    </div>
  );
}
