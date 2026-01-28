import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/auth.js';
import sessionRoutes from './routes/sessions.js';
import participantRoutes from './routes/participants.js';
import focusRoutes from './routes/focus.js';
import recordingRoutes from './routes/recordings.js';
import notificationRoutes from './routes/notifications.js';
import exportRoutes from './routes/exports.js';
import analyticsRoutes from './routes/analytics.js';
import aiRoutes from './routes/aiRoutes.js';
import monitoringRoutes from './routes/monitoringRoutes.js';

// Import socket handler
import { initializeSocketHandlers } from './sockets/realtimeHandler.js';

// Import database
import pool from './config/database.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// Socket.io setup
const io = new Server(httpServer, {
    cors: {
        origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Sparkus backend is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/participants', participantRoutes);
app.use('/api/focus', focusRoutes);
app.use('/api/recordings', recordingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/exports', exportRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/monitoring', monitoringRoutes);

// Initialize Socket.io handlers
initializeSocketHandlers(io);

// Make io accessible to routes
app.set('io', io);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════╗
║   🚀 Sparkus Backend Server          ║
║   Port: ${PORT}                       ║
║   Environment: ${process.env.NODE_ENV || 'development'}            ║
║   Socket.io: Enabled                 ║
╚═══════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing server...');
    httpServer.close(async () => {
        await pool.end();
        console.log('Server closed');
        process.exit(0);
    });
});

export { io };
export default app;
