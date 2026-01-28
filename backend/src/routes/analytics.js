import express from 'express';
import AnalyticsService from '../services/analyticsService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get focus trends
router.get('/focus-trends', authenticateToken, async (req, res) => {
    try {
        const days = req.query.days || 7;
        const data = await AnalyticsService.getFocusTrends(req.user.id, days);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get participation stats
router.get('/participation', authenticateToken, async (req, res) => {
    try {
        const data = await AnalyticsService.getParticipationStats(req.user.id);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get violation stats
router.get('/violations', authenticateToken, async (req, res) => {
    try {
        const data = await AnalyticsService.getViolationStats(req.user.id);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get overview metrics
router.get('/overview', authenticateToken, async (req, res) => {
    try {
        const data = await AnalyticsService.getOverviewMetrics(req.user.id);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
