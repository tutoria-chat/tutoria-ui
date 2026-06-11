"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface TopicRow {
  topicName: string;
  totalQuestions: number;
  sampleQuestions: string[];
}

interface Props {
  data: TopicRow[];
}

// Fixed, readable palette anchored on the brand colors
const COLORS = [
  "#5e17eb", // brand purple
  "#06b6d4", // cyan
  "#f59e0b", // amber
  "#10b981", // emerald
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
  "#64748b", // slate (overflow)
];

function TopicTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: TopicRow & { percent: number } }> }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="max-w-xs rounded-lg border bg-popover p-3 text-sm shadow-lg">
      <p className="font-semibold">{row.topicName}</p>
      <p className="text-xs text-muted-foreground">{row.totalQuestions.toLocaleString()} perguntas</p>
      {row.sampleQuestions?.[0] && (
        <p className="mt-2 border-l-2 border-primary/40 pl-2 text-xs italic text-muted-foreground">
          “{row.sampleQuestions[0]}”
        </p>
      )}
    </div>
  );
}

export function TopTopicsChart({ data }: Props) {
  if (!data || data.length === 0) return null;

  const total = data.reduce((sum, d) => sum + d.totalQuestions, 0) || 1;
  const sorted = [...data].sort((a, b) => b.totalQuestions - a.totalQuestions);

  return (
    <div className="grid items-center gap-6 md:grid-cols-[260px_1fr]">
      {/* Donut — no flying labels, the legend carries the names */}
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={sorted as unknown as Record<string, unknown>[]}
            dataKey="totalQuestions"
            nameKey="topicName"
            cx="50%"
            cy="50%"
            innerRadius={62}
            outerRadius={105}
            paddingAngle={2}
            strokeWidth={0}
          >
            {sorted.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<TopicTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Ranked legend with bars — readable at any topic count */}
      <div className="space-y-2">
        {sorted.map((topic, index) => {
          const percent = Math.round((topic.totalQuestions / total) * 100);
          return (
            <div key={topic.topicName} className="flex items-center gap-3">
              <span
                className="h-3 w-3 shrink-0 rounded-sm"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="min-w-0 flex-1 truncate text-sm" title={topic.topicName}>
                {topic.topicName}
              </span>
              <div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-muted sm:block">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${percent}%`, backgroundColor: COLORS[index % COLORS.length] }}
                />
              </div>
              <span className="w-20 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                {topic.totalQuestions.toLocaleString()} · {percent}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
