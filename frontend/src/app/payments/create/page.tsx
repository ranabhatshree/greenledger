"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { ImageUploader, UploadedImage } from "@/components/shared/image-uploader";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axiosInstance from "@/lib/api/axiosInstance";
import { useToast } from "@/hooks/use-toast";

// Add PaymentType type
type PaymentType = 'cheque' | 'fonepay' | 'cash' | 'bank_transfer';

interface Supplier {
  _id: string;
  name: string;
  email: string;
}

export default function CreatePurchasePage() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [paymentType, setPaymentType] = useState<PaymentType>('cash');
  const [paymentReceivedDate, setPaymentReceivedDate] = useState<Date>();
  const [paymentDepositedDate, setPaymentDepositedDate] = useState<Date>();
  const [receivedOrPaid, setReceivedOrPaid] = useState<boolean>(true);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await axiosInstance.get('/auth/users-by-role?role=vendor,supplier');
        setSuppliers(response.data.users);
      } catch (error) {
        console.error('Error fetching suppliers:', error);
      }
    };

    fetchSuppliers();
  }, []);

  const handleSavePayment = async () => {
    try {
      setIsSubmitting(true);

      if (!amount || !description || !invoiceNumber || !paymentReceivedDate) {
        toast({
          title: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      const paymentData = {
        amount: Number(amount),
        invoiceNumber,
        type: paymentType,
        invoiceDate: format(paymentReceivedDate, "yyyy-MM-dd"),
        paymentDepositedDate: paymentDepositedDate ? format(paymentDepositedDate, "yyyy-MM-dd") : null,
        billPhotos: images.map(img => img.filePath),
        description,
        paidBy: selectedSupplier,
        receivedOrPaid,
      };

      const response = await axiosInstance.post('/payments', paymentData);

      if(response.status === 201){
        toast({
          title: "Payment saved successfully!",
          description: "Payment saved successfully!",
          variant: "default",
        });
      }
      
      setAmount("");
      setInvoiceNumber("");
      setPaymentReceivedDate(undefined);
      setImages([]);
      setDescription("");
      setSelectedSupplier("");

    } catch (error) {
      console.log(error);
      toast({
        title: `Failed to save payment!`,
        description: "Failed to save payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold">Add Payment</h1>
        
        <Card className="p-6">
          <div className="grid grid-cols-4 gap-4">
          <div>
              <label className="block text-sm font-medium mb-2">Payment Status</label>
              <Select 
                value={receivedOrPaid.toString()} 
                onValueChange={(value) => setReceivedOrPaid(value === 'true')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Payment Status">
                    {receivedOrPaid ? 'Received' : 'Paid'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Received</SelectItem>
                  <SelectItem value="false">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Party</label>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Party" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier._id} value={supplier._id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Cheque/Transaction Ref. No.</label>
              <Input 
                placeholder="Enter Cheque/Transaction Ref. No." 
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Payment Method</label>
              <Select value={paymentType} onValueChange={(value) => setPaymentType(value as PaymentType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="fonepay">FonePay</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div>
              <label className="block text-sm font-medium mb-2">Payment {receivedOrPaid ? 'Received' : 'Paid'} Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !paymentReceivedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {paymentReceivedDate ? format(paymentReceivedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={paymentReceivedDate}
                    onSelect={setPaymentReceivedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Payment Deposited Date (Optional)</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !paymentDepositedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {paymentDepositedDate ? format(paymentDepositedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={paymentDepositedDate}
                    onSelect={setPaymentDepositedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
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
                <span>NPR</span>
                <Input
                  type="number"
                  placeholder="Enter Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <ImageUploader
              images={images}
              onImagesChange={setImages}
            />
          </div>

          <div className="grid grid-cols-2 gap-8 mt-4">
            <div className="mt-4">
              <div className="flex justify-between font-semibold">
                <span>Total Amount</span>
                <span>NPR {amount || 0}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-4">
            <Button 
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-400"
              onClick={handleSavePayment}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Payment"}
            </Button>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
} 