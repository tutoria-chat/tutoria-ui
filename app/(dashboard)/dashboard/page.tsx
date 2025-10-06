'use client';

import React from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  BookOpen, 
  Users, 
  GraduationCap, 
  FileText, 
  Key,
  Plus,
  TrendingUp,
  Activity
} from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { RoleGuard, SuperAdminOnly, AdminOnly, ProfessorOnly } from '@/components/auth/role-guard';
import { getUserRoleDisplayName } from '@/lib/permissions';

// Placeholder stats - in real app, these would come from API
const getStatsForRole = (role: string) => {
  switch (role) {
    case 'super_admin':
      return {
        universities: 15,
        courses: 248,
        professors: 156,
        students: 3420,
        files: 1248,
        tokens: 89,
      };
    case 'professor':
      return {
        courses: 18,
        professors: 12,
        students: 324,
        modules: 45,
        files: 156,
        tokens: 12,
      };
    default:
      return {};
  }
};

export default function DashboardPage() {
  const { user } = useAuth();
  
  if (!user) return null;

  const stats = getStatsForRole(user.role);
  const roleDisplayName = getUserRoleDisplayName(user.role);

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Bem-vindo de volta, ${user.first_name}!`}
        description={`Dashboard ${roleDisplayName} - Gerencie seu conteúdo educacional e configurações`}
      />

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SuperAdminOnly>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Universidades</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.universities}</div>
              <p className="text-xs text-muted-foreground">
                +2 desde o mês passado
              </p>
            </CardContent>
          </Card>
        </SuperAdminOnly>

        <ProfessorOnly>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {user.role === 'professor' && !user.is_admin ? 'Minhas Disciplinas' : 'Disciplinas'}
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.courses}</div>
              <p className="text-xs text-muted-foreground">
                {user.role === 'professor' && !user.is_admin ? 'Atribuídos a você' : 'Na sua universidade'}
              </p>
            </CardContent>
          </Card>
        </ProfessorOnly>

        <AdminOnly>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Professores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.professors}</div>
              <p className="text-xs text-muted-foreground">
                +5 desde o mês passado
              </p>
            </CardContent>
          </Card>
        </AdminOnly>

        <ProfessorOnly>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estudantes</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.students}</div>
              <p className="text-xs text-muted-foreground">
                Estudantes ativos
              </p>
            </CardContent>
          </Card>
        </ProfessorOnly>

        {user.role === 'professor' && !user.is_admin && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Meus Módulos</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.modules}</div>
              <p className="text-xs text-muted-foreground">
                Criados por você
              </p>
            </CardContent>
          </Card>
        )}

        <ProfessorOnly>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Arquivos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.files}</div>
              <p className="text-xs text-muted-foreground">
                Total enviados
              </p>
            </CardContent>
          </Card>
        </ProfessorOnly>

        <ProfessorOnly>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tokens de Módulos</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.tokens}</div>
              <p className="text-xs text-muted-foreground">
                Tokens ativos
              </p>
            </CardContent>
          </Card>
        </ProfessorOnly>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Tarefas comuns para começar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <SuperAdminOnly>
              <Button className="h-20 p-4 flex flex-col items-center justify-center space-y-2">
                <Plus className="h-6 w-6" />
                <span>Criar Universidade</span>
              </Button>
            </SuperAdminOnly>

            <AdminOnly>
              <Button className="h-20 p-4 flex flex-col items-center justify-center space-y-2">
                <Plus className="h-6 w-6" />
                <span>Criar Curso</span>
              </Button>
            </AdminOnly>

            <AdminOnly>
              <Button className="h-20 p-4 flex flex-col items-center justify-center space-y-2">
                <Plus className="h-6 w-6" />
                <span>Adicionar Professor</span>
              </Button>
            </AdminOnly>

            <ProfessorOnly>
              <Button className="h-20 p-4 flex flex-col items-center justify-center space-y-2">
                <Plus className="h-6 w-6" />
                <span>Criar Módulo</span>
              </Button>
            </ProfessorOnly>

            <ProfessorOnly>
              <Button className="h-20 p-4 flex flex-col items-center justify-center space-y-2">
                <Plus className="h-6 w-6" />
                <span>Enviar Arquivos</span>
              </Button>
            </ProfessorOnly>

            <ProfessorOnly>
              <Button className="h-20 p-4 flex flex-col items-center justify-center space-y-2">
                <Plus className="h-6 w-6" />
                <span>Gerar Token</span>
              </Button>
            </ProfessorOnly>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
          <CardDescription>
            Últimas atualizações e alterações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Placeholder activity items */}
            <div className="flex items-center space-x-4">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  Novo módulo criado em Ciência da Computação
                </p>
                <p className="text-sm text-muted-foreground">
                  2 horas atrás
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  15 novos estudantes matriculados
                </p>
                <p className="text-sm text-muted-foreground">
                  4 horas atrás
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="h-2 w-2 rounded-full bg-orange-500"></div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  Upload de arquivo concluído
                </p>
                <p className="text-sm text-muted-foreground">
                  6 horas atrás
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}