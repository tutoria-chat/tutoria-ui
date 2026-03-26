"use client";

interface ConceptData {
  conceptName: string;
  successRate: number;
  totalAttempts: number;
  difficulty?: string;
}

interface Props {
  data: ConceptData[];
}

function getColor(rate: number): string {
  if (rate >= 80) return "bg-green-500/80 dark:bg-green-600/80";
  if (rate >= 60) return "bg-yellow-500/80 dark:bg-yellow-600/80";
  if (rate >= 40) return "bg-orange-500/80 dark:bg-orange-600/80";
  return "bg-red-500/80 dark:bg-red-600/80";
}

export function QuizHeatmap({ data }: Props) {
  if (!data || data.length === 0) return null;

  // Group by difficulty
  const difficulties = ["easy", "medium", "hard"];
  const concepts = [...new Set(data.map(d => d.conceptName))];

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="p-2 text-left font-medium text-muted-foreground">Concept</th>
            {difficulties.map(d => (
              <th key={d} className="p-2 text-center font-medium text-muted-foreground capitalize">{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {concepts.map(concept => (
            <tr key={concept} className="border-t border-border">
              <td className="p-2 font-medium text-sm">{concept}</td>
              {difficulties.map(diff => {
                const cell = data.find(d => d.conceptName === concept && d.difficulty === diff);
                return (
                  <td key={diff} className="p-1 text-center">
                    {cell ? (
                      <div className={`rounded-md p-2 text-white text-xs font-medium ${getColor(cell.successRate)}`}
                           title={`${cell.totalAttempts} attempts`}>
                        {cell.successRate.toFixed(0)}%
                      </div>
                    ) : (
                      <div className="rounded-md p-2 bg-muted text-muted-foreground text-xs">&mdash;</div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
