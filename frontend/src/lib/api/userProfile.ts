import axiosInstance from './axiosInstance';

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  panNumber?: string;
  profilePicture?: string;
  role: string;
  roleId?: {
    _id: string;
    name: string;
    permissions: string[];
  };
  companyId?: {
    _id: string;
    companyName: string;
  };
  email_verified: boolean;
  phone_verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  panNumber?: string;
  profilePicture?: string;
  password?: string;
  currentPassword?: string;
}

export interface UserProfileResponse {
  user: UserProfile;
}

export const getProfile = async (): Promise<UserProfileResponse> => {
  const response = await axiosInstance.get<UserProfileResponse>('/profile');
  return response.data;
};

export const updateProfile = async (data: UpdateProfileData): Promise<UserProfileResponse> => {
  const response = await axiosInstance.put<UserProfileResponse>('/profile', data);
  return response.data;
};

export const uploadProfilePicture = async (file: File): Promise<{ profilePicture: string }> => {
  const formData = new FormData();
  formData.append('profilePicture', file);
  
  const response = await axiosInstance.post<{ profilePicture: string; message: string }>('/profile/upload-picture', formData);
  
  // Convert relative URL to absolute URL if needed
  const profilePicture = response.data.profilePicture.startsWith('http') 
    ? response.data.profilePicture 
    : `${process.env.NEXT_PUBLIC_BASE_URL}${response.data.profilePicture}`;
  
  return { profilePicture };
};

