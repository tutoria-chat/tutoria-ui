'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectItem } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth/auth-provider';
import { apiClient } from '@/lib/api';
import { Bot, FileText, Lightbulb } from 'lucide-react';
import type { Module, ModuleCreate, ModuleUpdate, Course } from '@/lib/types';

interface ModuleFormProps {
  module?: Module;
  courseId?: number;
  onSubmit: (data: ModuleCreate | ModuleUpdate) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ModuleForm({ module, courseId, onSubmit, onCancel, isLoading = false }: ModuleFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: module?.name || '',
    description: module?.description || '',
    code: module?.code || '',
    year: module?.year || '',
    semester: module?.semester || '',
    course_id: module?.course_id || courseId || '',
    system_prompt: module?.system_prompt || '',
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Predefined system prompt templates
  const promptTemplates = [
    {
      name: "Tutor Geral",
      description: "Um tutor útil e conhecedor para aprendizado geral",
      prompt: `Você é um tutor especialista ajudando estudantes a aprender sobre o conteúdo deste módulo. Seu papel é:

1. Fornecer explicações claras e precisas de conceitos
2. Fazer perguntas orientadoras para ajudar os estudantes a pensar sobre os problemas
3. Oferecer exemplos e analogias para tornar tópicos complexos compreensíveis
4. Encorajar pensamento crítico e compreensão mais profunda
5. Ser paciente e solidário em suas respostas

Sempre mantenha um tom útil e encorajador e adapte suas explicações ao nível de compreensão do estudante.`
    },
    {
      name: "Tutor de Programação",
      description: "Tutor especializado em programação e conceitos de ciência da computação",
      prompt: `Você é um tutor de programação especializado em educação em ciência da computação. Suas responsabilidades incluem:

1. Explicar conceitos de programação claramente com exemplos de código
2. Ajudar a depurar e solucionar problemas de código
3. Ensinar melhores práticas e padrões de codificação
4. Fornecer abordagens passo a passo para resolução de problemas
5. Encorajar bons hábitos de desenvolvimento de software

Ao ajudar com código:
- Mostrar exemplos e explicar a lógica
- Apontar erros comuns e como evitá-los
- Sugerir melhorias e otimizações
- Encorajar testes e documentação

Seja paciente e divida conceitos complexos de programação em partes gerenciáveis.`
    },
    {
      name: "Tutor de Matemática e Ciências",
      description: "Tutor focado em matemática e conceitos científicos",
      prompt: `Você é um tutor de matemática e ciências dedicado a ajudar estudantes a entender conceitos quantitativos. Sua abordagem deve:

1. Dividir problemas matemáticos complexos em etapas claras
2. Explicar os princípios e teoria subjacentes
3. Usar aplicações do mundo real para ilustrar conceitos abstratos
4. Ajudar estudantes a desenvolver estratégias de resolução de problemas
5. Encorajar raciocínio matemático e pensamento científico

Ao trabalhar com problemas:
- Mostrar cada etapa claramente
- Explicar por que cada etapa é necessária
- Conectar conceitos a princípios matemáticos ou científicos mais amplos
- Ajudar estudantes a verificar seu trabalho e entender erros

Fomentar curiosidade e pensamento lógico em disciplinas STEM.`
    },
    {
      name: "Assistente de Pesquisa",
      description: "Suporte para pesquisa acadêmica e escrita",
      prompt: `Você é um assistente de pesquisa acadêmica ajudando estudantes com habilidades de pesquisa e escrita acadêmica. Seu papel inclui:

1. Orientar estudantes através do processo de pesquisa
2. Ajudar a avaliar credibilidade e relevância de fontes
3. Auxiliar com estrutura e estilo de escrita acadêmica
4. Ensinar citação e referenciamento adequados
5. Encorajar análise crítica de informações

Foque em:
- Ensinar metodologias de pesquisa
- Ajudar a organizar e sintetizar informações
- Melhorar habilidades de escrita acadêmica
- Promover integridade acadêmica
- Desenvolver pensamento crítico sobre fontes

Apoie estudantes para se tornarem pesquisadores independentes e escritores acadêmicos claros.`
    }
  ];

  // Load courses for the user
  useEffect(() => {
    if (!courseId) {
      loadCourses();
    }
  }, [courseId]);

  const loadCourses = async () => {
    setLoadingCourses(true);
    try {
      // Em produção, isso filtraria baseado nas permissões do usuário
      const response = await apiClient.getCourses({ limit: 1000 });
      setCourses(response.items);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar formulário
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Nome do módulo é obrigatório';
    }
    if (!formData.course_id) {
      newErrors.course_id = 'Curso é obrigatório';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      await onSubmit({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        code: formData.code.trim() || undefined,
        year: formData.year ? Number(formData.year) : undefined,
        semester: formData.semester ? Number(formData.semester) : undefined,
        course_id: Number(formData.course_id),
        system_prompt: formData.system_prompt.trim() || undefined,
      });
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors({ submit: 'Falha ao salvar módulo. Tente novamente.' });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro quando usuário começa a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const applyPromptTemplate = (template: typeof promptTemplates[0]) => {
    setFormData(prev => ({ ...prev, system_prompt: template.prompt }));
    setErrors(prev => ({ ...prev, system_prompt: '' }));
  };

  const selectedCourse = courses.find(c => c.id === Number(formData.course_id));

  return (
    <div className="w-full max-w-4xl space-y-6">
      {/* Main Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>{module ? 'Editar Módulo' : 'Criar Novo Módulo'}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Module Name */}
            <FormField>
              <FormItem>
                <FormLabel htmlFor="name">Nome do Módulo *</FormLabel>
                <Input
                  id="name"
                  type="text"
                  placeholder="ex: Introdução a Estruturas de Dados"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={isLoading}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && <FormMessage>{errors.name}</FormMessage>}
              </FormItem>
            </FormField>

            {/* Module Code */}
            <FormField>
              <FormItem>
                <FormLabel htmlFor="code">Código do Módulo</FormLabel>
                <Input
                  id="code"
                  type="text"
                  placeholder="ex: CS101, MAT201, FIS301"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                  disabled={isLoading}
                  className={errors.code ? 'border-destructive' : ''}
                />
                {errors.code && <FormMessage>{errors.code}</FormMessage>}
              </FormItem>
            </FormField>

            {/* Year and Semester */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField>
                <FormItem>
                  <FormLabel htmlFor="year">Ano</FormLabel>
                  <Input
                    id="year"
                    type="number"
                    placeholder="ex: 2024"
                    value={formData.year}
                    onChange={(e) => handleInputChange('year', e.target.value)}
                    disabled={isLoading}
                    className={errors.year ? 'border-destructive' : ''}
                    min="2020"
                    max="2030"
                  />
                  {errors.year && <FormMessage>{errors.year}</FormMessage>}
                </FormItem>
              </FormField>

              <FormField>
                <FormItem>
                  <FormLabel htmlFor="semester">Semestre</FormLabel>
                  <Input
                    id="semester"
                    type="number"
                    placeholder="ex: 1, 2..."
                    value={formData.semester}
                    onChange={(e) => handleInputChange('semester', e.target.value)}
                    disabled={isLoading}
                    className={errors.semester ? 'border-destructive' : ''}
                    min="1"
                  />
                  {errors.semester && <FormMessage>{errors.semester}</FormMessage>}
                </FormItem>
              </FormField>
            </div>

            {/* Course Selection */}
            <FormField>
              <FormItem>
                <FormLabel htmlFor="course_id">Curso *</FormLabel>
                {courseId ? (
                  <div className="flex items-center space-x-2">
                    <Input
                      value={selectedCourse ? `${selectedCourse.name} (${selectedCourse.university_name})` : `Course ID: ${courseId}`}
                      disabled
                      className="bg-muted"
                    />
                    <Badge variant="secondary">Pré-selecionado</Badge>
                  </div>
                ) : (
                  <Select
                    value={String(formData.course_id)}
                    onValueChange={(value) => handleInputChange('course_id', value)}
                    disabled={isLoading || loadingCourses}
                    placeholder={loadingCourses ? "Carregando cursos..." : "Selecione um curso"}
                  >
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={String(course.id)}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </Select>
                )}
                {errors.course_id && <FormMessage>{errors.course_id}</FormMessage>}
              </FormItem>
            </FormField>

            {/* Description */}
            <FormField>
              <FormItem>
                <FormLabel htmlFor="description">Descrição</FormLabel>
                <Textarea
                  id="description"
                  placeholder="Descreva os objetivos de aprendizagem do módulo, visão geral do conteúdo e conceitos-chave..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  disabled={isLoading}
                  rows={3}
                />
                {errors.description && <FormMessage>{errors.description}</FormMessage>}
              </FormItem>
            </FormField>

            <Separator className="my-6" />

            {/* AI System Prompt Configuration */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Bot className="h-5 w-5 text-blue-500" />
                  <h3 className="text-lg font-semibold">Configuração do Tutor IA</h3>
                </div>
                <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>O que é isso?</strong> Pense nisso como as "instruções de personalidade" para o tutor IA.
                    Por exemplo: "Você é um professor paciente de programação que usa exemplos do dia a dia" ou
                    "Você é um tutor de matemática que sempre resolve passo a passo".
                    Isso define como o tutor vai responder às perguntas dos alunos neste módulo específico.
                  </p>
                </div>
              </div>

              {/* Prompt Templates */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  <h4 className="font-medium text-sm">Modelos Rápidos</h4>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {promptTemplates.map((template, index) => (
                    <Card key={index} className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium text-sm">{template.name}</h5>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => applyPromptTemplate(template)}
                              disabled={isLoading}
                            >
                              Usar Modelo
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {template.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Custom System Prompt */}
              <FormField>
                <FormItem>
                  <FormLabel htmlFor="system_prompt">Prompt Personalizado do Sistema</FormLabel>
                  <Textarea
                    id="system_prompt"
                    placeholder="Defina como o tutor IA deve se comportar, seu nível de expertise, estilo de ensino e diretrizes de interação..."
                    value={formData.system_prompt}
                    onChange={(e) => handleInputChange('system_prompt', e.target.value)}
                    disabled={isLoading}
                    rows={8}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.system_prompt.length} caracteres
                    {formData.system_prompt.length > 0 && (
                      <span className="ml-2 text-green-600">✓ Configurado</span>
                    )}
                  </p>
                  {errors.system_prompt && <FormMessage>{errors.system_prompt}</FormMessage>}
                </FormItem>
              </FormField>

              {/* Prompt Guidelines */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-sm text-blue-900 mb-2">💡 Dicas para Escrever Prompts</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Defina o papel e expertise da IA claramente</li>
                  <li>• Especifique o estilo de ensino e abordagem</li>
                  <li>• Inclua diretrizes para diferentes tipos de perguntas</li>
                  <li>• Defina expectativas para formato e tom de resposta</li>
                  <li>• Considere o público-alvo e seu nível</li>
                </ul>
              </div>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <FormMessage>{errors.submit}</FormMessage>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (module ? 'Atualizando...' : 'Criando...') : (module ? 'Atualizar Módulo' : 'Criar Módulo')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

    </div>
  );
}