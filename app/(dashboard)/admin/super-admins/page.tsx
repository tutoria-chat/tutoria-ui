'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Trash2, Shield, Users, Mail, Calendar } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SuperAdminOnly } from '@/components/auth/role-guard';
import { formatDateShort } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import type { SuperAdmin, TableColumn, BreadcrumbItem } from '@/lib/types';

export default function SuperAdminsPage() {
  const t = useTranslations('superAdmins');
  const [superAdmins, setSuperAdmins] = useState<SuperAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortColumn, setSortColumn] = useState<string | null>('first_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>('asc');

  const breadcrumbs: BreadcrumbItem[] = [
    { label: t('breadcrumb'), href: '/admin' },
    { label: t('title'), isCurrentPage: true }
  ];

  useEffect(() => {
    loadSuperAdmins();
  }, []);

  const loadSuperAdmins = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getSuperAdmins();
      setSuperAdmins(response.items || response);
    } catch (error: any) {
      console.error('Error loading super admins:', error);
      toast.error(t('loadError'));
    } finally {
      setLoading(false);
    }
  };

  const columns: TableColumn<SuperAdmin>[] = [
    {
      key: 'name',
      label: t('columns.name'),
      sortable: true,
      render: (value, admin) => (
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
            <Shield className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <div className="font-medium">{admin.first_name} {admin.last_name}</div>
            <div className="text-sm text-muted-foreground flex items-center">
              <Mail className="h-3 w-3 mr-1" />
              {admin.email}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'created_at',
      label: t('columns.createdAt'),
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-1">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{formatDateShort(value as string)}</span>
        </div>
      )
    },
    {
      key: 'updated_at',
      label: t('columns.lastActivity'),
      sortable: true,
      render: (value) => (
        <div className="text-sm">
          {formatDateShort(value as string)}
        </div>
      )
    },
    {
      key: 'status',
      label: t('columns.status'),
      render: () => (
        <Badge variant="default" className="bg-green-100 text-green-800">
          {t('columns.active')}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: t('columns.actions'),
      width: '120px',
      render: (_, admin) => (
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(admin.super_admin_id)}
            disabled={admin.super_admin_id === 1}
          >
            <Trash2 className={`h-4 w-4 ${admin.super_admin_id === 1 ? 'text-muted-foreground' : 'text-destructive'}`} />
          </Button>
        </div>
      )
    }
  ];

  const handleDelete = async (id: number) => {
    if (id === 1) {
      toast.error(t('deleteMainError'));
      return;
    }

    if (!confirm(t('deleteConfirm'))) {
      return;
    }

    try {
      // Note: Implement this endpoint in the backend if needed
      // await apiClient.deleteSuperAdmin(id);
      toast.info(t('deleteNotImplemented'));
      console.log('Delete super admin:', id);
    } catch (error: any) {
      console.error('Error deleting super admin:', error);
      toast.error(t('deleteError'));
    }
  };

  const handleSortChange = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Filtrar super admins baseado na busca
  const filteredSuperAdmins = superAdmins.filter(admin =>
    admin.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Ordenar super admins
  const sortedSuperAdmins = [...filteredSuperAdmins].sort((a, b) => {
    if (!sortColumn || !sortDirection) return 0;
    
    let aValue: any = a[sortColumn as keyof SuperAdmin];
    let bValue: any = b[sortColumn as keyof SuperAdmin];
    
    // Para o campo 'name', ordenar por first_name
    if (sortColumn === 'name') {
      aValue = a.first_name;
      bValue = b.first_name;
    }
    
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    const result = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    return sortDirection === 'asc' ? result : -result;
  });

  // Paginar super admins
  const startIndex = (page - 1) * limit;
  const paginatedSuperAdmins = sortedSuperAdmins.slice(startIndex, startIndex + limit);

  return (
    <SuperAdminOnly>
      <div className="space-y-6">
        <PageHeader
          title={t('title')}
          description={t('description')}
          breadcrumbs={breadcrumbs}
          actions={
            <Button asChild>
              <Link href="/admin/super-admins/create">
                <Plus className="mr-2 h-4 w-4" />
                {t('createButton')}
              </Link>
            </Button>
          }
        />

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.total')}</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{superAdmins.length}</div>
              <p className="text-xs text-muted-foreground">
                {t('stats.totalDesc')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.activeToday')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.floor(superAdmins.length * 0.75)}</div>
              <p className="text-xs text-muted-foreground">
                {t('stats.activeTodayDesc')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.recentActions')}</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">47</div>
              <p className="text-xs text-muted-foreground">
                {t('stats.recentActionsDesc')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.security')}</CardTitle>
              <Shield className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{t('stats.securityStatus')}</div>
              <p className="text-xs text-muted-foreground">
                {t('stats.securityDesc')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Warning Card */}
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-900 flex items-center">
              <Shield className="mr-2 h-5 w-5" />
              {t('warningTitle')}
            </CardTitle>
            <CardDescription className="text-amber-700">
              {t('warningDescription')}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Super Admins Table */}
        <DataTable
          data={paginatedSuperAdmins}
          columns={columns}
          loading={loading}
          search={{
            value: searchTerm,
            placeholder: t('searchPlaceholder'),
            onSearchChange: setSearchTerm
          }}
          pagination={{
            page,
            limit,
            total: sortedSuperAdmins.length,
            onPageChange: setPage,
            onLimitChange: setLimit
          }}
          sorting={{
            column: sortColumn,
            direction: sortDirection,
            onSortChange: handleSortChange
          }}
          emptyMessage={t('emptyMessage')}
        />

        {/* Recent Admin Activity */}
        <Card>
          <CardHeader>
            <CardTitle>{t('activity.title')}</CardTitle>
            <CardDescription>{t('activity.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-3 rounded-lg border">
                <Shield className="h-4 w-4 text-green-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{t('activity.example1')}</p>
                  <p className="text-sm text-muted-foreground">{t('activity.by')} João Silva</p>
                </div>
                <span className="text-xs text-muted-foreground">{t('activity.time1')}</span>
              </div>

              <div className="flex items-center space-x-4 p-3 rounded-lg border">
                <Shield className="h-4 w-4 text-blue-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{t('activity.example2')}</p>
                  <p className="text-sm text-muted-foreground">{t('activity.by')} Maria Santos</p>
                </div>
                <span className="text-xs text-muted-foreground">{t('activity.time2')}</span>
              </div>

              <div className="flex items-center space-x-4 p-3 rounded-lg border">
                <Shield className="h-4 w-4 text-purple-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{t('activity.example3')}</p>
                  <p className="text-sm text-muted-foreground">{t('activity.bySystem')}</p>
                </div>
                <span className="text-xs text-muted-foreground">{t('activity.time3')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperAdminOnly>
  );
}