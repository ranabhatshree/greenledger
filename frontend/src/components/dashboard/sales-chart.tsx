'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';
import { useTheme } from 'next-themes';
import { Card } from '@/components/ui/card';

interface SalesChartProps {
  data: any[];
  isLoading: boolean;
  error: string | null;
}

const SalesChart = ({ data, isLoading, error }: SalesChartProps) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const axisColor = isDark ? '#9ca3af' : '#6B7280';
  const gridColor = isDark ? '#374151' : '#f0f0f0';
  const tooltipStyle = {
    backgroundColor: isDark ? '#1f2937' : 'white',
    border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
    borderRadius: '6px',
    boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    color: isDark ? '#f9fafb' : '#111827',
  };

  if (error) {
    return (
      <Card className="w-full p-6">
        <h3 className="text-lg font-medium text-foreground mb-4">Sales Overview</h3>
        <div className="flex items-center justify-center h-[400px]">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full p-6">
      <h3 className="text-lg font-medium text-foreground mb-6">Sales Overview</h3>
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => format(new Date(value), 'MMM d')}
              tick={{ fill: axisColor }}
              tickLine={{ stroke: axisColor }}
            />
            <YAxis
              tick={{ fill: axisColor }}
              tickLine={{ stroke: axisColor }}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            <Line
              type="monotone"
              dataKey="sales"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ fill: '#6366f1', strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default SalesChart;
