'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SectionErrorBoundary } from '@/components/ui/error-boundary';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import {
  DollarSign,
  TrendingUp,
  Users,
  MessageSquare,
  Clock,
  Activity,
  RefreshCw,
  Download,
  FileText,
  GitCompare,
  Check,
  ChevronsUpDown,
  Video
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
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
  ModuleComparisonResponseDto,
  AnalyticsFilterDto,
  University,
  Module
} from '@/lib/types';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
}

function StatsCard({ title, value, description, icon: Icon, trend }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            <Badge
              variant={trend.isPositive ? 'default' : 'destructive'}
              className="text-xs"
            >
              {trend.value > 0 ? '+' : ''}{trend.value.toFixed(1)}%
            </Badge>
            <span className="text-xs text-muted-foreground ml-2">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const t = useTranslations('analytics');

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

  // Module comparison states
  const [showModuleComparison, setShowModuleComparison] = useState(false);
  const [availableModules, setAvailableModules] = useState<Module[]>([]);
  const [selectedModuleIds, setSelectedModuleIds] = useState<number[]>([]);
  const [moduleComparison, setModuleComparison] = useState<ModuleComparisonResponseDto | null>(null);
  const [moduleComboOpen, setModuleComboOpen] = useState(false);

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
      toast.error(t('filters.noFutureDates') || 'Future dates are not allowed', {
        description: t('filters.noFutureDatesDescription') || 'Please select a date range up to today.'
      });
      return;
    }

    // If end date exists, validate it too
    if (newDateRange.to && newDateRange.to > today) {
      toast.error(t('filters.noFutureDates') || 'Future dates are not allowed', {
        description: t('filters.noFutureDatesDescription') || 'Please select a date range up to today.'
      });
      return;
    }

    // Check if range exceeds 1 year (365 days)
    if (newDateRange.from && newDateRange.to) {
      const daysDifference = Math.floor((newDateRange.to.getTime() - newDateRange.from.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDifference > 365) {
        toast.error(t('filters.maxRangeExceeded') || 'Date range too large', {
          description: t('filters.maxRangeExceededDescription') || 'Please select a date range of maximum 1 year (365 days).'
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

  useEffect(() => {
    if (selectedModuleIds.length >= 2) {
      loadModuleComparison();
    }
  }, [selectedModuleIds, dateRange]);

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
      toast.error(t('loadError') + ': ' + (error?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const loadModuleComparison = async () => {
    if (selectedModuleIds.length < 2) return;

    try {
      const filters: Omit<AnalyticsFilterDto, 'moduleId'> = {
        ...(selectedUniversityId && { universityId: selectedUniversityId }),
        ...(dateRange?.from && { startDate: format(dateRange.from, 'yyyy-MM-dd') }),
        ...(dateRange?.to && { endDate: format(dateRange.to, 'yyyy-MM-dd') }),
      };

      const comparisonData = await apiClient.getAnalyticsModuleComparison(selectedModuleIds, filters);
      setModuleComparison(comparisonData);
    } catch (error) {
      console.error('Error loading module comparison:', error);
      toast.error(t('moduleComparison.loadError'));
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    if (selectedModuleIds.length >= 2) {
      await loadModuleComparison();
    }
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

  const toggleModuleSelection = (moduleId: number) => {
    setSelectedModuleIds(prev => {
      // If module is already selected, remove it
      if (prev.includes(moduleId)) {
        return prev.filter(id => id !== moduleId);
      }

      // Limit to maximum 10 modules for performance
      if (prev.length >= 10) {
        toast.error(t('moduleComparison.maxModulesError') || 'Maximum 10 modules can be selected for comparison', {
          description: t('moduleComparison.maxModulesDescription') || 'Please deselect a module before selecting a new one.'
        });
        return prev;
      }

      return [...prev, moduleId];
    });
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
                    <CommandInput placeholder={t('searchUniversities') || 'Search universities...'} />
                    <CommandList>
                      <CommandEmpty>{t('noUniversitiesFound') || 'No universities found.'}</CommandEmpty>
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

        <StatsCard
          title={t('stats.estimatedCost')}
          value={`$${(summary?.overview?.totalCostUSD ?? 0).toFixed(2)}`}
          description={getPeriodLabel()}
          icon={DollarSign}
        />
      </div>

      {/* Charts Row 1: Usage Trends */}
      <div className="grid gap-4 md:grid-cols-2">
        <SectionErrorBoundary title="Failed to load usage trends">
          <Card>
            <CardHeader>
              <CardTitle>{t('charts.usageTrends')}</CardTitle>
              <CardDescription>{t('charts.usageTrendsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendsChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="messages" stroke="#3b82f6" strokeWidth={2} name={t('charts.messages')} />
                  <Line type="monotone" dataKey="students" stroke="#10b981" strokeWidth={2} name={t('charts.students')} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </SectionErrorBoundary>

        <SectionErrorBoundary title="Failed to load cost trend">
          <Card>
            <CardHeader>
              <CardTitle>{t('charts.costTrend')}</CardTitle>
              <CardDescription>{t('charts.costTrendDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trendsChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="cost" stroke="#f59e0b" fill="#fef3c7" name={t('charts.costUSD')} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </SectionErrorBoundary>
      </div>

      {/* Charts Row 2: Hourly Breakdown & Provider Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        <SectionErrorBoundary title="Failed to load hourly breakdown">
          <Card>
            <CardHeader>
              <CardTitle>{t('charts.hourlyBreakdown')}</CardTitle>
              <CardDescription>{t('charts.hourlyBreakdownDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hourlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="messages" fill="#3b82f6" name={t('charts.messages')} />
                  <Bar dataKey="students" fill="#10b981" name={t('charts.students')} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </SectionErrorBoundary>

        <SectionErrorBoundary title="Failed to load provider distribution">
          <Card>
            <CardHeader>
              <CardTitle>{t('charts.providerDistribution')}</CardTitle>
              <CardDescription>{t('charts.providerDistributionDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={providerChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {providerChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </SectionErrorBoundary>
      </div>

      {/* Module Comparison Section */}
      <SectionErrorBoundary title="Failed to load module comparison">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('moduleComparison.title')}</CardTitle>
                <CardDescription>{t('moduleComparison.description')}</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowModuleComparison(!showModuleComparison)}
              >
                <GitCompare className="mr-2 h-4 w-4" />
                {showModuleComparison ? t('moduleComparison.hide') : t('moduleComparison.show')}
              </Button>
            </div>
          </CardHeader>
        {showModuleComparison && (
          <CardContent className="space-y-4">
            {/* Module Multi-Select Combobox */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {t('moduleComparison.selectModules')}
              </p>
              <Popover open={moduleComboOpen} onOpenChange={setModuleComboOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={moduleComboOpen}
                    className="w-full justify-between"
                  >
                    {selectedModuleIds.length > 0
                      ? `${selectedModuleIds.length} ${t('moduleComparison.modulesSelected')}`
                      : t('moduleComparison.selectModules')}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder={t('moduleComparison.searchModules') || 'Search modules...'} />
                    <CommandList>
                      <CommandEmpty>{t('moduleComparison.noModulesFound') || 'No modules found.'}</CommandEmpty>
                      <CommandGroup>
                        {availableModules.map((module) => (
                          <CommandItem
                            key={module.id}
                            value={module.name}
                            onSelect={() => {
                              toggleModuleSelection(module.id);
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                selectedModuleIds.includes(module.id) ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            <div className="flex-1">
                              <p className="font-medium">{module.name}</p>
                              {module.code && (
                                <p className="text-xs text-muted-foreground">{module.code}</p>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Selected Modules Display */}
              {selectedModuleIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedModuleIds.map((id) => {
                    const module = availableModules.find((m) => m.id === id);
                    if (!module) return null;
                    return (
                      <Badge key={id} variant="secondary" className="px-2 py-1">
                        {module.name}
                        <button
                          onClick={() => toggleModuleSelection(id)}
                          className="ml-2 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>

            {selectedModuleIds.length < 2 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('moduleComparison.selectAtLeastTwo')}
              </p>
            )}

            {moduleComparison && moduleComparison.modules.length > 0 && (
              <div className="mt-6">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={moduleComparison.modules}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="moduleName" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalMessages" fill="#3b82f6" name={t('charts.messages')} />
                    <Bar dataKey="uniqueStudents" fill="#10b981" name={t('charts.students')} />
                    <Bar dataKey="estimatedCostUSD" fill="#f59e0b" name={t('charts.costUSD')} />
                  </BarChart>
                </ResponsiveContainer>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">{t('moduleComparison.moduleName')}</th>
                        <th className="text-right p-2">{t('moduleComparison.messages')}</th>
                        <th className="text-right p-2">{t('moduleComparison.students')}</th>
                        <th className="text-right p-2">{t('moduleComparison.tokens')}</th>
                        <th className="text-right p-2">{t('moduleComparison.cost')}</th>
                        <th className="text-right p-2">{t('moduleComparison.avgResponseTime')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {moduleComparison.modules.map((module) => (
                        <tr key={module.moduleId} className="border-b">
                          <td className="p-2 font-medium">{module.moduleName || 'N/A'}</td>
                          <td className="text-right p-2">{(module.totalMessages ?? 0).toLocaleString()}</td>
                          <td className="text-right p-2">{module.uniqueStudents ?? 0}</td>
                          <td className="text-right p-2">{(module.totalTokens ?? 0).toLocaleString()}</td>
                          <td className="text-right p-2">${(module.estimatedCostUSD ?? 0).toFixed(2)}</td>
                          <td className="text-right p-2">{((module.averageResponseTimeMs ?? 0) / 1000).toFixed(2)}s</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        )}
        </Card>
      </SectionErrorBoundary>

      {/* Today's Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('todayUsage.title')}</CardTitle>
            <CardDescription>{t('todayUsage.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t('todayUsage.messages')}</span>
              <span className="text-lg font-semibold">{(todayUsage?.totalMessages ?? 0).toLocaleString()}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t('todayUsage.students')}</span>
              <span className="text-lg font-semibold">{todayUsage?.uniqueStudents ?? 0}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t('todayUsage.conversations')}</span>
              <span className="text-lg font-semibold">{todayUsage?.uniqueConversations || '0'}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t('todayUsage.avgResponseTime')}</span>
              <span className="text-lg font-semibold">
                {todayUsage?.averageResponseTime
                  ? `${(todayUsage.averageResponseTime / 1000).toFixed(2)}s`
                  : 'N/A'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('todayCost.title')}</CardTitle>
            <CardDescription>{t('todayCost.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-3xl font-bold">
                ${(todayCost?.estimatedCostUSD || 0).toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {t('todayCost.totalToday')}
              </p>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t('todayCost.tokens')}</span>
                <span className="text-sm font-medium">{(todayCost?.totalTokens ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t('todayCost.vsYesterday')}</span>
                <Badge variant={(todayCost?.comparedToYesterday?.costPercentChange ?? 0) >= 0 ? 'default' : 'outline'}>
                  {(todayCost?.comparedToYesterday?.costPercentChange ?? 0) > 0 ? '+' : ''}
                  {(todayCost?.comparedToYesterday?.costPercentChange ?? 0).toFixed(1)}%
                </Badge>
              </div>
            </div>

            {/* Transcription Costs Section */}
            {(todayCost?.transcriptionCostUSD ?? 0) > 0 && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Video className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{t('todayCost.videoTranscriptions')}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{t('todayCost.transcriptionCost')}</span>
                      <span className="text-sm font-medium">${(todayCost?.transcriptionCostUSD ?? 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{t('todayCost.videosTranscribed')}</span>
                      <span className="text-sm font-medium">{todayCost?.transcriptionVideoCount ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{t('todayCost.projectedTranscriptionCost')}</span>
                      <span className="text-sm font-medium">${(todayCost?.projectedDailyTranscriptionCost ?? 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Frequently Asked Questions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('faq.title')}</CardTitle>
          <CardDescription>{t('faq.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {frequentQuestions && frequentQuestions.questions.length > 0 ? (
            <div className="space-y-4">
              {frequentQuestions.questions.map((faq, index) => (
                <div key={index} className="border-b last:border-0 pb-4 last:pb-0">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <p className="font-medium">{faq.question}</p>
                      {faq.similarQuestions && faq.similarQuestions.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground">{t('faq.similarQuestions')}:</p>
                          <ul className="text-xs text-muted-foreground list-disc list-inside mt-1">
                            {faq.similarQuestions.slice(0, 2).map((sq, idx) => (
                              <li key={idx}>{sq}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">{faq.count}</div>
                      <div className="text-xs text-muted-foreground">{faq.percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">{t('faq.noData')}</p>
          )}
        </CardContent>
      </Card>

      {/* Top Active Students */}
      <Card>
        <CardHeader>
          <CardTitle>{t('topStudents.title')}</CardTitle>
          <CardDescription>{t('topStudents.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {topStudents && topStudents.topStudents.length > 0 ? (
            <div className="space-y-3">
              {topStudents.topStudents.map((student, index) => (
                <div key={student.studentId} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{student.studentName || student.studentEmail || `Student #${student.studentId}`}</p>
                      {student.studentEmail && (
                        <p className="text-xs text-muted-foreground">{student.studentEmail}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{student.messageCount} {t('topStudents.messages')}</p>
                    <p className="text-xs text-muted-foreground">
                      {student.conversationCount} {t('topStudents.conversations')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">{t('topStudents.noData')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
