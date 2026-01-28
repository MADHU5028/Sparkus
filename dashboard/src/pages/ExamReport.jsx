import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSession } from '../api/sessions.js';
import { getSessionParticipants } from '../api/participants.js';
import { Sidebar, TopBar, Badge } from '../components';
import toast from 'react-hot-toast';
import './ExamReport.css';

const ExamReport = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [session, setSession] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);

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
            // Add mock violation data
            const participantsWithViolations = (participantsData.participants || []).map(p => ({
                ...p,
                violations: [
                    { type: 'Tab Switch', count: Math.floor(Math.random() * 5), severity: 'medium' },
                    { type: 'Window Minimize', count: Math.floor(Math.random() * 3), severity: 'high' },
                    { type: 'Split Screen', count: Math.floor(Math.random() * 2), severity: 'high' },
                    { type: 'Network Issue', count: Math.floor(Math.random() * 2), severity: 'low' }
                ].filter(v => v.count > 0)
            }));
            setParticipants(participantsWithViolations);
        } catch (error) {
            toast.error('Failed to load exam report');
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const exportReport = () => {
        const headers = ['Name', 'Email', 'Total Violations', 'High Severity', 'Status'];
        const rows = participants.map(p => {
            const totalViolations = p.violations.reduce((sum, v) => sum + v.count, 0);
            const highSeverity = p.violations.filter(v => v.severity === 'high').reduce((sum, v) => sum + v.count, 0);
            const status = highSeverity >= 3 ? 'Flagged' : 'Clear';
            return [
                p.fullName || 'Unknown',
                p.email || 'N/A',
                totalViolations,
                highSeverity,
                status
            ];
        });

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `exam-report-${session?.sessionName || 'report'}.csv`;
        a.click();
        toast.success('Report exported!');
    };

    const flaggedCount = participants.filter(p =>
        p.violations.filter(v => v.severity === 'high').reduce((sum, v) => sum + v.count, 0) >= 3
    ).length;

    if (loading) {
        return <div className="loading-screen">Loading exam report...</div>;
    }

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <div className="dashboard-main">
                <TopBar
                    title="Exam Monitoring Report"
                    subtitle={session?.sessionName || ''}
                    actions={
                        <button className="btn-primary" onClick={exportReport}>
                            📥 Export Report
                        </button>
                    }
                />

                <div className="dashboard-content">
                    {/* Alert Banner */}
                    {flaggedCount > 0 && (
                        <div className="alert-banner">
                            <span className="alert-icon">⚠️</span>
                            <div className="alert-content">
                                <strong>{flaggedCount} student{flaggedCount > 1 ? 's' : ''} flagged</strong>
                                <p>High-severity violations detected. Review recommended.</p>
                            </div>
                        </div>
                    )}

                    {/* Violations Table */}
                    <section className="exam-section">
                        <h2 className="section-title">Violation Summary</h2>

                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Email</th>
                                        <th>Violations</th>
                                        <th>Status</th>
                                        <th>Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {participants.map(participant => {
                                        const totalViolations = participant.violations.reduce((sum, v) => sum + v.count, 0);
                                        const highSeverity = participant.violations.filter(v => v.severity === 'high').reduce((sum, v) => sum + v.count, 0);
                                        const isFlagged = highSeverity >= 3;

                                        return (
                                            <tr key={participant.id} className={isFlagged ? 'row-flagged' : ''}>
                                                <td>
                                                    <div className="participant-name">
                                                        {participant.fullName || 'Unknown'}
                                                    </div>
                                                </td>
                                                <td>{participant.email || 'N/A'}</td>
                                                <td>
                                                    <div className="violations-cell">
                                                        {participant.violations.map((v, i) => (
                                                            <div key={i} className="violation-badge">
                                                                <Badge
                                                                    variant={v.severity === 'high' ? 'danger' : v.severity === 'medium' ? 'warning' : 'default'}
                                                                    size="sm"
                                                                >
                                                                    {v.type}: {v.count}
                                                                </Badge>
                                                            </div>
                                                        ))}
                                                        {participant.violations.length === 0 && (
                                                            <span className="no-violations">None</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    {isFlagged ? (
                                                        <Badge variant="danger">🚩 Flagged</Badge>
                                                    ) : (
                                                        <Badge variant="success">✓ Clear</Badge>
                                                    )}
                                                </td>
                                                <td>
                                                    <button className="btn-details">
                                                        View →
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

export default ExamReport;
