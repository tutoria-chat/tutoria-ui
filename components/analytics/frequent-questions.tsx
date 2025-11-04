import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { FrequentlyAskedQuestionsResponseDto } from '@/lib/types';

interface FrequentQuestionsProps {
  data: FrequentlyAskedQuestionsResponseDto | null;
  translations: {
    title: string;
    description: string;
    similarQuestions: string;
    noData: string;
  };
}

export function FrequentQuestions({ data, translations: t }: FrequentQuestionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {data && data.questions.length > 0 ? (
          <div className="space-y-4">
            {data.questions.map((faq, index) => (
              <div key={index} className="border-b last:border-0 pb-4 last:pb-0">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="font-medium">{faq.question}</p>
                    {faq.similarQuestions && faq.similarQuestions.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground">{t.similarQuestions}:</p>
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
          <p className="text-sm text-muted-foreground text-center py-8">{t.noData}</p>
        )}
      </CardContent>
    </Card>
  );
}
