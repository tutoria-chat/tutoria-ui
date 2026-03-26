"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  data: { moduleName: string; totalQuestions: number; uniqueStudents: number }[];
}

export function QuestionsPerModuleChart({ data }: Props) {
  if (!data || data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={Math.max(300, data.length * 40)}>
      <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis type="number" className="text-xs" />
        <YAxis dataKey="moduleName" type="category" width={150} className="text-xs" tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="totalQuestions" fill="hsl(var(--primary))" name="Questions" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
