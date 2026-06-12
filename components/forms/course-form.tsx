'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Combobox } from '@/components/ui/combobox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { MultiSelect } from '@/components/ui/multi-select';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/components/auth/auth-provider';
import { apiClient, ApiError } from '@/lib/api';
import { toast } from 'sonner';
import type { Course, CourseCreate, CourseUpdate, Professor, University } from '@/lib/types';

/** Extract an integer course ID from a plain number string or a URL that contains it. */
export function parseExternalCourseId(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  // Plain integer?
  if (/^\d+$/.test(trimmed)) return trimmed;
  // Try common URL query params: courseId, course_id, id
  const urlMatch = trimmed.match(/[?&](?:courseId|course_id|id)=(\d+)/i);
  if (urlMatch) return urlMatch[1];
  // Last numeric segment in path (e.g., /course/view.php?id=1234)
  const lastNumber = trimmed.match(/(\d+)(?:\D*)$/);
  if (lastNumber) return lastNumber[1];
  return trimmed;
}

interface CourseFormProps {
  course?: Course;
  onSubmit: (data: CourseCreate | CourseUpdate) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  initialUniversityId?: number;
  onProfessorsChange?: (ids: number[]) => void;
  universityHasAssignments?: boolean;
}

export function CourseForm({ course, onSubmit, onCancel, isLoading = false, initialUniversityId, onProfessorsChange, universityHasAssignments = false }: CourseFormProps) {
  const { user } = useAuth();
  const t = useTranslations('courses.form');
  const [formData, setFormData] = useState({
    name: course?.name || '',
    code: course?.code || '',
    description: course?.description || '',
    universityId: course?.universityId || initialUniversityId || user?.universityId || '',
    externalCourseId: course?.externalCourseId?.toString() ?? '',
  });
  const [titleTracks, setTitleTracks] = useState<string[]>(
    course?.titleTracks ? course.titleTracks.split(',').map(s => s.trim()).filter(Boolean) : []
  );
  const [enableEnem, setEnableEnem] = useState<boolean>(course?.enableEnem ?? false);
  const [enemArea, setEnemArea] = useState<string>(course?.enemArea ?? '');
  const [universities, setUniversities] = useState<University[]>([]);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [selectedProfessorIds, setSelectedProfessorIds] = useState<string[]>([]);
  const [loadingProfessors, setLoadingProfessors] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingUniversities, setLoadingUniversities] = useState(false);

  const isCreateMode = !course;

  // Derive effective hasAssignments: prop OR selected university's flag (for super_admin with loaded list)
  const effectiveHasAssignments = universityHasAssignments ||
    (universities.find(u => u.id === Number(formData.universityId))?.hasAssignments ?? false);

  // Load universities for super admin
  useEffect(() => {
    const loadUniversities = async () => {
      if (user?.role !== 'super_admin') return;

      setLoadingUniversities(true);
      try {
        if (initialUniversityId) {
          const university = await apiClient.getUniversity(initialUniversityId);
          setUniversities([university]);
        } else {
          const response = await apiClient.getUniversities({ size: 1000 });
          setUniversities(response.items);
        }
      } catch (error) {
        console.error('Failed to load universities:', error);
      } finally {
        setLoadingUniversities(false);
      }
    };

    loadUniversities();
  }, [user?.role, initialUniversityId]);

  // Load professors when university changes (create mode only)
  useEffect(() => {
    if (!isCreateMode || !formData.universityId) {
      setProfessors([]);
      setSelectedProfessorIds([]);
      return;
    }

    const load = async () => {
      setLoadingProfessors(true);
      try {
        const response = await apiClient.getProfessors({ universityId: Number(formData.universityId), size: 200 });
        setProfessors(response.items);
      } catch {
        // Non-critical: professor selection is optional
      } finally {
        setLoadingProfessors(false);
      }
    };

    load();
  }, [formData.universityId, isCreateMode]);

  const handleProfessorsChange = (ids: string[]) => {
    setSelectedProfessorIds(ids);
    onProfessorsChange?.(ids.map(Number));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = t('nameRequired');
    if (!formData.code.trim()) newErrors.code = t('codeRequired');
    if (!formData.universityId) newErrors.universityId = t('universityRequired');
    if (enableEnem && !enemArea) newErrors.enemArea = t('enemAreaRequired');

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error(t('validationError'), { description: t('validationErrorDesc') });
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
        externalCourseId: formData.externalCourseId ? parseInt(formData.externalCourseId, 10) : null,
        titleTracks: titleTracks.length > 0 ? titleTracks.join(',') : '',
        enableEnem,
        enemArea: enableEnem ? (enemArea || null) : null,
      });
    } catch (error) {
      console.error('Form submission error:', error);
      if (error instanceof ApiError && error.isPlanLimitError) {
        toast.error(error.message, {
          action: { label: t('upgradePlan'), onClick: () => window.location.href = '/subscription' },
        });
        setErrors({ submit: error.message });
      } else {
        setErrors({ submit: error instanceof Error ? error.message : t('saveError') });
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleExternalCourseIdChange = (raw: string) => {
    const parsed = parseExternalCourseId(raw);
    setFormData(prev => ({ ...prev, externalCourseId: parsed }));
    if (errors.externalCourseId) setErrors(prev => ({ ...prev, externalCourseId: '' }));
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>{course ? t('edit') : t('create')}</CardTitle>
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
                <Combobox
                  options={universities.map((university) => ({
                    value: String(university.id),
                    label: university.name,
                  }))}
                  value={String(formData.universityId)}
                  onValueChange={(value) => handleInputChange('universityId', value)}
                  placeholder={loadingUniversities ? t('loadingUniversities') : t('universityPlaceholder')}
                  disabled={isLoading || loadingUniversities}
                />
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

          {/* Platform Course ID — only shown when university has HasAssignments=true */}
          {effectiveHasAssignments && (
            <FormField>
              <FormItem>
                <FormLabel htmlFor="externalCourseId">
                  {t('externalCourseIdLabel')}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">({t('optional')})</span>
                </FormLabel>
                <Input
                  id="externalCourseId"
                  type="text"
                  placeholder={t('externalCourseIdPlaceholder')}
                  value={formData.externalCourseId}
                  onChange={(e) => handleExternalCourseIdChange(e.target.value)}
                  disabled={isLoading}
                  className={errors.externalCourseId ? 'border-destructive' : ''}
                />
                <p className="text-xs text-muted-foreground">{t('externalCourseIdHelp')}</p>
                {errors.externalCourseId && <FormMessage>{errors.externalCourseId}</FormMessage>}
              </FormItem>
            </FormField>
          )}

          {/* Discipline tracks this course counts toward for student titles */}
          <FormField>
            <FormItem>
              <FormLabel htmlFor="titleTracks">
                {t('titleTracksLabel')}
                <span className="ml-1 text-xs font-normal text-muted-foreground">({t('optional')})</span>
              </FormLabel>
              <MultiSelect
                options={[
                  { value: 'math', label: t('tracks.math') },
                  { value: 'programming', label: t('tracks.programming') },
                  { value: 'science', label: t('tracks.science') },
                  { value: 'health', label: t('tracks.health') },
                  { value: 'business', label: t('tracks.business') },
                  { value: 'language', label: t('tracks.language') },
                  { value: 'humanities', label: t('tracks.humanities') },
                ]}
                selected={titleTracks}
                onChange={setTitleTracks}
                placeholder={t('titleTracksPlaceholder')}
              />
              <p className="text-xs text-muted-foreground">{t('titleTracksHelp')}</p>
            </FormItem>
          </FormField>

          {/* ENEM/Vestibular toggle — off by default; only pre-vestibular courses enable it */}
          <FormField>
            <FormItem>
              <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel htmlFor="enableEnem">{t('enableEnemLabel')}</FormLabel>
                  <p className="text-xs text-muted-foreground">{t('enableEnemHelp')}</p>
                </div>
                <Switch
                  id="enableEnem"
                  checked={enableEnem}
                  onCheckedChange={setEnableEnem}
                  disabled={isLoading}
                />
              </div>
              {enableEnem && (
                <div className="mt-3">
                  <FormLabel htmlFor="enemArea">{t('enemAreaLabel')}</FormLabel>
                  <Combobox
                    options={[
                      { value: 'matematica', label: t('enemAreas.matematica') },
                      { value: 'linguagens', label: t('enemAreas.linguagens') },
                      { value: 'natureza', label: t('enemAreas.natureza') },
                      { value: 'humanas', label: t('enemAreas.humanas') },
                    ]}
                    value={enemArea}
                    onValueChange={setEnemArea}
                    placeholder={t('enemAreaPlaceholder')}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">{t('enemAreaHelp')}</p>
                  {errors.enemArea && <FormMessage>{errors.enemArea}</FormMessage>}
                </div>
              )}
            </FormItem>
          </FormField>

          {/* Optional Professor Selection — create mode only, shown when university is set */}
          {isCreateMode && formData.universityId && (
            <FormField>
              <FormItem>
                <FormLabel htmlFor="professors">
                  {t('professorsOptionalLabel')}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">({t('optional')})</span>
                </FormLabel>
                {loadingProfessors ? (
                  <p className="text-sm text-muted-foreground">{t('loadingProfessors')}</p>
                ) : professors.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('noProfessorsAvailable')}</p>
                ) : (
                  <MultiSelect
                    options={professors.map(p => ({
                      value: String(p.id),
                      label: `${p.firstName} ${p.lastName}`.trim() || p.email,
                    }))}
                    selected={selectedProfessorIds}
                    onChange={handleProfessorsChange}
                    placeholder={t('selectProfessors')}
                    searchPlaceholder={t('searchProfessors')}
                    emptyMessage={t('noProfessorsFound')}
                  />
                )}
                <p className="text-xs text-muted-foreground">{t('professorsHint')}</p>
              </FormItem>
            </FormField>
          )}

          {/* Submit Error */}
          {errors.submit && <FormMessage>{errors.submit}</FormMessage>}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (course ? t('updating') : t('creating')) : (course ? t('update') : t('create'))}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
