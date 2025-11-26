"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createBulkSale } from "@/lib/api/bulkSales";

interface BulkSalesCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkSalesCreateModal({
  open,
  onClose,
  onSuccess,
}: BulkSalesCreateModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    invoiceNumber: "",
    invoiceDate: "",
    totalAmount: "",
    notes: "",
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.invoiceNumber || !formData.invoiceDate || !formData.totalAmount) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await createBulkSale({
        invoiceNumber: formData.invoiceNumber,
        invoiceDate: formData.invoiceDate,
        totalAmount: parseFloat(formData.totalAmount),
        notes: formData.notes || undefined,
      });
      
      toast({
        title: "Success",
        description: "Bulk sale created successfully",
      });
      
      // Reset form
      setFormData({
        invoiceNumber: "",
        invoiceDate: "",
        totalAmount: "",
        notes: "",
      });
      
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create bulk sale",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Bulk Sale</DialogTitle>
          <DialogDescription>
            Add a new bulk sale entry manually
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="invoice-number">
                Invoice Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="invoice-number"
                value={formData.invoiceNumber}
                onChange={(e) =>
                  setFormData({ ...formData, invoiceNumber: e.target.value })
                }
                placeholder="e.g., INV-001"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="invoice-date">
                Invoice Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="invoice-date"
                type="date"
                value={formData.invoiceDate}
                onChange={(e) =>
                  setFormData({ ...formData, invoiceDate: e.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="total-amount">
                Total Amount <span className="text-red-500">*</span>
              </Label>
              <Input
                id="total-amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.totalAmount}
                onChange={(e) =>
                  setFormData({ ...formData, totalAmount: e.target.value })
                }
                placeholder="0.00"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Add any additional notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

