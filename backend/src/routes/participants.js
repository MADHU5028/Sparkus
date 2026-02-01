import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// POST /api/participants/join - Join session with code
router.post('/join', async (req, res) => {
    try {
        const { sessionCode, fullName, rollNumber, email } = req.body;

        // Validation
        if (!sessionCode || !fullName || !rollNumber) {
            return res.status(400).json({ error: 'Session code, name, and roll number are required' });
        }

        // Check if session exists and is active
        const sessionResult = await query(
            'SELECT id, status FROM sessions WHERE session_code = $1',
            [sessionCode]
        );

        if (sessionResult.rows.length === 0) {
            return res.status(404).json({ error: 'Invalid session code' });
        }

        const session = sessionResult.rows[0];

        if (session.status !== 'active') {
            return res.status(400).json({ error: 'Session is not active' });
        }

        // Check if participant already joined
        const existingParticipant = await query(
            'SELECT id FROM participants WHERE session_id = $1 AND roll_number = $2',
            [session.id, rollNumber]
        );

        if (existingParticipant.rows.length > 0) {
            // Return existing participant
            return res.json({
                message: 'Already joined',
                participant: {
                    id: existingParticipant.rows[0].id,
                    sessionId: session.id,
                },
            });
        }

        // Create participant
        const result = await query(
            `INSERT INTO participants (session_id, full_name, roll_number, email, extension_active, last_heartbeat)
       VALUES ($1, $2, $3, $4, true, CURRENT_TIMESTAMP)
       RETURNING id, session_id, full_name, roll_number, final_focus_score, joined_at`,
            [session.id, fullName, rollNumber, email || null]
        );

        const participant = result.rows[0];

        res.status(201).json({
            message: 'Joined session successfully',
            participant: {
                id: participant.id,
                sessionId: participant.session_id,
                fullName: participant.full_name,
                rollNumber: participant.roll_number,
                focusScore: participant.final_focus_score,
                joinedAt: participant.joined_at,
            },
        });
    } catch (error) {
        console.error('Join session error:', error);
        res.status(500).json({ error: 'Failed to join session' });
    }
});

// GET /api/sessions/:id/participants - Get all participants in a session
router.get('/session/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;

        const result = await query(
            `SELECT id, full_name, roll_number, email, extension_active, 
              final_focus_score, attendance_status, network_issue_duration,
              last_heartbeat, joined_at
       FROM participants 
       WHERE session_id = $1
       ORDER BY roll_number ASC`,
            [sessionId]
        );

        res.json({
            participants: result.rows.map(p => ({
                id: p.id,
                fullName: p.full_name,
                rollNumber: p.roll_number,
                email: p.email,
                extensionActive: p.extension_active,
                focusScore: parseFloat(p.final_focus_score),
                attendanceStatus: p.attendance_status,
                networkIssueDuration: p.network_issue_duration,
                lastHeartbeat: p.last_heartbeat,
                joinedAt: p.joined_at,
            })),
        });
    } catch (error) {
        console.error('Get participants error:', error);
        res.status(500).json({ error: 'Failed to get participants' });
    }
});

// GET /api/participants/:id/report - Get individual participant report
router.get('/:id/report', async (req, res) => {
    try {
        const { id } = req.params;

        // Get participant details
        const participantResult = await query(
            `SELECT p.*, s.session_name, s.focus_threshold
       FROM participants p
       JOIN sessions s ON p.session_id = s.id
       WHERE p.id = $1`,
            [id]
        );

        if (participantResult.rows.length === 0) {
            return res.status(404).json({ error: 'Participant not found' });
        }

        const participant = participantResult.rows[0];

        // Get warnings
        const warningsResult = await query(
            `SELECT warning_type, warning_message, created_at
       FROM warnings
       WHERE participant_id = $1
       ORDER BY created_at ASC`,
            [id]
        );

        // Get violations (if exam mode)
        const violationsResult = await query(
            `SELECT violation_type, severity, created_at
       FROM violations
       WHERE participant_id = $1
       ORDER BY created_at ASC`,
            [id]
        );

        res.json({
            participant: {
                id: participant.id,
                fullName: participant.full_name,
                rollNumber: participant.roll_number,
                sessionName: participant.session_name,
                focusScore: parseFloat(participant.final_focus_score),
                attendanceStatus: participant.attendance_status,
                focusThreshold: participant.focus_threshold,
                networkIssueDuration: participant.network_issue_duration,
                joinedAt: participant.joined_at,
            },
            warnings: warningsResult.rows,
            violations: violationsResult.rows,
        });
    } catch (error) {
        console.error('Get participant report error:', error);
        res.status(500).json({ error: 'Failed to get participant report' });
    }
});

// POST /api/participants/:id/heartbeat - Update participant heartbeat
router.post('/:id/heartbeat', async (req, res) => {
    try {
        const { id } = req.params;

        await query(
            'UPDATE participants SET last_heartbeat = CURRENT_TIMESTAMP, extension_active = true WHERE id = $1',
            [id]
        );

        res.json({ message: 'Heartbeat updated' });
    } catch (error) {
        console.error('Heartbeat error:', error);
        res.status(500).json({ error: 'Failed to update heartbeat' });
    }
});

// GET /api/participants/history - Get session history for logged-in user
router.get('/history', authenticateToken, async (req, res) => {
    try {
        const { email } = req.user;

        if (!email) {
            return res.status(400).json({ error: 'User email not found' });
        }

        const result = await query(
            `SELECT p.id, p.joined_at, p.final_focus_score,
                    s.session_name, s.session_code, s.platform, s.status, s.created_at as session_date,
                    u.full_name as host_name
             FROM participants p
             JOIN sessions s ON p.session_id = s.id
             JOIN users u ON s.host_id = u.id
             WHERE p.email = $1
             ORDER BY p.joined_at DESC`,
            [email]
        );

        res.json({
            history: result.rows.map(row => ({
                participantId: row.id,
                joinedAt: row.joined_at,
                focusScore: parseFloat(row.final_focus_score),
                sessionName: row.session_name,
                sessionCode: row.session_code,
                platform: row.platform,
                status: row.status,
                sessionDate: row.session_date,
                hostName: row.host_name
            }))
        });
    } catch (error) {
        console.error('Get participant history error:', error);
        res.status(500).json({ error: 'Failed to get history' });
    }
});

export default router;
