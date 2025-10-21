'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Eye, EyeOff, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useLanguage } from '@/components/providers/language-provider';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { Locale } from '@/i18n/config';

function SetupPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('setupPassword');
  const { setLocale } = useLanguage();

  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifyingToken, setVerifyingToken] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const usernameParam = searchParams.get('username');

    if (!tokenParam || !usernameParam) {
      toast.error(t('invalidLink'));
      setTimeout(() => router.push('/login'), 3000);
      setVerifyingToken(false);
      return;
    }

    setToken(tokenParam);
    setUsername(usernameParam);

    // Verify token and detect user's language preference
    const verifyAndSetLanguage = async () => {
      try {
        const response = await apiClient.verifyResetToken(usernameParam, tokenParam);

        // Set locale based on user's preference
        if (response.languagePreference) {
          setLocale(response.languagePreference as Locale);
        }
      } catch (error) {
        console.error('Failed to verify token or detect language:', error);
        // Don't block the form if language detection fails
        // User can still proceed with default language
      } finally {
        setVerifyingToken(false);
      }
    };

    verifyAndSetLanguage();
  }, [searchParams, router, t, setLocale]);

  const getPasswordStrength = (pwd: string): { strength: 'weak' | 'medium' | 'strong'; label: string; color: string } => {
    if (pwd.length < 6) return { strength: 'weak', label: t('passwordWeak'), color: 'text-red-600' };
    if (pwd.length < 10) return { strength: 'medium', label: t('passwordMedium'), color: 'text-yellow-600' };

    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
    const criteria = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

    if (criteria >= 3) return { strength: 'strong', label: t('passwordStrong'), color: 'text-green-600' };
    return { strength: 'medium', label: t('passwordMedium'), color: 'text-yellow-600' };
  };

  const passwordStrength = password ? getPasswordStrength(password) : null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!password) {
      newErrors.password = t('passwordRequired');
    } else if (password.length < 6) {
      newErrors.password = t('passwordMinLength');
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = t('confirmPasswordRequired');
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = t('passwordsMismatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await apiClient.resetPassword(username, token, password);

      setSuccess(true);
      toast.success(t('success'));

      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error: unknown) {
      console.error('Error resetting password:', error);
      if (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as { message: unknown }).message === 'string'
      ) {
        const message = (error as { message: string }).message;
        if (message.includes('expired') || message.includes('invalid')) {
          toast.error(t('tokenExpired'));
        } else {
          toast.error(message || t('error'));
        }
      } else {
        toast.error(t('error'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading spinner while verifying token and detecting language
  if (verifyingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="xl" className="text-primary" />
        </div>
      </div>
    );
  }

  if (!token || !username) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <XCircle className="mr-2 h-5 w-5" />
              {t('invalidLinkTitle')}
            </CardTitle>
            <CardDescription>{t('invalidLinkDesc')}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardHeader>
            <CardTitle className="flex items-center text-green-900 dark:text-green-50">
              <CheckCircle className="mr-2 h-5 w-5" />
              {t('successTitle')}
            </CardTitle>
            <CardDescription className="text-green-700 dark:text-green-200">
              {t('successDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-800 dark:text-green-200">
              {t('redirecting')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5 text-primary" />
            {t('title')}
          </CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="username">{t('usernameLabel')}</Label>
              <Input
                id="username"
                value={username}
                readOnly
                disabled
                className="bg-muted"
              />
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="password">{t('newPasswordLabel')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('newPasswordPlaceholder')}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
              {password && passwordStrength && (
                <div className="flex items-center space-x-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        passwordStrength.strength === 'weak' ? 'w-1/3 bg-red-500' :
                        passwordStrength.strength === 'medium' ? 'w-2/3 bg-yellow-500' :
                        'w-full bg-green-500'
                      }`}
                    />
                  </div>
                  <span className={`text-xs font-medium ${passwordStrength.color}`}>
                    {passwordStrength.label}
                  </span>
                </div>
              )}
              <p className="text-xs text-muted-foreground">{t('passwordHint')}</p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('confirmPasswordLabel')}</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('confirmPasswordPlaceholder')}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword}</p>
              )}
              {confirmPassword && password === confirmPassword && (
                <p className="text-sm text-green-600 flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {t('passwordsMatch')}
                </p>
              )}
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {t('securityTip')}
              </AlertDescription>
            </Alert>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? t('submitting') : t('submit')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SetupPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Shield className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <SetupPasswordForm />
    </Suspense>
  );
}
