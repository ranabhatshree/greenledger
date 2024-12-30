"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ProductTable } from "@/components/products/product-table";
import { ProductModal } from "@/components/products/product-modal";
import { useState } from "react";

export default function ProductsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefreshProducts = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Products</h1>
          <Button 
            className="bg-green-600 hover:bg-green-700 flex items-center"
            aria-label="Add Product"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
        <ProductTable 
          onAddSuccess={() => setShowAddModal(false)}
          refreshTrigger={refreshTrigger}
        />
        <ProductModal 
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => setShowAddModal(false)}
          onRefreshProducts={handleRefreshProducts}
        />
      </div>
    </AppLayout>
  );
} 