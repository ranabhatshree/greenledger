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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axiosInstance from "@/lib/api/axiosInstance";
import { useToast } from "@/hooks/use-toast";
import { ImageUploader, type UploadedImage } from "@/components/shared/image-uploader";
import { Checkbox } from "@/components/ui/checkbox";

interface ExpenseCategory {
  _id: string;
  name: string;
}

interface ExpenseFormData {
  amount: string;
  invoiceNumber: string;
  category: string;
  description: string;
  invoiceDate: Date | undefined;
  billPhotos: string[];
  isVatable: boolean;
}

export default function CreateExpensePage() {
  const [date, setDate] = useState<Date>();
  const [expenseType, setExpenseType] = useState<string>("");
  const [note, setNote] = useState("");
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);

  const [formData, setFormData] = useState<ExpenseFormData>({
    amount: '',
    invoiceNumber: '',
    category: '',
    description: '',
    invoiceDate: undefined,
    billPhotos: [],
    isVatable: false,
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axiosInstance.get('/expensecategories');
        if (response.status === 200) {
          setCategories(response.data.categories);
        }
      } catch (error) {
        console.log(error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Error fetching expense categories"
        });
      }
    };

    fetchCategories();
  }, []);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Category name is required"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await axiosInstance.post('/expensecategories', {
        name: newCategoryName.trim()
      });

      if (response.status === 201) {
        const newCategory: ExpenseCategory = {
          _id: response.data.category._id,
          name: response.data.category.name
        };

        setCategories(prevCategories => [...prevCategories, newCategory]);
        setExpenseType(newCategory._id);
        toast({
          variant: "default",
          title: "Success",
          description: "Category added successfully"
        });
        setNewCategoryName('');
        setIsAddCategoryOpen(false);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add category"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateExpense = async () => {
    // Validation
    if (!formData.amount || !expenseType || !date) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all required fields (Amount, Category, and Date)"
      });
      return;
    }

    setIsLoading(true);
    try {
      const expenseData = {
        amount: parseFloat(formData.amount),
        invoiceNumber: formData.invoiceNumber || undefined, // Optional field
        category: expenseType,
        description: note || undefined, // Optional field
        billPhotos: uploadedImages.map(img => img.filePath),
        invoiceDate: date.toISOString(),
        isVatable: formData.isVatable
      };

      const response = await axiosInstance.post('/expenses', expenseData);

      if (response.status === 201) {
        toast({
          variant: "default",
          title: "Success",
          description: "Expense created successfully"
        });

        // Reset form
        setFormData({
          amount: '',
          invoiceNumber: '',
          category: '',
          description: '',
          invoiceDate: undefined,
          billPhotos: [],
          isVatable: false,
        });
        setDate(undefined);
        setExpenseType('');
        setNote('');
        setUploadedImages([]);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create expense"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Create New Expense</h1>
          <Button
            onClick={() => setIsAddCategoryOpen(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            Add Category
          </Button>
        </div>

        <Card className="p-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Expense Type</label>
              <Select
                value={expenseType}
                onValueChange={setExpenseType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select expense type" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem
                      key={`category-${category._id}`}
                      value={category._id}
                    >
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
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

            <div>
              <label className="block text-sm font-medium mb-2">Amount</label>
              <div className="flex items-center gap-1">
                <span>NPR</span>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Reference Number</label>
              <Input
                placeholder="Enter reference number"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium mb-2">Description</label>
            <Textarea
              placeholder="Enter expense description"
              className="h-24"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="mt-6">
            <ImageUploader
              onImagesChange={setUploadedImages}
              images={uploadedImages}
            />
          </div>

          <div className="flex items-center space-x-2 mt-6">
            <Checkbox
              id="isVatable"
              checked={formData.isVatable}
              onCheckedChange={(checked) =>
                setFormData(prev => ({ ...prev, isVatable: checked as boolean }))
              }
            />
            <label
              htmlFor="isVatable"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Check if this is a VAT bill
            </label>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={handleCreateExpense}
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Create Expense"}
            </Button>
          </div>
        </Card>
      </div>

      {/* Add Category Modal */}
      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Input
                placeholder="Category Name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => setIsAddCategoryOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleAddCategory}
              disabled={isLoading}
            >
              {isLoading ? "Adding..." : "Add"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
} 