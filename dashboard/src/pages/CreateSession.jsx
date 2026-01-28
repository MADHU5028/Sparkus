import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { createSession, startSession } from '../api/sessions.js';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import Modal from '../components/common/Modal.jsx';
import toast from 'react-hot-toast';
import './CreateSession.css';

const CreateSession = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [createdSession, setCreatedSession] = useState(null);
    const [formData, setFormData] = useState({
        sessionName: '',
        platform: 'google_meet',
        focusTrackingEnabled: true,
        focusThreshold: 70,
        focusUpdateInterval: 5,
        warningLimit: 3,
        aiRecordingEnabled: false,
        examMonitoringEnabled: false,
        allowedWebsites: '',
        tabSwitchingAllowed: false,
        fullscreenMandatory: false,
        cameraEnforcement: false,
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const sessionData = {
                ...formData,
                focusThreshold: parseInt(formData.focusThreshold),
                focusUpdateInterval: parseInt(formData.focusUpdateInterval),
                warningLimit: parseInt(formData.warningLimit),
                allowedWebsites: formData.allowedWebsites
                    ? formData.allowedWebsites.split(',').map(s => s.trim()).filter(Boolean)
                    : [],
            };

            const data = await createSession(sessionData);
            setCreatedSession(data.session);
            setShowModal(true);
            toast.success('Session created successfully!');
        } catch (error) {
            toast.error(error.message || 'Failed to create session');
        } finally {
            setLoading(false);
        }
    };

    const handleStartSession = async () => {
        try {
            await startSession(createdSession.id);
            toast.success('Session started!');
            navigate(`/sessions/${createdSession.id}`);
        } catch (error) {
            toast.error('Failed to start session');
        }
    };

    const copySessionCode = () => {
        navigator.clipboard.writeText(createdSession.sessionCode);
        toast.success('Session code copied!');
    };

    return (
        <div className="create-session">
            <div className="page-header">
                <h1>Create New Session</h1>
                <p>Configure your session settings and generate a code for participants</p>
            </div>

            <form onSubmit={handleSubmit}>
                <Card className="form-section">
                    <h2>Basic Information</h2>

                    <div className="form-group">
                        <label htmlFor="sessionName">Session Name *</label>
                        <input
                            type="text"
                            id="sessionName"
                            name="sessionName"
                            value={formData.sessionName}
                            onChange={handleChange}
                            placeholder="e.g., Data Structures - Lecture 5"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="platform">Platform *</label>
                        <select
                            id="platform"
                            name="platform"
                            value={formData.platform}
                            onChange={handleChange}
                            required
                        >
                            <option value="google_meet">Google Meet</option>
                            <option value="zoom">Zoom</option>
                        </select>
                    </div>
                </Card>

                <Card className="form-section">
                    <h2>Focus Tracking Settings</h2>

                    <div className="checkbox-group">
                        <input
                            type="checkbox"
                            id="focusTrackingEnabled"
                            name="focusTrackingEnabled"
                            checked={formData.focusTrackingEnabled}
                            onChange={handleChange}
                        />
                        <label htmlFor="focusTrackingEnabled">Enable Focus Tracking</label>
                    </div>

                    {formData.focusTrackingEnabled && (
                        <>
                            <div className="form-group">
                                <label htmlFor="focusThreshold">
                                    Focus Threshold (%) - Minimum score for "Present" status
                                </label>
                                <input
                                    type="number"
                                    id="focusThreshold"
                                    name="focusThreshold"
                                    value={formData.focusThreshold}
                                    onChange={handleChange}
                                    min="0"
                                    max="100"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="warningLimit">Warning Limit</label>
                                <input
                                    type="number"
                                    id="warningLimit"
                                    name="warningLimit"
                                    value={formData.warningLimit}
                                    onChange={handleChange}
                                    min="1"
                                    max="10"
                                />
                            </div>
                        </>
                    )}
                </Card>

                <Card className="form-section">
                    <h2>Advanced Options</h2>

                    <div className="checkbox-group">
                        <input
                            type="checkbox"
                            id="aiRecordingEnabled"
                            name="aiRecordingEnabled"
                            checked={formData.aiRecordingEnabled}
                            onChange={handleChange}
                        />
                        <label htmlFor="aiRecordingEnabled">Enable AI Recording & Summaries</label>
                    </div>

                    <div className="checkbox-group">
                        <input
                            type="checkbox"
                            id="examMonitoringEnabled"
                            name="examMonitoringEnabled"
                            checked={formData.examMonitoringEnabled}
                            onChange={handleChange}
                        />
                        <label htmlFor="examMonitoringEnabled">Enable Exam Monitoring Mode</label>
                    </div>

                    <div className="checkbox-group">
                        <input
                            type="checkbox"
                            id="cameraEnforcement"
                            name="cameraEnforcement"
                            checked={formData.cameraEnforcement}
                            onChange={handleChange}
                        />
                        <label htmlFor="cameraEnforcement">Require Camera On</label>
                    </div>

                    <div className="checkbox-group">
                        <input
                            type="checkbox"
                            id="fullscreenMandatory"
                            name="fullscreenMandatory"
                            checked={formData.fullscreenMandatory}
                            onChange={handleChange}
                        />
                        <label htmlFor="fullscreenMandatory">Require Fullscreen</label>
                    </div>
                </Card>

                <div className="form-actions">
                    <Button type="button" variant="secondary" onClick={() => navigate('/dashboard')}>
                        Cancel
                    </Button>
                    <Button type="submit" loading={loading}>
                        Create Session
                    </Button>
                </div>
            </form>

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Session Created!"
                size="md"
            >
                <div className="session-created-modal">
                    <div className="success-icon">✅</div>
                    <h3>Your session is ready!</h3>

                    <div className="session-code-display">
                        <div className="code-label">Session Code</div>
                        <div className="code-value-large">{createdSession?.sessionCode}</div>
                        <Button variant="secondary" size="sm" onClick={copySessionCode}>
                            📋 Copy Code
                        </Button>
                    </div>

                    <p className="modal-instructions">
                        Share this code with participants to join the session
                    </p>

                    <div className="modal-actions">
                        <Button variant="secondary" onClick={() => navigate('/dashboard')}>
                            Back to Dashboard
                        </Button>
                        <Button onClick={handleStartSession}>
                            Start Session Now
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default CreateSession;
