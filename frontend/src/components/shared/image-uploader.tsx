"use client";

import { Image as ImageIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import axiosInstance from "@/lib/api/axiosInstance";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export interface UploadedImage {
  filePath: string;
  originalName: string;
}

interface ImageUploaderProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  className?: string;
}

export const ImageUploader = ({
  images,
  onImagesChange,
  className
}: ImageUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    const file = e.target.files[0];
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axiosInstance.post('/helper/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const { fileDetails } = response.data;
      
      onImagesChange([
        ...images,
        {
          filePath: fileDetails.filePath,
          originalName: fileDetails.originalName,
        },
      ]);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error uploading image"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-2">Attach Images</label>
      <div 
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer",
          isUploading && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => !isUploading && document.getElementById('file-upload')?.click()}
      >
        <input
          id="file-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
          disabled={isUploading}
        />
        {isUploading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-500">Uploading...</span>
          </div>
        ) : (
          <>
            <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500">
              Click to upload an image
            </p>
          </>
        )}
      </div>
      {images.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative w-20 h-20">
              <img
                src={image.filePath}
                alt={image.originalName}
                className="w-full h-full object-cover rounded"
              />
              <button
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                onClick={() => handleRemoveImage(index)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 