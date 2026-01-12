"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { BaseTransaction, TransactionTable } from "@/components/shared/transaction-table";
import { Loader } from "@/components/ui/loader";
import Link from "next/link";
import { format, startOfMonth, endOfMonth } from "date-fns";
import axiosInstance from "@/lib/api/axiosInstance";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Label } from "@/components/ui/label";

// Define types for the API response
interface Purchase {
  _id: string;
  amount: number;
  invoiceNumber: string;
  invoiceDate: string;
  isVatable: boolean;
  billPhotos: string[];
  createdBy: {
    _id: string;
    name: string;
  };
  suppliedBy: {
    _id: string;
    name: string;
  };
  description: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

interface PurchaseResponse {
  purchases: Purchase[];
}

interface TransformedPurchase {
  id: string;
  type: "Purchase";
  description: string;
  date: string;
  amount: string;
  status: string;
  invoiceNumber: string;
  suppliedBy: string;
  createdBy: string;
  billPhotos?: string[];
  isVatable: boolean;
}

export default function PurchasesPage() {
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<TransformedPurchase[]>([]);
  const [fromDate, setFromDate] = useState<Date>(startOfMonth(new Date()));
  const [toDate, setToDate] = useState<Date>(endOfMonth(new Date()));

  const fetchPurchases = async (from?: Date, to?: Date) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (from) {
        params.append('from', format(from, 'yyyy-MM-dd'));
      }
      if (to) {
        params.append('to', format(to, 'yyyy-MM-dd'));
      }

      const response = await axiosInstance.get<PurchaseResponse>(
        `/purchases?${params.toString()}`
      );

      const transformedPurchases = response.data.purchases.map((purchase) => ({
        id: purchase._id,
        type: "Purchase" as const,
        description: purchase.description,
        date: new Date(purchase.invoiceDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        amount: purchase.amount.toLocaleString(),
        status: "Completed",
        invoiceNumber: purchase.invoiceNumber,
        suppliedBy: purchase.suppliedBy.name,
        createdBy: purchase.createdBy.name,
        billPhotos: purchase.billPhotos,
        isVatable: purchase.isVatable
      }));
      setPurchases(transformedPurchases);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFromDateChange = (date: Date | null) => {
    if (date) {
      setFromDate(date);
      fetchPurchases(date, toDate);
    }
  };

  const handleToDateChange = (date: Date | null) => {
    if (date) {
      setToDate(date);
      fetchPurchases(fromDate, date);
    }
  };

  useEffect(() => {
    fetchPurchases(fromDate, toDate);
  }, []);

  if (loading) return <Loader />;

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Purchases</h1>
          
          <div className="flex-1 flex justify-center items-center gap-4 mx-4 relative z-10">
            <div className="flex items-center gap-2">
              <Label htmlFor="fromDate" className="text-sm font-medium whitespace-nowrap">
                From:
              </Label>
              <DatePicker
                selected={fromDate}
                onChange={handleFromDateChange}
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
                onChange={handleToDateChange}
                dateFormat="dd/MM/yyyy"
                placeholderText="To date"
                className="flex h-9 w-[140px] rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                minDate={fromDate}
              />
            </div>
          </div>

          <Link href="/purchases/create">
            <Button 
              className="bg-green-600 hover:bg-green-700 flex items-center"
              aria-label="Add Purchase"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Purchase
            </Button>
          </Link>
        </div>
        
        <TransactionTable 
          title="Purchase Transactions" 
          data={purchases}
          showType={false}
          transactionType="purchase"
        />
      </div>
    </AppLayout>
  );
} 