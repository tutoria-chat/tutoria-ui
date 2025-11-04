import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface CostTrendChartProps {
  data: Array<{
    date: string;
    messages: number;
    students: number;
    cost: number;
  }>;
  title: string;
  description: string;
  costLabel: string;
}

export function CostTrendChart({ data, title, description, costLabel }: CostTrendChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="cost" stroke="#f59e0b" fill="#fef3c7" name={costLabel} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
