'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { ProfessorOnly } from '@/components/auth/role-guard';
import { apiClient } from '@/lib/api';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { ModuleAccessToken, ModuleAccessTokenUpdate, BreadcrumbItem } from '@/lib/types';

export default function EditTokenPage() {
  const router = useRouter();
  const params = useParams();
  const tokenId = Number(params.id);

  const [token, setToken] = useState<ModuleAccessToken | null>(null);
  const [formData, setFormData] = useState<ModuleAccessTokenUpdate>({
    name: '',
    description: '',
    allow_chat: true,
    allow_file_access: true,
    is_active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const loadToken = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const data = await apiClient.getModuleToken(tokenId);

      setToken(data);
      setFormData({
        name: data.name,
        description: data.description || '',
        allow_chat: data.allow_chat,
        allow_file_access: data.allow_file_access,
        is_active: data.is_active,
      });
    } catch (error) {
      console.error('Falha ao carregar token:', error);
      setErrors({ load: 'Erro ao carregar dados do token.' });
    } finally {
      setIsLoadingData(false);
    }
  }, [tokenId]);

  useEffect(() => {
    loadToken();
  }, [loadToken]);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Tokens de Módulos', href: '/tokens' },
    { label: token?.name || 'Carregando...', href: `/tokens/${tokenId}` },
    { label: 'Editar', isCurrentPage: true }
  ];

  const handleChange = (field: keyof ModuleAccessTokenUpdate, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Nome do token é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await apiClient.updateModuleToken(tokenId, formData);
      router.push('/tokens');
    } catch (error) {
      console.error('Falha ao atualizar token:', error);
      setErrors({ submit: 'Erro ao atualizar token. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (errors.load) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-destructive">{errors.load}</p>
        <Button onClick={() => router.push('/tokens')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Tokens
        </Button>
      </div>
    );
  }

  return (
    <ProfessorOnly>
      <div className="space-y-6">
        <PageHeader
          title="Editar Token de Módulo"
          description={`Atualize as configurações do token para ${token?.module_name}`}
          breadcrumbs={breadcrumbs}
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Token</CardTitle>
              <CardDescription>
                Atualize o nome e descrição do token de acesso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Token</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Ex: Widget Moodle 2024"
                  disabled={isLoading}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Descrição do uso deste token..."
                  rows={3}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Permissões</CardTitle>
              <CardDescription>
                Configure o que os usuários podem fazer com este token
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allow_chat">Permitir Chat</Label>
                  <p className="text-sm text-muted-foreground">
                    Permite que usuários façam perguntas ao tutor IA
                  </p>
                </div>
                <Switch
                  id="allow_chat"
                  checked={formData.allow_chat}
                  onCheckedChange={(checked) => handleChange('allow_chat', checked)}
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allow_file_access">Permitir Acesso a Arquivos</Label>
                  <p className="text-sm text-muted-foreground">
                    Permite que usuários baixem arquivos do módulo
                  </p>
                </div>
                <Switch
                  id="allow_file_access"
                  checked={formData.allow_file_access}
                  onCheckedChange={(checked) => handleChange('allow_file_access', checked)}
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="is_active">Token Ativo</Label>
                  <p className="text-sm text-muted-foreground">
                    Desative para bloquear temporariamente o acesso
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleChange('is_active', checked)}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          {errors.submit && (
            <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-md">
              <p className="text-sm text-destructive">{errors.submit}</p>
            </div>
          )}

          <div className="flex items-center justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/tokens')}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </div>
        </form>
      </div>
    </ProfessorOnly>
  );
}
