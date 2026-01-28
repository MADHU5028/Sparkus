import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './Sidebar.css';

/**
 * Sidebar Component
 * Navigation sidebar with menu items
 */
const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();

    const menuItems = [
        { path: '/dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/create-session', icon: '➕', label: 'Create Session' },
        { path: '/live-monitoring', icon: '👁️', label: 'Live Monitoring' },
        { path: '/attendance-report', icon: '📋', label: 'Attendance Report' },
        { path: '/analytics', icon: '📈', label: 'Analytics' },
        { path: '/ai-summary', icon: '🤖', label: 'AI Summary' },
        { path: '/exam-monitoring', icon: '🔒', label: 'Exam Monitoring' },
    ];

    const bottomItems = [
        { path: '/settings', icon: '⚙️', label: 'Settings' },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className="sidebar">
            <div className="sidebar__header">
                <div className="sidebar__logo">
                    <span className="sidebar__logo-icon">🎓</span>
                    <span className="sidebar__logo-text">Sparkus</span>
                </div>
            </div>

            <nav className="sidebar__nav">
                <div className="sidebar__menu">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path + item.label}
                            to={item.path}
                            className={`sidebar__item ${location.pathname === item.path ? 'sidebar__item--active' : ''}`}
                        >
                            <span className="sidebar__item-icon">{item.icon}</span>
                            <span className="sidebar__item-label">{item.label}</span>
                        </Link>
                    ))}
                </div>

                <div className="sidebar__menu sidebar__menu--bottom">
                    {bottomItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`sidebar__item ${location.pathname === item.path ? 'sidebar__item--active' : ''}`}
                        >
                            <span className="sidebar__item-icon">{item.icon}</span>
                            <span className="sidebar__item-label">{item.label}</span>
                        </Link>
                    ))}
                    <button
                        onClick={handleLogout}
                        className="sidebar__item sidebar__item--logout"
                    >
                        <span className="sidebar__item-icon">🚪</span>
                        <span className="sidebar__item-label">Logout</span>
                    </button>
                </div>
            </nav>
        </aside>
    );
};

export default Sidebar;
