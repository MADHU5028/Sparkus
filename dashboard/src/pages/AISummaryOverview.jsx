import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHostSessions } from '../api/sessions.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Sidebar, TopBar, Badge } from '../components';
import './AISummaryOverview.css';

const AISummaryOverview = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSessions();
    }, [user]);

    const fetchSessions = async () => {
        const userId = user?.id || user?.userId;
        if (!userId) {
            setLoading(false);
            return;
        }

        try {
            const data = await getHostSessions(userId);
            // Filter sessions that have AI summary enabled
            const aiSessions = data.sessions.filter(s => s.modes?.aiRecording);
            setSessions(aiSessions);

            // Auto-select the most recent session
            if (aiSessions.length > 0) {
                setSelectedSession(aiSessions[0]);
            }
        } catch (error) {
            console.error('Failed to fetch sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadSummary = () => {
        // TODO: Implement download functionality
        alert('Downloading summary...');
    };

    const handleShareRecording = () => {
        // TODO: Implement share functionality
        alert('Share recording link copied!');
    };

    const handleSaveWhiteboard = () => {
        // TODO: Implement save whiteboard functionality
        alert('Whiteboard saved!');
    };

    if (loading) {
        return <div className="loading-screen">Loading AI summaries...</div>;
    }

    if (sessions.length === 0) {
        return (
            <div className="dashboard-layout">
                <Sidebar />
                <div className="dashboard-main">
                    <TopBar title="AI Summary & Recording" />
                    <div className="dashboard-content">
                        <div className="empty-state">
                            <h3>No AI Summaries Available</h3>
                            <p>Enable AI recording when creating a session to get automated summaries</p>
                            <button className="btn-primary" onClick={() => navigate('/create-session')}>
                                ➕ Create Session with AI
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
                    title="AI-Powered Session Summary:"
                    subtitle={`"${selectedSession?.sessionName || ''}" - ${selectedSession?.createdAt ? new Date(selectedSession.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}`}
                    actions={
                        <div className="summary-actions">
                            <button className="btn-secondary" onClick={handleDownloadSummary}>
                                📥 Download
                            </button>
                            <button className="btn-secondary" onClick={handleShareRecording}>
                                📤 Share via Email
                            </button>
                            <button className="btn-primary" onClick={handleSaveWhiteboard}>
                                💾 Save as Whiteboard
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

                    {/* Meeting Summary */}
                    <section className="summary-card">
                        <h2 className="section-title">Meeting Summary</h2>
                        <p className="summary-text">
                            This session provided a comprehensive introduction to Data Science, covering its core concepts, key methodologies, and practical applications. The discussion emphasized the importance of data literacy in today's digital age and outlined the typical workflow of a data science project, from data collection to model deployment. Participants engaged with foundational statistical concepts and explored real-world applications of data science techniques.
                        </p>
                    </section>

                    {/* Topics Covered */}
                    <section className="summary-card">
                        <h2 className="section-title">Topics Covered</h2>
                        <div className="topics-list">
                            <div className="topic-item">
                                <input type="checkbox" checked readOnly />
                                <span>Definition and Scope of Data Science</span>
                            </div>
                            <div className="topic-item">
                                <input type="checkbox" checked readOnly />
                                <span>Phases of a Data Science Project (Concept CRISP-DM)</span>
                            </div>
                            <div className="topic-item">
                                <input type="checkbox" checked readOnly />
                                <span>Introduction to Statistical Concepts (Mean, Median, Standard Deviation)</span>
                            </div>
                            <div className="topic-item">
                                <input type="checkbox" checked readOnly />
                                <span>Overview of Machine Learning Algorithms (Supervised vs. Unsupervised)</span>
                            </div>
                            <div className="topic-item">
                                <input type="checkbox" checked readOnly />
                                <span>Data Collection and Preprocessing Techniques</span>
                            </div>
                            <div className="topic-item">
                                <input type="checkbox" checked readOnly />
                                <span>Ethical Considerations in Data Science and AI</span>
                            </div>
                        </div>
                    </section>

                    {/* Notes & Action Items */}
                    <section className="summary-card">
                        <h2 className="section-title">Notes & Action Items</h2>

                        <div className="notes-section">
                            <h3 className="subsection-title">📝 Key Notes</h3>
                            <ul className="notes-list">
                                <li>Data Science is an interdisciplinary field combining statistics, computer science, and domain expertise.</li>
                                <li>The CRISP-DM methodology provides a structured approach to data science projects.</li>
                                <li>Understanding statistical concepts is fundamental for effective data analysis.</li>
                                <li>
                                    <span className="highlight">
                                        Machine learning algorithms can be categorized into supervised (e.g., linear regression, classification) and unsupervised (e.g., clustering) types.
                                    </span>
                                </li>
                            </ul>
                        </div>

                        <div className="action-items-section">
                            <h3 className="subsection-title">✅ Action Items</h3>
                            <ul className="action-list">
                                <li>Review the CRISP-DM methodology diagram. Students: Understanding, Data Understanding, Data Preparation, Modeling, Evaluation, Deployment.</li>
                                <li>Explore introductory Python libraries for data science: Pandas, NumPy, Scikit-learn.</li>
                                <li>Complete hands-on learning exercises as a practice dataset.</li>
                                <li>Research ethical guidelines for data privacy and algorithmic bias.</li>
                                <li>Identify a small personal project to apply learned concepts.</li>
                            </ul>
                        </div>
                    </section>

                    {/* Visual Aids */}
                    <section className="summary-card">
                        <h2 className="section-title">Visual Aids (Slides & Whiteboards)</h2>
                        <div className="visual-grid">
                            <div className="visual-card">
                                <div className="visual-placeholder">
                                    <div className="placeholder-icon">🖼️</div>
                                    <div className="placeholder-text">Slide 1: Data Science Lifecycle</div>
                                </div>
                                <p className="visual-caption">
                                    Slide 1 overview of the Data Science Lifecycle. The visual will illustrate the iterative process of a data science project, emphasizing the cyclical nature of data collection, analysis, and deployment.
                                </p>
                            </div>

                            <div className="visual-card">
                                <div className="visual-placeholder">
                                    <div className="placeholder-icon">📊</div>
                                    <div className="placeholder-text">Whiteboard: Statistical Concepts</div>
                                </div>
                                <p className="visual-caption">
                                    Slide 2: Whiteboard of fundamental ML concepts using this. This slide shows examples of mean, median, and standard deviation calculations, helping students visualize the importance of these metrics in data analysis.
                                </p>
                            </div>

                            <div className="visual-card">
                                <div className="visual-placeholder">
                                    <div className="placeholder-icon">🤖</div>
                                    <div className="placeholder-text">Slide 3: ML Algorithms</div>
                                </div>
                                <p className="visual-caption">
                                    Slide 3: Comparison of Supervised vs. Unsupervised Learning. This visual shows examples of supervised learning (classification and regression) and unsupervised learning (clustering and dimensionality reduction).
                                </p>
                            </div>

                            <div className="visual-card">
                                <div className="visual-placeholder">
                                    <div className="placeholder-icon">🔍</div>
                                    <div className="placeholder-text">Slide 4: Data Preprocessing</div>
                                </div>
                                <p className="visual-caption">
                                    Slide 4: Data preprocessing techniques. This visual demonstrates common data cleaning tasks like handling missing values, data normalization, and feature engineering, showcasing best practices for preparing data.
                                </p>
                            </div>
                        </div>
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

export default AISummaryOverview;
