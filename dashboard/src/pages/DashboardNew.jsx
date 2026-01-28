import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getHostSessions } from '../api/sessions.js';
import { Sidebar, TopBar, Badge } from '../components';
import './DashboardNew.css';

const DashboardNew = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        avgAttendance: 0,
    });

    useEffect(() => {
        if (user?.userId) {
            fetchSessions();
        }
    }, [user]);

    const fetchSessions = async () => {
        if (!user?.userId) {
            console.log('No user ID available yet');
            setLoading(false);
            return;
        }

        try {
            const data = await getHostSessions(user.userId);
            const sessionList = data.sessions || [];
            setSessions(sessionList);

            // Calculate stats
            const active = sessionList.filter(s => s.status === 'active').length;
            const totalParticipants = sessionList.reduce((sum, s) => sum + (s.participantCount || 0), 0);
            const avgAttendance = sessionList.length > 0
                ? Math.round((totalParticipants / sessionList.length) * 100) / 100
                : 0;

            setStats({
                total: sessionList.length,
                active,
                avgAttendance: Math.round(avgAttendance) + '%',
            });
        } catch (error) {
            console.error('Failed to fetch sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const activeSessions = sessions.filter(s => s.status === 'active' || s.status === 'pending');
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
