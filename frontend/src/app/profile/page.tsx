"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader } from "@/components/ui/loader";
import { getProfile, updateProfile, uploadProfilePicture, type UpdateProfileData } from "@/lib/api/userProfile";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, X } from "lucide-react";

export default function ProfilePage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  
  const [formData, setFormData] = useState<UpdateProfileData>({
    name: "",
    email: "",
    phone: "",
    address: "",
    panNumber: "",
    profilePicture: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    password: "",
    confirmPassword: "",
  });
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>("");
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsFetching(true);
        const response = await getProfile();
        const user = response.user;
        
        setFormData({
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          address: user.address || "",
          panNumber: user.panNumber || "",
          profilePicture: user.profilePicture || "",
        });
        const profilePic = user.profilePicture 
          ? (user.profilePicture.startsWith('http') ? user.profilePicture : `${process.env.NEXT_PUBLIC_BASE_URL}${user.profilePicture}`)
          : "";
        setProfilePicturePreview(profilePic);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.response?.data?.message || "Failed to load profile",
        });
      } finally {
        setIsFetching(false);
      }
    };

    fetchProfile();
  }, [toast]);

  const handleInputChange = (field: keyof UpdateProfileData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setProfilePictureFile(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePicturePreview(reader.result as string);
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

  const handleUploadProfilePicture = async () => {
    if (!profilePictureFile) {
      toast({
        variant: "destructive",
        title: "No File Selected",
        description: "Please select an image file first",
      });
      return;
    }

    try {
      setIsUploadingPicture(true);
      console.log('Uploading profile picture file:', profilePictureFile.name, profilePictureFile.size, profilePictureFile.type);
      const result = await uploadProfilePicture(profilePictureFile);
      console.log('Upload result:', result);
      
      // Update form data with the new profile picture URL
      const newProfilePicture = result.profilePicture;
      setFormData(prev => ({ ...prev, profilePicture: newProfilePicture }));
      
      // Update preview to show the uploaded picture
      const picturePreviewUrl = newProfilePicture.startsWith('http') 
        ? newProfilePicture 
        : `${process.env.NEXT_PUBLIC_BASE_URL}${newProfilePicture}`;
      setProfilePicturePreview(picturePreviewUrl);
      
      // Clear the file selection
      setProfilePictureFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('profilePictureUpload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
      toast({
        title: "Success",
        description: "Profile picture uploaded successfully",
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to upload profile picture";
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsUploadingPicture(false);
    }
  };

  const handleRemoveProfilePicture = () => {
    setProfilePictureFile(null);
    const profilePic = formData.profilePicture 
      ? (formData.profilePicture.startsWith('http') ? formData.profilePicture : `${process.env.NEXT_PUBLIC_API_BASE_URL}${formData.profilePicture}`)
      : "";
    setProfilePicturePreview(profilePic);
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);

      // Validation
      if (!formData.name || !formData.email) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Name and email are required fields",
        });
        return;
      }

      // If password fields are shown, validate password change
      if (showPasswordFields) {
        if (!passwordData.currentPassword || !passwordData.password) {
          toast({
            variant: "destructive",
            title: "Validation Error",
            description: "Current password and new password are required",
          });
          return;
        }

        if (passwordData.password !== passwordData.confirmPassword) {
          toast({
            variant: "destructive",
            title: "Validation Error",
            description: "New password and confirm password do not match",
          });
          return;
        }

        if (passwordData.password.length < 6) {
          toast({
            variant: "destructive",
            title: "Validation Error",
            description: "Password must be at least 6 characters long",
          });
          return;
        }

        formData.password = passwordData.password;
        formData.currentPassword = passwordData.currentPassword;
      }

      await updateProfile(formData);

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      // Reset password fields if password was changed
      if (showPasswordFields) {
        setPasswordData({
          currentPassword: "",
          password: "",
          confirmPassword: "",
        });
        setShowPasswordFields(false);
      }
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
        <h1 className="text-2xl font-bold">My Profile</h1>
        
        <Card className="p-6">
          <div className="flex items-center gap-6 mb-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profilePicturePreview || formData.profilePicture} alt={formData.name} />
                <AvatarFallback className="text-2xl">
                  {formData.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              {profilePictureFile && (
                <button
                  type="button"
                  onClick={handleRemoveProfilePicture}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{formData.name}</h2>
              <p className="text-gray-600">{formData.email}</p>
              <div className="mt-4 flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  disabled={isUploadingPicture}
                  onClick={() => {
                    const input = document.getElementById('profilePictureUpload') as HTMLInputElement;
                    if (input) {
                      input.click();
                    }
                  }}
                >
                  <Upload className="h-4 w-4" />
                  {profilePictureFile ? "Change Picture" : "Upload Picture"}
                </Button>
                <input
                  id="profilePictureUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="hidden"
                />
                {profilePictureFile && (
                  <Button
                    type="button"
                    onClick={handleUploadProfilePicture}
                    size="sm"
                    disabled={isUploadingPicture}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isUploadingPicture ? "Uploading..." : "Save Picture"}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name" className="block text-sm font-medium mb-2">Full Name *</Label>
              <Input 
                id="name"
                placeholder="Enter your full name" 
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="email" className="block text-sm font-medium mb-2">Email *</Label>
              <Input 
                id="email"
                type="email"
                placeholder="Enter your email" 
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="phone" className="block text-sm font-medium mb-2">Phone</Label>
              <Input 
                id="phone"
                placeholder="Enter your phone number" 
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="panNumber" className="block text-sm font-medium mb-2">PAN Number</Label>
              <Input 
                id="panNumber"
                placeholder="Enter PAN number" 
                value={formData.panNumber}
                onChange={(e) => handleInputChange("panNumber", e.target.value)}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="address" className="block text-sm font-medium mb-2">Address</Label>
              <Input 
                id="address"
                placeholder="Enter your address" 
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
              />
            </div>


            <div className="col-span-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPasswordFields(!showPasswordFields)}
              >
                {showPasswordFields ? "Hide Password Change" : "Change Password"}
              </Button>
            </div>

            {showPasswordFields && (
              <>
                <div>
                  <Label htmlFor="currentPassword" className="block text-sm font-medium mb-2">Current Password *</Label>
                  <Input 
                    id="currentPassword"
                    type="password"
                    placeholder="Enter current password" 
                    value={passwordData.currentPassword}
                    onChange={(e) => handlePasswordChange("currentPassword", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="block text-sm font-medium mb-2">New Password *</Label>
                  <Input 
                    id="password"
                    type="password"
                    placeholder="Enter new password" 
                    value={passwordData.password}
                    onChange={(e) => handlePasswordChange("password", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">Confirm New Password *</Label>
                  <Input 
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password" 
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}

