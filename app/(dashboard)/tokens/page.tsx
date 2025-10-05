'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/shared/data-table';
import { Key, Plus, Activity, Shield, Clock, Eye, Edit, Trash2, Copy } from 'lucide-react';
import { ProfessorOnly } from '@/components/auth/role-guard';
import { useFetch } from '@/lib/hooks';
import type { ModuleAccessToken, TableColumn, BreadcrumbItem, PaginatedResponse } from '@/lib/types';

export default function TokensPage() {
  const { data: tokensResponse, loading, error } = useFetch<PaginatedResponse<ModuleAccessToken>>('/module-tokens/');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortColumn, setSortColumn] = useState<string | null>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>('desc');

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Tokens de Módulos', isCurrentPage: true }
  ];

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar este token? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const { apiClient } = await import('@/lib/api');
      await apiClient.deleteModuleToken(id);
      window.location.reload();
    } catch (error) {
      console.error('Erro ao deletar token:', error);
      alert('Erro ao deletar token. Tente novamente.');
    }
  };

  const handleCopyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      // You could use a toast notification here instead of alert
      alert('Token copiado para a área de transferência!');
    } catch (error) {
      console.error('Erro ao copiar token:', error);
      alert('Falha ao copiar o token. Tente novamente.');
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
      label: 'Nome do Token',
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
      label: 'Módulo',
      sortable: true,
      render: (value) => (
        <span className="text-sm">{value}</span>
      )
    },
    {
      key: 'token',
      label: 'Token',
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
      label: 'Chat',
      render: (value) => (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? 'Permitido' : 'Bloqueado'}
        </Badge>
      )
    },
    {
      key: 'allow_file_access',
      label: 'Arquivos',
      render: (value) => (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? 'Permitido' : 'Bloqueado'}
        </Badge>
      )
    },
    {
      key: 'expires_at',
      label: 'Expira em',
      sortable: true,
      render: (value) => value ? new Date(value as string).toLocaleDateString('pt-BR') : 'Nunca'
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (value) => (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? 'Ativo' : 'Inativo'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Ações',
      width: '120px',
      render: (_, token) => (
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            asChild
          >
            <Link href={`/tokens/${token.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            asChild
          >
            <Link href={`/tokens/${token.id}/edit`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>

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
          title="Gerenciamento de Tokens de Módulo"
          description="Crie e gerencie tokens de acesso para widgets de tutoria IA"
          breadcrumbs={breadcrumbs}
          actions={
            <Button asChild>
              <Link href="/tokens/create">
                <Plus className="mr-2 h-4 w-4" />
                Gerar Token
              </Link>
            </Button>
          }
        />

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="h-5 w-5" />
                <span>Tokens Totais</span>
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
                <span>Tokens Ativos</span>
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
                <span>Taxa de Segurança</span>
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
                <span>Expirando em Breve</span>
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
            placeholder: "Buscar tokens, módulos ou descrições...",
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
          emptyMessage="Nenhum token encontrado. Crie seu primeiro token para começar."
        />
      </div>
    </ProfessorOnly>
  );
}