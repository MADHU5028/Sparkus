import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getHostSessions } from '../api/sessions.js';
import Card from '../components/common/Card.jsx';
import Loader from '../components/common/Loader.jsx';
import { formatDateTime } from '../utils/formatters.js';
import './SessionHistory.css';

const SessionHistory = () => {
    const { user } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchSessions();
    }, [user]);

    const fetchSessions = async () => {
        try {
            const data = await getHostSessions(user.userId);
            setSessions(data.sessions || []);
        } catch (error) {
            console.error('Failed to fetch sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredSessions = sessions.filter(session => {
        if (filter === 'all') return true;
        return session.status === filter;
    });

    if (loading) {
        return <Loader fullScreen />;
    }

    return (
        <div className="session-history">
            <div className="page-header">
                <div>
                    <h1>Session History</h1>
                    <p>View and manage all your sessions</p>
                </div>
                <Link to="/sessions/create" className="btn-primary">
                    + New Session
                </Link>
            </div>

            <div className="filters">
                <button
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All ({sessions.length})
                </button>
                <button
                    className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
                    onClick={() => setFilter('active')}
                >
                    Active ({sessions.filter(s => s.status === 'active').length})
                </button>
                <button
                    className={`filter-btn ${filter === 'ended' ? 'active' : ''}`}
                    onClick={() => setFilter('ended')}
                >
                    Ended ({sessions.filter(s => s.status === 'ended').length})
                </button>
            </div>

            {filteredSessions.length === 0 ? (
                <Card className="empty-state">
                    <div className="empty-icon">📝</div>
                    <h3>No sessions found</h3>
                    <p>Create your first session to get started</p>
                    <Link to="/sessions/create" className="btn-primary">
                        Create Session
                    </Link>
                </Card>
            ) : (
                <div className="sessions-grid">
                    {filteredSessions.map((session) => (
                        <Card key={session.id} className="session-card" hover>
                            <div className="card-header">
                                <h3>{session.sessionName}</h3>
                                <div className={`status-badge status-${session.status}`}>
                                    {session.status === 'active' ? '🟢 Active' :
                                        session.status === 'ended' ? '✅ Ended' : '⏸️ Created'}
                                </div>
                            </div>

                            <div className="card-meta">
                                <div className="meta-item">
                                    <span className="meta-label">Platform:</span>
                                    <span className="meta-value">
                                        {session.platform === 'google_meet' ? 'Google Meet' : 'Zoom'}
                                    </span>
                                </div>
                                <div className="meta-item">
                                    <span className="meta-label">Code:</span>
                                    <span className="meta-value code">{session.sessionCode}</span>
                                </div>
                                <div className="meta-item">
                                    <span className="meta-label">Created:</span>
                                    <span className="meta-value">{formatDateTime(session.createdAt)}</span>
                                </div>
                            </div>

                            <div className="card-actions">
                                {session.status === 'active' && (
                                    <Link to={`/sessions/${session.id}`} className="btn-action btn-view">
                                        View Live
                                    </Link>
                                )}
                                {session.status === 'ended' && (
                                    <Link to={`/sessions/${session.id}/attendance`} className="btn-action btn-report">
                                        View Report
                                    </Link>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SessionHistory;
