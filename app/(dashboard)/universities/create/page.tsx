'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/layout/page-header';
import { SuperAdminOnly } from '@/components/auth/role-guard';
import { apiClient } from '@/lib/api';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { UniversityCreate, BreadcrumbItem } from '@/lib/types';

export default function CreateUniversityPage() {
  const router = useRouter();
  const t = useTranslations('universities.form');
  const tTiers = useTranslations('universities.subscription');
  const [formData, setFormData] = useState<UniversityCreate>({
    name: '',
    code: '',
    description: '',
    address: '',
    taxId: '',
    contactEmail: '',
    contactPhone: '',
    contactPerson: '',
    website: '',
    subscriptionTier: 3,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: t('breadcrumb'), href: '/universities' },
    { label: t('breadcrumbCreate'), isCurrentPage: true }
  ];

  const handleChange = (field: keyof UniversityCreate, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('nameRequired');
    }

    if (!formData.code.trim()) {
      newErrors.code = t('codeRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.createUniversity(formData);
      router.push('/universities');
    } catch (error) {
      console.error('Failed to create university:', error);
      setErrors({ submit: t('createError') });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SuperAdminOnly>
      <div className="space-y-6">
        <PageHeader
          title={t('createTitle')}
          description={t('createDescription')}
          breadcrumbs={breadcrumbs}
          actions={
            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('back')}
            </Button>
          }
        />

        <div className="flex justify-center">
          <Card className="max-w-4xl w-full">
            <CardHeader>
              <CardTitle>{t('universityInfo')}</CardTitle>
            </CardHeader>
            <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  {t('nameLabel')}
                </label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder={t('namePlaceholder')}
                  className={errors.name ? 'border-destructive' : ''}
                  maxLength={255}
                />
                {errors.name && (
                  <p className="text-sm text-destructive mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="code" className="block text-sm font-medium mb-1">
                  {t('codeLabel')}
                </label>
                <Input
                  id="code"
                  type="text"
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value)}
                  placeholder={t('codePlaceholder')}
                  className={errors.code ? 'border-destructive' : ''}
                  maxLength={50}
                  required
                />
                {errors.code && (
                  <p className="text-sm text-destructive mt-1">{errors.code}</p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1">
                  {t('descriptionLabel')}
                </label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder={t('descriptionPlaceholder')}
                  rows={4}
                />
              </div>

              {/* Subscription Tier Section */}
              <div className="pt-6 border-t">
                <h3 className="text-lg font-medium mb-4">{tTiers('title')}</h3>
                <div>
                  <label htmlFor="subscriptionTier" className="block text-sm font-medium mb-1">
                    {tTiers('tierLabel')}
                  </label>
                  <Select
                    value={formData.subscriptionTier?.toString() || '3'}
                    onValueChange={(value) => handleChange('subscriptionTier', parseInt(value))}
                  >
                    <SelectTrigger id="subscriptionTier" className="w-full">
                      <SelectValue placeholder={tTiers('selectPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">
                        <div className="flex flex-col">
                          <span className="font-medium">{tTiers('tierBasic')}</span>
                          <span className="text-sm text-muted-foreground">{tTiers('tierBasicDesc')}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="2">
                        <div className="flex flex-col">
                          <span className="font-medium">{tTiers('tierStandard')}</span>
                          <span className="text-sm text-muted-foreground">{tTiers('tierStandardDesc')}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="3">
                        <div className="flex flex-col">
                          <span className="font-medium">{tTiers('tierPremium')}</span>
                          <span className="text-sm text-muted-foreground">{tTiers('tierPremiumDesc')}</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-2">{tTiers('tierHelpText')}</p>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="pt-6 border-t">
                <h3 className="text-lg font-medium mb-4">{t('contactInfo')}</h3>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium mb-1">
                      {t('addressLabel')}
                    </label>
                    <Input
                      id="address"
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      placeholder={t('addressPlaceholder')}
                      maxLength={500}
                    />
                  </div>

                  <div>
                    <label htmlFor="taxId" className="block text-sm font-medium mb-1">
                      {t('taxIdLabel')}
                    </label>
                    <Input
                      id="taxId"
                      type="text"
                      value={formData.taxId}
                      onChange={(e) => handleChange('taxId', e.target.value)}
                      placeholder={t('taxIdPlaceholder')}
                      maxLength={20}
                    />
                  </div>

                  <div>
                    <label htmlFor="contactEmail" className="block text-sm font-medium mb-1">
                      {t('contactEmailLabel')}
                    </label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => handleChange('contactEmail', e.target.value)}
                      placeholder={t('contactEmailPlaceholder')}
                      maxLength={255}
                    />
                  </div>

                  <div>
                    <label htmlFor="contactPhone" className="block text-sm font-medium mb-1">
                      {t('contactPhoneLabel')}
                    </label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => handleChange('contactPhone', e.target.value)}
                      placeholder={t('contactPhonePlaceholder')}
                      maxLength={50}
                    />
                  </div>

                  <div>
                    <label htmlFor="contactPerson" className="block text-sm font-medium mb-1">
                      {t('contactPersonLabel')}
                    </label>
                    <Input
                      id="contactPerson"
                      type="text"
                      value={formData.contactPerson}
                      onChange={(e) => handleChange('contactPerson', e.target.value)}
                      placeholder={t('contactPersonPlaceholder')}
                      maxLength={200}
                    />
                  </div>

                  <div>
                    <label htmlFor="website" className="block text-sm font-medium mb-1">
                      {t('websiteLabel')}
                    </label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleChange('website', e.target.value)}
                      placeholder={t('websitePlaceholder')}
                      maxLength={255}
                    />
                  </div>
                </div>
              </div>

              {errors.submit && (
                <p className="text-sm text-destructive">{errors.submit}</p>
              )}

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? t('creating') : t('create')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
                >
                  {t('cancel')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        </div>
      </div>
    </SuperAdminOnly>
  );
}