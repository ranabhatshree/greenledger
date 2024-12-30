"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { Printer } from "lucide-react";
import { format } from "date-fns";
import axiosInstance from "@/lib/api/axiosInstance";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ImageIcon } from "lucide-react";

interface SaleItem {
  _id: string;
  productId: string;
  name: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface SaleDetails {
  _id: string;
  billingParty: string;
  invoiceNumber: string;
  invoiceDate: string;
  items: SaleItem[];
  directEntry: {
    description: string | null;
    amount: number;
  };
  discountPercentage: number;
  discountAmount: number;
  subTotal: number;
  taxableAmount: number;
  vatAmount: number;
  grandTotal: number;
  note: string | null;
  isTaxable: boolean;
  createdBy: {
    _id: string;
    name: string;
  };
  billPhotos?: string[];
}

export default function InvoiceViewPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [sale, setSale] = useState<SaleDetails | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSaleDetails = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/sales/${id}`);
      
      if (response.status !== 200) {
        throw new Error('Failed to fetch sale details');
      }

      setSale(response.data.sale);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch sale details",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    fetchSaleDetails();
  }, [id]);

  if (loading) return <Loader />;
  if (!sale) return <div>Sale not found</div>;

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 max-w-[1000px] mx-auto print:m-0 print:w-full">
        <div className="flex items-center justify-between print:hidden">
          <h1 className="text-2xl font-bold">Invoice #{sale.invoiceNumber}</h1>
          <Button 
            onClick={handlePrint}
            className="flex items-center gap-2"
            aria-label="Print invoice"
          >
            <Printer className="h-4 w-4" />
            Print Invoice
          </Button>
        </div>

        <div className="border rounded-lg p-6 bg-white shadow-sm print:shadow-none print:border-none print:p-0 print:w-full">
          <div className="hidden print:block mb-8 text-center">
            <h1 className="text-2xl font-bold mb-1">GreenLedger</h1>
            <p className="text-sm text-gray-600">Your Complete Business Solution</p>
          </div>

          <div className="flex justify-between mb-8">
            <div>
              <h2 className="font-bold text-xl mb-2">Invoice To:</h2>
              <p className="text-gray-600">{sale.billingParty}</p>
              {sale.note && (
                <p className="text-gray-500 mt-2">Note: {sale.note}</p>
              )}
            </div>
            <div className="text-right">
              <p className="font-medium">Date: {format(new Date(sale.invoiceDate), 'MMM dd, yyyy')}</p>
              <p className="font-medium">Invoice #: {sale.invoiceNumber}</p>
            </div>
          </div>

          {sale.billPhotos && sale.billPhotos.length > 0 && (
            <div className="mb-8 print:hidden">
              <h3 className="font-medium mb-3">Bill Photos:</h3>
              <div className="flex flex-wrap gap-4">
                {sale.billPhotos.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(photo)}
                    className="relative group h-24 w-24 rounded-lg overflow-hidden border border-gray-200 hover:border-primary/50 transition-colors"
                    aria-label={`View bill photo ${index + 1}`}
                  >
                    <Image
                      src={photo}
                      alt={`Bill photo ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-white" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mb-8">
            {sale.directEntry.amount > 0 ? (
              <div className="border-b pb-4 print:border-0">
                <h3 className="font-medium mb-2">Description:</h3>
                <p className="text-gray-600">{sale.directEntry.description || 'No description provided'}</p>
                <div className="mt-4 text-right">
                  <p className="font-medium">Amount: {sale.directEntry.amount.toLocaleString()}</p>
                </div>
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left py-2 border-b border-gray-200">Item</th>
                    <th className="text-right py-2 border-b border-gray-200">Quantity</th>
                    <th className="text-right py-2 border-b border-gray-200">Rate</th>
                    <th className="text-right py-2 border-b border-gray-200">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items.map((item) => (
                    <tr key={item._id}>
                      <td className="py-2 border-b border-gray-200">{item.name}</td>
                      <td className="text-right py-2 border-b border-gray-200">{item.quantity}</td>
                      <td className="text-right py-2 border-b border-gray-200">{item.rate.toLocaleString()}</td>
                      <td className="text-right py-2 border-b border-gray-200">
                        {item.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex justify-end">
            <div className="w-64">
              {sale.items.length > 0 && (
                <>
                  <div className="flex justify-between py-1">
                    <span>Sub Total:</span>
                    <span>{sale.subTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 text-gray-600">
                    <span>Discount:</span>
                    <span>{sale.discountPercentage}% ({sale.discountAmount.toLocaleString()})</span>
                  </div>
                  {sale.isTaxable && (
                    <>
                      <div className="flex justify-between py-1 text-gray-600">
                        <span>Taxable Amount:</span>
                        <span>{sale.taxableAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-1 text-gray-600">
                        <span>VAT Amount:</span>
                        <span>{sale.vatAmount.toLocaleString()}</span>
                      </div>
                    </>
                  )}
                </>
              )}
              <div className="flex justify-between py-2 font-bold border-t print:border-gray-400 mt-2">
                <span>Total Amount:</span>
                <span>{sale.grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="hidden print:block mt-16 pt-8 border-t text-center text-sm text-gray-500">
            <p>Thank you for your business!</p>
            <p className="mt-1">This is a computer generated invoice.</p>
          </div>

          <Dialog 
            open={!!selectedImage} 
            onOpenChange={() => setSelectedImage(null)}
          >
            <DialogContent className="max-w-3xl">
              <DialogTitle>Bill Photo</DialogTitle>
              {selectedImage && (
                <div className="relative h-[80vh]">
                  <Image
                    src={selectedImage}
                    alt="Bill photo"
                    fill
                    className="object-contain"
                  />
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AppLayout>
  );
} 