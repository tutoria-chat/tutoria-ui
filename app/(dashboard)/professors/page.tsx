'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Trash2, Shield, Users, Mail, Calendar, UserCheck, UserX, Ban, CheckCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminOnly } from '@/components/auth/role-guard';
import { formatDateShort } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import type { Professor, TableColumn, BreadcrumbItem, User } from '@/lib/types';

export default function ProfessorsPage() {
  const t = useTranslations('professors');
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortColumn, setSortColumn] = useState<string | null>('first_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>('asc');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

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
      toast.error('Error loading user information');
    }
  };

  const loadProfessors = async () => {
    setLoading(true);
    try {
      // Use unified Users endpoint to get professors
      const users = await apiClient.getUsersByType('professor');
      // Map UserResponse to Professor interface
      const profs: Professor[] = users.map((user: any) => ({
        id: user.user_id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        is_active: user.is_active,
        is_admin: user.is_admin,
        university_id: user.university_id,
        university_name: user.university_name,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login_at: user.last_login_at,
        language_preference: user.language_preference,
        theme_preference: user.theme_preference,
      }));
      setProfessors(profs);
    } catch (error: any) {
      console.error('Error loading professors:', error);
      toast.error(t('loadError') || 'Error loading professors');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (id: number) => {
    if (!confirm(t('deactivateConfirm') || 'Are you sure you want to deactivate this professor?')) {
      return;
    }

    try {
      await apiClient.deactivateUser(id);
      toast.success(t('deactivateSuccess') || 'Professor deactivated successfully');
      loadProfessors();
    } catch (error: any) {
      console.error('Error deactivating professor:', error);
      toast.error(error.message || t('deactivateError') || 'Error deactivating professor');
    }
  };

  const handleActivate = async (id: number) => {
    try {
      await apiClient.activateUser(id);
      toast.success(t('activateSuccess') || 'Professor activated successfully');
      loadProfessors();
    } catch (error: any) {
      console.error('Error activating professor:', error);
      toast.error(error.message || t('activateError') || 'Error activating professor');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('deleteConfirm') || 'Are you sure you want to permanently delete this professor? This action cannot be undone.')) {
      return;
    }

    try {
      await apiClient.deleteUserPermanently(id);
      toast.success(t('deleteSuccess') || 'Professor deleted permanently');
      loadProfessors();
    } catch (error: any) {
      console.error('Error deleting professor:', error);
      toast.error(error.message || t('deleteError') || 'Error deleting professor');
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
            professor.is_admin ? 'bg-purple-100' : 'bg-blue-100'
          }`}>
            {professor.is_admin ? (
              <Shield className="h-5 w-5 text-purple-600" />
            ) : (
              <Users className="h-5 w-5 text-blue-600" />
            )}
          </div>
          <div>
            <div className="font-medium">{professor.first_name} {professor.last_name}</div>
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
        professor.is_admin ? (
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
      key: 'university_name',
      label: t('columns.university') || 'University',
      render: (_, professor) => (
        <div className="text-sm">
          {professor.university_name || 'N/A'}
        </div>
      )
    },
    {
      key: 'created_at',
      label: t('columns.createdAt') || 'Created at',
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-1">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{formatDateShort(value as string)}</span>
        </div>
      )
    },
    {
      key: 'actions',
      label: t('columns.actions') || 'Actions',
      width: '150px',
      render: (_, professor) => (
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeactivate(professor.id)}
            title={t('deactivate') || 'Deactivate'}
          >
            <Ban className="h-4 w-4 text-amber-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleActivate(professor.id)}
            title={t('activate') || 'Activate'}
          >
            <CheckCircle className="h-4 w-4 text-green-600" />
          </Button>
          {currentUser?.role === 'super_admin' && (
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
      )
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
    professor.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    professor.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    professor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (professor.university_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort professors
  const sortedProfessors = [...filteredProfessors].sort((a, b) => {
    if (!sortColumn || !sortDirection) return 0;

    let aValue: any = a[sortColumn as keyof Professor];
    let bValue: any = b[sortColumn as keyof Professor];

    // For 'name' column, sort by first_name
    if (sortColumn === 'name') {
      aValue = a.first_name;
      bValue = b.first_name;
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
  const adminProfessors = professors.filter(p => p.is_admin).length;
  const regularProfessors = professors.filter(p => !p.is_admin).length;

  return (
    <AdminOnly>
      <div className="space-y-6">
        <PageHeader
          title={t('title')}
          description={t('description')}
          breadcrumbs={breadcrumbs}
          actions={
            currentUser?.is_admin && (
              <Button asChild>
                <Link href="/professors/create">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('addButton')}
                </Link>
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
      </div>
    </AdminOnly>
  );
}
