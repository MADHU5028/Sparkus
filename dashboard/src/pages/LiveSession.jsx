import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSession, endSession } from '../api/sessions.js';
import { getSessionParticipants } from '../api/participants.js';
import { useSocket } from '../context/SocketContext.jsx';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import Loader from '../components/common/Loader.jsx';
import { getFocusColor, formatPercentage } from '../utils/formatters.js';
import toast from 'react-hot-toast';
import './LiveSession.css';

const LiveSession = () => {
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
        warnings: 0,
    });
    const [networkStatuses, setNetworkStatuses] = useState({}); // participantId -> 'online'/'offline'
    const [violations, setViolations] = useState({}); // participantId -> count

    useEffect(() => {
        fetchSessionData();
        connect();
    }, [id]);

    useEffect(() => {
        if (!socket || !connected) return;

        console.log('🔌 Socket connected, joining session:', id);

        // Join session room
        socket.emit('host:join', { sessionId: id });

        // Listen for participant updates (match backend event names)
        socket.on('participant:connected', handleParticipantJoined);
        socket.on('participant:disconnected', handleParticipantLeft);
        socket.on('focus:updated', handleFocusUpdated);
        socket.on('network:status', handleNetworkStatus);
        socket.on('violation:logged', handleViolation);

        // Debug listener
        socket.on('host:joined', (data) => {
            console.log('✅ Host joined session:', data);
        });

        return () => {
            socket.off('participant:connected');
            socket.off('participant:disconnected');
            socket.off('focus:updated');
            socket.off('network:status');
            socket.off('violation:logged');
            socket.off('host:joined');
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

        setStats({ total, active, avgFocus, warnings: 0 });
    };

    const handleParticipantJoined = (data) => {
        console.log('👤 Participant connected:', data);

        // Add participant to list immediately (don't refetch)
        setParticipants(prev => {
            // Check if participant already exists
            const exists = prev.find(p => p.id === data.participantId);
            if (exists) {
                console.log('Participant already in list, updating...');
                return prev.map(p => p.id === data.participantId ? {
                    ...p,
                    fullName: data.fullName,
                    rollNumber: data.rollNumber,
                    focusScore: data.focusScore,
                    extensionActive: true,
                } : p);
            }

            // Add new participant
            return [...prev, {
                id: data.participantId,
                fullName: data.fullName,
                rollNumber: data.rollNumber,
                focusScore: data.focusScore || 100,
                extensionActive: true,
            }];
        });

        // Set network status
        setNetworkStatuses(prev => ({ ...prev, [data.participantId]: 'online' }));

        toast.success(`${data.fullName} joined the session`);
    };

    const handleParticipantLeft = (data) => {
        console.log('👋 Participant disconnected:', data);
        setParticipants(prev => prev.filter(p => p.id !== data.participantId));
        toast.info('Participant disconnected');
    };

    const handleFocusUpdated = (data) => {
        console.log('📊 Focus updated:', data);
        setParticipants(prev =>
            prev.map(p =>
                p.id === data.participantId
                    ? {
                        ...p,
                        focusScore: data.focusScore,
                        extensionActive: true,
                    }
                    : p
            )
        );
    };

    const handleNetworkStatus = (data) => {
        console.log('🌐 Network status:', data);
        setNetworkStatuses(prev => ({ ...prev, [data.participantId]: data.status }));

        if (data.status === 'offline') {
            toast.error(`${data.fullName} lost connection`);
        } else {
            toast.success(`${data.fullName} reconnected`);
        }
    };

    const handleViolation = (data) => {
        console.log('🚨 Violation logged:', data);
        setViolations(prev => ({
            ...prev,
            [data.participantId]: (prev[data.participantId] || 0) + 1
        }));

        toast.warning(`${data.fullName}: ${data.violationType} (-${data.penaltyApplied}%)`);
    };

    const handleEndSession = async () => {
        if (!confirm('Are you sure you want to end this session?')) return;

        try {
            await endSession(id);
            toast.success('Session ended');
            navigate('/dashboard');
        } catch (error) {
            toast.error('Failed to end session');
        }
    };

    if (loading) {
        return <Loader fullScreen />;
    }

    return (
        <div className="live-session">
            <div className="session-header">
                <div>
                    <h1>{session?.sessionName}</h1>
                    <div className="session-info">
                        <span className="info-badge">🟢 Active</span>
                        <span className="info-divider">•</span>
                        <span className="info-text">Code: {session?.sessionCode}</span>
                    </div>
                </div>
                <div className="header-actions">
                    <Button variant="danger" onClick={handleEndSession}>
                        End Session
                    </Button>
                </div>
            </div>

            <div className="stats-row">
                <Card className="stat-box">
                    <div className="stat-value">{stats.total}</div>
                    <div className="stat-label">Total Participants</div>
                </Card>
                <Card className="stat-box">
                    <div className="stat-value">{stats.active}</div>
                    <div className="stat-label">Active Now</div>
                </Card>
                <Card className="stat-box">
                    <div className="stat-value">{formatPercentage(stats.avgFocus, 0)}</div>
                    <div className="stat-label">Average Focus</div>
                </Card>
            </div>

            <Card className="participants-section">
                <h2>Participants ({participants.length})</h2>

                {participants.length === 0 ? (
                    <div className="empty-participants">
                        <div className="empty-icon">👥</div>
                        <p>No participants yet</p>
                        <p className="empty-hint">Share the session code with students to get started</p>
                    </div>
                ) : (
                    <div className="participants-table">
                        <div className="table-header">
                            <div className="col-name">Name</div>
                            <div className="col-roll">Roll Number</div>
                            <div className="col-focus">Focus Score</div>
                            <div className="col-network">Network</div>
                            <div className="col-violations">Violations</div>
                            <div className="col-status">Status</div>
                        </div>
                        {participants.map((participant) => (
                            <div key={participant.id} className="table-row">
                                <div className="col-name">
                                    <div className="participant-avatar">
                                        {participant.fullName.charAt(0).toUpperCase()}
                                    </div>
                                    {participant.fullName}
                                </div>
                                <div className="col-roll">{participant.rollNumber}</div>
                                <div className="col-focus">
                                    <div className="focus-bar-container">
                                        <div
                                            className="focus-bar"
                                            style={{
                                                width: `${participant.focusScore || 0}%`,
                                                background: getFocusColor(participant.focusScore || 0),
                                            }}
                                        ></div>
                                    </div>
                                    <span className="focus-value">
                                        {formatPercentage(participant.focusScore || 0, 0)}
                                    </span>
                                </div>
                                <div className="col-network">
                                    <span style={{ fontSize: '20px' }}>
                                        {networkStatuses[participant.id] === 'offline' ? '🔴' : '🟢'}
                                    </span>
                                </div>
                                <div className="col-violations">
                                    <span className="violations-count">
                                        {violations[participant.id] || 0}
                                    </span>
                                </div>
                                <div className="col-status">
                                    <span
                                        className={`status-badge ${participant.extensionActive ? 'status-active' : 'status-inactive'
                                            }`}
                                    >
                                        {participant.extensionActive ? '🟢 Active' : '⚫ Offline'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
};

export default LiveSession;
