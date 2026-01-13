'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Stepper, type Step } from '@/components/ui/stepper';
import { useAuth } from '@/components/auth/auth-provider';
import { apiClient } from '@/lib/api';
import { Bot, FileText, Lightbulb, Sparkles, Loader2, Cpu, ChevronLeft, ChevronRight, Languages } from 'lucide-react';
import { toast } from 'sonner';
import type { Module, ModuleCreate, ModuleUpdate, Course, AIModel } from '@/lib/types';
import { CourseTypeSelector, type CourseType } from '@/components/modules/course-type-selector';

interface ModuleFormSteppedProps {
  module?: Module;
  courseId?: number;
  onSubmit: (data: ModuleCreate | ModuleUpdate) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ModuleFormStepped({ module, courseId, onSubmit, onCancel, isLoading = false }: ModuleFormSteppedProps) {
  const { user } = useAuth();
  const t = useTranslations('modules.form');
  const tAI = useTranslations('aiModels');
  const tCommon = useTranslations('common');
  const tCourseTypes = useTranslations('courseTypes');

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: module?.name || '',
    description: module?.description || '',
    code: module?.code || '',
    year: module?.year || '',
    semester: module?.semester || '',
    courseId: module?.courseId || courseId || '',
    systemPrompt: module?.systemPrompt || '',
    tutorLanguage: module?.tutorLanguage || 'pt-br',
    courseType: module?.courseType as CourseType | undefined,
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [isImprovingPrompt, setIsImprovingPrompt] = useState(false);
  const [remainingImprovements, setRemainingImprovements] = useState<number | null>(null);
  // Course type selection - backend handles AI model selection based on this
  // Initialize with existing module's courseType if editing
  const [selectedCourseType, setSelectedCourseType] = useState<CourseType | undefined>(module?.courseType as CourseType | undefined);
  const [showCourseTypeSelector, setShowCourseTypeSelector] = useState(false);

  // Define steps
  const steps: Step[] = [
    { id: 'basic', title: t('steps.basic') || 'Basic Info', description: t('steps.basicDesc') || 'Module details' },
    { id: 'ai-model', title: t('steps.aiModel') || 'AI Model', description: t('steps.aiModelDesc') || 'Select model' },
    { id: 'prompt', title: t('steps.prompt') || 'System Prompt', description: t('steps.promptDesc') || 'Configure AI' },
    { id: 'settings', title: t('steps.settings') || 'Settings', description: t('steps.settingsDesc') || 'Language & more' },
  ];

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
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setLoadingCourses(true);
    try {
      const params: Record<string, string | number> = { limit: 1000 };
      if (user?.universityId && user.role !== 'super_admin') {
        params.universityId = user.universityId;
      }
      const response = await apiClient.getCourses(params);
      setCourses(response.items);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const applyPromptTemplate = (template: typeof promptTemplates[0]) => {
    setFormData(prev => ({ ...prev, systemPrompt: template.prompt }));
    setErrors(prev => ({ ...prev, systemPrompt: '' }));
  };

  const handleImprovePrompt = async () => {
    if (!formData.systemPrompt.trim()) {
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
      const response = await apiClient.improveSystemPrompt(module.id, formData.systemPrompt);
      setFormData(prev => ({ ...prev, systemPrompt: response.improved_prompt }));
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

  // Validate current step
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      // Basic Information
      if (!formData.name.trim()) {
        newErrors.name = t('nameRequired');
      } else if (formData.name.length > 255) {
        newErrors.name = t('nameTooLong');
      }
      if (!formData.code.trim()) {
        newErrors.code = t('codeRequired');
      } else if (formData.code.length > 50) {
        newErrors.code = t('codeTooLong');
      }
      if (formData.description.length > 500) {
        newErrors.description = t('descriptionTooLong');
      }
      if (!formData.courseId) newErrors.courseId = t('courseRequired');
      if (!formData.year) newErrors.year = t('yearRequired');
      if (!formData.semester) {
        newErrors.semester = t('semesterRequired');
      } else if (Number(formData.semester) < 1 || Number(formData.semester) > 2) {
        newErrors.semester = t('semesterInvalid');
      }
    } else if (step === 1) {
      // Course Type Selection (backend will auto-select AI model)
      if (!formData.courseType) newErrors.courseType = tCourseTypes('typeRequired') || 'Course type is required';
    }
    // Steps 2 and 3 (Prompt and Settings) are optional

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error(t('validationError'), {
        description: t('validationErrorDesc'),
      });
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleStepClick = (step: number) => {
    // Allow navigation to previous steps only
    if (step <= currentStep) {
      setCurrentStep(step);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    // Validate all steps before submitting
    for (let i = 0; i < steps.length; i++) {
      if (!validateStep(i)) {
        setCurrentStep(i);
        return;
      }
    }

    try {
      await onSubmit({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        code: formData.code.trim() || undefined,
        year: formData.year ? Number(formData.year) : undefined,
        semester: formData.semester ? Number(formData.semester) : undefined,
        courseId: Number(formData.courseId),
        systemPrompt: formData.systemPrompt.trim() || undefined,
        tutorLanguage: formData.tutorLanguage,
        courseType: formData.courseType,
      });
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors({ submit: t('saveError') });
    }
  };

  const selectedCourse = courses.find(c => c.id === Number(formData.courseId));
  const universityId = module?.universityId || selectedCourse?.universityId;

  return (
    <div className="w-full max-w-4xl space-y-6">
      {/* Stepper */}
      <Card>
        <CardContent className="pt-6">
          <Stepper
            steps={steps}
            currentStep={currentStep}
            onStepClick={handleStepClick}
            allowStepNavigation={true}
          />
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {currentStep === 0 && <FileText className="h-5 w-5" />}
            {currentStep === 1 && <Cpu className="h-5 w-5" />}
            {currentStep === 2 && <Bot className="h-5 w-5" />}
            {currentStep === 3 && <Languages className="h-5 w-5" />}
            <span>{steps[currentStep].title}</span>
          </CardTitle>
          {steps[currentStep].description && (
            <CardDescription>{steps[currentStep].description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            {/* Step 1: Basic Information */}
            {currentStep === 0 && (
              <div className="space-y-4">
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
                      maxLength={255}
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
                      maxLength={50}
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
                        required
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
                        max="2"
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('semesterHint')}
                      </p>
                      {errors.semester && <FormMessage>{errors.semester}</FormMessage>}
                    </FormItem>
                  </FormField>
                </div>

                {/* Course Selection */}
                <FormField>
                  <FormItem>
                    <FormLabel htmlFor="courseId">{t('courseLabel')}</FormLabel>
                    {courseId || module ? (
                      <div className="flex items-center space-x-2">
                        <Input
                          value={loadingCourses
                            ? t('loadingCourses')
                            : selectedCourse
                              ? `${selectedCourse.name} (${selectedCourse.universityName})`
                              : module
                                ? module.courseName || `${t('courseLabel')} ID: ${module.courseId}`
                                : `${t('courseLabel')} ID: ${courseId}`
                          }
                          disabled
                          className="bg-muted"
                        />
                        <Badge variant="secondary">{module ? t('courseCannotChange') : t('coursePreselected')}</Badge>
                      </div>
                    ) : (
                      <select
                        id="courseId"
                        value={String(formData.courseId)}
                        onChange={(e) => handleInputChange('courseId', e.target.value)}
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
                    {errors.courseId && <FormMessage>{errors.courseId}</FormMessage>}
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
                      className={errors.description ? 'border-destructive' : ''}
                      maxLength={500}
                      rows={3}
                    />
                    <p className={`text-xs mt-1 ${formData.description.length > 500 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {t('descriptionCharCount', { count: formData.description.length })}
                    </p>
                    {errors.description && <FormMessage>{errors.description}</FormMessage>}
                  </FormItem>
                </FormField>
              </div>
            )}

            {/* Step 2: AI Model Selection */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <FormField>
                  <FormItem>
                    <div className="flex items-center justify-between mb-2">
                      <FormLabel>
                        <div className="flex items-center gap-2">
                          <Cpu className="h-4 w-4" />
                          {t('courseTypeLabel') || 'Course Type'}
                        </div>
                      </FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCourseTypeSelector(true)}
                      >
                        {selectedCourseType ? (t('changeCourseType') || 'Change Type') : (t('selectCourseType') || 'Select Type')}
                      </Button>
                    </div>
                    <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
                      <p className="text-sm text-blue-900 dark:text-blue-100">
                        {t('courseTypeHint') || 'Select your course type and we\'ll automatically choose the best AI model for optimal performance and cost.'}
                      </p>
                    </div>
                    {selectedCourseType ? (
                      <div className="p-3 border rounded-md bg-muted/50">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          {selectedCourseType === 'MathLogic' && `🧮 ${tCourseTypes('mathLogic.name')}`}
                          {selectedCourseType === 'Programming' && `💻 ${tCourseTypes('programming.name')}`}
                          {selectedCourseType === 'TheoryText' && `📚 ${tCourseTypes('theoryText.name')}`}
                        </div>
                      </div>
                    ) : (
                      <p className={`text-sm ${errors.courseType ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {t('noCourseTypeSelected') || 'No course type selected'}
                      </p>
                    )}
                    {errors.courseType && <FormMessage>{errors.courseType}</FormMessage>}
                  </FormItem>
                </FormField>
              </div>
            )}

            {/* Step 3: System Prompt */}
            {currentStep === 2 && (
              <div className="space-y-4">
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
                      <FormLabel htmlFor="systemPrompt">{t('systemPromptLabel')}</FormLabel>
                      {module && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleImprovePrompt}
                          disabled={isImprovingPrompt || isLoading || !formData.systemPrompt.trim()}
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
                    {!module && (
                      <div className="mb-3 p-3 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-md">
                        <p className="text-sm text-purple-900 dark:text-purple-100">
                          {t('promptImprovementHint')}
                        </p>
                      </div>
                    )}
                    <Textarea
                      id="systemPrompt"
                      placeholder={t('systemPromptPlaceholder')}
                      value={formData.systemPrompt}
                      onChange={(e) => handleInputChange('systemPrompt', e.target.value)}
                      disabled={isLoading}
                      rows={8}
                      className="font-mono text-sm"
                    />
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-muted-foreground">
                        {t('charactersCount', { count: formData.systemPrompt.length })}
                        {formData.systemPrompt.length > 0 && (
                          <span className="ml-2 text-green-600">{t('configured')}</span>
                        )}
                      </p>
                      {remainingImprovements !== null && (
                        <p className="text-xs text-muted-foreground">
                          {t('remainingImprovements', { count: remainingImprovements })}
                        </p>
                      )}
                    </div>
                    {errors.systemPrompt && <FormMessage>{errors.systemPrompt}</FormMessage>}
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
            )}

            {/* Step 4: Language & Settings */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <FormField>
                  <FormItem>
                    <FormLabel htmlFor="tutorLanguage">🌐 {t('tutorLanguageLabel')}</FormLabel>
                    <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
                      <p className="text-sm text-amber-900 dark:text-amber-100">
                        {t('tutorLanguageHint')}
                      </p>
                    </div>
                    <select
                      id="tutorLanguage"
                      value={formData.tutorLanguage}
                      onChange={(e) => handleInputChange('tutorLanguage', e.target.value)}
                      disabled={isLoading}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="pt-br">🇧🇷 Português (Brasil)</option>
                      <option value="en">🇺🇸 English (United States)</option>
                      <option value="es">🇪🇸 Español (Spanish)</option>
                    </select>
                    {errors.tutorLanguage && <FormMessage>{errors.tutorLanguage}</FormMessage>}
                  </FormItem>
                </FormField>
              </div>
            )}

            {/* Submit Error */}
            {errors.submit && (
              <FormMessage>{errors.submit}</FormMessage>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <div>
          {currentStep > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={isLoading}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              {tCommon('previous')}
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            {tCommon('cancel')}
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={isLoading}
            >
              {tCommon('next')}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (module ? t('updating') : t('creating')) : (module ? t('update') : t('create'))}
            </Button>
          )}
        </div>
      </div>

      {/* Course Type Selector Modal */}
      <CourseTypeSelector
        open={showCourseTypeSelector}
        onClose={() => setShowCourseTypeSelector(false)}
        selectedType={selectedCourseType}
        universityId={universityId}
        onSelectType={(type) => {
          setSelectedCourseType(type);
          setFormData(prev => ({ ...prev, courseType: type }));
          // Backend will auto-select AI model based on courseType and university tier
        }}
      />
    </div>
  );
}
