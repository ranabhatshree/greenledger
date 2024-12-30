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


interface Supplier {
  _id: string;
  name: string;
  email: string;
}

export default function CreatePurchasePage() {
  const [date, setDate] = useState<Date>();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [note, setNote] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [isVatBill, setIsVatBill] = useState(true);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();


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

  const handleSavePurchase = async () => {
    try {
      setIsSubmitting(true);

      if (!amount || !description || !invoiceNumber || !date) {
        toast({
          title: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      const purchaseData = {
        amount: Number(amount),
        invoiceNumber,
        invoiceDate: format(date, "yyyy-MM-dd"),
        isVatable: isVatBill,
        billPhotos: images.map(img => img.filePath),
        description,
        note,
        suppliedBy: selectedSupplier
      };

      const response = await axiosInstance.post('/purchases', purchaseData);

      if(response.status === 201){
        toast({
          title: "Purchase invoice saved successfully!",
          description: "Purchase invoice saved successfully!",
          variant: "default",
        });
      }
      
      setAmount("");
      setInvoiceNumber("");
      setDate(undefined);
      setIsVatBill(true);
      setImages([]);
      setDescription("");
      setNote("");
      setSelectedSupplier("");

    } catch (error) {
      console.log(error);
      toast({
        title: `Failed to save purchase invoice!`,
        description: "Failed to save purchase invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold">Create Purchase</h1>
        
        <Card className="p-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Supplier</label>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Supplier" />
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

          <div className="flex items-center space-x-2 mt-4">
            <Checkbox 
              id="vatBill" 
              checked={isVatBill}
              onCheckedChange={(checked) => setIsVatBill(checked as boolean)}
            />
            <label 
              htmlFor="vatBill" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              VAT Bill
            </label>
          </div>

          <div className="mt-6">
            <ImageUploader
              images={images}
              onImagesChange={setImages}
            />
          </div>

          <div className="grid grid-cols-2 gap-8 mt-4">
            <div>
              <label className="block text-sm font-medium mb-2">Note</label>
              <Textarea
                placeholder="Write Short Note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="h-24"
              />
            </div>
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
              onClick={handleSavePurchase}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Purchase"}
            </Button>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
} 