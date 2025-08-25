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
    course_id: module?.course_id || courseId || '',
    system_prompt: module?.system_prompt || '',
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Predefined system prompt templates
  const promptTemplates = [
    {
      name: "General Tutor",
      description: "A helpful and knowledgeable tutor for general learning",
      prompt: `You are an expert tutor helping students learn about this module's content. Your role is to:

1. Provide clear, accurate explanations of concepts
2. Ask guiding questions to help students think through problems
3. Offer examples and analogies to make complex topics understandable
4. Encourage critical thinking and deeper understanding
5. Be patient and supportive in your responses

Always maintain a helpful, encouraging tone and adapt your explanations to the student's level of understanding.`
    },
    {
      name: "Programming Tutor",
      description: "Specialized tutor for programming and computer science concepts",
      prompt: `You are a programming tutor specializing in computer science education. Your responsibilities include:

1. Explaining programming concepts clearly with code examples
2. Helping debug and troubleshoot code issues
3. Teaching best practices and coding standards
4. Providing step-by-step problem-solving approaches
5. Encouraging good software development habits

When helping with code:
- Show examples and explain the logic
- Point out common mistakes and how to avoid them
- Suggest improvements and optimizations
- Encourage testing and documentation

Be patient and break down complex programming concepts into manageable parts.`
    },
    {
      name: "Math & Science Tutor",
      description: "Tutor focused on mathematics and scientific concepts",
      prompt: `You are a mathematics and science tutor dedicated to helping students understand quantitative concepts. Your approach should:

1. Break down complex mathematical problems into clear steps
2. Explain the underlying principles and theory
3. Use real-world applications to illustrate abstract concepts
4. Help students develop problem-solving strategies
5. Encourage mathematical reasoning and scientific thinking

When working through problems:
- Show each step clearly
- Explain why each step is necessary
- Connect concepts to broader mathematical or scientific principles
- Help students check their work and understand mistakes

Foster curiosity and logical thinking in STEM subjects.`
    },
    {
      name: "Research Assistant",
      description: "Academic research and writing support",
      prompt: `You are an academic research assistant helping students with research skills and academic writing. Your role includes:

1. Guiding students through the research process
2. Helping evaluate source credibility and relevance
3. Assisting with academic writing structure and style
4. Teaching proper citation and referencing
5. Encouraging critical analysis of information

Focus on:
- Teaching research methodologies
- Helping organize and synthesize information
- Improving academic writing skills
- Promoting scholarly integrity
- Developing critical thinking about sources

Support students in becoming independent researchers and clear academic writers.`
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
      newErrors.name = 'Module name is required';
    }
    if (!formData.course_id) {
      newErrors.course_id = 'Course is required';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      await onSubmit({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        course_id: Number(formData.course_id),
        system_prompt: formData.system_prompt.trim() || undefined,
      });
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors({ submit: 'Failed to save module. Please try again.' });
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
            <span>{module ? 'Edit Module' : 'Create New Module'}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Module Name */}
            <FormField>
              <FormItem>
                <FormLabel htmlFor="name">Module Name *</FormLabel>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g., Introduction to Data Structures"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={isLoading}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && <FormMessage>{errors.name}</FormMessage>}
              </FormItem>
            </FormField>

            {/* Course Selection */}
            <FormField>
              <FormItem>
                <FormLabel htmlFor="course_id">Course *</FormLabel>
                {courseId ? (
                  <div className="flex items-center space-x-2">
                    <Input
                      value={selectedCourse ? `${selectedCourse.name} (${selectedCourse.university_name})` : `Course ID: ${courseId}`}
                      disabled
                      className="bg-muted"
                    />
                    <Badge variant="secondary">Pre-selected</Badge>
                  </div>
                ) : (
                  <Select
                    value={String(formData.course_id)}
                    onValueChange={(value) => handleInputChange('course_id', value)}
                    disabled={isLoading || loadingCourses}
                    placeholder={loadingCourses ? "Loading courses..." : "Select a course"}
                  >
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={String(course.id)}>
                        {course.name} ({course.university_name})
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
                <FormLabel htmlFor="description">Description</FormLabel>
                <Textarea
                  id="description"
                  placeholder="Describe the module's learning objectives, content overview, and key concepts..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  disabled={isLoading}
                  rows={3}
                />
                {errors.description && <FormMessage>{errors.description}</FormMessage>}
              </FormItem>
            </FormField>

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
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (module ? 'Updating...' : 'Creating...') : (module ? 'Update Module' : 'Create Module')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* AI System Prompt Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-blue-500" />
            <span>AI Tutor Configuration</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure how the AI tutor should behave when helping students with this module. 
            The system prompt defines the AI's personality, expertise, and teaching approach.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Prompt Templates */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <h4 className="font-medium text-sm">Quick Templates</h4>
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
                          Use Template
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

          <Separator />

          {/* Custom System Prompt */}
          <FormField>
            <FormItem>
              <FormLabel htmlFor="system_prompt">Custom System Prompt</FormLabel>
              <Textarea
                id="system_prompt"
                placeholder="Define how the AI tutor should behave, its expertise level, teaching style, and interaction guidelines..."
                value={formData.system_prompt}
                onChange={(e) => handleInputChange('system_prompt', e.target.value)}
                disabled={isLoading}
                rows={8}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.system_prompt.length} characters
                {formData.system_prompt.length > 0 && (
                  <span className="ml-2 text-green-600">✓ Configured</span>
                )}
              </p>
              {errors.system_prompt && <FormMessage>{errors.system_prompt}</FormMessage>}
            </FormItem>
          </FormField>

          {/* Prompt Guidelines */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-sm text-blue-900 mb-2">💡 Prompt Writing Tips</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Define the AI's role and expertise clearly</li>
              <li>• Specify the teaching style and approach</li>
              <li>• Include guidelines for different types of questions</li>
              <li>• Set expectations for response format and tone</li>
              <li>• Consider the target audience and their level</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}