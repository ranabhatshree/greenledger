"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { uploadBulkSalesCSV, CSVUploadResponse } from "@/lib/api/bulkSales";
import { Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface BulkSalesUploadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkSalesUploadModal({
  open,
  onClose,
  onSuccess,
}: BulkSalesUploadModalProps) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<CSVUploadResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith(".csv")) {
        toast({
          title: "Invalid File Type",
          description: "Please select a CSV file",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV file to upload",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const result = await uploadBulkSalesCSV(file);
      setUploadResult(result);
      
      if (result.summary.errors === 0 && result.summary.duplicates === 0) {
        toast({
          title: "Success",
          description: `Successfully uploaded ${result.summary.created} bulk sales`,
        });
        // Reset and close after a delay
        setTimeout(() => {
          handleClose();
          onSuccess();
        }, 3000);
      } else {
        toast({
          title: "Upload Completed with Issues",
          description: `Created: ${result.summary.created}, Errors: ${result.summary.errors}, Duplicates: ${result.summary.duplicates}`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.response?.data?.message || "Failed to upload CSV file",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Bulk Sales CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to create multiple bulk sales entries at once
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!uploadResult ? (
            <>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="space-y-2">
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-sm font-medium text-gray-700">
                      {file ? file.name : "Click to select CSV file"}
                    </span>
                  </Label>
                  <Input
                    id="file-upload"
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500">
                    CSV format: invoiceNumber,totalAmount,invoiceDate
                  </p>
                </div>
              </div>

              {file && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <FileText className="h-5 w-5 text-gray-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Upload Complete</AlertTitle>
                <AlertDescription>
                  {uploadResult.message}
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="text-2xl font-bold text-green-600">
                    {uploadResult.summary.created}
                  </p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-600">Errors</p>
                  <p className="text-2xl font-bold text-red-600">
                    {uploadResult.summary.errors}
                  </p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-gray-600">Duplicates</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {uploadResult.summary.duplicates}
                  </p>
                </div>
              </div>

              {uploadResult.errorDetails.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Error Details:</h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {uploadResult.errorDetails.slice(0, 10).map((error, index) => (
                      <Alert key={index} variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          Row {error.row}: {error.error} (Invoice: {error.invoiceNumber})
                        </AlertDescription>
                      </Alert>
                    ))}
                    {uploadResult.errorDetails.length > 10 && (
                      <p className="text-xs text-gray-500">
                        ... and {uploadResult.errorDetails.length - 10} more errors
                      </p>
                    )}
                  </div>
                </div>
              )}

              {uploadResult.duplicateDetails.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Duplicate Invoice Numbers:</h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {uploadResult.duplicateDetails.slice(0, 10).map((dup, index) => (
                      <Alert key={index}>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          Row {dup.row}: Invoice {dup.invoiceNumber} already exists
                        </AlertDescription>
                      </Alert>
                    ))}
                    {uploadResult.duplicateDetails.length > 10 && (
                      <p className="text-xs text-gray-500">
                        ... and {uploadResult.duplicateDetails.length - 10} more duplicates
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {uploadResult ? (
            <Button onClick={handleClose}>Close</Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleUpload}
                disabled={!file || loading}
              >
                {loading ? "Uploading..." : "Upload"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

