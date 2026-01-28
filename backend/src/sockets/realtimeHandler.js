import { query } from '../config/database.js';
import { calculateRiskLevel, calculateStatus } from '../services/focusCalculator.js';
import Notification from '../models/Notification.js';

// Helper to create and broadcast notification
async function createAndEmitNotification(io, { userId, type, message, metadata, sessionId }) {
    try {
        // 1. Save to DB
        const notification = await Notification.create({
            userId,
            type,
            message,
            metadata
        });

        // 2. Emit to specific user room (if they are connected)
        // We assume hosts join a room like `user:${userId}` upon login/connection?
        // Current implementation joins `host:${hostId}` in `host:join`.
        io.to(`host:${userId}`).emit('notification:new', notification);

        // Also emit to session room if generic, but notifications are personal.
        // So `host:${userId}` is correct.
    } catch (error) {
        console.error('Error creating notification:', error);
    }
}

// Initialize Socket.io event handlers
export function initializeSocketHandlers(io) {
    io.on('connection', (socket) => {
        console.log(`🔌 Client connected: ${socket.id}`);

        // Host joins session room
        socket.on('host:join', async (data) => {
            const { sessionId, hostId } = data;
            console.log(`Host ${hostId} joined session ${sessionId}`);

            socket.join(`session:${sessionId}`);
            socket.join(`host:${hostId}`); // Join personal host room

            socket.emit('host:joined', { sessionId });
        });

        // Participant joins session room
        socket.on('participant:join', async (data) => {
            const { sessionId, participantId } = data;
            console.log(`✅ Participant ${participantId} joined session ${sessionId}`);

            socket.join(`session:${sessionId}`);
            socket.participantId = participantId;
            socket.sessionId = sessionId;

            try {
                // Fetch full participant data
                const participantResult = await query(
                    `SELECT p.id, p.full_name, p.roll_number, p.final_focus_score, 
                            p.extension_active, p.joined_at, s.host_id, s.session_name
                     FROM participants p
                     JOIN sessions s ON p.session_id = s.id
                     WHERE p.id = $1`,
                    [participantId]
                );

                if (participantResult.rows.length > 0) {
                    const participant = participantResult.rows[0];

                    // Notify host and all clients in session that participant joined
                    io.to(`session:${sessionId}`).emit('participant:connected', {
                        participantId: participant.id,
                        fullName: participant.full_name,
                        rollNumber: participant.roll_number,
                        focusScore: parseFloat(participant.final_focus_score),
                        status: 'active',
                        networkStatus: 'online',
                        warningsCount: 0,
                        violationsCount: 0,
                        timestamp: new Date(),
                    });

                    // Create Notification for Host
                    await createAndEmitNotification(io, {
                        userId: participant.host_id,
                        type: 'info',
                        message: `${participant.full_name} joined session ${participant.session_name}`,
                        metadata: { sessionId, participantId },
                        sessionId // unused in function but kept for consistency
                    });

                    console.log(`📢 Broadcast participant:connected for ${participant.full_name}`);
                }

                socket.emit('participant:joined', { sessionId, participantId });
            } catch (error) {
                console.error('Error fetching participant data:', error);
                socket.emit('participant:joined', { sessionId, participantId });
            }
        });

        // Real-time focus update from participant
        socket.on('focus:update', async (data) => {
            const {
                participantId,
                sessionId,
                focusScore,
                isLookingAtScreen,
                isTabActive,
                isWindowVisible,
                networkStable,
            } = data;

            try {
                // Get participant details
                const participantResult = await query(
                    'SELECT full_name, roll_number FROM participants WHERE id = $1',
                    [participantId]
                );

                if (participantResult.rows.length === 0) return;

                const participant = participantResult.rows[0];
                const riskLevel = calculateRiskLevel(focusScore);
                const status = calculateStatus(focusScore, isTabActive);

                // Broadcast to host dashboard
                io.to(`session:${sessionId}`).emit('focus:updated', {
                    participantId,
                    fullName: participant.full_name,
                    rollNumber: participant.roll_number,
                    focusScore,
                    riskLevel,
                    status,
                    isLookingAtScreen,
                    isTabActive,
                    isWindowVisible,
                    networkStable,
                    timestamp: new Date(),
                });
            } catch (error) {
                console.error('Focus update broadcast error:', error);
            }
        });

        // Warning issued to participant
        socket.on('warning:issue', async (data) => {
            const { participantId, sessionId, warningType, message } = data;

            try {
                // Broadcast warning to specific participant
                io.to(`session:${sessionId}`).emit('warning:received', {
                    participantId,
                    warningType,
                    message,
                    timestamp: new Date(),
                });

                // Also notify host
                io.to(`session:${sessionId}`).emit('participant:warned', {
                    participantId,
                    warningType,
                    timestamp: new Date(),
                });

                // Fetch session host to send notification
                const sessionResult = await query('SELECT host_id, session_name FROM sessions WHERE id = $1', [sessionId]);
                const participantResult = await query('SELECT full_name FROM participants WHERE id = $1', [participantId]);

                if (sessionResult.rows.length > 0 && participantResult.rows.length > 0) {
                    const hostId = sessionResult.rows[0].host_id;
                    const participantName = participantResult.rows[0].full_name;

                    await createAndEmitNotification(io, {
                        userId: hostId,
                        type: 'warning',
                        message: `Warning issued to ${participantName}: ${warningType}`,
                        metadata: { sessionId, participantId, warningType }
                    });
                }

            } catch (e) {
                console.error("Error handing warning:", e);
            }
        });

        // Violation logged (exam mode)
        socket.on('violation:log', async (data) => {
            const { participantId, sessionId, violationType, severity } = data;

            try {
                // Broadcast to host
                io.to(`session:${sessionId}`).emit('violation:logged', {
                    participantId,
                    violationType,
                    severity,
                    timestamp: new Date(),
                });

                // Fetch session host to send notification
                const sessionResult = await query('SELECT host_id, session_name FROM sessions WHERE id = $1', [sessionId]);
                const participantResult = await query('SELECT full_name FROM participants WHERE id = $1', [participantId]);

                if (sessionResult.rows.length > 0 && participantResult.rows.length > 0) {
                    const hostId = sessionResult.rows[0].host_id;
                    const participantName = participantResult.rows[0].full_name;

                    // Only notify for high severity or critical violations
                    await createAndEmitNotification(io, {
                        userId: hostId,
                        type: 'error', // Use error type for violations/high severity
                        message: `Violation detected for ${participantName}: ${violationType}`,
                        metadata: { sessionId, participantId, violationType, severity }
                    });
                }
            } catch (e) {
                console.error("Error logging violation:", e);
            }
        });

        // Participant disconnected
        socket.on('disconnect', async () => {
            console.log(`🔌 Client disconnected: ${socket.id}`);

            if (socket.participantId && socket.sessionId) {
                // Mark participant as inactive
                await query(
                    'UPDATE participants SET extension_active = false WHERE id = $1',
                    [socket.participantId]
                );

                // Notify host
                io.to(`session:${socket.sessionId}`).emit('participant:disconnected', {
                    participantId: socket.participantId,
                    timestamp: new Date(),
                });
            }
        });

        // Session ended by host
        socket.on('session:end', async (data) => {
            const { sessionId } = data;

            // Broadcast to all participants
            io.to(`session:${sessionId}`).emit('session:ended', {
                sessionId,
                timestamp: new Date(),
            });

            console.log(`Session ${sessionId} ended`);
        });
    });

    return io;
}
