"use client";

import { CircleDollarSign, ArrowUpRight, Users, DollarSign, Receipt, ShoppingCart, Banknote } from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";
import { VendorsList } from "@/components/dashboard/vendors-list";
import { TransactionTable } from "@/components/shared/transaction-table";
import { Loader } from "@/components/ui/loader";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import SalesChart from "@/components/dashboard/sales-chart";
import { useEffect, useState, useMemo } from "react";
import { fetchTransactions } from "@/data/dashboard-data";
import { BaseTransaction } from "@/components/shared/transaction-table";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Label } from "@/components/ui/label";
import { useSalesChart } from "@/hooks/use-sales-chart";
import { useVendorsStats } from "@/hooks/use-vendors-stats";
import { useRouter } from "next/navigation";
import { checkOnboardingComplete } from "@/lib/utils/onboarding";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "decimal",
    maximumFractionDigits: 2,
  }).format(amount);
};

export default function DashboardPage() {
  const router = useRouter();
  const [fromDate, setFromDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [toDate, setToDate] = useState<Date>(new Date());

  // Memoize dateRange to prevent infinite loops
  const dateRange = useMemo(() => ({ from: fromDate, to: toDate }), [fromDate, toDate]);
  const { data, isLoading, error } = useDashboardStats(dateRange);
  const { chartData, metrics: salesMetrics, error: salesError } = useSalesChart(dateRange);
  const { vendors } = useVendorsStats(dateRange);
  const [transactions, setTransactions] = useState<BaseTransaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);

  // Check onboarding status on mount
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const isComplete = await checkOnboardingComplete();
        if (!isComplete) {
          router.push('/onboarding');
        }
      } catch (error) {
        // If check fails, redirect to onboarding
        router.push('/onboarding');
      } finally {
        setIsCheckingOnboarding(false);
      }
    };

    checkOnboarding();
  }, [router]);

  // Memoize date strings for stable comparison
  const fromDateStr = useMemo(() => fromDate.toISOString().split('T')[0], [fromDate]);
  const toDateStr = useMemo(() => toDate.toISOString().split('T')[0], [toDate]);

  useEffect(() => {
    const getTransactions = async () => {
      try {
        setTransactionsLoading(true);
        const data = await fetchTransactions(fromDate, toDate);
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
  }, [fromDateStr, toDateStr]);

  if (isCheckingOnboarding || isLoading || transactionsLoading) return <Loader />;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!data) return null;

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard Overview</h1>
          <div className="flex items-center gap-2">
            <Label htmlFor="fromDate" className="text-sm font-medium whitespace-nowrap">
              From:
            </Label>
            <DatePicker
              selected={fromDate}
              onChange={(date) => date && setFromDate(date)}
              dateFormat="dd/MM/yyyy"
              placeholderText="From date"
              className="flex h-9 w-[140px] rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              maxDate={toDate}
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="toDate" className="text-sm font-medium whitespace-nowrap">
              To:
            </Label>
            <DatePicker
              selected={toDate}
              onChange={(date) => date && setToDate(date)}
              dateFormat="dd/MM/yyyy"
              placeholderText="To date"
              className="flex h-9 w-[140px] rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              minDate={fromDate}
            />
          </div>
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
            error={salesError} 
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
          searchableColumns={[
            {
              id: "date",
              value: (row: BaseTransaction) => row.date,
            },
            {
              id: "type",
              value: (row: BaseTransaction) => row.type || "",
            },
            {
              id: "description",
              value: (row: BaseTransaction) => row.description || "",
            },
            {
              id: "invoiceNumber",
              value: (row: BaseTransaction) => row.invoiceNumber || "",
            } 
          ]}
        />
      </div>
    </>
  );
} 