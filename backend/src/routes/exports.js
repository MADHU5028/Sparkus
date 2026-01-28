import express from 'express';
import { query } from '../config/database.js';
import { generateAttendancePDF } from '../services/pdfGenerator.js';
import { generateAttendanceCSV } from '../utils/csvGenerator.js';
import { sendReportEmail } from '../services/emailService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Helper to fetch session data
async function getSessionData(sessionId) {
    const sessionRes = await query('SELECT * FROM sessions WHERE id = $1', [sessionId]);
    if (sessionRes.rows.length === 0) throw new Error('Session not found');

    const participantsRes = await query(
        'SELECT * FROM participants WHERE session_id = $1 ORDER BY full_name',
        [sessionId]
    );

    return { session: sessionRes.rows[0], participants: participantsRes.rows };
}

// Export Attendance PDF
router.get('/attendance/:sessionId/pdf', authenticateToken, async (req, res) => {
    try {
        const { session, participants } = await getSessionData(req.params.sessionId);
        const pdfBuffer = generateAttendancePDF(session, participants); // Returns ArrayBuffer

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=attendance_${session.session_code}.pdf`);
        res.send(Buffer.from(pdfBuffer));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Export Attendance CSV
router.get('/attendance/:sessionId/csv', authenticateToken, async (req, res) => {
    try {
        const { session, participants } = await getSessionData(req.params.sessionId);
        const csv = generateAttendanceCSV(session, participants);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=attendance_${session.session_code}.csv`);
        res.send(csv);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Email Report
router.post('/email', authenticateToken, async (req, res) => {
    try {
        const { sessionId, email, format = 'pdf' } = req.body;
        const { session, participants } = await getSessionData(sessionId);

        let fileBuffer;
        if (format === 'csv') {
            const csv = generateAttendanceCSV(session, participants);
            fileBuffer = Buffer.from(csv);
        } else {
            const ab = generateAttendancePDF(session, participants);
            fileBuffer = Buffer.from(ab);
        }

        const success = await sendReportEmail(
            email || req.user.email,
            `Sparkus Attendance Report: ${session.session_name}`,
            session.session_name,
            fileBuffer,
            format
        );

        if (success) {
            res.json({ message: 'Email sent successfully' });
        } else {
            res.status(500).json({ error: 'Failed to send email' });
        }
    } catch (error) {
        console.error("Email API Error:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
