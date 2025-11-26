import axiosInstance from './axiosInstance';

export interface Party {
  _id: string;
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
  role: 'vendor' | 'supplier';
  companyId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePartyData {
  name: string;
  phone: string;
  altPhone?: string;
  contactPerson?: string;
  email?: string;
  address: string;
  panNumber: string;
  isVatable?: boolean;
  partyMargin?: number;
  closingBalance?: number;
  website?: string;
  role: 'vendor' | 'supplier';
}

export interface UpdatePartyData extends Partial<CreatePartyData> {}

export interface PartiesResponse {
  parties: Party[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PartyResponse {
  party: Party;
}

// Get all parties with optional filtering
export const getParties = async (params?: {
  page?: number;
  limit?: number;
  role?: 'vendor' | 'supplier';
  search?: string;
}): Promise<PartiesResponse> => {
  const response = await axiosInstance.get<PartiesResponse>('/parties', { params });
  return response.data;
};

// Get party by ID
export const getPartyById = async (id: string): Promise<PartyResponse> => {
  const response = await axiosInstance.get<PartyResponse>(`/parties/${id}`);
  return response.data;
};

// Create a new party
export const createParty = async (data: CreatePartyData): Promise<PartyResponse> => {
  const response = await axiosInstance.post<PartyResponse>('/parties', data);
  return response.data;
};

// Update a party
export const updateParty = async (id: string, data: UpdatePartyData): Promise<PartyResponse> => {
  const response = await axiosInstance.put<PartyResponse>(`/parties/${id}`, data);
  return response.data;
};

// Delete a party
export const deleteParty = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/parties/${id}`);
};

// Get parties by role (convenience function)
export const getPartiesByRole = async (role: 'vendor' | 'supplier'): Promise<Party[]> => {
  const response = await getParties({ role, limit: 1000 });
  return response.parties;
};

// Get all parties (vendors and suppliers) - convenience function
export const getAllParties = async (): Promise<Party[]> => {
  const response = await getParties({ limit: 1000 });
  return response.parties;
};

