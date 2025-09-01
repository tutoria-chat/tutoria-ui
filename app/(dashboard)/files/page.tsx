'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Upload, Plus } from 'lucide-react';

export default function FilesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Gerenciamento de Arquivos"
        description="Envie e gerencie arquivos para seus módulos"
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Enviar Arquivos
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Total de Arquivos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">156</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>Armazenamento Usado</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">2.4 GB</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Uploads Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">24</p>
            <p className="text-sm text-muted-foreground">Esta semana</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Arquivos</CardTitle>
          <CardDescription>A interface de gerenciamento de arquivos será implementada aqui</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-12">
            Sistema de upload e gerenciamento de arquivos em breve...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}