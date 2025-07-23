"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Plus, CalendarIcon, PencilIcon, HistoryIcon } from "lucide-react";
import { BaseTransaction, TransactionTable } from "@/components/shared/transaction-table";
import { Loader } from "@/components/ui/loader";
import Link from "next/link";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import axiosInstance from "@/lib/api/axiosInstance";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Define types for the API response
interface Return {
  _id: string;
  amount: number;
  invoiceNumber: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    _id: string;
    name: string;
  };
  returnedBy: {
    _id: string;
    name: string;
  };
}

interface ReturnResponse {
  returns: Return[];
}

interface ReturnTransaction extends BaseTransaction {
  returnedBy: string;
  createdBy: string;
  invoiceAgainst: string;
}

export default function ReturnsPage() {
  const [loading, setLoading] = useState(true);
  const [returns, setReturns] = useState<ReturnTransaction[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingReturn, setEditingReturn] = useState<ReturnTransaction | null>(null);
  const [editedInvoiceNumber, setEditedInvoiceNumber] = useState("");
  const [editedAmount, setEditedAmount] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [editedReturnedBy, setEditedReturnedBy] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const { toast } = useToast();

  const fetchReturns = async (from?: Date, to?: Date) => {
    try {
      setLoading(true);
      const fromDate = from 
        ? format(from, 'yyyy-MM-dd')
        : format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const toDate = to
        ? format(to, 'yyyy-MM-dd')
        : format(endOfMonth(new Date()), 'yyyy-MM-dd');
      
      const response = await axiosInstance.get<ReturnResponse>(
        `/returns?from=${fromDate}&to=${toDate}`
      );
      
      if (response.status !== 200) {
        throw new Error('Failed to fetch returns data');
      }
      
      const transformedReturns: ReturnTransaction[] = response.data.returns.map((returnItem: Return) => ({
        id: returnItem._id,
        type: "Return",
        date: format(new Date(returnItem.createdAt), 'MMM dd, yyyy'),
        amount: returnItem.amount.toLocaleString(),
        status: "Completed",
        invoiceNumber: returnItem.invoiceNumber,
        returnedBy: returnItem.returnedBy.name,
        createdBy: returnItem.createdBy.name,
        invoiceAgainst: returnItem.description || "",
        description: returnItem.description || "",
      }));

      setReturns(transformedReturns);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch returns data",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get('/auth/users-by-role?role=user,admin,customer,vendor,supplier');
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleDateRangeChange = (newDateRange: DateRange | undefined) => {
    if (newDateRange) {
      setDateRange(newDateRange);
      fetchReturns(newDateRange.from, newDateRange.to);
    }
  };

  const handleEditClick = (returnItem: ReturnTransaction) => {
    setEditingReturn(returnItem);
    setEditedInvoiceNumber(returnItem.invoiceNumber || "");
    setEditedAmount(returnItem.amount.replace(/,/g, ""));
    setEditedDescription(returnItem.description || "");
    
    // Find the user ID for the returnedBy field
    const returnedByUser = users.find(user => user.name === returnItem.returnedBy);
    setEditedReturnedBy(returnedByUser?._id || "");
    
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingReturn) return;
    
    try {
      setEditLoading(true);
      
      const updateData = {
        invoiceNumber: editedInvoiceNumber,
        amount: parseFloat(editedAmount),
        description: editedDescription,
        returnedBy: editedReturnedBy,
      };
      
      const response = await axiosInstance.put(`/returns/${editingReturn.id}`, updateData);
      
      if (response.status === 200) {
        const updatedUser = users.find(user => user._id === editedReturnedBy);
        
        const updatedReturns = returns.map(returnItem => {
          if (returnItem.id === editingReturn.id) {
            return {
              ...returnItem,
              invoiceNumber: editedInvoiceNumber,
              amount: parseFloat(editedAmount).toLocaleString(),
              description: editedDescription,
              invoiceAgainst: editedDescription,
              returnedBy: updatedUser?.name || returnItem.returnedBy,
            };
          }
          return returnItem;
        });
        
        setReturns(updatedReturns);
        setEditDialogOpen(false);
        
        toast({
          title: "Success",
          description: "Return updated successfully",
          variant: "default"
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to update return. Please try again.",
        variant: "destructive"
      });
    } finally {
      setEditLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns(dateRange?.from, dateRange?.to);
    fetchUsers();
  }, []);

  if (loading) return <Loader />;

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Returns</h1>
          <div className="flex-1 flex justify-center mx-4 relative z-10">
            <DateRangePicker
              from={dateRange.from}
              to={dateRange.to}
              onSelect={handleDateRangeChange}
              className="w-auto min-w-[300px] max-w-[400px]"
            />
          </div>
          <Link href="/returns/create">
            <Button 
              className="bg-green-600 hover:bg-green-700 flex items-center"
              aria-label="Add Return"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Return
            </Button>
          </Link>
        </div>

        <TransactionTable
          title="Return Transactions"
          data={returns}
          showType={false}
          columns={[
            {
              header: "Date",
              accessorKey: "date",
            },
            {
              header: "Invoice Against",
              accessorKey: "invoiceAgainst",
            },
            {
              header: "Credit Note Number",
              accessorKey: "invoiceNumber",
            },
            {
              header: "Returned By",
              accessorKey: "returnedBy",
            },
            {
              header: "Amount",
              accessorKey: "amount",
            },
            {
              header: "Actions",
              cell: (transaction) => (
                <div className="flex items-center space-x-2">
                  <span
                    className="inline-flex rounded-full px-2 py-1 text-xs font-semibold cursor-pointer"
                    onClick={() => handleEditClick(transaction as ReturnTransaction)}
                  >
                    <PencilIcon className="h-4 w-4 text-black" />
                  </span>
                </div>
              ),
            },
          ]}
          searchableColumns={[
            {
              id: "date",
              value: (row: ReturnTransaction) => row.date,
            },
            {
              id: "invoiceAgainst",
              value: (row: ReturnTransaction) => row.invoiceAgainst || "",
            },
            {
              id: "invoiceNumber",
              value: (row: ReturnTransaction) => row.invoiceNumber || "",
            },
            {
              id: "returnedBy",
              value: (row: ReturnTransaction) => row.returnedBy || "",
            },
            {
              id: "amount",
              value: (row: ReturnTransaction) => row.amount,
            },
          ]}
        />
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        if (!editLoading) setEditDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Return</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="invoiceNumber" className="text-right">
                Credit Note Number
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
              <Label htmlFor="description" className="text-right">
                Invoice Against
              </Label>
              <Input
                id="description"
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="col-span-3"
                disabled={editLoading}
                placeholder="Eg: 0056, 0791"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="returnedBy" className="text-right">
                Returned By
              </Label>
              <Select value={editedReturnedBy} onValueChange={setEditedReturnedBy} disabled={editLoading}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user._id} value={user._id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              {editLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
} 