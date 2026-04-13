'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

export function ProfitChart({ data, timeUnit = 'day' }: { data: { date: string, total: number }[], timeUnit?: 'day' | 'hour' }) {

  const chartConfig = {
    profit: {
      label: "Profit",
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
                tickFormatter={(value) => timeUnit === 'day' ? value.slice(0, 3) : value}
            />
            <YAxis 
              tickFormatter={(value) => `GHS ${Number(value).toLocaleString('en-US')}`}
            />
            <Tooltip 
                cursor={false}
                content={<ChartTooltipContent 
                    formatter={(value) => `GHS ${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    indicator="dot"
                />} 
            />
            <Bar dataKey="total" fill="var(--color-profit)" radius={4} />
        </BarChart>
    </ChartContainer>
  );
}
