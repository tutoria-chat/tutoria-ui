'use client';

import React, { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
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
  ArrowLeft,
  Key,
  Copy,
  Eye
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/shared/data-table';
import { FileUpload } from '@/components/ui/file-upload';
import { ProfessorOnly } from '@/components/auth/role-guard';
import { TokenModal } from '@/components/tokens/token-modal';
import { useFetch } from '@/lib/hooks';
import { apiClient } from '@/lib/api';
import { formatDateShort } from '@/lib/utils';
import type { Module, File as FileType, ModuleAccessToken, TableColumn, BreadcrumbItem, PaginatedResponse } from '@/lib/types';

export default function ModuleDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const moduleId = Number(params.id);

  const { data: module, loading: moduleLoading, error: moduleError } = useFetch<Module>(`/modules/${moduleId}`);
  const { data: filesResponse, loading: filesLoading, refetch: refetchFiles } = useFetch<PaginatedResponse<FileType>>(`/files/?module_id=${moduleId}`);
  const { data: tokensResponse, loading: tokensLoading, refetch: refetchTokens } = useFetch<PaginatedResponse<ModuleAccessToken>>(`/module-tokens/?module_id=${moduleId}`);

  const files = filesResponse?.items || [];
  const tokens = tokensResponse?.items || [];

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);

  const breadcrumbs: BreadcrumbItem[] = module?.course_id ? [
    { label: 'Disciplinas', href: '/courses' },
    { label: module?.course_name || 'Disciplina', href: `/courses/${module.course_id}` },
    { label: module?.name || 'Carregando...', isCurrentPage: true }
  ] : [
    { label: 'Módulos', href: '/modules' },
    { label: module?.name || 'Carregando...', isCurrentPage: true }
  ];

  const handleFileUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (!selectedFile) {
      setUploadError('Selecione um arquivo para enviar');
      return;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setUploadError('Arquivo muito grande. Tamanho máximo: 50MB');
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setUploadError('Tipo de arquivo não suportado. Use: PDF, DOC, DOCX, TXT, PPT ou PPTX');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', selectedFile);

      // Pass module_id and file name as query parameters
      await apiClient.uploadFile(uploadFormData, moduleId, selectedFile.name);

      // Reset form and refetch files
      form.reset();
      setSelectedFile(null);
      refetchFiles?.();

      toast.success('Arquivo enviado com sucesso!', {
        description: `${selectedFile.name} foi adicionado ao módulo.`,
      });
    } catch (error) {
      console.error('Erro ao enviar arquivo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setUploadError(`Erro ao enviar arquivo: ${errorMessage}. Tente novamente.`);

      toast.error('Erro ao enviar arquivo', {
        description: errorMessage,
      });
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
      toast.success('Arquivo deletado', {
        description: 'O arquivo foi removido do módulo.',
      });
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error);
      toast.error('Erro ao deletar arquivo', {
        description: 'Não foi possível deletar o arquivo. Tente novamente.',
      });
    }
  };

  const handleDownloadFile = async (fileId: number) => {
    try {
      const { download_url } = await apiClient.getFileDownloadUrl(fileId);
      window.open(download_url, '_blank');
      toast.success('Download iniciado', {
        description: 'O arquivo será baixado em breve.',
      });
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
      toast.error('Erro ao baixar arquivo', {
        description: 'Não foi possível baixar o arquivo. Tente novamente.',
      });
    }
  };

  const getFileDisplayName = (file: FileType): string => {
    return file.file_name || file.name || 'Arquivo sem nome';
  };

  const getFileType = (file: FileType): string => {
    return file.content_type || file.file_type || 'Tipo desconhecido';
  };

  const fileColumns: TableColumn<FileType>[] = [
    {
      key: 'file_name',
      label: 'Arquivo',
      sortable: true,
      render: (_, file) => (
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="font-medium">{getFileDisplayName(file)}</div>
            <div className="text-sm text-muted-foreground">
              {getFileType(file)}
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
      render: (value) => formatDateShort(value as string)
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

  const tokenColumns: TableColumn<ModuleAccessToken>[] = [
    {
      key: 'name',
      label: 'Nome do Token',
      sortable: true,
      render: (value, token) => (
        <div>
          <div className="font-medium">{value}</div>
          {token.description && (
            <div className="text-sm text-muted-foreground line-clamp-1 max-w-xs">
              {token.description}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'token',
      label: 'Token',
      render: (value) => (
        <div className="flex items-center space-x-2">
          <code className="text-xs bg-muted px-2 py-1 rounded">
            {(value as string).substring(0, 16)}...
          </code>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(value as string);
                toast.success('Token copiado!');
              } catch (error) {
                toast.error('Erro ao copiar token');
              }
            }}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      )
    },
    {
      key: 'allow_chat',
      label: 'Chat',
      render: (value) => (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? 'Permitido' : 'Bloqueado'}
        </Badge>
      )
    },
    {
      key: 'allow_file_access',
      label: 'Arquivos',
      render: (value) => (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? 'Permitido' : 'Bloqueado'}
        </Badge>
      )
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (value) => (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? 'Ativo' : 'Inativo'}
        </Badge>
      )
    },
    {
      key: 'created_at',
      label: 'Criado em',
      sortable: true,
      render: (value) => formatDateShort(value as string)
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
        description={`Módulo em ${module.course?.name || module.course_name || 'Disciplina'}`}
        breadcrumbs={breadcrumbs}
        actions={
          <ProfessorOnly>
            <div className="flex items-center space-x-2">
              {module.course_id && (
                <Button variant="outline" asChild>
                  <Link href={`/courses/${module.course_id}`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Ver Disciplina
                  </Link>
                </Button>
              )}
              <Button variant="outline" onClick={() => setTokenModalOpen(true)}>
                <Key className="mr-2 h-4 w-4" />
                Criar Token
              </Button>
              <Button asChild>
                <Link href={`/modules/${moduleId}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar Módulo
                </Link>
              </Button>
            </div>
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
                <p className="font-medium">{formatDateShort(module.created_at)}</p>
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
              <FileUpload
                onFileSelect={setSelectedFile}
                disabled={isUploading}
                selectedFile={selectedFile}
                maxSizeMB={50}
              />

              {uploadError && (
                <div className="p-3 bg-destructive/10 border border-destructive/50 rounded-md">
                  <p className="text-sm text-destructive">{uploadError}</p>
                </div>
              )}

              <Button type="submit" disabled={isUploading || !selectedFile}>
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

      {/* Module Tokens */}
      <ProfessorOnly>
        <Card>
          <CardHeader>
            <CardTitle>Tokens de Acesso</CardTitle>
            <CardDescription>
              Tokens gerados para este módulo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={tokens || []}
              columns={tokenColumns}
              loading={tokensLoading}
              emptyMessage="Nenhum token gerado ainda. Clique em 'Criar Token' acima."
            />
          </CardContent>
        </Card>
      </ProfessorOnly>

      {/* Token Creation Modal */}
      <TokenModal
        mode="create"
        open={tokenModalOpen}
        onClose={() => setTokenModalOpen(false)}
        onSuccess={() => {
          setTokenModalOpen(false);
          refetchTokens?.();
          toast.success('Token criado com sucesso!');
        }}
        preselectedModuleId={moduleId}
      />
    </div>
  );
}
