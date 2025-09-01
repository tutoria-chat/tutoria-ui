'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Database, 
  Server, 
  Zap,
  Users,
  Building2,
  BookOpen,
  FileText,
  Clock,
  Download,
  RefreshCw
} from 'lucide-react';
import { SuperAdminOnly } from '@/components/auth/role-guard';
import type { BreadcrumbItem } from '@/lib/types';

// Mock analytics data
const mockStats = {
  overview: {
    totalUniversities: 15,
    totalCourses: 248,
    totalModules: 456,
    totalUsers: 3576,
    totalFiles: 1248,
    storageUsedGB: 15.6,
    apiCallsToday: 12450
  },
  growth: {
    universitiesGrowth: 13.2,
    coursesGrowth: 24.8,
    usersGrowth: 18.5,
    storageGrowth: 31.4
  },
  usage: {
    activeUsersToday: 892,
    activeUsersThisWeek: 2340,
    peakConcurrentUsers: 245,
    averageSessionDuration: 42 // minutes
  },
  performance: {
    avgResponseTime: 185, // ms
    uptime: 99.94, // percentage
    errorRate: 0.12, // percentage
    cacheHitRate: 94.8 // percentage
  },
  content: {
    modulesWithAI: 234,
    aiConfigurationRate: 51.3, // percentage
    totalTokens: 89,
    tokenUsageToday: 847
  }
};

const recentMetrics = [
  { time: '00:00', users: 45, api_calls: 120, cpu: 12 },
  { time: '04:00', users: 23, api_calls: 89, cpu: 8 },
  { time: '08:00', users: 156, api_calls: 445, cpu: 28 },
  { time: '12:00', users: 234, api_calls: 678, cpu: 45 },
  { time: '16:00', users: 189, api_calls: 567, cpu: 38 },
  { time: '20:00', users: 98, api_calls: 234, cpu: 22 }
];

export default function SystemStatsPage() {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Administração', href: '/admin' },
    { label: 'Estatísticas do Sistema', isCurrentPage: true }
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simular refresh de dados
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const handleExport = () => {
    // Simular export de dados
    alert('As estatísticas do sistema seriam exportadas para CSV em uma aplicação real');
  };

  return (
    <SuperAdminOnly>
      <div className="space-y-6">
        <PageHeader
          title="Estatísticas e Análises do Sistema"
          description="Métricas abrangentes do sistema, dados de desempenho e análises de uso"
          breadcrumbs={breadcrumbs}
          actions={
            <div className="flex items-center space-x-2">
              <div className="flex items-center border rounded-lg">
                {(['24h', '7d', '30d'] as const).map((range) => (
                  <Button
                    key={range}
                    variant={timeRange === range ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setTimeRange(range)}
                    className="rounded-none first:rounded-l-lg last:rounded-r-lg"
                  >
                    {range}
                  </Button>
                ))}
              </div>
              
              <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              
              <Button onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </div>
          }
        />

        {/* System Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Universidades</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.overview.totalUniversities}</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                +{mockStats.growth.universitiesGrowth}% desde o mês passado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.overview.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                +{mockStats.growth.usersGrowth}% desde o mês passado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chamadas de API Hoje</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.overview.apiCallsToday.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Pico: {Math.floor(mockStats.overview.apiCallsToday * 1.3)} chamadas/hora
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Armazenamento Usado</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.overview.storageUsedGB} GB</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingUp className="h-3 w-3 mr-1 text-amber-500" />
                +{mockStats.growth.storageGrowth}% desde o mês passado
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Server className="mr-2 h-5 w-5" />
                Desempenho do Sistema
              </CardTitle>
              <CardDescription>Métricas de saúde e desempenho do sistema em tempo real</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Tempo de Resposta Médio</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="default">{mockStats.performance.avgResponseTime}ms</Badge>
                  <Badge variant="outline" className="text-green-600">Excelente</Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Tempo de Atividade do Sistema</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="default">{mockStats.performance.uptime}%</Badge>
                  <Badge variant="outline" className="text-green-600">Saudável</Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Taxa de Erro</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">{mockStats.performance.errorRate}%</Badge>
                  <Badge variant="outline" className="text-green-600">Baixa</Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Taxa de Acerto do Cache</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="default">{mockStats.performance.cacheHitRate}%</Badge>
                  <Badge variant="outline" className="text-green-600">Ótima</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="mr-2 h-5 w-5" />
                Atividade do Usuário
              </CardTitle>
              <CardDescription>Engajamento do usuário e análises de sessão</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Usuários Ativos Hoje</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="default">{mockStats.usage.activeUsersToday}</Badge>
                  <span className="text-xs text-green-600">+12% vs ontem</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Usuários Ativos Esta Semana</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">{mockStats.usage.activeUsersThisWeek.toLocaleString()}</Badge>
                  <span className="text-xs text-green-600">+8% vs semana passada</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Pico de Usuários Concorrentes</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{mockStats.usage.peakConcurrentUsers}</Badge>
                  <span className="text-xs text-muted-foreground">às 14:30</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Duração Média da Sessão</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{mockStats.usage.averageSessionDuration} min</Badge>
                  <span className="text-xs text-green-600">+5 min vs semana passada</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Statistics */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="mr-2 h-5 w-5" />
                Visão Geral do Conteúdo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total de Cursos</span>
                <Badge variant="secondary">{mockStats.overview.totalCourses}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Total de Módulos</span>
                <Badge variant="secondary">{mockStats.overview.totalModules}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Total de Arquivos</span>
                <Badge variant="secondary">{mockStats.overview.totalFiles}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="mr-2 h-5 w-5" />
                Integração IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Módulos com IA</span>
                <Badge variant="default">{mockStats.content.modulesWithAI}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Taxa de Configuração IA</span>
                <Badge variant="outline">{mockStats.content.aiConfigurationRate}%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Tokens Ativos</span>
                <Badge variant="secondary">{mockStats.content.totalTokens}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                Uso Hoje
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Chamadas de API de Token</span>
                <Badge variant="default">{mockStats.content.tokenUsageToday}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Novos Arquivos Enviados</span>
                <Badge variant="secondary">24</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Novos Módulos Criados</span>
                <Badge variant="secondary">8</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Linha do Tempo de Atividade de 24 Horas
            </CardTitle>
            <CardDescription>Atividade do sistema nas últimas 24 horas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentMetrics.map((metric, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <span className="font-mono text-sm w-12">{metric.time}</span>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Users className="h-3 w-3 text-blue-500" />
                        <span className="text-sm">{metric.users} usuários</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Activity className="h-3 w-3 text-green-500" />
                        <span className="text-sm">{metric.api_calls} chamadas de API</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Server className="h-3 w-3 text-amber-500" />
                        <span className="text-sm">{metric.cpu}% CPU</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={metric.cpu > 40 ? "destructive" : metric.cpu > 25 ? "secondary" : "default"}>
                    {metric.cpu > 40 ? 'Alta Carga' : metric.cpu > 25 ? 'Carga Média' : 'Normal'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Alerts */}
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-900">Alertas e Notificações do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-amber-700 text-sm">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                <span>Uso de armazenamento está em 78% - considere expandir a capacidade</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span>Todos os sistemas operacionais - nenhum problema crítico detectado</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span>Janela de manutenção programada: Domingo 2:00-4:00</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperAdminOnly>
  );
}