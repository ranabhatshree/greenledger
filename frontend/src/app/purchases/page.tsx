"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Plus, CalendarIcon } from "lucide-react";
import { BaseTransaction, TransactionTable } from "@/components/shared/transaction-table";
import { Loader } from "@/components/ui/loader";
import Link from "next/link";
import { format, startOfMonth } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import axiosInstance from "@/lib/api/axiosInstance";

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
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });

  const fetchPurchases = async (dateRange?: DateRange) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (dateRange?.from) {
        params.append('from', format(dateRange.from, 'yyyy-MM-dd'));
      }
      if (dateRange?.to) {
        params.append('to', format(dateRange.to, 'yyyy-MM-dd'));
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

  useEffect(() => {
    fetchPurchases(date);
  }, [date]);

  if (loading) return <Loader />;

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Purchases</h1>
          
          <div className="flex-1 flex justify-center mx-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal min-w-[300px]",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "LLL dd, y")} -{" "}
                        {format(date.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(date.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
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