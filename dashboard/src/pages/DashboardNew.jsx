import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { getHostSessions, getParticipantHistory } from '../api/sessions.js';
import { Sidebar, TopBar, Badge } from '../components';
import './DashboardNew.css';

const DashboardNew = () => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [joinedSessions, setJoinedSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        avgAttendance: 0,
    });

    useEffect(() => {
        if (user?.id || user?.userId) {
            fetchSessions();
        }
    }, [user]);

    // Real-time updates
    useEffect(() => {
        if (!socket) return;

        const handleSessionCreated = (data) => {
            console.log('RT: Session Created', data);
            setSessions(prev => [data.session, ...prev]);
            updateStats([data.session, ...sessions]);
        };

        const handleSessionUpdated = (data) => {
            console.log('RT: Session Updated', data);
            setSessions(prev => prev.map(s =>
                s.id === data.sessionId
                    ? { ...s, ...data, status: data.status, startedAt: data.startedAt || s.startedAt, endedAt: data.endedAt || s.endedAt }
                    : s
            ));
        };

        const handleParticipantUpdate = (data) => {
            console.log('RT: Participant Update', data);
            setSessions(prev => prev.map(s =>
                s.id === data.sessionId
                    ? { ...s, participantCount: Math.max(0, (s.participantCount || 0) + data.change) }
                    : s
            ));
        };

        socket.on('host:session_created', handleSessionCreated);
        socket.on('host:session_updated', handleSessionUpdated);
        socket.on('host:session_participant_update', handleParticipantUpdate);

        return () => {
            socket.off('host:session_created', handleSessionCreated);
            socket.off('host:session_updated', handleSessionUpdated);
            socket.off('host:session_participant_update', handleParticipantUpdate);
        };
    }, [socket, sessions]); // specific dep on sessions for stats update might be tricky, prefer separate stats calc or functional update

    // Helper to recalc stats
    const updateStats = (currentSessions) => {
        // Re-run stats logic or just rely on the next render if stats are derived?
        // Since stats is state, we need to set it. But better to make stats derived from 'sessions' state to avoid sync issues.
        // Let's refactor stats to be derived or useEffect driven.
    };

    // Derived stats
    useEffect(() => {
        const active = sessions.filter(s => ['active', 'pending', 'created'].includes(s.status)).length;
        const totalParticipants = sessions.reduce((sum, s) => sum + (s.participantCount || 0), 0);
        const avgAttendance = sessions.length > 0
            ? Math.round((totalParticipants / sessions.length) * 100) / 100
            : 0;

        setStats({
            total: sessions.length,
            active,
            avgAttendance: Math.round(avgAttendance) + '%',
        });
    }, [sessions]);

    const fetchSessions = async () => {
        const userId = user?.id || user?.userId;
        if (!userId) {
            console.log('No user ID available yet');
            setLoading(false);
            return;
        }

        // Fetch Host Sessions
        try {
            const hostData = await getHostSessions(userId);
            console.log('Host Data:', hostData);
            setSessions(hostData.sessions || []);
        } catch (error) {
            console.error('Failed to fetch host sessions:', error);
            // Don't block loading of participant history
        }

        // Fetch Participant History
        try {
            const participantData = await getParticipantHistory();
            console.log('Participant Data:', participantData);
            setJoinedSessions(participantData.history || []);
        } catch (error) {
            console.error('Failed to fetch participant history:', error);
        }

        setLoading(false);
    };

    const activeSessions = sessions.filter(s => ['active', 'pending', 'created'].includes(s.status));
    const pastSessions = sessions.filter(s => s.status === 'ended').slice(0, 5);

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <div className="dashboard-main">
                <TopBar
                    title="Dashboard Overview"
                    actions={
                        <button className="btn-primary" onClick={() => navigate('/create-session')}>
                            ➕ Create New Session
                        </button>
                    }
                />

                <div className="dashboard-content">
                    {/* Quick Statistics */}
                    <section className="dashboard-section">
                        <h2 className="section-title">Quick Statistics</h2>
                        <div className="stats-grid-horizontal">
                            <div className="stat-card-horizontal">
                                <div className="stat-content">
                                    <div className="stat-label">Total Sessions</div>
                                    <div className="stat-value">{stats.total}</div>
                                </div>
                                <div className="stat-icon-right">📊</div>
                            </div>
                            <div className="stat-card-horizontal">
                                <div className="stat-content">
                                    <div className="stat-label">Average Attendance</div>
                                    <div className="stat-value">{stats.avgAttendance}</div>
                                </div>
                                <div className="stat-icon-right">✓</div>
                            </div>
                            <div className="stat-card-horizontal">
                                <div className="stat-content">
                                    <div className="stat-label">Live Sessions</div>
                                    <div className="stat-value">{stats.active}</div>
                                </div>
                                <div className="stat-icon-right">🟢</div>
                            </div>
                        </div>
                    </section>

                    {/* Active Sessions */}
                    <section className="dashboard-section">
                        <h2 className="section-title">Active Sessions</h2>
                        {activeSessions.length === 0 ? (
                            <div className="empty-state">
                                <p>No active sessions at the moment</p>
                            </div>
                        ) : (
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Session Name</th>
                                            <th>Host</th>
                                            <th>Status</th>
                                            <th>Participants</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activeSessions.map(session => (
                                            <tr
                                                key={session.id}
                                                onClick={() => navigate(`/sessions/${session.id}`)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <td>
                                                    <div className="session-name">{session.sessionName}</div>
                                                </td>
                                                <td>{user?.fullName || 'Host'}</td>
                                                <td>
                                                    {session.status === 'active' ? (
                                                        <Badge variant="success">Live</Badge>
                                                    ) : session.status === 'created' ? (
                                                        <Badge variant="primary">Created</Badge>
                                                    ) : (
                                                        <Badge variant="warning">Pending</Badge>
                                                    )}
                                                </td>
                                                <td>{session.participantCount || 0}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    {/* Past Session History */}
                    <section className="dashboard-section">
                        <h2 className="section-title">Past Session History</h2>
                        {pastSessions.length === 0 ? (
                            <div className="empty-state">
                                <p>No past sessions yet</p>
                            </div>
                        ) : (
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Session Name</th>
                                            <th>Date</th>
                                            <th>Participants</th>
                                            <th>Attendance</th>
                                            <th>Report Type</th>
                                            <th>Details</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pastSessions.map(session => (
                                            <tr key={session.id}>
                                                <td>
                                                    <div className="session-name">{session.sessionName}</div>
                                                </td>
                                                <td>{new Date(session.createdAt).toLocaleDateString()}</td>
                                                <td>{session.participantCount || 0}</td>
                                                <td>{session.attendance || '95%'}</td>
                                                <td>
                                                    {session.examMonitoringEnabled ? (
                                                        <Badge variant="danger">🔒 Exam Monitoring</Badge>
                                                    ) : session.aiRecordingEnabled ? (
                                                        <Badge variant="info">🤖 AI Summary</Badge>
                                                    ) : (
                                                        <Badge variant="primary">📋 Attendance Report</Badge>
                                                    )}
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn-icon-arrow"
                                                        onClick={() => {
                                                            if (session.examMonitoringEnabled) {
                                                                navigate(`/sessions/${session.id}/exam-report`);
                                                            } else if (session.aiRecordingEnabled) {
                                                                navigate(`/sessions/${session.id}/ai-summary`);
                                                            } else {
                                                                navigate(`/sessions/${session.id}/attendance`);
                                                            }
                                                        }}
                                                    >
                                                        →
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    {/* Joined Sessions (Participant History) */}
                    <section className="dashboard-section">
                        <h2 className="section-title">Joined Sessions</h2>
                        {joinedSessions.length === 0 ? (
                            <div className="empty-state">
                                <p>You haven't joined any sessions yet</p>
                            </div>
                        ) : (
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Session Name</th>
                                            <th>Host</th>
                                            <th>Date</th>
                                            <th>Your Score</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {joinedSessions.map(session => (
                                            <tr key={session.participantId}>
                                                <td>
                                                    <div className="session-name">{session.sessionName}</div>
                                                    <div className="session-code uk-text-small">{session.sessionCode}</div>
                                                </td>
                                                <td>{session.hostName}</td>
                                                <td>{new Date(session.sessionDate).toLocaleDateString()}</td>
                                                <td>
                                                    <span className={
                                                        session.focusScore >= 70 ? 'text-success' :
                                                            session.focusScore >= 50 ? 'text-warning' : 'text-danger'
                                                    }>
                                                        {session.focusScore}%
                                                    </span>
                                                </td>
                                                <td>
                                                    <Badge variant={session.status === 'active' ? 'success' : 'secondary'}>
                                                        {session.status}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </div>

                <footer className="dashboard-footer">
                    © 2026 Sparkus. All rights reserved.
                    <div className="footer-links">
                        <a href="#">Privacy Policy</a>
                        <a href="#">Terms of Service</a>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default DashboardNew;
