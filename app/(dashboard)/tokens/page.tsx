'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/shared/data-table';
import { Key, Plus, Activity, Shield, Clock, Eye, Edit, Trash2, Copy } from 'lucide-react';
import { ProfessorOnly } from '@/components/auth/role-guard';
import { useAuth } from '@/components/auth/auth-provider';
import { useFetch } from '@/lib/hooks';
import { formatDateShort } from '@/lib/utils';
import { TokenModal, type TokenModalMode } from '@/components/tokens/token-modal';
import type { ModuleAccessToken, TableColumn, BreadcrumbItem, PaginatedResponse } from '@/lib/types';
import { toast } from 'sonner';

export default function TokensPage() {
  const { user } = useAuth();
  const t = useTranslations('tokens');

  // Build API URL with university filter for professors
  const universityFilter = user?.university_id && user.role !== 'super_admin' ? `?university_id=${user.university_id}` : '';
  const { data: tokensResponse, loading, refetch } = useFetch<PaginatedResponse<ModuleAccessToken>>(`/module-tokens/${universityFilter}`);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortColumn, setSortColumn] = useState<string | null>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>('desc');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<TokenModalMode>('create');
  const [selectedToken, setSelectedToken] = useState<ModuleAccessToken | undefined>(undefined);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: t('title'), isCurrentPage: true }
  ];

  const handleOpenModal = (mode: TokenModalMode, token?: ModuleAccessToken) => {
    setModalMode(mode);
    setSelectedToken(token);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedToken(undefined);
  };

  const handleModalSuccess = () => {
    refetch();
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('deleteConfirm'))) {
      return;
    }

    try {
      const { apiClient } = await import('@/lib/api');
      await apiClient.deleteModuleToken(id);
      refetch();
      toast.success(t('deleteSuccess'));
    } catch (error) {
      console.error('Erro ao deletar token:', error);
      toast.error(t('deleteError'));
    }
  };

  const handleCopyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      toast.success(t('copySuccess'));
    } catch (error) {
      console.error('Erro ao copiar token:', error);
      toast.error(t('copyError'));
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

  const columns: TableColumn<ModuleAccessToken>[] = [
    {
      key: 'name',
      label: t('columns.tokenName'),
      sortable: true,
      render: (value, token) => (
        <div>
          <div className="font-medium">{value}</div>
          {token.description && (
            <div className="text-sm text-muted-foreground line-clamp-1 max-w-xs">
              {token.description}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'module_name',
      label: t('columns.module'),
      sortable: true,
      render: (value) => (
        <span className="text-sm">{value}</span>
      )
    },
    {
      key: 'token',
      label: t('columns.token'),
      render: (value) => (
        <div className="flex items-center space-x-2">
          <code className="text-xs bg-muted px-2 py-1 rounded">
            {(value as string).substring(0, 16)}...
          </code>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCopyToken(value as string)}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      )
    },
    {
      key: 'allow_chat',
      label: t('columns.chat'),
      render: (value) => (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? t('columns.allowed') : t('columns.blocked')}
        </Badge>
      )
    },
    {
      key: 'allow_file_access',
      label: t('columns.files'),
      render: (value) => (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? t('columns.allowed') : t('columns.blocked')}
        </Badge>
      )
    },
    {
      key: 'expires_at',
      label: t('columns.expiresAt'),
      sortable: true,
      render: (value) => value ? formatDateShort(value as string) : t('columns.never')
    },
    {
      key: 'is_active',
      label: t('columns.status'),
      render: (value) => (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? t('columns.active') : t('columns.inactive')}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: t('columns.actions'),
      width: '120px',
      render: (_, token) => (
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenModal('view', token)}
          >
            <Eye className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenModal('edit', token)}
          >
            <Edit className="h-4 w-4" />
          </Button>

          {/* TODO: Add Widget Redirect Button */}
          {/*
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const widgetUrl = `${APP_CONFIG.widgetUrl}/?module_token=${token.token}`;
              window.open(widgetUrl, '_blank');
            }}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          */}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(token.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      )
    }
  ];

  const tokens = tokensResponse?.items || [];

  const filteredTokens = tokens.filter(token => {
    const matchesSearch = token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (token.description && token.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (token.module_name && token.module_name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const sortedTokens = [...filteredTokens].sort((a, b) => {
    if (!sortColumn || !sortDirection) return 0;

    const aValue = a[sortColumn as keyof ModuleAccessToken];
    const bValue = b[sortColumn as keyof ModuleAccessToken];

    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    const result = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    return sortDirection === 'asc' ? result : -result;
  });

  const startIndex = (page - 1) * limit;
  const paginatedTokens = sortedTokens.slice(startIndex, startIndex + limit);

  const stats = {
    total: filteredTokens.length,
    active: filteredTokens.filter(t => t.is_active).length,
    expiringSoon: filteredTokens.filter(t => {
      if (!t.expires_at) return false;
      const daysUntilExpiry = Math.floor((new Date(t.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    }).length
  };

  return (
    <ProfessorOnly>
      <div className="space-y-6">
        <PageHeader
          title={t('title')}
          description={t('description')}
          breadcrumbs={breadcrumbs}
          actions={
            <Button onClick={() => handleOpenModal('create')}>
              <Plus className="mr-2 h-4 w-4" />
              {t('createButton')}
            </Button>
          }
        />

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="h-5 w-5" />
                <span>{t('stats.totalTokens')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-green-500" />
                <span>{t('stats.activeTokens')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.active}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-blue-500" />
                <span>{t('stats.securityRate')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">100%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-amber-500" />
                <span>{t('stats.expiringSoon')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.expiringSoon}</p>
            </CardContent>
          </Card>
        </div>

        <DataTable
          data={paginatedTokens}
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
            total: sortedTokens.length,
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

        <TokenModal
          mode={modalMode}
          open={modalOpen}
          onClose={handleCloseModal}
          onSuccess={handleModalSuccess}
          token={selectedToken}
        />
      </div>
    </ProfessorOnly>
  );
}