"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon, EyeIcon, FileInputIcon, Plus } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { startOfMonth, endOfMonth, format } from "date-fns";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import axiosInstance from "@/lib/api/axiosInstance";
import { DateRange } from "react-day-picker";
import { TransactionTable, BaseTransaction } from "@/components/shared/transaction-table";

interface SaleResponse {
  _id: string;
  billingParty: string;
  invoiceNumber: string;
  invoiceDate: string;
  grandTotal: number;
  createdAt: string;
  isVatable: boolean;
  billPhotos: string[];
  description: string;
  note: string;
}

export default function SalesPage() {
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<BaseTransaction[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const { toast } = useToast();

  const fetchSales = async (from?: Date, to?: Date) => {
    try {
      setLoading(true);
      const fromDate = from 
        ? format(from, 'yyyy-MM-dd')
        : format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const toDate = to
        ? format(to, 'yyyy-MM-dd')
        : format(endOfMonth(new Date()), 'yyyy-MM-dd');
      
      const response = await axiosInstance.get(`/sales?from=${fromDate}&to=${toDate}`);
      
      if (response.status !== 200) {
        throw new Error('Failed to fetch sales data');
      }
      
      const transformedSales: BaseTransaction[] = response.data.sales.map((sale: SaleResponse) => ({
        id: sale._id,
        type: "Sale",
        date: format(new Date(sale.invoiceDate), 'MMM dd, yyyy'),
        amount: sale.grandTotal.toLocaleString(),
        status: "Completed",
        invoiceNumber: sale.invoiceNumber,
        billingParty: sale.billingParty,
        isVatable: sale.isVatable,
        billPhotos: sale.billPhotos,
        description: sale.description,
        note: sale.note,
      }));

      setSales(transformedSales);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch sales data",
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (newDateRange: DateRange | undefined) => {
    if (newDateRange) {
      setDateRange(newDateRange);
      fetchSales(newDateRange.from, newDateRange.to);
    }
  };

  useEffect(() => {
    fetchSales(dateRange?.from, dateRange?.to);
  }, []);

  if (loading) return <Loader />;

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Sales</h1>
          <div className="flex-1 flex justify-center mx-4 relative z-10">
            <DateRangePicker
              from={dateRange.from}
              to={dateRange.to}
              onSelect={handleDateRangeChange}
              className="w-auto min-w-[300px] max-w-[400px]"
            />
          </div>
          <Link href="/sales/create">
            <Button 
              className="bg-green-600 hover:bg-green-700 flex items-center"
              aria-label="Add Sale"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Sale
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <TransactionTable
            title="Sales Transactions"
            data={sales}
            showType={false}
            columns={[
              {
                header: "Date",
                accessorKey: "date",
              },
              {
                header: "Customer",
                accessorKey: "billingParty",
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
                header: "Invoice",
                cell: (transaction) => (
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold)}`}
                  >
                    <Link href={`/sales/invoice/${transaction.id}`} target="_blank">
                      <FileInputIcon className="mr-2 h-4 w-4" />
                    </Link>
                  </span>
                ),
              },
            ]}
            searchableColumns={[
              {
                id: "date",
                value: (row: BaseTransaction) => row.date,
              },
              {
                id: "billingParty",
                value: (row: BaseTransaction) => row.billingParty || "",
              },
              {
                id: "invoiceNumber",
                value: (row: BaseTransaction) => row.invoiceNumber || "",
              },
              {
                id: "amount",
                value: (row: BaseTransaction) => row.amount,
              },
            ]}
          />
        </div>
      </div>
    </AppLayout>
  );
} 