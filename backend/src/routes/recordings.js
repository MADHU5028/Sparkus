import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { query } from '../config/database.js';
import { processRecording } from '../services/aiProcessor.js';
import { authenticateToken } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads/recordings');
        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});

const upload = multer({
    storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 100000000, // 100MB default
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['audio/webm', 'audio/mp4', 'audio/wav', 'audio/mpeg', 'video/webm'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only audio/video files are allowed.'));
        }
    },
});

// POST /api/recordings/upload - Upload audio recording
router.post('/upload', upload.single('audio'), async (req, res) => {
    try {
        const { sessionId } = req.body;

        if (!sessionId) {
            return res.status(400).json({ error: 'Session ID is required' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Create recording record
        const result = await query(
            `INSERT INTO recordings (session_id, audio_file_path, file_size, processing_status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING id, session_id, audio_file_path, processing_status, uploaded_at`,
            [sessionId, req.file.path, req.file.size]
        );

        const recording = result.rows[0];

        res.status(201).json({
            message: 'Recording uploaded successfully',
            recording: {
                id: recording.id,
                sessionId: recording.session_id,
                status: recording.processing_status,
                uploadedAt: recording.uploaded_at,
            },
        });
    } catch (error) {
        console.error('Upload recording error:', error);
        res.status(500).json({ error: 'Failed to upload recording' });
    }
});

// POST /api/recordings/:id/process - Trigger AI processing
router.post('/:id/process', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Get recording
        const result = await query(
            'SELECT * FROM recordings WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Recording not found' });
        }

        const recording = result.rows[0];

        if (recording.processing_status === 'processing') {
            return res.status(400).json({ error: 'Recording is already being processed' });
        }

        if (recording.processing_status === 'completed') {
            return res.status(400).json({ error: 'Recording has already been processed' });
        }

        // Update status to processing
        await query(
            'UPDATE recordings SET processing_status = $1 WHERE id = $2',
            ['processing', id]
        );

        // Process recording asynchronously
        processRecording(id, recording.audio_file_path, recording.session_id)
            .catch(error => {
                console.error('Recording processing failed:', error);
                query('UPDATE recordings SET processing_status = $1 WHERE id = $2', ['failed', id]);
            });

        res.json({
            message: 'Processing started',
            recordingId: id,
            status: 'processing',
        });
    } catch (error) {
        console.error('Process recording error:', error);
        res.status(500).json({ error: 'Failed to start processing' });
    }
});

// GET /api/recordings/:id/summary - Get AI summary
router.get('/:id/summary', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            `SELECT r.*, s.meeting_summary, s.key_topics, s.important_notes, 
              s.action_items, s.slide_contexts, s.generated_at
       FROM recordings r
       LEFT JOIN ai_summaries s ON r.id = s.recording_id
       WHERE r.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Recording not found' });
        }

        const data = result.rows[0];

        if (data.processing_status === 'pending' || data.processing_status === 'processing') {
            return res.json({
                status: data.processing_status,
                message: 'Recording is still being processed',
            });
        }

        if (data.processing_status === 'failed') {
            return res.status(500).json({
                status: 'failed',
                error: 'Recording processing failed',
            });
        }

        res.json({
            status: 'completed',
            recording: {
                id: data.id,
                sessionId: data.session_id,
                duration: data.audio_duration,
                processedAt: data.processed_at,
            },
            summary: {
                meetingSummary: data.meeting_summary,
                keyTopics: data.key_topics,
                importantNotes: data.important_notes,
                actionItems: data.action_items,
                slideContexts: data.slide_contexts,
                generatedAt: data.generated_at,
            },
        });
    } catch (error) {
        console.error('Get summary error:', error);
        res.status(500).json({ error: 'Failed to get summary' });
    }
});

// GET /api/recordings/session/:sessionId - Get recording for session
router.get('/session/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;

        const result = await query(
            'SELECT id, processing_status, uploaded_at, processed_at FROM recordings WHERE session_id = $1',
            [sessionId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No recording found for this session' });
        }

        res.json({
            recording: result.rows[0],
        });
    } catch (error) {
        console.error('Get session recording error:', error);
        res.status(500).json({ error: 'Failed to get recording' });
    }
});

export default router;
