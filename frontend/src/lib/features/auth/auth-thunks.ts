import { createAsyncThunk } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';
import type { RootState } from '@/lib/store-types';
import axiosInstance from "@/lib/api/axiosInstance";

export const loginUser = createAsyncThunk<
  string,
  { email: string; password: string },
  { state: RootState }
>('auth/login', async (credentials) => {
  const response = await axiosInstance.post('/auth/login', credentials);
  const token = response.data.token;
  Cookies.set('token', token);
  return token;
}); 