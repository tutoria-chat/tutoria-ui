'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from './auth-provider';
import { useTranslations } from 'next-intl';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations('auth.login');

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(email, password);
      
      if (result.success) {
        router.push('/dashboard');
      } else {
        setError(result.error || t('loginFailed'));
      }
    } catch (error) {
      setError(t('unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
        <CardTitle className="text-2xl font-bold text-center">
          {t('title')}
        </CardTitle>
        <CardDescription className="text-center text-base">
          {t('description')}
        </CardDescription>
        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
          <p className="text-blue-900 dark:text-blue-100 font-medium mb-1">
            {t('instructionsTitle')}
          </p>
          <ul className="text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
            <li>
              {t.rich('instructionUsername', {
                strong: (chunks) => <strong>{chunks}</strong>
              })}
            </li>
            <li>
              {t.rich('instructionPassword', {
                strong: (chunks) => <strong>{chunks}</strong>
              })}
            </li>
            <li>{t('instructionFirstAccess')}</li>
          </ul>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField>
            <FormItem>
              <FormLabel htmlFor="email">{t('emailLabel')}</FormLabel>
              <Input
                id="email"
                type="text"
                placeholder={t('emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </FormItem>
          </FormField>

          <FormField>
            <FormItem>
              <FormLabel htmlFor="password">{t('passwordLabel')}</FormLabel>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t('passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pr-10 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden [&::-webkit-credentials-auto-fill-button]:hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </FormItem>
          </FormField>

          {error && (
            <FormMessage>
              {error}
            </FormMessage>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? t('submitting') : t('submitButton')}
          </Button>
        </form>

        {/* <div className="mt-4 text-center text-sm space-y-2">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-left">
            <p className="text-blue-900 font-medium text-sm mb-2">🧪 Contas de Demonstração (Senha: admin)</p>
            <div className="space-y-1 text-xs text-blue-700">
              <div className="flex justify-between">
                <code className="bg-blue-100 px-2 py-1 rounded">admin</code>
                <span className="text-blue-600">Super Admin - Acesso Total</span>
              </div>
              <div className="flex justify-between">
                <code className="bg-blue-100 px-2 py-1 rounded">professor</code>
                <span className="text-blue-600">Admin Professor - Universidade</span>
              </div>
              <div className="flex justify-between">
                <code className="bg-blue-100 px-2 py-1 rounded">teacher</code>
                <span className="text-blue-600">Professor Regular - Disciplinas</span>
              </div>
            </div>
          </div>
          
          <Link 
            href="/forgot-password" 
            className="text-primary hover:underline inline-block"
          >
            Esqueceu sua senha?
          </Link>
        </div> */}

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>{t('copyright', { year: new Date().getFullYear() })}</p>
        </div>
      </CardContent>
    </Card>
  );
}