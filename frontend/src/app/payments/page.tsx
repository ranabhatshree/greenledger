"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Plus, ArrowDownNarrowWide, CrosshairIcon, CheckCircleIcon } from "lucide-react";
import { BaseTransaction, TransactionTable } from "@/components/shared/transaction-table";
import { Loader } from "@/components/ui/loader";
import Link from "next/link";
import { format, startOfMonth, endOfMonth } from "date-fns";
import axiosInstance from "@/lib/api/axiosInstance";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Label } from "@/components/ui/label";

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
          <h1 className="text-2xl font-bold">Payments</h1>
          
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