import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { calculateAttendance } from '../services/attendanceGenerator.js';

const router = express.Router();

// Helper to generate unique session code
const generateSessionCode = () => {
    return `SPARK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
};

// POST /api/sessions - Create new session
router.post('/', authenticateToken, async (req, res) => {
    try {
        const {
            sessionName,
            platform,
            focusTrackingEnabled,
            aiRecordingEnabled,
            examMonitoringEnabled,
            focusThreshold,
            focusUpdateInterval,
            warningLimit,
            allowedWebsites,
            tabSwitchingAllowed,
            splitScreenDuration,
            fullscreenMandatory,
            zeroToleranceMode,
            cameraEnforcement,
        } = req.body;

        const hostId = req.user.userId;

        // Generate unique session code
        let sessionCode;
        let codeExists = true;

        while (codeExists) {
            sessionCode = generateSessionCode();
            const check = await query('SELECT id FROM sessions WHERE session_code = $1', [sessionCode]);
            codeExists = check.rows.length > 0;
        }

        // Create session
        const result = await query(
            `INSERT INTO sessions (
        session_code, host_id, session_name, platform,
        focus_tracking_enabled, ai_recording_enabled, exam_monitoring_enabled,
        focus_threshold, focus_update_interval, warning_limit,
        allowed_websites, tab_switching_allowed, split_screen_duration,
        fullscreen_mandatory, zero_tolerance_mode, camera_enforcement
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
            [
                sessionCode, hostId, sessionName, platform,
                focusTrackingEnabled ?? true,
                aiRecordingEnabled ?? false,
                examMonitoringEnabled ?? false,
                focusThreshold ?? 70,
                focusUpdateInterval ?? 5,
                warningLimit ?? 3,
                allowedWebsites || [],
                tabSwitchingAllowed ?? false,
                splitScreenDuration ?? 0,
                fullscreenMandatory ?? false,
                zeroToleranceMode ?? false,
                cameraEnforcement ?? false,
            ]
        );

        const session = result.rows[0];

        // Real-time update
        const io = req.app.get('io');
        if (io) {
            io.to(`host:${hostId}`).emit('host:session_created', {
                session: {
                    id: session.id,
                    sessionCode: session.session_code,
                    sessionName: session.session_name,
                    platform: session.platform,
                    status: session.status,
                    participantCount: 0,
                    modes: {
                        focusTracking: session.focus_tracking_enabled,
                        aiRecording: session.ai_recording_enabled,
                        examMonitoring: session.exam_monitoring_enabled,
                    },
                    createdAt: session.created_at,
                }
            });
        }

        res.status(201).json({
            message: 'Session created successfully',
            session: {
                id: session.id,
                sessionCode: session.session_code,
                sessionName: session.session_name,
                platform: session.platform,
                status: session.status,
                settings: {
                    focusTrackingEnabled: session.focus_tracking_enabled,
                    aiRecordingEnabled: session.ai_recording_enabled,
                    examMonitoringEnabled: session.exam_monitoring_enabled,
                    focusThreshold: session.focus_threshold,
                    warningLimit: session.warning_limit,
                    allowedWebsites: session.allowed_websites,
                },
                createdAt: session.created_at,
            },
        });
    } catch (error) {
        console.error('Create session error:', error);
        res.status(500).json({ error: 'Failed to create session' });
    }
});

// GET /api/sessions/:id - Get session details
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            'SELECT * FROM sessions WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const session = result.rows[0];

        res.json({
            session: {
                id: session.id,
                sessionCode: session.session_code,
                sessionName: session.session_name,
                platform: session.platform,
                status: session.status,
                settings: {
                    focusTrackingEnabled: session.focus_tracking_enabled,
                    aiRecordingEnabled: session.ai_recording_enabled,
                    examMonitoringEnabled: session.exam_monitoring_enabled,
                    focusThreshold: session.focus_threshold,
                    focusUpdateInterval: session.focus_update_interval,
                    warningLimit: session.warning_limit,
                    allowedWebsites: session.allowed_websites,
                    tabSwitchingAllowed: session.tab_switching_allowed,
                    splitScreenDuration: session.split_screen_duration,
                    fullscreenMandatory: session.fullscreen_mandatory,
                    zeroToleranceMode: session.zero_tolerance_mode,
                    cameraEnforcement: session.camera_enforcement,
                },
                startedAt: session.started_at,
                endedAt: session.ended_at,
                createdAt: session.created_at,
            },
        });
    } catch (error) {
        console.error('Get session error:', error);
        res.status(500).json({ error: 'Failed to get session' });
    }
});

