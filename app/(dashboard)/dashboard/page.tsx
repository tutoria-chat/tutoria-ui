'use client';

import React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Building2,
  BookOpen,
  Users,
  Key,
  Plus,
  Activity
} from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { SuperAdminOnly, AdminOnly, ProfessorOnly } from '@/components/auth/role-guard';
import { getUserRoleDisplayName } from '@/lib/permissions';

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  const roleDisplayName = getUserRoleDisplayName(user.role);
  const userName = user.first_name || user.email?.split('@')[0] || 'Usuário';

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Bem-vindo de volta, ${userName}!`}
        description={`Dashboard ${roleDisplayName} - Gerencie seu conteúdo educacional e configurações`}
      />

      {/* TODO: Stats cards - will be implemented when we have proper API endpoints for stats */}
      {/*
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        Stats cards will go here with real data from the API
      </div>
      */}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Acesso rápido às tarefas mais comuns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <SuperAdminOnly>
              <Button asChild className="h-20 p-4 flex flex-col items-center justify-center space-y-2">
                <Link href="/universities/create">
                  <Plus className="h-6 w-6" />
                  <span>Criar Universidade</span>
                </Link>
              </Button>
            </SuperAdminOnly>

            <SuperAdminOnly>
              <Button asChild variant="outline" className="h-20 p-4 flex flex-col items-center justify-center space-y-2">
                <Link href="/universities">
                  <Building2 className="h-6 w-6" />
                  <span>Ver Universidades</span>
                </Link>
              </Button>
            </SuperAdminOnly>

            <AdminOnly>
              <Button asChild className="h-20 p-4 flex flex-col items-center justify-center space-y-2">
                <Link href="/courses/create">
                  <Plus className="h-6 w-6" />
                  <span>Criar Disciplina</span>
                </Link>
              </Button>
            </AdminOnly>

            <AdminOnly>
              <Button asChild variant="outline" className="h-20 p-4 flex flex-col items-center justify-center space-y-2">
                <Link href="/professors">
                  <Users className="h-6 w-6" />
                  <span>Ver Professores</span>
                </Link>
              </Button>
            </AdminOnly>

            <ProfessorOnly>
              <Button asChild className="h-20 p-4 flex flex-col items-center justify-center space-y-2">
                <Link href="/modules/create">
                  <Plus className="h-6 w-6" />
                  <span>Criar Módulo</span>
                </Link>
              </Button>
            </ProfessorOnly>

            <ProfessorOnly>
              <Button asChild variant="outline" className="h-20 p-4 flex flex-col items-center justify-center space-y-2">
                <Link href="/courses">
                  <BookOpen className="h-6 w-6" />
                  <span>Ver Disciplinas</span>
                </Link>
              </Button>
            </ProfessorOnly>

            <ProfessorOnly>
              <Button asChild variant="outline" className="h-20 p-4 flex flex-col items-center justify-center space-y-2">
                <Link href="/modules">
                  <Activity className="h-6 w-6" />
                  <span>Ver Módulos</span>
                </Link>
              </Button>
            </ProfessorOnly>

            <ProfessorOnly>
              <Button asChild variant="outline" className="h-20 p-4 flex flex-col items-center justify-center space-y-2">
                <Link href="/tokens">
                  <Key className="h-6 w-6" />
                  <span>Gerenciar Tokens</span>
                </Link>
              </Button>
            </ProfessorOnly>
          </div>
        </CardContent>
      </Card>

      {/* TODO: Recent Activity - will be implemented when we have activity tracking */}
      {/*
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
          <CardDescription>
            Últimas atualizações e alterações
          </CardDescription>
        </CardHeader>
        <CardContent>
          Activity feed will go here with real data
        </CardContent>
      </Card>
      */}
    </div>
  );
}