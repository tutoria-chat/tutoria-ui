"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Props {
  data: { topicName: string; totalQuestions: number; sampleQuestions: string[] }[];
}

const COLORS = ["hsl(var(--primary))", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444", "#06b6d4"];

export function TopTopicsChart({ data }: Props) {
  if (!data || data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
        <Pie
          data={data}
          dataKey="totalQuestions"
          nameKey="topicName"
          cx="50%"
          cy="50%"
          outerRadius={120}
          label={(props: Record<string, unknown>) => `${props.topicName} (${(Number(props.percent) * 100).toFixed(0)}%)`}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
