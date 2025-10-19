'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserCircle, Mail, Key, ArrowRight, AlertCircle, XCircle, RefreshCcw } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useLanguage } from '@/components/providers/language-provider';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import type { Locale } from '@/i18n/config';
import Image from 'next/image';

function WelcomeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('welcome');
  const { setLocale } = useLanguage();

  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [userInfo, setUserInfo] = useState<{
    first_name: string;
    last_name: string;
    email: string;
    user_type: string;
  } | null>(null);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const usernameParam = searchParams.get('username');

    if (!tokenParam || !usernameParam) {
      const message = t('invalidLink') || 'Invalid password reset link. Missing required parameters.';
      setErrorMessage(message);
      toast.error(message);
      setTimeout(() => router.push('/login'), 3000);
      setVerifying(false);
      setError(true);
      return;
    }

    setToken(tokenParam);
    setUsername(usernameParam);

    // Verify token and get user info
    const verifyToken = async () => {
      try {
        const response = await apiClient.verifyResetToken(usernameParam, tokenParam);

        // Set locale based on user's preference
        if (response.language_preference) {
          setLocale(response.language_preference as Locale);
        }

        // Sanitize username by removing special characters if used as fallback
        const sanitizeUsername = (username: string): string => {
          return username.replace(/[<>\"'&]/g, '');
        };

        // Get user info from verified backend response
        setUserInfo({
          first_name: response.first_name || sanitizeUsername(usernameParam.split('@')[0]),
          last_name: response.last_name || '',
          email: response.email || '',
          user_type: response.user_type || 'professor',
        });
      } catch (error: any) {
        console.error('Failed to verify token:', error);
        const message = error?.message || t('tokenInvalid') || 'Token verification failed. The link may have expired.';
        setErrorMessage(message);
        setError(true);
        toast.error(t('tokenInvalid'));
        setTimeout(() => router.push('/login'), 3000);
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [searchParams, router, t, setLocale, username]);

  const handleContinue = () => {
    router.push(`/setup-password?token=${token}&username=${username}`);
  };

  // Show loading spinner while verifying
  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="xl" className="text-primary" />
          <p className="text-sm text-muted-foreground">{t('verifying')}</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !token || !username) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <XCircle className="mr-2 h-5 w-5" />
              {t('errorTitle') || 'Invalid Link'}
            </CardTitle>
            <CardDescription>{errorMessage || t('errorDescription') || 'The password reset link is invalid or has expired.'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-amber-900 dark:text-amber-100 text-sm">
                {t('errorHelp') || 'You will be redirected to the login page. Please request a new password reset link.'}
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button onClick={() => router.push('/login')} className="flex-1">
                Go to Login
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="flex-1"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
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
          <CardTitle className="text-2xl font-bold text-center">
            {t('title')}
          </CardTitle>
          <CardDescription className="text-center text-base">
            {t('description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Welcome Message */}
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">{t('welcomeMessage')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('welcomeSubtext')}
            </p>
          </div>

          {/* User Information Card */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              {t('yourCredentials')}
            </h4>

            <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
              {/* Full Name */}
              <div className="flex items-start gap-3">
                <UserCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">{t('fullName')}</p>
                  <p className="font-medium">
                    {userInfo?.first_name} {userInfo?.last_name}
                  </p>
                </div>
              </div>

              {/* Username */}
              <div className="flex items-start gap-3">
                <Key className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">{t('username')}</p>
                  <p className="font-medium font-mono text-sm bg-background px-2 py-1 rounded border inline-block">
                    {username}
                  </p>
                </div>
              </div>

              {/* Email */}
              {userInfo?.email && (
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">{t('email')}</p>
                    <p className="font-medium break-all">{userInfo.email}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Next Steps Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {t('nextSteps')}
            </AlertDescription>
          </Alert>

          {/* Continue Button */}
          <Button
            onClick={handleContinue}
            className="w-full"
            size="lg"
          >
            {t('continueButton')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          {/* Footer Note */}
          <p className="text-xs text-center text-muted-foreground">
            {t('securityNote')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <LoadingSpinner size="xl" className="text-primary" />
          </div>
        </div>
      }>
        <WelcomeForm />
      </Suspense>
    </ErrorBoundary>
  );
}
