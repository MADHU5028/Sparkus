import apiClient, { setToken, removeToken } from './client.js';

// Sync Firebase User with Backend
export const syncWithBackend = async (idToken) => {
    const data = await apiClient('/auth/firebase', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${idToken}`
        }
    });

    if (data.token) {
        setToken(data.token);
    }

    return data;
};

// Verify User Session (Backend)
export const verifySession = async () => {
    try {
        const data = await apiClient('/auth/verify');
        return data;
    } catch (error) {
        removeToken();
        throw error;
    }
};

export const logout = () => {
    removeToken();
};
