"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Plus, Image as ImageIcon, X, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import axiosInstance from "@/lib/api/axiosInstance";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { ImageUploader, type UploadedImage } from "@/components/shared/image-uploader";

interface BillingItem {
  id: number;
  itemName: string;
  quantity: number;
  rate: number;
  amount: number;
  productId?: string;
}

interface Product {
  _id: string;
  name: string;
  thumbnailURL: string;
  mrp: number;
  sku: string;
  category: string;
  productURL: string;
  createdAt: string;
  updatedAt: string;
}

interface SaleInvoicePayload {
  invoiceNumber: string;
  invoiceDate: string;
  billingParty: string;
  directEntry?: {
    description: string;
    amount: number;
  };
  items?: {
    productId: string;
    quantity: number;
  }[];
  discountPercentage: number;
  note?: string;
  billPhotos?: string[];
}

interface Vendor {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  panNumber: string;
  address: string;
  partyMargin?: number;
}

const roundToTwo = (num: number) => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

const calculateRateFromMRP = (mrp: number) => {
  return roundToTwo(mrp / 1.13);
};

const calculateItemRate = (baseRate: number, partyMargin: number = 0) => {
  return roundToTwo(baseRate * (1 - partyMargin / 100));
};

export default function CreateSalePage() {
  const router = useRouter();
  const [billingItems, setBillingItems] = useState<BillingItem[]>([
    { id: 1, itemName: "", quantity: 1, rate: 0, amount: 0 },
  ]);
  const [note, setNote] = useState("");
  const [isDirectEntry, setIsDirectEntry] = useState(true);
  const [date, setDate] = useState<Date>();
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [description, setDescription] = useState("");
  const [directAmount, setDirectAmount] = useState("");
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [billingParty, setBillingParty] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [vendors, setVendors] = useState<Vendor[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axiosInstance.get('/products');        
        let productsData: Product[] = [];
        if (response.data?.products) {
          productsData = response.data.products;
        } else if (Array.isArray(response.data)) {
          productsData = response.data;
        }
        
        const validProducts = productsData
          .filter(Boolean)
          .filter((product): product is Product => {
            return (
              typeof product === 'object' &&
              'name' in product &&
              'mrp' in product &&
              typeof product.name === 'string' &&
              typeof product.mrp === 'number'
            );
          });
        
        setProducts(validProducts);
      } catch (error) {
        setProducts([]);
      }
    };
    
    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await axiosInstance.get('/auth/users-by-role?role=vendor,supplier');
        if(response.status === 200  ){
          setVendors(response.data.users);
        }
      } catch (error) {
        console.error("Error fetching vendors:", error);
      }
    };

    fetchVendors();
  }, []);

  const handleAddItem = () => {
    setBillingItems([
      ...billingItems,
      {
        id: billingItems.length + 1,
        itemName: "",
        quantity: 1,
        rate: 0,
        amount: 0,
      },
    ]);
  };

  const handleDeleteItem = (id: number) => {
    if (billingItems.length <= 1) return;
    const filteredItems = billingItems.filter(item => item.id !== id);
    const reorderedItems = filteredItems.map((item, index) => ({
      ...item,
      id: index + 1
    }));
    setBillingItems(reorderedItems);
  };

  const calculateAmount = (item: BillingItem) => {
    return roundToTwo(item.quantity * item.rate);
  };

  const updateBillingItem = (
    index: number,
    field: keyof BillingItem,
    value: string | number,
    product?: Product
  ) => {
    const updatedItems = billingItems.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item, [field]: value };
        if (product) {
          const selectedVendor = vendors.find(v => v._id === billingParty);
          const baseRate = calculateRateFromMRP(product.mrp);
          const finalRate = calculateItemRate(baseRate, selectedVendor?.partyMargin || 0);
          
          updatedItem.itemName = product.name;
          updatedItem.rate = finalRate;
          updatedItem.productId = product._id;
        }
        updatedItem.amount = calculateAmount(updatedItem);
        return updatedItem;
      }
      return item;
    });
    setBillingItems(updatedItems);
  };

  const calculateTotal = () => {
    return roundToTwo(billingItems.reduce((sum, item) => sum + item.amount, 0));
  };

  const calculateDiscountAmount = () => {
    return roundToTwo((calculateTotal() * totalDiscount) / 100);
  };

  const calculateTaxableAmount = () => {
    return roundToTwo(calculateTotal() - calculateDiscountAmount());
  };

  const calculateVatAmount = () => {
    return roundToTwo(calculateTaxableAmount() * 0.13);
  };

  const calculateGrandTotal = () => {
    return roundToTwo(calculateTaxableAmount() + calculateVatAmount());
  };

  const resetForm = () => {
    setBillingItems([
      { id: 1, itemName: "", quantity: 1, rate: 0, amount: 0 },
    ]);
    setNote("");
    setDate(undefined);
    setUploadedImages([]);
    setDescription("");
    setDirectAmount("");
    setTotalDiscount(0);
    setInvoiceNumber("");
    setBillingParty("");
  };

  const handleSaveInvoice = async (shouldRedirect: boolean = true) => {
    try {
      if (!invoiceNumber || !billingParty || !date) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please fill in all required fields"
        });
        return;
      }

      setIsSubmitting(true);

      const payload: SaleInvoicePayload = {
        invoiceNumber,
        invoiceDate: format(date, 'yyyy-MM-dd'),
        billingParty,
        discountPercentage: totalDiscount,
      };

      // Add optional fields
      if (note) payload.note = note;
      if (uploadedImages.length > 0) {
        payload.billPhotos = uploadedImages.map(img => img.filePath);
      }

      // Add either directEntry or items based on mode
      if (isDirectEntry) {
        if (!description || !directAmount) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Please fill in description and amount"
          });
          return;
        }
        payload.directEntry = {
          description,
          amount: parseFloat(directAmount),
        };
      } else {
        const hasEmptyItems = billingItems.some(item => !item.itemName);
        if (hasEmptyItems) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Please fill in all billing items"
          });
          return;
        }

        // Transform billingItems to the required items format
        payload.items = billingItems.map(item => {
          const product = products.find(p => p.name === item.itemName);
          if (!product?._id) {
            throw new Error(`Product ID not found for ${item.itemName}`);
          }
          return {
            productId: product._id,
            quantity: item.quantity,
          };
        });
      }
      const response = await axiosInstance.post('/sales', payload);
      if(response.status === 201){
        const invoice = response.data ? response.data.sale : null;
        toast({
          variant: "default",
          title: "Success",
          description: "Sale invoice created successfully!"
        });
        
        if (shouldRedirect && invoice) {
          router.push(`/sales/invoice/${invoice._id}`);
        } else {
          resetForm();
        }
      }
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create sale invoice"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (billingParty && billingItems.length > 0) {
      const selectedVendor = vendors.find(v => v._id === billingParty);
      
      const updatedItems = billingItems.map(item => {
        if (item.productId) {
          const product = products.find(p => p._id === item.productId);
          if (product) {
            const baseRate = calculateRateFromMRP(product.mrp);
            const finalRate = calculateItemRate(baseRate, selectedVendor?.partyMargin || 0);
            return {
              ...item,
              rate: finalRate,
              amount: roundToTwo(finalRate * item.quantity)
            };
          }
        }
        return item;
      });
      
      setBillingItems(updatedItems);
    }
  }, [billingParty]);

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold">Create Sales Invoice</h1>
        
        <Card className="p-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Billing Party</label>
              <Select
                value={billingParty}
                onValueChange={(value) => setBillingParty(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Billing Party" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor._id} value={vendor._id}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Invoice Number</label>
              <Input 
                placeholder="Enter Invoice No." 
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Invoice Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex gap-2 py-8">
            <Button 
              variant="outline"
              className={cn("bg-blue-50 text-blue-600", isDirectEntry && "bg-blue-100")}
              onClick={() => setIsDirectEntry(true)}
            >
              Direct Entry
            </Button>
            <Button 
              variant="outline"
              className={cn(!isDirectEntry && "bg-blue-100")}
              onClick={() => setIsDirectEntry(false)}
            >
              Add by Item
            </Button>
          </div>

          {isDirectEntry ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <Input
                    placeholder="Enter Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Amount</label>
                  <div className="flex items-center gap-1">
                    <span>Rs.</span>
                    <Input
                      type="number"
                      placeholder="Enter Amount"
                      value={directAmount}
                      onChange={(e) => setDirectAmount(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left">
                      <th className="w-16 pb-2">SN</th>
                      <th className="pb-2">Item</th>
                      <th className="w-24 pb-2">Qty.</th>
                      <th className="w-32 pb-2">Rate</th>
                      <th className="w-32 pb-2">Amount</th>
                      {billingItems.length > 1 && <th className="w-16 pb-2"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {billingItems.map((item, index) => (
                      <tr key={item.id}>
                        <td className="py-2">{item.id}</td>
                        <td className="py-2">
                          <Select
                            value={item.itemName || ""}
                            onValueChange={(value) => {
                              const selectedProduct = products.find(p => p.name === value);
                              if (selectedProduct) {
                                updateBillingItem(index, "itemName", value, selectedProduct);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue>
                                {item.itemName ? (
                                  <div className="flex items-center gap-2">
                                    {products.find(p => p.name === item.itemName)?.thumbnailURL && (
                                      <img
                                        src={products.find(p => p.name === item.itemName)?.thumbnailURL}
                                        alt={item.itemName}
                                        className="w-6 h-6 object-cover rounded"
                                      />
                                    )}
                                    <span>{item.itemName}</span>
                                  </div>
                                ) : (
                                  "Select an item"
                                )}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem 
                                  key={product._id}
                                  value={product.name}
                                  className="flex items-center gap-2 py-2"
                                >
                                  <div className="flex items-center gap-2">
                                    {product.thumbnailURL && (
                                      <img
                                        src={product.thumbnailURL}
                                        alt={product.name}
                                        className="w-6 h-6 object-cover rounded"
                                      />
                                    )}
                                    <span>{product.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-2">
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateBillingItem(index, "quantity", Number(e.target.value))
                            }
                          />
                        </td>
                        <td className="py-2">
                          <div className="flex items-center gap-1">
                            <span>Rs.</span>
                            <Input
                              type="number"
                              value={item.rate}
                              readOnly
                              onChange={(e) =>
                                updateBillingItem(index, "rate", Number(e.target.value))
                              }
                            />
                          </div>
                        </td>
                        <td className="py-2">
                          <div className="flex items-center gap-1">
                            <span>Rs.</span>
                            <Input
                              type="number"
                              value={item.amount}
                              readOnly
                              className="bg-gray-50"
                            />
                          </div>
                        </td>
                        {billingItems.length > 1 && (
                          <td className="py-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleDeleteItem(item.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Button
                variant="ghost"
                className="text-blue-600 w-fit mt-4"
                onClick={handleAddItem}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Billing Item
              </Button>
            </>
          )}

          {!isDirectEntry && (
            <div className="mt-4 space-y-2 w-1/3 ml-auto">
              <div className="flex justify-between">
                <span>Total</span>
                <span>Rs. {calculateTotal()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Discount</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={totalDiscount}
                    onChange={(e) => setTotalDiscount(Number(e.target.value))}
                    className="w-20"
                  />
                  <span>%</span>
                  <span className="ml-2">Rs. {calculateDiscountAmount()}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span>Taxable Amount</span>
                <span>Rs. {calculateTaxableAmount()}</span>
              </div>
              <div className="flex justify-between">
                <span>13% VAT Amount</span>
                <span>Rs. {calculateVatAmount()}</span>
              </div>
              <div className="flex justify-between font-semibold pt-2 border-t">
                <span>Grand Total</span>
                <span>Rs. {calculateGrandTotal()}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-8 mt-6">
            <ImageUploader
              images={uploadedImages}
              onImagesChange={setUploadedImages}
            />

            <div>
              <label className="block text-sm font-medium mb-2">Note</label>
              <Textarea
                placeholder="Write Short Note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-4">
            <Button 
              variant="outline" 
              disabled={isSubmitting}
              onClick={() => handleSaveInvoice(false)}
            >
              Save and Add New
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              disabled={isSubmitting}
              onClick={() => handleSaveInvoice(true)}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : (
                "Save Sale Invoice"
              )}
            </Button>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
} 