import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

const getAuthToken = () => Cookies.get('token');

export const getRoles = async () => {
    const token = getAuthToken();
    const response = await axios.get(`${API_URL}/roles`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const createRole = async (data: any) => {
    const token = getAuthToken();
    const response = await axios.post(`${API_URL}/roles`, data, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const updateRole = async (id: string, data: any) => {
    const token = getAuthToken();
    const response = await axios.patch(`${API_URL}/roles/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const deleteRole = async (id: string) => {
    const token = getAuthToken();
    const response = await axios.delete(`${API_URL}/roles/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const getPermissions = async () => {
    const token = getAuthToken();
    const response = await axios.get(`${API_URL}/permissions`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};
