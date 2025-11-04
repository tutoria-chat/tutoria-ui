'use client';

import React, { lazy, Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Building2,
  BookOpen,
  Users,
  Key,
  Plus,
  Activity,
  Bot,
  DollarSign,
  MessageSquare,
  UserCheck,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { SuperAdminOnly, AdminOnly, ProfessorOnly } from '@/components/auth/role-guard';
import { getUserRoleDisplayName } from '@/lib/permissions';
import { apiClient } from '@/lib/api';
import type {
  UsageAnalyticsSummaryResponseDto,
  UsageStatsDto,
  TodayCostDto,
  UsageTrendsResponseDto,
  UnifiedDashboardResponseDto
} from '@/lib/types';

// Lazy load analytics components
const StatsCard = lazy(() => import('@/components/analytics/stats-card').then(mod => ({ default: mod.StatsCard })));
const UsageTrendsChart = lazy(() => import('@/components/analytics/usage-trends-chart').then(mod => ({ default: mod.UsageTrendsChart })));
const TodayMetrics = lazy(() => import('@/components/analytics/today-metrics').then(mod => ({ default: mod.TodayMetrics })));

export default function DashboardPage() {
  const { user } = useAuth();
  const t = useTranslations('dashboard');
  const tAnalytics = useTranslations('analytics');

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<UsageAnalyticsSummaryResponseDto | null>(null);
  const [trends, setTrends] = useState<UsageTrendsResponseDto | null>(null);
  const [todayUsage, setTodayUsage] = useState<UsageStatsDto | null>(null);
  const [todayCost, setTodayCost] = useState<TodayCostDto | null>(null);

  const isAdmin = user?.role === 'super_admin' || (user?.role === 'professor' && user?.isAdmin);
  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    if (!user || !isAdmin) {
      setLoading(false);
      return;
    }

    const loadDashboardData = async () => {
      try {
        setLoading(true);

        // Calculate last 30 days date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const params: Record<string, string> = {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        };

        // For prof_admin, filter by their university
        if (!isSuperAdmin && user.universityId) {
          params.universityId = user.universityId.toString();
        }

        // Load all data in a single unified API call (improves performance from ~100 DynamoDB queries to ~25)
        const unifiedData = await apiClient.getAnalyticsDashboardUnified(params).catch(() => null);

        // Extract individual components from unified response
        const summaryData = unifiedData?.summary;
        const trendsData = unifiedData?.trends;
        const todayUsageData = unifiedData?.todayUsage;
        const todayCostData = unifiedData?.todayCost;

        // Transform DashboardSummaryDto to match component expectations
        if (summaryData) {
          const transformedSummary: UsageAnalyticsSummaryResponseDto = {
            totalMessages: summaryData.overview.totalMessages,
            totalCostUSD: summaryData.overview.totalCostUSD,
            uniqueStudents: summaryData.overview.uniqueStudents,
            averageResponseTime: summaryData.healthIndicators.averageResponseTime,
            comparedToPrevious: {
              messagesPercentChange: summaryData.growth.messagesGrowth,
              costPercentChange: summaryData.growth.costGrowth,
              studentsPercentChange: summaryData.growth.studentGrowth,
            },
            dailyStats: trendsData?.trends.map((trend: any) => ({
              date: trend.date,
              totalMessages: trend.messageCount,
              uniqueStudents: trend.uniqueStudents,
            })) || [],
          };
          setSummary(transformedSummary);
        } else {
          setSummary(null);
        }
        setTrends(trendsData ?? null);
        setTodayUsage(todayUsageData ?? null);
        setTodayCost(todayCostData ?? null);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user, isAdmin, isSuperAdmin]);

  if (!user) return null;

  const roleDisplayName = getUserRoleDisplayName(user.role);
  const userName = user.firstName || user.email?.split('@')[0] || t('welcome', { userName: 'User' }).split(',')[1]?.trim() || 'User';

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('welcome', { userName })}
        description={t('description', { roleDisplayName })}
      />

      {/* Quick Actions - At the top */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{t('quickActions.title')}</CardTitle>
          <CardDescription className="text-base">
            {t('quickActions.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Admin users get medium-sized centered buttons */}
          {isAdmin ? (
            <div className="flex flex-wrap justify-center gap-4">
              <SuperAdminOnly>
                <Button asChild size="lg" className="h-24 min-w-[200px] group">
                  <Link href="/universities/create" className="flex flex-col items-center justify-center gap-3">
                    <Plus className="h-10 w-10 transition-transform group-hover:scale-110 group-hover:rotate-90" />
                    <span className="font-semibold">{t('quickActions.createUniversity')}</span>
                  </Link>
                </Button>
              </SuperAdminOnly>

              <SuperAdminOnly>
                <Button asChild variant="outline" size="lg" className="h-24 min-w-[200px] group">
                  <Link href="/universities" className="flex flex-col items-center justify-center gap-3">
                    <Building2 className="h-10 w-10 transition-transform group-hover:scale-110" />
                    <span className="font-semibold">{t('quickActions.viewUniversities')}</span>
                  </Link>
                </Button>
              </SuperAdminOnly>

              <AdminOnly>
                <Button asChild size="lg" className="h-24 min-w-[200px] group">
                  <Link href="/courses/create" className="flex flex-col items-center justify-center gap-3">
                    <Plus className="h-10 w-10 transition-transform group-hover:scale-110 group-hover:rotate-90" />
                    <span className="font-semibold">{t('quickActions.createCourse')}</span>
                  </Link>
                </Button>
              </AdminOnly>

              <AdminOnly>
                <Button asChild variant="outline" size="lg" className="h-24 min-w-[200px] group">
                  <Link href="/professors" className="flex flex-col items-center justify-center gap-3">
                    <Users className="h-10 w-10 transition-transform group-hover:scale-110" />
                    <span className="font-semibold">{t('quickActions.viewProfessors')}</span>
                  </Link>
                </Button>
              </AdminOnly>

              <AdminOnly>
                <Button asChild variant="outline" size="lg" className="h-24 min-w-[200px] group">
                  <Link href="/tokens" className="flex flex-col items-center justify-center gap-3">
                    <Key className="h-10 w-10 transition-transform group-hover:scale-110 group-hover:rotate-12" />
                    <span className="font-semibold">{t('quickActions.manageAccessKeys')}</span>
                  </Link>
                </Button>
              </AdminOnly>
            </div>
          ) : (
            /* Regular professors get the large grid layout */
            <div className="grid gap-6 grid-cols-2">
              <ProfessorOnly>
                <Button asChild className="h-40 p-6 flex flex-col items-center justify-center space-y-4 text-lg group">
                  <Link href="/modules/create">
                    <Plus className="h-14 w-14 transition-transform group-hover:scale-110 group-hover:rotate-90" />
                    <span className="text-lg font-semibold">{t('quickActions.createModule')}</span>
                  </Link>
                </Button>
              </ProfessorOnly>

              <ProfessorOnly>
                <Button asChild variant="outline" className="h-40 p-6 flex flex-col items-center justify-center space-y-4 text-lg group">
                  <Link href="/courses">
                    <BookOpen className="h-14 w-14 transition-transform group-hover:scale-110" />
                    <span className="text-lg font-semibold">{t('quickActions.viewCourses')}</span>
                  </Link>
                </Button>
              </ProfessorOnly>

              <ProfessorOnly>
                <Button asChild variant="outline" className="h-40 p-6 flex flex-col items-center justify-center space-y-4 text-lg group">
                  <Link href="/modules">
                    <Activity className="h-14 w-14 transition-transform group-hover:scale-110 group-hover:rotate-12" />
                    <span className="text-lg font-semibold">{t('quickActions.viewModules')}</span>
                  </Link>
                </Button>
              </ProfessorOnly>

              <ProfessorOnly>
                <Button asChild variant="outline" className="h-40 p-6 flex flex-col items-center justify-center space-y-4 text-lg border-purple-200 hover:bg-purple-50 hover:border-purple-300 group">
                  <Link href="/professor-agent">
                    <Bot className="h-14 w-14 text-purple-600 transition-transform group-hover:scale-110 group-hover:-rotate-12" />
                    <span className="text-lg font-semibold">{t('quickActions.myAIAgent')}</span>
                  </Link>
                </Button>
              </ProfessorOnly>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards - Only for Admin Users */}
      {isAdmin && (
        <>
          {loading ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <LoadingSpinner size="xl" className="text-primary" />
            </div>
          ) : (
            <>
              {/* Stats Overview */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Suspense fallback={<LoadingSpinner />}>
                  <StatsCard
                    title={tAnalytics('summary.totalMessages')}
                    value={(summary?.totalMessages ?? 0).toLocaleString()}
                    description={tAnalytics('dashboard.last30Days')}
                    icon={MessageSquare}
                    trend={summary?.comparedToPrevious ? {
                      value: summary.comparedToPrevious.messagesPercentChange,
                      label: tAnalytics('summary.vsPrevious'),
                      isPositive: summary.comparedToPrevious.messagesPercentChange >= 0
                    } : undefined}
                  />
                </Suspense>

                <Suspense fallback={<LoadingSpinner />}>
                  <StatsCard
                    title={tAnalytics('summary.totalCost')}
                    value={`$${(summary?.totalCostUSD ?? 0).toFixed(2)}`}
                    description={tAnalytics('dashboard.last30Days')}
                    icon={DollarSign}
                    trend={summary?.comparedToPrevious ? {
                      value: summary.comparedToPrevious.costPercentChange,
                      label: tAnalytics('summary.vsPrevious'),
                      isPositive: summary.comparedToPrevious.costPercentChange <= 0
                    } : undefined}
                  />
                </Suspense>

                <Suspense fallback={<LoadingSpinner />}>
                  <StatsCard
                    title={tAnalytics('summary.uniqueStudents')}
                    value={summary?.uniqueStudents ?? 0}
                    description={tAnalytics('dashboard.last30Days')}
                    icon={UserCheck}
                    trend={summary?.comparedToPrevious ? {
                      value: summary.comparedToPrevious.studentsPercentChange,
                      label: tAnalytics('summary.vsPrevious'),
                      isPositive: summary.comparedToPrevious.studentsPercentChange >= 0
                    } : undefined}
                  />
                </Suspense>

                <Suspense fallback={<LoadingSpinner />}>
                  <StatsCard
                    title={tAnalytics('summary.avgResponseTime')}
                    value={summary?.averageResponseTime ? `${(summary.averageResponseTime / 1000).toFixed(2)}s` : 'N/A'}
                    description={tAnalytics('dashboard.last30Days')}
                    icon={TrendingUp}
                  />
                </Suspense>
              </div>

              {/* Today's Metrics */}
              <Suspense fallback={<LoadingSpinner />}>
                <TodayMetrics
                  todayUsage={todayUsage}
                  todayCost={todayCost}
                  translations={{
                    usageTitle: tAnalytics('today.usageTitle'),
                    usageDescription: tAnalytics('today.usageDescription'),
                    messages: tAnalytics('today.messages'),
                    students: tAnalytics('today.students'),
                    conversations: tAnalytics('today.conversations'),
                    avgResponseTime: tAnalytics('today.avgResponseTime'),
                    costTitle: tAnalytics('today.costTitle'),
                    costDescription: tAnalytics('today.costDescription'),
                    totalToday: tAnalytics('today.totalToday'),
                    tokens: tAnalytics('today.tokens'),
                    vsYesterday: tAnalytics('today.vsYesterday'),
                    videoTranscriptions: tAnalytics('today.videoTranscriptions'),
                    transcriptionCost: tAnalytics('today.transcriptionCost'),
                    videosTranscribed: tAnalytics('today.videosTranscribed'),
                    projectedTranscriptionCost: tAnalytics('today.projectedTranscriptionCost'),
                  }}
                />
              </Suspense>

              {/* Usage Trends Chart */}
              {trends && trends.trends && trends.trends.length > 0 && (
                <Suspense fallback={<LoadingSpinner />}>
                  <UsageTrendsChart
                    data={trends.trends.map(trend => ({
                      date: trend.date,
                      messages: trend.messageCount,
                      students: trend.uniqueStudents,
                      cost: trend.estimatedCostUSD,
                    })) || []}
                    title={tAnalytics('charts.usageTrends')}
                    description={tAnalytics('dashboard.last30DaysDescription')}
                    messagesLabel={tAnalytics('charts.messages')}
                    studentsLabel={tAnalytics('charts.students')}
                  />
                </Suspense>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}