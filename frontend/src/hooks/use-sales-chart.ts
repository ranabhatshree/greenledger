import { useState, useEffect } from 'react';
import axiosInstance from "@/lib/api/axiosInstance";

interface SalesDataPoint {
  date: string;
  totalSales: number;
  averageOrderValue: number;
  orderCount: number;
}

interface Metrics {
  totalRevenue: number;
  averageOrderValue: number;
  totalOrders: number;
}

interface DateRange {
  start: string;
  end: string;
}

interface SalesAnalytics {
  data: SalesDataPoint[];
  metrics: Metrics;
  dateRange: DateRange;
}

export const useSalesChart = (dateRange: { from?: Date; to?: Date } = {}) => {
  const [salesData, setSalesData] = useState<SalesDataPoint[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [responseDateRange, setResponseDateRange] = useState<DateRange | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Convert dates to ISO strings for stable dependency comparison
  const fromDate = dateRange?.from?.toISOString();
  const toDate = dateRange?.to?.toISOString();

  useEffect(() => {
    const fetchSalesData = async () => {
      if (!dateRange.from || !dateRange.to) return;

      try {
        const response = await axiosInstance.get<SalesAnalytics>('/stats/sales', {
          params: {
            from: dateRange.from.toISOString().split('T')[0],
            to: dateRange.to.toISOString().split('T')[0],
          },
        });
        
        const { data, metrics, dateRange: responseDateRange } = response.data;
        const filteredData = data.filter(item => item.totalSales > 0);
        
        setSalesData(filteredData);
        setMetrics(metrics);
        setResponseDateRange(responseDateRange);
      } catch (err) {
        setError('Failed to fetch sales data');
        console.error('Error fetching sales data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalesData();
  }, [fromDate, toDate]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Transform data for chart display
  const chartData = salesData.map(item => ({
    date: formatDate(item.date),
    sales: item.totalSales,
    orders: item.orderCount,
    averageOrder: item.averageOrderValue
  }));

  return { 
    chartData, 
    metrics, 
    dateRange: responseDateRange,
    isLoading, 
    error 
  };
}; 