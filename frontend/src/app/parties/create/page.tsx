"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { createParty, type CreatePartyData } from "@/lib/api/parties";
import { useToast } from "@/hooks/use-toast";

interface PartyFormData extends CreatePartyData {
  name: string;
  phone: string;
  altPhone?: string;
  contactPerson?: string;
  email?: string;
  address: string;
  panNumber: string;
  isVatable: boolean;
  partyMargin: number;
  closingBalance: number;
  website?: string;
  role: "vendor" | "supplier";
}

export default function CreatePartyPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState<PartyFormData>({
    name: "",
    phone: "",
    altPhone: "",
    contactPerson: "",
    email: "",
    address: "",
    panNumber: "",
    isVatable: true,
    partyMargin: 0,
    closingBalance: 0,
    website: "",
    role: "vendor",
  });

  const handleInputChange = (field: keyof PartyFormData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);

      // Validation
      if (!formData.name || !formData.phone || !formData.address || !formData.panNumber) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Name, phone, address, and PAN number are required fields",
        });
        return;
      }

      // Prepare data for API (remove empty optional fields)
      const partyData: CreatePartyData = {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        panNumber: formData.panNumber,
        role: formData.role,
        isVatable: formData.isVatable,
        partyMargin: formData.partyMargin || 0,
        closingBalance: formData.closingBalance || 0,
      };

      // Add optional fields only if they have values
      if (formData.altPhone) partyData.altPhone = formData.altPhone;
      if (formData.contactPerson) partyData.contactPerson = formData.contactPerson;
      if (formData.email) partyData.email = formData.email;
      if (formData.website) partyData.website = formData.website;

      await createParty(partyData);

      toast({
        title: "Success",
        description: "Party created successfully",
      });

      router.push("/parties");
      router.refresh();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Something went wrong";
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
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
              <Label htmlFor="role" className="block text-sm font-medium mb-2">Party Type *</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value: "vendor" | "supplier") => {
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
              <Label htmlFor="name" className="block text-sm font-medium mb-2">Party Name *</Label>
              <Input 
                id="name"
                placeholder="Enter party name" 
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="phone" className="block text-sm font-medium mb-2">Phone Number *</Label>
              <Input 
                id="phone"
                placeholder="Enter phone number" 
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="altPhone" className="block text-sm font-medium mb-2">Alternate Phone</Label>
              <Input 
                id="altPhone"
                placeholder="Enter alternate phone number" 
                value={formData.altPhone}
                onChange={(e) => handleInputChange("altPhone", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="contactPerson" className="block text-sm font-medium mb-2">Contact Person</Label>
              <Input 
                id="contactPerson"
                placeholder="Enter contact person name" 
                value={formData.contactPerson}
                onChange={(e) => handleInputChange("contactPerson", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="email" className="block text-sm font-medium mb-2">Email</Label>
              <Input 
                id="email"
                type="email" 
                placeholder="Enter email address" 
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="address" className="block text-sm font-medium mb-2">Address *</Label>
              <Input 
                id="address"
                placeholder="Enter address" 
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="panNumber" className="block text-sm font-medium mb-2">PAN Number *</Label>
              <Input 
                id="panNumber"
                placeholder="Enter PAN number" 
                value={formData.panNumber}
                onChange={(e) => handleInputChange("panNumber", e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="website" className="block text-sm font-medium mb-2">Website</Label>
              <Input 
                id="website"
                type="url"
                placeholder="Enter website URL" 
                value={formData.website}
                onChange={(e) => handleInputChange("website", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="partyMargin" className="block text-sm font-medium mb-2">Party Margin (%)</Label>
              <Input 
                id="partyMargin"
                type="number"
                step="0.01"
                placeholder="Enter party margin" 
                value={formData.partyMargin}
                onChange={(e) => handleInputChange("partyMargin", parseFloat(e.target.value) || 0)}
              />
            </div>

            <div>
              <Label htmlFor="closingBalance" className="block text-sm font-medium mb-2">Closing Balance (NPR)</Label>
              <Input 
                id="closingBalance"
                type="number"
                step="0.01"
                placeholder="Enter closing balance" 
                value={formData.closingBalance}
                onChange={(e) => handleInputChange("closingBalance", parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="col-span-2 flex items-center space-x-2">
              <Checkbox 
                id="isVatable"
                checked={formData.isVatable}
                onCheckedChange={(checked) => handleInputChange("isVatable", checked === true)}
              />
              <Label htmlFor="isVatable" className="text-sm font-medium cursor-pointer">
                Is VATable
              </Label>
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