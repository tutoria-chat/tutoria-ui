'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Eye, EyeOff, Loader2, Building2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { InvitationDetailsResponse } from '@/lib/types';

export default function AcceptInvitationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('acceptInvitation');
  const tCommon = useTranslations('common');
  const token = searchParams.get('token');

  // Loading state
  const [loadingInvitation, setLoadingInvitation] = useState(true);
  const [invitation, setInvitation] = useState<InvitationDetailsResponse | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'invalid' | 'expired' | 'accepted' | 'cancelled' | 'noToken'>('invalid');

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch invitation on mount
  useEffect(() => {
    async function fetchInvitation() {
      if (!token) {
        setFetchError(t('noToken'));
        setErrorType('noToken');
        setLoadingInvitation(false);
        return;
      }
      try {
        const data = await apiClient.getInvitationByToken(token);
        if (data.isExpired || data.status === 'expired') {
          setFetchError(t('expired'));
          setErrorType('expired');
        } else if (data.status === 'accepted') {
          setFetchError(t('alreadyAccepted'));
          setErrorType('accepted');
        } else if (data.status === 'cancelled') {
          setFetchError(t('cancelled'));
          setErrorType('cancelled');
        } else {
          setInvitation(data);
        }
      } catch (error: any) {
        setFetchError(t('invalidToken'));
        setErrorType('invalid');
      } finally {
        setLoadingInvitation(false);
      }
    }
    fetchInvitation();
  }, [token, t]);

  // Form handlers
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.username.trim()) newErrors.username = t('errors.usernameRequired');
    if (!formData.firstName.trim()) newErrors.firstName = t('errors.firstNameRequired');
    if (!formData.lastName.trim()) newErrors.lastName = t('errors.lastNameRequired');
    if (!formData.password) newErrors.password = t('errors.passwordRequired');
    else if (formData.password.length < 8) newErrors.password = t('errors.passwordMinLength');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !token) return;

    setIsSubmitting(true);
    try {
      await apiClient.acceptInvitation({
        token,
        username: formData.username,
        firstName: formData.firstName,
        lastName: formData.lastName,
        password: formData.password,
      });
      toast.success(t('successMessage'));
      router.push('/login');
    } catch (error: any) {
      const msg = error.message || '';
      if (msg.toLowerCase().includes('username')) {
        setErrors({ username: t('errors.usernameTaken') });
      } else if (msg.toLowerCase().includes('expired')) {
        setFetchError(t('expired'));
        setErrorType('expired');
      } else {
        toast.error(msg || t('errors.generic'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get role display name
  const getRoleDisplayName = (userType: string): string => {
    try {
      return tCommon(`roles.${userType}`);
    } catch {
      return userType;
    }
  };

  // Loading state
  if (loadingInvitation) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="xl" className="text-primary" />
      </div>
    );
  }

  // Error state
  if (fetchError) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              {errorType === 'accepted' ? (
                <CheckCircle2 className="h-12 w-12 text-muted-foreground" />
              ) : (
                <AlertCircle className="h-12 w-12 text-destructive" />
              )}
            </div>
            <CardTitle className="text-xl">
              {errorType === 'accepted' ? t('alreadyAcceptedTitle') : t('errorTitle')}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {fetchError}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {errorType === 'accepted' ? (
              <Button asChild className="w-full" size="lg">
                <Link href="/login">{t('goToLogin')}</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="outline" className="w-full" size="lg">
                  <Link href="/signup">{t('signupLink')}</Link>
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                  {t('loginLink')}{' '}
                  <Link href="/login" className="text-primary hover:underline font-medium">
                    {t('goToLogin')}
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Form state (invitation is valid)
  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <Link href="/login" className="inline-block mx-auto">
            <Image
              src="/Color_01.png"
              alt="Tutoria Logo"
              width={200}
              height={72}
              priority
              quality={100}
              sizes="200px"
              className="h-16 w-auto mx-auto"
            />
          </Link>
          <div className="space-y-2">
            <CardTitle className="text-2xl">{t('title')}</CardTitle>
            <CardDescription className="text-base">
              <span className="flex items-center justify-center gap-2 flex-wrap">
                {invitation?.universityName && (
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    {invitation.universityName}
                  </span>
                )}
                {invitation?.userType && (
                  <Badge variant="secondary">
                    {getRoleDisplayName(invitation.userType)}
                  </Badge>
                )}
              </span>
              <span className="block mt-1 text-sm text-muted-foreground">
                {invitation?.universityName
                  ? t('subtitle', {
                      universityName: invitation.universityName,
                      role: getRoleDisplayName(invitation?.userType || ''),
                    })
                  : t('subtitleNoUni', {
                      role: getRoleDisplayName(invitation?.userType || ''),
                    })}
              </span>
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email (read-only) */}
            <FormField>
              <FormItem>
                <FormLabel>{t('email')}</FormLabel>
                <div className="flex h-9 w-full rounded-md border border-input bg-muted px-3 py-1 text-sm text-muted-foreground">
                  {invitation?.email}
                </div>
              </FormItem>
            </FormField>

            {/* Username */}
            <FormField>
              <FormItem>
                <FormLabel htmlFor="username">{t('username')}</FormLabel>
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  placeholder={t('usernamePlaceholder')}
                  className={errors.username ? 'border-destructive' : ''}
                  disabled={isSubmitting}
                />
                {errors.username && <FormMessage>{errors.username}</FormMessage>}
              </FormItem>
            </FormField>

            {/* First Name & Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <FormField>
                <FormItem>
                  <FormLabel htmlFor="firstName">{t('firstName')}</FormLabel>
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    placeholder={t('firstName')}
                    className={errors.firstName ? 'border-destructive' : ''}
                    disabled={isSubmitting}
                  />
                  {errors.firstName && <FormMessage>{errors.firstName}</FormMessage>}
                </FormItem>
              </FormField>

              <FormField>
                <FormItem>
                  <FormLabel htmlFor="lastName">{t('lastName')}</FormLabel>
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    placeholder={t('lastName')}
                    className={errors.lastName ? 'border-destructive' : ''}
                    disabled={isSubmitting}
                  />
                  {errors.lastName && <FormMessage>{errors.lastName}</FormMessage>}
                </FormItem>
              </FormField>
            </div>

            {/* Password */}
            <FormField>
              <FormItem>
                <FormLabel htmlFor="password">{t('password')}</FormLabel>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    placeholder={t('passwordPlaceholder')}
                    className={cn(
                      errors.password ? 'border-destructive' : '',
                      'pr-10 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden'
                    )}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <FormMessage>{errors.password}</FormMessage>}
              </FormItem>
            </FormField>

            {/* Submit Button */}
            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? t('submitting') : t('submit')}
            </Button>

            {/* Login Link */}
            <div className="text-center text-sm text-muted-foreground">
              {t('loginLink')}{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">
                {t('goToLogin')}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
