import axiosInstance from './axiosInstance';

export interface ExpenseDetail {
  title: string;
  amount: number;
}

export interface Import {
  _id: string;
  invoiceNumber: string;
  amountUSD: number;
  amount: number;
  billPhotos: string[];
  driveLink?: string;
  invoiceDate: string;
  companyId: {
    _id: string;
    name: string;
  };
  createdBy: {
    _id: string;
    name: string;
    email?: string;
  };
  supplierName: string;
  supplierAddress: string;
  description: string;
  note?: string;
  expenseDetails?: ExpenseDetail[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateImportData {
  invoiceNumber: string;
  amountUSD: number;
  amount: number;
  billPhotos?: string[];
  driveLink?: string;
  invoiceDate: string;
  supplierName: string;
  supplierAddress: string;
  description: string;
  note?: string;
  expenseDetails?: ExpenseDetail[];
}

export interface UpdateImportData extends Partial<CreateImportData> {}

export interface ImportsResponse {
  imports: Import[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ImportResponse {
  import: Import;
}

// Get all imports with optional filtering
export const getImports = async (params?: {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
  invoiceNumber?: string;
  supplierName?: string;
}): Promise<ImportsResponse> => {
  const response = await axiosInstance.get<ImportsResponse>('/imports', { params });
  return response.data;
};

// Get import by ID
export const getImportById = async (id: string): Promise<ImportResponse> => {
  const response = await axiosInstance.get<ImportResponse>(`/imports/${id}`);
  return response.data;
};

// Create a new import
export const createImport = async (data: CreateImportData, files?: File[]): Promise<ImportResponse> => {
  // If files are provided, use FormData; otherwise use JSON
  if (files && files.length > 0) {
    const formData = new FormData();
    
    // Append all fields to formData
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'billPhotos' && Array.isArray(value)) {
          // billPhotos URLs will be appended separately if needed
          value.forEach((url) => {
            formData.append('billPhotos', url);
          });
        } else if (key === 'expenseDetails' && Array.isArray(value)) {
          // expenseDetails needs to be sent as JSON string
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    // Append files
    files.forEach((file) => {
      formData.append('billPhotos', file);
    });

    const response = await axiosInstance.post<ImportResponse>('/imports', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } else {
    // No files, send as JSON
    const response = await axiosInstance.post<ImportResponse>('/imports', data);
    return response.data;
  }
};

// Update an import
export const updateImport = async (id: string, data: UpdateImportData, files?: File[]): Promise<ImportResponse> => {
  const formData = new FormData();
  
  // Append all fields to formData
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (key === 'billPhotos' && Array.isArray(value)) {
        // If billPhotos is an array of URLs, append each one
        value.forEach((url) => {
          formData.append('billPhotos', url);
        });
      } else if (key === 'expenseDetails' && Array.isArray(value)) {
        // expenseDetails needs to be sent as JSON string
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value.toString());
      }
    }
  });

  // Append new files if provided
  if (files && files.length > 0) {
    files.forEach((file) => {
      formData.append('billPhotos', file);
    });
  }

  const response = await axiosInstance.put<ImportResponse>(`/imports/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Delete an import
export const deleteImport = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/imports/${id}`);
};

