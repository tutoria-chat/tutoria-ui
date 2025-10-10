'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('dashboard');

  if (!user) return null;

  const roleDisplayName = getUserRoleDisplayName(user.role);
  const userName = user.first_name || user.email?.split('@')[0] || t('welcome', { userName: 'User' }).split(',')[1]?.trim() || 'User';

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('welcome', { userName })}
        description={t('description', { roleDisplayName })}
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
          <CardTitle className="text-2xl">{t('quickActions.title')}</CardTitle>
          <CardDescription className="text-base">
            {t('quickActions.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 grid-cols-2 max-w-4xl mx-auto">
            <SuperAdminOnly>
              <Button asChild className="h-40 p-6 flex flex-col items-center justify-center space-y-4 text-lg">
                <Link href="/universities/create">
                  <Plus className="h-12 w-12" />
                  <span className="text-lg font-semibold">{t('quickActions.createUniversity')}</span>
                </Link>
              </Button>
            </SuperAdminOnly>

            <SuperAdminOnly>
              <Button asChild variant="outline" className="h-40 p-6 flex flex-col items-center justify-center space-y-4 text-lg">
                <Link href="/universities">
                  <Building2 className="h-12 w-12" />
                  <span className="text-lg font-semibold">{t('quickActions.viewUniversities')}</span>
                </Link>
              </Button>
            </SuperAdminOnly>

            <AdminOnly>
              <Button asChild className="h-40 p-6 flex flex-col items-center justify-center space-y-4 text-lg">
                <Link href="/courses/create">
                  <Plus className="h-12 w-12" />
                  <span className="text-lg font-semibold">{t('quickActions.createCourse')}</span>
                </Link>
              </Button>
            </AdminOnly>

            <AdminOnly>
              <Button asChild variant="outline" className="h-40 p-6 flex flex-col items-center justify-center space-y-4 text-lg">
                <Link href="/professors">
                  <Users className="h-12 w-12" />
                  <span className="text-lg font-semibold">{t('quickActions.viewProfessors')}</span>
                </Link>
              </Button>
            </AdminOnly>

            <ProfessorOnly>
              <Button asChild className="h-40 p-6 flex flex-col items-center justify-center space-y-4 text-lg">
                <Link href="/modules/create">
                  <Plus className="h-12 w-12" />
                  <span className="text-lg font-semibold">{t('quickActions.createModule')}</span>
                </Link>
              </Button>
            </ProfessorOnly>

            <ProfessorOnly>
              <Button asChild variant="outline" className="h-40 p-6 flex flex-col items-center justify-center space-y-4 text-lg">
                <Link href="/courses">
                  <BookOpen className="h-12 w-12" />
                  <span className="text-lg font-semibold">{t('quickActions.viewCourses')}</span>
                </Link>
              </Button>
            </ProfessorOnly>

            <ProfessorOnly>
              <Button asChild variant="outline" className="h-40 p-6 flex flex-col items-center justify-center space-y-4 text-lg">
                <Link href="/modules">
                  <Activity className="h-12 w-12" />
                  <span className="text-lg font-semibold">{t('quickActions.viewModules')}</span>
                </Link>
              </Button>
            </ProfessorOnly>

            <ProfessorOnly>
              <Button asChild variant="outline" className="h-40 p-6 flex flex-col items-center justify-center space-y-4 text-lg">
                <Link href="/tokens">
                  <Key className="h-12 w-12" />
                  <span className="text-lg font-semibold">{t('quickActions.manageTokens')}</span>
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