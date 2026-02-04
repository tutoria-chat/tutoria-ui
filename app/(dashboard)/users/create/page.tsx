'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/components/auth/auth-provider';
import type { UserRole, University } from '@/lib/types';

export default function CreateUserPage() {
  const t = useTranslations('users.create');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { user: currentUser } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    userType: '' as UserRole | '',
    universityId: '',
    languagePreference: 'pt-br',
  });
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchUniversities();
  }, []);

  const fetchUniversities = async () => {
    try {
      const data = await apiClient.get<University[]>('/api/universities');
      setUniversities(data);
    } catch (error) {
      console.error('Failed to fetch universities:', error);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.username.trim()) {
      newErrors.username = t('errors.usernameRequired');
    }
    if (!formData.email.trim()) {
      newErrors.email = t('errors.emailRequired');
    }
    if (!formData.firstName.trim()) {
      newErrors.firstName = t('errors.firstNameRequired');
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = t('errors.lastNameRequired');
    }
    if (!formData.password.trim()) {
      newErrors.password = t('errors.passwordRequired');
    } else if (formData.password.length < 6) {
      newErrors.password = t('errors.passwordMinLength');
    }
    if (!formData.userType) {
      newErrors.userType = t('errors.userTypeRequired');
    }

    // University required for university-scoped roles
    const universityScopedRoles: UserRole[] = ['manager', 'tutor', 'platform_coordinator', 'professor'];
    if (formData.userType && universityScopedRoles.includes(formData.userType as UserRole) && !formData.universityId) {
      newErrors.universityId = t('errors.universityRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        username: formData.username,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        password: formData.password,
        userType: formData.userType,
        languagePreference: formData.languagePreference,
      };

      // Add universityId only for university-scoped roles
      const universityScopedRoles: UserRole[] = ['manager', 'tutor', 'platform_coordinator', 'professor'];
      if (formData.userType && universityScopedRoles.includes(formData.userType as UserRole)) {
        payload.universityId = parseInt(formData.universityId);
      }

      await apiClient.post('/api/users', payload);

      toast.success(t('successMessage'));
      router.push('/users');
    } catch (error: any) {
      const errorMessage = error.message || t('errorMessage');

      // Handle specific validation errors
      if (errorMessage.toLowerCase().includes('username already exists')) {
        setErrors({ username: t('errors.usernameExists') });
        toast.error(t('errors.usernameExists'));
      } else if (errorMessage.toLowerCase().includes('email already exists')) {
        setErrors({ email: t('errors.emailExists') });
        toast.error(t('errors.emailExists'));
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const isUniversityScopedRole = (role: UserRole | '') => {
    if (!role) return false;
    const universityScopedRoles: UserRole[] = ['manager', 'tutor', 'platform_coordinator', 'professor'];
    return universityScopedRoles.includes(role as UserRole);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
      >
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {tCommon('buttons.back')}
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>{t('formTitle')}</CardTitle>
          <CardDescription>{t('formDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div className="space-y-2">
              <Label htmlFor="userType">{t('fields.userType.label')} *</Label>
              <Select
                value={formData.userType}
                onValueChange={(value) => handleChange('userType', value)}
              >
                <SelectTrigger id="userType">
                  <SelectValue placeholder={t('fields.userType.placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {currentUser?.userType === 'super_admin' && (
                    <SelectItem value="super_admin">{tCommon('roles.super_admin')}</SelectItem>
                  )}
                  <SelectItem value="manager">{tCommon('roles.manager')}</SelectItem>
                  <SelectItem value="tutor">{tCommon('roles.tutor')}</SelectItem>
                  <SelectItem value="platform_coordinator">{tCommon('roles.platform_coordinator')}</SelectItem>
                  <SelectItem value="professor">{tCommon('roles.professor')}</SelectItem>
                  <SelectItem value="student">{tCommon('roles.student')}</SelectItem>
                </SelectContent>
              </Select>
              {formData.userType && (
                <p className="text-sm text-muted-foreground">
                  {tCommon(`roles.descriptions.${formData.userType}`)}
                </p>
              )}
              {errors.userType && <p className="text-sm text-destructive">{errors.userType}</p>}
            </div>

            {/* University Selection (for university-scoped roles) */}
            {isUniversityScopedRole(formData.userType) && (
              <div className="space-y-2">
                <Label htmlFor="universityId">{t('fields.university.label')} *</Label>
                <Select
                  value={formData.universityId}
                  onValueChange={(value) => handleChange('universityId', value)}
                >
                  <SelectTrigger id="universityId">
                    <SelectValue placeholder={t('fields.university.placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {universities.map((university) => (
                      <SelectItem key={university.id} value={university.id.toString()}>
                        {university.name} ({university.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.universityId && <p className="text-sm text-destructive">{errors.universityId}</p>}
              </div>
            )}

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">{t('fields.username.label')} *</Label>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                placeholder={t('fields.username.placeholder')}
                disabled={loading}
              />
              {errors.username && <p className="text-sm text-destructive">{errors.username}</p>}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">{t('fields.email.label')} *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder={t('fields.email.placeholder')}
                disabled={loading}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="firstName">{t('fields.firstName.label')} *</Label>
              <Input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                placeholder={t('fields.firstName.placeholder')}
                disabled={loading}
              />
              {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="lastName">{t('fields.lastName.label')} *</Label>
              <Input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                placeholder={t('fields.lastName.placeholder')}
                disabled={loading}
              />
              {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">{t('fields.password.label')} *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder={t('fields.password.placeholder')}
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground">{t('fields.password.hint')}</p>
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>

            {/* Language Preference */}
            <div className="space-y-2">
              <Label htmlFor="languagePreference">{t('fields.language.label')}</Label>
              <Select
                value={formData.languagePreference}
                onValueChange={(value) => handleChange('languagePreference', value)}
              >
                <SelectTrigger id="languagePreference">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-br">Português (Brasil)</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? tCommon('buttons.loading') : t('submitButton')}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                {tCommon('buttons.cancel')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
