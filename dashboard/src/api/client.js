const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get auth token from localStorage
export const getAuthToken = () => localStorage.getItem('sparkus_token');

// Set auth token
export const setToken = (token) => localStorage.setItem('sparkus_token', token);

// Remove auth token
export const removeToken = () => localStorage.removeItem('sparkus_token');

// API client with auth
export const apiClient = async (endpoint, options = {}) => {
    const token = getAuthToken();

    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        },
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

export default apiClient;