// GET /api/sessions/code/:code - Get session by code (for participants)
router.get('/code/:code', async (req, res) => {
    try {
        const { code } = req.params;

        const result = await query(
            `SELECT s.*, u.full_name as host_name 
       FROM sessions s 
       JOIN users u ON s.host_id = u.id 
       WHERE s.session_code = $1`,
            [code]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const session = result.rows[0];

        res.json({
            session: {
                id: session.id,
                sessionCode: session.session_code,
                sessionName: session.session_name,
                hostName: session.host_name,
                platform: session.platform,
                status: session.status,
                modes: {
                    focusTracking: session.focus_tracking_enabled,
                    aiRecording: session.ai_recording_enabled,
                    examMonitoring: session.exam_monitoring_enabled,
                },
                settings: {
                    focusThreshold: session.focus_threshold,
                    cameraEnforcement: session.camera_enforcement,
                    fullscreenMandatory: session.fullscreen_mandatory,
                },
            },
        });
    } catch (error) {
        console.error('Get session by code error:', error);
        res.status(500).json({ error: 'Failed to get session' });
    }
});

// GET /api/sessions/host/:hostId - Get all sessions for a host
router.get('/host/:hostId', authenticateToken, async (req, res) => {
    try {
        const { hostId } = req.params;

        // Verify user is requesting their own sessions
        if (parseInt(hostId) !== req.user.userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const result = await query(
            `SELECT id, session_code, session_name, platform, status, 
              focus_tracking_enabled, ai_recording_enabled, exam_monitoring_enabled,
              started_at, ended_at, created_at
       FROM sessions 
       WHERE host_id = $1 
       ORDER BY created_at DESC`,
            [hostId]
        );

        res.json({
            sessions: result.rows.map(s => ({
                id: s.id,
                sessionCode: s.session_code,
                sessionName: s.session_name,
                platform: s.platform,
                status: s.status,
                modes: {
                    focusTracking: s.focus_tracking_enabled,
                    aiRecording: s.ai_recording_enabled,
                    examMonitoring: s.exam_monitoring_enabled,
                },
                startedAt: s.started_at,
                endedAt: s.ended_at,
                createdAt: s.created_at,
            })),
        });
    } catch (error) {
        console.error('Get host sessions error:', error);
        res.status(500).json({ error: 'Failed to get sessions' });
    }
});

// POST /api/sessions/:id/start - Start session
router.post('/:id/start', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            `UPDATE sessions 
       SET status = 'active', started_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND host_id = $2 AND status = 'created'
       RETURNING *`,
            [id, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Session not found or already started' });
        }

        // Real-time update
        const io = req.app.get('io');
        if (io) {
            io.to(`host:${req.user.userId}`).emit('host:session_updated', {
                sessionId: id,
                status: 'active',
                startedAt: result.rows[0].started_at
            });
        }

        res.json({
            message: 'Session started',
            session: {
                id: result.rows[0].id,
                status: result.rows[0].status,
                startedAt: result.rows[0].started_at,
            },
        });
    } catch (error) {
        console.error('Start session error:', error);
        res.status(500).json({ error: 'Failed to start session' });
    }
});

// POST /api/sessions/:id/end - End session
router.post('/:id/end', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            `UPDATE sessions 
       SET status = 'ended', ended_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND host_id = $2 AND status = 'active'
       RETURNING *`,
            [id, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Session not found or not active' });
        }

        // Trigger attendance calculation
        await calculateAttendance(id);

        // Real-time update
        const io = req.app.get('io');
        if (io) {
            io.to(`host:${req.user.userId}`).emit('host:session_updated', {
                sessionId: id,
                status: 'ended',
                endedAt: result.rows[0].ended_at
            });
        }

        res.json({
            message: 'Session ended',
            session: {
                id: result.rows[0].id,
                status: result.rows[0].status,
                endedAt: result.rows[0].ended_at,
            },
        });
    } catch (error) {
        console.error('End session error:', error);
        res.status(500).json({ error: 'Failed to end session' });
    }
});

// DELETE /api/sessions/:id - Delete session
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            'DELETE FROM sessions WHERE id = $1 AND host_id = $2 RETURNING id',
            [id, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }

        res.json({ message: 'Session deleted successfully' });
    } catch (error) {
        console.error('Delete session error:', error);
        res.status(500).json({ error: 'Failed to delete session' });
    }
});

export default router;
