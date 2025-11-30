"use client";

import { useState } from "react";
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
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { createImport, type CreateImportData, type ExpenseDetail } from "@/lib/api/imports";
import { Plus, X } from "lucide-react";

export default function CreateImportPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [invoiceDate, setInvoiceDate] = useState<Date>();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [note, setNote] = useState("");
  const [description, setDescription] = useState("");
  const [amountUSD, setAmountUSD] = useState("");
  const [amount, setAmount] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierAddress, setSupplierAddress] = useState("");
  const [driveLink, setDriveLink] = useState("");
  const [expenseDetails, setExpenseDetails] = useState<ExpenseDetail[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveImport = async (shouldRedirect: boolean = true) => {
    try {
      if (!invoiceNumber || !amountUSD || !amount || !invoiceDate || !supplierName || !supplierAddress || !description) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please fill in all required fields"
        });
        return;
      }

      // Validate that either billPhotos or driveLink is provided
      if (images.length === 0 && !driveLink.trim()) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please provide either bill photos or a drive link"
        });
        return;
      }

      setIsSubmitting(true);

      // Validate expenseDetails for duplicates
      if (expenseDetails.length > 0) {
        const titles = expenseDetails.map(exp => exp.title.trim().toLowerCase());
        const uniqueTitles = new Set(titles);
        if (titles.length !== uniqueTitles.size) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Duplicate expense titles are not allowed. Each expense must have a unique title."
          });
          return;
        }
      }

      const importData: CreateImportData = {
        invoiceNumber,
        amountUSD: parseFloat(amountUSD),
        amount: parseFloat(amount),
        invoiceDate: format(invoiceDate, "yyyy-MM-dd"),
        supplierName,
        supplierAddress,
        description,
        billPhotos: images.map(img => img.filePath),
        driveLink: driveLink.trim() || undefined,
        note: note.trim() || undefined,
        expenseDetails: expenseDetails.length > 0 ? expenseDetails : undefined,
      };

      await createImport(importData);

      toast({
        title: "Success",
        description: "Import record saved successfully!",
        variant: "default",
      });

      if (shouldRedirect) {
        router.push('/imports');
      } else {
        // Reset form for "Save and Add New"
        setInvoiceNumber("");
        setAmountUSD("");
        setAmount("");
        setInvoiceDate(undefined);
        setSupplierName("");
        setSupplierAddress("");
        setImages([]);
        setDriveLink("");
        setNote("");
        setExpenseDetails([]);
      }
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.message || "Failed to save import record. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold">Create Import</h1>
        
        <Card className="p-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Invoice Number <span className="text-red-500">*</span>
              </label>
              <Input 
                placeholder="Enter Invoice Number" 
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Invoice Date <span className="text-red-500">*</span>
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !invoiceDate && "text-muted-foreground"
                    )}
                    disabled={isSubmitting}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {invoiceDate ? format(invoiceDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={invoiceDate}
                    onSelect={setInvoiceDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Amount (USD) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-1">
                <span className="text-sm">USD</span>
                <Input
                  type="number"
                  placeholder="Enter Amount in USD"
                  value={amountUSD}
                  onChange={(e) => setAmountUSD(e.target.value)}
                  min="0"
                  step="0.01"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Amount (Local Currency) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-1">
                <span className="text-sm">NPR</span>
                <Input
                  type="number"
                  placeholder="Enter Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Supplier Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Enter Supplier Name"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Supplier Address <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Enter Supplier Address"
                value={supplierAddress}
                onChange={(e) => setSupplierAddress(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Enter Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium mb-2">
              Bill Photos (Optional - if not using Drive Link)
            </label>
            <ImageUploader
              images={images}
              onImagesChange={setImages}
            />
            <p className="text-xs text-gray-500 mt-1">
              Upload images or PDFs. Max 10 files, 10MB each.
            </p>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium mb-2">
              Drive Link (Optional - if not uploading photos)
            </label>
            <Input
              placeholder="Enter Google Drive or other document storage link"
              value={driveLink}
              onChange={(e) => setDriveLink(e.target.value)}
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              Provide a link to external document storage if not uploading files directly.
            </p>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium mb-2">Note (Optional)</label>
            <Textarea
              placeholder="Write Short Note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-24"
              disabled={isSubmitting}
            />
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">
                Expense Details (Optional)
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setExpenseDetails([...expenseDetails, { title: "", amount: 0 }])}
                disabled={isSubmitting}
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Add Expense
              </Button>
            </div>
            {expenseDetails.length > 0 && (
              <div className="space-y-2 mt-2">
                {expenseDetails.map((expense, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <Input
                      placeholder="Expense Title (e.g., Food Department Cost)"
                      value={expense.title}
                      onChange={(e) => {
                        const updated = [...expenseDetails];
                        updated[index] = { ...updated[index], title: e.target.value };
                        setExpenseDetails(updated);
                      }}
                      disabled={isSubmitting}
                      className="flex-1"
                    />
                    <div className="flex items-center gap-1 w-40">
                      <span className="text-sm">NPR</span>
                      <Input
                        type="number"
                        placeholder="Amount"
                        value={expense.amount || ""}
                        onChange={(e) => {
                          const updated = [...expenseDetails];
                          updated[index] = { ...updated[index], amount: parseFloat(e.target.value) || 0 };
                          setExpenseDetails(updated);
                        }}
                        min="0"
                        step="0.01"
                        disabled={isSubmitting}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const updated = expenseDetails.filter((_, i) => i !== index);
                        setExpenseDetails(updated);
                      }}
                      disabled={isSubmitting}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Add additional expenses like customs clearance, transport costs, etc. Each expense must have a unique title.
            </p>
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total Amount (USD):</span>
              <span className="text-xl font-bold">
                USD {amountUSD ? parseFloat(amountUSD).toLocaleString() : "0"}
              </span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-lg font-semibold">Total Amount (Local):</span>
              <span className="text-xl font-bold">
                NPR {amount ? parseFloat(amount).toLocaleString() : "0"}
              </span>
            </div>
            {expenseDetails.length > 0 && (
              <>
                <div className="border-t my-2 pt-2">
                  <div className="text-sm font-medium mb-1">Additional Expenses:</div>
                  {expenseDetails.map((exp, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{exp.title || "Untitled"}:</span>
                      <span>NPR {exp.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t">
                  <span className="text-lg font-semibold">Total Expenses:</span>
                  <span className="text-xl font-bold">
                    NPR {expenseDetails.reduce((sum, exp) => sum + (exp.amount || 0), 0).toLocaleString()}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <Button 
              variant="outline" 
              disabled={isSubmitting}
              onClick={() => handleSaveImport(false)}
            >
              Save and Add New
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              disabled={isSubmitting}
              onClick={() => handleSaveImport(true)}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : (
                "Save Import"
              )}
            </Button>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> You must provide either bill photos or a drive link. 
              Ensure all details are accurate before saving.
            </p>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}

