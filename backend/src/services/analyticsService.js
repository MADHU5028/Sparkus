import pool from '../config/database.js';
import { startOfDay, subDays, format } from 'date-fns';

class AnalyticsService {
    // Get focus score trends (daily average)
    static async getFocusTrends(userId, days = 7) {
        const result = await pool.query(
            `SELECT 
                DATE(s.created_at) as date, 
                AVG(p.final_focus_score) as avg_focus
             FROM sessions s
             JOIN participants p ON s.id = p.session_id
             WHERE s.host_id = $1 
               AND s.created_at >= NOW() - INTERVAL '${days} days'
             GROUP BY DATE(s.created_at)
             ORDER BY date ASC`,
            [userId]
        );

        // Format for frontend
        return result.rows.map(row => ({
            date: format(new Date(row.date), 'MM/dd'),
            avgFocus: parseFloat(parseFloat(row.avg_focus).toFixed(2))
        }));
    }

    // Get session participation stats
    static async getParticipationStats(userId) {
        const result = await pool.query(
            `SELECT 
                s.session_name,
                COUNT(p.id) as total_participants,
                SUM(CASE WHEN p.final_focus_score >= 40 THEN 1 ELSE 0 END) as present_count,
                SUM(CASE WHEN p.final_focus_score < 40 THEN 1 ELSE 0 END) as absent_count
             FROM sessions s
             LEFT JOIN participants p ON s.id = p.session_id
             WHERE s.host_id = $1
             GROUP BY s.id, s.session_name
             ORDER BY s.created_at DESC
             LIMIT 5`,
            [userId]
        );

        return result.rows.map(row => ({
            name: row.session_name,
            total: parseInt(row.total_participants),
            present: parseInt(row.present_count),
            absent: parseInt(row.absent_count)
        }));
    }

    // Get violation distribution
    static async getViolationStats(userId) {
        const result = await pool.query(
            `SELECT 
                v.violation_type,
                COUNT(*) as count
             FROM violations v
             JOIN sessions s ON v.session_id = s.id
             WHERE s.host_id = $1
             GROUP BY v.violation_type`,
            [userId]
        );

        return result.rows.map(row => ({
            name: row.violation_type.replace('_', ' ').toUpperCase(),
            value: parseInt(row.count)
        }));
    }

    // Get overview metrics card data
    static async getOverviewMetrics(userId) {
        const sessionCount = await pool.query(
            'SELECT COUNT(*) FROM sessions WHERE host_id = $1',
            [userId]
        );

        const avgFocus = await pool.query(
            `SELECT AVG(p.final_focus_score) 
             FROM participants p
             JOIN sessions s ON p.session_id = s.id
             WHERE s.host_id = $1`,
            [userId]
        );

        const totalStudents = await pool.query(
            `SELECT COUNT(DISTINCT p.id)
             FROM participants p
             JOIN sessions s ON p.session_id = s.id
             WHERE s.host_id = $1`,
            [userId]
        );

        return {
            totalSessions: parseInt(sessionCount.rows[0].count),
            averageFocus: parseFloat(avgFocus.rows[0].avg || 0).toFixed(1),
            totalStudents: parseInt(totalStudents.rows[0].count)
        };
    }
}

export default AnalyticsService;
