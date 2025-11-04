import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface UsageTrendsChartProps {
  data: Array<{
    date: string;
    messages: number;
    students: number;
    cost: number;
  }>;
  title: string;
  description: string;
  messagesLabel: string;
  studentsLabel: string;
}

export function UsageTrendsChart({ data, title, description, messagesLabel, studentsLabel }: UsageTrendsChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="messages" stroke="#3b82f6" strokeWidth={2} name={messagesLabel} />
            <Line type="monotone" dataKey="students" stroke="#10b981" strokeWidth={2} name={studentsLabel} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
