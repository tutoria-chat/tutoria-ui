'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap, Plus, Users, TrendingUp } from 'lucide-react';
import { ProfessorOnly } from '@/components/auth/role-guard';

export default function StudentsPage() {
  return (
    <ProfessorOnly>
      <div className="space-y-6">
        <PageHeader
          title="Gerenciamento de Estudantes"
          description="Gerencie estudantes e acompanhe seu progresso"
          actions={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Estudante
            </Button>
          }
        />

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <GraduationCap className="h-5 w-5" />
                <span>Total de Estudantes</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">1,247</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-500" />
                <span>Ativos Este Mês</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">892</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <span>Novos Esta Semana</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">47</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Taxa de Conclusão</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">78%</p>
              <p className="text-sm text-muted-foreground">Média</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Estudantes</CardTitle>
            <CardDescription>A interface de gerenciamento de estudantes será implementada aqui</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-12">
              Sistema de gerenciamento de estudantes em breve...
            </p>
          </CardContent>
        </Card>
      </div>
    </ProfessorOnly>
  );
}