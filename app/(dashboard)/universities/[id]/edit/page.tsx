'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { SuperAdminOnly } from '@/components/auth/role-guard';
import { apiClient } from '@/lib/api';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { University, UniversityUpdate, BreadcrumbItem } from '@/lib/types';

export default function EditUniversityPage() {
  const router = useRouter();
  const params = useParams();
  const universityId = Number(params.id);

  const [university, setUniversity] = useState<University | null>(null);
  const [formData, setFormData] = useState<UniversityUpdate>({
    name: '',
    code: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const loadUniversity = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const data = await apiClient.getUniversity(universityId);
      setUniversity(data);
      setFormData({
        name: data.name,
        code: data.code,
        description: data.description || '',
      });
    } catch (error) {
      console.error('Failed to load university:', error);
      setErrors({ load: 'Erro ao carregar dados da universidade.' });
    } finally {
      setIsLoadingData(false);
    }
  }, [universityId]);

  useEffect(() => {
    loadUniversity();
  }, [loadUniversity]);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Universidades', href: '/universities' },
    { label: university?.name || 'Carregando...', href: `/universities/${universityId}` },
    { label: 'Editar', isCurrentPage: true }
  ];

  const handleChange = (field: keyof UniversityUpdate, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Nome da universidade é obrigatório';
    }

    if (!formData.code?.trim()) {
      newErrors.code = 'Código da universidade é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.updateUniversity(universityId, formData);
      router.push('/universities');
    } catch (error) {
      console.error('Failed to update university:', error);
      setErrors({ submit: 'Erro ao atualizar universidade. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <SuperAdminOnly>
        <div className="space-y-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </SuperAdminOnly>
    );
  }

  if (errors.load) {
    return (
      <SuperAdminOnly>
        <div className="space-y-6">
          <PageHeader
            title="Erro"
            description="Não foi possível carregar os dados da universidade"
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
      </SuperAdminOnly>
    );
  }

  return (
    <SuperAdminOnly>
      <div className="space-y-6">
        <PageHeader
          title="Editar Universidade"
          description={`Edite as informações da universidade ${university?.name}`}
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
            <CardTitle>Informações da Universidade</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  Nome da Universidade *
                </label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Ex: Universidade Federal de São Paulo"
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-destructive mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="code" className="block text-sm font-medium mb-1">
                  Código da Universidade *
                </label>
                <Input
                  id="code"
                  type="text"
                  value={formData.code || ''}
                  onChange={(e) => handleChange('code', e.target.value)}
                  placeholder="Ex: UNIFESP"
                  className={errors.code ? 'border-destructive' : ''}
                  required
                />
                {errors.code && (
                  <p className="text-sm text-destructive mt-1">{errors.code}</p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1">
                  Descrição
                </label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Descrição da universidade (opcional)"
                  rows={4}
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
      </div>
    </SuperAdminOnly>
  );
}