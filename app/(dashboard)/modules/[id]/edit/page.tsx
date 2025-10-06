'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectItem } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { ProfessorOnly } from '@/components/auth/role-guard';
import { useAuth } from '@/components/auth/auth-provider';
import { apiClient } from '@/lib/api';
import { ArrowLeft, Loader2, Upload, FileText, Trash2, Download } from 'lucide-react';
import { DataTable } from '@/components/shared/data-table';
import { FileUpload } from '@/components/ui/file-upload';
import { useFetch } from '@/lib/hooks';
import type { Module, ModuleUpdate, Course, File as FileType, TableColumn, BreadcrumbItem, PaginatedResponse } from '@/lib/types';

export default function EditModulePage() {
  const router = useRouter();
  const params = useParams();
  const moduleId = Number(params.id);
  const { user } = useAuth();

  const [module, setModule] = useState<Module | null>(null);
  const [formData, setFormData] = useState<ModuleUpdate>({
    name: '',
    code: '',
    description: '',
    system_prompt: '',
    semester: undefined,
    year: undefined,
    course_id: undefined,
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: filesResponse, loading: filesLoading, refetch: refetchFiles } = useFetch<PaginatedResponse<FileType>>(`/files/?module_id=${moduleId}`);

  const files = filesResponse?.items || [];

  const loadModule = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const data = await apiClient.getModule(moduleId);

      // For regular professors, they can only see modules in their assigned courses
      // The API handles this filtering, so no additional check needed here

      setModule(data);
      setFormData({
        name: data.name,
        code: data.code || '',
        description: data.description || '',
        system_prompt: data.system_prompt || '',
        semester: data.semester,
        year: data.year,
        course_id: data.course_id,
      });
    } catch (error) {
      console.error('Failed to load module:', error);
      setErrors({ load: 'Erro ao carregar dados do módulo.' });
    } finally {
      setIsLoadingData(false);
    }
  }, [moduleId, user]);

  const loadCourses = useCallback(async () => {
    if (user?.role !== 'super_admin') return;

    setLoadingCourses(true);
    try {
      // Filter courses by user's university for professors
      const params: Record<string, string | number> = { limit: 1000 };
      if (user?.university_id && user.role !== 'super_admin') {
        params.university_id = user.university_id;
      }
      const response = await apiClient.getCourses(params);
      setCourses(response.items);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoadingCourses(false);
    }
  }, [user]);

  useEffect(() => {
    loadModule();
    loadCourses();
  }, [loadModule, loadCourses]);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Módulos', href: '/modules' },
    { label: module?.name || 'Carregando...', href: `/modules/${moduleId}` },
    { label: 'Editar', isCurrentPage: true }
  ];

  const handleChange = (field: keyof ModuleUpdate, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Nome do módulo é obrigatório';
    }

    if (user?.role === 'super_admin' && !formData.course_id) {
      newErrors.course_id = 'Curso é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getFileDisplayName = (file: FileType): string => {
    return file.file_name || file.name || 'Arquivo sem nome';
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // Prepare data for API - remove undefined values and ensure proper types
      const updateData: ModuleUpdate = {
        name: formData.name?.trim(),
        code: formData.code?.trim() || undefined,
        description: formData.description?.trim() || undefined,
        system_prompt: formData.system_prompt?.trim() || undefined,
        semester: formData.semester,
        year: formData.year,
      };

      // Only include course_id if user is super_admin
      if (user?.role === 'super_admin' && formData.course_id) {
        updateData.course_id = formData.course_id;
      }

      await apiClient.updateModule(moduleId, updateData);
      router.push('/modules');
    } catch (error) {
      console.error('Failed to update module:', error);
      setErrors({ submit: 'Erro ao atualizar módulo. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <ProfessorOnly>
        <div className="space-y-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </ProfessorOnly>
    );
  }

  if (errors.load) {
    return (
      <ProfessorOnly>
        <div className="space-y-6">
          <PageHeader
            title="Erro"
            description="Não foi possível carregar os dados do módulo"
            breadcrumbs={breadcrumbs}
          />
          <Card>
            <CardContent className="pt-6">
              <p className="text-destructive">{errors.load}</p>
              <Button onClick={() => router.back()} className="mt-4">
                Voltar
              </Button>
            </CardContent>
          </Card>
        </div>
      </ProfessorOnly>
    );
  }

  return (
    <ProfessorOnly>
      <div className="space-y-6">
        <PageHeader
          title="Editar Módulo"
          description={`Edite as informações do módulo ${module?.name}`}
          breadcrumbs={breadcrumbs}
          actions={
            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          }
        />

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Informações do Módulo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  Nome do Módulo *
                </label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Ex: Introdução à Programação"
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-destructive mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="code" className="block text-sm font-medium mb-1">
                  Código do Módulo
                </label>
                <Input
                  id="code"
                  type="text"
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value)}
                  placeholder="Ex: PROG101"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="semester" className="block text-sm font-medium mb-1">
                    Semestre
                  </label>
                  <Input
                    id="semester"
                    type="number"
                    value={formData.semester || ''}
                    onChange={(e) => handleChange('semester', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Ex: 1"
                    min="1"
                    max="12"
                  />
                </div>

                <div>
                  <label htmlFor="year" className="block text-sm font-medium mb-1">
                    Ano
                  </label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year || ''}
                    onChange={(e) => handleChange('year', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Ex: 2024"
                    min="2000"
                    max="2100"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="course_name" className="block text-sm font-medium mb-1">
                  Disciplina
                </label>
                <Input
                  id="course_name"
                  value={module?.course_name || 'Carregando...'}
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  A disciplina não pode ser alterada após a criação do módulo
                </p>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1">
                  Descrição
                </label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Descrição do módulo (opcional)"
                  rows={3}
                />
              </div>

              <div>
                <label htmlFor="system_prompt" className="block text-sm font-medium mb-1">
                  Prompt do Sistema (Tutor IA)
                </label>
                <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>O que é isso?</strong> Pense nisso como as "instruções de personalidade" para o tutor IA.
                    Por exemplo: "Você é um professor paciente de programação que usa exemplos do dia a dia" ou
                    "Você é um tutor de matemática que sempre resolve passo a passo".
                    Isso define como o tutor vai responder às perguntas dos alunos neste módulo específico.
                  </p>
                </div>
                <Textarea
                  id="system_prompt"
                  value={formData.system_prompt}
                  onChange={(e) => handleChange('system_prompt', e.target.value)}
                  placeholder="Ex: Você é um tutor especializado em Python que explica conceitos usando analogias do mundo real..."
                  rows={6}
                />
              </div>

              {errors.submit && (
                <p className="text-sm text-destructive">{errors.submit}</p>
              )}

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Alterações
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* File Upload Section */}
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Arquivos do Módulo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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

              <Button type="submit" disabled={isUploading || !selectedFile} variant="outline">
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

            <DataTable
              data={files || []}
              columns={[
                {
                  key: 'file_name',
                  label: 'Arquivo',
                  render: (_, file) => (
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{getFileDisplayName(file)}</span>
                    </div>
                  )
                },
                {
                  key: 'file_size',
                  label: 'Tamanho',
                  render: (value) => `${((value as number) / 1024 / 1024).toFixed(2)} MB`
                },
                {
                  key: 'actions',
                  label: 'Ações',
                  width: '100px',
                  render: (_, file) => (
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            const { download_url } = await apiClient.getFileDownloadUrl(file.id);
                            window.open(download_url, '_blank');
                          } catch (error) {
                            console.error('Erro ao baixar arquivo:', error);
                          }
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          if (confirm('Tem certeza que deseja deletar este arquivo?')) {
                            try {
                              await apiClient.deleteFile(file.id);
                              refetchFiles?.();
                            } catch (error) {
                              console.error('Erro ao deletar arquivo:', error);
                            }
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )
                }
              ] as TableColumn<FileType>[]}
              loading={filesLoading}
              emptyMessage="Nenhum arquivo enviado ainda."
            />
          </CardContent>
        </Card>
      </div>
    </ProfessorOnly>
  );
}