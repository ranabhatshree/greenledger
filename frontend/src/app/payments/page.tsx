"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Plus, CalendarIcon, ArrowDownNarrowWide, CrosshairIcon, CheckCircleIcon } from "lucide-react";
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
interface Payment {
  _id: string;
  amount: number;
  invoiceNumber: string;
  paymentReceivedDate: string;
  paymentDepositedDate: string | null;
  type: string;
  billPhotos: string[];
  createdBy: {
    _id: string;
    name: string;
  };
  paidBy: {
    _id: string;
    name: string;
  };
  description: string;
  createdAt: string;
  updatedAt: string;
  paymentType: string;
  invoiceDate: string;
  receivedOrPaid: boolean;
}

interface PaymentResponse {
  payments: Payment[];
}

export default function PurchasesPage() {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<BaseTransaction[]>([]);
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

      const response = await axiosInstance.get<PaymentResponse>(
        `/payments?${params.toString()}`
      );

      const transformedPayments: BaseTransaction[] = response.data.payments.map((payment) => ({
        id: payment._id,
        paymentType: payment.type,
        description: payment.description,
        date: new Date(payment.invoiceDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        amount: payment.amount.toLocaleString(),
        status: payment.paymentDepositedDate ? "Deposited" : "Pending",
        invoiceNumber: payment.invoiceNumber,
        paidBy: payment.paidBy.name,
        createdBy: payment.createdBy.name,
        billPhotos: payment.billPhotos,
        paymentDepositedDate: payment.paymentDepositedDate ? new Date(payment.paymentDepositedDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }) : "N/A",
        receivedOrPaid: payment.receivedOrPaid
      }));
      setPayments(transformedPayments);
    } catch (error) {
      console.error('Error fetching payments:', error);
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
          <h1 className="text-2xl font-bold">Payments</h1>
          
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

          <Link href="/payments/create">
            <Button 
              className="bg-green-600 hover:bg-green-700 flex items-center"
              aria-label="Add Payment"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Payment
            </Button>
          </Link>
        </div>
        
        <TransactionTable 
          title="Payment Transactions" 
          data={payments}
          showType={false}
          columns={[
            {
              header: "Payment Received",
              accessorKey: "date",
            },
            {
              header: "Type",
              cell: (transaction) => transaction.paymentType?.toUpperCase() ?? "N/A",
            },
            {
              header: "Paid By",
              accessorKey: "paidBy",
            },
            {
              header: "Cheque/TranscRef. Number",
              accessorKey: "invoiceNumber",
            },
            {
              header: "Amount",
              accessorKey: "amount",
            },
            {
              header: "Payment Photos",
              cell: (transaction) => (
                <div className="flex space-x-2">
                  {transaction.billPhotos && transaction.billPhotos.length > 0 ? (
                    transaction.billPhotos.map((photoUrl, index) => (
                      <a 
                        key={index} 
                        href={photoUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        aria-label={`View bill photo ${index + 1}`}
                      >
                        <img 
                          src={photoUrl} 
                          alt={`Bill photo ${index + 1}`} 
                          className="h-8 w-8 rounded-full border border-gray-300" 
                        />
                      </a>
                    ))
                  ) : (
                    <span>No photos available</span>
                  )}
                </div>
              ),
            },
            {
              header: "Deposited",
              accessorKey: "paymentDepositedDate",
            },
            {
              header: "Description",
              accessorKey: "description",
            },
            {
              header: "Received/Paid",
              accessorKey: "receivedOrPaid",
              cell: (transaction) => (
                <div className="flex items-center">
                  {transaction.receivedOrPaid ? (   
                    <CheckCircleIcon className="text-green-500 p-2 bg-green-100 rounded-full h-10 w-10" />
                  ) : (
                    <ArrowDownNarrowWide className="text-red-500 p-2 bg-red-100 rounded-full h-10 w-10" />
                  )}  
                  <span className="ml-2">{transaction.receivedOrPaid ? "Received" : "Paid"}</span>
                </div>
              )
            },
          ]}
        />
      </div>
    </AppLayout>
  );
} 