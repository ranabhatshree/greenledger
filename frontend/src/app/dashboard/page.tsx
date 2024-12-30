"use client";

import { CircleDollarSign, ArrowUpRight, Users, DollarSign, Receipt, ShoppingCart, Banknote } from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";
import { VendorsList } from "@/components/dashboard/vendors-list";
import { TransactionTable } from "@/components/shared/transaction-table";
import { Loader } from "@/components/ui/loader";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import SalesChart from "@/components/dashboard/sales-chart";
import { useEffect, useState } from "react";
import { fetchTransactions } from "@/data/dashboard-data";
import { BaseTransaction } from "@/components/shared/transaction-table";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useSalesChart } from "@/hooks/use-sales-chart";
import { useVendorsStats } from "@/hooks/use-vendors-stats";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "decimal",
    maximumFractionDigits: 2,
  }).format(amount);
};

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });

  const { data, isLoading, error } = useDashboardStats(dateRange);
  const { chartData, metrics: salesMetrics } = useSalesChart(dateRange);
  const { vendors } = useVendorsStats(dateRange);
  const [transactions, setTransactions] = useState<BaseTransaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);

  useEffect(() => {
    const getTransactions = async () => {
      try {
        setTransactionsLoading(true);
        const data = await fetchTransactions(dateRange.from, dateRange.to);
        const formattedData = data.map((transaction: BaseTransaction) => ({
          ...transaction,
          date: transaction.invoiceDate ? new Date(transaction.invoiceDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }) : 'N/A',  
        }));
        setTransactions(formattedData);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setTransactionsLoading(false);
      }
    };

    getTransactions();
  }, [dateRange]);

  if (isLoading || transactionsLoading) return <Loader />;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!data) return null;

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard Overview</h1>
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
          title="Total Revenue (NPR)"
          value={formatCurrency(data.sales.total)}
          change={`${data.sales.count} sales this month`}
          isPositive={data.metrics.profitLoss > 0}
          icon={CircleDollarSign}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />
        <StatsCard
          title="Total Expenses (NPR)"
          value={formatCurrency(data.expenses.total)}
          change={`${data.expenses.count} expenses recorded`}
          isPositive={false}
          icon={ArrowUpRight}
          iconColor="text-red-600"
          iconBgColor="bg-red-100"
        />
        <StatsCard
          title="Total Parties"
          value={data.parties.total.toString()}
          change={`${data.parties.activePercentage}% active parties`}
          isPositive={data.parties.activePercentage > 50}
          icon={Users}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
        />
        <StatsCard
          title="Total Purchases (NPR)"
          value={formatCurrency(data.purchases.total)}
          change={`${data.purchases.count} purchases made`}
          isPositive={true}
          icon={DollarSign}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:mt-8 lg:grid-cols-3 lg:gap-6">
        <div className="col-span-1 lg:col-span-2">
          <SalesChart 
            data={chartData} 
            isLoading={isLoading} 
            error={error} 
          />
        </div>
        <VendorsList 
          vendors={vendors} 
          isLoading={isLoading} 
          error={error} 
        />
      </div>

      <div className="mt-4 lg:mt-6">
        <TransactionTable
          title="Recent Transactions"
          data={transactions}
          showType={true}
          columns={[
            {
              header: "Type",
              accessorKey: "type",
              cell: (transaction: BaseTransaction) => {
                const type = transaction.type?.toLowerCase() as 'sale' | 'purchase';
                const typeConfig = {
                  sale: { icon: Receipt, color: "text-green-600" },
                  purchase: { icon: ShoppingCart, color: "text-orange-600" },
                  expense: { icon: ArrowUpRight, color: "text-red-600" },
                  payment: { icon: Banknote, color: "text-blue-600" },
                } as const;
                const config = typeConfig[type] || { icon: CircleDollarSign, color: "text-gray-600" };
                const Icon = config.icon;

                return (
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${config.color}`} />
                    <span className="capitalize">{type}</span>
                  </div>
                );
              },
            },
            {
              header: "Date",
              accessorKey: "date",
            },
            {
              header: "Invoice Number",
              accessorKey: "invoiceNumber",
            },
            {
              header: "Amount",
              accessorKey: "amount",
            },
            {
              header: "Description",
              accessorKey: "description",
            }
          ]}
        />
      </div>
    </>
  );
} 