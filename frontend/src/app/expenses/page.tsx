"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Plus, CalendarIcon } from "lucide-react";
import { TransactionTable } from "@/components/shared/transaction-table";
import { Loader } from "@/components/ui/loader";
import Link from "next/link";
import axiosInstance from "@/lib/api/axiosInstance";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import {  startOfMonth } from "date-fns";

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
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });

  const fetchExpenses = async (dateRange?: DateRange) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (dateRange?.from) {
        params.append('from', format(dateRange.from, 'yyyy-MM-dd'));
      }
      if (dateRange?.to) {
        params.append('to', format(dateRange.to, 'yyyy-MM-dd'));
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

  useEffect(() => {
    fetchExpenses(date);
  }, [date]);

  if (loading) return <Loader />;

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Expenses</h1>
          
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