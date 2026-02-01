import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './AuthNew.css';

const LoginNew = () => {
    const [mode, setMode] = useState('signin'); // 'signin' or 'signup'
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: ''
    });
    const [error, setError] = useState('');
    const [localLoading, setLocalLoading] = useState(false);

    const { loginWithGoogle, loginWithEmail, registerWithEmail, isAuthenticated, authError } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
        if (authError) {
            setError(authError);
            setLocalLoading(false);
        }
    }, [isAuthenticated, authError, navigate]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleGoogleLogin = async () => {
        setLocalLoading(true);
        setError('');
        try {
            await loginWithGoogle();
        } catch (err) {
            console.error("Login failed", err);
            // Error set by effect via authError or we can set generic here
            // setLocalLoading(false); // Handled by effect if authError comes back, but if it throws before?
            // AuthContext throws, so we catch here.
            setLocalLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalLoading(true);
        setError('');

        try {
            if (mode === 'signin') {
                await loginWithEmail(formData.email, formData.password);
            } else {
                if (!formData.name) {
                    throw new Error("Name is required for sign up");
                }
                await registerWithEmail(formData.email, formData.password, formData.name);
            }
        } catch (err) {
            console.error("Auth failed", err);
            // setLocalLoading(false); // Handled by effect for authError
            setLocalLoading(false);
        }
    };

    const toggleMode = (newMode) => {
        setMode(newMode);
        setError('');
        setFormData({ email: '', password: '', name: '' });
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-logo">
                    <div className="auth-logo-icon">🎓</div>
                    <h1 className="auth-logo-text">Sparkus</h1>
                </div>

                <div className="auth-tabs">
                    <button
                        className={`auth-tab ${mode === 'signin' ? 'auth-tab--active' : ''}`}
                        onClick={() => toggleMode('signin')}
                    >
                        Sign In
                    </button>
                    <button
                        className={`auth-tab ${mode === 'signup' ? 'auth-tab--active' : ''}`}
                        onClick={() => toggleMode('signup')}
                    >
                        Sign Up
                    </button>
                </div>

                <button
                    className="auth-google-btn"
                    onClick={handleGoogleLogin}
                    disabled={localLoading}
                >
                    <svg width="18" height="18" viewBox="0 0 18 18">
                        <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z" />
                        <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z" />
                        <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z" />
                        <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z" />
                    </svg>
                    Continue with Google
                </button>

                <div className="auth-divider">
                    <span>or</span>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    {mode === 'signup' && (
                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="John Doe"
                                required
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label>Email address</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="john.doe@example.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />
                    </div>

                    {mode === 'signin' && (
                        <div className="auth-forgot">
                            <a href="#">Forgot Password?</a>
                        </div>
                    )}

                    <button type="submit" className="auth-submit-btn" disabled={localLoading}>
                        {localLoading ? (mode === 'signin' ? 'Signing In...' : 'Creating Account...') : (mode === 'signin' ? 'Sign In' : 'Sign Up')}
                    </button>
                </form>

                <div className="auth-footer-text">
                    {mode === 'signin' ? (
                        <>
                            Don't have an account? <button className="auth-link" onClick={() => toggleMode('signup')}>Sign Up</button>
                        </>
                    ) : (
                        <>
                            Already have an account? <button className="auth-link" onClick={() => toggleMode('signin')}>Sign In</button>
                        </>
                    )}
                </div>

                <div className="auth-terms">
                    By signing in you agree to Sparkus's <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
                </div>
            </div>
        </div>
    );
};

export default LoginNew;
