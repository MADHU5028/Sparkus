import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Sidebar, TopBar } from '../components';
import toast from 'react-hot-toast';
import './Settings.css';

const Settings = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [formData, setFormData] = useState({
        fullName: user?.fullName || '',
        email: user?.email || '',
        organization: user?.organization || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [notifications, setNotifications] = useState({
        emailNotifications: true,
        sessionReminders: true,
        weeklyReports: false,
        violationAlerts: true,
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNotificationChange = (e) => {
        const { name, checked } = e.target;
        setNotifications(prev => ({ ...prev, [name]: checked }));
    };

    const handleProfileUpdate = (e) => {
        e.preventDefault();
        // TODO: Implement API call to update profile
        toast.success('Profile updated successfully!');
    };

    const handlePasswordChange = (e) => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) {
            toast.error('Passwords do not match!');
            return;
        }
        // TODO: Implement API call to change password
        toast.success('Password changed successfully!');
        setFormData(prev => ({
            ...prev,
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        }));
    };

    const handleNotificationSave = () => {
        // TODO: Implement API call to save notification preferences
        toast.success('Notification preferences saved!');
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <div className="dashboard-main">
                <TopBar title="Settings" subtitle="Manage your account settings and preferences" />

                <div className="dashboard-content">
                    <div className="settings-container">
                        {/* Settings Tabs */}
                        <div className="settings-tabs">
                            <button
                                className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
                                onClick={() => setActiveTab('profile')}
                            >
                                👤 Profile
                            </button>
                            <button
                                className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`}
                                onClick={() => setActiveTab('security')}
                            >
                                🔒 Security
                            </button>
                            <button
                                className={`settings-tab ${activeTab === 'notifications' ? 'active' : ''}`}
                                onClick={() => setActiveTab('notifications')}
                            >
                                🔔 Notifications
                            </button>
                            <button
                                className={`settings-tab ${activeTab === 'about' ? 'active' : ''}`}
                                onClick={() => setActiveTab('about')}
                            >
                                ℹ️ About
                            </button>
                        </div>

                        {/* Settings Content */}
                        <div className="settings-content">
                            {/* Profile Tab */}
                            {activeTab === 'profile' && (
                                <div className="settings-section">
                                    <h2 className="section-title">Profile Information</h2>
                                    <form onSubmit={handleProfileUpdate} className="settings-form">
                                        <div className="form-group">
                                            <label htmlFor="fullName">Full Name</label>
                                            <input
                                                type="text"
                                                id="fullName"
                                                name="fullName"
                                                value={formData.fullName}
                                                onChange={handleInputChange}
                                                className="form-input"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="email">Email Address</label>
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className="form-input"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="organization">Organization</label>
                                            <input
                                                type="text"
                                                id="organization"
                                                name="organization"
                                                value={formData.organization}
                                                onChange={handleInputChange}
                                                className="form-input"
                                                placeholder="Your school or company name"
                                            />
                                        </div>

                                        <button type="submit" className="btn-primary">
                                            💾 Save Changes
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* Security Tab */}
                            {activeTab === 'security' && (
                                <div className="settings-section">
                                    <h2 className="section-title">Change Password</h2>
                                    <form onSubmit={handlePasswordChange} className="settings-form">
                                        <div className="form-group">
                                            <label htmlFor="currentPassword">Current Password</label>
                                            <input
                                                type="password"
                                                id="currentPassword"
                                                name="currentPassword"
                                                value={formData.currentPassword}
                                                onChange={handleInputChange}
                                                className="form-input"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="newPassword">New Password</label>
                                            <input
                                                type="password"
                                                id="newPassword"
                                                name="newPassword"
                                                value={formData.newPassword}
                                                onChange={handleInputChange}
                                                className="form-input"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="confirmPassword">Confirm New Password</label>
                                            <input
                                                type="password"
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={handleInputChange}
                                                className="form-input"
                                            />
                                        </div>

                                        <button type="submit" className="btn-primary">
                                            🔒 Update Password
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* Notifications Tab */}
                            {activeTab === 'notifications' && (
                                <div className="settings-section">
                                    <h2 className="section-title">Notification Preferences</h2>
                                    <div className="notification-settings">
                                        <div className="notification-item">
                                            <div className="notification-info">
                                                <h3>Email Notifications</h3>
                                                <p>Receive email updates about your sessions</p>
                                            </div>
                                            <label className="toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    name="emailNotifications"
                                                    checked={notifications.emailNotifications}
                                                    onChange={handleNotificationChange}
                                                />
                                                <span className="toggle-slider"></span>
                                            </label>
                                        </div>

                                        <div className="notification-item">
                                            <div className="notification-info">
                                                <h3>Session Reminders</h3>
                                                <p>Get reminded about upcoming sessions</p>
                                            </div>
                                            <label className="toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    name="sessionReminders"
                                                    checked={notifications.sessionReminders}
                                                    onChange={handleNotificationChange}
                                                />
                                                <span className="toggle-slider"></span>
                                            </label>
                                        </div>

                                        <div className="notification-item">
                                            <div className="notification-info">
                                                <h3>Weekly Reports</h3>
                                                <p>Receive weekly summary of your sessions</p>
                                            </div>
                                            <label className="toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    name="weeklyReports"
                                                    checked={notifications.weeklyReports}
                                                    onChange={handleNotificationChange}
                                                />
                                                <span className="toggle-slider"></span>
                                            </label>
                                        </div>

                                        <div className="notification-item">
                                            <div className="notification-info">
                                                <h3>Violation Alerts</h3>
                                                <p>Get notified when violations are detected</p>
                                            </div>
                                            <label className="toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    name="violationAlerts"
                                                    checked={notifications.violationAlerts}
                                                    onChange={handleNotificationChange}
                                                />
                                                <span className="toggle-slider"></span>
                                            </label>
                                        </div>
                                    </div>

                                    <button onClick={handleNotificationSave} className="btn-primary">
                                        💾 Save Preferences
                                    </button>
                                </div>
                            )}

                            {/* About Tab */}
                            {activeTab === 'about' && (
                                <div className="settings-section">
                                    <h2 className="section-title">About Sparkus</h2>
                                    <div className="about-content">
                                        <div className="about-logo">
                                            <span className="logo-icon">🎓</span>
                                            <h1>Sparkus</h1>
                                        </div>
                                        <p className="version">Version 1.0.0</p>
                                        <p className="description">
                                            Sparkus is a comprehensive session monitoring platform that helps educators
                                            track student engagement, attendance, and academic integrity during online sessions.
                                        </p>
                                        <div className="about-links">
                                            <a href="#" className="about-link">📚 Documentation</a>
                                            <a href="#" className="about-link">🐛 Report a Bug</a>
                                            <a href="#" className="about-link">💡 Feature Request</a>
                                            <a href="#" className="about-link">📧 Contact Support</a>
                                        </div>
                                        <div className="about-footer">
                                            <p>© 2026 Sparkus. All rights reserved.</p>
                                            <div className="footer-links">
                                                <a href="#">Privacy Policy</a>
                                                <a href="#">Terms of Service</a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
