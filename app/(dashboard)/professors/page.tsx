'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Shield, Users, Mail, Calendar, UserCheck, UserX, Ban, CheckCircle, Edit } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AdminOnly } from '@/components/auth/role-guard';
import { formatDateShort } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import type { Professor, TableColumn, BreadcrumbItem, User, UserResponse } from '@/lib/types';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';

export default function ProfessorsPage() {
  const router = useRouter();
  const t = useTranslations('professors');
  const tCommon = useTranslations('common');
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortColumn, setSortColumn] = useState<string | null>('firstName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>('asc');
  const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
  const [showProfessorTypeDialog, setShowProfessorTypeDialog] = useState(false);

  // Confirm dialogs
  const { confirm, dialog } = useConfirmDialog();

  const breadcrumbs: BreadcrumbItem[] = [
    { label: t('title'), isCurrentPage: true }
  ];

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadProfessors();
    }
  }, [currentUser]);

  const loadCurrentUser = async () => {
    try {
      const user = await apiClient.getCurrentUser();
      setCurrentUser(user);
    } catch (error: any) {
      console.error('Error loading current user:', error);
      toast.error(t('loadUserError'));
    }
  };

  const loadProfessors = async () => {
    setLoading(true);
    try {
      // Build query params - filter by university for non-super-admin users
      const params: Record<string, string | number> = {
        userType: 'professor',
        limit: 1000
      };

      // If user is a professor (not super admin), only fetch professors from their university
      if (currentUser?.universityId && currentUser.userType !== 'super_admin') {
        params.universityId = currentUser.universityId;
      }

      // Use unified Users endpoint to get professors (use Management API, not Auth API)
      const response: { items: UserResponse[] } = await apiClient.get('/users/', params, false); // false = use Management API
      // Map UserResponse to Professor interface
      const profs: Professor[] = response.items.map((user: UserResponse) => ({
        id: user.userId,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        isAdmin: user.isAdmin || false,
        universityId: user.universityId || 0,
        universityName: user.universityName,
        createdAt: user.createdAt || new Date().toISOString(),
        updatedAt: user.updatedAt || new Date().toISOString(),
        lastLoginAt: user.lastLoginAt,
        languagePreference: user.languagePreference,
        themePreference: user.themePreference,
      }));
      setProfessors(profs);
    } catch (error: any) {
      console.error('Error loading professors:', error);
      toast.error(t('loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (id: number) => {
    confirm({
      title: t('deactivateConfirm'),
      description: t('deactivateConfirm'),
      variant: 'destructive',
      confirmText: t('deactivate'),
      cancelText: tCommon('buttons.cancel'),
      onConfirm: async () => {
        try {
          await apiClient.deactivateUser(id);
          toast.success(t('deactivateSuccess'));
          loadProfessors();
        } catch (error: any) {
          console.error('Error deactivating professor:', error);
          toast.error(error.message || t('deactivateError'));
        }
      }
    });
  };

  const handleActivate = async (id: number) => {
    try {
      await apiClient.activateUser(id);
      toast.success(t('activateSuccess'));
      loadProfessors();
    } catch (error: any) {
      console.error('Error activating professor:', error);
      toast.error(error.message || t('activateError'));
    }
  };

  const handleDelete = async (id: number) => {
    confirm({
      title: t('deleteConfirm'),
      description: t('deleteConfirm'),
      variant: 'destructive',
      confirmText: tCommon('buttons.delete'),
      cancelText: tCommon('buttons.cancel'),
      onConfirm: async () => {
        try {
          await apiClient.deleteUserPermanently(id);
          toast.success(t('deleteSuccess'));
          loadProfessors();
        } catch (error: any) {
          console.error('Error deleting professor:', error);
          toast.error(error.message || t('deleteError'));
        }
      }
    });
  };

  const handleAddProfessor = () => {
    // If super admin, show dialog to choose type
    if (currentUser?.userType === 'super_admin') {
      setShowProfessorTypeDialog(true);
    } else {
      // If admin professor, go directly to create regular professor
      router.push('/professors/create');
    }
  };

  const handleSelectProfessorType = (type: 'regular' | 'admin') => {
    setShowProfessorTypeDialog(false);
    if (type === 'admin') {
      router.push('/professors/create-admin');
    } else {
      router.push('/professors/create');
    }
  };

  const columns: TableColumn<Professor>[] = [
    {
      key: 'name',
      label: t('columns.name') || 'Professor',
      sortable: true,
      render: (value, professor) => (
        <div className="flex items-center space-x-3">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
            professor.isAdmin ? 'bg-purple-100' : 'bg-blue-100'
          }`}>
            {professor.isAdmin ? (
              <Shield className="h-5 w-5 text-purple-600" />
            ) : (
              <Users className="h-5 w-5 text-blue-600" />
            )}
          </div>
          <div>
            <div className="font-medium">{professor.firstName} {professor.lastName}</div>
            <div className="text-sm text-muted-foreground flex items-center">
              <Mail className="h-3 w-3 mr-1" />
              {professor.email}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'type',
      label: t('columns.type') || 'Type',
      render: (_, professor) => (
        professor.isAdmin ? (
          <Badge variant="default" className="bg-purple-100 text-purple-800">
            {t('columns.admin') || 'Administrator'}
          </Badge>
        ) : (
          <Badge variant="outline">
            {t('columns.professor') || 'Professor'}
          </Badge>
        )
      )
    },
    {
      key: 'universityName',
      label: t('columns.university') || 'University',
      render: (_, professor) => (
        <div className="text-sm">
          {professor.universityName || 'N/A'}
        </div>
      )
    },
    {
      key: 'isActive',
      label: t('columns.status') || 'Status',
      render: (_, professor) => (
        professor.isActive ? (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {t('columns.active') || 'Active'}
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            {t('columns.inactive') || 'Inactive'}
          </Badge>
        )
      )
    },
    {
      key: 'createdAt',
      label: t('columns.createdAt') || 'Created at',
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-1">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{value ? formatDateShort(value as string) : 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'actions',
      label: t('columns.actions') || 'Actions',
      width: '200px',
      render: (_, professor) => {
        // Super admins have ALL THE POWER - they can manage everyone
        // Regular admin professors can only manage non-admin professors
        const isSuperAdmin = currentUser?.userType === 'super_admin';
        const canManageActivation = isSuperAdmin || !professor.isAdmin;

        return (
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/professors/${professor.id}/edit`)}
              title={tCommon('buttons.edit') || 'Edit'}
            >
              <Edit className="h-4 w-4 text-blue-600" />
            </Button>
            {canManageActivation && (
              professor.isActive ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeactivate(professor.id)}
                  title={t('deactivate') || 'Deactivate'}
                >
                  <Ban className="h-4 w-4 text-amber-600" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleActivate(professor.id)}
                  title={t('activate') || 'Activate'}
                >
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </Button>
              )
            )}
            {currentUser?.userType === 'super_admin' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(professor.id)}
                title={t('delete') || 'Delete'}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        );
      }
    }
  ];

  const handleSortChange = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Filter professors based on search term
  const filteredProfessors = professors.filter(professor =>
    professor.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    professor.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    professor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (professor.universityName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort professors
  const sortedProfessors = [...filteredProfessors].sort((a, b) => {
    if (!sortColumn || !sortDirection) return 0;

    let aValue: any = a[sortColumn as keyof Professor];
    let bValue: any = b[sortColumn as keyof Professor];

    // For 'name' column, sort by first_name
    if (sortColumn === 'name') {
      aValue = a.firstName;
      bValue = b.firstName;
    }

    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    const result = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    return sortDirection === 'asc' ? result : -result;
  });

  // Paginate professors
  const startIndex = (page - 1) * limit;
  const paginatedProfessors = sortedProfessors.slice(startIndex, startIndex + limit);

  // Calculate stats
  const totalProfessors = professors.length;
  const adminProfessors = professors.filter(p => p.isAdmin).length;
  const regularProfessors = professors.filter(p => !p.isAdmin).length;

  return (
    <AdminOnly>
      <div className="space-y-6">
        <PageHeader
          title={t('title')}
          description={t('description')}
          breadcrumbs={breadcrumbs}
          actions={
            currentUser?.isAdmin && (
              <Button onClick={handleAddProfessor}>
                <Plus className="mr-2 h-4 w-4" />
                {t('addButton')}
              </Button>
            )
          }
        />

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.totalProfessors')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProfessors}</div>
              <p className="text-xs text-muted-foreground">
                {t('stats.totalDesc') || 'All professors'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.adminProfessors')}</CardTitle>
              <UserCheck className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminProfessors}</div>
              <p className="text-xs text-muted-foreground">
                {t('stats.adminDesc') || 'With admin rights'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.regularProfessors')}</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{regularProfessors}</div>
              <p className="text-xs text-muted-foreground">
                {t('stats.regularDesc') || 'Regular professors'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Professors Table */}
        <DataTable
          data={paginatedProfessors}
          columns={columns}
          loading={loading}
          search={{
            value: searchTerm,
            placeholder: t('searchPlaceholder') || 'Search professors...',
            onSearchChange: setSearchTerm
          }}
          pagination={{
            page,
            limit,
            total: sortedProfessors.length,
            onPageChange: setPage,
            onLimitChange: setLimit
          }}
          sorting={{
            column: sortColumn,
            direction: sortDirection,
            onSortChange: handleSortChange
          }}
          emptyMessage={t('emptyMessage') || 'No professors found'}
        />

        {/* Professor Type Selection Dialog */}
        <Dialog open={showProfessorTypeDialog} onOpenChange={setShowProfessorTypeDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{t('selectTypeDialog.title')}</DialogTitle>
              <DialogDescription>
                {t('selectTypeDialog.description')}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 py-4">
              <Button
                variant="outline"
                className="h-auto flex items-start justify-start p-4 hover:bg-blue-50 hover:border-blue-500 dark:hover:bg-blue-950"
                onClick={() => handleSelectProfessorType('regular')}
              >
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4 text-left flex-1">
                  <div className="font-semibold text-base mb-1">{t('selectTypeDialog.regularProfessor')}</div>
                  <p className="text-sm text-muted-foreground">
                    {t('selectTypeDialog.regularDescription')}
                  </p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="h-auto flex items-start justify-start p-4 hover:bg-purple-50 hover:border-purple-500 dark:hover:bg-purple-950"
                onClick={() => handleSelectProfessorType('admin')}
              >
                <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4 text-left flex-1">
                  <div className="font-semibold text-base mb-1">{t('selectTypeDialog.adminProfessor')}</div>
                  <p className="text-sm text-muted-foreground">
                    {t('selectTypeDialog.adminDescription')}
                  </p>
                </div>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        {dialog}
      </div>
    </AdminOnly>
  );
}
