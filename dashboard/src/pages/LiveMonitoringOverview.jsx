import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHostSessions } from '../api/sessions.js';
import { getSessionParticipants } from '../api/participants.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { Sidebar, TopBar, Badge } from '../components';
import './LiveMonitoringOverview.css';

const LiveMonitoringOverview = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { socket, connected } = useSocket();
    const [sessions, setSessions] = useState([]);
    const [participants, setParticipants] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActiveSessions();
        const interval = setInterval(fetchActiveSessions, 5000); // Refresh every 5 seconds
        return () => clearInterval(interval);
    }, [user]);

    useEffect(() => {
        if (!socket || !connected) return;

        // Listen for real-time updates
        socket.on('focus:updated', handleFocusUpdate);
        socket.on('participant:connected', handleParticipantUpdate);
        socket.on('participant:disconnected', handleParticipantUpdate);
        socket.on('network:status', handleNetworkUpdate);

        return () => {
            socket.off('focus:updated');
            socket.off('participant:connected');
            socket.off('participant:disconnected');
            socket.off('network:status');
        };
    }, [socket, connected]);

    const fetchActiveSessions = async () => {
        if (!user?.userId) return;

        try {
            const data = await getHostSessions(user.userId);
            const activeSessions = data.sessions.filter(s => s.status === 'active');
            setSessions(activeSessions);

            // Fetch participants for each active session
            const participantsData = {};
            for (const session of activeSessions) {
                const result = await getSessionParticipants(session.id);
                participantsData[session.id] = result.participants || [];
            }
            setParticipants(participantsData);
        } catch (error) {
            console.error('Failed to fetch sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFocusUpdate = (data) => {
        setParticipants(prev => {
            // Check if participant belongs to any active session
            // Data structure from server: { participantId, sessionId, focusScore, status... }
            const sessionId = data.sessionId;
            const sessionParticipants = prev[sessionId] || [];

            // If session update comes in but we don't have that session loaded yet, ignore or fetch
            if (!prev[sessionId]) return prev;

            return {
                ...prev,
                [sessionId]: sessionParticipants.map(p =>
                    p.id === data.participantId ? {
                        ...p,
                        focusScore: data.focusScore,
                        networkStatus: data.networkStable ? 'online' : 'offline',
                        // Also update last heartbeat or status if needed
                        status: data.status,
                    } : p
                )
            };
        });
    };

    const handleParticipantUpdate = (data) => {
        // Optimistically add participant or just refresh
        // For simplicity and data consistency, we refresh
        console.log("Participant update received", data);
        fetchActiveSessions();
    };

    const handleNetworkUpdate = (data) => {
        // Deprecated? realtimeHandler emits 'focus:updated' which includes networkStable
        // Keeping for backward compatibility if needed, or removing if unused
    };

    const handleRefresh = () => {
        setLoading(true);
        fetchActiveSessions();
    };

    const getStatusBadge = (focusScore) => {
        if (focusScore >= 70) return { variant: 'success', label: 'Focused' };
        if (focusScore >= 40) return { variant: 'warning', label: 'At Risk' };
        return { variant: 'danger', label: 'Disconnected' };
    };

    const getExtensionStatus = (participant) => {
        if (!participant.extensionActive) return { variant: 'danger', label: 'Inactive' };
        if (participant.networkStatus === 'offline') return { variant: 'danger', label: 'Inactive' };
        return { variant: 'success', label: 'Active' };
    };

    if (loading) {
        return <div className="loading-screen">Loading sessions...</div>;
    }

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <div className="dashboard-main">
                <TopBar
                    title="Live Session Monitoring"
                    subtitle="Real-time insights into student engagement and session health, without compromising privacy."
                    actions={
                        <button className="btn-secondary" onClick={handleRefresh}>
                            🔄 Refresh Data
                        </button>
                    }
                />

                <div className="dashboard-content">
                    {sessions.length === 0 ? (
                        <div className="empty-state">
                            <h3>No Active Sessions</h3>
                            <p>Create a new session to start monitoring participants</p>
                            <button className="btn-primary" onClick={() => navigate('/create-session')}>
                                ➕ Create Session
                            </button>
                        </div>
                    ) : (
                        sessions.map(session => (
                            <section key={session.id} className="monitoring-section">
                                <div className="section-header">
                                    <div>
                                        <h2 className="section-title">{session.sessionName}</h2>
                                        <p className="section-subtitle">Session Code: {session.sessionCode}</p>
                                    </div>
                                    <button
                                        className="btn-link"
                                        onClick={() => navigate(`/sessions/${session.id}`)}
                                    >
                                        View Details →
                                    </button>
                                </div>

                                <h3 className="subsection-title">Current Participants</h3>

                                <div className="table-container">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Student Name</th>
                                                <th>Focus %</th>
                                                <th>Status</th>
                                                <th>Warnings</th>
                                                <th>Network Status</th>
                                                <th>Extension Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(participants[session.id] || []).length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" className="empty-row">
                                                        No participants yet. Share the session code to get started.
                                                    </td>
                                                </tr>
                                            ) : (
                                                (participants[session.id] || []).map(participant => {
                                                    const status = getStatusBadge(participant.focusScore || 0);
                                                    const extensionStatus = getExtensionStatus(participant);
                                                    return (
                                                        <tr key={participant.id}>
                                                            <td>
                                                                <div className="participant-name">
                                                                    {participant.fullName || 'Unknown'}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className="focus-percentage">
                                                                    {participant.focusScore || 0}%
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <Badge variant={status.variant}>
                                                                    {status.label}
                                                                </Badge>
                                                            </td>
                                                            <td>
                                                                <span className="warning-count">
                                                                    {participant.violationCount || 0}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                {participant.networkStatus === 'offline' ? (
                                                                    <span className="network-status offline">
                                                                        📡 Offline
                                                                    </span>
                                                                ) : (
                                                                    <span className="network-status online">
                                                                        📡 Online
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <Badge variant={extensionStatus.variant}>
                                                                    {extensionStatus.label}
                                                                </Badge>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default LiveMonitoringOverview;
