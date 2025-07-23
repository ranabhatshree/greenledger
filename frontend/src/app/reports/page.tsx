"use client";

import { useState } from "react";
import { 
  CircleDollarSign, 
  ArrowUpRight, 
  Users, 
  ShoppingCart, 
  ArrowDownRight,
  ArrowUpLeft,
  RotateCcw,
  TrendingUp
} from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Loader } from "@/components/ui/loader";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useReportsData, MonthlyData } from "@/hooks/use-reports-data";
import ReportsChart from "@/components/dashboard/reports-chart";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "decimal",
    maximumFractionDigits: 2,
  }).format(amount);
};

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1), // Default to 3 months ago
    to: new Date(),
  });

  const { data, isLoading, error } = useReportsData(dateRange);

  if (isLoading) return <Loader />;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!data) return <div className="text-gray-500">No data available. Please select a date range.</div>;

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600 mt-1">Comprehensive shop performance metrics and analytics</p>
          </div>
          <DateRangePicker
            from={dateRange.from}
            to={dateRange.to}
            onSelect={(range) => {
              setDateRange({
                from: range?.from,
                to: range?.to,
              });
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        <StatsCard
          title="Gross Revenue (NPR)"
          value={formatCurrency(data.metrics.grossRevenue)}
          change={`${data.metrics.counts.sales} sales recorded`}
          isPositive={true}
          icon={CircleDollarSign}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />
        <StatsCard
          title="Total Expenses (NPR)"
          value={formatCurrency(data.metrics.expenses)}
          change={`${data.metrics.counts.expenses} expenses recorded`}
          isPositive={false}
          icon={ArrowUpRight}
          iconColor="text-red-600"
          iconBgColor="bg-red-100"
        />
        <StatsCard
          title="Total Parties"
          value={data.metrics.parties.toString()}
          change="Vendors & suppliers"
          isPositive={true}
          icon={Users}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
        />
        <StatsCard
          title="Total Purchases (NPR)"
          value={formatCurrency(data.metrics.purchases)}
          change={`${data.metrics.counts.purchases} purchases made`}
          isPositive={true}
          icon={ShoppingCart}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        <StatsCard
          title="Payments Received (NPR)"
          value={formatCurrency(data.metrics.paymentsReceived)}
          change={`${data.metrics.counts.paymentsReceived} payments received`}
          isPositive={true}
          icon={ArrowDownRight}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />
        <StatsCard
          title="Payments Sent (NPR)"
          value={formatCurrency(data.metrics.paymentsSent)}
          change={`${data.metrics.counts.paymentsSent} payments sent`}
          isPositive={false}
          icon={ArrowUpLeft}
          iconColor="text-orange-600"
          iconBgColor="bg-orange-100"
        />
        <StatsCard
          title="Returns (NPR)"
          value={formatCurrency(data.metrics.returns)}
          change={`${data.metrics.counts.returns} returns processed`}
          isPositive={false}
          icon={RotateCcw}
          iconColor="text-red-600"
          iconBgColor="bg-red-100"
        />
      </div>

      <div className="mt-6">
        <StatsCard
          title="Net Revenue (NPR)"
          value={formatCurrency(data.metrics.netRevenue)}
          change={`Gross Revenue - Returns = ${formatCurrency(data.metrics.netRevenue)}`}
          isPositive={data.metrics.netRevenue > 0}
          icon={TrendingUp}
          iconColor={data.metrics.netRevenue > 0 ? "text-green-600" : "text-red-600"}
          iconBgColor={data.metrics.netRevenue > 0 ? "bg-green-100" : "bg-red-100"}
        />
      </div>

      {data.isMoreThanOneMonth && data.monthlyBreakdown && (
        <div className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly Breakdown Table */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Breakdown</CardTitle>
                  <CardDescription>
                    Detailed month-by-month performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Month</TableHead>
                          <TableHead className="text-right">Gross Revenue</TableHead>
                          <TableHead className="text-right">Expenses</TableHead>
                          <TableHead className="text-right">Purchases</TableHead>
                          <TableHead className="text-right">Payments Received</TableHead>
                          <TableHead className="text-right">Payments Sent</TableHead>
                          <TableHead className="text-right">Returns</TableHead>
                          <TableHead className="text-right">Net Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.monthlyBreakdown.map((month: MonthlyData) => (
                          <TableRow key={month.month}>
                            <TableCell className="font-medium">{month.monthName}</TableCell>
                            <TableCell className="text-right">{formatCurrency(month.grossRevenue)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(month.expenses)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(month.purchases)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(month.paymentsReceived)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(month.paymentsSent)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(month.returns)}</TableCell>
                            <TableCell className={`text-right font-semibold ${
                              month.netRevenue > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(month.netRevenue)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Chart */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Chart</CardTitle>
                  <CardDescription>
                    Revenue, expenses, and net revenue comparison
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ReportsChart 
                    data={data.monthlyBreakdown || []}
                    isLoading={isLoading}
                    error={error}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {!data.isMoreThanOneMonth && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Period Summary</CardTitle>
              <CardDescription>
                Selected period is less than one month - showing aggregate data only
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(data.metrics.grossRevenue)}</p>
                  <p className="text-sm text-gray-600">Gross Revenue</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(data.metrics.expenses)}</p>
                  <p className="text-sm text-gray-600">Expenses</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{formatCurrency(data.metrics.returns)}</p>
                  <p className="text-sm text-gray-600">Returns</p>
                </div>
                <div className="text-center">
                  <p className={`text-2xl font-bold ${data.metrics.netRevenue > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(data.metrics.netRevenue)}
                  </p>
                  <p className="text-sm text-gray-600">Net Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
} 