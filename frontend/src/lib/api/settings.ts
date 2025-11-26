import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

const getAuthToken = () => Cookies.get('token');

export const getSettings = async () => {
    const token = getAuthToken();
    const response = await axios.get(`${API_URL}/settings/me`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const updateSettings = async (data: any) => {
    const token = getAuthToken();
    const response = await axios.patch(`${API_URL}/settings/me`, data, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};
