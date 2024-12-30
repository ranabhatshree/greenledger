"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import axiosInstance from "@/lib/api/axiosInstance";
import { toast } from "react-hot-toast";
import { AlertCircle } from "lucide-react"
 
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

interface Product {
  _id: string;
  name: string;
  mrp: number;
  sku: string;
  category: string;
  thumbnailURL: string;
  productURL: string;
  createdAt: string;
  updatedAt: string;
}

interface ProductFormData {
  name: string;
  mrp: number;
  sku: string;
  category: string;
  thumbnailURL: string;
  productURL: string;
}

interface ProductModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editProduct?: Product | null;
  onRefreshProducts: () => void;
  showDeleteAlert?: boolean;
  onDeleteConfirm?: () => void;
  onDeleteCancel?: () => void;
}

export const ProductModal = ({
  open,
  onClose,
  onSuccess,
  editProduct,
  onRefreshProducts,
  showDeleteAlert,
  onDeleteConfirm,
  onDeleteCancel,
}: ProductModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(
    editProduct || {
      name: "",
      mrp: 0,
      sku: "",
      category: "",
      thumbnailURL: "",
      productURL: "",
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (editProduct) {
        await axiosInstance.put(`/products/${editProduct._id}`, formData);
        toast.success('Product updated successfully');
      } else {
        await axiosInstance.post("/products", formData);
        toast.success('Product added successfully');
      }
      onSuccess();
      onRefreshProducts();
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Something went wrong';
      toast.error(errorMessage);
      setError(errorMessage);
      console.error("Error saving product:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof ProductFormData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: field === "mrp" ? Number(value) : value,
    }));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[825px]">
          <DialogHeader>
            <DialogTitle>
              {editProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleChange("category", e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="mrp">MRP</Label>
                  <Input
                    id="mrp"
                    type="number"
                    value={formData.mrp}
                    onChange={(e) => handleChange("mrp", e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => handleChange("sku", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="thumbnailURL">Thumbnail URL</Label>
                  <Input
                    id="thumbnailURL"
                    value={formData.thumbnailURL}
                    onChange={(e) => handleChange("thumbnailURL", e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="productURL">Product URL</Label>
                  <Input
                    id="productURL"
                    value={formData.productURL}
                    onChange={(e) => handleChange("productURL", e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : editProduct ? "Update" : "Add"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteAlert} onOpenChange={onDeleteCancel}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. This will permanently delete the product.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onDeleteCancel}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={onDeleteConfirm}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}; 