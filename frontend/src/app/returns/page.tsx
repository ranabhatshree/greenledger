"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Plus, PencilIcon, HistoryIcon } from "lucide-react";
import { BaseTransaction, TransactionTable } from "@/components/shared/transaction-table";
import { Loader } from "@/components/ui/loader";
import Link from "next/link";
import { format, startOfMonth, endOfMonth } from "date-fns";
import axiosInstance from "@/lib/api/axiosInstance";
import { getAllParties, type Party } from "@/lib/api/parties";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUploader, type UploadedImage } from "@/components/shared/image-uploader";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Define types for the API response
interface Return {
  _id: string;
  amount: number;
  invoiceNumber: string;
  invoiceDate: string;
  type: 'credit_note' | 'debit_note';
  billPhotos: string[];
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
  returnedById?: string; // Store the party ID
  createdBy: string;
  invoiceAgainst: string;
  invoiceDate?: string;
  returnType?: 'credit_note' | 'debit_note';
  billPhotos?: string[];
}

export default function ReturnsPage() {
  const [loading, setLoading] = useState(true);
  const [returns, setReturns] = useState<ReturnTransaction[]>([]);
  const [fromDate, setFromDate] = useState<Date>(startOfMonth(new Date()));
  const [toDate, setToDate] = useState<Date>(endOfMonth(new Date()));
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingReturn, setEditingReturn] = useState<ReturnTransaction | null>(null);
  const [editedInvoiceNumber, setEditedInvoiceNumber] = useState("");
  const [editedAmount, setEditedAmount] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [editedReturnedBy, setEditedReturnedBy] = useState("");
  const [editedInvoiceDate, setEditedInvoiceDate] = useState<Date>();
  const [editedType, setEditedType] = useState<'credit_note' | 'debit_note'>('credit_note');
  const [editedBillPhotos, setEditedBillPhotos] = useState<UploadedImage[]>([]);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [parties, setParties] = useState<Party[]>([]);
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
        date: format(new Date(returnItem.invoiceDate || returnItem.createdAt), 'MMM dd, yyyy'),
        amount: returnItem.amount.toLocaleString(),
        status: "Completed",
        invoiceNumber: returnItem.invoiceNumber,
        returnedBy: returnItem.returnedBy.name,
        returnedById: returnItem.returnedBy._id, // Store the party ID
        createdBy: returnItem.createdBy.name,
        invoiceAgainst: returnItem.description || "",
        description: returnItem.description || "",
        invoiceDate: returnItem.invoiceDate,
        returnType: returnItem.type,
        billPhotos: returnItem.billPhotos || [],
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

  const fetchParties = async () => {
    try {
      const partiesList = await getAllParties();
      setParties(partiesList);
    } catch (error) {
      console.error('Error fetching parties:', error);
      toast({
        title: "Error",
        description: "Failed to fetch parties",
        variant: "destructive",
      });
    }
  };

  const handleFromDateChange = (date: Date | null) => {
    if (date) {
      setFromDate(date);
      fetchReturns(date, toDate);
    }
  };

  const handleToDateChange = (date: Date | null) => {
    if (date) {
      setToDate(date);
      fetchReturns(fromDate, date);
    }
  };

  const handleEditClick = (returnItem: ReturnTransaction) => {
    setEditingReturn(returnItem);
    setEditedInvoiceNumber(returnItem.invoiceNumber || "");
    setEditedAmount(returnItem.amount.replace(/,/g, ""));
    setEditedDescription(returnItem.description || "");
    
    // Set invoice date
    if (returnItem.invoiceDate) {
      setEditedInvoiceDate(new Date(returnItem.invoiceDate));
    } else {
      setEditedInvoiceDate(undefined);
    }
    
    // Set type
    setEditedType(returnItem.returnType || 'credit_note');
    
    // Set bill photos
    if (returnItem.billPhotos && returnItem.billPhotos.length > 0) {
      setEditedBillPhotos(returnItem.billPhotos.map((photo, index) => ({
        filePath: photo,
        originalName: `Photo ${index + 1}`
      })));
    } else {
      setEditedBillPhotos([]);
    }
    
    // Use the stored party ID directly, or try to find it by name as fallback
    if (returnItem.returnedById) {
      setEditedReturnedBy(returnItem.returnedById);
    } else {
      // Fallback: try to find by name
      const returnedByParty = parties.find(party => party.name === returnItem.returnedBy);
      setEditedReturnedBy(returnedByParty?._id || "");
    }
    
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingReturn) return;
    
    if (!editedInvoiceDate) {
      toast({
        title: "Error",
        description: "Invoice date is required",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setEditLoading(true);
      
      const updateData: any = {
        invoiceNumber: editedInvoiceNumber,
        amount: parseFloat(editedAmount),
        description: editedDescription,
        returnedBy: editedReturnedBy,
        invoiceDate: format(editedInvoiceDate, 'yyyy-MM-dd'),
        type: editedType,
      };
      
      // Add billPhotos if there are any
      if (editedBillPhotos.length > 0) {
        updateData.billPhotos = editedBillPhotos.map(img => img.filePath);
      }
      
      const response = await axiosInstance.put(`/returns/${editingReturn.id}`, updateData);
      
      if (response.status === 200) {
        const updatedParty = parties.find(party => party._id === editedReturnedBy);
        
        const updatedReturns = returns.map(returnItem => {
          if (returnItem.id === editingReturn.id) {
            return {
              ...returnItem,
              invoiceNumber: editedInvoiceNumber,
              amount: parseFloat(editedAmount).toLocaleString(),
              description: editedDescription,
              invoiceAgainst: editedDescription,
              returnedBy: updatedParty?.name || returnItem.returnedBy,
              returnedById: editedReturnedBy,
              invoiceDate: format(editedInvoiceDate, 'yyyy-MM-dd'),
              returnType: editedType,
              billPhotos: editedBillPhotos.map(img => img.filePath),
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

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!editingReturn) return;

    try {
      setDeleteLoading(true);
      
      const response = await axiosInstance.delete(`/returns/${editingReturn.id}`);
      
      if (response.status === 200) {
        // Remove the deleted return from the list
        const updatedReturns = returns.filter(returnItem => returnItem.id !== editingReturn.id);
        setReturns(updatedReturns);
        
        setEditDialogOpen(false);
        setDeleteDialogOpen(false);
        setEditingReturn(null);
        
        toast({
          title: "Success",
          description: "Return deleted successfully",
          variant: "default"
        });
      }
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.message || "Failed to delete return. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns(fromDate, toDate);
    fetchParties();
  }, []);

  if (loading) return <Loader />;

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Returns</h1>
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
                {editedType === 'debit_note' ? 'Returned To' : 'Returned By'}
              </Label>
              <Select value={editedReturnedBy} onValueChange={setEditedReturnedBy} disabled={editLoading}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select party" />
                </SelectTrigger>
                <SelectContent>
                  {parties.map((party) => (
                    <SelectItem key={party._id} value={party._id}>
                      {party.name} ({party.role})
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
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="invoiceDate" className="text-right">
                Invoice Date
              </Label>
              <div className="col-span-3">
                <DatePicker
                  selected={editedInvoiceDate}
                  onChange={(date: Date | null) => setEditedInvoiceDate(date || undefined)}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Pick a date"
                  disabled={editLoading}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Select value={editedType} onValueChange={(value: 'credit_note' | 'debit_note') => setEditedType(value)} disabled={editLoading}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit_note">Credit Note</SelectItem>
                  <SelectItem value="debit_note">Debit Note</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">
                Bill Photos
              </Label>
              <div className="col-span-3">
                <ImageUploader
                  images={editedBillPhotos}
                  onImagesChange={setEditedBillPhotos}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button
              variant="destructive"
              onClick={handleDeleteClick}
              disabled={editLoading || deleteLoading}
            >
              Delete
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={editLoading || deleteLoading}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={editLoading || deleteLoading}>
                {editLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the return record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
} 