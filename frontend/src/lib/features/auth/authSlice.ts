import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';
import axiosInstance from '@/lib/api/axiosInstance';

// Move the thunk definition here
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }) => {
    const response = await axiosInstance.post('/auth/login', credentials);
    const token = response.data.token;
    // Store token in cookie
    Cookies.set('token', token);
    return token;
  }
);

export interface AuthState {
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: typeof window !== 'undefined' ? Cookies.get('token') || null : null,
    isLoading: false,
    error: null,
    isAuthenticated: typeof window !== 'undefined' ? !!Cookies.get('token') : false
  } as AuthState,
  reducers: {
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      state.error = null;
      state.isAuthenticated = true;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    logout: (state) => {
      state.token = null;
      state.error = null;
      state.isAuthenticated = false;
      Cookies.remove('token');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Login failed';
      });
  },
});

export const { setToken, setLoading, setError, clearError, logout } = authSlice.actions;
export const authReducer = authSlice.reducer; 