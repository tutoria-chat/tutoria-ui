'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { CreditCard, Building2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { SuperAdminOnly } from '@/components/auth/role-guard';
import { apiClient } from '@/lib/api';
import { formatDateShort } from '@/lib/utils';
import { toast } from 'sonner';
import type { Subscription, SubscriptionStatus, TableColumn, BreadcrumbItem } from '@/lib/types';

const statusVariants: Record<SubscriptionStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  trialing: 'outline',
  past_due: 'destructive',
  canceled: 'secondary',
  incomplete: 'outline',
  expired: 'secondary',
};

const statusColors: Record<SubscriptionStatus, string> = {
  active: 'bg-green-600',
  trialing: 'bg-yellow-500 text-black',
  past_due: 'bg-orange-500',
  canceled: 'bg-red-500 text-white',
  incomplete: 'bg-gray-400',
  expired: 'bg-gray-500 text-white',
};

export default function AdminSubscriptionsPage() {
  const t = useTranslations('adminSubscriptions');
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const breadcrumbs: BreadcrumbItem[] = [
    { label: t('breadcrumb'), href: '/admin' },
    { label: t('title'), isCurrentPage: true },
  ];

  const loadSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.getAllSubscriptions();
      setSubscriptions(data);
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
      toast.error(t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  const filtered = subscriptions.filter((sub) => {
    const matchesSearch =
      (sub.universityName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sub.planName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sub.stripeSubscriptionId || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const columns: TableColumn<Subscription>[] = [
    {
      key: 'universityName',
      label: t('columns.university'),
      sortable: true,
      render: (_, sub) => (
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="font-medium">{sub.universityName || `University #${sub.universityId}`}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'planName',
      label: t('columns.plan'),
      sortable: true,
      render: (_, sub) => (
        <div>
          <div className="font-medium">{sub.planName || `Plan #${sub.planId}`}</div>
          {sub.planSlug && (
            <div className="text-sm text-muted-foreground font-mono">{sub.planSlug}</div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: t('columns.status'),
      sortable: true,
      render: (_, sub) => (
        <Badge className={statusColors[sub.status] || ''}>
          {t(`statuses.${sub.status}`)}
        </Badge>
      ),
    },
    {
      key: 'currentPeriodStart',
      label: t('columns.period'),
      render: (_, sub) => (
        <div className="text-sm">
          {sub.currentPeriodStart && sub.currentPeriodEnd ? (
            <>
              <div>{formatDateShort(sub.currentPeriodStart)}</div>
              <div className="text-muted-foreground">{t('columns.to')} {formatDateShort(sub.currentPeriodEnd)}</div>
            </>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'trialEndsAt',
      label: t('columns.trialEnd'),
      render: (value) =>
        value ? (
          <span className="text-sm">{formatDateShort(value as string)}</span>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        ),
    },
    {
      key: 'stripeSubscriptionId',
      label: t('columns.stripeId'),
      render: (value) =>
        value ? (
          <code className="text-xs bg-muted px-2 py-1 rounded break-all">{value as string}</code>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        ),
    },
    {
      key: 'createdAt',
      label: t('columns.createdAt'),
      sortable: true,
      render: (value) => value ? formatDateShort(value as string) : '-',
    },
  ];

  // Count subscriptions by status for stats
  const statusCounts = subscriptions.reduce(
    (acc, sub) => {
      acc[sub.status] = (acc[sub.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <SuperAdminOnly>
      <div className="space-y-6">
        <PageHeader
          title={t('title')}
          description={t('description', { total: subscriptions.length })}
          breadcrumbs={breadcrumbs}
        />

        {/* Status summary badges */}
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setStatusFilter('all')}
          >
            {t('all')} ({subscriptions.length})
          </Badge>
          {(Object.keys(statusCounts) as SubscriptionStatus[]).map((status) => (
            <Badge
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              className={`cursor-pointer ${statusFilter === status ? statusColors[status] : ''}`}
              onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
            >
              {t(`statuses.${status}`)} ({statusCounts[status]})
            </Badge>
          ))}
        </div>

        <DataTable
          data={filtered}
          columns={columns}
          loading={loading}
          search={{
            value: searchTerm,
            placeholder: t('searchPlaceholder'),
            onSearchChange: setSearchTerm,
          }}
          emptyMessage={t('emptyMessage')}
        />
      </div>
    </SuperAdminOnly>
  );
}
