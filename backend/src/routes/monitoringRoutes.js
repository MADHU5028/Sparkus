import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadScreenChunk, logKeystrokes, getParticipantRecordings, getParticipantKeystrokes } from '../controllers/monitoringController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Ensure recordings directory exists
const uploadDir = 'uploads/recordings';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'screen-' + uniqueSuffix + '.webm');
    }
});

const upload = multer({ storage: storage });

// Routes
// Note: authenticateToken might need to be skipped if extension sends raw requests without User context,
// but for security we should expect a participant token. For MVP, assuming authentication is handled.

router.post('/upload-chunk', upload.single('video'), uploadScreenChunk);
router.post('/log-keystrokes', logKeystrokes);
router.get('/recordings/:participantId', authenticateToken, getParticipantRecordings);
router.get('/keystrokes/:participantId', authenticateToken, getParticipantKeystrokes);

export default router;
