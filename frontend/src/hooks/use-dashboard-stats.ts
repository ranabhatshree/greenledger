import axiosInstance from "@/lib/api/axiosInstance";
import { useState, useEffect } from "react";

interface DashboardCards {
  sales: {
    total: number;
    count: number;
  };
  expenses: {
    total: number;
    count: number;
  };
  parties: {
    total: number;
    activePercentage: number;
  };
  purchases: {
    total: number;
    count: number;
  };
  metrics: {
    profitLoss: number;
    dateRange: {
      from: string;
      to: string;
    };
  };
}

export const useDashboardStats = (dateRange: { from?: Date; to?: Date }) => {
  const [data, setData] = useState<DashboardCards | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fromDate = dateRange.from?.toISOString();
  const toDate = dateRange.to?.toISOString();

  useEffect(() => {
    const fetchStats = async () => {
      if (!dateRange.from || !dateRange.to) return;

      try {
        setIsLoading(true);
        const response = await axiosInstance.get("/stats/dashboard-cards", {
          params: {
            from: dateRange.from.toISOString().split('T')[0],
            to: dateRange.to.toISOString().split('T')[0],
          },
        });
        
        if (response.status !== 200) {
          throw new Error("Failed to fetch dashboard stats");
        }

        setData(response.data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [fromDate, toDate]);

  return { data, isLoading, error };
}; 