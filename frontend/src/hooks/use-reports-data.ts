import { useState, useEffect } from 'react';
import axiosInstance from '@/lib/api/axiosInstance';

export interface ReportsMetrics {
  grossRevenue: number;
  expenses: number;
  parties: number;
  purchases: number;
  paymentsReceived: number;
  paymentsSent: number;
  returns: number;
  netRevenue: number;
  counts: {
    sales: number;
    expenses: number;
    purchases: number;
    paymentsReceived: number;
    paymentsSent: number;
    returns: number;
  };
}

export interface MonthlyData {
  month: string;
  monthName: string;
  grossRevenue: number;
  expenses: number;
  purchases: number;
  paymentsReceived: number;
  paymentsSent: number;
  returns: number;
  netRevenue: number;
}

export interface ReportsData {
  metrics: ReportsMetrics;
  monthlyBreakdown: MonthlyData[] | null;
  isMoreThanOneMonth: boolean;
  dateRange: {
    from: Date;
    to: Date;
  };
}

export function useReportsData(dateRange: { from: Date | undefined; to: Date | undefined }) {
  const [data, setData] = useState<ReportsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReportsData = async () => {
      if (!dateRange.from || !dateRange.to) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const fromDate = dateRange.from.toISOString().split('T')[0];
        const toDate = dateRange.to.toISOString().split('T')[0];

        const response = await axiosInstance.get(`/stats/reports?from=${fromDate}&to=${toDate}`);
        
        if (response.data.status === 'success') {
          setData(response.data.data);
        } else {
          setError(response.data.message || 'Failed to fetch reports data');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch reports data');
        console.error('Error fetching reports data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportsData();
  }, [dateRange.from, dateRange.to]);

  return { data, isLoading, error };
} 