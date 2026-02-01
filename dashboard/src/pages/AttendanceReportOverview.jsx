import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHostSessions } from '../api/sessions.js';
import { getSessionParticipants } from '../api/participants.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Sidebar, TopBar, Badge, ExportButton } from '../components';
import './AttendanceReportOverview.css';

const AttendanceReportOverview = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [attendanceChanges, setAttendanceChanges] = useState({});

    const fetchSessions = async () => {
        const userId = user?.id || user?.userId;
        if (!userId) {
            setLoading(false);
            return;
        }

        try {
            const data = await getHostSessions(userId);
            // Filter sessions that have ended or are active (ignoring just created empty ones if preferred, or show all)
            // Showing all for reports is usually better
            setSessions(data.sessions || []);
            // Auto-select the most recent session if available
            if (data.sessions && data.sessions.length > 0) {
                setSelectedSession(data.sessions[0]);
            }
        } catch (error) {
            console.error('Failed to fetch sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchSessions();
        }
    }, [user]);

    useEffect(() => {
        if (selectedSession) {
            fetchParticipants(selectedSession.id);
        }
    }, [selectedSession]);

    const fetchParticipants = async (sessionId) => {
        try {
            const result = await getSessionParticipants(sessionId);
            setParticipants(result.participants || []);
        } catch (error) {
            console.error('Failed to fetch participants:', error);
        }
    };

    const toggleAttendance = (participantId, currentStatus) => {
        setAttendanceChanges(prev => ({
            ...prev,
            [participantId]: currentStatus === 'present' ? 'absent' : 'present'
        }));
    };

    const getAttendanceStatus = (participant) => {
        if (attendanceChanges[participant.id]) {
            return attendanceChanges[participant.id];
        }
        // Determine based on focus score or connection status
        if (participant.focusScore > 0 || participant.status === 'active') {
            return 'present';
        }
        return 'absent';
    };

    const handleSaveChanges = async () => {
        // TODO: Implement API call to save attendance changes
        console.log('Saving attendance changes:', attendanceChanges);
        alert('Attendance changes saved!');
        setAttendanceChanges({});
    };

    const handleResetChanges = () => {
        setAttendanceChanges({});
    };

    const filteredParticipants = participants.filter(p =>
        p.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const presentCount = filteredParticipants.filter(p =>
        getAttendanceStatus(p) === 'present'
    ).length;
    const absentCount = filteredParticipants.length - presentCount;
    const avgFocus = filteredParticipants.length > 0
        ? Math.round(
            filteredParticipants.reduce((sum, p) => sum + (p.focusScore || 0), 0) /
            filteredParticipants.length
        )
        : 0;

    if (loading) {
        return <div className="loading-screen">Loading sessions...</div>;
    }

    if (sessions.length === 0) {
        return (
            <div className="dashboard-layout">
                <Sidebar />
                <div className="dashboard-main">
                    <TopBar title="Attendance Report" />
                    <div className="dashboard-content">
                        <div className="empty-state">
                            <h3>No Sessions Found</h3>
                            <p>Create a session to start tracking attendance</p>
                            <button className="btn-primary" onClick={() => navigate('/create-session')}>
                                ➕ Create Session
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <div className="dashboard-main">
                <TopBar
                    title={`Session Attendance Report: ${selectedSession?.sessionName || ''}`}
                    subtitle="Detailed overview of student attendance, focus metrics, and network stability for the session."
                    actions={
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            {selectedSession && (
                                <ExportButton
                                    sessionId={selectedSession.id}
                                    type="attendance"
                                />
                            )}
                            <button className="btn-primary" onClick={() => navigate('/create-session')}>
                                ➕ New Session
                            </button>
                        </div>
                    }
                />

                <div className="dashboard-content">
                    {/* Session Selector */}
                    {sessions.length > 1 && (
                        <div className="session-selector">
                            <label>Select Session:</label>
                            <select
                                value={selectedSession?.id || ''}
                                onChange={(e) => {
                                    const session = sessions.find(s => s.id === parseInt(e.target.value));
                                    setSelectedSession(session);
                                }}
                                className="session-select"
                            >
                                {sessions.map(session => (
                                    <option key={session.id} value={session.id}>
                                        {session.sessionName} - {new Date(session.createdAt).toLocaleDateString()}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Session Summary */}
                    <section className="summary-section">
                        <h2 className="section-title">Session Summary</h2>
                        <div className="summary-grid">
                            <div className="summary-card">
                                <div className="summary-label">Total Students</div>
                                <div className="summary-value">{filteredParticipants.length}</div>
                            </div>
                            <div className="summary-card">
                                <div className="summary-label">Present</div>
                                <div className="summary-value present">{presentCount}</div>
                            </div>
                            <div className="summary-card">
                                <div className="summary-label">Absent</div>
                                <div className="summary-value absent">{absentCount}</div>
                            </div>
                            <div className="summary-card">
                                <div className="summary-label">Avg. Focus</div>
                                <div className="summary-value">{avgFocus}%</div>
                            </div>
                        </div>
                    </section>

                    {/* Student Performance Details */}
                    <section className="performance-section">
                        <div className="section-header">
                            <h2 className="section-title">Student Performance Details</h2>
                            <div className="search-box">
                                <input
                                    type="text"
                                    placeholder="🔍 Search student..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="search-input"
                                />
                            </div>
                        </div>

                        <div className="table-container">
                            <table className="attendance-table">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Status</th>
                                        <th>Final Focus</th>
                                        <th>Network Downtime</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredParticipants.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="empty-row">
                                                No participants found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredParticipants.map(participant => {
                                            const status = getAttendanceStatus(participant);
                                            const hasChanges = attendanceChanges[participant.id];
                                            return (
                                                <tr key={participant.id} className={hasChanges ? 'modified' : ''}>
                                                    <td>
                                                        <div className="student-info">
                                                            <div className="student-avatar">
                                                                {participant.fullName?.charAt(0) || 'U'}
                                                            </div>
                                                            <span className="student-name">
                                                                {participant.fullName || 'Unknown'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="status-toggle">
                                                            <Badge
                                                                variant={status === 'present' ? 'success' : 'danger'}
                                                            >
                                                                {status === 'present' ? 'Present' : 'Absent'}
                                                            </Badge>
                                                            <label className="toggle-switch">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={status === 'present'}
                                                                    onChange={() => toggleAttendance(participant.id, status)}
                                                                />
                                                                <span className="toggle-slider"></span>
                                                            </label>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="focus-display">
                                                            <div className="focus-bar">
                                                                <div
                                                                    className="focus-fill"
                                                                    style={{ width: `${participant.focusScore || 0}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="focus-value">
                                                                {participant.focusScore || 0}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {participant.networkDowntime ? (
                                                            <span className="downtime-warning">
                                                                📡 {participant.networkDowntime} min
                                                            </span>
                                                        ) : (
                                                            <span className="downtime-none">None</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="btn-icon"
                                                            onClick={() => navigate(`/sessions/${selectedSession.id}/participant/${participant.id}`)}
                                                            title="View Details"
                                                        >
                                                            📋
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {Object.keys(attendanceChanges).length > 0 && (
                            <div className="action-buttons">
                                <button className="btn-secondary" onClick={handleResetChanges}>
                                    🔄 Reset Changes
                                </button>
                                <button className="btn-primary" onClick={handleSaveChanges}>
                                    💾 Save Changes
                                </button>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
};

export default AttendanceReportOverview;
