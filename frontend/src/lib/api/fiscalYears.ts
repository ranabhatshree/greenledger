import axiosInstance from './axiosInstance';

export interface FiscalYear {
  _id: string;
  companyId: string;
  title: string;
  shortDescription?: string;
  fromDate: string;
  toDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFiscalYearData {
  title: string;
  shortDescription?: string;
  fromDate: string;
  toDate: string;
  isActive?: boolean;
}

export interface UpdateFiscalYearData extends Partial<CreateFiscalYearData> {}

export const getFiscalYears = async (): Promise<FiscalYear[]> => {
  const response = await axiosInstance.get<{ fiscalYears: FiscalYear[] }>('/fiscal-years');
  return response.data.fiscalYears;
};

export const getActiveFiscalYear = async (): Promise<FiscalYear | null> => {
  try {
    const response = await axiosInstance.get<{ fiscalYear: FiscalYear }>('/fiscal-years/active');
    return response.data.fiscalYear;
  } catch {
    return null;
  }
};

export const createFiscalYear = async (data: CreateFiscalYearData): Promise<FiscalYear> => {
  const response = await axiosInstance.post<{ fiscalYear: FiscalYear }>('/fiscal-years', data);
  return response.data.fiscalYear;
};

export const updateFiscalYear = async (id: string, data: UpdateFiscalYearData): Promise<FiscalYear> => {
  const response = await axiosInstance.put<{ fiscalYear: FiscalYear }>(`/fiscal-years/${id}`, data);
  return response.data.fiscalYear;
};

export const deleteFiscalYear = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/fiscal-years/${id}`);
};
