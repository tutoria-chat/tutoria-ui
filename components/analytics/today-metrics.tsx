import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Video } from 'lucide-react';
import type { UsageStatsDto, TodayCostDto } from '@/lib/types';

interface TodayMetricsProps {
  todayUsage: UsageStatsDto | null;
  todayCost: TodayCostDto | null;
  translations: {
    usageTitle: string;
    usageDescription: string;
    messages: string;
    students: string;
    conversations: string;
    avgResponseTime: string;
    costTitle: string;
    costDescription: string;
    totalToday: string;
    tokens: string;
    vsYesterday: string;
    videoTranscriptions: string;
    transcriptionCost: string;
    videosTranscribed: string;
    projectedTranscriptionCost: string;
  };
}

export function TodayMetrics({ todayUsage, todayCost, translations: t }: TodayMetricsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Today's Usage Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t.usageTitle}</CardTitle>
          <CardDescription>{t.usageDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{t.messages}</span>
            <span className="text-lg font-semibold">{(todayUsage?.totalMessages ?? 0).toLocaleString()}</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{t.students}</span>
            <span className="text-lg font-semibold">{todayUsage?.uniqueStudents ?? 0}</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{t.conversations}</span>
            <span className="text-lg font-semibold">{todayUsage?.uniqueConversations ?? '0'}</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{t.avgResponseTime}</span>
            <span className="text-lg font-semibold">
              {todayUsage?.averageResponseTime
                ? `${(todayUsage.averageResponseTime / 1000).toFixed(2)}s`
                : 'N/A'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Today's Cost Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t.costTitle}</CardTitle>
          <CardDescription>{t.costDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-3xl font-bold">
              ${(todayCost?.estimatedCostUSD ?? 0).toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {t.totalToday}
            </p>
          </div>
          <Separator />
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t.tokens}</span>
              <span className="text-sm font-medium">{(todayCost?.totalTokens ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t.vsYesterday}</span>
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
                  <span className="text-sm font-medium">{t.videoTranscriptions}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{t.transcriptionCost}</span>
                    <span className="text-sm font-medium">${(todayCost?.transcriptionCostUSD ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{t.videosTranscribed}</span>
                    <span className="text-sm font-medium">{todayCost?.transcriptionVideoCount ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{t.projectedTranscriptionCost}</span>
                    <span className="text-sm font-medium">${(todayCost?.projectedDailyTranscriptionCost ?? 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
