import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { TopActiveStudentsResponseDto } from '@/lib/types';

interface TopStudentsProps {
  data: TopActiveStudentsResponseDto | null;
  translations: {
    title: string;
    description: string;
    messages: string;
    conversations: string;
    noData: string;
  };
}

export function TopStudents({ data, translations: t }: TopStudentsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {data && data.topStudents.length > 0 ? (
          <div className="space-y-3">
            {data.topStudents.map((student, index) => (
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
                  <p className="font-semibold">{student.messageCount} {t.messages}</p>
                  <p className="text-xs text-muted-foreground">
                    {student.conversationCount} {t.conversations}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">{t.noData}</p>
        )}
      </CardContent>
    </Card>
  );
}
