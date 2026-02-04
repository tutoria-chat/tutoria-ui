'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Eye, EyeOff, CheckCircle, XCircle, AlertCircle, Check, X } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useLanguage } from '@/components/providers/language-provider';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { Locale } from '@/i18n/config';

// Password requirements matching backend PasswordComplexityAttribute
const MIN_PASSWORD_LENGTH = 8;

interface PasswordRequirement {
  key: string;
  label: string;
  test: (password: string) => boolean;
}

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

  // Password requirements matching backend
  const passwordRequirements: PasswordRequirement[] = [
    { key: 'length', label: t('reqMinLength'), test: (p) => p.length >= MIN_PASSWORD_LENGTH },
    { key: 'uppercase', label: t('reqUppercase'), test: (p) => /[A-Z]/.test(p) },
    { key: 'lowercase', label: t('reqLowercase'), test: (p) => /[a-z]/.test(p) },
    { key: 'digit', label: t('reqDigit'), test: (p) => /[0-9]/.test(p) },
  ];

  const allRequirementsMet = password.length > 0 && passwordRequirements.every((req) => req.test(password));

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

    // Token will be verified when user submits the form
    // We don't verify it upfront anymore
    setVerifyingToken(false);
  }, [searchParams, router, t, setLocale]);

  const getPasswordStrength = (): { strength: 'weak' | 'medium' | 'strong'; label: string; color: string } | null => {
    if (!password) return null;

    const metCount = passwordRequirements.filter((req) => req.test(password)).length;

    if (metCount <= 1) return { strength: 'weak', label: t('passwordWeak'), color: 'text-red-600' };
    if (metCount <= 3) return { strength: 'medium', label: t('passwordMedium'), color: 'text-yellow-600' };
    return { strength: 'strong', label: t('passwordStrong'), color: 'text-green-600' };
  };

  const passwordStrength = getPasswordStrength();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!password) {
      newErrors.password = t('passwordRequired');
    } else if (!allRequirementsMet) {
      newErrors.password = t('passwordRequirements');
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
      await apiClient.resetPassword(token, password);

      setSuccess(true);
      toast.success(t('success'));
    } catch (error: unknown) {
      console.error('Error resetting password:', error);

      let errorMessage = t('error');

      if (typeof error === 'object' && error !== null && 'message' in error) {
        const message = String((error as { message: unknown }).message).toLowerCase();

        if (message.includes('expired')) {
          errorMessage = t('tokenExpired');
        } else if (message.includes('invalid')) {
          errorMessage = t('tokenInvalid');
        } else if (message.includes('uppercase')) {
          errorMessage = t('errorUppercase');
        } else if (message.includes('lowercase')) {
          errorMessage = t('errorLowercase');
        } else if (message.includes('digit') || message.includes('number')) {
          errorMessage = t('errorDigit');
        } else if (message.includes('character') || message.includes('length')) {
          errorMessage = t('errorLength');
        } else if ((error as { message: string }).message) {
          errorMessage = (error as { message: string }).message;
        }
      }

      toast.error(errorMessage);
      setErrors({ submit: errorMessage });
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
          <CardContent className="space-y-4">
            <p className="text-sm text-green-800 dark:text-green-200">
              {t('successMessage')}
            </p>
            <Button
              onClick={() => router.push('/login')}
              className="w-full"
            >
              {t('goToLogin')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <Image
              src="/Color_01.png"
              alt="Tutoria Logo"
              width={4008}
              height={1438}
              priority
              className="h-16 w-auto"
            />
          </div>
          <CardTitle className="flex items-center justify-center">
            <Shield className="mr-2 h-5 w-5 text-primary" />
            {t('title')}
          </CardTitle>
          <CardDescription className="text-center">{t('description')}</CardDescription>
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

              {/* Password Requirements Checklist */}
              {password && (
                <div className="space-y-2 p-3 rounded-lg bg-muted/50">
                  <p className="text-xs font-medium text-muted-foreground">{t('requirementsTitle')}</p>
                  <ul className="space-y-1">
                    {passwordRequirements.map((req) => {
                      const isMet = req.test(password);
                      return (
                        <li key={req.key} className="flex items-center gap-2 text-xs">
                          {isMet ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <X className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span className={isMet ? 'text-green-600' : 'text-muted-foreground'}>
                            {req.label}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  {/* Strength indicator */}
                  {passwordStrength && (
                    <div className="flex items-center space-x-2 pt-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            passwordStrength.strength === 'weak' ? 'w-1/4 bg-red-500' :
                            passwordStrength.strength === 'medium' ? 'w-3/4 bg-yellow-500' :
                            'w-full bg-green-500'
                          }`}
                        />
                      </div>
                      <span className={`text-xs font-medium ${passwordStrength.color}`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                  )}
                </div>
              )}
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
              {confirmPassword && password !== confirmPassword && !errors.confirmPassword && (
                <p className="text-sm text-destructive flex items-center">
                  <XCircle className="h-3 w-3 mr-1" />
                  {t('passwordsMismatch')}
                </p>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {errors.submit}
                </AlertDescription>
              </Alert>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {t('securityTip')}
              </AlertDescription>
            </Alert>

            <Button
              type="submit"
              disabled={loading || !allRequirementsMet || password !== confirmPassword}
              className="w-full"
            >
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
