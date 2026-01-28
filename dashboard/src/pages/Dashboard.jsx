import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getHostSessions } from '../api/sessions.js';
import Card from '../components/common/Card.jsx';
import Loader from '../components/common/Loader.jsx';
import { formatDateTime, formatRelativeTime } from '../utils/formatters.js';
import './Dashboard.css';

const Dashboard = () => {
    const { user } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        completed: 0,
    });

    useEffect(() => {
        fetchSessions();
    }, [user]);

    const fetchSessions = async () => {
        try {
            const data = await getHostSessions(user.userId);
            setSessions(data.sessions || []);

            // Calculate stats
            const active = data.sessions?.filter(s => s.status === 'active').length || 0;
            const completed = data.sessions?.filter(s => s.status === 'ended').length || 0;

            setStats({
                total: data.sessions?.length || 0,
                active,
                completed,
            });
        } catch (error) {
            console.error('Failed to fetch sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Loader fullScreen />;
    }

    const recentSessions = sessions.slice(0, 5);

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <div>
                    <h1>Welcome back, {user?.fullName?.split(' ')[0] || 'User'}! 👋</h1>
                    <p>Here's what's happening with your sessions</p>
                </div>
                <Link to="/sessions/create" className="btn-primary">
                    + Create New Session
                </Link>
            </div>

            <div className="stats-grid">
                <Card className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, var(--primary-600), var(--primary-400))' }}>
                        📊
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.total}</div>
                        <div className="stat-label">Total Sessions</div>
                    </div>
                </Card>

                <Card className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, var(--success-600), var(--success-400))' }}>
                        🟢
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.active}</div>
                        <div className="stat-label">Active Now</div>
                    </div>
                </Card>

                <Card className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, var(--gray-600), var(--gray-400))' }}>
                        ✅
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.completed}</div>
                        <div className="stat-label">Completed</div>
                    </div>
                </Card>
            </div>

            <div className="recent-sessions">
                <div className="section-header">
                    <h2>Recent Sessions</h2>
                    <Link to="/sessions" className="view-all-link">
                        View All →
                    </Link>
                </div>

                {recentSessions.length === 0 ? (
                    <Card className="empty-state">
                        <div className="empty-icon">📝</div>
                        <h3>No sessions yet</h3>
                        <p>Create your first session to start tracking engagement</p>
                        <Link to="/sessions/create" className="btn-primary">
                            Create Session
                        </Link>
                    </Card>
                ) : (
                    <div className="sessions-list">
                        {recentSessions.map((session) => (
                            <Card key={session.id} className="session-card" hover>
                                <div className="session-header">
                                    <div>
                                        <h3>{session.sessionName}</h3>
                                        <div className="session-meta">
                                            <span className="session-platform">{session.platform === 'google_meet' ? 'Google Meet' : 'Zoom'}</span>
                                            <span className="session-dot">•</span>
                                            <span className="session-time">{formatRelativeTime(session.createdAt)}</span>
                                        </div>
                                    </div>
                                    <div className={`session-status status-${session.status}`}>
                                        {session.status === 'active' ? '🟢 Active' : session.status === 'ended' ? '✅ Ended' : '⏸️ Created'}
                                    </div>
                                </div>

                                <div className="session-code">
                                    <span className="code-label">Session Code:</span>
                                    <span className="code-value">{session.sessionCode}</span>
                                </div>

                                {session.status === 'active' && (
                                    <Link to={`/sessions/${session.id}`} className="btn-view">
                                        View Live Session →
                                    </Link>
                                )}
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
