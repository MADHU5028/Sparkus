import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSession } from '../api/sessions.js';
import { getSessionParticipants } from '../api/participants.js';
import { Sidebar, TopBar, Badge, ProgressBar } from '../components';
import toast from 'react-hot-toast';
import './AttendanceReport.css';

const AttendanceReport = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [session, setSession] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [attendanceOverride, setAttendanceOverride] = useState({});

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const [sessionData, participantsData] = await Promise.all([
                getSession(id),
                getSessionParticipants(id),
            ]);

            setSession(sessionData.session);
            setParticipants(participantsData.participants || []);
        } catch (error) {
            toast.error('Failed to load attendance report');
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const toggleAttendance = (participantId) => {
        setAttendanceOverride(prev => ({
            ...prev,
            [participantId]: !prev[participantId]
        }));
    };

    const getAttendanceStatus = (participant) => {
        // Check if there's a manual override
        if (attendanceOverride[participant.id] !== undefined) {
            return attendanceOverride[participant.id] ? 'Present' : 'Absent';
        }
        // Otherwise use focus score
        return (participant.focusScore || 0) >= 70 ? 'Present' : 'Absent';
    };

    const exportReport = () => {
        // Create CSV
        const headers = ['Name', 'Email', 'Focus Score', 'Status', 'Join Time', 'Leave Time'];
        const rows = participants.map(p => [
            p.fullName || 'Unknown',
            p.email || 'N/A',
            `${p.focusScore || 0}%`,
            getAttendanceStatus(p),
            p.joinedAt ? new Date(p.joinedAt).toLocaleString() : 'N/A',
            p.leftAt ? new Date(p.leftAt).toLocaleString() : 'Still Active'
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance-${session?.sessionName || 'report'}.csv`;
        a.click();
        toast.success('Report exported!');
    };

    const shareReport = () => {
        toast.success('Share functionality coming soon!');
    };

    const presentCount = participants.filter(p => getAttendanceStatus(p) === 'Present').length;
    const absentCount = participants.length - presentCount;
    const attendanceRate = participants.length > 0
        ? Math.round((presentCount / participants.length) * 100)
        : 0;

    if (loading) {
        return <div className="loading-screen">Loading report...</div>;
    }

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <div className="dashboard-main">
                <TopBar
                    title="Attendance Report"
                    subtitle={session?.sessionName || ''}
                    actions={
                        <div className="report-actions">
                            <button className="btn-secondary" onClick={exportReport}>
                                📥 Export CSV
                            </button>
                            <button className="btn-primary" onClick={shareReport}>
                                🔗 Share
                            </button>
                        </div>
                    }
                />

                <div className="dashboard-content">
                    {/* Summary Stats */}
                    <section className="report-stats">
                        <div className="stat-card-report">
                            <div className="stat-header">
                                <span className="stat-icon">👥</span>
                                <span className="stat-label">Total Students</span>
                            </div>
                            <div className="stat-value-large">{participants.length}</div>
                        </div>

                        <div className="stat-card-report stat-card-report--success">
                            <div className="stat-header">
                                <span className="stat-icon">✓</span>
                                <span className="stat-label">Present</span>
                            </div>
                            <div className="stat-value-large">{presentCount}</div>
                        </div>

                        <div className="stat-card-report stat-card-report--danger">
                            <div className="stat-header">
                                <span className="stat-icon">✗</span>
                                <span className="stat-label">Absent</span>
                            </div>
                            <div className="stat-value-large">{absentCount}</div>
                        </div>

                        <div className="stat-card-report stat-card-report--primary">
                            <div className="stat-header">
                                <span className="stat-icon">📊</span>
                                <span className="stat-label">Attendance Rate</span>
                            </div>
                            <div className="stat-value-large">{attendanceRate}%</div>
                        </div>
                    </section>

                    {/* Attendance Table */}
                    <section className="attendance-section">
                        <h2 className="section-title">Student Attendance</h2>

                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Focus Score</th>
                                        <th>Status</th>
                                        <th>Override</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {participants.map(participant => {
                                        const status = getAttendanceStatus(participant);
                                        return (
                                            <tr key={participant.id}>
                                                <td>
                                                    <div className="participant-name">
                                                        {participant.fullName || 'Unknown'}
                                                    </div>
                                                </td>
                                                <td>{participant.email || 'N/A'}</td>
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
                                                    {status === 'Present' ? (
                                                        <Badge variant="success">Present</Badge>
                                                    ) : (
                                                        <Badge variant="danger">Absent</Badge>
                                                    )}
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn-override"
                                                        onClick={() => toggleAttendance(participant.id)}
                                                    >
                                                        {attendanceOverride[participant.id] !== undefined
                                                            ? '🔄 Reset'
                                                            : '✏️ Override'}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default AttendanceReport;
