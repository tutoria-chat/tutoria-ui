'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/layout/page-header';
import { AdminOnly, SuperAdminOnly } from '@/components/auth/role-guard';
import { apiClient } from '@/lib/api';
import { ArrowLeft, Loader2, Key, BookOpen, Mail, AlertCircle } from 'lucide-react';
import type { Professor, ProfessorUpdate, BreadcrumbItem, Course, User } from '@/lib/types';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/auth-provider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { validatePasswordStrength } from '@/lib/utils';
import { MultiSelect } from '@/components/ui/multi-select';

export default function EditProfessorPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const professorId = Number(params.id);
  const t = useTranslations('professors.edit');
  const tCommon = useTranslations('common');
  const tPwValidation = useTranslations('common.passwordValidation');

  // Get return URL from query params or default based on user role
  const returnUrl = searchParams.get('returnUrl') || (user?.role === 'super_admin' ? '/professors' : user?.universityId ? `/universities/${user.universityId}` : '/dashboard');

  const [professor, setProfessor] = useState<Professor | null>(null);
  const [formData, setFormData] = useState<ProfessorUpdate & { username?: string; universityId?: number }>({
    email: '',
    firstName: '',
    lastName: '',
    isAdmin: false,
    username: '',
    universityId: undefined,
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignedCourseIds, setAssignedCourseIds] = useState<number[]>([]);
  const [originalAssignedCourseIds, setOriginalAssignedCourseIds] = useState<number[]>([]);
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState(validatePasswordStrength(''));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);

  const isSuperAdmin = user?.role === 'super_admin';

  const loadProfessor = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const data = await apiClient.getProfessor(professorId);
      setProfessor(data);
      setFormData({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        isAdmin: data.isAdmin,
        username: data.username,
        universityId: data.universityId,
      });

      // Set assigned course IDs from professor data (extract from assignedCourses)
      if (data.assignedCourses && data.assignedCourses.length > 0) {
        const courseIds = data.assignedCourses.map(course => course.id);
        setAssignedCourseIds(courseIds);
        setOriginalAssignedCourseIds(courseIds);
      }

      // Load courses for this professor's university
      if (data.universityId) {
        loadCourses(data.universityId);
      }
    } catch (error) {
      console.error('Failed to load professor:', error);
      setErrors({ load: t('loadError') });
    } finally {
      setIsLoadingData(false);
    }
  }, [professorId]);

  const loadCourses = async (universityId: number) => {
    setIsLoadingCourses(true);
    try {
      const courses = await apiClient.getCoursesByUniversity(universityId);
      setCourses(courses);
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error(t('errorLoadingCourses'));
    } finally {
      setIsLoadingCourses(false);
    }
  };

  useEffect(() => {
    loadProfessor();
  }, [loadProfessor]);

  useEffect(() => {
    if (newPassword) {
      setPasswordValidation(validatePasswordStrength(newPassword));
    }
  }, [newPassword]);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: tCommon('breadcrumbs.professors'), href: '/professors' },
    { label: professor ? `${professor.firstName} ${professor.lastName}` : tCommon('loading'), href: `/professors/${professorId}` },
    { label: t('breadcrumb'), isCurrentPage: true }
  ];

  const handleChange = (field: keyof typeof formData, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const toggleCourse = (courseId: number) => {
    setAssignedCourseIds(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email?.trim()) {
      newErrors.email = t('emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('emailInvalid');
    }

    if (!formData.firstName?.trim()) {
      newErrors.firstName = t('firstNameRequired');
    }

    if (!formData.lastName?.trim()) {
      newErrors.lastName = t('lastNameRequired');
    }

    if (isSuperAdmin && !formData.username?.trim()) {
      newErrors.username = t('usernameRequired');
    }

    if (showPasswordReset && newPassword && !passwordValidation.isValid) {
      newErrors.password = tPwValidation(passwordValidation.messageKey);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Update basic info
      await apiClient.updateProfessor(professorId, {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        isAdmin: formData.isAdmin,
        ...(isSuperAdmin && formData.username ? { username: formData.username } : {}),
        ...(isSuperAdmin && formData.universityId ? { universityId: formData.universityId } : {}),
      });

      // Update course assignments
      const toAdd = assignedCourseIds.filter(id => !originalAssignedCourseIds.includes(id));
      const toRemove = originalAssignedCourseIds.filter(id => !assignedCourseIds.includes(id));

      for (const courseId of toAdd) {
        try {
          await apiClient.assignProfessorToCourse(courseId, professorId);
        } catch (error) {
          console.error(`Error assigning course ${courseId}:`, error);
        }
      }

      for (const courseId of toRemove) {
        try {
          await apiClient.unassignProfessorFromCourse(courseId, professorId);
        } catch (error) {
          console.error(`Error unassigning course ${courseId}:`, error);
        }
      }

      // Handle password reset if requested
      if (showPasswordReset && newPassword && isSuperAdmin) {
        try {
          await apiClient.updateProfessorPassword(professorId, newPassword);
          toast.success(t('passwordResetSuccess'));
        } catch (error) {
          console.error('Error resetting password:', error);
          toast.error(t('passwordResetError'));
        }
      }

      toast.success(t('updateSuccess'));

      // Use window.location.href for more reliable navigation
      if (typeof window !== 'undefined') {
        window.location.href = returnUrl;
      } else {
        router.push(returnUrl);
      }
    } catch (error: any) {
      console.error('Failed to update professor:', error);
      toast.error(error.message || t('updateError'));
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
        <Button onClick={() => router.push(returnUrl)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('backToProfessors')}
        </Button>
      </div>
    );
  }

  return (
    <AdminOnly>
      <div className="space-y-6 max-w-4xl mx-auto">
        <PageHeader
          title={t('title')}
          description={t('description', { name: `${professor?.firstName} ${professor?.lastName}` })}
          breadcrumbs={breadcrumbs}
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('professorInfo')}</CardTitle>
              <CardDescription>{t('professorInfoDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{t('firstNameLabel')}</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    placeholder={t('firstNamePlaceholder')}
                    disabled={isLoading}
                    autoComplete="off"
                  />
                  {errors.firstName && (
                    <p className="text-sm text-destructive">{errors.firstName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">{t('lastNameLabel')}</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    placeholder={t('lastNamePlaceholder')}
                    disabled={isLoading}
                    autoComplete="off"
                  />
                  {errors.lastName && (
                    <p className="text-sm text-destructive">{errors.lastName}</p>
                  )}
                </div>
              </div>

              {isSuperAdmin && (
                <div className="space-y-2">
                  <Label htmlFor="username">{t('usernameLabel')}</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => handleChange('username', e.target.value)}
                    placeholder={t('usernamePlaceholder')}
                    disabled={isLoading}
                    autoComplete="off"
                  />
                  {errors.username && (
                    <p className="text-sm text-destructive">{errors.username}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">{t('emailLabel')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder={t('emailPlaceholder')}
                  disabled={isLoading}
                  autoComplete="off"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              {isSuperAdmin && (
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="isAdmin">{t('adminProfessorLabel')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('adminDescription')}
                    </p>
                  </div>
                  <Switch
                    id="isAdmin"
                    checked={formData.isAdmin}
                    onCheckedChange={(checked) => handleChange('isAdmin', checked)}
                    disabled={isLoading}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Course Assignment */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
                <CardTitle>{t('assignedCourses')}</CardTitle>
              </div>
              <CardDescription>{t('assignedCoursesDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingCourses ? (
                <p className="text-sm text-muted-foreground">{tCommon('loading')}</p>
              ) : courses.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t('noCoursesAvailable')}
                </p>
              ) : (
                <MultiSelect
                  options={courses.map((course) => ({
                    value: String(course.id),
                    label: course.code ? `${course.name} (${course.code})` : course.name,
                  }))}
                  selected={assignedCourseIds.map(String)}
                  onChange={(selected) => {
                    const courseIds = selected.map(Number);
                    courseIds.forEach((courseId) => {
                      if (!assignedCourseIds.includes(courseId)) {
                        toggleCourse(courseId);
                      }
                    });
                    assignedCourseIds.forEach((courseId) => {
                      if (!courseIds.includes(courseId)) {
                        toggleCourse(courseId);
                      }
                    });
                  }}
                  placeholder={t('selectCourses') || 'Select courses...'}
                  searchPlaceholder={t('searchCourses') || 'Search courses...'}
                  emptyMessage={t('noCoursesFound') || 'No courses found.'}
                  disabled={isLoading}
                />
              )}
            </CardContent>
          </Card>

          {/* Password Reset - Super Admin Only */}
          {isSuperAdmin && (
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Key className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>{t('passwordReset')}</CardTitle>
                </div>
                <CardDescription>{t('passwordResetDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show_password_reset"
                    checked={showPasswordReset}
                    onCheckedChange={setShowPasswordReset}
                    disabled={isLoading}
                  />
                  <Label htmlFor="show_password_reset" className="cursor-pointer">
                    {t('enablePasswordReset')}
                  </Label>
                </div>

                {showPasswordReset && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="new_password">{t('newPasswordLabel')}</Label>
                      <Input
                        id="new_password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder={t('newPasswordPlaceholder')}
                        disabled={isLoading}
                        autoComplete="new-password"
                      />
                      {errors.password && (
                        <p className="text-sm text-destructive">{errors.password}</p>
                      )}
                    </div>

                    {newPassword && (
                      <Alert className={passwordValidation.isValid ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950' : 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950'}>
                        <AlertCircle className={`h-4 w-4 ${passwordValidation.isValid ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`} />
                        <AlertDescription className={passwordValidation.isValid ? 'text-green-900 dark:text-green-100' : 'text-amber-900 dark:text-amber-100'}>
                          {tPwValidation(passwordValidation.messageKey)}
                        </AlertDescription>
                      </Alert>
                    )}

                    <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                      <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <AlertDescription className="text-blue-900 dark:text-blue-100">
                        {t('passwordResetInfo')}
                      </AlertDescription>
                    </Alert>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {errors.submit && (
            <Alert className="border-destructive/50 bg-destructive/10">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive">{errors.submit}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(returnUrl)}
              disabled={isLoading}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('saveChanges')}
            </Button>
          </div>
        </form>
      </div>
    </AdminOnly>
  );
}
