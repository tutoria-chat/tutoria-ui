'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Database, 
  Server, 
  Zap,
  Users,
  Building2,
  BookOpen,
  FileText,
  Clock,
  Download,
  RefreshCw
} from 'lucide-react';
import { SuperAdminOnly } from '@/components/auth/role-guard';
import type { BreadcrumbItem } from '@/lib/types';

// Mock analytics data
const mockStats = {
  overview: {
    totalUniversities: 15,
    totalCourses: 248,
    totalModules: 456,
    totalUsers: 3576,
    totalFiles: 1248,
    storageUsedGB: 15.6,
    apiCallsToday: 12450
  },
  growth: {
    universitiesGrowth: 13.2,
    coursesGrowth: 24.8,
    usersGrowth: 18.5,
    storageGrowth: 31.4
  },
  usage: {
    activeUsersToday: 892,
    activeUsersThisWeek: 2340,
    peakConcurrentUsers: 245,
    averageSessionDuration: 42 // minutes
  },
  performance: {
    avgResponseTime: 185, // ms
    uptime: 99.94, // percentage
    errorRate: 0.12, // percentage
    cacheHitRate: 94.8 // percentage
  },
  content: {
    modulesWithAI: 234,
    aiConfigurationRate: 51.3, // percentage
    totalTokens: 89,
    tokenUsageToday: 847
  }
};

const recentMetrics = [
  { time: '00:00', users: 45, api_calls: 120, cpu: 12 },
  { time: '04:00', users: 23, api_calls: 89, cpu: 8 },
  { time: '08:00', users: 156, api_calls: 445, cpu: 28 },
  { time: '12:00', users: 234, api_calls: 678, cpu: 45 },
  { time: '16:00', users: 189, api_calls: 567, cpu: 38 },
  { time: '20:00', users: 98, api_calls: 234, cpu: 22 }
];

export default function SystemStatsPage() {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Administration', href: '/admin' },
    { label: 'System Statistics', isCurrentPage: true }
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simular refresh de dados
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const handleExport = () => {
    // Simular export de dados
    alert('System statistics would be exported to CSV in a real application');
  };

  return (
    <SuperAdminOnly>
      <div className="space-y-6">
        <PageHeader
          title="System Statistics & Analytics"
          description="Comprehensive system metrics, performance data, and usage analytics"
          breadcrumbs={breadcrumbs}
          actions={
            <div className="flex items-center space-x-2">
              <div className="flex items-center border rounded-lg">
                {(['24h', '7d', '30d'] as const).map((range) => (
                  <Button
                    key={range}
                    variant={timeRange === range ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setTimeRange(range)}
                    className="rounded-none first:rounded-l-lg last:rounded-r-lg"
                  >
                    {range}
                  </Button>
                ))}
              </div>
              
              <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Button onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          }
        />

        {/* System Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Universities</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.overview.totalUniversities}</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                +{mockStats.growth.universitiesGrowth}% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.overview.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                +{mockStats.growth.usersGrowth}% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Calls Today</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.overview.apiCallsToday.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Peak: {Math.floor(mockStats.overview.apiCallsToday * 1.3)} calls/hour
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.overview.storageUsedGB} GB</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingUp className="h-3 w-3 mr-1 text-amber-500" />
                +{mockStats.growth.storageGrowth}% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Server className="mr-2 h-5 w-5" />
                System Performance
              </CardTitle>
              <CardDescription>Real-time system health and performance metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Average Response Time</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="default">{mockStats.performance.avgResponseTime}ms</Badge>
                  <Badge variant="outline" className="text-green-600">Excellent</Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">System Uptime</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="default">{mockStats.performance.uptime}%</Badge>
                  <Badge variant="outline" className="text-green-600">Healthy</Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Error Rate</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">{mockStats.performance.errorRate}%</Badge>
                  <Badge variant="outline" className="text-green-600">Low</Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Cache Hit Rate</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="default">{mockStats.performance.cacheHitRate}%</Badge>
                  <Badge variant="outline" className="text-green-600">Optimal</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="mr-2 h-5 w-5" />
                User Activity
              </CardTitle>
              <CardDescription>User engagement and session analytics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Active Users Today</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="default">{mockStats.usage.activeUsersToday}</Badge>
                  <span className="text-xs text-green-600">+12% vs yesterday</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Active Users This Week</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">{mockStats.usage.activeUsersThisWeek.toLocaleString()}</Badge>
                  <span className="text-xs text-green-600">+8% vs last week</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Peak Concurrent Users</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{mockStats.usage.peakConcurrentUsers}</Badge>
                  <span className="text-xs text-muted-foreground">at 2:30 PM</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Avg Session Duration</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{mockStats.usage.averageSessionDuration} min</Badge>
                  <span className="text-xs text-green-600">+5 min vs last week</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Statistics */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="mr-2 h-5 w-5" />
                Content Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Courses</span>
                <Badge variant="secondary">{mockStats.overview.totalCourses}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Modules</span>
                <Badge variant="secondary">{mockStats.overview.totalModules}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Files</span>
                <Badge variant="secondary">{mockStats.overview.totalFiles}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="mr-2 h-5 w-5" />
                AI Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Modules with AI</span>
                <Badge variant="default">{mockStats.content.modulesWithAI}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">AI Configuration Rate</span>
                <Badge variant="outline">{mockStats.content.aiConfigurationRate}%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Active Tokens</span>
                <Badge variant="secondary">{mockStats.content.totalTokens}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                Usage Today
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Token API Calls</span>
                <Badge variant="default">{mockStats.content.tokenUsageToday}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">New Files Uploaded</span>
                <Badge variant="secondary">24</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">New Modules Created</span>
                <Badge variant="secondary">8</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              24-Hour Activity Timeline
            </CardTitle>
            <CardDescription>System activity over the last 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentMetrics.map((metric, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <span className="font-mono text-sm w-12">{metric.time}</span>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Users className="h-3 w-3 text-blue-500" />
                        <span className="text-sm">{metric.users} users</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Activity className="h-3 w-3 text-green-500" />
                        <span className="text-sm">{metric.api_calls} API calls</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Server className="h-3 w-3 text-amber-500" />
                        <span className="text-sm">{metric.cpu}% CPU</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={metric.cpu > 40 ? "destructive" : metric.cpu > 25 ? "secondary" : "default"}>
                    {metric.cpu > 40 ? 'High Load' : metric.cpu > 25 ? 'Medium Load' : 'Normal'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Alerts */}
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-900">System Alerts & Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-amber-700 text-sm">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                <span>Storage usage is at 78% - consider expanding capacity</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span>All systems operational - no critical issues detected</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span>Scheduled maintenance window: Sunday 2:00-4:00 AM</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperAdminOnly>
  );
}