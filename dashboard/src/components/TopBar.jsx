import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import './TopBar.css';
import { formatDistanceToNow } from 'date-fns';

/**
 * TopBar Component
 * Header with notifications and profile
 */
const TopBar = ({ title, subtitle, actions }) => {
    const { user, logout } = useAuth();
    const { notifications, unreadCount, markAsRead, clearNotifications } = useSocket();
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const notificationRef = useRef(null);
    const profileRef = useRef(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowProfile(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'info': return 'ℹ️';
            case 'warning': return '⚠️';
            case 'success': return '✅';
            case 'error': return '❌';
            default: return '🔔';
        }
    };

    // Get user initials for avatar
    const getUserInitials = () => {
        if (!user?.fullName) return 'U';
        const names = user.fullName.split(' ');
        if (names.length >= 2) {
            return names[0][0] + names[1][0];
        }
        return names[0][0];
    };

    const handleNotificationClick = (id) => {
        markAsRead(id);
    };

    return (
        <header className="topbar">
            <div className="topbar__content">
                <div className="topbar__title-section">
                    {title && <h1 className="topbar__title">{title}</h1>}
                    {subtitle && <p className="topbar__subtitle">{subtitle}</p>}
                </div>

                <div className="topbar__actions">
                    {actions}

                    <ThemeToggle />

                    {/* Notification Dropdown */}
                    <div className="topbar__notification-wrapper" ref={notificationRef}>
                        <button
                            className="topbar__notification"
                            onClick={() => setShowNotifications(!showNotifications)}
                        >
                            🔔
                            {unreadCount > 0 && (
                                <span className="topbar__notification-badge">{unreadCount}</span>
                            )}
                        </button>

                        {showNotifications && (
                            <div className="notification-dropdown">
                                <div className="notification-dropdown__header">
                                    <h3>Notifications</h3>
                                    {notifications.length > 0 && (
                                        <button
                                            className="notification-dropdown__clear"
                                            onClick={clearNotifications}
                                        >
                                            Clear All
                                        </button>
                                    )}
                                </div>
                                <div className="notification-dropdown__list">
                                    {notifications.length === 0 ? (
                                        <div className="notification-dropdown__empty">
                                            No notifications
                                        </div>
                                    ) : (
                                        notifications.map(notification => (
                                            <div
                                                key={notification.id || Math.random()}
                                                className={`notification-item ${notification.is_read ? 'read' : 'unread'}`}
                                                onClick={() => handleNotificationClick(notification.id)}
                                            >
                                                <span className="notification-item__icon">
                                                    {getNotificationIcon(notification.type)}
                                                </span>
                                                <div className="notification-item__content">
                                                    <p className="notification-item__message">
                                                        {notification.message}
                                                    </p>
                                                    <span className="notification-item__time">
                                                        {notification.created_at || notification.timestamp ?
                                                            formatDistanceToNow(new Date(notification.created_at || notification.timestamp), { addSuffix: true })
                                                            : 'Just now'}
                                                    </span>
                                                </div>
                                                {!notification.is_read && <div className="notification-dot"></div>}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Profile Dropdown */}
                    <div className="topbar__profile-wrapper" ref={profileRef}>
                        <button
                            className="topbar__profile"
                            onClick={() => setShowProfile(!showProfile)}
                        >
                            <div className="topbar__profile-avatar">
                                {getUserInitials()}
                            </div>
                        </button>

                        {showProfile && (
                            <div className="profile-dropdown">
                                <div className="profile-dropdown__header">
                                    <div className="profile-dropdown__avatar">
                                        {getUserInitials()}
                                    </div>
                                    <div className="profile-dropdown__info">
                                        <p className="profile-dropdown__name">{user?.fullName || 'User'}</p>
                                        <p className="profile-dropdown__email">{user?.email || 'user@example.com'}</p>
                                    </div>
                                </div>
                                <div className="profile-dropdown__menu">
                                    <button
                                        className="profile-dropdown__item"
                                        onClick={() => {
                                            setShowProfile(false);
                                            navigate('/settings');
                                        }}
                                    >
                                        <span className="profile-dropdown__item-icon">⚙️</span>
                                        Settings
                                    </button>
                                    <button
                                        className="profile-dropdown__item profile-dropdown__item--danger"
                                        onClick={handleLogout}
                                    >
                                        <span className="profile-dropdown__item-icon">🚪</span>
                                        Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default TopBar;
