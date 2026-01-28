import { query } from '../config/database.js';

// Calculate attendance for all participants in a session
export async function calculateAttendance(sessionId) {
    try {
        console.log(`Calculating attendance for session ${sessionId}...`);

        // Get session threshold
        const sessionResult = await query(
            'SELECT focus_threshold FROM sessions WHERE id = $1',
            [sessionId]
        );

        if (sessionResult.rows.length === 0) {
            throw new Error('Session not found');
        }

        const threshold = sessionResult.rows[0].focus_threshold;

        // Get all participants
        const participantsResult = await query(
            'SELECT id, final_focus_score FROM participants WHERE session_id = $1',
            [sessionId]
        );

        // Update attendance status for each participant
        for (const participant of participantsResult.rows) {
            const focusScore = parseFloat(participant.final_focus_score);
            const attendanceStatus = focusScore >= threshold ? 'present' : 'absent';

            await query(
                'UPDATE participants SET attendance_status = $1 WHERE id = $2',
                [attendanceStatus, participant.id]
            );
        }

        console.log(`✅ Attendance calculated for ${participantsResult.rows.length} participants`);

        return {
            success: true,
            participantCount: participantsResult.rows.length,
            threshold,
        };
    } catch (error) {
        console.error('Attendance calculation error:', error);
        throw error;
    }
}

// Get attendance summary for a session
export async function getAttendanceSummary(sessionId) {
    try {
        const result = await query(
            `SELECT 
        COUNT(*) FILTER (WHERE attendance_status = 'present') as present_count,
        COUNT(*) FILTER (WHERE attendance_status = 'absent') as absent_count,
        COUNT(*) as total_count,
        AVG(final_focus_score) as average_focus
       FROM participants
       WHERE session_id = $1`,
            [sessionId]
        );

        const summary = result.rows[0];

        return {
            presentCount: parseInt(summary.present_count) || 0,
            absentCount: parseInt(summary.absent_count) || 0,
            totalCount: parseInt(summary.total_count) || 0,
            averageFocus: summary.average_focus ? parseFloat(summary.average_focus) : 0,
        };
    } catch (error) {
        console.error('Get attendance summary error:', error);
        throw error;
    }
}
