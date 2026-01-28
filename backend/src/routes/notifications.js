import express from 'express';
import Notification from '../models/Notification.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all notifications for user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const notifications = await Notification.getByUserId(req.user.id);
        const unreadCount = await Notification.getUnreadCount(req.user.id);

        res.json({
            notifications,
            unreadCount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mark single notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
    try {
        const notification = await Notification.markAsRead(req.params.id, req.user.id);
        res.json(notification);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mark all as read
router.put('/read-all', authenticateToken, async (req, res) => {
    try {
        await Notification.markAllAsRead(req.user.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Clear all notifications
router.delete('/', authenticateToken, async (req, res) => {
    try {
        await Notification.clearAll(req.user.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
