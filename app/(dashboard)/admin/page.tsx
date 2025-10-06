'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Building2, 
  BookOpen, 
  Users, 
  GraduationCap, 
  FileText, 
  Key,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Server,
  Database,
  Zap
} from 'lucide-react';
import { SuperAdminOnly } from '@/components/auth/role-guard';
import type { SystemStats, BreadcrumbItem } from '@/lib/types';

// Mock data - em produção viria da API
const mockSystemStats: SystemStats = {
  total_universities: 15,
  total_courses: 248,
  total_modules: 456,
  total_professors: 156,
  total_students: 3420,
  total_files: 1248,
  total_tokens: 89,
  storage_used_mb: 15600, // ~15.6 GB
  api_calls_today: 12450
};

const recentActivities = [
  {
    id: 1,
    type: 'university_created',
    message: 'Nova universidade "Instituto de Tecnologia" criada',
    user: 'Super Administrador',
    timestamp: '2024-03-16T14:30:00Z',
    status: 'success'
  },
  {
    id: 2,
    type: 'course_created',
    message: 'Curso "Aprendizado de Máquina Avançado" criado',
    user: 'Dr. Silva (Professor Administrador)',
    timestamp: '2024-03-16T13:45:00Z',
    status: 'success'
  },
  {
    id: 3,
    type: 'system_alert',
    message: 'Alto uso de API detectado',
    user: 'Sistema',
    timestamp: '2024-03-16T12:20:00Z',
    status: 'warning'
  },
  {
    id: 4,
    type: 'module_created',
    message: 'Módulo "Básicos de Redes Neurais" criado',
    user: 'Prof. Santos',
    timestamp: '2024-03-16T11:15:00Z',
    status: 'success'
  },
  {
    id: 5,
    type: 'file_uploaded',
    message: 'Upload de arquivo grande (450MB) concluído',
    user: 'Prof. Oliveira',
    timestamp: '2024-03-16T10:30:00Z',
    status: 'info'
  }
];

const systemHealth = {
  database: { status: 'saudável', response_time: '12ms', uptime: '99.9%' },
  api: { status: 'saudável', response_time: '45ms', requests_per_minute: 1200 },
  storage: { status: 'alerta', used_percentage: 78, available_gb: 4.2 },
  ai_service: { status: 'saudável', response_time: '340ms', success_rate: '99.5%' }
};

export default function AdminDashboardPage() {
  const [stats] = useState<SystemStats>(mockSystemStats);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Administração', isCurrentPage: true }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'saudável': return 'text-green-500';
      case 'alerta': return 'text-amber-500';
      case 'erro': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatStorage = (mb: number) => {
    if (mb > 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb} MB`;
  };

  return (
    <SuperAdminOnly>
      <div className="space-y-6">
        <PageHeader
          title="Administração do Sistema"
          description="Visão geral do sistema, estatísticas e controles administrativos"
          breadcrumbs={breadcrumbs}
          actions={
            <div className="flex items-center space-x-2">
              <Button variant="outline" asChild>
                <Link href="/admin/super-admins">
                  Gerenciar Administradores
                </Link>
              </Button>
              <Button asChild>
                <Link href="/universities/create">
                  Criar Universidade
                </Link>
              </Button>
            </div>
          }
        />

        {/* System Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Universidades</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_universities}</div>
              <p className="text-xs text-muted-foreground">
                +2 desde o mês passado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Disciplinas</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_courses}</div>
              <p className="text-xs text-muted-foreground">
                +15 desde a semana passada
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_professors + stats.total_students}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total_professors} professores, {stats.total_students} estudantes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chamadas de API Hoje</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.api_calls_today.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +12% desde ontem
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Stats */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Content Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas de Conteúdo</CardTitle>
              <CardDescription>Visão geral do conteúdo da plataforma</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Módulos</span>
                </div>
                <span className="font-bold">{stats.total_modules}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Arquivos</span>
                </div>
                <span className="font-bold">{stats.total_files}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Key className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">Tokens Ativos</span>
                </div>
                <span className="font-bold">{stats.total_tokens}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4 text-amber-500" />
                  <span className="text-sm">Armazenamento Usado</span>
                </div>
                <span className="font-bold">{formatStorage(stats.storage_used_mb)}</span>
              </div>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle>Saúde do Sistema</CardTitle>
              <CardDescription>Status do sistema e desempenho em tempo real</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Database className={`h-4 w-4 ${getStatusColor(systemHealth.database.status)}`} />
                  <span className="text-sm">Banco de Dados</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={systemHealth.database.status === 'saudável' ? 'default' : 'destructive'}>
                    {systemHealth.database.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{systemHealth.database.response_time}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Server className={`h-4 w-4 ${getStatusColor(systemHealth.api.status)}`} />
                  <span className="text-sm">Servidor API</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={systemHealth.api.status === 'saudável' ? 'default' : 'destructive'}>
                    {systemHealth.api.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{systemHealth.api.response_time}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className={`h-4 w-4 ${getStatusColor(systemHealth.storage.status)}`} />
                  <span className="text-sm">Armazenamento</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={systemHealth.storage.status === 'saudável' ? 'default' : 'secondary'}>
                    {systemHealth.storage.used_percentage}% usado
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Zap className={`h-4 w-4 ${getStatusColor(systemHealth.ai_service.status)}`} />
                  <span className="text-sm">Serviço IA</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={systemHealth.ai_service.status === 'saudável' ? 'default' : 'destructive'}>
                    {systemHealth.ai_service.success_rate}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{systemHealth.ai_service.response_time}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente do Sistema</CardTitle>
            <CardDescription>Ações administrativas e eventos do sistema mais recentes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4 p-3 rounded-lg border">
                  {getStatusIcon(activity.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none">
                      {activity.message}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      por {activity.user}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>Tarefas administrativas comuns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2" asChild>
                <Link href="/universities/create">
                  <Building2 className="h-6 w-6" />
                  <span>Criar Universidade</span>
                </Link>
              </Button>

              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2" asChild>
                <Link href="/admin/super-admins/create">
                  <Users className="h-6 w-6" />
                  <span>Adicionar Super Admin</span>
                </Link>
              </Button>

              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2" asChild>
                <Link href="/admin/system-stats">
                  <BarChart3 className="h-6 w-6" />
                  <span>Ver Análises</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperAdminOnly>
  );
}