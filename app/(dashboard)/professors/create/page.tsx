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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient } from '@/lib/api';
import { UserPlus, Copy, Check, Mail, AlertCircle, Building2, BookOpen, Search } from 'lucide-react';
import type { BreadcrumbItem } from '@/lib/types';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/auth-provider';
import { validatePasswordStrength } from '@/lib/utils';

export default function CreateProfessorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const t = useTranslations('professors.create');
  const tCommon = useTranslations('common');
  const tPwValidation = useTranslations('common.passwordValidation');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [resetLink, setResetLink] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [newUser, setNewUser] = useState<any>(null);
  const [universities, setUniversities] = useState<any[]>([]);
  const [universitySearch, setUniversitySearch] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [loadingUniversities, setLoadingUniversities] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [fromUrl, setFromUrl] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState(validatePasswordStrength(''));

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    university_id: '',
    course_ids: [] as string[],
    language_preference: 'pt-br',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const breadcrumbs: BreadcrumbItem[] = [
    { label: tCommon('breadcrumbs.professors'), href: '/professors' },
    { label: t('createProfessor'), isCurrentPage: true }
  ];

  // Check if user is super admin or admin professor
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdminProfessor = user?.role === 'professor' && user?.is_admin;

  // Handle URL university_id parameter
  useEffect(() => {
    // Admin professors ALWAYS get their own university (ignore URL parameter)
    if (isAdminProfessor && user?.university_id) {
      loadUniversityById(user.university_id);
      setFromUrl(true);
      return;
    }

    // Super admins can use URL parameter or search
    const universityIdFromUrl = searchParams.get('university_id');
    if (universityIdFromUrl && isSuperAdmin) {
      setFromUrl(true);
      loadUniversityById(parseInt(universityIdFromUrl));
    }
  }, [searchParams, user, isAdminProfessor, isSuperAdmin]);

  // Load courses when university is selected
  useEffect(() => {
    if (formData.university_id) {
      loadCourses(parseInt(formData.university_id));
    } else {
      setCourses([]);
    }
  }, [formData.university_id]);

  // Search universities when search term changes
  useEffect(() => {
    if (!fromUrl && universitySearch.length > 0) {
      const delayDebounceFn = setTimeout(() => {
        searchUniversities(universitySearch);
      }, 300);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [universitySearch, fromUrl]);

  // Validate password whenever it changes
  useEffect(() => {
    setPasswordValidation(validatePasswordStrength(formData.password));
  }, [formData.password]);

  const loadUniversityById = async (universityId: number) => {
    setLoadingUniversities(true);
    try {
      const university = await apiClient.getUniversity(universityId);
      setSelectedUniversity(university);
      setUniversitySearch(university.name);
      setFormData(prev => ({ ...prev, university_id: String(university.id) }));
    } catch (error: any) {
      console.error('Error loading university:', error);
      toast.error(t('errorLoadingUniversities'));
    } finally {
      setLoadingUniversities(false);
    }
  };

  const searchUniversities = async (search: string) => {
    setLoadingUniversities(true);
    try {
      const data = await apiClient.getUniversities({ search, limit: 10 });
      setUniversities(data.items);
    } catch (error: any) {
      console.error('Error searching universities:', error);
      toast.error(t('errorLoadingUniversities'));
    } finally {
      setLoadingUniversities(false);
    }
  };

  const loadCourses = async (universityId: number) => {
    setLoadingCourses(true);
    try {
      const courses = await apiClient.getCoursesByUniversity(universityId);
      setCourses(courses);
    } catch (error: any) {
      console.error('Error loading courses:', error);
      toast.error(t('errorLoadingCourses'));
    } finally {
      setLoadingCourses(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) newErrors.username = t('usernameRequired');
    if (!formData.email.trim()) newErrors.email = t('emailRequired');
    if (!formData.first_name.trim()) newErrors.first_name = t('firstNameRequired');
    if (!formData.last_name.trim()) newErrors.last_name = t('lastNameRequired');
    if (!formData.password.trim()) newErrors.password = t('passwordRequired');
    if (formData.password.length < 6) newErrors.password = t('passwordMinLength');
    if (!formData.university_id) newErrors.university_id = t('universityRequired');
    if (formData.course_ids.length === 0) newErrors.course_ids = t('coursesRequired');

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = t('emailInvalid');
    }

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
      // Create regular professor
      const response = await apiClient.createProfessor({
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        password: formData.password,
        university_id: parseInt(formData.university_id),
        is_admin: false,
        language_preference: formData.language_preference,
      });

      setNewUser(response);

      // Assign courses to professor
      for (const courseId of formData.course_ids) {
        try {
          await apiClient.assignProfessorToCourse(parseInt(courseId), response.id);
        } catch (error) {
          console.error(`Error assigning course ${courseId}:`, error);
          // Continue with other courses even if one fails
        }
      }

      // Request password reset token from backend using username + user_type
      const resetResponse = await apiClient.requestPasswordReset(formData.username, 'professor');
      const resetToken = resetResponse.reset_token;
      const link = `${window.location.origin}/welcome?token=${resetToken}&username=${formData.username}`;
      setResetLink(link);

      setShowSuccess(true);
      toast.success(t('professorCreatedSuccess'));
    } catch (error: any) {
      console.error('Error creating professor:', error);
      toast.error(error.message || t('errorCreatingProfessor'));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(resetLink);
      setCopiedLink(true);
      toast.success(t('linkCopied'));
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      toast.error(t('errorCopyingLink'));
    }
  };

  const toggleCourse = (courseId: string) => {
    setFormData(prev => ({
      ...prev,
      course_ids: prev.course_ids.includes(courseId)
        ? prev.course_ids.filter(id => id !== courseId)
        : [...prev.course_ids, courseId]
    }));
  };

  const getUniversityName = () => {
    const university = universities.find(u => u.id === parseInt(formData.university_id));
    return university?.name || '';
  };

  const getCoursesNames = () => {
    return courses
      .filter(c => formData.course_ids.includes(String(c.id)))
      .map(c => c.name)
      .join(', ');
  };

  if (showSuccess) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={t('successTitle')}
          description={t('successDescription')}
          breadcrumbs={breadcrumbs}
        />

        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardHeader>
            <CardTitle className="text-green-900 dark:text-green-100 flex items-center">
              <UserPlus className="mr-2 h-5 w-5" />
              {t('successCardTitle')}
            </CardTitle>
            <CardDescription className="text-green-700 dark:text-green-300">
              {t('successCardDescription', { firstName: newUser?.first_name, lastName: newUser?.last_name })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-green-900 dark:text-green-100">{t('usernameLabel')}</Label>
              <div className="mt-1 p-2 bg-white dark:bg-green-900 rounded border border-green-200 dark:border-green-700">
                <code className="text-sm">{formData.username}</code>
              </div>
            </div>

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
                <code className="text-sm">{getUniversityName()}</code>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-green-900 dark:text-green-100">{t('assignedCoursesLabel')}</Label>
              <div className="mt-1 p-2 bg-white dark:bg-green-900 rounded border border-green-200 dark:border-green-700 flex items-center">
                <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                <code className="text-sm">{getCoursesNames()}</code>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100">{t('resetLinkTitle')}</CardTitle>
            <CardDescription className="text-blue-700 dark:text-blue-300">
              {t('resetLinkDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-amber-900 dark:text-amber-100">
                <strong>{t('linkExpiresWarning')}</strong> {t('shareQuickly')}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-blue-900 dark:text-blue-100">{t('setupLinkLabel')}</Label>
              <div className="flex space-x-2">
                <Input
                  value={resetLink}
                  readOnly
                  className="bg-white dark:bg-blue-900 font-mono text-sm"
                />
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  className="shrink-0"
                >
                  {copiedLink ? (
                    <>
                      <Check className="mr-2 h-4 w-4 text-green-600 dark:text-green-400" />
                      {t('copied')}
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      {t('copyLink')}
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-blue-900 rounded border border-blue-200 dark:border-blue-700">
              <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-2">{t('howToShare')}</p>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                <li>{t('shareViaEmail', { email: formData.email })}</li>
                <li>{t('shareViaMessaging')}</li>
                <li>{t('shareInPerson')}</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="flex space-x-4">
          <Button onClick={() => router.push('/professors')} variant="outline">
            {t('backToList')}
          </Button>
          <Button onClick={() => {
            setShowSuccess(false);
            setFormData({
              username: '',
              email: '',
              first_name: '',
              last_name: '',
              password: '',
              university_id: isAdminProfessor && user?.university_id ? String(user.university_id) : '',
              course_ids: [],
              language_preference: 'pt-br',
            });
            setResetLink('');
            setNewUser(null);
          }}>
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
            <CardDescription>
              {t('professorInfoDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="university_id">{t('universityLabel')}</Label>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="university_id"
                    value={universitySearch}
                    onChange={(e) => {
                      setUniversitySearch(e.target.value);
                      if (!e.target.value) {
                        setSelectedUniversity(null);
                        setFormData({ ...formData, university_id: '', course_ids: [] });
                      }
                    }}
                    placeholder={loadingUniversities ? tCommon('loading') : t('selectUniversity')}
                    className="pl-10"
                    disabled={fromUrl}
                  />
                </div>
                {!fromUrl && universitySearch && universities.length > 0 && !selectedUniversity && (
                  <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                    {universities.map((university) => (
                      <div
                        key={university.id}
                        onClick={() => {
                          setSelectedUniversity(university);
                          setUniversitySearch(university.name);
                          setFormData({ ...formData, university_id: String(university.id), course_ids: [] });
                        }}
                        className="px-3 py-2 cursor-pointer hover:bg-muted flex items-center"
                      >
                        <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{university.name}</p>
                          {university.code && (
                            <p className="text-xs text-muted-foreground">{university.code}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {errors.university_id && (
                <p className="text-sm text-destructive">{errors.university_id}</p>
              )}
              {fromUrl && selectedUniversity && isAdminProfessor && (
                <p className="text-xs text-muted-foreground">
                  {t('universityLockedForAdmin') || 'University is locked to your institution as an admin professor'}
                </p>
              )}
              {fromUrl && selectedUniversity && !isAdminProfessor && (
                <p className="text-xs text-muted-foreground">
                  {t('universityPreselected') || 'University pre-selected from URL'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t('coursesLabelRequired')}</Label>
              {loadingCourses ? (
                <p className="text-sm text-muted-foreground">{t('loadingCourses')}</p>
              ) : courses.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {formData.university_id ? t('noCoursesAvailable') : t('selectUniversityFirst')}
                </p>
              ) : (
                <div className="border rounded-md p-4 space-y-2 max-h-48 overflow-y-auto">
                  {courses.map((course) => (
                    <div key={course.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`course-${course.id}`}
                        checked={formData.course_ids.includes(String(course.id))}
                        onChange={() => toggleCourse(String(course.id))}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label
                        htmlFor={`course-${course.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {course.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
              {errors.course_ids && (
                <p className="text-sm text-destructive">{errors.course_ids}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">{t('firstNameLabel')}</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder={t('firstNamePlaceholder')}
                />
                {errors.first_name && (
                  <p className="text-sm text-destructive">{errors.first_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">{t('lastNameLabel')}</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder={t('lastNamePlaceholder')}
                />
                {errors.last_name && (
                  <p className="text-sm text-destructive">{errors.last_name}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">{t('usernameFormLabel')}</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder={t('usernamePlaceholder')}
              />
              {errors.username && (
                <p className="text-sm text-destructive">{errors.username}</p>
              )}
              <p className="text-sm text-muted-foreground">
                {t('usernameHint')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('emailFormLabel')}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={t('emailPlaceholder')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('tempPasswordLabel')}</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={t('passwordPlaceholder')}
                autoComplete="new-password"
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
              {formData.password && (
                <Alert className={passwordValidation.isValid ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950' : 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950'}>
                  <AlertCircle className={`h-4 w-4 ${passwordValidation.isValid ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`} />
                  <AlertDescription className={passwordValidation.isValid ? 'text-green-900 dark:text-green-100' : 'text-amber-900 dark:text-amber-100'}>
                    {tPwValidation(passwordValidation.messageKey)}
                  </AlertDescription>
                </Alert>
              )}
              <p className="text-sm text-muted-foreground">
                {t('passwordHint')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language_preference">{t('languageLabel')}</Label>
              <Select
                value={formData.language_preference}
                onValueChange={(value) => setFormData({ ...formData, language_preference: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('languagePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-br">{t('languagePortuguese')}</SelectItem>
                  <SelectItem value="en">{t('languageEnglish')}</SelectItem>
                  <SelectItem value="es">{t('languageSpanish')}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {t('languageHint')}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex space-x-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/professors')}
            disabled={loading}
          >
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
