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
import { formatCNPJ, formatBrazilianPhone, formatCEP, fetchViaCEP } from '@/lib/utils';
import { ArrowLeft, Loader2, Search } from 'lucide-react';
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

  // Separate address fields
  const [addressFields, setAddressFields] = useState({
    cep: '',
    street: '',
    streetNumber: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingCEP, setIsFetchingCEP] = useState(false);

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

  const handleAddressFieldChange = (field: keyof typeof addressFields, value: string) => {
    setAddressFields(prev => ({ ...prev, [field]: value }));
  };

  const handleCEPChange = async (value: string) => {
    const formatted = formatCEP(value);
    handleAddressFieldChange('cep', formatted);

    // Only fetch when we have exactly 8 digits
    const cleanCEP = formatted.replace(/\D/g, '');
    if (cleanCEP.length === 8) {
      setIsFetchingCEP(true);
      try {
        const data = await fetchViaCEP(cleanCEP);
        if (data) {
          // Auto-populate fields from ViaCEP, but keep them editable
          setAddressFields(prev => ({
            ...prev,
            street: data.logradouro || prev.street,
            neighborhood: data.bairro || prev.neighborhood,
            city: data.localidade || prev.city,
            state: data.uf || prev.state,
            complement: data.complemento || prev.complement,
          }));
        }
      } catch (error) {
        console.error('Failed to fetch CEP:', error);
      } finally {
        setIsFetchingCEP(false);
      }
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

    // Concatenate address fields into single address string
    const addressParts = [
      addressFields.street,
      addressFields.streetNumber,
      addressFields.complement,
      addressFields.neighborhood,
      addressFields.city,
      addressFields.state,
      addressFields.cep,
    ].filter(Boolean); // Remove empty values

    const fullAddress = addressParts.join(', ');

    setIsLoading(true);
    try {
      await apiClient.createUniversity({
        ...formData,
        address: fullAddress || formData.address,
      });
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
                  {/* CEP Lookup */}
                  <div>
                    <label htmlFor="cep" className="block text-sm font-medium mb-1">
                      {t('cepLabel')}
                    </label>
                    <div className="relative">
                      <Input
                        id="cep"
                        type="text"
                        value={addressFields.cep}
                        onChange={(e) => handleCEPChange(e.target.value)}
                        placeholder={t('cepPlaceholder')}
                        maxLength={9}
                      />
                      {isFetchingCEP && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('cepHelpText')}
                    </p>
                  </div>

                  {/* Street and Number */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label htmlFor="street" className="block text-sm font-medium mb-1">
                        {t('streetLabel')}
                      </label>
                      <Input
                        id="street"
                        type="text"
                        value={addressFields.street}
                        onChange={(e) => handleAddressFieldChange('street', e.target.value)}
                        placeholder={t('streetPlaceholder')}
                        maxLength={200}
                      />
                    </div>
                    <div>
                      <label htmlFor="streetNumber" className="block text-sm font-medium mb-1">
                        {t('streetNumberLabel')}
                      </label>
                      <Input
                        id="streetNumber"
                        type="text"
                        value={addressFields.streetNumber}
                        onChange={(e) => handleAddressFieldChange('streetNumber', e.target.value)}
                        placeholder={t('streetNumberPlaceholder')}
                        maxLength={20}
                      />
                    </div>
                  </div>

                  {/* Complement */}
                  <div>
                    <label htmlFor="complement" className="block text-sm font-medium mb-1">
                      {t('complementLabel')}
                    </label>
                    <Input
                      id="complement"
                      type="text"
                      value={addressFields.complement}
                      onChange={(e) => handleAddressFieldChange('complement', e.target.value)}
                      placeholder={t('complementPlaceholder')}
                      maxLength={100}
                    />
                  </div>

                  {/* Neighborhood, City, State */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="neighborhood" className="block text-sm font-medium mb-1">
                        {t('neighborhoodLabel')}
                      </label>
                      <Input
                        id="neighborhood"
                        type="text"
                        value={addressFields.neighborhood}
                        onChange={(e) => handleAddressFieldChange('neighborhood', e.target.value)}
                        placeholder={t('neighborhoodPlaceholder')}
                        maxLength={100}
                      />
                    </div>
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium mb-1">
                        {t('cityLabel')}
                      </label>
                      <Input
                        id="city"
                        type="text"
                        value={addressFields.city}
                        onChange={(e) => handleAddressFieldChange('city', e.target.value)}
                        placeholder={t('cityPlaceholder')}
                        maxLength={100}
                      />
                    </div>
                    <div>
                      <label htmlFor="state" className="block text-sm font-medium mb-1">
                        {t('stateLabel')}
                      </label>
                      <Input
                        id="state"
                        type="text"
                        value={addressFields.state}
                        onChange={(e) => handleAddressFieldChange('state', e.target.value)}
                        placeholder={t('statePlaceholder')}
                        maxLength={2}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="taxId" className="block text-sm font-medium mb-1">
                      {t('taxIdLabel')}
                    </label>
                    <Input
                      id="taxId"
                      type="text"
                      value={formData.taxId}
                      onChange={(e) => handleChange('taxId', formatCNPJ(e.target.value))}
                      placeholder={t('taxIdPlaceholder')}
                      maxLength={18}
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
                      onChange={(e) => handleChange('contactPhone', formatBrazilianPhone(e.target.value))}
                      placeholder={t('contactPhonePlaceholder')}
                      maxLength={15}
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