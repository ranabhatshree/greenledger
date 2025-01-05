"use client";

import { useState, useEffect } from "react";
import { DataTable, Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Pencil, MoreHorizontal, Trash,  ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import axiosInstance from "@/lib/api/axiosInstance";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProductModal } from "@/components/products/product-modal";

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

interface ProductTableProps {
  onAddSuccess: () => void;
  refreshTrigger: number;
}

export const ProductTable = ({ onAddSuccess, refreshTrigger }: ProductTableProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchProducts = async () => {
    try {
      const response = await axiosInstance.get("/products");
      setProducts(response.data.products);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [refreshTrigger]);

  const filteredProducts = products.filter((product) =>
    Object.values(product).some(
      (value) =>
        value &&
        value.toString().toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const formatCurrency = (amount: number) => {
    return `NPR ${amount.toLocaleString()}`;
  };

  const columns: Column<Product>[] = [
    {
      header: "SN",
      cell: (_, index) => (
        <span className="font-medium text-gray-900">
          {(index + 1).toString().padStart(2, '0')}
        </span>
      ),
    },
    {
      header: "Thumbnail",
      cell: (product) => (
        <div className="h-12 w-12 relative">
          <Image
            src={product.thumbnailURL}
            alt={product.name}
            fill
            className="rounded-md object-cover"
          />
        </div>
      ),
    },
    {
      header: "Name",
      accessorKey: "name",
    },
    {
      header: "Category",
      accessorKey: "category",
    },
    {
      header: "MRP",
      accessorKey: "mrp",
    },
    {
      header: "SKU",
      accessorKey: "sku",
    },
    {
      header: "",
      id: "actions",
      cell: (product) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0"
              aria-label="Open menu"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => window.open(product.productURL, "_blank")}
            >
              <ArrowUpRight className="mr-2 h-4 w-4" />
              View Full
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={() => setEditProduct(product)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer text-red-600"
              onClick={() => handleDeleteClick(product)}
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const handleDeleteClick = (product: Product) => {
    setEditProduct(product);
    setDeleteProductId(product._id);
    setShowDeleteModal(true);
    setShowDeleteAlert(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteProductId) return;

    try {
      await axiosInstance.delete(`/products/${deleteProductId}`);
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
    } finally {
      setShowDeleteAlert(false);
      setShowDeleteModal(false);
      setDeleteProductId(null);
      setEditProduct(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteAlert(false);
    setShowDeleteModal(false);
    setDeleteProductId(null);
    setEditProduct(null);
  };

  return (
    <>
      <DataTable<Product>
        title="Products List"
        data={filteredProducts}
        columns={columns}
        searchPlaceholder="Search products..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        loading={loading}
      />
      
      {(editProduct || showDeleteModal) && (
        <ProductModal
          open={!!editProduct || showDeleteModal}
          onClose={() => {
            setEditProduct(null);
            setShowDeleteModal(false);
            setShowDeleteAlert(false);
          }}
          onSuccess={() => {
            setEditProduct(null);
            setShowDeleteModal(false);
            fetchProducts();
          }}
          editProduct={editProduct}
          onRefreshProducts={fetchProducts}
          showDeleteAlert={showDeleteAlert}
          onDeleteConfirm={handleDeleteConfirm}
          onDeleteCancel={handleDeleteCancel}
        />
      )}

      <ProductModal 
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          fetchProducts();
        }}
        onRefreshProducts={fetchProducts}
      />
    </>
  );
}; 