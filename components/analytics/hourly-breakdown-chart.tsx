import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface HourlyBreakdownChartProps {
  data: Array<{
    hour: string;
    messages: number;
    students: number;
  }>;
  title: string;
  description: string;
  messagesLabel: string;
  studentsLabel: string;
}

export function HourlyBreakdownChart({ data, title, description, messagesLabel, studentsLabel }: HourlyBreakdownChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="messages" fill="#3b82f6" name={messagesLabel} />
            <Bar dataKey="students" fill="#10b981" name={studentsLabel} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
