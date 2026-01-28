import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSession, endSession } from '../api/sessions.js';
import { getSessionParticipants } from '../api/participants.js';
import { useSocket } from '../context/SocketContext.jsx';
import { Sidebar, TopBar, Badge, ProgressBar } from '../components';
import toast from 'react-hot-toast';
import './LiveMonitoringNew.css';

const LiveMonitoringNew = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { socket, connected, connect } = useSocket();
    const [session, setSession] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        avgFocus: 0,
    });

    useEffect(() => {
        fetchSessionData();
        connect();
    }, [id]);

    useEffect(() => {
        if (!socket || !connected) return;

        console.log('🔌 Socket connected, joining session:', id);
        socket.emit('host:join', { sessionId: id });

        // Listen for real-time updates
        socket.on('participant:connected', handleParticipantJoined);
        socket.on('participant:disconnected', handleParticipantLeft);
        socket.on('focus:updated', handleFocusUpdated);
        socket.on('network:status', handleNetworkStatus);
        socket.on('violation:logged', handleViolation);

        return () => {
            socket.off('participant:connected');
            socket.off('participant:disconnected');
            socket.off('focus:updated');
            socket.off('network:status');
            socket.off('violation:logged');
            socket.emit('host:leave', { sessionId: id });
        };
    }, [socket, connected, id]);

    const fetchSessionData = async () => {
        try {
            const [sessionData, participantsData] = await Promise.all([
                getSession(id),
                getSessionParticipants(id),
            ]);

            setSession(sessionData.session);
            setParticipants(participantsData.participants || []);
            calculateStats(participantsData.participants || []);
        } catch (error) {
            toast.error('Failed to load session');
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (participantsList) => {
        const total = participantsList.length;
        const active = participantsList.filter(p => p.extensionActive).length;
        const avgFocus = total > 0
            ? participantsList.reduce((sum, p) => sum + (p.focusScore || 0), 0) / total
            : 0;

        setStats({ total, active, avgFocus: Math.round(avgFocus) });
    };

    const handleParticipantJoined = (data) => {
        console.log('👤 Participant connected:', data);
        setParticipants(prev => {
            const exists = prev.find(p => p.id === data.participantId);
            if (exists) {
                return prev.map(p =>
                    p.id === data.participantId
                        ? { ...p, extensionActive: true }
                        : p
                );
            }
            return [...prev, { id: data.participantId, extensionActive: true, focusScore: 100 }];
        });
    };

    const handleParticipantLeft = (data) => {
        console.log('👋 Participant disconnected:', data);
        setParticipants(prev =>
            prev.map(p =>
                p.id === data.participantId
                    ? { ...p, extensionActive: false }
                    : p
            )
        );
    };

    const handleFocusUpdated = (data) => {
        console.log('📊 Focus updated:', data);
        setParticipants(prev =>
            prev.map(p =>
                p.id === data.participantId
                    ? { ...p, focusScore: data.focusScore }
                    : p
            )
        );
    };

    const handleNetworkStatus = (data) => {
        console.log('🌐 Network status:', data);
        setParticipants(prev =>
            prev.map(p =>
                p.id === data.participantId
                    ? { ...p, networkStatus: data.status }
                    : p
            )
        );
    };

    const handleViolation = (data) => {
        console.log('⚠️ Violation:', data);
        toast.error(`Violation detected: ${data.participantName} - ${data.type}`);
    };

    const handleEndSession = async () => {
        if (!confirm('Are you sure you want to end this session?')) return;

        try {
            await endSession(id);
            toast.success('Session ended successfully');
            navigate('/dashboard');
        } catch (error) {
            toast.error('Failed to end session');
        }
    };

    const copySessionCode = () => {
        navigator.clipboard.writeText(session?.sessionCode);
        toast.success('Session code copied!');
    };

    if (loading) {
        return <div className="loading-screen">Loading session...</div>;
    }

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <div className="dashboard-main">
                <TopBar
                    title={session?.sessionName || 'Live Monitoring'}
                    subtitle={`Session Code: ${session?.sessionCode || ''}`}
                    actions={
                        <div className="live-actions">
                            <button className="btn-secondary" onClick={copySessionCode}>
                                📋 Copy Code
                            </button>
                            <button className="btn-danger" onClick={handleEndSession}>
                                ⏹️ End Session
                            </button>
                        </div>
                    }
                />

                <div className="dashboard-content">
                    {/* Live Stats */}
                    <section className="live-stats">
                        <div className="stat-box">
                            <div className="stat-icon">👥</div>
                            <div className="stat-info">
                                <div className="stat-value">{stats.total}</div>
                                <div className="stat-label">Total Participants</div>
                            </div>
                        </div>

                        <div className="stat-box stat-box--success">
                            <div className="stat-icon">🟢</div>
                            <div className="stat-info">
                                <div className="stat-value">{stats.active}</div>
                                <div className="stat-label">Active Now</div>
                            </div>
                        </div>

                        <div className="stat-box stat-box--primary">
                            <div className="stat-icon">📊</div>
                            <div className="stat-info">
                                <div className="stat-value">{stats.avgFocus}%</div>
                                <div className="stat-label">Avg Focus Score</div>
                            </div>
                        </div>
                    </section>

                    {/* Quick Actions */}
                    <section className="quick-actions">
                        <button
                            className="action-card"
                            onClick={() => navigate(`/sessions/${id}/attendance`)}
                        >
                            <span className="action-icon">📋</span>
                            <span className="action-label">Attendance Report</span>
                        </button>
                        <button
                            className="action-card"
                            onClick={() => navigate(`/sessions/${id}/ai-summary`)}
                        >
                            <span className="action-icon">🤖</span>
                            <span className="action-label">AI Summary</span>
                        </button>
                        <button
                            className="action-card"
                            onClick={() => navigate(`/sessions/${id}/exam-report`)}
                        >
                            <span className="action-icon">🔒</span>
                            <span className="action-label">Exam Report</span>
                        </button>
                    </section>

                    {/* Participants Table */}
                    <section className="participants-section">
                        <div className="section-header">
                            <h2 className="section-title">Participants</h2>
                            <Badge variant="live">🔴 Live</Badge>
                        </div>

                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Status</th>
                                        <th>Focus Score</th>
                                        <th>Network</th>
                                        <th>Violations</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {participants.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="empty-row">
                                                No participants yet. Share the session code to get started.
                                            </td>
                                        </tr>
                                    ) : (
                                        participants.map(participant => (
                                            <tr key={participant.id}>
                                                <td>
                                                    <div className="participant-name">
                                                        {participant.fullName || 'Unknown'}
                                                    </div>
                                                </td>
                                                <td>{participant.email || 'N/A'}</td>
                                                <td>
                                                    {participant.extensionActive ? (
                                                        <Badge variant="success">Active</Badge>
                                                    ) : (
                                                        <Badge variant="default">Inactive</Badge>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="focus-cell">
                                                        <ProgressBar
                                                            value={participant.focusScore || 0}
                                                            max={100}
                                                            color="auto"
                                                            size="sm"
                                                        />
                                                    </div>
                                                </td>
                                                <td>
                                                    {participant.networkStatus === 'offline' ? (
                                                        <Badge variant="danger">Offline</Badge>
                                                    ) : (
                                                        <Badge variant="success">Online</Badge>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className="violation-count">
                                                        {participant.violationCount || 0}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default LiveMonitoringNew;
