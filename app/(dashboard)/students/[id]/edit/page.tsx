'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/layout/page-header';
import { ProfessorOnly } from '@/components/auth/role-guard';
import { apiClient } from '@/lib/api';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { Student, StudentUpdate, BreadcrumbItem } from '@/lib/types';

export default function EditStudentPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = Number(params.id);

  const [student, setStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState<StudentUpdate>({
    email: '',
    first_name: '',
    last_name: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const loadStudent = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const data = await apiClient.getStudent(studentId);
      setStudent(data);
      setFormData({
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
      });
    } catch (error) {
      console.error('Falha ao carregar estudante:', error);
      setErrors({ load: 'Erro ao carregar dados do estudante.' });
    } finally {
      setIsLoadingData(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadStudent();
  }, [loadStudent]);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Estudantes', href: '/students' },
    { label: student ? `${student.first_name} ${student.last_name}` : 'Carregando...', href: `/students/${studentId}` },
    { label: 'Editar', isCurrentPage: true }
  ];

  const handleChange = (field: keyof StudentUpdate, value: string) => {
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
      await apiClient.updateStudent(studentId, formData);
      router.push('/students');
    } catch (error) {
      console.error('Falha ao atualizar estudante:', error);
      setErrors({ submit: 'Erro ao atualizar estudante. Tente novamente.' });
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
        <Button onClick={() => router.push('/students')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Estudantes
        </Button>
      </div>
    );
  }

  return (
    <ProfessorOnly>
      <div className="space-y-6">
        <PageHeader
          title="Editar Estudante"
          description={`Atualize as informações de ${student?.first_name} ${student?.last_name}`}
          breadcrumbs={breadcrumbs}
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Informações do Estudante</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Nome</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleChange('first_name', e.target.value)}
                  placeholder="Nome do estudante"
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
                  placeholder="Sobrenome do estudante"
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
                  placeholder="email@exemplo.com"
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
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
              onClick={() => router.push('/students')}
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
