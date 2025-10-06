'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { ProfessorOnly } from '@/components/auth/role-guard';
import { useAuth } from '@/components/auth/auth-provider';
import { apiClient } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import type { Module, ModuleAccessTokenCreate, BreadcrumbItem, PaginatedResponse } from '@/lib/types';

export default function CreateTokenPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const moduleIdParam = searchParams.get('module_id');

  const [modules, setModules] = useState<Module[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [formData, setFormData] = useState<ModuleAccessTokenCreate>({
    name: '',
    description: '',
    module_id: moduleIdParam ? Number(moduleIdParam) : 0,
    allow_chat: true,
    allow_file_access: true,
    expires_in_days: undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadModules = async () => {
      setLoadingModules(true);
      try {
        // Filter modules by user's university for professors
        const params: Record<string, string | number> = { limit: 1000 };
        if (user?.university_id && user.role !== 'super_admin') {
          params.university_id = user.university_id;
        }
        const response = await apiClient.getModules(params);
        setModules(response.items);
      } catch (error) {
        console.error('Failed to load modules:', error);
      } finally {
        setLoadingModules(false);
      }
    };

    loadModules();
  }, [user]);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Tokens de Módulos', href: '/tokens' },
    { label: 'Criar Token', isCurrentPage: true }
  ];

  const handleChange = (field: keyof ModuleAccessTokenCreate, value: string | boolean | number | undefined) => {
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

    if (!formData.module_id || formData.module_id === 0) {
      newErrors.module_id = 'Selecione um módulo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const newToken = await apiClient.createModuleToken(formData);
      router.push(`/tokens`);
    } catch (error) {
      console.error('Failed to create token:', error);
      setErrors({ submit: 'Erro ao criar token. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProfessorOnly>
      <div className="space-y-6">
        <PageHeader
          title="Criar Token de Módulo"
          description="Gere um token de acesso para widgets de tutoria IA"
          breadcrumbs={breadcrumbs}
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Informações do Token</CardTitle>
              <CardDescription>
                Configure o nome e descrição do token de acesso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="module_id">Módulo *</Label>
                <select
                  id="module_id"
                  value={formData.module_id}
                  onChange={(e) => handleChange('module_id', Number(e.target.value))}
                  disabled={isLoading || loadingModules}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="0">{loadingModules ? "Carregando módulos..." : "Selecione um módulo"}</option>
                  {modules.map((module) => (
                    <option key={module.id} value={module.id}>
                      {module.name} ({module.course_name})
                    </option>
                  ))}
                </select>
                {errors.module_id && (
                  <p className="text-sm text-destructive">{errors.module_id}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nome do Token *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Ex: Widget Moodle 2024"
                  disabled={isLoading}
                  required
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

              <div className="space-y-2">
                <Label htmlFor="expires_in_days">Expira em (dias - opcional)</Label>
                <Input
                  id="expires_in_days"
                  type="number"
                  value={formData.expires_in_days || ''}
                  onChange={(e) => handleChange('expires_in_days', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Ex: 365"
                  disabled={isLoading}
                  min="1"
                />
                <p className="text-sm text-muted-foreground">
                  Deixe vazio para um token sem expiração
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="max-w-2xl">
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
            </CardContent>
          </Card>

          {errors.submit && (
            <div className="max-w-2xl p-4 border border-destructive/50 bg-destructive/10 rounded-md">
              <p className="text-sm text-destructive">{errors.submit}</p>
            </div>
          )}

          <div className="flex items-center justify-end space-x-4 max-w-2xl">
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
              Criar Token
            </Button>
          </div>
        </form>
      </div>
    </ProfessorOnly>
  );
}
