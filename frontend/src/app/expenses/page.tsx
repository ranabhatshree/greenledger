"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TransactionTable } from "@/components/shared/transaction-table";
import { Loader } from "@/components/ui/loader";
import Link from "next/link";
import axiosInstance from "@/lib/api/axiosInstance";
import { format, startOfMonth, endOfMonth } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Label } from "@/components/ui/label";

// Define types for the API response
interface Expense {
  _id: string;
  amount: number;
  invoiceNumber?: string;
  category: {
    _id: string;
    name: string;
  };
  createdBy: {
    _id: string;
    name: string;
  };
  description: string;
  billPhotos: string[];
  invoiceDate: string;
  isVatable: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ExpenseResponse {
  expenses: Expense[];
}

// Add this interface
interface TransformedExpense {
  id: string;
  type: "Expense";
  description: string;
  date: string;
  amount: string;
  status: string;
  invoiceNumber: string;
  category: string;
  createdBy: string;
  billPhotos?: string[];
  isVatable: boolean;
}

export default function ExpensesPage() {
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<TransformedExpense[]>([]);
  const [fromDate, setFromDate] = useState<Date>(startOfMonth(new Date()));
  const [toDate, setToDate] = useState<Date>(endOfMonth(new Date()));

  const fetchExpenses = async (from?: Date, to?: Date) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (from) {
        params.append('from', format(from, 'yyyy-MM-dd'));
      }
      if (to) {
        params.append('to', format(to, 'yyyy-MM-dd'));
      }

      const response = await axiosInstance.get<ExpenseResponse>(
        `/expenses?${params.toString()}`
      );

      const transformedExpenses = response.data.expenses.map((expense) => ({
        id: expense._id,
        type: "Expense" as const,
        description: expense.description,
        date: new Date(expense.invoiceDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        amount: expense.amount.toString(),
        status: "Paid",
        invoiceNumber: expense.invoiceNumber || "N/A",
        category: expense.category.name,
        createdBy: expense.createdBy.name,
        billPhotos: expense.billPhotos,
        isVatable: expense.isVatable
      }));
      setExpenses(transformedExpenses);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFromDateChange = (date: Date | null) => {
    if (date) {
      setFromDate(date);
      fetchExpenses(date, toDate);
    }
  };

  const handleToDateChange = (date: Date | null) => {
    if (date) {
      setToDate(date);
      fetchExpenses(fromDate, date);
    }
  };

  useEffect(() => {
    fetchExpenses(fromDate, toDate);
  }, []);

  if (loading) return <Loader />;

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Expenses</h1>
          
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

          <Link href="/expenses/create">
            <Button 
              className="bg-red-600 hover:bg-red-700 flex items-center"
              aria-label="Add Expense"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </Link>
        </div>
        
        <TransactionTable 
          title="Expenses Transactions" 
          data={expenses}
          showType={true} 
        />
      </div>
    </AppLayout>
  );
} 