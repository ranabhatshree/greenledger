"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon, EyeIcon, FileInputIcon, Plus, PencilIcon, HistoryIcon, CalendarIcon } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { startOfMonth, endOfMonth, format } from "date-fns";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import axiosInstance from "@/lib/api/axiosInstance";
import { DateRange } from "react-day-picker";
import { TransactionTable, BaseTransaction } from "@/components/shared/transaction-table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface EditHistoryLog {
  description: string;
  editedBy: string;
  editedAt: string;
  _id: string;
}

interface SaleTransaction extends BaseTransaction {
  editHistoryLogs?: EditHistoryLog[];
}

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
  editHistoryLogs: any[];
}

export default function SalesPage() {
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<SaleTransaction[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<SaleTransaction | null>(null);
  const [editedInvoiceNumber, setEditedInvoiceNumber] = useState("");
  const [editedAmount, setEditedAmount] = useState("");
  const [editedDate, setEditedDate] = useState<Date | undefined>();
  const [editLoading, setEditLoading] = useState(false);
  const { toast } = useToast();
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [viewingSaleHistory, setViewingSaleHistory] = useState<string | null>(null);
  const [historyLogs, setHistoryLogs] = useState<EditHistoryLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

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
      
      const transformedSales: SaleTransaction[] = response.data.sales.map((sale: SaleResponse) => ({
        id: sale._id,
        type: "Sale",
        date: format(new Date(sale.invoiceDate), 'MMM dd, yyyy'),
        invoiceDate: new Date(sale.invoiceDate), // Keep original date for editing
        amount: sale.grandTotal.toLocaleString(),
        status: "Completed",
        invoiceNumber: sale.invoiceNumber,
        billingParty: sale.billingParty,
        isVatable: sale.isVatable,
        billPhotos: sale.billPhotos,
        description: sale.description,
        note: sale.note,
        editHistoryLogs: sale.editHistoryLogs,
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

  const handleEditClick = (sale: SaleTransaction) => {
    setEditingSale(sale);
    setEditedInvoiceNumber(sale.invoiceNumber || "");
    setEditedAmount(sale.amount.replace(/,/g, ""));
    setEditedDate(sale.invoiceDate ? new Date(sale.invoiceDate) : undefined);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingSale) return;
    
    try {
      setEditLoading(true);
      
      const updateData: any = {
        invoiceNumber: editedInvoiceNumber,
        grandTotal: parseFloat(editedAmount)
      };
      
      // Only include date if it's been changed
      if (editedDate) {
        updateData.invoiceDate = format(editedDate, 'yyyy-MM-dd');
      }
      
      const response = await axiosInstance.put(`/sales/${editingSale.id}`, updateData);
      
      if (response.status === 200) {
        const updatedSales = sales.map(sale => {
          if (sale.id === editingSale.id) {
            return {
              ...sale,
              invoiceNumber: editedInvoiceNumber,
              amount: parseFloat(editedAmount).toLocaleString(),
              date: editedDate ? format(editedDate, 'MMM dd, yyyy') : sale.date,
              invoiceDate: editedDate || sale.invoiceDate
            };
          }
          return sale;
        });
        
        setSales(updatedSales);
        setEditDialogOpen(false);
        
        toast({
          title: "Success",
          description: "Sale updated successfully",
          variant: "default"
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to update sale. Please try again.",
        variant: "destructive"
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleHistoryClick = (transaction: any) => {
    if (transaction.editHistoryLogs && transaction.editHistoryLogs.length > 0) {
      setHistoryLogs(transaction.editHistoryLogs);
      setHistoryDialogOpen(true);
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
              {
                header: "Actions",
                cell: (transaction) => (
                  <div className="flex items-center space-x-2">
                    <span
                      className="inline-flex rounded-full px-2 py-1 text-xs font-semibold cursor-pointer"
                      onClick={() => handleEditClick(transaction as BaseTransaction)}
                    >
                      <PencilIcon className="h-4 w-4 text-black" />
                    </span>
                    {(transaction.editHistoryLogs?.length ?? 0) > 0 ? (
                      <span
                        className="inline-flex rounded-full px-2 py-1 text-xs font-semibold cursor-pointer"
                        onClick={() => handleHistoryClick(transaction)}
                      >
                        <HistoryIcon className="h-4 w-4 text-black" />
                      </span>
                    ) : null}
                  </div>
                ),
              },
            ]}
            searchableColumns={[
              {
                id: "date",
                value: (row: SaleTransaction) => row.date,
              },
              {
                id: "billingParty",
                value: (row: SaleTransaction) => row.billingParty || "",
              },
              {
                id: "invoiceNumber",
                value: (row: SaleTransaction) => row.invoiceNumber || "",
              },
              {
                id: "amount",
                value: (row: SaleTransaction) => row.amount,
              },
            ]}
          />
        </div>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        if (!editLoading) setEditDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Sale</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="invoiceNumber" className="text-right">
                Invoice Number
              </Label>
              <Input
                id="invoiceNumber"
                value={editedInvoiceNumber}
                onChange={(e) => setEditedInvoiceNumber(e.target.value)}
                className="col-span-3"
                disabled={editLoading}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="invoiceDate" className="text-right">
                Invoice Date
              </Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !editedDate && "text-muted-foreground"
                      )}
                      disabled={editLoading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editedDate ? format(editedDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={editedDate}
                      onSelect={setEditedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                value={editedAmount}
                onChange={(e) => setEditedAmount(e.target.value)}
                className="col-span-3"
                disabled={editLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={editLoading}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={editLoading}>
              {editLoading ? <Loader /> : null}
              {editLoading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit History</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {historyLogs.length > 0 ? (
                historyLogs.map((log, index) => (
                  <div key={log._id} className="relative pl-6 pb-6">
                    {/* Timeline connector */}
                    {index < historyLogs.length - 1 && (
                      <div className="absolute left-2 top-4 h-full w-0.5 bg-gray-200"></div>
                    )}
                    {/* Timeline dot */}
                    <div className="absolute left-0 top-1.5 h-4 w-4 rounded-full bg-green-500"></div>
                    {/* Log content */}
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm">{log.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(log.editedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">No edit history available.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setHistoryDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
} 