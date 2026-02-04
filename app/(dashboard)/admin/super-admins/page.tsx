'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Trash2, Shield, Mail, Calendar, Ban, CheckCircle, Edit, AlertTriangle, Key } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SuperAdminOnly } from '@/components/auth/role-guard';
import { formatDateShort } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { authService } from '@/lib/auth';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import type { SuperAdmin, TableColumn, BreadcrumbItem } from '@/lib/types';

export default function SuperAdminsPage() {
  const t = useTranslations('superAdmins');
  const currentUser = authService.getUser();
  const isMainAdmin = currentUser?.id === 1; // User ID 1 is the main admin
  const [superAdmins, setSuperAdmins] = useState<SuperAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortColumn, setSortColumn] = useState<string | null>('firstName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>('asc');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'deactivate' | 'delete' | null;
    adminId: number | null;
    adminName: string;
  }>({
    open: false,
    type: null,
    adminId: null,
    adminName: ''
  });

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
      const users = await apiClient.getUsersByType('super_admin');
      // Map UserResponse to SuperAdmin interface
      const admins: SuperAdmin[] = users.map((user) => ({
        id: user.userId,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt,
        languagePreference: user.languagePreference,
        themePreference: user.themePreference,
      }));
      setSuperAdmins(admins);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error loading super admins:', error.message);
      } else {
        console.error('Error loading super admins:', error);
      }
      toast.error(t('loadError'));
    } finally {
      setLoading(false);
    }
  };

  const openDeactivateDialog = (admin: SuperAdmin) => {
    // Only the main admin (user ID 1) can deactivate super admins
    if (!isMainAdmin) {
      toast.error(t('onlyMainAdminCanDeactivate') || 'Only the main administrator can deactivate super administrators.');
      return;
    }

    // Cannot deactivate yourself
    if (admin.id === 1) {
      toast.error(t('deleteMainError'));
      return;
    }

    setConfirmDialog({
      open: true,
      type: 'deactivate',
      adminId: admin.id,
      adminName: `${admin.firstName} ${admin.lastName}`
    });
  };

  const handleDeactivate = async () => {
    if (!confirmDialog.adminId) return;

    try {
      await apiClient.deactivateUser(confirmDialog.adminId);
      toast.success(t('deactivateSuccess') || 'Super administrator deactivated successfully');
      setConfirmDialog({ open: false, type: null, adminId: null, adminName: '' });
      loadSuperAdmins();
    } catch (error: unknown) {
      console.error('Error deactivating super admin:', error);
      const errorMessage = error instanceof Error ? error.message : t('deactivateError') || 'Error deactivating super administrator';
      toast.error(errorMessage);
    }
  };

  const handleActivate = async (id: number) => {
    // Only the main admin (user ID 1) can activate super admins
    if (!isMainAdmin) {
      toast.error(t('onlyMainAdminCanActivate') || 'Only the main administrator can activate super administrators.');
      return;
    }

    try {
      await apiClient.activateUser(id);
      toast.success(t('activateSuccess') || 'Super administrator activated successfully');
      loadSuperAdmins();
    } catch (error: unknown) {
      console.error('Error activating super admin:', error);
      const errorMessage = error instanceof Error ? error.message : t('activateError') || 'Error activating super administrator';
      toast.error(errorMessage);
    }
  };

  const handlePasswordReset = async (admin: SuperAdmin) => {
    try {
      await apiClient.requestPasswordReset(admin.email);

      toast.success(t('passwordResetSuccess') || 'Password reset email sent successfully');
    } catch (error: unknown) {
      console.error('Error generating password reset:', error);
      const errorMessage = error instanceof Error ? error.message : t('passwordResetError') || 'Error sending password reset email';
      toast.error(errorMessage);
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
            <div className="font-medium">{admin.firstName} {admin.lastName}</div>
            <div className="text-sm text-muted-foreground flex items-center">
              <Mail className="h-3 w-3 mr-1" />
              {admin.email}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'createdAt',
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
      key: 'lastLoginAt',
      label: t('columns.lastActivity'),
      sortable: true,
      render: (value) => (
        <div className="text-sm">
          {value ? formatDateShort(value as string) : t('columns.never')}
        </div>
      )
    },
    {
      key: 'status',
      label: t('columns.status'),
      render: (_, admin) => (
        admin.isActive ? (
          <Badge variant="default" className="bg-green-100 text-green-800">
            {t('columns.active')}
          </Badge>
        ) : (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
            {t('columns.inactive') || 'Inactive'}
          </Badge>
        )
      )
    },
    {
      key: 'actions',
      label: t('columns.actions'),
      width: '180px',
      render: (_, admin) => (
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            asChild
            title={t('editButton') || 'Edit'}
          >
            <Link href={`/admin/super-admins/${admin.id}/edit`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePasswordReset(admin)}
            title={t('resetPassword') || 'Reset Password'}
          >
            <Key className="h-4 w-4 text-blue-600" />
          </Button>
          {admin.isActive ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openDeactivateDialog(admin)}
              disabled={!isMainAdmin || admin.id === 1}
              title={!isMainAdmin ? (t('onlyMainAdminCanDeactivate') || 'Only main admin can deactivate') : (t('deactivate') || 'Deactivate')}
            >
              <Ban className={`h-4 w-4 ${!isMainAdmin || admin.id === 1 ? 'text-muted-foreground' : 'text-amber-600'}`} />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleActivate(admin.id)}
              disabled={!isMainAdmin}
              title={!isMainAdmin ? (t('onlyMainAdminCanActivate') || 'Only main admin can activate') : (t('activate') || 'Activate')}
            >
              <CheckCircle className={`h-4 w-4 ${!isMainAdmin ? 'text-muted-foreground' : 'text-green-600'}`} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openDeleteDialog(admin)}
            disabled={!isMainAdmin || admin.id === 1}
            title={!isMainAdmin ? (t('onlyMainAdminCanDelete') || 'Only main admin can delete') : (t('delete') || 'Delete')}
          >
            <Trash2 className={`h-4 w-4 ${!isMainAdmin || admin.id === 1 ? 'text-muted-foreground' : 'text-destructive'}`} />
          </Button>
        </div>
      )
    }
  ];

  const openDeleteDialog = (admin: SuperAdmin) => {
    // Only the main admin (user ID 1) can delete super admins
    if (!isMainAdmin) {
      toast.error(t('onlyMainAdminCanDelete') || 'Only the main administrator can delete super administrators.');
      return;
    }

    // Cannot delete yourself
    if (admin.id === 1) {
      toast.error(t('deleteMainError'));
      return;
    }

    setConfirmDialog({
      open: true,
      type: 'delete',
      adminId: admin.id,
      adminName: `${admin.firstName} ${admin.lastName}`
    });
  };

  const handleDelete = async () => {
    if (!confirmDialog.adminId) return;

    try {
      await apiClient.deleteUserPermanently(confirmDialog.adminId);
      toast.success(t('deleteSuccess') || 'Super administrator deleted successfully');
      setConfirmDialog({ open: false, type: null, adminId: null, adminName: '' });
      loadSuperAdmins();
    } catch (error: unknown) {
      console.error('Error deleting super admin:', error);
      const errorMessage = error instanceof Error ? error.message : t('deleteError') || 'Error deleting super administrator';
      toast.error(errorMessage);
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
    admin.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Ordenar super admins
  const sortedSuperAdmins = [...filteredSuperAdmins].sort((a, b) => {
    if (!sortColumn || !sortDirection) return 0;
    
    let aValue: any = a[sortColumn as keyof SuperAdmin];
    let bValue: any = b[sortColumn as keyof SuperAdmin];
    
    // Para o campo 'name', ordenar por first_name
    if (sortColumn === 'name') {
      aValue = a.firstName;
      bValue = b.firstName;
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

          {/* TODO: Implement real-time statistics - hardcoded values commented out */}
          {/* <Card>
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
          </Card> */}
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

        {/* Recent Admin Activity - TODO: Implement real activity tracking */}
        {/* <Card>
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
        </Card> */}

        {/* Confirmation Dialog */}
        <Dialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ open: false, type: null, adminId: null, adminName: '' })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className={`h-5 w-5 ${confirmDialog.type === 'delete' ? 'text-destructive' : 'text-amber-600'}`} />
                {confirmDialog.type === 'deactivate' ? t('deactivate') : t('delete')}
              </DialogTitle>
              <DialogDescription>
                {confirmDialog.type === 'deactivate' ? t('deactivateConfirm') : t('deleteConfirm')}
                <br />
                <span className="font-semibold mt-2 block">{confirmDialog.adminName}</span>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConfirmDialog({ open: false, type: null, adminId: null, adminName: '' })}
              >
                {t('cancel') || 'Cancel'}
              </Button>
              <Button
                variant={confirmDialog.type === 'delete' ? 'destructive' : 'default'}
                onClick={confirmDialog.type === 'deactivate' ? handleDeactivate : handleDelete}
              >
                {confirmDialog.type === 'deactivate' ? t('deactivate') : t('delete')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SuperAdminOnly>
  );
}