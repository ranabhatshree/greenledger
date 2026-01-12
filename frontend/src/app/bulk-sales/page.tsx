"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Search, FileDown, MoreVertical, ArrowUpDown, ArrowUp, ArrowDown, X, Filter } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { format, isAfter, isBefore, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
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
  TableFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import BulkSalesUploadModal from "@/components/bulk-sales/upload-modal";
import BulkSalesCreateModal from "@/components/bulk-sales/create-modal";

type SortField = "invoiceNumber" | "invoiceDate" | "totalAmount" | null;
type SortDirection = "asc" | "desc" | null;

export default function BulkSalesPage() {
  const [loading, setLoading] = useState(true);
  const [allBulkSales, setAllBulkSales] = useState<BulkSale[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  
  // Column filters
  const [fromDateFilter, setFromDateFilter] = useState<Date | null>(null);
  const [toDateFilter, setToDateFilter] = useState<Date | null>(null);
  const [uploadedViaFilter, setUploadedViaFilter] = useState<string>("all");
  const [createdByFilter, setCreatedByFilter] = useState<string>("all");
  const [notesFilter, setNotesFilter] = useState<string>("all");
  
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

  // Fetch all bulk sales data
  const fetchBulkSales = async () => {
    try {
      setLoading(true);
      // Fetch with a large limit to get all data for client-side filtering
      const response: BulkSalesResponse = await getBulkSales({
        page: 1,
        limit: 10000, // Large limit to fetch all records
      });
      setAllBulkSales(response.bulkSales);
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

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Get unique values for filters
  const uniqueUploadedVia = useMemo(() => {
    const values = new Set<string>();
    allBulkSales.forEach((sale) => {
      if (sale.uploadedByCSVRef) {
        values.add(sale.uploadedByCSVRef);
      } else {
        values.add("Manual");
      }
    });
    return Array.from(values).sort();
  }, [allBulkSales]);

  const uniqueCreatedBy = useMemo(() => {
    const values = new Set<string>();
    allBulkSales.forEach((sale) => {
      const name = typeof sale.createdBy === "object" ? sale.createdBy.name : "Unknown";
      values.add(name);
    });
    return Array.from(values).sort();
  }, [allBulkSales]);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = [...allBulkSales];

    // Global search
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter((sale) => {
        const invoiceNumber = sale.invoiceNumber.toLowerCase();
        const notes = (sale.notes || "").toLowerCase();
        const uploadedVia = sale.uploadedByCSVRef 
          ? sale.uploadedByCSVRef.toLowerCase() 
          : "manual";
        const createdBy = typeof sale.createdBy === "object" 
          ? sale.createdBy.name.toLowerCase() 
          : "unknown";
        
        return invoiceNumber.includes(query) ||
               notes.includes(query) ||
               uploadedVia.includes(query) ||
               createdBy.includes(query);
      });
    }

    // Date range filter
    if (fromDateFilter) {
      filtered = filtered.filter((sale) => {
        const saleDate = parseISO(sale.invoiceDate);
        return !isBefore(saleDate, fromDateFilter);
      });
    }
    if (toDateFilter) {
      filtered = filtered.filter((sale) => {
        const saleDate = parseISO(sale.invoiceDate);
        return !isAfter(saleDate, toDateFilter);
      });
    }

    // Uploaded Via filter
    if (uploadedViaFilter !== "all") {
      filtered = filtered.filter((sale) => {
        if (uploadedViaFilter === "Manual") {
          return !sale.uploadedByCSVRef;
        }
        return sale.uploadedByCSVRef === uploadedViaFilter;
      });
    }

    // Created By filter
    if (createdByFilter !== "all") {
      filtered = filtered.filter((sale) => {
        const name = typeof sale.createdBy === "object" ? sale.createdBy.name : "Unknown";
        return name === createdByFilter;
      });
    }

    // Notes filter
    if (notesFilter !== "all") {
      filtered = filtered.filter((sale) => {
        if (notesFilter === "ERR_SKIPPED") {
          return sale.notes?.includes("ERR_SKIPPED");
        }
        if (notesFilter === "-") {
          return !sale.notes || sale.notes === "-";
        }
        return true;
      });
    }

    // Sorting
    if (sortField && sortDirection) {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortField) {
          case "invoiceNumber":
            // Natural sort for invoice numbers
            // Check if both are purely numeric (no letters, just digits)
            const aIsNumeric = /^\s*\d+\s*$/.test(a.invoiceNumber);
            const bIsNumeric = /^\s*\d+\s*$/.test(b.invoiceNumber);
            
            if (aIsNumeric && bIsNumeric) {
              // Both are purely numeric - sort numerically
              aValue = parseInt(a.invoiceNumber.trim(), 10);
              bValue = parseInt(b.invoiceNumber.trim(), 10);
            } else {
              // Use localeCompare with numeric option for natural sorting
              // This handles mixed alphanumeric strings (e.g., "INV-001", "INV-010")
              const comparison = a.invoiceNumber.localeCompare(
                b.invoiceNumber, 
                undefined, 
                { numeric: true, sensitivity: 'base' }
              );
              // Return early since we've already done the comparison
              return sortDirection === "asc" ? comparison : -comparison;
            }
            break;
          case "invoiceDate":
            aValue = new Date(a.invoiceDate).getTime();
            bValue = new Date(b.invoiceDate).getTime();
            break;
          case "totalAmount":
            aValue = a.totalAmount;
            bValue = b.totalAmount;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [allBulkSales, debouncedSearchQuery, fromDateFilter, toDateFilter, uploadedViaFilter, createdByFilter, notesFilter, sortField, sortDirection]);

  // Pagination
  const paginatedData = useMemo(() => {
    if (rowsPerPage === -1) return filteredAndSortedData;
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredAndSortedData.slice(start, end);
  }, [filteredAndSortedData, currentPage, rowsPerPage]);

  const totalPages = useMemo(() => {
    if (rowsPerPage === -1) return 1;
    return Math.ceil(filteredAndSortedData.length / rowsPerPage);
  }, [filteredAndSortedData.length, rowsPerPage]);

  // Calculate total amount for visible rows
  const totalAmount = useMemo(() => {
    return paginatedData.reduce((sum, sale) => sum + sale.totalAmount, 0);
  }, [paginatedData]);

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  // Clear all filters
  const clearFilters = () => {
    setFromDateFilter(null);
    setToDateFilter(null);
    setUploadedViaFilter("all");
    setCreatedByFilter("all");
    setNotesFilter("all");
    setSearchQuery("");
    setCurrentPage(1);
  };

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return fromDateFilter || toDateFilter || 
           uploadedViaFilter !== "all" || 
           createdByFilter !== "all" || 
           notesFilter !== "all" || 
           debouncedSearchQuery.trim() !== "";
  }, [fromDateFilter, toDateFilter, uploadedViaFilter, createdByFilter, notesFilter, debouncedSearchQuery]);

  useEffect(() => {
    fetchBulkSales();
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, fromDateFilter, toDateFilter, uploadedViaFilter, createdByFilter, notesFilter, rowsPerPage]);

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
      fetchBulkSales();
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
      fetchBulkSales();
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

      {/* Global Search */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by invoice number, notes, uploaded via, or created by..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={clearFilters}
            className="flex items-center"
          >
            <X className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Column Filters */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">Filters:</span>
        </div>
        <div className="flex gap-2 items-center">
          <Label htmlFor="date-filter" className="text-sm whitespace-nowrap">Invoice Date:</Label>
          <div className="flex items-center gap-2">
            <Label htmlFor="fromDate" className="text-sm font-medium whitespace-nowrap">
              From:
            </Label>
            <DatePicker
              selected={fromDateFilter}
              onChange={(date) => setFromDateFilter(date)}
              dateFormat="dd/MM/yyyy"
              placeholderText="From date"
              className="flex h-9 w-[140px] rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              maxDate={toDateFilter || undefined}
              isClearable
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="toDate" className="text-sm font-medium whitespace-nowrap">
              To:
            </Label>
            <DatePicker
              selected={toDateFilter}
              onChange={(date) => setToDateFilter(date)}
              dateFormat="dd/MM/yyyy"
              placeholderText="To date"
              className="flex h-9 w-[140px] rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              minDate={fromDateFilter || undefined}
              isClearable
            />
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <Label htmlFor="uploaded-via-filter" className="text-sm whitespace-nowrap">Uploaded Via:</Label>
          <Select value={uploadedViaFilter} onValueChange={setUploadedViaFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Manual">Manual</SelectItem>
              {uniqueUploadedVia.map((value) => (
                <SelectItem key={value} value={value}>
                  {value.length > 30 ? `${value.substring(0, 30)}...` : value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 items-center">
          <Label htmlFor="created-by-filter" className="text-sm whitespace-nowrap">Created By:</Label>
          <Select value={createdByFilter} onValueChange={setCreatedByFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {uniqueCreatedBy.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 items-center">
          <Label htmlFor="notes-filter" className="text-sm whitespace-nowrap">Notes:</Label>
          <Select value={notesFilter} onValueChange={setNotesFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="ERR_SKIPPED">ERR_SKIPPED</SelectItem>
              <SelectItem value="-">Empty (-)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="rounded-md border">
          <div className="p-8">
            <Loader />
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <Table className="text-xs">
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow className="h-8">
                    <TableHead className="h-8 px-2 py-1 text-xs font-semibold">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1 -ml-1 text-xs font-semibold"
                        onClick={() => handleSort("invoiceNumber")}
                      >
                        Invoice Number
                        {sortField === "invoiceNumber" && (
                          sortDirection === "asc" ? (
                            <ArrowUp className="ml-1 h-3 w-3" />
                          ) : (
                            <ArrowDown className="ml-1 h-3 w-3" />
                          )
                        )}
                        {sortField !== "invoiceNumber" && (
                          <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="h-8 px-2 py-1 text-xs font-semibold">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1 -ml-1 text-xs font-semibold"
                        onClick={() => handleSort("invoiceDate")}
                      >
                        Invoice Date
                        {sortField === "invoiceDate" && (
                          sortDirection === "asc" ? (
                            <ArrowUp className="ml-1 h-3 w-3" />
                          ) : (
                            <ArrowDown className="ml-1 h-3 w-3" />
                          )
                        )}
                        {sortField !== "invoiceDate" && (
                          <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="h-8 px-2 py-1 text-xs font-semibold">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1 -ml-1 text-xs font-semibold"
                        onClick={() => handleSort("totalAmount")}
                      >
                        Total Amount
                        {sortField === "totalAmount" && (
                          sortDirection === "asc" ? (
                            <ArrowUp className="ml-1 h-3 w-3" />
                          ) : (
                            <ArrowDown className="ml-1 h-3 w-3" />
                          )
                        )}
                        {sortField !== "totalAmount" && (
                          <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="h-8 px-2 py-1 text-xs font-semibold">Notes</TableHead>
                    <TableHead className="h-8 px-2 py-1 text-xs font-semibold">Uploaded Via</TableHead>
                    <TableHead className="h-8 px-2 py-1 text-xs font-semibold">Created By</TableHead>
                    <TableHead className="h-8 px-2 py-1 text-xs font-semibold w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4 text-gray-500 text-xs">
                        {hasActiveFilters 
                          ? "No records found for the selected filters"
                          : "No bulk sales found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((sale, index) => (
                      <TableRow 
                        key={sale._id}
                        className={`h-8 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                      >
                        <TableCell className="px-2 py-1 text-xs font-medium">
                          {sale.invoiceNumber}
                        </TableCell>
                        <TableCell className="px-2 py-1 text-xs">
                          {format(new Date(sale.invoiceDate), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="px-2 py-1 text-xs">
                          {sale.totalAmount.toLocaleString()}
                        </TableCell>
                        <TableCell className="px-2 py-1 text-xs max-w-xs truncate" title={sale.notes || ""}>
                          {sale.notes || "-"}
                        </TableCell>
                        <TableCell className="px-2 py-1 text-xs">
                          {sale.uploadedByCSVRef ? (
                            <a
                              href={`${process.env.NEXT_PUBLIC_BASE_URL || ''}/uploads/files/${sale.uploadedByCSVRef}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded hover:bg-blue-200 underline flex items-center gap-1 max-w-xs truncate"
                              title={sale.uploadedByCSVRef}
                            >
                              <FileDown className="h-2.5 w-2.5" />
                              <span className="truncate">
                                {sale.uploadedByCSVRef.length > 20 
                                  ? `${sale.uploadedByCSVRef.substring(0, 20)}...` 
                                  : sale.uploadedByCSVRef}
                              </span>
                            </a>
                          ) : (
                            <span className="text-xs bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded">
                              Manual
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="px-2 py-1 text-xs">
                          {typeof sale.createdBy === "object"
                            ? sale.createdBy.name
                            : "Unknown"}
                        </TableCell>
                        <TableCell className="px-2 py-1 text-xs">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="text-xs">
                              <DropdownMenuItem onClick={() => handleEdit(sale)} className="text-xs py-1.5">
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setDeletingId(sale._id);
                                  setDeleteDialogOpen(true);
                                }}
                                className="text-red-600 focus:text-red-600 text-xs py-1.5"
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                {/* Sticky Footer */}
                <TableFooter className="sticky bottom-0 bg-white border-t-2 border-gray-200">
                  <TableRow className="h-8">
                    <TableCell colSpan={2} className="px-2 py-1 text-xs font-semibold text-right">
                      Total (Filtered):
                    </TableCell>
                    <TableCell className="px-2 py-1 text-xs font-semibold">
                      NPR {totalAmount.toLocaleString()}
                    </TableCell>
                    <TableCell colSpan={4} className="px-2 py-1"></TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">
                Showing {filteredAndSortedData.length === 0 ? 0 : ((currentPage - 1) * (rowsPerPage === -1 ? filteredAndSortedData.length : rowsPerPage)) + 1} to{" "}
                {rowsPerPage === -1 
                  ? filteredAndSortedData.length 
                  : Math.min(currentPage * rowsPerPage, filteredAndSortedData.length)} of{" "}
                {filteredAndSortedData.length} entries
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="rows-per-page" className="text-sm whitespace-nowrap">Rows per page:</Label>
                <Select
                  value={rowsPerPage === -1 ? "all" : rowsPerPage.toString()}
                  onValueChange={(value) => {
                    setRowsPerPage(value === "all" ? -1 : parseInt(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="all">All</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Upload Modal */}
      <BulkSalesUploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={() => {
          setUploadModalOpen(false);
          fetchBulkSales();
        }}
      />

      {/* Create Modal */}
      <BulkSalesCreateModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          setCreateModalOpen(false);
          fetchBulkSales();
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

