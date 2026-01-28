import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';

const router = express.Router();

// Helper function to generate JWT
const generateToken = (userId, email) => {
    return jwt.sign(
        { userId, email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};

// POST /api/auth/signup - Create new host account
router.post('/signup', async (req, res) => {
    try {
        const { email, password, fullName } = req.body;

        // Validation
        if (!email || !password || !fullName) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if user already exists
        const existingUser = await query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const result = await query(
            'INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name, created_at',
            [email, passwordHash, fullName]
        );

        const user = result.rows[0];

        // Generate token
        const token = generateToken(user.id, user.email);

        res.status(201).json({
            message: 'Account created successfully',
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                createdAt: user.created_at,
            },
            token,
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Failed to create account' });
    }
});

// POST /api/auth/login - Login with email/password
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const result = await query(
            'SELECT id, email, password_hash, full_name FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = result.rows[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate token
        const token = generateToken(user.id, user.email);

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
            },
            token,
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
});

// POST /api/auth/google - Google OAuth login (simplified - would need Google OAuth setup)
router.post('/google', async (req, res) => {
    try {
        const { googleId, email, fullName } = req.body;

        // Check if user exists
        let result = await query(
            'SELECT id, email, full_name FROM users WHERE google_id = $1 OR email = $2',
            [googleId, email]
        );

        let user;

        if (result.rows.length === 0) {
            // Create new user
            result = await query(
                'INSERT INTO users (email, google_id, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name',
                [email, googleId, fullName]
            );
            user = result.rows[0];
        } else {
            user = result.rows[0];

            // Update google_id if not set
            if (!user.google_id) {
                await query(
                    'UPDATE users SET google_id = $1 WHERE id = $2',
                    [googleId, user.id]
                );
            }
        }

        // Generate token
        const token = generateToken(user.id, user.email);

        res.json({
            message: 'Google login successful',
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
            },
            token,
        });
    } catch (error) {
        console.error('Google login error:', error);
        res.status(500).json({ error: 'Failed to login with Google' });
    }
});

// GET /api/auth/verify - Verify JWT token
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
