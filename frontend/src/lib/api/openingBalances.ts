import axiosInstance from './axiosInstance';

export interface OpeningBalance {
  _id?: string;
  companyId?: string;
  partyId?: string;
  fiscalYearId?: string;
  amount: number;
  type: 'CR' | 'DR';
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOpeningBalanceData {
  partyId: string;
  fiscalYearId: string;
  amount: number;
  type: 'CR' | 'DR';
}

export interface UpdateOpeningBalanceData {
  amount?: number;
  type?: 'CR' | 'DR';
}

export const getOpeningBalances = async (params?: {
  partyId?: string;
  fiscalYearId?: string;
}): Promise<OpeningBalance[]> => {
  const response = await axiosInstance.get<{ openingBalances: OpeningBalance[] }>(
    '/opening-balances',
    { params }
  );
  return response.data.openingBalances;
};

export const getOpeningBalance = async (
  partyId: string,
  fiscalYearId: string
): Promise<OpeningBalance> => {
  const response = await axiosInstance.get<{ openingBalance: OpeningBalance }>(
    `/opening-balances/${partyId}/${fiscalYearId}`
  );
  return response.data.openingBalance;
};

export const createOpeningBalance = async (
  data: CreateOpeningBalanceData
): Promise<OpeningBalance> => {
  const response = await axiosInstance.post<{ openingBalance: OpeningBalance }>(
    '/opening-balances',
    data
  );
  return response.data.openingBalance;
};

export const updateOpeningBalance = async (
  id: string,
  data: UpdateOpeningBalanceData
): Promise<OpeningBalance> => {
  const response = await axiosInstance.put<{ openingBalance: OpeningBalance }>(
    `/opening-balances/${id}`,
    data
  );
  return response.data.openingBalance;
};

export const deleteOpeningBalance = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/opening-balances/${id}`);
};
