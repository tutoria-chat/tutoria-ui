'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/components/auth/auth-provider';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import type { Course, CourseCreate, CourseUpdate, University } from '@/lib/types';

interface CourseFormProps {
  course?: Course;
  onSubmit: (data: CourseCreate | CourseUpdate) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CourseForm({ course, onSubmit, onCancel, isLoading = false }: CourseFormProps) {
  const { user } = useAuth();
  const t = useTranslations('courses.form');
  const [formData, setFormData] = useState({
    name: course?.name || '',
    code: course?.code || '',
    description: course?.description || '',
    universityId: course?.universityId || user?.universityId || '',
  });
  const [universities, setUniversities] = useState<University[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingUniversities, setLoadingUniversities] = useState(false);

  // Load universities for super admin
  useEffect(() => {
    if (user?.role === 'super_admin') {
      loadUniversities();
    }
  }, [user]);

  const loadUniversities = async () => {
    setLoadingUniversities(true);
    try {
      const response = await apiClient.getUniversities({ limit: 1000 });
      setUniversities(response.items);
    } catch (error) {
      console.error('Failed to load universities:', error);
    } finally {
      setLoadingUniversities(false);
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
    if (!formData.universityId) {
      newErrors.universityId = t('universityRequired');
    }
    
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      // Show toast notification for validation errors
      toast.error(t('validationError'), {
        description: t('validationErrorDesc'),
      });

      // Scroll to first error field
      const firstErrorField = Object.keys(newErrors)[0];
      const errorElement = document.getElementById(firstErrorField);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        errorElement.focus();
      }

      return;
    }

    try {
      await onSubmit({
        name: formData.name.trim(),
        code: formData.code.trim(),
        description: formData.description.trim() || undefined,
        universityId: Number(formData.universityId),
      });
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors({ submit: t('saveError') });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>
          {course ? t('edit') : t('create')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Course Name */}
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
                required
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <FormMessage>{errors.name}</FormMessage>}
            </FormItem>
          </FormField>

          {/* Course Code */}
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
                required
                className={errors.code ? 'border-destructive' : ''}
              />
              {errors.code && <FormMessage>{errors.code}</FormMessage>}
            </FormItem>
          </FormField>

          {/* University Selection */}
          <FormField>
            <FormItem>
              <FormLabel htmlFor="universityId">{t('universityLabel')}</FormLabel>
              {user?.role === 'super_admin' ? (
                <Select
                  value={String(formData.universityId)}
                  onValueChange={(value) => handleInputChange('universityId', value)}
                  disabled={isLoading || loadingUniversities}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingUniversities ? t('loadingUniversities') : t('universityPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {universities.map((university) => (
                      <SelectItem key={university.id} value={String(university.id)}>
                        {university.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={user?.universityId ? t('universityIdLabel', { id: user.universityId }) : t('noUniversity')}
                  disabled
                  className="bg-muted"
                />
              )}
              {errors.universityId && <FormMessage>{errors.universityId}</FormMessage>}
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
                rows={4}
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
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (course ? t('updating') : t('creating')) : (course ? t('update') : t('create'))}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}