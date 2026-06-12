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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Users, RefreshCw, Download, Sparkles, UserX, Building2, TrendingDown, AlertTriangle, Brain, ChevronRight, ChevronDown, GraduationCap } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { exportAnalyticsToPDF, exportExecutiveSummaryToPDF } from '@/lib/export-utils';
import type {
  AnalyticsFilterDto,
  QuestionsPerModuleDto,
  TopTopicsResponseDto,
  QuizPerformanceResponseDto,
  AtRiskStudentsDto,
  DailyAISummaryDto,
  RiskPredictionsDto,
  CourseStatsResponseDto,
  ModuleStatsResponseDto,
  PedagogicalAlertsResponseDto,
  University,
} from '@/lib/types';

const StatsCard = lazy(() => import('@/components/analytics/stats-card').then(mod => ({ default: mod.StatsCard })));
const QuestionsPerModuleChart = lazy(() => import('@/components/analytics/questions-per-module-chart').then(m => ({ default: m.QuestionsPerModuleChart })));
const TopTopicsChart = lazy(() => import('@/components/analytics/top-topics-chart').then(m => ({ default: m.TopTopicsChart })));
const QuizHeatmap = lazy(() => import('@/components/analytics/quiz-heatmap').then(m => ({ default: m.QuizHeatmap })));
const QuizRadarChart = lazy(() => import('@/components/analytics/quiz-radar-chart').then(m => ({ default: m.QuizRadarChart })));
const CriticalConcepts = lazy(() => import('@/components/analytics/critical-concepts').then(m => ({ default: m.CriticalConcepts })));

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

  const isSuperAdmin = user?.role === 'super_admin';
  const [universities, setUniversities] = useState<University[]>([]);
  const [selectedUniversityId, setSelectedUniversityId] = useState<number | undefined>(undefined);

  const [uniqueStudents, setUniqueStudents] = useState(0);
  const [questionsPerModule, setQuestionsPerModule] = useState<QuestionsPerModuleDto | null>(null);
  const [topTopics, setTopTopics] = useState<TopTopicsResponseDto | null>(null);
  const [quizPerformance, setQuizPerformance] = useState<QuizPerformanceResponseDto | null>(null);
  const [atRisk, setAtRisk] = useState<AtRiskStudentsDto | null>(null);
  const [riskPredictions, setRiskPredictions] = useState<RiskPredictionsDto | null>(null);
  const [courseStats, setCourseStats] = useState<CourseStatsResponseDto | null>(null);
  const [pedagogicalAlerts, setPedagogicalAlerts] = useState<PedagogicalAlertsResponseDto | null>(null);
  const [expandedCourse, setExpandedCourse] = useState<number | null>(null);
  const [moduleStats, setModuleStats] = useState<Record<number, ModuleStatsResponseDto>>({});
  const [aiSummaries, setAiSummaries] = useState<DailyAISummaryDto[]>([]);

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

  // Super admins can scope every panel to a single institution
  useEffect(() => {
    if (!isSuperAdmin) return;
    apiClient.getUniversities({ size: 1000 })
      .then(response => setUniversities(response.items))
      .catch(() => {});
  }, [isSuperAdmin]);

  useEffect(() => {
    loadAnalytics();
  }, [dateRange, selectedUniversityId]);

  const loadAnalytics = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const filters: AnalyticsFilterDto = {
        ...(dateRange?.from && { startDate: format(dateRange.from, 'yyyy-MM-dd') }),
        ...(dateRange?.to && { endDate: format(dateRange.to, 'yyyy-MM-dd') }),
        ...(selectedUniversityId && { universityId: selectedUniversityId }),
      };

      // Load summary for unique students count
      const summaryData = await apiClient.getAnalyticsDashboardSummary(filters);
      setUniqueStudents(summaryData?.overview?.uniqueStudents ?? 0);

      // Load the 3 pre-computed panels (non-blocking)
      apiClient.getAnalyticsQuestionsPerModule(filters).then(setQuestionsPerModule).catch(() => {});
      apiClient.getAnalyticsTopTopics(filters).then(setTopTopics).catch(() => {});
      apiClient.getAnalyticsQuizPerformance(undefined, selectedUniversityId).then(setQuizPerformance).catch(() => {});
      apiClient.getAnalyticsAtRiskStudents(14, selectedUniversityId).then(setAtRisk).catch(() => {});
      apiClient.getAnalyticsRiskPredictions(14, selectedUniversityId).then(setRiskPredictions).catch(() => {});
      apiClient.getAnalyticsDailyAISummaries(1, selectedUniversityId).then(setAiSummaries).catch(() => {});
      apiClient.getAnalyticsCourseStats(30, selectedUniversityId).then(setCourseStats).catch(() => {});
      apiClient.getAnalyticsPedagogicalAlerts(14, selectedUniversityId).then(setPedagogicalAlerts).catch(() => {});
    } catch (error: any) {
      console.error('Error loading analytics:', error);
      toast.error(`${t('loadError')}: ${error?.message ?? 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setExpandedCourse(null);
    setModuleStats({});
    await loadAnalytics();
    setRefreshing(false);
    toast.success(t('refreshSuccess'));
  };

  // Expand a course row and lazy-load its per-module (discipline) breakdown
  const toggleCourse = async (courseId: number) => {
    if (expandedCourse === courseId) {
      setExpandedCourse(null);
      return;
    }
    setExpandedCourse(courseId);
    if (!moduleStats[courseId]) {
      try {
        const data = await apiClient.getAnalyticsCourseModuleStats(courseId, 30);
        setModuleStats((prev) => ({ ...prev, [courseId]: data }));
      } catch {
        /* drilldown is best-effort */
      }
    }
  };

  // Download an array of rows as a CSV file (Excel-friendly: UTF-8 BOM + CRLF).
  const downloadCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const escape = (value: string | number) => {
      const str = String(value ?? '');
      return /[",\n;]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    };
    const csv = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportRiskPredictions = () => {
    if (!riskPredictions?.students.length) return;
    downloadCsv(
      `risk-predictions-${format(new Date(), 'yyyy-MM-dd')}.csv`,
      [t('export.studentName'), t('export.email'), t('riskColSignal'), t('riskColRisk'), t('riskColCurrent'), t('riskColPrevious'), t('export.activeCourses')],
      riskPredictions.students.map((s) => [
        s.name, s.email, t(`riskSignal.${s.signal}`), s.riskLevel,
        s.messagesCurrentWindow, s.messagesPreviousWindow, s.courseNames.join('; '),
      ])
    );
  };

  const exportAtRisk = () => {
    if (!atRisk?.students.length) return;
    downloadCsv(
      `silent-students-${format(new Date(), 'yyyy-MM-dd')}.csv`,
      [t('export.studentName'), t('export.email'), t('export.activeCourses')],
      atRisk.students.map((s) => [s.name, s.email, s.courseNames.join('; ')])
    );
  };

  const handleExecutiveReport = async () => {
    try {
      const summary = await apiClient.getAnalyticsExecutiveSummary(30, selectedUniversityId);
      exportExecutiveSummaryToPDF(summary, {
        title: t('exec.title'),
        institution: t('exec.institution'),
        period: t('exec.period'),
        generated: t('exec.generated'),
        days: t('exec.days'),
        engagement: t('exec.engagement'),
        courses: t('exec.courses'),
        enrolled: t('exec.enrolled'),
        active: t('exec.active'),
        activeRate: t('exec.activeRate'),
        atRisk: t('exec.atRisk'),
        totalXp: t('exec.totalXp'),
        avgLevel: t('exec.avgLevel'),
        questions: t('exec.questions'),
        quizzes: t('exec.quizzes'),
        topCourses: t('exec.topCourses'),
        worstConcepts: t('exec.worstConcepts'),
        successRate: t('exec.successRate'),
        none: t('exec.none'),
      });
      toast.success(t('exec.success'));
    } catch (error: any) {
      toast.error(`${t('exec.error')}: ${error?.message ?? ''}`);
    }
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

          {isSuperAdmin && (
            <Select
              value={selectedUniversityId ? String(selectedUniversityId) : 'all'}
              onValueChange={(value) => setSelectedUniversityId(value === 'all' ? undefined : Number(value))}
            >
              <SelectTrigger className="w-[260px]">
                <Building2 className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                <SelectValue placeholder={t('filters.allInstitutions')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.allInstitutions')}</SelectItem>
                {universities.map((university) => (
                  <SelectItem key={university.id} value={String(university.id)}>
                    {university.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button onClick={handleExportPDF} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>

          <Button onClick={handleExecutiveReport} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            {t('exec.button')}
          </Button>

          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {t('refresh')}
          </Button>
        </div>
      </div>

      {/* Panels grouped into cycle-able tabs so the page never becomes one messy scroll */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="flex w-full flex-wrap h-auto">
          <TabsTrigger value="overview" className="flex-1">{t('tabs.overview')}</TabsTrigger>
          <TabsTrigger value="risk" className="flex-1">
            {t('tabs.risk')}
            {riskPredictions && riskPredictions.highRiskCount + riskPredictions.mediumRiskCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {riskPredictions.highRiskCount + riskPredictions.mediumRiskCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="courses" className="flex-1">{t('tabs.courses')}</TabsTrigger>
          <TabsTrigger value="content" className="flex-1">{t('tabs.content')}</TabsTrigger>
          <TabsTrigger value="quizzes" className="flex-1">{t('tabs.quizzes')}</TabsTrigger>
        </TabsList>

        {/* ── Overview ── */}
        <TabsContent value="overview" className="space-y-6">
          {aiSummaries.length > 0 && (
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#5e17eb] to-[#5ce1e6] text-white">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  {t('aiSummaryTitle')}
                </CardTitle>
                <CardDescription>
                  {t('aiSummaryDescription', { date: new Date(aiSummaries[0].date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm leading-relaxed">{aiSummaries[0].summaryText}</p>
                {aiSummaries[0].highlights.length > 0 && (
                  <ul className="space-y-1.5">
                    {aiSummaries[0].highlights.map((highlight, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}

          <Suspense fallback={<LoadingSpinner />}>
            <div className="grid gap-4 md:grid-cols-3">
              <StatsCard
                title={t('stats.uniqueStudents')}
                value={uniqueStudents.toLocaleString()}
                description={t('stats.studentsDescription')}
                icon={Users}
              />
              {atRisk && atRisk.totalEnrolled > 0 && (
                <>
                  <StatsCard
                    title={t('stats.activeStudents')}
                    value={`${atRisk.activeStudents.toLocaleString()} / ${atRisk.totalEnrolled.toLocaleString()}`}
                    description={t('stats.activeStudentsDescription', { days: atRisk.windowDays })}
                    icon={Users}
                  />
                  <StatsCard
                    title={t('stats.atRiskStudents')}
                    value={atRisk.atRiskCount.toLocaleString()}
                    description={t('stats.atRiskStudentsDescription', { days: atRisk.windowDays })}
                    icon={UserX}
                  />
                </>
              )}
            </div>
          </Suspense>
        </TabsContent>

        {/* ── Engagement & academic risk ── */}
        <TabsContent value="risk" className="space-y-6">
          {pedagogicalAlerts && pedagogicalAlerts.alerts.length > 0 && (
            <Card className="border-amber-300/50 dark:border-amber-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  {t('pedagogicalAlertsTitle')}
                </CardTitle>
                <CardDescription>{t('pedagogicalAlertsDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pedagogicalAlerts.alerts.map((alert, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-3 rounded-md border p-3 ${
                        alert.severity === 'high'
                          ? 'border-red-300/60 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20'
                          : 'border-amber-300/50 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/10'
                      }`}
                    >
                      <span className={`mt-0.5 shrink-0 ${alert.severity === 'high' ? 'text-red-500' : 'text-amber-500'}`}>
                        {alert.type === 'evasion' ? <UserX className="h-4 w-4" /> : <Brain className="h-4 w-4" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm">
                          {alert.type === 'evasion'
                            ? t('alertEvasion', { pct: alert.metric, count: alert.count, course: alert.courseName })
                            : t('alertConcept', { concept: alert.concept ?? '', rate: alert.metric, module: alert.moduleName ?? '' })}
                        </p>
                        {alert.type === 'concept' && (
                          <p className="text-xs text-muted-foreground">{alert.courseName}</p>
                        )}
                      </div>
                      <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'} className="shrink-0">
                        {t(`severity.${alert.severity}`)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {riskPredictions && riskPredictions.students.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-red-500" />
                      {t('riskPredictionsTitle')}
                    </CardTitle>
                    <CardDescription className="mt-1.5">
                      {t('riskPredictionsDescription', { days: riskPredictions.windowDays })}
                    </CardDescription>
                  </div>
                  <Button onClick={exportRiskPredictions} variant="outline" size="sm" className="shrink-0">
                    <Download className="mr-2 h-4 w-4" />
                    {t('exportCsv', { count: riskPredictions.students.length })}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {riskPredictions.students.slice(0, 30).map((student) => (
                    <div
                      key={student.studentId}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{student.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{student.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {t('riskMessages', {
                            current: student.messagesCurrentWindow,
                            previous: student.messagesPreviousWindow,
                          })}
                        </span>
                        <Badge variant={student.riskLevel === 'high' ? 'destructive' : 'secondary'}>
                          {t(`riskSignal.${student.signal}`)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                {riskPredictions.students.length > 30 && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    {t('atRiskMore', { count: riskPredictions.students.length - 30 })}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {atRisk && atRisk.students.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <UserX className="h-5 w-5 text-amber-500" />
                      {t('atRiskTitle')}
                    </CardTitle>
                    <CardDescription className="mt-1.5">{t('atRiskDescription', { days: atRisk.windowDays })}</CardDescription>
                  </div>
                  <Button onClick={exportAtRisk} variant="outline" size="sm" className="shrink-0">
                    <Download className="mr-2 h-4 w-4" />
                    {t('exportCsv', { count: atRisk.students.length })}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 md:grid-cols-2">
                  {atRisk.students.slice(0, 20).map((student) => (
                    <div key={student.studentId} className="flex items-center justify-between gap-3 rounded-md border p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{student.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{student.email}</p>
                      </div>
                      <p className="shrink-0 truncate text-xs text-muted-foreground max-w-[40%]">
                        {student.courseNames.join(', ')}
                      </p>
                    </div>
                  ))}
                </div>
                {atRisk.students.length > 20 && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    {t('atRiskMore', { count: atRisk.atRiskCount - 20 })}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Courses / classes / disciplines ── */}
        <TabsContent value="courses" className="space-y-6">
          {courseStats && courseStats.courses.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  {t('courseStatsTitle')}
                </CardTitle>
                <CardDescription>{t('courseStatsDescription', { days: courseStats.windowDays })}</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Header row */}
                <div className="hidden grid-cols-[2fr_repeat(5,1fr)] gap-2 border-b px-3 pb-2 text-xs font-medium text-muted-foreground md:grid">
                  <span>{t('colCourse')}</span>
                  <span className="text-right">{t('colEnrolled')}</span>
                  <span className="text-right">{t('colActive')}</span>
                  <span className="text-right">{t('colAtRisk')}</span>
                  <span className="text-right">{t('colXp')}</span>
                  <span className="text-right">{t('colAvgLevel')}</span>
                </div>
                <div className="divide-y">
                  {courseStats.courses.map((course) => {
                    const expanded = expandedCourse === course.courseId;
                    const mods = moduleStats[course.courseId];
                    return (
                      <div key={course.courseId}>
                        <button
                          onClick={() => toggleCourse(course.courseId)}
                          className="grid w-full grid-cols-2 items-center gap-2 px-3 py-3 text-left transition-colors hover:bg-muted/50 md:grid-cols-[2fr_repeat(5,1fr)]"
                        >
                          <span className="flex items-center gap-1.5 truncate font-medium">
                            {expanded ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                            <span className="truncate">{course.courseName}</span>
                          </span>
                          <span className="text-right text-sm tabular-nums">{course.enrolled}</span>
                          <span className="hidden text-right text-sm tabular-nums text-green-600 dark:text-green-400 md:block">{course.active}</span>
                          <span className="hidden text-right text-sm tabular-nums text-amber-600 dark:text-amber-400 md:block">{course.atRisk}</span>
                          <span className="hidden text-right text-sm tabular-nums md:block">{course.totalXp.toLocaleString()}</span>
                          <span className="hidden text-right text-sm tabular-nums md:block">{course.avgLevel.toFixed(1)}</span>
                        </button>
                        {expanded && (
                          <div className="bg-muted/30 px-3 py-2 pl-9">
                            {!mods ? (
                              <p className="py-2 text-xs text-muted-foreground">{t('loadingModules')}</p>
                            ) : mods.modules.length === 0 ? (
                              <p className="py-2 text-xs text-muted-foreground">{t('noModuleActivity')}</p>
                            ) : (
                              <div className="space-y-1.5 py-1">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('byModule')}</p>
                                {mods.modules.map((m) => (
                                  <div key={m.moduleId} className="flex items-center justify-between gap-3 text-sm">
                                    <span className="truncate">{m.moduleName}</span>
                                    <span className="shrink-0 text-xs text-muted-foreground">
                                      {t('moduleRow', { active: m.active, xp: m.totalXp.toLocaleString(), questions: m.questions, quizzes: m.quizzes })}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-sm text-muted-foreground">{t('noCourseStats')}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Content usage ── */}
        <TabsContent value="content" className="space-y-6">
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
        </TabsContent>

        {/* ── Quiz performance ── */}
        <TabsContent value="quizzes" className="space-y-6">
          {quizPerformance && quizPerformance.concepts.length > 0 && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>{t('criticalConcepts')}</CardTitle>
                  <CardDescription>{t('criticalConceptsDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <SectionErrorBoundary title="Failed to load critical concepts">
                    <Suspense fallback={<div className="h-[200px] animate-pulse bg-muted rounded" />}>
                      <CriticalConcepts
                        data={quizPerformance.concepts}
                        labels={{
                          attempts: t('criticalConceptsAttempts'),
                          allHealthy: t('criticalConceptsHealthy'),
                        }}
                      />
                    </Suspense>
                  </SectionErrorBoundary>
                </CardContent>
              </Card>

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
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
