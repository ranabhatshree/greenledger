"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Plus, PencilIcon, Trash2, X } from "lucide-react";
import { BaseTransaction, TransactionTable } from "@/components/shared/transaction-table";
import { Loader } from "@/components/ui/loader";
import Link from "next/link";
import { format, startOfMonth, endOfMonth } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
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
import { getImports, deleteImport, getImportById, updateImport, type Import, type ExpenseDetail } from "@/lib/api/imports";
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

interface ImportTransaction extends BaseTransaction {
  invoiceNumber: string;
  supplierName: string;
  supplierAddress: string;
  amountUSD: string;
  amount: string;
  description: string;
  createdBy: string;
  expenseDetails?: ExpenseDetail[];
  expenseTotal?: string;
  driveLink?: string;
  note?: string;
}

export default function ImportsPage() {
  const [loading, setLoading] = useState(true);
  const [imports, setImports] = useState<ImportTransaction[]>([]);
  const [fromDate, setFromDate] = useState<Date>(startOfMonth(new Date()));
  const [toDate, setToDate] = useState<Date>(endOfMonth(new Date()));
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingImport, setEditingImport] = useState<ImportTransaction | null>(null);
  const [deletingImportId, setDeletingImportId] = useState<string | null>(null);
  const [editedInvoiceNumber, setEditedInvoiceNumber] = useState("");
  const [editedAmountUSD, setEditedAmountUSD] = useState("");
  const [editedAmount, setEditedAmount] = useState("");
  const [editedSupplierName, setEditedSupplierName] = useState("");
  const [editedSupplierAddress, setEditedSupplierAddress] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [editedDriveLink, setEditedDriveLink] = useState("");
  const [editedExpenseDetails, setEditedExpenseDetails] = useState<ExpenseDetail[]>([]);
  const [editedNote, setEditedNote] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { toast } = useToast();

  const fetchImports = async (from?: Date, to?: Date) => {
    try {
      setLoading(true);
      const fromDate = from 
        ? format(from, 'yyyy-MM-dd')
        : format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const toDate = to
        ? format(to, 'yyyy-MM-dd')
        : format(endOfMonth(new Date()), 'yyyy-MM-dd');
      
      const response = await getImports({
        from: fromDate,
        to: toDate,
      });
      
      const transformedImports: ImportTransaction[] = response.imports.map((importItem: Import) => {
        const expenseTotal = importItem.expenseDetails?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;
        return {
          id: importItem._id,
          type: "Import",
          date: format(new Date(importItem.invoiceDate), 'MMM dd, yyyy'),
          amount: importItem.amount.toLocaleString(),
          amountUSD: `$${importItem.amountUSD.toLocaleString()}`,
          status: "Completed",
          invoiceNumber: importItem.invoiceNumber,
          supplierName: importItem.supplierName,
          supplierAddress: importItem.supplierAddress,
          description: importItem.description || "",
          createdBy: importItem.createdBy.name,
          expenseDetails: importItem.expenseDetails || [],
          expenseTotal: expenseTotal > 0 ? expenseTotal.toLocaleString() : undefined,
          driveLink: importItem.driveLink,
          note: importItem.note,
        };
      });

      setImports(transformedImports);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch imports data",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFromDateChange = (date: Date | null) => {
    if (date) {
      setFromDate(date);
      fetchImports(date, toDate);
    }
  };

  const handleToDateChange = (date: Date | null) => {
    if (date) {
      setToDate(date);
      fetchImports(fromDate, date);
    }
  };

  const handleEditClick = async (importItem: ImportTransaction) => {
    try {
      setEditLoading(true);
      // Fetch the full import record to get all details
      const { getImportById } = await import("@/lib/api/imports");
      const fullImport = await getImportById(importItem.id);
      
      setEditingImport(importItem);
      setEditedInvoiceNumber(fullImport.import.invoiceNumber || "");
      setEditedAmountUSD(fullImport.import.amountUSD.toString());
      setEditedAmount(fullImport.import.amount.toString());
      setEditedSupplierName(fullImport.import.supplierName || "");
      setEditedSupplierAddress(fullImport.import.supplierAddress || "");
      setEditedDescription(fullImport.import.description || "");
      setEditedDriveLink(fullImport.import.driveLink || "");
      setEditedExpenseDetails(fullImport.import.expenseDetails || []);
      setEditedNote(fullImport.import.note || "");
      setEditDialogOpen(true);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to load import details",
        variant: "destructive"
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingImport) return;
    
    try {
      setEditLoading(true);
      
      // Validate expenseDetails for duplicates
      if (editedExpenseDetails.length > 0) {
        const titles = editedExpenseDetails.map(exp => exp.title.trim().toLowerCase());
        const uniqueTitles = new Set(titles);
        if (titles.length !== uniqueTitles.size) {
          toast({
            title: "Error",
            description: "Duplicate expense titles are not allowed. Each expense must have a unique title.",
            variant: "destructive"
          });
          return;
        }
      }

      const updateData = {
        invoiceNumber: editedInvoiceNumber,
        amountUSD: parseFloat(editedAmountUSD),
        amount: parseFloat(editedAmount),
        supplierName: editedSupplierName,
        supplierAddress: editedSupplierAddress,
        description: editedDescription,
        driveLink: editedDriveLink || undefined,
        expenseDetails: editedExpenseDetails.length > 0 ? editedExpenseDetails : undefined,
        note: editedNote || undefined,
      };
      
      await updateImport(editingImport.id, updateData);
      
      toast({
        title: "Success",
        description: "Import updated successfully",
        variant: "default"
      });
      
      setEditDialogOpen(false);
      fetchImports(fromDate, toDate);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to update import. Please try again.",
        variant: "destructive"
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteClick = (importItem: ImportTransaction) => {
    setDeletingImportId(importItem.id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingImportId) return;
    
    try {
      setDeleteLoading(true);
      await deleteImport(deletingImportId);
      
      toast({
        title: "Success",
        description: "Import deleted successfully",
        variant: "default"
      });
      
      setDeleteDialogOpen(false);
      setDeletingImportId(null);
      fetchImports(fromDate, toDate);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to delete import. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  useEffect(() => {
    fetchImports(dateRange?.from, dateRange?.to);
  }, []);

  if (loading) return <Loader />;

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Imports</h1>
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
          <Link href="/imports/create">
            <Button 
              className="bg-green-600 hover:bg-green-700 flex items-center"
              aria-label="Add Import"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Import
            </Button>
          </Link>
        </div>

        <TransactionTable
          title="Import Records"
          data={imports}
          showType={false}
          columns={[
            {
              header: "Date",
              accessorKey: "date",
            },
            {
              header: "Invoice Number",
              accessorKey: "invoiceNumber",
            },
            {
              header: "Supplier",
              accessorKey: "supplierName",
            },
            {
              header: "Description",
              accessorKey: "description",
            },
            {
              header: "Amount (USD)",
              accessorKey: "amountUSD",
            },
            {
              header: "Amount (Local)",
              accessorKey: "amount",
            },
            {
              header: "Expenses",
              accessorKey: "expenseTotal",
              cell: (transaction) => {
                const expTotal = (transaction as ImportTransaction).expenseTotal;
                return expTotal ? `NPR ${expTotal}` : "-";
              },
            },
            {
              header: "Created By",
              accessorKey: "createdBy",
            },
            {
              header: "Actions",
              cell: (transaction) => (
                <div className="flex items-center space-x-2">
                  <span
                    className="inline-flex rounded-full px-2 py-1 text-xs font-semibold cursor-pointer hover:bg-gray-100"
                    onClick={() => handleEditClick(transaction as ImportTransaction)}
                    title="Edit"
                  >
                    <PencilIcon className="h-4 w-4 text-blue-600" />
                  </span>
                  <span
                    className="inline-flex rounded-full px-2 py-1 text-xs font-semibold cursor-pointer hover:bg-gray-100"
                    onClick={() => handleDeleteClick(transaction as ImportTransaction)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </span>
                </div>
              ),
            },
          ]}
          searchableColumns={[
            {
              id: "date",
              value: (row: ImportTransaction) => row.date,
            },
            {
              id: "invoiceNumber",
              value: (row: ImportTransaction) => row.invoiceNumber || "",
            },
            {
              id: "supplierName",
              value: (row: ImportTransaction) => row.supplierName || "",
            },
            {
              id: "description",
              value: (row: ImportTransaction) => row.description || "",
            },
            {
              id: "createdBy",
              value: (row: ImportTransaction) => row.createdBy || "",
            },
          ]}
        />
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        if (!editLoading) setEditDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Import</DialogTitle>
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
              <Label htmlFor="amountUSD" className="text-right">
                Amount (USD)
              </Label>
              <Input
                id="amountUSD"
                type="number"
                value={editedAmountUSD}
                onChange={(e) => setEditedAmountUSD(e.target.value)}
                className="col-span-3"
                disabled={editLoading}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount (Local)
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
              <Label htmlFor="supplierName" className="text-right">
                Supplier Name
              </Label>
              <Input
                id="supplierName"
                value={editedSupplierName}
                onChange={(e) => setEditedSupplierName(e.target.value)}
                className="col-span-3"
                disabled={editLoading}
                placeholder="Leave empty to keep current"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="supplierAddress" className="text-right">
                Supplier Address
              </Label>
              <Input
                id="supplierAddress"
                value={editedSupplierAddress}
                onChange={(e) => setEditedSupplierAddress(e.target.value)}
                className="col-span-3"
                disabled={editLoading}
                placeholder="Leave empty to keep current"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input
                id="description"
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="col-span-3"
                disabled={editLoading}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="driveLink" className="text-right">
                Drive Link
              </Label>
              <Input
                id="driveLink"
                value={editedDriveLink}
                onChange={(e) => setEditedDriveLink(e.target.value)}
                className="col-span-3"
                disabled={editLoading}
                placeholder="Optional Google Drive link"
              />
            </div>

            <div className="grid grid-cols-4 gap-4 items-start">
              <Label className="text-right pt-2">Expense Details</Label>
              <div className="col-span-3 space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">(Optional)</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditedExpenseDetails([...editedExpenseDetails, { title: "", amount: 0 }])}
                    disabled={editLoading}
                    className="flex items-center gap-1 h-7"
                  >
                    <Plus className="h-3 w-3" />
                    Add Expense
                  </Button>
                </div>
                {editedExpenseDetails.length > 0 && (
                  <div className="space-y-2">
                    {editedExpenseDetails.map((expense, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <Input
                          placeholder="Expense Title"
                          value={expense.title}
                          onChange={(e) => {
                            const updated = [...editedExpenseDetails];
                            updated[index] = { ...updated[index], title: e.target.value };
                            setEditedExpenseDetails(updated);
                          }}
                          disabled={editLoading}
                          className="flex-1"
                        />
                        <div className="flex items-center gap-1 w-36">
                          <span className="text-sm">NPR</span>
                          <Input
                            type="number"
                            placeholder="Amount"
                            value={expense.amount || ""}
                            onChange={(e) => {
                              const updated = [...editedExpenseDetails];
                              updated[index] = { ...updated[index], amount: parseFloat(e.target.value) || 0 };
                              setEditedExpenseDetails(updated);
                            }}
                            min="0"
                            step="0.01"
                            disabled={editLoading}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const updated = editedExpenseDetails.filter((_, i) => i !== index);
                            setEditedExpenseDetails(updated);
                          }}
                          disabled={editLoading}
                          className="text-red-600 hover:text-red-700 h-9 w-9 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="note" className="text-right">
                Note
              </Label>
              <Input
                id="note"
                value={editedNote}
                onChange={(e) => setEditedNote(e.target.value)}
                className="col-span-3"
                disabled={editLoading}
                placeholder="Optional note"
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the import record.
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

