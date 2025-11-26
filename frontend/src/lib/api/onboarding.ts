import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

const getAuthToken = () => Cookies.get('token');

export const createCompany = async (data: any) => {
    const token = getAuthToken();
    const response = await axios.post(`${API_URL}/onboarding/company`, data, {
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

    const response = await axios.post(`${API_URL}/user/profile-picture`, formData, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};
