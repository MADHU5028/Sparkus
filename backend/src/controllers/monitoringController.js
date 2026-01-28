import { query } from '../config/database.js';

export const uploadScreenChunk = async (req, res) => {
    try {
        const { sessionId, participantId, chunkIndex, duration } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No video file provided' });
        }

        // In a real app, upload to S3 here. 
        // For MVP, we use the local path served via static middleware.
        const fileUrl = `/uploads/recordings/${file.filename}`;

        await query(
            `INSERT INTO screen_recordings 
            (session_id, participant_id, chunk_index, file_url, duration_seconds)
            VALUES ($1, $2, $3, $4, $5)`,
            [sessionId, participantId, chunkIndex, fileUrl, duration || 10]
        );

        res.json({ success: true, url: fileUrl });
    } catch (error) {
        console.error('Screen Upload Error:', error);
        res.status(500).json({ error: error.message });
    }
};

export const logKeystrokes = async (req, res) => {
    try {
        const { sessionId, participantId, metrics } = req.body;
        // metrics: { wpm, dwellTimeAvg, flightTimeAvg, backspaceCount }

        await query(
            `INSERT INTO keystroke_logs 
            (session_id, participant_id, wpm, dwell_time_avg, flight_time_avg, backspace_count)
            VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                sessionId,
                participantId,
                metrics.wpm,
                metrics.dwellTimeAvg,
                metrics.flightTimeAvg,
                metrics.backspaceCount
            ]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Keystroke Log Error:', error);
        res.status(500).json({ error: error.message });
    }
};

export const getParticipantRecordings = async (req, res) => {
    try {
        const { participantId } = req.params;
        const result = await query(
            'SELECT * FROM screen_recordings WHERE participant_id = $1 ORDER BY chunk_index ASC',
            [participantId]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getParticipantKeystrokes = async (req, res) => {
    try {
        const { participantId } = req.params;
        const result = await query(
            'SELECT * FROM keystroke_logs WHERE participant_id = $1 ORDER BY created_at ASC',
            [participantId]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
