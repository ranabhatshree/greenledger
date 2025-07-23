'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { MonthlyData } from '@/hooks/use-reports-data';

interface ReportsChartProps {
  data: MonthlyData[];
  isLoading: boolean;
  error: string | null;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(amount);
};

const ReportsChart = ({ data, isLoading, error }: ReportsChartProps) => {
  if (isLoading) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading chart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-red-50 rounded-lg">
        <div className="text-center">
          <p className="text-red-500 font-medium">Chart Error</p>
          <p className="text-red-400 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <p className="text-gray-600">No data available</p>
          <p className="text-gray-500 text-sm mt-1">Select a date range to view chart</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const chartData = data.map(item => ({
    month: item.monthName.split(' ')[0], // Short month name
    grossRevenue: item.grossRevenue,
    expenses: item.expenses,
    netRevenue: item.netRevenue,
    returns: item.returns,
    purchases: item.purchases
  }));

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="month"
            tick={{ fill: '#6B7280', fontSize: 12 }}
            tickLine={{ stroke: '#6B7280' }}
          />
          <YAxis
            tick={{ fill: '#6B7280', fontSize: 12 }}
            tickLine={{ stroke: '#6B7280' }}
            tickFormatter={(value) => formatCurrency(value)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px'
            }}
            formatter={(value: number, name: string) => [
              formatCurrency(value),
              name === 'grossRevenue' ? 'Gross Revenue' :
              name === 'expenses' ? 'Expenses' :
              name === 'netRevenue' ? 'Net Revenue' :
              name === 'returns' ? 'Returns' :
              name === 'purchases' ? 'Purchases' : name
            ]}
            labelStyle={{ color: '#374151', fontWeight: 'medium' }}
          />
          <Legend 
            wrapperStyle={{ fontSize: '12px' }}
            formatter={(value) => (
              value === 'grossRevenue' ? 'Gross Revenue' :
              value === 'expenses' ? 'Expenses' :
              value === 'netRevenue' ? 'Net Revenue' :
              value === 'returns' ? 'Returns' :
              value === 'purchases' ? 'Purchases' : value
            )}
          />
          <Bar 
            dataKey="grossRevenue" 
            fill="#22c55e" 
            name="grossRevenue"
            radius={[2, 2, 0, 0]}
          />
          <Bar 
            dataKey="expenses" 
            fill="#ef4444" 
            name="expenses"
            radius={[2, 2, 0, 0]}
          />
          <Bar 
            dataKey="netRevenue" 
            fill="#3b82f6" 
            name="netRevenue"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ReportsChart; 