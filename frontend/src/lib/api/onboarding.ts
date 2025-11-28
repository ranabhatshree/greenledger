import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

const getAuthToken = () => Cookies.get('token');

export const createCompany = async (data: any) => {
    const token = getAuthToken();
    // Remove trailing slash from API_URL to avoid double slashes
    const baseUrl = API_URL.replace(/\/$/, '');
    const response = await axios.post(`${baseUrl}/onboarding/company`, data, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data;
};

export const uploadProfilePicture = async (file: File) => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('profilePicture', file);

    // Remove trailing slash from API_URL to avoid double slashes
    const baseUrl = API_URL.replace(/\/$/, '');
    const response = await axios.post(`${baseUrl}/user/profile-picture`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};
