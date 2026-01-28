import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();

    const handleLogout = () => {
        logout();
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/dashboard" className="navbar-brand">
                    <span className="brand-icon">⚡</span>
                    <span className="brand-text">Sparkus</span>
                </Link>

                <div className="navbar-menu">
                    <Link
                        to="/dashboard"
                        className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
                    >
                        Dashboard
                    </Link>
                    <Link
                        to="/sessions"
                        className={`nav-link ${location.pathname === '/sessions' ? 'active' : ''}`}
                    >
                        Sessions
                    </Link>
                </div>

                <div className="navbar-actions">
                    <Link to="/sessions/create" className="btn-create">
                        + New Session
                    </Link>
                    <div className="user-menu">
                        <div className="user-avatar">
                            {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="user-info">
                            <div className="user-name">{user?.fullName || 'User'}</div>
                            <button onClick={handleLogout} className="logout-btn">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
