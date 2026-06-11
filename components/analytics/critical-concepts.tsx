"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";

interface ConceptRow {
  conceptName: string;
  totalAttempts: number;
  correctCount: number;
  incorrectCount: number;
  successRate: number; // 0-100
}

interface Props {
  data: ConceptRow[];
  minAttempts?: number;
  labels: {
    attempts: string; // "{count} tentativas"
    allHealthy: string;
  };
}

function rateColor(rate: number): string {
  if (rate < 40) return "#ef4444"; // red — critical
  if (rate < 60) return "#f59e0b"; // amber — struggling
  if (rate < 75) return "#eab308"; // yellow — borderline
  return "#10b981"; // green
}

/**
 * The quiz concepts students are failing the most — the professor's
 * "what should I reteach" list. Only concepts with enough attempts count.
 */
export function CriticalConcepts({ data, minAttempts = 3, labels }: Props) {
  const ranked = data
    .filter((c) => c.totalAttempts >= minAttempts)
    .sort((a, b) => a.successRate - b.successRate)
    .slice(0, 8);

  const hasCritical = ranked.some((c) => c.successRate < 75);

  if (ranked.length === 0 || !hasCritical) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        {labels.allHealthy}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {ranked.map((concept) => {
        const color = rateColor(concept.successRate);
        return (
          <div key={concept.conceptName} className="flex items-center gap-3">
            {concept.successRate < 60 ? (
              <AlertTriangle className="h-4 w-4 shrink-0" style={{ color }} />
            ) : (
              <span className="h-4 w-4 shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-sm font-medium" title={concept.conceptName}>
                  {concept.conceptName}
                </p>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {labels.attempts.replace("{count}", String(concept.totalAttempts))}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.max(2, concept.successRate)}%`, backgroundColor: color }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-xs font-semibold tabular-nums" style={{ color }}>
                  {Math.round(concept.successRate)}%
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
