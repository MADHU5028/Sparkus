import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './AuthNew.css';

const Login = () => {
    const [activeTab, setActiveTab] = useState('signin');
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, signup, checkAuth } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (activeTab === 'signin') {
                // Sign In
                await login(formData.email, formData.password);
                navigate('/dashboard');
            } else {
                // Sign Up
                if (formData.password !== formData.confirmPassword) {
                    setError('Passwords do not match');
                    setLoading(false);
                    return;
                }
                await signup(formData.fullName, formData.email, formData.password);
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        // Check if Google Client ID is configured
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

        if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID' || clientId === 'your_google_client_id_here') {
            setError('Google Sign-In is not configured yet. Please use email/password login or contact the administrator to set up Google OAuth.');
            console.warn('Google OAuth Client ID not configured. Set VITE_GOOGLE_CLIENT_ID in .env file.');
            return;
        }

        // Check if Google Identity Services is loaded
        if (typeof google === 'undefined' || !google.accounts) {
            setError('Google Sign-In is loading... Please wait a moment and try again.');
            return;
        }

        try {
            setLoading(true);
            setError('');

            // Initialize Google OAuth with button rendering
            google.accounts.id.initialize({
                client_id: clientId,
                callback: handleGoogleCallback,
                auto_select: false,
            });

            // Render the button or use prompt
            google.accounts.id.prompt((notification) => {
                if (notification.isNotDisplayed()) {
                    setError('Google Sign-In popup was blocked. Please allow popups for this site.');
                } else if (notification.isSkippedMoment()) {
                    setError('Google Sign-In was skipped. Please try clicking the button again.');
                }
                setLoading(false);
            });
        } catch (err) {
            console.error('Google OAuth error:', err);
            setError('Failed to initialize Google Sign-In. Please try again or use email/password login.');
            setLoading(false);
        }
    };

    const handleGoogleCallback = async (response) => {
        try {
            setLoading(true);
            setError('');

            // Decode the JWT credential to get user info
            const credential = response.credential;
            const payload = JSON.parse(atob(credential.split('.')[1]));

            console.log('Google user info:', payload);

            // Call our backend with Google user info
            const { googleLogin: apiGoogleLogin } = await import('../api/auth.js');
            const data = await apiGoogleLogin(payload.sub, payload.email, payload.name);

            console.log('Google login response:', data);

            // Update auth context
            await checkAuth();
            navigate('/dashboard');
        } catch (err) {
            console.error('Google callback error:', err);
            setError(err.message || 'Google sign-in failed. Please try again or use email/password login.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                {/* Logo */}
                <div className="auth-logo">
                    <div className="auth-logo-icon">🎓</div>
                    <h1 className="auth-logo-text">Sparkus</h1>
                </div>

                {/* Tabs */}
                <div className="auth-tabs">
                    <button
                        className={`auth-tab ${activeTab === 'signin' ? 'auth-tab--active' : ''}`}
                        onClick={() => setActiveTab('signin')}
                    >
                        Sign In
                    </button>
                    <button
                        className={`auth-tab ${activeTab === 'signup' ? 'auth-tab--active' : ''}`}
                        onClick={() => setActiveTab('signup')}
                    >
                        Sign Up
                    </button>
                </div>

                {/* Google OAuth */}
                <button className="auth-google-btn" onClick={handleGoogleLogin}>
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

                {/* Error Message */}
                {error && (
                    <div className="auth-error">
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="auth-form">
                    {activeTab === 'signup' && (
                        <div className="form-group">
                            <label htmlFor="fullName">Full Name</label>
                            <input
                                type="text"
                                id="fullName"
                                name="fullName"
                                placeholder="John Doe"
                                value={formData.fullName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="email">Email address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="john.doe@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {activeTab === 'signup' && (
                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    )}

                    {activeTab === 'signin' && (
                        <div className="auth-forgot">
                            <Link to="/forgot-password">Forgot Password?</Link>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="auth-submit-btn"
                        disabled={loading}
                    >
                        {loading ? 'Please wait...' : activeTab === 'signin' ? 'Sign In' : 'Sign Up'}
                    </button>

                    {activeTab === 'signin' ? (
                        <p className="auth-footer-text">
                            Don't have an account? <button type="button" onClick={() => setActiveTab('signup')} className="auth-link">Sign Up</button>
                        </p>
                    ) : (
                        <p className="auth-footer-text">
                            Already have an account? <button type="button" onClick={() => setActiveTab('signin')} className="auth-link">Sign In</button>
                        </p>
                    )}
                </form>

                <p className="auth-terms">
                    By signing in you agree to Sparkus's <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
                </p>
            </div>
        </div>
    );
};

export default Login;
