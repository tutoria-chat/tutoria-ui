'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/shared/data-table';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/components/auth/auth-provider';
import type { UserResponse, UserRole } from '@/lib/types';

export default function UsersPage() {
  const t = useTranslations('users');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<string>('all');
  const [universityFilter, setUniversityFilter] = useState<string>('all');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchUsers();
  }, [page, limit, userTypeFilter, universityFilter, isActiveFilter, search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        pageSize: limit,
        search: search || undefined,
      };

      if (userTypeFilter !== 'all') {
        params.userType = userTypeFilter;
      }

      if (universityFilter !== 'all') {
        params.universityId = parseInt(universityFilter);
      }

      if (isActiveFilter !== 'all') {
        params.isActive = isActiveFilter === 'active';
      }

      const response = await apiClient.get<{ items: UserResponse[]; total: number }>('/auth/users', params);
      setUsers(response.items);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'tutor':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'platform_coordinator':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'professor':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'student':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const columns = [
    {
      key: 'username',
      label: t('table.username'),
      sortable: true,
      render: (value: string, user: UserResponse) => (
        <div>
          <div className="font-medium">{user.username}</div>
          <div className="text-sm text-muted-foreground">{user.email}</div>
        </div>
      ),
    },
    {
      key: 'firstName',
      label: t('table.name'),
      sortable: true,
      render: (_: string, user: UserResponse) => (
        <div>{`${user.firstName} ${user.lastName}`}</div>
      ),
    },
    {
      key: 'userType',
      label: t('table.role'),
      sortable: true,
      render: (value: UserRole) => (
        <Badge className={getRoleBadgeColor(value)}>
          {tCommon(`roles.${value}`)}
        </Badge>
      ),
    },
    {
      key: 'universityName',
      label: t('table.university'),
      sortable: true,
      render: (value: string | undefined) => value || '—',
    },
    {
      key: 'isActive',
      label: t('table.status'),
      sortable: true,
      render: (value: boolean) => (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? t('table.active') : t('table.inactive')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: t('table.actions'),
      render: (_: any, user: UserResponse) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/users/${user.userId}`)}
        >
          {tCommon('buttons.view')}
        </Button>
      ),
    },
  ];

  if (loading && users.length === 0) {
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
        <Button onClick={() => router.push('/users/create')}>
          <Plus className="mr-2 h-4 w-4" />
          {t('createButton')}
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder={t('filters.userType')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.allTypes')}</SelectItem>
            <SelectItem value="super_admin">{tCommon('roles.super_admin')}</SelectItem>
            <SelectItem value="manager">{tCommon('roles.manager')}</SelectItem>
            <SelectItem value="tutor">{tCommon('roles.tutor')}</SelectItem>
            <SelectItem value="platform_coordinator">{tCommon('roles.platform_coordinator')}</SelectItem>
            <SelectItem value="professor">{tCommon('roles.professor')}</SelectItem>
            <SelectItem value="student">{tCommon('roles.student')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={isActiveFilter} onValueChange={setIsActiveFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder={t('filters.status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.allStatuses')}</SelectItem>
            <SelectItem value="active">{t('table.active')}</SelectItem>
            <SelectItem value="inactive">{t('table.inactive')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={users}
        pagination={{
          page,
          limit,
          total,
          onPageChange: setPage,
          onLimitChange: setLimit,
        }}
        loading={loading}
      />
    </div>
  );
}
