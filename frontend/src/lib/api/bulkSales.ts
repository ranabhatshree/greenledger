import axiosInstance from './axiosInstance';

export interface BulkSale {
  _id: string;
  invoiceNumber: string;
  companyId: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  invoiceDate: string;
  totalAmount: number;
  uploadedByCSVRef: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBulkSaleData {
  invoiceNumber: string;
  invoiceDate: string;
  totalAmount: number;
  notes?: string;
}

export interface UpdateBulkSaleData extends Partial<CreateBulkSaleData> {}

export interface BulkSalesResponse {
  bulkSales: BulkSale[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface BulkSaleResponse {
  bulkSale: BulkSale;
}

export interface CSVUploadResponse {
  message: string;
  fileUpload: {
    _id: string;
    originalFilename: string;
    storedFilename: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    uploadedBy: string;
    companyId: string;
    uploadType: string;
    recordCount: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    errorMessage: string | null;
    createdAt: string;
    updatedAt: string;
  };
  summary: {
    totalRows: number;
    created: number;
    errors: number;
    duplicates: number;
  };
  createdBulkSales: BulkSale[];
  errorDetails: Array<{
    row: number;
    invoiceNumber: string;
    error: string;
  }>;
  duplicateDetails: Array<{
    row: number;
    invoiceNumber: string;
    existingId: string;
  }>;
}

// Get all bulk sales with optional filtering
export const getBulkSales = async (params?: {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
  invoiceNumber?: string;
  uploadedByCSVRef?: string;
}): Promise<BulkSalesResponse> => {
  const response = await axiosInstance.get<BulkSalesResponse>('/bulk-sales', { params });
  return response.data;
};

// Get bulk sale by ID
export const getBulkSaleById = async (id: string): Promise<BulkSaleResponse> => {
  const response = await axiosInstance.get<BulkSaleResponse>(`/bulk-sales/${id}`);
  return response.data;
};

// Create a new bulk sale (manual entry)
export const createBulkSale = async (data: CreateBulkSaleData): Promise<BulkSaleResponse> => {
  const response = await axiosInstance.post<BulkSaleResponse>('/bulk-sales', data);
  return response.data;
};

// Update a bulk sale
export const updateBulkSale = async (id: string, data: UpdateBulkSaleData): Promise<BulkSaleResponse> => {
  const response = await axiosInstance.put<BulkSaleResponse>(`/bulk-sales/${id}`, data);
  return response.data;
};

// Delete a bulk sale
export const deleteBulkSale = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/bulk-sales/${id}`);
};

// Upload CSV file
export const uploadBulkSalesCSV = async (file: File): Promise<CSVUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await axiosInstance.post<CSVUploadResponse>('/bulk-sales/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

