'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Shield, Users, Mail, Calendar } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SuperAdminOnly } from '@/components/auth/role-guard';
import { formatDateShort } from '@/lib/utils';
import type { SuperAdmin, TableColumn, BreadcrumbItem } from '@/lib/types';

// Mock data - em produção viria da API
const mockSuperAdmins: SuperAdmin[] = [
  {
    id: 1,
    email: 'admin@tutoria.com.br',
    first_name: 'Super',
    last_name: 'Administrador',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    email: 'joao.silva@tutoria.com.br',
    first_name: 'João',
    last_name: 'Silva',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-02-20T14:45:00Z'
  },
  {
    id: 3,
    email: 'maria.santos@tutoria.com.br',
    first_name: 'Maria',
    last_name: 'Santos',
    created_at: '2024-02-01T08:15:00Z',
    updated_at: '2024-03-10T16:20:00Z'
  },
  {
    id: 4,
    email: 'carlos.oliveira@tutoria.com.br',
    first_name: 'Carlos',
    last_name: 'Oliveira',
    created_at: '2024-02-15T12:00:00Z',
    updated_at: '2024-03-05T09:30:00Z'
  }
];

export default function SuperAdminsPage() {
  const [superAdmins] = useState<SuperAdmin[]>(mockSuperAdmins);
  const [loading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortColumn, setSortColumn] = useState<string | null>('first_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>('asc');

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Administração', href: '/admin' },
    { label: 'Super Administradores', isCurrentPage: true }
  ];

  const columns: TableColumn<SuperAdmin>[] = [
    {
      key: 'name',
      label: 'Super Administrador',
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
      label: 'Criado em',
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
      label: 'Última Atividade',
      sortable: true,
      render: (value) => (
        <div className="text-sm">
          {formatDateShort(value as string)}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: () => (
        <Badge variant="default" className="bg-green-100 text-green-800">
          Ativo
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Ações',
      width: '120px',
      render: (_, admin) => (
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            asChild
          >
            <Link href={`/admin/super-admins/${admin.id}`}>
              <Shield className="h-4 w-4" />
            </Link>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            asChild
          >
            <Link href={`/admin/super-admins/${admin.id}/edit`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(admin.id)}
            disabled={admin.id === 1} // Não pode deletar o primeiro admin
          >
            <Trash2 className={`h-4 w-4 ${admin.id === 1 ? 'text-muted-foreground' : 'text-destructive'}`} />
          </Button>
        </div>
      )
    }
  ];

  const handleDelete = (id: number) => {
    if (id === 1) {
      alert('Não é possível excluir a conta principal de super administrador');
      return;
    }
    
    // Em produção, chamaria a API para deletar o super admin
    console.log('Delete super admin:', id);
    alert('Isso excluiria o super administrador em uma aplicação real');
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
          title="Gerenciamento de Super Administradores"
          description="Gerencie contas de super administrador e suas permissões"
          breadcrumbs={breadcrumbs}
          actions={
            <Button asChild>
              <Link href="/admin/super-admins/create">
                <Plus className="mr-2 h-4 w-4" />
                Criar Super Administrador
              </Link>
            </Button>
          }
        />

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Super Administradores</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{superAdmins.length}</div>
              <p className="text-xs text-muted-foreground">
                Administradores do sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ativos Hoje</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.floor(superAdmins.length * 0.75)}</div>
              <p className="text-xs text-muted-foreground">
                Online nas últimas 24h
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ações Recentes</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">47</div>
              <p className="text-xs text-muted-foreground">
                Ações administrativas hoje
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status de Segurança</CardTitle>
              <Shield className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Seguro</div>
              <p className="text-xs text-muted-foreground">
                Todos os sistemas normais
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Warning Card */}
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-900 flex items-center">
              <Shield className="mr-2 h-5 w-5" />
              Aviso de Segurança
            </CardTitle>
            <CardDescription className="text-amber-700">
              Super administradores têm acesso completo ao sistema. Crie contas apenas para indivíduos confiáveis.
              Todas as ações de super administradores são registradas para auditoria de segurança.
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
            placeholder: "Buscar super administradores por nome ou email...",
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
          emptyMessage="Nenhum super administrador encontrado."
        />

        {/* Recent Admin Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente de Super Administradores</CardTitle>
            <CardDescription>Ações administrativas mais recentes realizadas por super administradores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-3 rounded-lg border">
                <Shield className="h-4 w-4 text-green-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Nova universidade "Universidade de Tecnologia" criada</p>
                  <p className="text-sm text-muted-foreground">por João Silva</p>
                </div>
                <span className="text-xs text-muted-foreground">2 horas atrás</span>
              </div>

              <div className="flex items-center space-x-4 p-3 rounded-lg border">
                <Shield className="h-4 w-4 text-blue-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Configurações do sistema atualizadas</p>
                  <p className="text-sm text-muted-foreground">por Maria Santos</p>
                </div>
                <span className="text-xs text-muted-foreground">4 horas atrás</span>
              </div>

              <div className="flex items-center space-x-4 p-3 rounded-lg border">
                <Shield className="h-4 w-4 text-purple-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Nova conta de super administrador criada</p>
                  <p className="text-sm text-muted-foreground">pelo Super Administrador</p>
                </div>
                <span className="text-xs text-muted-foreground">1 dia atrás</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperAdminOnly>
  );
}