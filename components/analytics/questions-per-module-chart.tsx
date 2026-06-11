"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  data: { moduleName: string; courseName: string; totalQuestions: number; uniqueStudents: number }[];
}

const BRAND_PURPLE = "#5e17eb";

interface ChartRow {
  label: string;
  courseName: string;
  moduleName: string;
  totalQuestions: number;
  uniqueStudents: number;
}

function ModuleTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartRow }> }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-lg border bg-popover p-3 text-sm shadow-lg">
      <p className="font-semibold">{row.moduleName}</p>
      <p className="text-xs text-muted-foreground">{row.courseName}</p>
      <div className="mt-2 space-y-0.5 text-xs">
        <p>
          <span className="font-medium" style={{ color: BRAND_PURPLE }}>●</span>{" "}
          {row.totalQuestions.toLocaleString()} perguntas
        </p>
        <p>
          <span className="font-medium text-cyan-500">●</span>{" "}
          {row.uniqueStudents.toLocaleString()} alunos únicos
        </p>
      </div>
    </div>
  );
}

export function QuestionsPerModuleChart({ data }: Props) {
  if (!data || data.length === 0) return null;

  // "Course — Module" so two "Percurso 1" from different courses are distinguishable
  const rows: ChartRow[] = data.map((d) => ({
    label: d.courseName ? `${d.courseName} — ${d.moduleName}` : d.moduleName,
    courseName: d.courseName,
    moduleName: d.moduleName,
    totalQuestions: d.totalQuestions,
    uniqueStudents: d.uniqueStudents,
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(300, rows.length * 44)}>
      <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
        <YAxis
          dataKey="label"
          type="category"
          width={220}
          tick={{ fontSize: 12 }}
          tickFormatter={(value: string) => (value.length > 30 ? `${value.slice(0, 29)}…` : value)}
        />
        <Tooltip content={<ModuleTooltip />} cursor={{ fill: "rgba(94, 23, 235, 0.06)" }} />
        <Bar dataKey="totalQuestions" fill={BRAND_PURPLE} name="Perguntas" radius={[0, 6, 6, 0]} maxBarSize={26} />
      </BarChart>
    </ResponsiveContainer>
  );
}
