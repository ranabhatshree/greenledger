"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Loader } from "@/components/ui/loader";
import { format } from "date-fns";
import axiosInstance from "@/lib/api/axiosInstance";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { getBusinessName, getBusinessLogo, getThemeColor, formatCurrency } from "@/lib/utils";

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
  paymentTerms?: string;
  dueDate?: string;
  paymentMethod?: string;
}

export default function InvoicePrintPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [sale, setSale] = useState<SaleDetails | null>(null);
  const { toast } = useToast();
  const businessName = getBusinessName();
  const businessLogo = getBusinessLogo();
  const themeColor = getThemeColor();

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

  const calculateDueDate = () => {
    if (sale?.dueDate) return new Date(sale.dueDate);
    if (!sale) return new Date();
    const invoiceDate = new Date(sale.invoiceDate);
    const paymentTermsDays = sale.paymentTerms === "Next Day" ? 1 : 14; // Default to 14 days
    return new Date(invoiceDate.getTime() + paymentTermsDays * 24 * 60 * 60 * 1000);
  };

  useEffect(() => {
    fetchSaleDetails();
    // Auto-print when component loads
    const timer = setTimeout(() => {
      if (!loading && sale) {
        window.print();
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [id]);

  if (loading) return <Loader />;
  if (!sale) return <div>Sale not found</div>;

  return (
    <div className="w-full min-h-screen bg-white p-8 max-w-5xl mx-auto">
      {/* Header Section with Theme Color */}
      <div 
        className="p-8 text-white rounded-t-lg"
        style={{ backgroundColor: themeColor }}
      >
        <div className="flex justify-between items-start">
          <div>
            {businessLogo ? (
              <div className="mb-4">
                <Image 
                  src={businessLogo} 
                  alt={businessName} 
                  width={150} 
                  height={100} 
                  className="object-contain filter brightness-0 invert" 
                />
              </div>
            ) : (
              <div className="text-2xl font-bold mb-4">{businessName}</div>
            )}
            <div className="text-sm opacity-90">
              <p>{businessName}</p>
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-4xl font-bold mb-2">INVOICE</h1>
            <p className="text-lg"># {sale.invoiceNumber}</p>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-8 border-l border-r border-b rounded-b-lg">
        {/* Bill To and Invoice Details */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Bill To:</p>
            <div className="text-sm">
              <p className="font-semibold text-lg">{sale.billingParty}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">{format(new Date(sale.invoiceDate), 'MMM d, yyyy')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Items Table */}
        <div className="mb-8">
          {sale.directEntry.amount > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <div 
                className="px-4 py-3 text-white font-medium"
                style={{ backgroundColor: themeColor }}
              >
                Description
              </div>
              <div className="p-4 bg-gray-50">
                <p className="text-gray-700 mb-4">{sale.directEntry.description || 'Service provided'}</p>
                <div className="text-right">
                  <span className="font-bold text-lg">{formatCurrency(sale.directEntry.amount)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr 
                    className="text-white"
                    style={{ backgroundColor: themeColor }}
                  >
                    <th className="text-left py-3 px-4 font-medium">Item</th>
                    <th className="text-center py-3 px-4 font-medium">Quantity</th>
                    <th className="text-right py-3 px-4 font-medium">Rate</th>
                    <th className="text-right py-3 px-4 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-50">
                  {sale.items.map((item, index) => (
                    <tr key={item._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="py-3 px-4">{item.name}</td>
                      <td className="text-center py-3 px-4">{item.quantity}</td>
                      <td className="text-right py-3 px-4">{formatCurrency(item.rate)}</td>
                      <td className="text-right py-3 px-4 font-medium">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Section */}
        <div className="flex justify-end mb-8">
          <div className="w-80">
            {sale.items.length > 0 && (
              <>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>{formatCurrency(sale.subTotal)}</span>
                </div>
                {sale.isTaxable && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Tax (10%):</span>
                    <span>{formatCurrency(sale.vatAmount)}</span>
                  </div>
                )}
              </>
            )}
            <div className="flex justify-between py-3 border-b-2 border-gray-300 font-bold text-lg">
              <span>Total:</span>
              <span>{formatCurrency(sale.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">Notes:</p>
          <p className="text-sm text-gray-700">
            {sale.note || 'Thank you for your business.'}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>This is a computer generated invoice.</p>
      </div>
    </div>
  );
} 