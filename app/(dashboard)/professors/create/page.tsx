'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiClient } from '@/lib/api';
import { UserPlus, Mail, Building2, BookOpen, Search, CheckCircle2, Info } from 'lucide-react';
import type { BreadcrumbItem } from '@/lib/types';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/auth-provider';
import { MultiSelect } from '@/components/ui/multi-select';

export default function CreateProfessorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const t = useTranslations('professors.create');
  const tCommon = useTranslations('common');
  const [loading, setLoading] = useState(false);
  const [inviteResult, setInviteResult] = useState<'invited' | 'added' | null>(null);
  const [universities, setUniversities] = useState<any[]>([]);
  const [universitySearch, setUniversitySearch] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [loadingUniversities, setLoadingUniversities] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [universityLocked, setUniversityLocked] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    universityId: '',
    courseIds: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const breadcrumbs: BreadcrumbItem[] = [
    { label: tCommon('breadcrumbs.professors'), href: '/professors' },
    { label: t('createProfessor'), isCurrentPage: true }
  ];

  const isSuperAdmin = user?.role === 'super_admin';
  const isAdminProfessor = user?.role === 'professor' && user?.isAdmin;

  // Pre-fill university for any user with a universityId
  useEffect(() => {
    const userUniversityId = user?.universityId;

    if (userUniversityId && !isSuperAdmin) {
      loadUniversityById(userUniversityId);
      setUniversityLocked(true);
      return;
    }

    const universityIdFromUrl = searchParams.get('universityId');
    if (universityIdFromUrl && isSuperAdmin) {
      setUniversityLocked(true);
      loadUniversityById(parseInt(universityIdFromUrl));
    }
  }, [searchParams, user, isSuperAdmin]);

  // Load courses when university changes
  useEffect(() => {
    if (formData.universityId) {
      loadCourses(parseInt(formData.universityId));
    } else {
      setCourses([]);
    }
  }, [formData.universityId]);

  // Debounced university search
  useEffect(() => {
    if (universityLocked || !universitySearch) return;
    const timer = setTimeout(() => searchUniversities(universitySearch), 300);
    return () => clearTimeout(timer);
  }, [universitySearch, universityLocked]);

  const loadUniversityById = async (universityId: number) => {
    setLoadingUniversities(true);
    try {
      const university = await apiClient.getUniversity(universityId);
      setSelectedUniversity(university);
      setUniversitySearch(university.name);
      setFormData(prev => ({ ...prev, universityId: String(university.id) }));
    } catch {
      toast.error(t('errorLoadingUniversities'));
    } finally {
      setLoadingUniversities(false);
    }
  };

  const searchUniversities = async (search: string) => {
    setLoadingUniversities(true);
    try {
      const data = await apiClient.getUniversities({ search, size: 10 });
      setUniversities(data.items);
    } catch {
      toast.error(t('errorLoadingUniversities'));
    } finally {
      setLoadingUniversities(false);
    }
  };

  const loadCourses = async (universityId: number) => {
    setLoadingCourses(true);
    try {
      setCourses(await apiClient.getCoursesByUniversity(universityId));
    } catch {
      toast.error(t('errorLoadingCourses'));
    } finally {
      setLoadingCourses(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email.trim()) newErrors.email = t('emailRequired');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) newErrors.email = t('emailInvalid');
    if (!formData.universityId) newErrors.universityId = t('universityRequired');
    if (formData.courseIds.length === 0) newErrors.courseIds = t('coursesRequired');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error(t('fixFormErrors'));
      return;
    }

    setLoading(true);
    try {
      const result = await apiClient.bulkInvite({
        emails: [formData.email],
        userType: 'professor',
        universityId: parseInt(formData.universityId),
        isAdmin: false,
        languagePreference: 'pt-br',
      });

      // For users who already existed and were added: assign courses immediately
      const addedUser = result.added?.[0] || result.alreadyMembers?.[0];
      if (addedUser?.userId && formData.courseIds.length > 0) {
        await Promise.allSettled(
          formData.courseIds.map(courseId =>
            apiClient.assignProfessorToCourse(parseInt(courseId), addedUser.userId)
          )
        );
        setInviteResult('added');
        toast.success(t('professorCreatedSuccess'));
      } else if (result.errors?.[0]) {
        throw new Error(result.errors[0].message);
      } else {
        // Newly invited — they register themselves, courses assigned afterwards
        setInviteResult('invited');
        toast.success(t('inviteSentSuccess'));
      }
    } catch (error: any) {
      const msg = error.message || t('errorCreatingProfessor');
      if (msg.toLowerCase().includes('email already exists')) {
        setErrors({ email: t('emailAlreadyExists') });
        toast.error(t('emailAlreadyExists'));
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const getCoursesNames = () =>
    courses.filter(c => formData.courseIds.includes(String(c.id))).map(c => c.name).join(', ');

  const resetForm = () => {
    setInviteResult(null);
    setFormData({
      email: '',
      universityId: universityLocked ? formData.universityId : '',
      courseIds: [],
    });
    if (!universityLocked) {
      setSelectedUniversity(null);
      setUniversitySearch('');
    }
  };

  if (inviteResult) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={inviteResult === 'invited' ? t('successTitle') : t('successTitleAdded')}
          description={t('successDescription')}
          breadcrumbs={breadcrumbs}
        />

        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardHeader>
            <CardTitle className="text-green-900 dark:text-green-100 flex items-center">
              <CheckCircle2 className="mr-2 h-5 w-5" />
              {inviteResult === 'invited' ? t('inviteSentSuccess') : t('professorCreatedSuccess')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-green-900 dark:text-green-100">{t('emailLabel')}</Label>
              <div className="mt-1 p-2 bg-white dark:bg-green-900 rounded border border-green-200 dark:border-green-700 flex items-center">
                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                <code className="text-sm">{formData.email}</code>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-green-900 dark:text-green-100">{t('universityLabel')}</Label>
              <div className="mt-1 p-2 bg-white dark:bg-green-900 rounded border border-green-200 dark:border-green-700 flex items-center">
                <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                <code className="text-sm">{selectedUniversity?.name}</code>
              </div>
            </div>

            {inviteResult === 'added' && formData.courseIds.length > 0 && (
              <div>
                <Label className="text-sm font-medium text-green-900 dark:text-green-100">{t('assignedCoursesLabel')}</Label>
                <div className="mt-1 p-2 bg-white dark:bg-green-900 rounded border border-green-200 dark:border-green-700 flex items-center">
                  <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                  <code className="text-sm">{getCoursesNames()}</code>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {inviteResult === 'invited' ? (
          <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
            <CardHeader>
              <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center">
                <Mail className="mr-2 h-5 w-5" />
                {t('emailSentTitle')}
              </CardTitle>
              <CardDescription className="text-blue-700 dark:text-blue-300">
                {t('emailSentDescription', { email: formData.email })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Alert className="bg-blue-100 dark:bg-blue-900/50 border-blue-300 dark:border-blue-700">
                <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-blue-900 dark:text-blue-100">
                  {t('emailInstructions')}
                </AlertDescription>
              </Alert>
              {formData.courseIds.length > 0 && (
                <Alert className="bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800">
                  <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <AlertDescription className="text-amber-900 dark:text-amber-100">
                    {t('coursesAfterRegistration')}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
            <CardHeader>
              <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center">
                <Mail className="mr-2 h-5 w-5" />
                {t('emailSentTitle')}
              </CardTitle>
              <CardDescription className="text-blue-700 dark:text-blue-300">
                {t('emailSentDescriptionAdded', { email: formData.email })}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <div className="flex space-x-4">
          {formData.universityId && (
            <Button onClick={() => router.push(`/universities/${formData.universityId}`)} variant="default">
              {t('backToUniversity')}
            </Button>
          )}
          <Button onClick={() => router.push('/professors')} variant="outline">
            {t('backToList')}
          </Button>
          <Button onClick={resetForm} variant="outline">
            {t('createAnother')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        breadcrumbs={breadcrumbs}
      />

      <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
        <UserPlus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-blue-900 dark:text-blue-100">
          {t('permissions')}
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>{t('professorInfoTitle')}</CardTitle>
            <CardDescription>{t('professorInfoDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* University */}
            <div className="space-y-2">
              <Label htmlFor="universityId">{t('universityLabel')}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="universityId"
                  value={universitySearch}
                  onChange={(e) => {
                    setUniversitySearch(e.target.value);
                    if (!e.target.value) {
                      setSelectedUniversity(null);
                      setFormData(prev => ({ ...prev, universityId: '', courseIds: [] }));
                    }
                  }}
                  placeholder={loadingUniversities ? tCommon('loading') : t('selectUniversity')}
                  className="pl-10"
                  disabled={universityLocked}
                />
                {!universityLocked && universitySearch && universities.length > 0 && !selectedUniversity && (
                  <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                    {universities.map((u) => (
                      <div
                        key={u.id}
                        onClick={() => {
                          setSelectedUniversity(u);
                          setUniversitySearch(u.name);
                          setFormData(prev => ({ ...prev, universityId: String(u.id), courseIds: [] }));
                        }}
                        className="px-3 py-2 cursor-pointer hover:bg-muted flex items-center"
                      >
                        <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{u.name}</p>
                          {u.code && <p className="text-xs text-muted-foreground">{u.code}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {errors.universityId && <p className="text-sm text-destructive">{errors.universityId}</p>}
              {universityLocked && selectedUniversity && (
                <p className="text-xs text-muted-foreground">
                  {isAdminProfessor ? t('universityLockedForAdmin') : t('universityPreselected')}
                </p>
              )}
            </div>

            {/* Courses */}
            <div className="space-y-2">
              <Label>{t('coursesLabelRequired')}</Label>
              {loadingCourses ? (
                <p className="text-sm text-muted-foreground">{t('loadingCourses')}</p>
              ) : courses.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {formData.universityId ? t('noCoursesAvailable') : t('selectUniversityFirst')}
                </p>
              ) : (
                <MultiSelect
                  options={courses.map(c => ({ value: String(c.id), label: c.name }))}
                  selected={formData.courseIds}
                  onChange={(selected) => setFormData(prev => ({ ...prev, courseIds: selected }))}
                  placeholder={t('selectCourses')}
                  searchPlaceholder={t('searchCourses')}
                  emptyMessage={t('noCoursesFound')}
                />
              )}
              {errors.courseIds && <p className="text-sm text-destructive">{errors.courseIds}</p>}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">{t('emailFormLabel')}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder={t('emailPlaceholder')}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              <p className="text-sm text-muted-foreground">{t('emailFormHint')}</p>
            </div>

          </CardContent>
        </Card>

        <div className="flex space-x-4 mt-6">
          <Button type="button" variant="outline" onClick={() => router.push('/professors')} disabled={loading}>
            {t('cancel')}
          </Button>
          <Button type="submit" disabled={loading || loadingUniversities || loadingCourses}>
            {loading ? t('creating') : t('createProfessorButton')}
          </Button>
        </div>
      </form>
    </div>
  );
}
