'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SuperAdminOnly } from '@/components/auth/role-guard';
import { apiClient } from '@/lib/api';
import { Shield, Copy, Check, Mail, AlertCircle } from 'lucide-react';
import type { BreadcrumbItem } from '@/lib/types';
import { toast } from 'sonner';

export default function CreateSuperAdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [resetLink, setResetLink] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [newUser, setNewUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Administração', href: '/admin' },
    { label: 'Super Administradores', href: '/admin/super-admins' },
    { label: 'Criar Super Administrador', isCurrentPage: true }
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) newErrors.username = 'Nome de usuário é obrigatório';
    if (!formData.email.trim()) newErrors.email = 'Email é obrigatório';
    if (!formData.first_name.trim()) newErrors.first_name = 'Primeiro nome é obrigatório';
    if (!formData.last_name.trim()) newErrors.last_name = 'Sobrenome é obrigatório';
    if (!formData.password.trim()) newErrors.password = 'Senha temporária é obrigatória';
    if (formData.password.length < 6) newErrors.password = 'Senha deve ter pelo menos 6 caracteres';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    setLoading(true);

    try {
      // Create super admin
      const response = await apiClient.createSuperAdmin(formData);

      setNewUser(response);

      // Generate reset link (in production, backend would return this)
      const resetToken = 'temp-token-' + Math.random().toString(36).substring(7);
      const link = `${window.location.origin}/setup-password?token=${resetToken}&username=${formData.username}`;
      setResetLink(link);

      setShowSuccess(true);
      toast.success('Super administrador criado com sucesso!');
    } catch (error: any) {
      console.error('Error creating super admin:', error);
      toast.error(error.message || 'Erro ao criar super administrador');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(resetLink);
      setCopiedLink(true);
      toast.success('Link copiado para a área de transferência!');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      toast.error('Erro ao copiar link');
    }
  };

  if (showSuccess) {
    return (
      <SuperAdminOnly>
        <div className="space-y-6">
          <PageHeader
            title="Super Administrador Criado!"
            description="Compartilhe o link de configuração com o novo super administrador"
            breadcrumbs={breadcrumbs}
          />

          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-900 flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                ✅ Super Administrador Criado com Sucesso
              </CardTitle>
              <CardDescription className="text-green-700">
                O super administrador <strong>{newUser?.first_name} {newUser?.last_name}</strong> foi criado.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-green-900">Nome de Usuário</Label>
                <div className="mt-1 p-2 bg-white rounded border border-green-200">
                  <code className="text-sm">{formData.username}</code>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-green-900">Email</Label>
                <div className="mt-1 p-2 bg-white rounded border border-green-200 flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  <code className="text-sm">{formData.email}</code>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900">🔗 Link de Configuração de Senha</CardTitle>
              <CardDescription className="text-blue-700">
                Compartilhe este link com o novo super administrador para que ele possa definir sua senha.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-900">
                  <strong>⏱️ Este link expira em 72 horas.</strong> Certifique-se de compartilhar com o usuário o mais rápido possível.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-blue-900">Link de Configuração</Label>
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
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copiar Link
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-white rounded border border-blue-200">
                <p className="text-sm text-blue-900 font-medium mb-2">📋 Como compartilhar:</p>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Envie via email para <strong>{formData.email}</strong></li>
                  <li>Compartilhe via Slack, Teams ou WhatsApp</li>
                  <li>Entregue pessoalmente em formato digital seguro</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <div className="flex space-x-4">
            <Button onClick={() => router.push('/admin/super-admins')} variant="outline">
              Voltar para Lista
            </Button>
            <Button onClick={() => {
              setShowSuccess(false);
              setFormData({
                username: '',
                email: '',
                first_name: '',
                last_name: '',
                password: '',
              });
              setResetLink('');
              setNewUser(null);
            }}>
              Criar Outro Super Administrador
            </Button>
          </div>
        </div>
      </SuperAdminOnly>
    );
  }

  return (
    <SuperAdminOnly>
      <div className="space-y-6">
        <PageHeader
          title="Criar Super Administrador"
          description="Crie uma nova conta de super administrador com acesso completo ao sistema"
          breadcrumbs={breadcrumbs}
        />

        <Alert className="border-amber-200 bg-amber-50">
          <Shield className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-900">
            <strong>⚠️ Aviso de Segurança:</strong> Super administradores têm acesso completo ao sistema.
            Crie contas apenas para indivíduos confiáveis.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Informações do Super Administrador</CardTitle>
              <CardDescription>
                Preencha os dados do novo super administrador. Um link de configuração de senha será gerado após a criação.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Primeiro Nome *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="Ex: João"
                  />
                  {errors.first_name && (
                    <p className="text-sm text-destructive">{errors.first_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">Sobrenome *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="Ex: Silva"
                  />
                  {errors.last_name && (
                    <p className="text-sm text-destructive">{errors.last_name}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Nome de Usuário *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Ex: joao.silva"
                />
                {errors.username && (
                  <p className="text-sm text-destructive">{errors.username}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Será usado para login. Use apenas letras, números, pontos e underscores.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Ex: joao.silva@universidade.edu.br"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha Temporária *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Esta senha será usada para gerar o link de configuração. O usuário definirá sua própria senha.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex space-x-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/super-admins')}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Super Administrador'}
            </Button>
          </div>
        </form>
      </div>
    </SuperAdminOnly>
  );
}
