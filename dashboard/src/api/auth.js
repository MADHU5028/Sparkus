import apiClient, { setToken, removeToken } from './client.js';

// Sign up
export const signup = async (fullName, email, password) => {
    const data = await apiClient('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ fullName, email, password }),
    });

    if (data.token) {
        setToken(data.token);
    }

    return data;
};

// Login
export const login = async (email, password) => {
    const data = await apiClient('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });

    if (data.token) {
        setToken(data.token);
    }

    return data;
};

// Google OAuth Login
export const googleLogin = async (googleId, email, fullName) => {
    const data = await apiClient('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ googleId, email, fullName }),
    });

    if (data.token) {
        setToken(data.token);
    }

    return data;
};

// Verify token
export const verifyToken = async () => {
    try {
        const data = await apiClient('/auth/verify');
        return data;
    } catch (error) {
        removeToken();
        throw error;
    }
};

// Logout
export const logout = () => {
    removeToken();
};
