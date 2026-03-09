'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Eye, EyeOff, Check, X, Loader2, Building2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import type { Plan } from '@/lib/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Fallback plans when API is unavailable
// Pricing: courses × 350 × 2.5/mo, MaxStudents: courses × 350
// Professional: 5% discount, Business: 10% discount
const FALLBACK_PLANS: Plan[] = [
  {
    id: 1,
    name: 'Starter',
    slug: 'starter',
    description: 'Ideal para pequenas instituicoes ou departamentos',
    monthlyPriceBRL: 2625,
    maxCourses: 3,
    maxModules: 12,
    maxStudents: 1050,
    hasAIQuizzes: false,
    hasWhatsApp: false,
    hasPrioritySupport: false,
    hasCustomModelConfig: false,
    trialDays: 30,
    isCustom: false,
    displayOrder: 1,
    isActive: true,
  },
  {
    id: 2,
    name: 'Professional',
    slug: 'professional',
    description: 'Para instituicoes de medio porte com quizzes IA',
    monthlyPriceBRL: 6650,
    maxCourses: 8,
    maxModules: 32,
    maxStudents: 2800,
    hasAIQuizzes: true,
    hasWhatsApp: false,
    hasPrioritySupport: false,
    hasCustomModelConfig: false,
    trialDays: 30,
    isCustom: false,
    displayOrder: 2,
    isActive: true,
  },
  {
    id: 3,
    name: 'Business',
    slug: 'business',
    description: 'Para grandes instituicoes com acesso completo',
    monthlyPriceBRL: 15750,
    maxCourses: 20,
    maxModules: 80,
    maxStudents: 7000,
    hasAIQuizzes: true,
    hasWhatsApp: true,
    hasPrioritySupport: true,
    hasCustomModelConfig: true,
    trialDays: 30,
    isCustom: false,
    displayOrder: 3,
    isActive: true,
  },
];

