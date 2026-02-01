import express from 'express';
import { query } from '../config/database.js';
import { calculateFocusScore } from '../services/focusCalculator.js';

const router = express.Router();

// POST /api/focus/event - Receive focus event from extension
router.post('/event', async (req, res) => {
    try {
        const {
            participantId,
            sessionId,
            eventType,
            isLookingAtScreen,
            isTabActive,
            isWindowVisible,
            currentUrl,
            networkStable,
            duration, // Duration of violation in seconds
            penalty, // Custom penalty (optional)
            unauthorizedUrl,
            violations = [], // Aggregated violations
            focusScore: clientFocusScore, // Score calculated by client
        } = req.body;

        // Validation
        if (!participantId || !sessionId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Get current focus score and participant details
        const participantResult = await query(
            'SELECT final_focus_score, full_name, roll_number FROM participants WHERE id = $1',
            [participantId]
        );

        if (participantResult.rows.length === 0) {
            return res.status(404).json({ error: 'Participant not found' });
        }

        const participant = participantResult.rows[0];
        // Use client score if provided, else use current DB score (and calc delta?)
        // The client loop sends the absolute NEW score.
        let newFocusScore = clientFocusScore !== undefined ? parseFloat(clientFocusScore) : parseFloat(participant.final_focus_score);

        // Safety bounds
        newFocusScore = Math.max(0, Math.min(100, newFocusScore));

        // Handle network issues separately (don't penalize focus)
        if (eventType === 'network_issue_detected' || networkStable === false) {
            // ... [Existing Network Logic] ...
            // For brevity, I will re-include it or referencing it, but replacing the whole block is safer.
            // Actually, the replaced block includes the network logic?
            // No, I need to keep the network logic.
        }

        // [Network Logic Start]
        if (eventType === 'network_issue_detected' || networkStable === false) {
            // Log network issue
            await query(
                `INSERT INTO network_logs (participant_id, session_id, event_type)
                 VALUES ($1, $2, 'offline')`,
                [participantId, sessionId]
            );

            // Get Socket.IO instance
            const io = req.app.get('io');
            if (io) {
                io.to(`session:${sessionId}`).emit('network:status', {
                    participantId,
                    fullName: participant.full_name,
                    rollNumber: participant.roll_number,
                    status: 'offline',
                    timestamp: new Date(),
                });
            }

            return res.json({
                success: true,
                focusScore: newFocusScore, // Use the new score (likely unchanged if just network)
                networkIssue: true,
            });
        }

        if (eventType === 'network_issue_resolved') {
            // [Existing Network Resolved Logic] ...
            // Since I can't "include" existing code in replace_file_content easily without copying it,
            // I will implement it fully here.

            // Update network log with duration
            const lastOfflineResult = await query(
                `SELECT id, timestamp FROM network_logs
                 WHERE participant_id = $1 AND event_type = 'offline'
                 ORDER BY timestamp DESC LIMIT 1`,
                [participantId]
            );

            if (lastOfflineResult.rows.length > 0) {
                const offlineLog = lastOfflineResult.rows[0];
                const offlineDuration = Math.floor((new Date() - new Date(offlineLog.timestamp)) / 1000);

                await query(
                    `INSERT INTO network_logs (participant_id, session_id, event_type, duration)
                     VALUES ($1, $2, 'restored', $3)`,
                    [participantId, sessionId, offlineDuration]
                );

                await query(
                    `UPDATE participants 
                     SET network_issue_duration = network_issue_duration + $1
                     WHERE id = $2`,
                    [offlineDuration, participantId]
                );
            }

            const io = req.app.get('io');
            if (io) {
                io.to(`session:${sessionId}`).emit('network:status', {
                    participantId,
                    fullName: participant.full_name,
                    rollNumber: participant.roll_number,
                    status: 'online',
                    timestamp: new Date(),
                });
            }

            return res.json({
                success: true,
                focusScore: newFocusScore,
                networkRestored: true,
            });
        }
        // [Network Logic End]

        // Update participant's focus score
        await query(
            'UPDATE participants SET final_focus_score = $1, last_heartbeat = CURRENT_TIMESTAMP WHERE id = $2',
            [newFocusScore, participantId]
        );

        // Log focus event to history (Primary Update)
        if (eventType === 'focus_update') {
            await query(
                `INSERT INTO focus_events (
                    participant_id, session_id, event_type, focus_score,
                    is_looking_at_screen, is_tab_active, is_window_visible,
                    current_url, network_stable
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [
                    participantId,
                    sessionId,
                    eventType,
                    newFocusScore,
                    isLookingAtScreen ?? null,
                    isTabActive ?? null,
                    isWindowVisible ?? null,
                    currentUrl || null,
                    networkStable ?? true,
                ]
            );
        }

        // Process Aggregated Violations
        if (violations && violations.length > 0) {
            for (const v of violations) {
                await query(
                    `INSERT INTO violations (
                        participant_id, session_id, violation_type, severity, context_data
                    ) VALUES ($1, $2, $3, $4, $5)`,
                    [
                        participantId,
                        sessionId,
                        v.type,
                        'medium', // Default severity
                        JSON.stringify(v)
                    ]
                );
            }

            // Increment violation count
            await query(
                'UPDATE participants SET violations_count = violations_count + $1 WHERE id = $2',
                [violations.length, participantId]
            );
        }

        // Get Socket.IO instance for real-time updates
        const io = req.app.get('io');

        // Emit real-time focus update
        if (io) {
            // Re-calculate status based on score
            // We assume helpers calculateRiskLevel/calculateStatus are available or we verify
            // For now, simple logic map
            const riskLevel = newFocusScore < 50 ? 'high' : (newFocusScore < 70 ? 'medium' : 'low');
            const status = newFocusScore < 70 ? 'distracted' : 'focused';

            io.to(`session:${sessionId}`).emit('focus:updated', {
                participantId,
                fullName: participant.full_name,
                rollNumber: participant.roll_number,
                focusScore: newFocusScore,
                riskLevel,
                status,
                isLookingAtScreen,
                isTabActive,
                isWindowVisible,
                networkStable,
                violations: violations,
                timestamp: new Date(),
            });
        }

        res.json({
            success: true,
            focusScore: newFocusScore,
        });
    } catch (error) {
        console.error('Focus event error:', error);
        res.status(500).json({ error: 'Failed to process focus event' });
    }
});

// Helper function to check if warning should be issued
async function checkForWarning(participantId, sessionId, eventType, focusScore) {
    // Get session warning limit
    const sessionResult = await query(
        'SELECT warning_limit, focus_threshold FROM sessions WHERE id = $1',
        [sessionId]
    );

    if (sessionResult.rows.length === 0) return null;

    const { warning_limit, focus_threshold } = sessionResult.rows[0];

    // Count recent warnings
    const warningCount = await query(
        `SELECT COUNT(*) as count FROM warnings 
     WHERE participant_id = $1 AND created_at > NOW() - INTERVAL '5 minutes'`,
        [participantId]
    );

    const recentWarnings = parseInt(warningCount.rows[0].count);

    // Determine if warning should be issued
    let shouldWarn = null;

    if (eventType === 'tab_switch' || eventType === 'minimize' || eventType === 'eye_away') {
        if (recentWarnings < warning_limit) {
            // Issue warning
            const warningMessage = getWarningMessage(eventType, focusScore, focus_threshold);

            await query(
                'INSERT INTO warnings (participant_id, session_id, warning_type, warning_message) VALUES ($1, $2, $3, $4)',
                [participantId, sessionId, eventType, warningMessage]
            );

            shouldWarn = {
                type: eventType,
                message: warningMessage,
                warningCount: recentWarnings + 1,
                maxWarnings: warning_limit,
            };
        }
    }

    return shouldWarn;
}

// Helper function to generate warning messages
function getWarningMessage(eventType, focusScore, threshold) {
    const messages = {
        tab_switch: `⚠️ Please stay focused on the meeting. Tab switching detected. Current focus: ${focusScore.toFixed(0)}%`,
        minimize: `⚠️ Please keep the meeting window visible. Current focus: ${focusScore.toFixed(0)}%`,
        eye_away: `⚠️ Please look at the screen. Current focus: ${focusScore.toFixed(0)}%`,
        unauthorized_website: `⚠️ Unauthorized website detected. Please return to allowed content.`,
    };

    return messages[eventType] || `⚠️ Please stay focused. Further distractions will reduce your attendance score.`;
}

// GET /api/focus/session/:sessionId - Get focus data for session
router.get('/session/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;

        const result = await query(
            `SELECT 
        p.id as participant_id,
        p.full_name,
        p.roll_number,
        p.final_focus_score,
        COUNT(fe.id) as event_count,
        AVG(fe.focus_score) as avg_focus
       FROM participants p
       LEFT JOIN focus_events fe ON p.id = fe.participant_id
       WHERE p.session_id = $1
       GROUP BY p.id, p.full_name, p.roll_number, p.final_focus_score
       ORDER BY p.roll_number ASC`,
            [sessionId]
        );

        res.json({
            focusData: result.rows.map(row => ({
                participantId: row.participant_id,
                fullName: row.full_name,
                rollNumber: row.roll_number,
                currentFocus: parseFloat(row.final_focus_score),
                averageFocus: row.avg_focus ? parseFloat(row.avg_focus) : 100,
                eventCount: parseInt(row.event_count),
            })),
        });
    } catch (error) {
        console.error('Get focus data error:', error);
        res.status(500).json({ error: 'Failed to get focus data' });
    }
});

export default router;
