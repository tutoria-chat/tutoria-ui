'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Check, X, Loader2, CreditCard, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading-spinner';
import { useAuth } from '@/components/auth/auth-provider';
import { useFetch } from '@/lib/hooks';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Subscription, Plan, UniversityLimits, BreadcrumbItem, SubscriptionStatus } from '@/lib/types';
import { toast } from 'sonner';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';

function UsageMeter({ label, current, max }: { label: string; current: number; max: number }) {
  const percentage = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className={cn(
          'font-mono',
          isAtLimit ? 'text-destructive' : isNearLimit ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
        )}>
          {current} / {max}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            isAtLimit ? 'bg-destructive' : isNearLimit ? 'bg-amber-500' : 'bg-primary'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: SubscriptionStatus }) {
  const t = useTranslations('subscription.status');
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    active: 'default',
    trialing: 'outline',
    past_due: 'destructive',
    canceled: 'secondary',
    incomplete: 'secondary',
    expired: 'destructive',
  };

  return (
    <Badge variant={variants[status] || 'secondary'}>
      {t(status)}
    </Badge>
  );
}

function FeatureCheck({ included, label }: { included: boolean; label: string }) {
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

export default function SubscriptionPage() {
  const { user } = useAuth();
  const t = useTranslations('subscription');
  const tCommon = useTranslations('common');
  const { confirm, dialog } = useConfirmDialog();
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);

  const { data: subscription, loading: loadingSub } = useFetch<Subscription>('/api/subscriptions/current');
  const { data: limits, loading: loadingLimits } = useFetch<UniversityLimits>('/api/subscriptions/limits');
  const { data: plans, loading: loadingPlans } = useFetch<Plan[]>('/api/plans/');

  const breadcrumbs: BreadcrumbItem[] = [
    { label: t('title'), isCurrentPage: true }
  ];

  const isLoading = loadingSub || loadingLimits || loadingPlans;

  if (isLoading) {
    return <Loading />;
  }

  const currentPlan = subscription?.plan;
  const allPlans = plans || [];
  const currentLimits = limits;

  const handleUpgrade = async (planSlug: string) => {
    setIsUpgrading(planSlug);
    try {
      const result = await apiClient.createCheckoutSession(planSlug);
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      }
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      toast.error(t('upgradeError'));
    } finally {
      setIsUpgrading(null);
    }
  };

  const handleCancel = () => {
    confirm({
      title: t('cancelConfirm'),
      description: t('cancelConfirmDesc'),
      variant: 'destructive',
      confirmText: t('cancelSubscriptionButton'),
      cancelText: tCommon('buttons.cancel'),
      onConfirm: async () => {
        setIsCanceling(true);
        try {
          await apiClient.cancelSubscription();
          toast.success(t('cancelSuccess'));
          window.location.reload();
        } catch (error) {
          console.error('Failed to cancel subscription:', error);
          toast.error(t('cancelError'));
        } finally {
          setIsCanceling(false);
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        breadcrumbs={breadcrumbs}
      />

      {/* Current Plan & Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {t('currentPlan')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">{currentPlan?.name || currentLimits?.planName || t('noPlan')}</h3>
                {subscription && (
                  <StatusBadge status={subscription.status} />
                )}
              </div>
              {currentPlan && (
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    R$ {currentPlan.monthlyPriceBRL.toLocaleString('pt-BR')}
                  </div>
                  <div className="text-sm text-muted-foreground">/{t('month')}</div>
                </div>
              )}
            </div>

            {subscription?.currentPeriodEnd && (
              <p className="text-sm text-muted-foreground">
                {t('renewsOn', { date: new Date(subscription.currentPeriodEnd).toLocaleDateString() })}
              </p>
            )}

            {subscription?.trialEndsAt && subscription.status === 'trialing' && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {t('trialEnds', { date: new Date(subscription.trialEndsAt).toLocaleDateString() })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Meters */}
        <Card>
          <CardHeader>
            <CardTitle>{t('usage')}</CardTitle>
            <CardDescription>{t('usageDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentLimits && (
              <>
                <UsageMeter
                  label={t('coursesUsed')}
                  current={currentLimits.currentCourses}
                  max={currentLimits.maxCourses}
                />
                <UsageMeter
                  label={t('modulesUsed')}
                  current={currentLimits.currentModules}
                  max={currentLimits.maxModules}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feature Checklist */}
      {currentLimits && (
        <Card>
          <CardHeader>
            <CardTitle>{t('includedFeatures')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <FeatureCheck included={true} label={t('features.aiTutoring')} />
              <FeatureCheck included={true} label={t('features.fileUpload')} />
              <FeatureCheck included={true} label={t('features.courses', { count: currentLimits.maxCourses })} />
              <FeatureCheck included={true} label={t('features.modules', { count: currentLimits.maxModules })} />
              <FeatureCheck included={currentLimits.hasAIQuizzes} label={t('features.aiQuizzes')} />
              <FeatureCheck included={currentLimits.hasWhatsApp} label={t('features.whatsapp')} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan Comparison Cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4">{t('allPlans')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {allPlans.filter(p => !p.isCustom).map((plan) => {
            const isCurrent = currentPlan?.slug === plan.slug || currentLimits?.planSlug === plan.slug;
            const isDowngrade = currentPlan && plan.monthlyPriceBRL < currentPlan.monthlyPriceBRL;

            return (
              <Card
                key={plan.slug}
                className={cn(
                  "relative",
                  isCurrent && "border-primary ring-2 ring-primary/20"
                )}
              >
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge>{t('currentPlanBadge')}</Badge>
                  </div>
                )}
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="pt-2">
                    <span className="text-3xl font-bold">
                      R$ {plan.monthlyPriceBRL.toLocaleString('pt-BR')}
                    </span>
                    <span className="text-muted-foreground">/{t('month')}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <FeatureCheck included={true} label={t('features.courses', { count: plan.maxCourses })} />
                  <FeatureCheck included={true} label={t('features.modules', { count: plan.maxModules })} />
                  <FeatureCheck included={plan.hasAIQuizzes} label={t('features.aiQuizzes')} />
                  <FeatureCheck included={plan.hasWhatsApp} label={t('features.whatsapp')} />
                  <FeatureCheck included={plan.hasPrioritySupport} label={t('features.prioritySupport')} />
                  <FeatureCheck included={plan.hasCustomModelConfig} label={t('features.customModels')} />

                  <div className="pt-4">
                    {isCurrent ? (
                      <Button variant="outline" className="w-full" disabled>
                        {t('currentPlanBadge')}
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        variant={isDowngrade ? 'outline' : 'default'}
                        onClick={() => handleUpgrade(plan.slug)}
                        disabled={isUpgrading === plan.slug}
                      >
                        {isUpgrading === plan.slug && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isDowngrade ? t('downgrade') : t('upgrade')}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Cancel Subscription */}
      {subscription && subscription.status !== 'canceled' && subscription.status !== 'expired' && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {t('dangerZone')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{t('cancelDescription')}</p>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isCanceling}
            >
              {isCanceling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('cancelSubscriptionButton')}
            </Button>
          </CardContent>
        </Card>
      )}

      {dialog}
    </div>
  );
}
