import axios from 'axios';
import Cookies from 'js-cookie';
import { store } from '@/lib/store';
import { logout } from '@/lib/features/auth/authSlice';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Don't set Content-Type for FormData - let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Dispatch logout action to clear Redux state
      store.dispatch(logout());
      // Remove token from cookie
      Cookies.remove('token');
      
      // Only redirect if we're in the browser
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } else if (error.response?.status === 403) {
      // 403 Forbidden - user is authenticated but doesn't have permission
      // Log the error but don't redirect (might be a temporary permission issue)
      console.error('Access forbidden:', error.response?.data?.message || 'You do not have permission to access this resource');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance; 
