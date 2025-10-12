'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
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
import { Bot, FileText, Lightbulb, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
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
  const t = useTranslations('modules.form');
  const [formData, setFormData] = useState({
    name: module?.name || '',
    description: module?.description || '',
    code: module?.code || '',
    year: module?.year || '',
    semester: module?.semester || '',
    course_id: module?.course_id || courseId || '',
    system_prompt: module?.system_prompt || '',
    tutor_language: module?.tutor_language || 'pt-br',
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [isImprovingPrompt, setIsImprovingPrompt] = useState(false);
  const [remainingImprovements, setRemainingImprovements] = useState<number | null>(null);

  // Predefined system prompt templates
  const promptTemplates = [
    {
      name: t('templates.general.name'),
      description: t('templates.general.description'),
      prompt: t('templates.general.prompt')
    },
    {
      name: t('templates.programming.name'),
      description: t('templates.programming.description'),
      prompt: t('templates.programming.prompt')
    },
    {
      name: t('templates.mathScience.name'),
      description: t('templates.mathScience.description'),
      prompt: t('templates.mathScience.prompt')
    },
    {
      name: t('templates.research.name'),
      description: t('templates.research.description'),
      prompt: t('templates.research.prompt')
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
      // For super admins and admin professors: get all courses (filtered by university for profs)
      // For regular professors: API will return only their assigned courses
      const params: Record<string, string | number> = { limit: 1000 };
      if (user?.university_id && user.role !== 'super_admin') {
        params.university_id = user.university_id;
      }
      const response = await apiClient.getCourses(params);

      // The API already filters courses for non-admin professors to show only assigned courses
      // So we can use the response directly
      setCourses(response.items);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = t('nameRequired');
    }
    if (!formData.code.trim()) {
      newErrors.code = t('codeRequired');
    }
    if (!formData.course_id) {
      newErrors.course_id = t('courseRequired');
    }

    // For regular professors, the API already filters courses to show only assigned ones
    // So if they selected a course, it must be one they're assigned to
    // No additional validation needed here - the API will handle authorization

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
        tutor_language: formData.tutor_language,
      });
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors({ submit: t('saveError') });
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

  const handleImprovePrompt = async () => {
    if (!formData.system_prompt.trim()) {
      toast.error(t('improvePromptNoContent'), {
        description: t('improvePromptNoContentDesc'),
      });
      return;
    }

    if (!module?.id) {
      toast.error(t('improvePromptSaveFirst'), {
        description: t('improvePromptSaveFirstDesc'),
      });
      return;
    }

    setIsImprovingPrompt(true);
    try {
      const response = await apiClient.post<{ improved_prompt: string; remaining_improvements: number }>(
        `/modules/${module.id}/improve-prompt`,
        { current_prompt: formData.system_prompt }
      );

      setFormData(prev => ({ ...prev, system_prompt: response.improved_prompt }));
      setRemainingImprovements(response.remaining_improvements);

      toast.success(t('improveSuccess'), {
        description: t('improveSuccessDesc', { count: response.remaining_improvements }),
      });
    } catch (error: any) {
      console.error('Error improving prompt:', error);
      const errorMsg = error?.response?.data?.detail || error.message || t('improveError');
      toast.error(t('improveError'), {
        description: errorMsg,
      });
    } finally {
      setIsImprovingPrompt(false);
    }
  };

  const selectedCourse = courses.find(c => c.id === Number(formData.course_id));

  return (
    <div className="w-full max-w-4xl space-y-6">
      {/* Main Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>{module ? t('edit') : t('create')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Module Name */}
            <FormField>
              <FormItem>
                <FormLabel htmlFor="name">{t('nameLabel')}</FormLabel>
                <Input
                  id="name"
                  type="text"
                  placeholder={t('namePlaceholder')}
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={isLoading}
                  className={errors.name ? 'border-destructive' : ''}
                  required
                />
                {errors.name && <FormMessage>{errors.name}</FormMessage>}
              </FormItem>
            </FormField>

            {/* Module Code */}
            <FormField>
              <FormItem>
                <FormLabel htmlFor="code">{t('codeLabel')}</FormLabel>
                <Input
                  id="code"
                  type="text"
                  placeholder={t('codePlaceholder')}
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                  disabled={isLoading}
                  className={errors.code ? 'border-destructive' : ''}
                  required
                />
                {errors.code && <FormMessage>{errors.code}</FormMessage>}
              </FormItem>
            </FormField>

            {/* Year and Semester */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField>
                <FormItem>
                  <FormLabel htmlFor="year">{t('yearLabel')}</FormLabel>
                  <Input
                    id="year"
                    type="number"
                    placeholder={t('yearPlaceholder')}
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
                  <FormLabel htmlFor="semester">{t('semesterLabel')}</FormLabel>
                  <Input
                    id="semester"
                    type="number"
                    placeholder={t('semesterPlaceholder')}
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
                <FormLabel htmlFor="course_id">{t('courseLabel')}</FormLabel>
                {courseId ? (
                  <div className="flex items-center space-x-2">
                    <Input
                      value={selectedCourse ? `${selectedCourse.name} (${selectedCourse.university_name})` : `Disciplina ID: ${courseId}`}
                      disabled
                      className="bg-muted"
                    />
                    <Badge variant="secondary">{t('coursePreselected')}</Badge>
                  </div>
                ) : (
                  <select
                    id="course_id"
                    value={String(formData.course_id)}
                    onChange={(e) => handleInputChange('course_id', e.target.value)}
                    disabled={isLoading || loadingCourses}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="">{loadingCourses ? t('loadingCourses') : t('selectCourse')}</option>
                    {courses.map((course) => (
                      <option key={course.id} value={String(course.id)}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                )}
                {errors.course_id && <FormMessage>{errors.course_id}</FormMessage>}
              </FormItem>
            </FormField>

            {/* Description */}
            <FormField>
              <FormItem>
                <FormLabel htmlFor="description">{t('descriptionLabel')}</FormLabel>
                <Textarea
                  id="description"
                  placeholder={t('descriptionPlaceholder')}
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
                  <h3 className="text-lg font-semibold">{t('aiConfig')}</h3>
                </div>
              </div>

              {/* Prompt Templates */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  <h4 className="font-medium text-sm">{t('quickTemplates')}</h4>
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
                              {t('useTemplate')}
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
                  <div className="flex items-center justify-between mb-2">
                    <FormLabel htmlFor="system_prompt">{t('systemPromptLabel')}</FormLabel>
                    {module && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleImprovePrompt}
                        disabled={isImprovingPrompt || isLoading || !formData.system_prompt.trim()}
                      >
                        {isImprovingPrompt ? (
                          <>
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            {t('improving')}
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-3 w-3" />
                            {t('improveWithAI')}
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      {t('promptExplanation')}
                    </p>
                  </div>
                  <Textarea
                    id="system_prompt"
                    placeholder={t('systemPromptPlaceholder')}
                    value={formData.system_prompt}
                    onChange={(e) => handleInputChange('system_prompt', e.target.value)}
                    disabled={isLoading}
                    rows={8}
                    className="font-mono text-sm"
                  />
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-muted-foreground">
                      {t('charactersCount', { count: formData.system_prompt.length })}
                      {formData.system_prompt.length > 0 && (
                        <span className="ml-2 text-green-600">{t('configured')}</span>
                      )}
                    </p>
                    {remainingImprovements !== null && (
                      <p className="text-xs text-muted-foreground">
                        {t('remainingImprovements', { count: remainingImprovements })}
                      </p>
                    )}
                  </div>
                  {errors.system_prompt && <FormMessage>{errors.system_prompt}</FormMessage>}
                </FormItem>
              </FormField>

              {/* Tutor Language Selection */}
              <FormField>
                <FormItem>
                  <FormLabel htmlFor="tutor_language">🌐 {t('tutorLanguageLabel')}</FormLabel>
                  <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
                    <p className="text-sm text-amber-900 dark:text-amber-100">
                      {t('tutorLanguageHint')}
                    </p>
                  </div>
                  <select
                    id="tutor_language"
                    value={formData.tutor_language}
                    onChange={(e) => handleInputChange('tutor_language', e.target.value)}
                    disabled={isLoading}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="pt-br">🇧🇷 Português (Brasil)</option>
                    <option value="en">🇺🇸 English (United States)</option>
                    <option value="es">🇪🇸 Español (Spanish)</option>
                  </select>
                  {errors.tutor_language && <FormMessage>{errors.tutor_language}</FormMessage>}
                </FormItem>
              </FormField>

              {/* Prompt Guidelines */}
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-medium text-sm text-blue-900 dark:text-blue-100 mb-2">{t('promptTips')}</h4>
                <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  <li>{t('promptTip1')}</li>
                  <li>{t('promptTip2')}</li>
                  <li>{t('promptTip3')}</li>
                  <li>{t('promptTip4')}</li>
                  <li>{t('promptTip5')}</li>
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
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (module ? t('updating') : t('creating')) : (module ? t('update') : t('create'))}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

    </div>
  );
}