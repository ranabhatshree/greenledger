"use client";

import * as React from "react";
import { DollarSign, ArrowUpRight, ArrowDown, CheckCircle, RotateCcw } from "lucide-react";
import { DataTable, Column } from "@/components/ui/data-table";
import { useState, useMemo } from "react";

export interface BaseTransaction {
  id: string | number;
  type?: "Sale" | "Expense" | "Purchase" | "Payment" | "Returns";
  date: string;
  amount: string;
  status: string;
  description?: string;
  invoiceNumber?: string;
  vendor?: string;
  category?: string;
  isVatable?: boolean;
  billPhotos?: string[];
  suppliedBy?: string;
  billingParty?: string;
  paymentDepositedDate?: string;
  paymentReceivedDate?: string;
  paidBy?: string;
  paymentType?: string;
  paymentAmount?: string;
  paymentNote?: string;
  receivedOrPaid?: boolean;
  paymentStatus?: string;
  particulars?: string;
  drAmount?:number;
  crAmount?:number;
  invoiceDate?: Date;
  editHistoryLogs?: any[];
  runningBalance?: number;
}

interface TransactionTableProps {
  title: string;
  data: BaseTransaction[];
  showType: boolean;
  columns?: Column<BaseTransaction>[];
  searchableColumns?: {
    id: string;
    value: (row: BaseTransaction) => string;
  }[];
  transactionType?: string;
  footer?: React.ReactNode;
}

const iconMap: Record<string, JSX.Element> = {
  Sale: <DollarSign className="text-green-500 p-2 bg-green-100 rounded-full h-10 w-10" />,
  Expense: <ArrowDown className="text-red-500 p-2 bg-red-100 rounded-full h-10 w-10" />,
  Purchase: <ArrowUpRight className="text-orange-500 p-2 bg-orange-100 rounded-full h-10 w-10" />,
  Payment: <CheckCircle className="text-blue-500 p-2 bg-blue-100 rounded-full h-10 w-10" />,
  Returns: <RotateCcw className="text-purple-500 p-2 bg-purple-100 rounded-full h-10 w-10" />,
};

const getStatusStyles = (status: string) => {
  const statusMap: Record<string, string> = {
    Completed: "bg-green-100 text-green-700",
    Pending: "bg-yellow-100 text-yellow-700",
    Paid: "bg-blue-100 text-blue-700",
    Received: "bg-purple-100 text-purple-700",
  };
  return statusMap[status] || "bg-gray-100 text-gray-700";
};

export function TransactionTable({ 
  title, 
  data, 
  showType, 
  columns: customColumns,
  searchableColumns: customSearchableColumns,
  footer
}: TransactionTableProps) {
  const defaultColumns: Column<BaseTransaction>[] = [
    {
      header: "Date",
      accessorKey: "date",
    },
    {
      header: data.some(transaction => transaction.category) ? "Category" : "Supplier",
      accessorKey: data.some(transaction => transaction.category) ? "category" : "suppliedBy",
    },
    {
      header: "Invocie/Ref. Number",
      accessorKey: "invoiceNumber",
    },
    {
      header: "Amount",
      accessorKey: "amount",
    },
    {
      header: "Description",
      accessorKey: "description",
    },
    {
      header: "Bill Photos",
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
      header: "Bill Type",
      cell: (transaction) => (
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusStyles(
            transaction.status
          )}`}
        >
          {transaction.isVatable ? "VAT" : "Normal"}
        </span>
      ),
    },
  ];

  const defaultSearchableColumns = [
    {
      id: "date",
      value: (row: BaseTransaction) => row.date || "",
    },
    {
      id: "invoiceNumber",
      value: (row: BaseTransaction) => row.invoiceNumber || "",
    },
    {
      id: "category",
      value: (row: BaseTransaction) => row.category || "",
    },
    {
      id: "suppliedBy",
      value: (row: BaseTransaction) => row.suppliedBy || "",
    },
    {
      id: "amount",
      value: (row: BaseTransaction) => row.amount || "",
    },
    {
      id: "description",
      value: (row: BaseTransaction) => row.description || "",
    },
    {
      id: "billType",
      value: (row: BaseTransaction) => row.isVatable ? "VAT" : "Normal",
    },
  ];

  const [searchValue, setSearchValue] = useState("");
  
  const columns = customColumns || defaultColumns;
  const searchableColumns = customSearchableColumns || defaultSearchableColumns;

  const filteredData = useMemo(() => {
    if (!searchValue) return data;
    
    return data.filter(row => {
      return searchableColumns.some(column => {
        const value = column.value(row);
        return value.toLowerCase().includes(searchValue.toLowerCase());
      });
    });
  }, [data, searchValue, searchableColumns]);

  return (
    <DataTable<BaseTransaction>
      title={title}
      data={filteredData}
      columns={columns}
      searchPlaceholder="Search..."
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      footer={footer}
    />
  );
} 