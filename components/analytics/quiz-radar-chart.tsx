"use client";

import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";

interface Props {
  data: { conceptName: string; successRate: number; totalAttempts: number }[];
}

export function QuizRadarChart({ data }: Props) {
  if (!data || data.length === 0) return null;

  // Radar works best with 3-12 axes
  const chartData = data.slice(0, 12).map(d => ({
    concept: d.conceptName.length > 15 ? d.conceptName.slice(0, 15) + "\u2026" : d.conceptName,
    successRate: d.successRate,
    fullName: d.conceptName,
  }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <RadarChart data={chartData}>
        <PolarGrid className="stroke-muted" />
        <PolarAngleAxis dataKey="concept" className="text-xs" tick={{ fontSize: 10 }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} className="text-xs" />
        <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
        <Radar
          name="Success Rate"
          dataKey="successRate"
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary))"
          fillOpacity={0.3}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
