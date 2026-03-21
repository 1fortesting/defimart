'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

export function SalesChart({ data }: { data: { date: string, total: number }[] }) {

  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: "hsl(var(--primary))",
    },
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
        <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
                dataKey="date"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis 
              tickFormatter={(value) => `GHS ${value}`}
            />
            <Tooltip 
                cursor={false}
                content={<ChartTooltipContent 
                    formatter={(value) => `GHS ${Number(value).toFixed(2)}`}
                    indicator="dot"
                />} 
            />
            <Bar dataKey="total" fill="var(--color-revenue)" radius={4} />
        </BarChart>
    </ChartContainer>
  );
}
