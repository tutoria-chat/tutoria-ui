'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectItem } from '@/components/ui/select';
import { apiClient } from '@/lib/api';
import { UserPlus, Copy, Check, Mail, AlertCircle, Building2, BookOpen } from 'lucide-react';
import type { BreadcrumbItem } from '@/lib/types';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/auth-provider';

export default function CreateProfessorPage() {
  const router = useRouter();
  const { user } = useAuth();
  const t = useTranslations('professors.create');
  const tCommon = useTranslations('common');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [resetLink, setResetLink] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [newUser, setNewUser] = useState<any>(null);
  const [universities, setUniversities] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loadingUniversities, setLoadingUniversities] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    university_id: '',
    course_ids: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const breadcrumbs: BreadcrumbItem[] = [
    { label: tCommon('breadcrumbs.professors'), href: '/professors' },
    { label: t('createProfessor'), isCurrentPage: true }
  ];

  // Check if user is super admin or admin professor
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdminProfessor = user?.role === 'professor' && user?.is_admin;

  useEffect(() => {
    loadUniversities();
  }, []);

  useEffect(() => {
    if (formData.university_id) {
      loadCourses(parseInt(formData.university_id));
    } else {
      setCourses([]);
    }
  }, [formData.university_id]);

  const loadUniversities = async () => {
    try {
      const data = await apiClient.getUniversities();

      // Handle paginated response
      const universities = Array.isArray(data) ? data : (data.items || []);

      // If admin professor, filter to only their university
      if (isAdminProfessor && user?.university_id) {
        const filtered = universities.filter((u: any) => u.id === user.university_id);
        setUniversities(filtered);
        // Auto-select the university for admin professors
        if (filtered.length === 1) {
          setFormData(prev => ({ ...prev, university_id: String(filtered[0].id) }));
        }
      } else {
        setUniversities(universities);
      }
    } catch (error: any) {
      console.error('Error loading universities:', error);
      toast.error(t('errorLoadingUniversities'));
    } finally {
      setLoadingUniversities(false);
    }
  };

  const loadCourses = async (universityId: number) => {
    setLoadingCourses(true);
    try {
      const data = await apiClient.getCoursesByUniversity(universityId);
      setCourses(data);
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
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        password: formData.password,
        university_id: parseInt(formData.university_id),
        is_admin: false,
      });

      setNewUser(response);

      // Assign courses to professor
      for (const courseId of formData.course_ids) {
        try {
          await apiClient.assignProfessorToCourse(parseInt(courseId), response.id);
        } catch (error) {
          console.error(`Error assigning course ${courseId}:`, error);
        }
      }

      // Generate reset link (in production, backend would return this)
      const resetToken = 'temp-token-' + Math.random().toString(36).substring(7);
      const link = `${window.location.origin}/setup-password?token=${resetToken}&username=${formData.username}`;
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

        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-900 flex items-center">
              <UserPlus className="mr-2 h-5 w-5" />
              {t('successCardTitle')}
            </CardTitle>
            <CardDescription className="text-green-700">
              {t('successCardDescription', { firstName: newUser?.first_name, lastName: newUser?.last_name })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-green-900">{t('usernameLabel')}</Label>
              <div className="mt-1 p-2 bg-white rounded border border-green-200">
                <code className="text-sm">{formData.username}</code>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-green-900">{t('emailLabel')}</Label>
              <div className="mt-1 p-2 bg-white rounded border border-green-200 flex items-center">
                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                <code className="text-sm">{formData.email}</code>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-green-900">{t('universityLabel')}</Label>
              <div className="mt-1 p-2 bg-white rounded border border-green-200 flex items-center">
                <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                <code className="text-sm">{getUniversityName()}</code>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-green-900">{t('assignedCoursesLabel')}</Label>
              <div className="mt-1 p-2 bg-white rounded border border-green-200 flex items-center">
                <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                <code className="text-sm">{getCoursesNames()}</code>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">{t('resetLinkTitle')}</CardTitle>
            <CardDescription className="text-blue-700">
              {t('resetLinkDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-900">
                <strong>{t('linkExpiresWarning')}</strong> {t('shareQuickly')}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-blue-900">{t('setupLinkLabel')}</Label>
              <div className="flex space-x-2">
                <Input
                  value={resetLink}
                  readOnly
                  className="bg-white font-mono text-sm"
                />
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  className="shrink-0"
                >
                  {copiedLink ? (
                    <>
                      <Check className="mr-2 h-4 w-4 text-green-600" />
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

            <div className="p-4 bg-white rounded border border-blue-200">
              <p className="text-sm text-blue-900 font-medium mb-2">{t('howToShare')}</p>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
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

      <Alert className="border-blue-200 bg-blue-50">
        <UserPlus className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
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
              <Select
                id="university_id"
                value={formData.university_id}
                onValueChange={(value) => setFormData({ ...formData, university_id: value, course_ids: [] })}
                disabled={loadingUniversities || (isAdminProfessor && universities.length === 1)}
                placeholder={loadingUniversities ? tCommon('loading') : t('selectUniversity')}
              >
                {universities.map((university) => (
                  <SelectItem key={university.id} value={String(university.id)}>
                    {university.name}
                  </SelectItem>
                ))}
              </Select>
              {errors.university_id && (
                <p className="text-sm text-destructive">{errors.university_id}</p>
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
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
              <p className="text-sm text-muted-foreground">
                {t('passwordHint')}
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
