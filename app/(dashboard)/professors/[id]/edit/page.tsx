'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/layout/page-header';
import { AdminOnly } from '@/components/auth/role-guard';
import { apiClient } from '@/lib/api';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { Professor, ProfessorUpdate, BreadcrumbItem } from '@/lib/types';

export default function EditProfessorPage() {
  const router = useRouter();
  const params = useParams();
  const professorId = Number(params.id);

  const [professor, setProfessor] = useState<Professor | null>(null);
  const [formData, setFormData] = useState<ProfessorUpdate>({
    email: '',
    first_name: '',
    last_name: '',
    is_admin: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const loadProfessor = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const data = await apiClient.getProfessor(professorId);
      setProfessor(data);
      setFormData({
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        is_admin: data.is_admin,
      });
    } catch (error) {
      console.error('Falha ao carregar professor:', error);
      setErrors({ load: 'Erro ao carregar dados do professor.' });
    } finally {
      setIsLoadingData(false);
    }
  }, [professorId]);

  useEffect(() => {
    loadProfessor();
  }, [loadProfessor]);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Professores', href: '/professors' },
    { label: professor ? `${professor.first_name} ${professor.last_name}` : 'Carregando...', href: `/professors/${professorId}` },
    { label: 'Editar', isCurrentPage: true }
  ];

  const handleChange = (field: keyof ProfessorUpdate, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email?.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.first_name?.trim()) {
      newErrors.first_name = 'Nome é obrigatório';
    }

    if (!formData.last_name?.trim()) {
      newErrors.last_name = 'Sobrenome é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await apiClient.updateProfessor(professorId, formData);
      router.push('/professors');
    } catch (error) {
      console.error('Falha ao atualizar professor:', error);
      setErrors({ submit: 'Erro ao atualizar professor. Tente novamente.' });
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
        <Button onClick={() => router.push('/professors')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Professores
        </Button>
      </div>
    );
  }

  return (
    <AdminOnly>
      <div className="space-y-6">
        <PageHeader
          title="Editar Professor"
          description={`Atualize as informações de ${professor?.first_name} ${professor?.last_name}`}
          breadcrumbs={breadcrumbs}
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Informações do Professor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Nome</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleChange('first_name', e.target.value)}
                  placeholder="Nome do professor"
                  disabled={isLoading}
                />
                {errors.first_name && (
                  <p className="text-sm text-destructive">{errors.first_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Sobrenome</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleChange('last_name', e.target.value)}
                  placeholder="Sobrenome do professor"
                  disabled={isLoading}
                />
                {errors.last_name && (
                  <p className="text-sm text-destructive">{errors.last_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="email@universidade.edu.br"
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="is_admin">Professor Administrador</Label>
                  <p className="text-sm text-muted-foreground">
                    Administradores podem gerenciar cursos e atribuir professores
                  </p>
                </div>
                <Switch
                  id="is_admin"
                  checked={formData.is_admin}
                  onCheckedChange={(checked) => handleChange('is_admin', checked)}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          {errors.submit && (
            <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-md max-w-2xl">
              <p className="text-sm text-destructive">{errors.submit}</p>
            </div>
          )}

          <div className="flex items-center justify-end space-x-4 max-w-2xl">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/professors')}
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
    </AdminOnly>
  );
}
