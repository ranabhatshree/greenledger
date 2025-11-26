"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Upload, CalendarIcon, Search, FileDown } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import {
  getBulkSales,
  deleteBulkSale,
  BulkSale,
  BulkSalesResponse,
} from "@/lib/api/bulkSales";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import BulkSalesUploadModal from "@/components/bulk-sales/upload-modal";
import BulkSalesCreateModal from "@/components/bulk-sales/create-modal";

export default function BulkSalesPage() {
  const [loading, setLoading] = useState(true);
  const [bulkSales, setBulkSales] = useState<BulkSale[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<BulkSale | null>(null);
  const [editFormData, setEditFormData] = useState({
    invoiceNumber: "",
    invoiceDate: "",
    totalAmount: "",
    notes: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const { toast } = useToast();

  const fetchBulkSales = async (page = 1) => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit: pagination.limit,
      };

      if (dateRange.from) {
        params.from = format(dateRange.from, "yyyy-MM-dd");
      }
      if (dateRange.to) {
        params.to = format(dateRange.to, "yyyy-MM-dd");
      }
      if (searchQuery.trim()) {
        params.invoiceNumber = searchQuery.trim();
      }

      const response: BulkSalesResponse = await getBulkSales(params);
      setBulkSales(response.bulkSales);
      setPagination(response.pagination);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch bulk sales",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (newDateRange: DateRange | undefined) => {
    if (newDateRange) {
      setDateRange(newDateRange);
      fetchBulkSales(1);
    }
  };

  useEffect(() => {
    fetchBulkSales(1);
  }, [dateRange, searchQuery]);

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      await deleteBulkSale(deletingId);
      toast({
        title: "Success",
        description: "Bulk sale deleted successfully",
      });
      setDeleteDialogOpen(false);
      setDeletingId(null);
      fetchBulkSales(pagination.page);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete bulk sale",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (sale: BulkSale) => {
    setEditingSale(sale);
    setEditFormData({
      invoiceNumber: sale.invoiceNumber,
      invoiceDate: format(new Date(sale.invoiceDate), "yyyy-MM-dd"),
      totalAmount: sale.totalAmount.toString(),
      notes: sale.notes || "",
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingSale) return;

    try {
      setEditLoading(true);
      const { updateBulkSale } = await import("@/lib/api/bulkSales");
      await updateBulkSale(editingSale._id, {
        invoiceNumber: editFormData.invoiceNumber,
        invoiceDate: editFormData.invoiceDate,
        totalAmount: parseFloat(editFormData.totalAmount),
        notes: editFormData.notes || undefined,
      });
      toast({
        title: "Success",
        description: "Bulk sale updated successfully",
      });
      setEditDialogOpen(false);
      setEditingSale(null);
      fetchBulkSales(pagination.page);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update bulk sale",
        variant: "destructive",
      });
    } finally {
      setEditLoading(false);
    }
  };

  const downloadTemplate = () => {
    // Create CSV template content
    const csvContent = "invoiceNumber,totalAmount,invoiceDate,notes\nINV-001,1500.00,2024-01-15,Notes for Invoice 1\nINV-002,2300.50,2024-01-16,";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk-sales-template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Bulk Sales [Only for Customers Bill Creation]</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="flex items-center"
            >
              <FileDown className="mr-2 h-4 w-4" />
              Download Template
            </Button>
            <Button
              variant="outline"
              onClick={() => setUploadModalOpen(true)}
              className="flex items-center"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload CSV
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 flex items-center"
              onClick={() => setCreateModalOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Manual Entry
            </Button>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by invoice number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <DateRangePicker
            from={dateRange.from}
            to={dateRange.to}
            onSelect={handleDateRangeChange}
          />
        </div>

        {loading ? (
          <Loader />
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice Number</TableHead>
                    <TableHead>Invoice Date</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Uploaded Via</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bulkSales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No bulk sales found
                      </TableCell>
                    </TableRow>
                  ) : (
                    bulkSales.map((sale) => (
                      <TableRow key={sale._id}>
                        <TableCell className="font-medium">
                          {sale.invoiceNumber}
                        </TableCell>
                        <TableCell>
                          {format(new Date(sale.invoiceDate), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          {sale.totalAmount.toLocaleString()}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {sale.notes || "-"}
                        </TableCell>
                        <TableCell>
                          {sale.uploadedByCSVRef ? (
                            <a
                              href={`${process.env.NEXT_PUBLIC_BASE_URL || ''}/uploads/files/${sale.uploadedByCSVRef}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 underline flex items-center gap-1 max-w-xs truncate"
                              title={sale.uploadedByCSVRef}
                            >
                              <FileDown className="h-3 w-3" />
                              <span className="truncate">
                                {sale.uploadedByCSVRef.length > 25 
                                  ? `${sale.uploadedByCSVRef.substring(0, 25)}...` 
                                  : sale.uploadedByCSVRef}
                              </span>
                            </a>
                          ) : (
                            <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                              Manual
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {typeof sale.createdBy === "object"
                            ? sale.createdBy.name
                            : "Unknown"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(sale)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setDeletingId(sale._id);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {pagination.pages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                  {pagination.total} entries
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={pagination.page === 1}
                    onClick={() => fetchBulkSales(pagination.page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    disabled={pagination.page === pagination.pages}
                    onClick={() => fetchBulkSales(pagination.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Upload Modal */}
        <BulkSalesUploadModal
          open={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          onSuccess={() => {
            setUploadModalOpen(false);
            fetchBulkSales(pagination.page);
          }}
        />

        {/* Create Modal */}
        <BulkSalesCreateModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => {
            setCreateModalOpen(false);
            fetchBulkSales(pagination.page);
          }}
        />

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Bulk Sale</DialogTitle>
              <DialogDescription>
                Update the bulk sale information
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-invoice-number">Invoice Number</Label>
                <Input
                  id="edit-invoice-number"
                  value={editFormData.invoiceNumber}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      invoiceNumber: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-invoice-date">Invoice Date</Label>
                <Input
                  id="edit-invoice-date"
                  type="date"
                  value={editFormData.invoiceDate}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      invoiceDate: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-total-amount">Total Amount</Label>
                <Input
                  id="edit-total-amount"
                  type="number"
                  step="0.01"
                  value={editFormData.totalAmount}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      totalAmount: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-notes">Notes (Optional)</Label>
                <Textarea
                  id="edit-notes"
                  value={editFormData.notes}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      notes: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={editLoading}>
                {editLoading ? "Updating..." : "Update"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Bulk Sale</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this bulk sale? This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setDeletingId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
}

