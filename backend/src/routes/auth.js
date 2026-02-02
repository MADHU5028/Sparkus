import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';
import admin from 'firebase-admin';

const router = express.Router();

// Initialize Firebase Admin
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
    if (!admin.apps.length) {
        // Explicitly load service-account.json from project root (one directory up from routes)
        // Adjust path: routes is in src/routes, service-account is in root.
        // so __dirname is .../src/routes. We need .../../service-account.json
        const serviceAccountPath = join(__dirname, '../../service-account.json');

        console.log("Loading service account from:", serviceAccountPath);

        const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("Firebase Admin initialized successfully");
    }
} catch (error) {
    console.error("Firebase Admin Initialization Error:", error);
}

// Helper function to generate JWT (App Session Token)
const generateToken = (userId, email) => {
    return jwt.sign(
        { userId, email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};

// POST /api/auth/firebase - Login/Signup with Firebase ID Token
router.post('/firebase', async (req, res) => {
    try {
        const idToken = req.headers.authorization?.replace('Bearer ', '');

        if (!idToken) {
            return res.status(401).json({ error: 'No token provided' });
        }

        // Verify Firebase Token
        let decodedToken;
        try {
            decodedToken = await admin.auth().verifyIdToken(idToken);
        } catch (error) {
            console.error("Token verification failed:", error);
            // Check for specific error codes if needed
            return res.status(401).json({
                error: 'Invalid token',
                details: error.message,
                code: error.code
            });
        }

        const { uid, email, name, picture } = decodedToken;

        if (!email) {
            return res.status(400).json({ error: 'Email required from provider' });
        }

        // Check if user exists in our DB
        let result = await query(
            'SELECT id, email, full_name FROM users WHERE email = $1',
            [email]
        );

        let user;

        if (result.rows.length === 0) {
            // Create new user (Sync)
            // Note: password_hash is not needed, so we can make it nullable or insert a dummy value if strict.
            // Ideally schema should change. For now, let's assume we can skip password or put "firebase_auth".

            // Check if schema allows null password? Currently it's likely NOT NULL from previous code.
            // Let's check schema later. For now, insert "firebase_managed".

            result = await query(
                'INSERT INTO users (email, password_hash, full_name, google_id) VALUES ($1, $2, $3, $4) RETURNING id, email, full_name',
                [email, 'firebase_managed', name || email.split('@')[0], uid]
            );
            user = result.rows[0];
        } else {
            user = result.rows[0];
            // Update Google ID if missing
            // Update Full Name/Picture if needed?
        }

        // Generate App Token
        const token = generateToken(user.id, user.email);

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                picture: picture
            },
            token,
        });

    } catch (error) {
        console.error('Firebase Auth Error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
});

// GET /api/auth/verify - Verify App JWT token
router.get('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user data
        const result = await query(
            'SELECT id, email, full_name FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }

        const user = result.rows[0];

        res.json({
            valid: true,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
            },
        });
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        console.error('Token verification error:', error);
        res.status(500).json({ error: 'Failed to verify token' });
    }
});

export default router;
