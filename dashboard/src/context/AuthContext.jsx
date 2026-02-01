import { createContext, useState, useEffect, useContext } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { syncWithBackend, verifySession, logout as apiLogout } from '../api/auth.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authError, setAuthError] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setAuthError(null); // Clear previous errors on state change
            if (firebaseUser) {
                try {
                    const idToken = await firebaseUser.getIdToken();
                    // Sync with backend to get app session/user details
                    const data = await syncWithBackend(idToken);

                    setUser({
                        ...data.user,
                        photoURL: firebaseUser.photoURL
                    });
                    setIsAuthenticated(true);
                } catch (error) {
                    console.error("Backend sync failed:", error);
                    setAuthError(error.message || "Authentication failed during backend sync.");
                    // Force logout if backend sync fails (e.g. server error)
                    await signOut(auth);
                    setUser(null);
                    setIsAuthenticated(false);
                }
            } else {
                setUser(null);
                setIsAuthenticated(false);
                apiLogout();
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const loginWithGoogle = async () => {
        setAuthError(null);
        try {
            await signInWithPopup(auth, googleProvider);
            // State update handled by onAuthStateChanged
        } catch (error) {
            console.error("Google Sign-In Error:", error);
            setAuthError(error.message);
            throw error;
        }
    };

    const loginWithEmail = async (email, password) => {
        setAuthError(null);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error("Email Login Error:", error);
            setAuthError(error.message);
            throw error;
        }
    };

    const registerWithEmail = async (email, password, name) => {
        setAuthError(null);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            if (name) {
                await updateProfile(userCredential.user, {
                    displayName: name
                });
            }
        } catch (error) {
            console.error("Registration Error:", error);
            setAuthError(error.message);
            throw error;
        }
    };

    const logout = async () => {
        setAuthError(null);
        try {
            await signOut(auth);
            apiLogout();
            // State update handled by onAuthStateChanged
        } catch (error) {
            console.error("Logout Error:", error);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            isAuthenticated,
            authError,
            loginWithGoogle,
            loginWithEmail,
            registerWithEmail,
            logout
        }}>
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
