'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MailCheck, ArrowLeft, Send } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiClient } from '@/lib/api';
import { useTranslations } from 'next-intl';

export default function ForgotPasswordPage() {
  const t = useTranslations('forgotPassword');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await apiClient.requestPasswordReset(email.trim());
      setSubmitted(true);
    } catch (err: unknown) {
      // Always show success to avoid user-enumeration (don't reveal if email exists),
      // but surface genuine network/server errors so the user can retry.
      const message = err instanceof Error ? err.message.toLowerCase() : '';
      if (message.includes('network') || message.includes('timed out')) {
        setError(t('errorGeneric'));
      } else {
        // Treat any other error the same as success to prevent user-enumeration.
        setSubmitted(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4">
            <div className="flex justify-center">
              <Image
                src="/Color_01.png"
                alt="Tutoria Logo"
                width={200}
                height={72}
                priority
                quality={100}
                sizes="200px"
                className="h-16 w-auto"
              />
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-full bg-primary/10 p-3">
                <MailCheck className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-xl text-center">{t('successTitle')}</CardTitle>
              <CardDescription className="text-center">{t('successDesc')}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('backToLogin')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <Image
              src="/Color_01.png"
              alt="Tutoria Logo"
              width={200}
              height={72}
              priority
              quality={100}
              sizes="200px"
              className="h-16 w-auto"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-center">{t('title')}</CardTitle>
          <CardDescription className="text-center">{t('description')}</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('emailLabel')}</Label>
              <Input
                id="email"
                type="text"
                placeholder={t('emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading || !email.trim()}>
              {isLoading ? (
                t('submitting')
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {t('submitButton')}
                </>
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t('backToLogin')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
