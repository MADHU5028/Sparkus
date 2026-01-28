import { createContext, useState, useEffect, useContext } from 'react';
import { login as apiLogin, signup as apiSignup, verifyToken, logout as apiLogout } from '../api/auth.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const data = await verifyToken();
            setUser({
                userId: data.user.id,
                email: data.user.email,
                fullName: data.user.fullName,
            });
            setIsAuthenticated(true);
        } catch (error) {
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const data = await apiLogin(email, password);
        setUser({
            userId: data.user.id,
            email: data.user.email,
            fullName: data.user.fullName,
        });
        setIsAuthenticated(true);
        return data;
    };

    const signup = async (fullName, email, password) => {
        const data = await apiSignup(fullName, email, password);
        setUser({
            userId: data.user.id,
            email: data.user.email,
            fullName: data.user.fullName,
        });
        setIsAuthenticated(true);
        return data;
    };

    const logout = () => {
        apiLogout();
        setUser(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ user, loading, isAuthenticated, login, signup, logout, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export default AuthContext;
