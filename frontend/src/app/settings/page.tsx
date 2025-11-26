"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader } from "@/components/ui/loader";
import { getCompanySettings, updateCompanySettings, uploadCompanyLogo, type UpdateCompanyData } from "@/lib/api/companySettings";
import { useToast } from "@/hooks/use-toast";
import { Upload, X } from "lucide-react";

const CURRENCIES = ['NPR', 'USD', 'EUR', 'GBP', 'INR'];
const TIMEZONES = [
  { value: 'Asia/Kathmandu', label: 'Asia/Kathmandu (Nepal)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'America/New_York (EST)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST)' },
  { value: 'Europe/London', label: 'Europe/London (GMT)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST)' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
];
const FISCAL_YEAR_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function SettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  
  const [formData, setFormData] = useState<UpdateCompanyData>({
    companyName: "",
    companyType: "",
    registrationNumber: "",
    address: "",
    currency: "NPR",
    timezone: "Asia/Kathmandu",
    fiscalYearStartMonth: "April",
    logoUrl: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsFetching(true);
        const response = await getCompanySettings();
        const company = response.company;
        
        setFormData({
          companyName: company.companyName || "",
          companyType: company.companyType || "",
          registrationNumber: company.registrationNumber || "",
          address: company.address || "",
          currency: company.currency || "NPR",
          timezone: company.timezone || "Asia/Kathmandu",
          fiscalYearStartMonth: company.fiscalYearStartMonth || "April",
          logoUrl: company.logoUrl || "",
        });
        // Set logo preview URL
        if (company.logoUrl) {
          const logoUrl = company.logoUrl.startsWith('http') 
            ? company.logoUrl 
            : `${process.env.NEXT_PUBLIC_BASE_URL}${company.logoUrl}`;
          setLogoPreview(logoUrl);
          console.log('Logo URL loaded:', logoUrl);
        } else {
          setLogoPreview("");
        }
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.response?.data?.message || "Failed to load company settings",
        });
      } finally {
        setIsFetching(false);
      }
    };

    fetchSettings();
  }, [toast]);

  const handleInputChange = (field: keyof UpdateCompanyData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('File selected:', file);
    
    if (!file) {
      console.log('No file selected');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Invalid File",
        description: "Please select an image file (JPG, PNG, GIF)",
      });
      // Reset input
      e.target.value = '';
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File Too Large",
        description: "Image must be less than 5MB",
      });
      // Reset input
      e.target.value = '';
      return;
    }

    console.log('File validated:', file.name, file.size, file.type);
    setLogoFile(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
      console.log('Preview set');
    };
    reader.onerror = () => {
      console.error('Error reading file');
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to read image file",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleUploadLogo = async () => {
    if (!logoFile) {
      toast({
        variant: "destructive",
        title: "No File Selected",
        description: "Please select an image file first",
      });
      return;
    }

    try {
      setIsUploadingLogo(true);
      console.log('Uploading logo file:', logoFile.name, logoFile.size, logoFile.type);
      const result = await uploadCompanyLogo(logoFile);
      console.log('Upload result:', result);
      
      // Refresh company settings to get the updated logo URL
      const response = await getCompanySettings();
      const company = response.company;
      
      // Update form data with the new logo URL
      const newLogoUrl = company.logoUrl || result.logoUrl;
      setFormData(prev => ({ ...prev, logoUrl: newLogoUrl }));
      
      // Update preview to show the uploaded logo
      const logoPreviewUrl = newLogoUrl 
        ? (newLogoUrl.startsWith('http') ? newLogoUrl : `${process.env.NEXT_PUBLIC_BASE_URL}${newLogoUrl}`)
        : "";
      setLogoPreview(logoPreviewUrl);
      console.log('Logo preview URL set to:', logoPreviewUrl);
      
      // Clear the file selection
      setLogoFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('logoUpload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
      toast({
        title: "Success",
        description: "Company logo uploaded successfully",
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to upload logo";
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    const logoUrl = formData.logoUrl || "";
    const logoPreviewUrl = logoUrl 
      ? (logoUrl.startsWith('http') ? logoUrl : `${process.env.NEXT_PUBLIC_API_BASE_URL}${logoUrl}`)
      : "";
    setLogoPreview(logoPreviewUrl);
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);

      // Validation
      if (!formData.companyName || !formData.address) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Company name and address are required fields",
        });
        return;
      }

      await updateCompanySettings(formData);

      toast({
        title: "Success",
        description: "Company settings updated successfully",
      });
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

  if (isFetching) return <Loader />;

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold">Company Settings</h1>
        
        <Card className="p-6">
          <div className="mb-6 pb-6 border-b">
            <Label className="block text-sm font-medium mb-2">Company Logo</Label>
            <div className="flex items-center gap-4">
              {(logoPreview || formData.logoUrl) && (
                <div className="relative">
                  <div className="w-32 h-32 border rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                    {(() => {
                      // Determine the image source URL
                      let imageSrc = logoPreview;
                      if (!imageSrc && formData.logoUrl) {
                        imageSrc = formData.logoUrl.startsWith('http') 
                          ? formData.logoUrl 
                          : `${process.env.NEXT_PUBLIC_API_BASE_URL}${formData.logoUrl}`;
                      }
                      console.log('Rendering logo with src:', imageSrc, 'logoPreview:', logoPreview, 'formData.logoUrl:', formData.logoUrl);
                      return imageSrc ? (
                        <img
                          key={imageSrc} // Force re-render when URL changes
                          src={imageSrc}
                          alt="Company Logo"
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            console.error('Image load error for:', e.currentTarget.src);
                            console.error('FormData logoUrl:', formData.logoUrl);
                            console.error('LogoPreview:', logoPreview);
                            console.error('API Base URL:', process.env.NEXT_PUBLIC_API_BASE_URL);
                          }}
                          onLoad={() => {
                            console.log('Logo image loaded successfully from:', imageSrc);
                          }}
                        />
                      ) : null;
                    })()}
                  </div>
                  {logoFile && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex items-center gap-2"
                    disabled={isUploadingLogo}
                    onClick={() => {
                      const input = document.getElementById('logoUpload') as HTMLInputElement;
                      if (input) {
                        input.click();
                      }
                    }}
                  >
                    <Upload className="h-4 w-4" />
                    {logoFile ? "Change Logo" : "Upload Logo"}
                  </Button>
                  {logoFile && (
                    <Button
                      type="button"
                      onClick={handleUploadLogo}
                      disabled={isUploadingLogo}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isUploadingLogo ? "Uploading..." : "Save Logo"}
                    </Button>
                  )}
                </div>
                <input
                  id="logoUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <p className="text-xs text-gray-500">Max file size: 5MB. Supported formats: JPG, PNG, GIF</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label htmlFor="companyName" className="block text-sm font-medium mb-2">Company Name *</Label>
              <Input 
                id="companyName"
                placeholder="Enter company name" 
                value={formData.companyName}
                onChange={(e) => handleInputChange("companyName", e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="companyType" className="block text-sm font-medium mb-2">Company Type</Label>
              <Input 
                id="companyType"
                placeholder="e.g., Retail, Services, Manufacturing" 
                value={formData.companyType}
                onChange={(e) => handleInputChange("companyType", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="registrationNumber" className="block text-sm font-medium mb-2">Registration Number</Label>
              <Input 
                id="registrationNumber"
                placeholder="Enter registration number" 
                value={formData.registrationNumber}
                onChange={(e) => handleInputChange("registrationNumber", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="currency" className="block text-sm font-medium mb-2">Currency</Label>
              <Select 
                value={formData.currency} 
                onValueChange={(value) => handleInputChange("currency", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(currency => (
                    <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="timezone" className="block text-sm font-medium mb-2">Timezone</Label>
              <Select 
                value={formData.timezone} 
                onValueChange={(value) => handleInputChange("timezone", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map(tz => (
                    <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="fiscalYearStartMonth" className="block text-sm font-medium mb-2">Fiscal Year Start Month</Label>
              <Select 
                value={formData.fiscalYearStartMonth} 
                onValueChange={(value) => handleInputChange("fiscalYearStartMonth", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {FISCAL_YEAR_MONTHS.map(month => (
                    <SelectItem key={month} value={month}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label htmlFor="address" className="block text-sm font-medium mb-2">Address *</Label>
              <Input 
                id="address"
                placeholder="Enter company address" 
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                required
              />
            </div>

          </div>

          <div className="flex justify-end gap-4 mt-6">
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
