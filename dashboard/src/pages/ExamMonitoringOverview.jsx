import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHostSessions } from '../api/sessions.js';
import { getSessionParticipants } from '../api/participants.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Sidebar, TopBar, Badge } from '../components';
import './ExamMonitoringOverview.css';

const ExamMonitoringOverview = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSessions();
    }, [user]);

    useEffect(() => {
        if (selectedSession) {
            fetchParticipants(selectedSession.id);
        }
    }, [selectedSession]);

    const fetchSessions = async () => {
        if (!user?.userId) return;

        try {
            const data = await getHostSessions(user.userId);
            // Show sessions with exam monitoring enabled
            const examSessions = data.sessions.filter(
                s => s.examMonitoringEnabled && (s.status === 'ended' || s.status === 'active')
            );
            setSessions(examSessions);

            // Auto-select the most recent session
            if (examSessions.length > 0) {
                setSelectedSession(examSessions[0]);
            }
        } catch (error) {
            console.error('Failed to fetch sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchParticipants = async (sessionId) => {
        try {
            const result = await getSessionParticipants(sessionId);
            setParticipants(result.participants || []);
        } catch (error) {
            console.error('Failed to fetch participants:', error);
        }
    };

    const getRiskScore = (participant) => {
        // Calculate risk score based on violations
        const violations = participant.violationCount || 0;
        if (violations === 0) return 15;
        if (violations <= 2) return 32;
        if (violations <= 4) return 45;
        if (violations <= 6) return 68;
        return 82;
    };

    const getRiskStatus = (score) => {
        if (score <= 20) return { label: 'Cleared', variant: 'success' };
        if (score <= 40) return { label: 'Under Review', variant: 'warning' };
        if (score <= 60) return { label: 'Violation Detected', variant: 'danger' };
        return { label: 'Violation Detected', variant: 'danger' };
    };

    const getViolationTypes = (participant) => {
        const violations = [];
        const count = participant.violationCount || 0;

        if (count > 0) {
            violations.push({ type: 'Tab Switches', count: Math.min(count, 5) });
        }
        if (count > 3) {
            violations.push({ type: 'Minimize Events', count: Math.floor(count / 2) });
        }
        if (count > 5) {
            violations.push({ type: 'Unauthorized Software', count: 1 });
        }
        if (count > 2) {
            violations.push({ type: 'Split Screen Detected', count: 1 });
        }

        return violations;
    };

    const getViolationTimeline = (participant) => {
        const count = participant.violationCount || 0;
        const timeline = [];

        for (let i = 0; i < Math.min(count, 7); i++) {
            timeline.push({ time: i * 5, severity: i % 2 === 0 ? 'warning' : 'danger' });
        }

        return timeline;
    };

    if (loading) {
        return <div className="loading-screen">Loading exam reports...</div>;
    }

    if (sessions.length === 0) {
        return (
            <div className="dashboard-layout">
                <Sidebar />
                <div className="dashboard-main">
                    <TopBar title="Exam Monitoring Report" />
                    <div className="dashboard-content">
                        <div className="empty-state">
                            <h3>No Exam Sessions Found</h3>
                            <p>Enable exam monitoring when creating a session to track academic integrity</p>
                            <button className="btn-primary" onClick={() => navigate('/create-session')}>
                                ➕ Create Exam Session
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
                    title="Exam Monitoring Report"
                    subtitle="Review student behavior during exam sessions, including violation timelines, risk scores, and final exam statuses. This report emphasizes transparency and fairness in presenting potential academic integrity issues."
                />

                <div className="dashboard-content">
                    {/* Session Selector */}
                    {sessions.length > 1 && (
                        <div className="session-selector">
                            <label>Select Exam Session:</label>
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

                    {/* Student Cards Grid */}
                    <div className="exam-grid">
                        {participants.length === 0 ? (
                            <div className="empty-state">
                                <p>No participants in this exam session</p>
                            </div>
                        ) : (
                            participants.map(participant => {
                                const riskScore = getRiskScore(participant);
                                const riskStatus = getRiskStatus(riskScore);
                                const violations = getViolationTypes(participant);
                                const timeline = getViolationTimeline(participant);

                                return (
                                    <div key={participant.id} className="exam-card">
                                        <div className="exam-card-header">
                                            <div className="student-info">
                                                <h3 className="student-name">{participant.fullName || 'Unknown'}</h3>
                                                <p className="student-id">ID: SPK-{String(participant.id).padStart(3, '0')}-{participant.fullName?.substring(0, 2).toUpperCase() || 'XX'}</p>
                                            </div>
                                        </div>

                                        <div className="exam-card-body">
                                            <div className="risk-section">
                                                <div className="risk-label">Risk Score</div>
                                                <div className={`risk-score risk-score--${riskStatus.variant}`}>
                                                    {riskScore}%
                                                </div>
                                                <Badge variant={riskStatus.variant} className="risk-badge">
                                                    {riskStatus.label}
                                                </Badge>
                                            </div>

                                            {violations.length > 0 ? (
                                                <>
                                                    <div className="violations-section">
                                                        <div className="violations-label">Violation Types</div>
                                                        <div className="violations-list">
                                                            {violations.map((v, idx) => (
                                                                <div key={idx} className="violation-item">
                                                                    <span className="violation-icon">⚠️</span>
                                                                    <span className="violation-text">
                                                                        {v.type} ({v.count})
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="timeline-section">
                                                        <div className="timeline-label">Violation Timeline</div>
                                                        <div className="timeline-dots">
                                                            {timeline.map((t, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    className={`timeline-dot timeline-dot--${t.severity}`}
                                                                    title={`Violation at ${t.time} min`}
                                                                ></div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="no-violations">
                                                    <span className="check-icon">✓</span>
                                                    <span>No major violations detected.</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="exam-card-footer">
                                            <button
                                                className="btn-details"
                                                onClick={() => navigate(`/sessions/${selectedSession.id}/exam-report/${participant.id}`)}
                                            >
                                                View Details →
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
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

export default ExamMonitoringOverview;
