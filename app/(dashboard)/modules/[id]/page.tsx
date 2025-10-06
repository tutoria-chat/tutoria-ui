'use client';

import React, { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Edit,
  Upload,
  Trash2,
  Download,
  FileText,
  Calendar,
  BookOpen,
  Bot,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/shared/data-table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProfessorOnly } from '@/components/auth/role-guard';
import { useFetch } from '@/lib/hooks';
import { apiClient } from '@/lib/api';
import type { Module, File, TableColumn, BreadcrumbItem, PaginatedResponse } from '@/lib/types';

export default function ModuleDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const moduleId = Number(params.id);

  const { data: module, loading: moduleLoading, error: moduleError } = useFetch<Module>(`/modules/${moduleId}`);
  const { data: filesResponse, loading: filesLoading, refetch: refetchFiles } = useFetch<PaginatedResponse<File>>(`/files/?module_id=${moduleId}`);

  const files = filesResponse?.items || [];

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Módulos', href: '/modules' },
    { label: module?.name || 'Carregando...', isCurrentPage: true }
  ];

  const handleFileUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const file = formData.get('file') as globalThis.File;

    if (!file) {
      setUploadError('Selecione um arquivo para enviar');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      // Pass module_id and file name as query parameters
      await apiClient.uploadFile(uploadFormData, moduleId, file.name);

      // Reset form and refetch files
      form.reset();
      refetchFiles?.();
    } catch (error) {
      console.error('Erro ao enviar arquivo:', error);
      setUploadError('Erro ao enviar arquivo. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    if (!confirm('Tem certeza que deseja deletar este arquivo? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await apiClient.deleteFile(fileId);
      refetchFiles?.();
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error);
      alert('Erro ao deletar arquivo. Tente novamente.');
    }
  };

  const handleDownloadFile = async (fileId: number) => {
    try {
      const { download_url } = await apiClient.getFileDownloadUrl(fileId);
      window.open(download_url, '_blank');
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
      alert('Erro ao baixar arquivo. Tente novamente.');
    }
  };

  const fileColumns: TableColumn<File>[] = [
    {
      key: 'file_name',
      label: 'Arquivo',
      sortable: true,
      render: (value, file) => (
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="font-medium">{(value as string) || file.name || 'Arquivo sem nome'}</div>
            <div className="text-sm text-muted-foreground">
              {file.content_type || file.file_type || 'Tipo desconhecido'}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'file_size',
      label: 'Tamanho',
      sortable: true,
      render: (value) => `${((value as number) / 1024 / 1024).toFixed(2)} MB`
    },
    {
      key: 'created_at',
      label: 'Enviado em',
      sortable: true,
      render: (value) => new Date(value as string).toLocaleDateString('pt-BR')
    },
    {
      key: 'actions',
      label: 'Ações',
      width: '120px',
      render: (_, file) => (
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDownloadFile(file.id)}
          >
            <Download className="h-4 w-4" />
          </Button>

          <ProfessorOnly>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteFile(file.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </ProfessorOnly>
        </div>
      )
    }
  ];

  if (moduleLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (moduleError || !module) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-destructive">Erro ao carregar módulo</p>
        <Button onClick={() => router.push('/modules')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Módulos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={module.name}
        description={`Módulo em ${module.course_name}`}
        breadcrumbs={breadcrumbs}
        actions={
          <ProfessorOnly>
            <Button asChild>
              <Link href={`/modules/${moduleId}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Editar Módulo
              </Link>
            </Button>
          </ProfessorOnly>
        }
      />

      {/* Module Information */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Módulo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {module.description && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Descrição</h4>
                <p className="text-sm leading-relaxed">{module.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              {module.code && (
                <div>
                  <p className="text-muted-foreground">Código</p>
                  <p className="font-medium font-mono">{module.code}</p>
                </div>
              )}
              {module.semester && (
                <div>
                  <p className="text-muted-foreground">Semestre</p>
                  <p className="font-medium">{module.semester}</p>
                </div>
              )}
              {module.year && (
                <div>
                  <p className="text-muted-foreground">Ano</p>
                  <p className="font-medium">{module.year}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">Criado em</p>
                <p className="font-medium">{new Date(module.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Bot className={`h-4 w-4 ${module.system_prompt ? 'text-green-500' : 'text-muted-foreground'}`} />
              <Badge variant={module.system_prompt ? "default" : "secondary"}>
                {module.system_prompt ? 'Tutor IA Configurado' : 'Tutor IA Não Configurado'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estatísticas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{files?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Arquivos</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{module.tokens_count || 0}</p>
                <p className="text-sm text-muted-foreground">Tokens de Acesso</p>
              </div>
              <BookOpen className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* File Upload Section */}
      <ProfessorOnly>
        <Card>
          <CardHeader>
            <CardTitle>Enviar Arquivo</CardTitle>
            <CardDescription>
              Faça upload de materiais de estudo para este módulo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file">Selecione um arquivo</Label>
                <Input
                  id="file"
                  name="file"
                  type="file"
                  disabled={isUploading}
                  accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
                />
                <p className="text-sm text-muted-foreground">
                  Formatos suportados: PDF, DOC, DOCX, TXT, PPT, PPTX
                </p>
              </div>

              {uploadError && (
                <p className="text-sm text-destructive">{uploadError}</p>
              )}

              <Button type="submit" disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Enviar Arquivo
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </ProfessorOnly>

      {/* Files List */}
      <Card>
        <CardHeader>
          <CardTitle>Arquivos do Módulo</CardTitle>
          <CardDescription>
            Arquivos disponíveis neste módulo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={files || []}
            columns={fileColumns}
            loading={filesLoading}
            emptyMessage="Nenhum arquivo enviado ainda. Faça upload do primeiro arquivo acima."
          />
        </CardContent>
      </Card>
    </div>
  );
}
