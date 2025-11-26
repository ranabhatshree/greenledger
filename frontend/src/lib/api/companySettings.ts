import axiosInstance from './axiosInstance';

export interface Company {
  _id: string;
  companyName: string;
  companyType?: string;
  ownerId: string;
  registrationNumber?: string;
  address: string;
  currency: string;
  timezone: string;
  fiscalYearStartMonth: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateCompanyData {
  companyName?: string;
  companyType?: string;
  registrationNumber?: string;
  address?: string;
  currency?: string;
  timezone?: string;
  fiscalYearStartMonth?: string;
  logoUrl?: string;
}

export interface CompanyResponse {
  company: Company;
}

export const getCompanySettings = async (): Promise<CompanyResponse> => {
  const response = await axiosInstance.get<CompanyResponse>('/company-settings');
  return response.data;
};

export const updateCompanySettings = async (data: UpdateCompanyData): Promise<CompanyResponse> => {
  const response = await axiosInstance.put<CompanyResponse>('/company-settings', data);
  return response.data;
};

export const uploadCompanyLogo = async (file: File): Promise<{ logoUrl: string }> => {
  const formData = new FormData();
  formData.append('logo', file);
  
  const response = await axiosInstance.post<{ logoUrl: string; message: string }>('/company-settings/upload-logo', formData);
  
  // Convert relative URL to absolute URL if needed
  const logoUrl = response.data.logoUrl.startsWith('http') 
    ? response.data.logoUrl 
    : `${process.env.NEXT_PUBLIC_API_BASE_URL}${response.data.logoUrl}`;
  
  return { logoUrl };
};

