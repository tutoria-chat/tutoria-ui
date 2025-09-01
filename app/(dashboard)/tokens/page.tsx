'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Key, Plus, Activity, Shield, Clock } from 'lucide-react';
import { ProfessorOnly } from '@/components/auth/role-guard';

export default function TokensPage() {
  return (
    <ProfessorOnly>
      <div className="space-y-6">
        <PageHeader
          title="Gerenciamento de Tokens de Módulo"
          description="Crie e gerencie tokens de acesso para widgets de tutoria IA"
          actions={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Gerar Token
            </Button>
          }
        />

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="h-5 w-5" />
                <span>Tokens Ativos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">23</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-green-500" />
                <span>Chamadas de API Hoje</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">1,847</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-blue-500" />
                <span>Tokens Seguros</span>
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
              <p className="text-2xl font-bold">3</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tokens de Módulo</CardTitle>
            <CardDescription>A interface de gerenciamento de tokens será implementada aqui</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-12">
              Sistema de gerenciamento de tokens de módulo em breve...
            </p>
          </CardContent>
        </Card>
      </div>
    </ProfessorOnly>
  );
}