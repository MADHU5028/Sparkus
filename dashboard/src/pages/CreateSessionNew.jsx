import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { createSession, startSession } from '../api/sessions.js';
import { Sidebar, TopBar } from '../components';
import Toggle from '../components/Toggle.jsx';
import Slider from '../components/Slider.jsx';
import toast from 'react-hot-toast';
import './CreateSessionNew.css';

const CreateSessionNew = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        sessionName: '',
        platform: 'zoom',
        estimatedParticipants: 50,
        // Monitoring Modes
        focusTrackingEnabled: true,
        aiRecordingEnabled: false,
        examMonitoringEnabled: false,
        // Rule Configuration
        focusThreshold: 75,
        allowedWebsites: '',
        tabSwitchLimit: 5,
        minimizeWindowLimit: 2,
        splitScreenDetection: true,
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleToggle = (name) => {
        setFormData({
            ...formData,
            [name]: !formData[name],
        });
    };

    const handleSliderChange = (name, value) => {
        setFormData({
            ...formData,
            [name]: parseInt(value),
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const sessionData = {
                sessionName: formData.sessionName,
                platform: formData.platform,
                focusTrackingEnabled: formData.focusTrackingEnabled,
                aiRecordingEnabled: formData.aiRecordingEnabled,
                examMonitoringEnabled: formData.examMonitoringEnabled,
                focusThreshold: formData.focusThreshold,
                allowedWebsites: formData.allowedWebsites
                    ? formData.allowedWebsites.split(',').map(s => s.trim()).filter(Boolean)
                    : [],
                tabSwitchLimit: formData.tabSwitchLimit,
                minimizeWindowLimit: formData.minimizeWindowLimit,
                splitScreenDetection: formData.splitScreenDetection,
            };

            const data = await createSession(sessionData);
            toast.success('Session created successfully!');

            // Start session immediately
            await startSession(data.session.id);
            toast.success(`Session started! Code: ${data.session.sessionCode}`);
            navigate(`/sessions/${data.session.id}`);
        } catch (error) {
            toast.error(error.message || 'Failed to create session');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <div className="dashboard-main">
                <TopBar title="Create New Session" />

                <div className="dashboard-content">
                    <form onSubmit={handleSubmit} className="create-session-form">
                        {/* Session Details */}
                        <section className="form-section">
                            <h2 className="section-title">Session Details</h2>
                            <p className="section-subtitle">Basic information about your monitoring session.</p>

                            <div className="form-card">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="sessionName">Session Name</label>
                                        <input
                                            type="text"
                                            id="sessionName"
                                            name="sessionName"
                                            value={formData.sessionName}
                                            onChange={handleChange}
                                            placeholder="e.g., Spring 2024 Exam Review"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="platform">Meeting Platform</label>
                                        <select
                                            id="platform"
                                            name="platform"
                                            value={formData.platform}
                                            onChange={handleChange}
                                        >
                                            <option value="zoom">Zoom</option>
                                            <option value="google_meet">Google Meet</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="estimatedParticipants">Estimated Participants</label>
                                    <input
                                        type="number"
                                        id="estimatedParticipants"
                                        name="estimatedParticipants"
                                        value={formData.estimatedParticipants}
                                        onChange={handleChange}
                                        min="1"
                                        max="1000"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Monitoring Modes */}
                        <section className="form-section">
                            <h2 className="section-title">Monitoring Modes</h2>
                            <p className="section-subtitle">Select the monitoring capabilities for this session.</p>

                            <div className="form-card">
                                <Toggle
                                    id="focusTrackingEnabled"
                                    checked={formData.focusTrackingEnabled}
                                    onChange={() => handleToggle('focusTrackingEnabled')}
                                    label="Focus Tracking"
                                    description="Monitors student attention and engagement levels."
                                />

                                <Toggle
                                    id="aiRecordingEnabled"
                                    checked={formData.aiRecordingEnabled}
                                    onChange={() => handleToggle('aiRecordingEnabled')}
                                    label="AI Recording"
                                    description="Records session for AI summary and content generation."
                                />

                                <Toggle
                                    id="examMonitoringEnabled"
                                    checked={formData.examMonitoringEnabled}
                                    onChange={() => handleToggle('examMonitoringEnabled')}
                                    label="Exam Monitoring"
                                    description="Detects potential academic dishonesty during exams."
                                />
                            </div>
                        </section>

                        {/* Rule Configuration */}
                        <section className="form-section">
                            <h2 className="section-title">Rule Configuration</h2>
                            <p className="section-subtitle">Set specific rules for the active monitoring modes.</p>

                            <div className="form-card">
                                <Slider
                                    id="focusThreshold"
                                    label="Focus Threshold"
                                    value={formData.focusThreshold}
                                    onChange={(e) => handleSliderChange('focusThreshold', e.target.value)}
                                    min={0}
                                    max={100}
                                    unit="%"
                                    helpText="Minimum focus score required to be marked as 'Present'"
                                />

                                <div className="form-group">
                                    <label htmlFor="allowedWebsites">Allowed Websites (Whitelist)</label>
                                    <input
                                        type="text"
                                        id="allowedWebsites"
                                        name="allowedWebsites"
                                        value={formData.allowedWebsites}
                                        onChange={handleChange}
                                        placeholder="e.g., wikipedia.org, docs.google.com"
                                    />
                                    <p className="input-help">Comma-separated list of allowed domains</p>
                                    {formData.allowedWebsites && (
                                        <div className="tag-list">
                                            {formData.allowedWebsites.split(',').map((site, i) => (
                                                <span key={i} className="tag">{site.trim()}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <Slider
                                    id="tabSwitchLimit"
                                    label="Tab Switch Limit"
                                    value={formData.tabSwitchLimit}
                                    onChange={(e) => handleSliderChange('tabSwitchLimit', e.target.value)}
                                    min={0}
                                    max={20}
                                    helpText="Maximum allowed tab switches before warning"
                                />

                                <Slider
                                    id="minimizeWindowLimit"
                                    label="Minimize Window Limit"
                                    value={formData.minimizeWindowLimit}
                                    onChange={(e) => handleSliderChange('minimizeWindowLimit', e.target.value)}
                                    min={0}
                                    max={10}
                                    helpText="Maximum allowed window minimizations"
                                />

                                <Toggle
                                    id="splitScreenDetection"
                                    checked={formData.splitScreenDetection}
                                    onChange={() => handleToggle('splitScreenDetection')}
                                    label="Split Screen Detection"
                                    description="Detect when students use split-screen mode"
                                />
                            </div>
                        </section>

                        {/* Actions */}
                        <div className="form-actions">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => navigate('/dashboard')}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={loading}
                            >
                                {loading ? 'Creating...' : 'Create Session'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateSessionNew;
