'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from './auth-provider';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
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
        setError(result.error || 'Login failed. Please try again.');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
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
            width={200}
            height={64}
            priority
            className="h-16 w-auto"
          />
        </div>
        <CardTitle className="text-2xl font-bold text-center">
          Bem-vindo ao Tutoria
        </CardTitle>
        <CardDescription className="text-center">
          Digite suas credenciais para acessar sua conta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField>
            <FormItem>
              <FormLabel htmlFor="email">Usuário / E-mail</FormLabel>
              <Input
                id="email"
                type="text"
                placeholder="Digite seu usuário ou e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </FormItem>
          </FormField>

          <FormField>
            <FormItem>
              <FormLabel htmlFor="password">Senha</FormLabel>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
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
            {isLoading ? 'Entrando...' : 'Entrar'}
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
          <p>© 2025 Tutoria. All rights reserved.</p>
        </div>
      </CardContent>
    </Card>
  );
}