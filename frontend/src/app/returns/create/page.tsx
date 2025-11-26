"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axiosInstance from "@/lib/api/axiosInstance";
import { getAllParties, type Party } from "@/lib/api/parties";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

// Using Party type from API

export default function CreateReturnPage() {
  const router = useRouter();
  const [invoiceAgainst, setInvoiceAgainst] = useState("");
  const [amount, setAmount] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [returnedBy, setReturnedBy] = useState("");
  const [users, setUsers] = useState<Party[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const parties = await getAllParties();
        setUsers(parties);
      } catch (error) {
        console.error('Error fetching parties:', error);
        toast({
          title: "Error",
          description: "Failed to fetch parties",
          variant: "destructive",
        });
      }
    };

    fetchUsers();
  }, []);

  const handleSaveReturn = async (shouldRedirect: boolean = true) => {
    try {
      if (!invoiceAgainst || !amount || !invoiceNumber || !returnedBy) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please fill in all required fields"
        });
        return;
      }

      setIsSubmitting(true);

      const payload = {
        description: invoiceAgainst,
        amount: parseFloat(amount),
        invoiceNumber,
        returnedBy,
      };

      const response = await axiosInstance.post('/returns', payload);

      if (response.status === 201) {
        toast({
          title: "Success",
          description: "Return saved successfully!",
          variant: "default",
        });

        if (shouldRedirect) {
          router.push('/returns');
        } else {
          // Reset form for "Save and Add New"
          setInvoiceAgainst("");
          setAmount("");
          setInvoiceNumber("");
          setReturnedBy("");
        }
      }
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.message || "Failed to save return. Please try again.";
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
        <h1 className="text-2xl font-bold">Create Return</h1>
        
        <Card className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Invoice Against <span className="text-red-500">*</span>
              </label>
              <Input 
                placeholder="Eg: 0056, 0791" 
                value={invoiceAgainst}
                onChange={(e) => setInvoiceAgainst(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the invoice numbers this return is against
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Credit Note Number <span className="text-red-500">*</span>
              </label>
              <Input 
                placeholder="Enter Credit Note Number" 
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Returned By <span className="text-red-500">*</span>
              </label>
              <Select value={returnedBy} onValueChange={setReturnedBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Select User" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user._id} value={user._id}>
                      {user.name} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Amount <span className="text-red-500">*</span>
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
                />
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total Return Amount:</span>
              <span className="text-xl font-bold">
                NPR {amount ? parseFloat(amount).toLocaleString() : "0"}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <Button 
              variant="outline" 
              disabled={isSubmitting}
              onClick={() => handleSaveReturn(false)}
            >
              Save and Add New
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              disabled={isSubmitting}
              onClick={() => handleSaveReturn(true)}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : (
                "Save Return"
              )}
            </Button>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This return entry will generate a credit note against the specified invoice(s). 
              Ensure all details are accurate before saving.
            </p>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
} 