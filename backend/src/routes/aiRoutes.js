import express from 'express';
import multer from 'multer';
import { generateSummary, getSummary } from '../controllers/aiController.js';
import { authenticateToken } from '../middleware/auth.js';
import path from 'path';

const router = express.Router();

// Multer setup for audio uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit (Whisper limit)
});

// Routes
router.post('/generate-summary', authenticateToken, upload.single('audio'), generateSummary);
router.get('/summary/:sessionId', authenticateToken, getSummary);

// Ensure uploads dir exists (basic check)
import fs from 'fs';
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

export default router;
