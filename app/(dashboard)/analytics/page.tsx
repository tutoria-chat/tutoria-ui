'use client';

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { SectionErrorBoundary } from '@/components/ui/error-boundary';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Users, RefreshCw, Download } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { exportAnalyticsToPDF } from '@/lib/export-utils';
import type {
  AnalyticsFilterDto,
  QuestionsPerModuleDto,
  TopTopicsResponseDto,
  QuizPerformanceResponseDto,
} from '@/lib/types';

const StatsCard = lazy(() => import('@/components/analytics/stats-card').then(mod => ({ default: mod.StatsCard })));
const QuestionsPerModuleChart = lazy(() => import('@/components/analytics/questions-per-module-chart').then(m => ({ default: m.QuestionsPerModuleChart })));
const TopTopicsChart = lazy(() => import('@/components/analytics/top-topics-chart').then(m => ({ default: m.TopTopicsChart })));
const QuizHeatmap = lazy(() => import('@/components/analytics/quiz-heatmap').then(m => ({ default: m.QuizHeatmap })));
const QuizRadarChart = lazy(() => import('@/components/analytics/quiz-radar-chart').then(m => ({ default: m.QuizRadarChart })));

export default function AnalyticsPage() {
  const { user } = useAuth();
  const t = useTranslations('analytics');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    return { from: thirtyDaysAgo, to: today };
  });

  const [uniqueStudents, setUniqueStudents] = useState(0);
  const [questionsPerModule, setQuestionsPerModule] = useState<QuestionsPerModuleDto | null>(null);
  const [topTopics, setTopTopics] = useState<TopTopicsResponseDto | null>(null);
  const [quizPerformance, setQuizPerformance] = useState<QuizPerformanceResponseDto | null>(null);

  const handleDateRangeChange = (newDateRange: DateRange | undefined) => {
    if (!newDateRange?.from) {
      setDateRange(newDateRange);
      return;
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (newDateRange.from > today || (newDateRange.to && newDateRange.to > today)) {
      toast.error(t('filters.noFutureDates'));
      return;
    }

    if (newDateRange.from && newDateRange.to) {
      const daysDiff = Math.floor((newDateRange.to.getTime() - newDateRange.from.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff > 365) {
        toast.error(t('filters.maxRangeExceeded'));
        return;
      }
    }

    setDateRange(newDateRange);
  };

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const filters: AnalyticsFilterDto = {
        ...(dateRange?.from && { startDate: format(dateRange.from, 'yyyy-MM-dd') }),
        ...(dateRange?.to && { endDate: format(dateRange.to, 'yyyy-MM-dd') }),
      };

      // Load summary for unique students count
      const summaryData = await apiClient.getAnalyticsDashboardSummary(filters);
      setUniqueStudents(summaryData?.overview?.uniqueStudents ?? 0);

      // Load the 3 pre-computed panels (non-blocking)
      apiClient.getAnalyticsQuestionsPerModule(filters).then(setQuestionsPerModule).catch(() => {});
      apiClient.getAnalyticsTopTopics(filters).then(setTopTopics).catch(() => {});
      apiClient.getAnalyticsQuizPerformance().then(setQuizPerformance).catch(() => {});
    } catch (error: any) {
      console.error('Error loading analytics:', error);
      toast.error(`${t('loadError')}: ${error?.message ?? 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
    toast.success(t('refreshSuccess'));
  };

  const handleExportPDF = () => {
    exportAnalyticsToPDF({
      summary: { overview: { uniqueStudents, totalMessages: 0, activeModules: 0, activeCourses: 0, totalCostUSD: 0 } } as any,
      todayUsage: null,
      todayCost: null,
      frequentQuestions: [],
      topStudents: [],
      period: dateRange ? 'custom' : 'month',
      dateRange: dateRange?.from && dateRange?.to ? { start: dateRange.from, end: dateRange.to } : undefined,
      translations: {
        title: t('export.title'),
        period: t('export.period'),
        dateRange: t('export.dateRange'),
        generated: t('export.generated'),
        university: t('export.university'),
        overviewTitle: t('export.overviewTitle'),
        metric: t('export.metric'),
        value: t('export.value'),
        totalMessages: t('export.totalMessages'),
        uniqueStudents: t('export.uniqueStudents'),
        activeModules: t('export.activeModules'),
        activeCourses: t('export.activeCourses'),
        estimatedCost: t('export.estimatedCost'),
        todayUsageTitle: t('export.todayUsageTitle'),
        messages: t('export.messages'),
        students: t('export.students'),
        conversations: t('export.conversations'),
        avgResponseTime: t('export.avgResponseTime'),
        todayCostTitle: t('export.todayCostTitle'),
        totalCost: t('export.totalCost'),
        totalTokens: t('export.totalTokens'),
        frequentQuestionsTitle: t('export.frequentQuestionsTitle'),
        question: t('export.question'),
        count: t('export.count'),
        percentage: t('export.percentage'),
        topStudentsTitle: t('export.topStudentsTitle'),
        studentName: t('export.studentName'),
        email: t('export.email'),
        tokens: t('export.tokens'),
        cost: t('export.cost'),
      }
    });
    toast.success(t('exportSuccess', { format: 'PDF' }));
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="xl" className="text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <PageHeader
          title={t('title')}
          description={t('description')}
        />

        <div className="flex flex-wrap items-center gap-4 mt-6">
          <DateRangePicker date={dateRange} onDateChange={handleDateRangeChange} />

          <Button onClick={handleExportPDF} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>

          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {t('refresh')}
          </Button>
        </div>
      </div>

      {/* How many students asked */}
      <Suspense fallback={<LoadingSpinner />}>
        <div className="grid gap-4 md:grid-cols-3">
          <StatsCard
            title={t('stats.uniqueStudents')}
            value={uniqueStudents.toLocaleString()}
            description={t('stats.studentsDescription')}
            icon={Users}
          />
        </div>
      </Suspense>

      {/* Questions per module */}
      {questionsPerModule && questionsPerModule.modules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('questionsPerModule')}</CardTitle>
            <CardDescription>{t('questionsPerModuleDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <SectionErrorBoundary title="Failed to load questions per module">
              <Suspense fallback={<div className="h-[300px] animate-pulse bg-muted rounded" />}>
                <QuestionsPerModuleChart data={questionsPerModule.modules} />
              </Suspense>
            </SectionErrorBoundary>
          </CardContent>
        </Card>
      )}

      {/* Most demanded topics */}
      {topTopics && topTopics.topics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('mostDemandedTopics')}</CardTitle>
            <CardDescription>{t('mostDemandedTopicsDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <SectionErrorBoundary title="Failed to load top topics">
              <Suspense fallback={<div className="h-[350px] animate-pulse bg-muted rounded" />}>
                <TopTopicsChart data={topTopics.topics} />
              </Suspense>
            </SectionErrorBoundary>
          </CardContent>
        </Card>
      )}

      {/* Quiz results: heatmap + radar */}
      {quizPerformance && quizPerformance.concepts.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('quizHeatmap')}</CardTitle>
              <CardDescription>{t('quizHeatmapDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <SectionErrorBoundary title="Failed to load quiz heatmap">
                <Suspense fallback={<div className="h-[300px] animate-pulse bg-muted rounded" />}>
                  <QuizHeatmap data={quizPerformance.concepts} />
                </Suspense>
              </SectionErrorBoundary>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t('quizRadar')}</CardTitle>
              <CardDescription>{t('quizRadarDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <SectionErrorBoundary title="Failed to load quiz radar">
                <Suspense fallback={<div className="h-[350px] animate-pulse bg-muted rounded" />}>
                  <QuizRadarChart data={quizPerformance.concepts} />
                </Suspense>
              </SectionErrorBoundary>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
