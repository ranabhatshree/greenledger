import axiosInstance from "@/lib/api/axiosInstance";
import { useState, useEffect } from "react";

interface VendorData {
  vendorName: string;
  sales: number;
  growth: number;
  totalTransactions: number;
  averageTransactionValue: number;
  previousPeriodSales: number;
}

interface ApiResponse {
  status: string;
  message: string;
  data: VendorData[];
  metadata: {
    totalVendors: number;
    dateRange: {
      from: string;
      to: string;
    };
    previousPeriod: {
      from: string;
      to: string;
    };
  };
}

interface FormattedVendor {
  name: string;
  growth: string;
  amount: string;
}

export const useVendorsStats = (dateRange: { from?: Date; to?: Date } = {}) => {
  const [vendors, setVendors] = useState<FormattedVendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Convert dates to ISO strings for stable dependency comparison
  const fromDate = dateRange?.from?.toISOString();
  const toDate = dateRange?.to?.toISOString();

  useEffect(() => {
    const fetchVendors = async () => {
      if (!dateRange.from || !dateRange.to) return;

      try {
        const response = await axiosInstance.get('/stats/top-vendors', {
          params: {
            from: dateRange.from.toISOString().split('T')[0],
            to: dateRange.to.toISOString().split('T')[0],
          },
        });

        if (response.status !== 200) {
          throw new Error('Failed to fetch vendors data');
        }
        const result: ApiResponse = response.data;
        
        const formattedVendors = result.data.map(vendor => ({
          name: vendor.vendorName,
          growth: `${vendor.growth > 0 ? '+' : ''}${vendor.growth}%`,
          amount: `NPR ${vendor.sales.toLocaleString('en-IN')}`
        }));

        setVendors(formattedVendors);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch vendors');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVendors();
  }, [fromDate, toDate]);

  return { vendors, isLoading, error };
}; 