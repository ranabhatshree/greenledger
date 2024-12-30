"use client";

import { useState } from "react";
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
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/api/axiosInstance";
import { useToast } from "@/hooks/use-toast";

interface PartyFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  panNumber: string;
  role: "vendor" | "supplier";
  partyMargin: number;
}

export default function CreatePartyPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState<PartyFormData>({
    name: "",
    email: "",
    phone: "",
    address: "",
    panNumber: "",
    role: "vendor",
    partyMargin: 12,
  });

  const [partyType, setPartyType] = useState<"vendor" | "supplier">("vendor");
  const [taxType, setTaxType] = useState<"VAT" | "PAN">("VAT");

  const handleInputChange = (field: keyof PartyFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      role: partyType // Update role when party type changes
    }));
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);

      // Basic validation
      if (!formData.name || !formData.phone) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Name and phone are required fields",
        });
        return;
      }

      const response = await axiosInstance.post("/auth/add-party", formData);

      if (response.status !== 201) {
        throw new Error("Failed to create party: " + response.data.message);
      }

      toast({
        title: "Success",
        description: "Party created successfully",
      });

      router.push("/parties"); // Redirect to parties list
      router.refresh();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Something went wrong"; // Extract error message
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage, // Show the extracted error message
      });
    } finally { 
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold">Create New Party</h1>
        
        <Card className="p-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Party Type</label>
              <Select 
                value={partyType} 
                onValueChange={(value: "vendor" | "supplier") => {
                  setPartyType(value);
                  handleInputChange("role", value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select party type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vendor">Vendor</SelectItem>
                  <SelectItem value="supplier">Supplier</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Party Name</label>
              <Input 
                placeholder="Enter party name" 
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input 
                type="email" 
                placeholder="Enter email address" 
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Contact Number</label>
              <Input 
                placeholder="Enter contact number" 
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
              />
            </div>

            <div className="">
              <label className="block text-sm font-medium mb-2">Address</label>
              <Input 
                className="w-full"
                placeholder="Enter address" 
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
              />
            </div>
            <div className="">
              <label className="block text-sm font-medium mb-2">Party Margin</label>
              <Input 
                type="number"
                placeholder="Enter party margin" 
                value={formData.partyMargin}
                onChange={(e) => handleInputChange("partyMargin", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tax Type</label>
              <Select 
                value={taxType} 
                onValueChange={(value: "VAT" | "PAN") => setTaxType(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tax type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VAT">VAT</SelectItem>
                  <SelectItem value="PAN">PAN</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {taxType === "VAT" ? "VAT Number" : "PAN Number"}
              </label>
              <Input 
                placeholder={`Enter ${taxType === "VAT" ? "VAT" : "PAN"} number`}
                value={formData.panNumber}
                onChange={(e) => handleInputChange("panNumber", e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <Button 
              variant="outline" 
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Create Party"}
            </Button>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
} 