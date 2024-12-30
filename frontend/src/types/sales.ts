export interface SalesAnalytics {
  message: string;
  data: DailySales[];
  metrics: SalesMetrics;
  dateRange: DateRange;
}

export interface DailySales {
  date: string;
  totalSales: number;
  averageOrderValue: number;
  orderCount: number;
}

export interface SalesMetrics {
  totalRevenue: number;
  averageOrderValue: number;
  totalOrders: number;
}

export interface DateRange {
  start: string;
  end: string;
} 