function FeatureItem({ included, label }: { included: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {included ? (
        <Check className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
      ) : (
        <X className="h-4 w-4 text-muted-foreground/50 shrink-0" />
      )}
      <span className={cn(!included && 'text-muted-foreground/50')}>
        {label}
      </span>
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const t = useTranslations('signup');

  const [plans, setPlans] = useState<Plan[]>(FALLBACK_PLANS);
  const [selectedPlan, setSelectedPlan] = useState<string>('professional');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    universityName: '',
    universityCode: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch plans from API
  useEffect(() => {
    async function fetchPlans() {
      try {
        const data = await apiClient.getPlans();
        if (data && data.length > 0) {
          setPlans(data);
        }
      } catch (err) {
        // Use fallback plans if API fails
        console.log('Using fallback plans');
      }
    }
    fetchPlans();
  }, []);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.universityName.trim()) {
      newErrors.universityName = t('form.universityNameRequired');
    }
    if (!formData.universityCode.trim()) {
      newErrors.universityCode = t('form.universityCodeRequired');
    }
    if (!formData.email.trim()) {
      newErrors.email = t('form.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('form.emailInvalid');
    }
    if (!formData.password.trim()) {
      newErrors.password = t('form.passwordRequired');
    } else if (formData.password.length < 8) {
      newErrors.password = t('form.passwordTooShort');
    }
    if (!formData.firstName.trim()) {
      newErrors.firstName = t('form.firstNameRequired');
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = t('form.lastNameRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const result = await apiClient.registerUniversity({
        universityName: formData.universityName,
        universityCode: formData.universityCode,
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        planSlug: selectedPlan,
      });

      if (result.checkoutUrl) {
        // Redirect to Stripe checkout
        window.location.href = result.checkoutUrl;
      } else {
        toast.success(t('registrationSuccess'));
        router.push('/login');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('registrationError');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPlanData = plans.find(p => p.slug === selectedPlan);

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <Link href="/login" className="inline-block">
            <Image
              src="/Color_01.png"
              alt="Tutoria Logo"
              width={4008}
              height={1438}
              priority
              className="h-16 w-auto mx-auto"
            />
          </Link>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">{t('description')}</p>
        </div>

        {/* Plan Selection Cards */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-center">{t('selectPlan')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.filter(p => !p.isCustom).map((plan) => (
              <Card
                key={plan.slug}
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:shadow-md",
                  selectedPlan === plan.slug
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50"
                )}
                onClick={() => setSelectedPlan(plan.slug)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    {plan.slug === 'professional' && (
                      <Badge>{t('popular')}</Badge>
                    )}
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="pt-2">
                    <span className="text-3xl font-bold">
                      R$ {plan.monthlyPriceBRL.toLocaleString('pt-BR')}
                    </span>
                    <span className="text-muted-foreground">/{t('month')}</span>
                  </div>
                  {plan.trialDays > 0 && (
                    <p className="text-sm text-green-600 dark:text-green-400">
                      {t('trialDays', { days: plan.trialDays })}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  <FeatureItem included={true} label={t('features.courses', { count: plan.maxCourses })} />
                  <FeatureItem included={true} label={t('features.modules', { count: plan.maxModules })} />
                  {plan.maxStudents && (
                    <FeatureItem included={true} label={t('features.students', { count: plan.maxStudents.toLocaleString('pt-BR') })} />
                  )}
                  <FeatureItem included={plan.hasAIQuizzes} label={t('features.aiQuizzes')} />
                  <FeatureItem included={plan.hasWhatsApp} label={t('features.whatsapp')} />
                  <FeatureItem included={plan.hasPrioritySupport} label={t('features.prioritySupport')} />
                  <FeatureItem included={plan.hasCustomModelConfig} label={t('features.customModels')} />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Registration Form */}
        <div className="flex justify-center">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {t('form.title')}
              </CardTitle>
              <CardDescription>{t('form.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* University Details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    {t('form.universitySection')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField>
                      <FormItem>
                        <FormLabel htmlFor="universityName">{t('form.universityNameLabel')}</FormLabel>
                        <Input
                          id="universityName"
                          value={formData.universityName}
                          onChange={(e) => handleChange('universityName', e.target.value)}
                          placeholder={t('form.universityNamePlaceholder')}
                          className={errors.universityName ? 'border-destructive' : ''}
                          disabled={isLoading}
                        />
                        {errors.universityName && <FormMessage>{errors.universityName}</FormMessage>}
                      </FormItem>
                    </FormField>

                    <FormField>
                      <FormItem>
                        <FormLabel htmlFor="universityCode">{t('form.universityCodeLabel')}</FormLabel>
                        <Input
                          id="universityCode"
                          value={formData.universityCode}
                          onChange={(e) => handleChange('universityCode', e.target.value)}
                          placeholder={t('form.universityCodePlaceholder')}
                          className={errors.universityCode ? 'border-destructive' : ''}
                          disabled={isLoading}
                        />
                        {errors.universityCode && <FormMessage>{errors.universityCode}</FormMessage>}
                      </FormItem>
                    </FormField>
                  </div>
                </div>

                {/* Admin User Details */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    {t('form.adminSection')}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField>
                      <FormItem>
                        <FormLabel htmlFor="firstName">{t('form.firstNameLabel')}</FormLabel>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => handleChange('firstName', e.target.value)}
                          placeholder={t('form.firstNamePlaceholder')}
                          className={errors.firstName ? 'border-destructive' : ''}
                          disabled={isLoading}
                        />
                        {errors.firstName && <FormMessage>{errors.firstName}</FormMessage>}
                      </FormItem>
                    </FormField>

                    <FormField>
                      <FormItem>
                        <FormLabel htmlFor="lastName">{t('form.lastNameLabel')}</FormLabel>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => handleChange('lastName', e.target.value)}
                          placeholder={t('form.lastNamePlaceholder')}
                          className={errors.lastName ? 'border-destructive' : ''}
                          disabled={isLoading}
                        />
                        {errors.lastName && <FormMessage>{errors.lastName}</FormMessage>}
                      </FormItem>
                    </FormField>
                  </div>

                  <FormField>
                    <FormItem>
                      <FormLabel htmlFor="email">{t('form.emailLabel')}</FormLabel>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        placeholder={t('form.emailPlaceholder')}
                        className={errors.email ? 'border-destructive' : ''}
                        disabled={isLoading}
                      />
                      {errors.email && <FormMessage>{errors.email}</FormMessage>}
                    </FormItem>
                  </FormField>

                  <FormField>
                    <FormItem>
                      <FormLabel htmlFor="password">{t('form.passwordLabel')}</FormLabel>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => handleChange('password', e.target.value)}
                          placeholder={t('form.passwordPlaceholder')}
                          className={cn(
                            errors.password ? 'border-destructive' : '',
                            'pr-10 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden'
                          )}
                          disabled={isLoading}
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
                </div>

                {/* Selected Plan Summary */}
                {selectedPlanData && (
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{t('form.selectedPlan')}: {selectedPlanData.name}</p>
                        <p className="text-sm text-muted-foreground">
                          R$ {selectedPlanData.monthlyPriceBRL.toLocaleString('pt-BR')}/{t('month')}
                          {selectedPlanData.trialDays > 0 && (
                            <> - {t('trialDays', { days: selectedPlanData.trialDays })}</>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {error && <FormMessage>{error}</FormMessage>}

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? t('form.submitting') : t('form.submit')}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  {t('form.alreadyHaveAccount')}{' '}
                  <Link href="/login" className="text-primary hover:underline font-medium">
                    {t('form.loginLink')}
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
