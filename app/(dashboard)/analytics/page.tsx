'use client';

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { SectionErrorBoundary } from '@/components/ui/error-boundary';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import {
  DollarSign,
  Users,
  MessageSquare,
  Activity,
  RefreshCw,
  Download,
  FileText,
  Check,
  ChevronsUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth/auth-provider';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { exportAnalyticsToCSV, exportAnalyticsToPDF } from '@/lib/export-utils';
import type {
  DashboardSummaryDto,
  UsageStatsDto,
  TodayCostDto,
  FrequentlyAskedQuestionsResponseDto,
  TopActiveStudentsResponseDto,
  UsageTrendsResponseDto,
  HourlyUsageResponseDto,
  AnalyticsFilterDto,
  University,
  Module
} from '@/lib/types';

// Lazy load heavy components for better performance
const StatsCard = lazy(() => import('@/components/analytics/stats-card').then(mod => ({ default: mod.StatsCard })));
const UsageTrendsChart = lazy(() => import('@/components/analytics/usage-trends-chart').then(mod => ({ default: mod.UsageTrendsChart })));
const CostTrendChart = lazy(() => import('@/components/analytics/cost-trend-chart').then(mod => ({ default: mod.CostTrendChart })));
const HourlyBreakdownChart = lazy(() => import('@/components/analytics/hourly-breakdown-chart').then(mod => ({ default: mod.HourlyBreakdownChart })));
const ProviderDistributionChart = lazy(() => import('@/components/analytics/provider-distribution-chart').then(mod => ({ default: mod.ProviderDistributionChart })));
const ModuleComparison = lazy(() => import('@/components/analytics/module-comparison').then(mod => ({ default: mod.ModuleComparison })));
const TodayMetrics = lazy(() => import('@/components/analytics/today-metrics').then(mod => ({ default: mod.TodayMetrics })));
const FrequentQuestions = lazy(() => import('@/components/analytics/frequent-questions').then(mod => ({ default: mod.FrequentQuestions })));
const TopStudents = lazy(() => import('@/components/analytics/top-students').then(mod => ({ default: mod.TopStudents })));

export default function AnalyticsPage() {
  const { user } = useAuth();
  const t = useTranslations('analytics');

  // Only super admins can see cost information
  const canViewCosts = user?.role === 'super_admin';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUniversityId, setSelectedUniversityId] = useState<number | undefined>(undefined);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    // Default to last 7 days
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    return {
      from: sevenDaysAgo,
      to: today
    };
  });

  const [summary, setSummary] = useState<DashboardSummaryDto | null>(null);
  const [todayUsage, setTodayUsage] = useState<UsageStatsDto | null>(null);
  const [todayCost, setTodayCost] = useState<TodayCostDto | null>(null);
  const [frequentQuestions, setFrequentQuestions] = useState<FrequentlyAskedQuestionsResponseDto | null>(null);
  const [topStudents, setTopStudents] = useState<TopActiveStudentsResponseDto | null>(null);
  const [usageTrends, setUsageTrends] = useState<UsageTrendsResponseDto | null>(null);
  const [hourlyUsage, setHourlyUsage] = useState<HourlyUsageResponseDto | null>(null);

  // Module list for comparison component
  const [availableModules, setAvailableModules] = useState<Module[]>([]);

  // University filter states
  const [universities, setUniversities] = useState<University[]>([]);
  const [universityComboOpen, setUniversityComboOpen] = useState(false);

  const isSuperAdmin = user?.role === 'super_admin';

  // Validate and handle date range changes
  const handleDateRangeChange = (newDateRange: DateRange | undefined) => {
    if (!newDateRange?.from) {
      setDateRange(newDateRange);
      return;
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    // Prevent future dates
    if (newDateRange.from > today) {
      toast.error(t('filters.noFutureDates'), {
        description: t('filters.noFutureDatesDescription')
      });
      return;
    }

    // If end date exists, validate it too
    if (newDateRange.to && newDateRange.to > today) {
      toast.error(t('filters.noFutureDates'), {
        description: t('filters.noFutureDatesDescription')
      });
      return;
    }

    // Check if range exceeds 1 year (365 days)
    if (newDateRange.from && newDateRange.to) {
      const daysDifference = Math.floor((newDateRange.to.getTime() - newDateRange.from.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDifference > 365) {
        toast.error(t('filters.maxRangeExceeded'), {
          description: t('filters.maxRangeExceededDescription')
        });
        return;
      }
    }

    setDateRange(newDateRange);
  };

  // Load universities on mount (for super admins)
  useEffect(() => {
    if (isSuperAdmin) {
      loadUniversities();
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    loadAnalytics();
    loadAvailableModules();
  }, [dateRange, selectedUniversityId]);

  const loadAvailableModules = async () => {
    try {
      const modules = await apiClient.getModules({ size: 1000 }); // Get up to 1000 modules for selection
      setAvailableModules(modules.items);
    } catch (error) {
      console.error('Error loading modules:', error);
    }
  };

  const loadUniversities = async () => {
    try {
      const response = await apiClient.getUniversities();
      setUniversities(response.items);
    } catch (error) {
      console.error('Error loading universities:', error);
      toast.error('Failed to load universities');
    }
  };

  const loadAnalytics = async () => {
    if (!user) {
      return;
    }

    try {
      setLoading(true);

      const filters: AnalyticsFilterDto = {
        ...(selectedUniversityId && { universityId: selectedUniversityId }),
        ...(dateRange?.from && { startDate: format(dateRange.from, 'yyyy-MM-dd') }),
        ...(dateRange?.to && { endDate: format(dateRange.to, 'yyyy-MM-dd') }),
      };

      // Determine period based on date range - backend needs this for some endpoints
      let period: 'day' | 'week' | 'month' | 'year' | 'all' = 'month'; // default
      if (dateRange?.from && dateRange?.to) {
        const daysDiff = Math.floor((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff === 0) period = 'day';
        else if (daysDiff <= 7) period = 'week';
        else if (daysDiff <= 31) period = 'month';
        else if (daysDiff <= 365) period = 'year';
        else period = 'year';
      }

      const [summaryData, todayUsageData, todayCostData, faqData, topStudentsData, trendsData, hourlyData] = await Promise.all([
        apiClient.getAnalyticsDashboardSummary({ ...filters, period }),
        apiClient.getAnalyticsTodayUsage(filters),
        apiClient.getAnalyticsTodayCost(filters),
        apiClient.getAnalyticsFrequentQuestions({ ...filters, limit: 10 }),
        apiClient.getAnalyticsTopActiveStudents({ ...filters, limit: 10 }),
        apiClient.getAnalyticsUsageTrends(filters),
        apiClient.getAnalyticsHourlyUsage(filters),
      ]);

      setSummary(summaryData);
      setTodayUsage(todayUsageData);
      setTodayCost(todayCostData);
      setFrequentQuestions(faqData);
      setTopStudents(topStudentsData);
      setUsageTrends(trendsData);
      setHourlyUsage(hourlyData);
    } catch (error: any) {
      console.error('Error loading analytics:', error);
      console.error('Error details:', {
        message: error?.message,
        response: error?.response,
        status: error?.status,
      });
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

  const handleExportCSV = () => {
    exportAnalyticsToCSV({
      summary,
      todayUsage,
      todayCost,
      frequentQuestions: frequentQuestions?.questions || [],
      topStudents: topStudents?.topStudents || [],
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
    toast.success(t('exportSuccess', { format: 'CSV' }));
  };

  const handleExportPDF = () => {
    exportAnalyticsToPDF({
      summary,
      todayUsage,
      todayCost,
      frequentQuestions: frequentQuestions?.questions || [],
      topStudents: topStudents?.topStudents || [],
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

  // Prepare chart data
  const trendsChartData = usageTrends?.trends.map(trend => ({
    date: format(new Date(trend.date), 'MMM dd'),
    messages: trend.messageCount,
    students: trend.uniqueStudents,
    cost: parseFloat(trend.estimatedCostUSD.toFixed(2)),
  })) || [];

  const hourlyChartData = hourlyUsage?.hourlyBreakdown.map(hour => ({
    hour: `${hour.hour}:00`,
    messages: hour.messageCount,
    students: hour.uniqueStudents,
  })) || [];

  const providerChartData = todayUsage?.messagesByProvider
    ? Object.entries(todayUsage.messagesByProvider).map(([name, value]) => ({ name, value }))
    : [];

  // Generate dynamic period label based on selected date range
  const getPeriodLabel = () => {
    if (!dateRange?.from || !dateRange?.to) {
      return t('stats.allTime');
    }

    const from = dateRange.from;
    const to = dateRange.to;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const fromDate = new Date(from);
    fromDate.setHours(0, 0, 0, 0);

    const toDate = new Date(to);
    toDate.setHours(0, 0, 0, 0);

    // Check for "Today" preset
    if (fromDate.getTime() === today.getTime() && toDate.getTime() === today.getTime()) {
      return t('stats.today');
    }

    // Check for "Yesterday" preset
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (fromDate.getTime() === yesterday.getTime() && toDate.getTime() === yesterday.getTime()) {
      return t('stats.yesterday');
    }

    // Check for "Last 7 days" preset
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    if (fromDate.getTime() === sevenDaysAgo.getTime() && toDate.getTime() === today.getTime()) {
      return t('stats.last7Days');
    }

    // Check for "Last 30 days" preset
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    if (fromDate.getTime() === thirtyDaysAgo.getTime() && toDate.getTime() === today.getTime()) {
      return t('stats.last30Days');
    }

    // Check for "Last 365 days" preset
    const yearAgo = new Date(today);
    yearAgo.setDate(yearAgo.getDate() - 365);
    if (fromDate.getTime() === yearAgo.getTime() && toDate.getTime() === today.getTime()) {
      return t('stats.last365Days');
    }

    // Custom date range - show actual dates
    return `${format(from, 'MMM dd, yyyy')} - ${format(to, 'MMM dd, yyyy')}`;
  };

  return (
    <div className="space-y-8">
      <div>
        <PageHeader
          title={t('title')}
          description={t('description')}
        />

        {/* Filters Section - Below Title */}
        <div className="flex flex-wrap items-center gap-4 mt-6">
          <DateRangePicker date={dateRange} onDateChange={handleDateRangeChange} />

          {isSuperAdmin && (
            <Popover open={universityComboOpen} onOpenChange={setUniversityComboOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={universityComboOpen}
                    className="w-[250px] justify-between"
                  >
                    {selectedUniversityId
                      ? universities.find((uni) => uni.id === selectedUniversityId)?.name || t('allUniversities')
                      : t('allUniversities')}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[250px] p-0">
                  <Command>
                    <CommandInput placeholder={t('searchUniversities')} />
                    <CommandList>
                      <CommandEmpty>{t('noUniversitiesFound')}</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all"
                          onSelect={() => {
                            setSelectedUniversityId(undefined);
                            setUniversityComboOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              !selectedUniversityId ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          {t('allUniversities')}
                        </CommandItem>
                        {universities.map((university) => (
                          <CommandItem
                            key={university.id}
                            value={university.name}
                            onSelect={() => {
                              setSelectedUniversityId(university.id);
                              setUniversityComboOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                selectedUniversityId === university.id ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            {university.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}

          <Button onClick={handleExportCSV} variant="outline" size="sm">
            <FileText className="mr-2 h-4 w-4" />
            CSV
          </Button>

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

      {/* Overview Stats */}
      <Suspense fallback={<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"><LoadingSpinner /></div>}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title={t('stats.totalMessages')}
            value={(summary?.overview?.totalMessages ?? 0).toLocaleString()}
            description={getPeriodLabel()}
            icon={MessageSquare}
          />

          <StatsCard
            title={t('stats.uniqueStudents')}
            value={(summary?.overview?.uniqueStudents ?? 0).toLocaleString()}
            description={getPeriodLabel()}
            icon={Users}
          />

          <StatsCard
            title={t('stats.activeModules')}
            value={(summary?.overview?.activeModules ?? 0).toLocaleString()}
            description={getPeriodLabel()}
            icon={Activity}
          />

          {canViewCosts && (
            <StatsCard
              title={t('stats.estimatedCost')}
              value={`$${(summary?.overview?.totalCostUSD ?? 0).toFixed(2)}`}
              description={getPeriodLabel()}
              icon={DollarSign}
            />
          )}
        </div>
      </Suspense>

      {/* Charts Row 1: Usage Trends */}
      <div className="grid gap-4 md:grid-cols-2">
        <SectionErrorBoundary title="Failed to load usage trends">
          <Suspense fallback={<LoadingSpinner />}>
            <UsageTrendsChart
              data={trendsChartData}
              title={t('charts.usageTrends')}
              description={t('charts.usageTrendsDescription')}
              messagesLabel={t('charts.messages')}
              studentsLabel={t('charts.students')}
            />
          </Suspense>
        </SectionErrorBoundary>

        {canViewCosts && (
          <SectionErrorBoundary title="Failed to load cost trend">
            <Suspense fallback={<LoadingSpinner />}>
              <CostTrendChart
                data={trendsChartData}
                title={t('charts.costTrend')}
                description={t('charts.costTrendDescription')}
                costLabel={t('charts.costUSD')}
              />
            </Suspense>
          </SectionErrorBoundary>
        )}
      </div>

      {/* Charts Row 2: Hourly Breakdown & Provider Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        <SectionErrorBoundary title="Failed to load hourly breakdown">
          <Suspense fallback={<LoadingSpinner />}>
            <HourlyBreakdownChart
              data={hourlyChartData}
              title={t('charts.hourlyBreakdown')}
              description={t('charts.hourlyBreakdownDescription')}
              messagesLabel={t('charts.messages')}
              studentsLabel={t('charts.students')}
            />
          </Suspense>
        </SectionErrorBoundary>

        <SectionErrorBoundary title="Failed to load provider distribution">
          <Suspense fallback={<LoadingSpinner />}>
            <ProviderDistributionChart
              data={providerChartData}
              title={t('charts.providerDistribution')}
              description={t('charts.providerDistributionDescription')}
            />
          </Suspense>
        </SectionErrorBoundary>
      </div>

      {/* Module Comparison Section */}
      <SectionErrorBoundary title="Failed to load module comparison">
        <Suspense fallback={<LoadingSpinner />}>
          <ModuleComparison
            availableModules={availableModules}
            selectedUniversityId={selectedUniversityId}
            dateRange={dateRange}
            translations={{
              title: t('moduleComparison.title'),
              description: t('moduleComparison.description'),
              show: t('moduleComparison.show'),
              hide: t('moduleComparison.hide'),
              selectModules: t('moduleComparison.selectModules'),
              modulesSelected: t('moduleComparison.modulesSelected'),
              searchModules: t('moduleComparison.searchModules'),
              noModulesFound: t('moduleComparison.noModulesFound'),
              selectAtLeastTwo: t('moduleComparison.selectAtLeastTwo'),
              maxModulesError: t('moduleComparison.maxModulesError'),
              maxModulesDescription: t('moduleComparison.maxModulesDescription'),
              loadError: t('moduleComparison.loadError'),
              moduleName: t('moduleComparison.moduleName'),
              messages: t('moduleComparison.messages'),
              students: t('moduleComparison.students'),
              tokens: t('moduleComparison.tokens'),
              cost: t('moduleComparison.cost'),
              avgResponseTime: t('moduleComparison.avgResponseTime'),
              chartMessages: t('charts.messages'),
              chartStudents: t('charts.students'),
              chartCostUSD: t('charts.costUSD'),
            }}
          />
        </Suspense>
      </SectionErrorBoundary>

      {/* Today's Metrics */}
      <Suspense fallback={<LoadingSpinner />}>
        <TodayMetrics
          todayUsage={todayUsage}
          todayCost={todayCost}
          showCost={canViewCosts}
          translations={{
            usageTitle: t('todayUsage.title'),
            usageDescription: t('todayUsage.description'),
            messages: t('todayUsage.messages'),
            students: t('todayUsage.students'),
            conversations: t('todayUsage.conversations'),
            avgResponseTime: t('todayUsage.avgResponseTime'),
            costTitle: t('todayCost.title'),
            costDescription: t('todayCost.description'),
            totalToday: t('todayCost.totalToday'),
            tokens: t('todayCost.tokens'),
            vsYesterday: t('todayCost.vsYesterday'),
            videoTranscriptions: t('todayCost.videoTranscriptions'),
            transcriptionCost: t('todayCost.transcriptionCost'),
            videosTranscribed: t('todayCost.videosTranscribed'),
            projectedTranscriptionCost: t('todayCost.projectedTranscriptionCost'),
          }}
        />
      </Suspense>
      {/* Frequently Asked Questions */}
      <Suspense fallback={<LoadingSpinner />}>
        <FrequentQuestions
          data={frequentQuestions}
          translations={{
            title: t('faq.title'),
            description: t('faq.description'),
            similarQuestions: t('faq.similarQuestions'),
            noData: t('faq.noData'),
          }}
        />
      </Suspense>

      {/* Top Active Students */}
      <Suspense fallback={<LoadingSpinner />}>
        <TopStudents
          data={topStudents}
          translations={{
            title: t('topStudents.title'),
            description: t('topStudents.description'),
            messages: t('topStudents.messages'),
            conversations: t('topStudents.conversations'),
            noData: t('topStudents.noData'),
          }}
        />
      </Suspense>
    </div>
  );
}
