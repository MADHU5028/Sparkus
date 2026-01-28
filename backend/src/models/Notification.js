import pool from '../config/database.js';

class Notification {
    static async create({ userId, type, message, metadata = {} }) {
        const result = await pool.query(
            `INSERT INTO notifications (user_id, type, message, metadata)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [userId, type, message, metadata]
        );
        return result.rows[0];
    }

    static async getByUserId(userId, limit = 50) {
        const result = await pool.query(
            `SELECT * FROM notifications 
             WHERE user_id = $1 
             ORDER BY created_at DESC 
             LIMIT $2`,
            [userId, limit]
        );
        return result.rows;
    }

    static async getUnreadCount(userId) {
        const result = await pool.query(
            `SELECT COUNT(*) as count FROM notifications 
             WHERE user_id = $1 AND is_read = false`,
            [userId]
        );
        return parseInt(result.rows[0].count);
    }

    static async markAsRead(id, userId) {
        const result = await pool.query(
            `UPDATE notifications 
             SET is_read = true 
             WHERE id = $1 AND user_id = $2
             RETURNING *`,
            [id, userId]
        );
        return result.rows[0];
    }

    static async markAllAsRead(userId) {
        await pool.query(
            `UPDATE notifications 
             SET is_read = true 
             WHERE user_id = $1`,
            [userId]
        );
        return true;
    }

    static async clearAll(userId) {
        await pool.query(
            `DELETE FROM notifications WHERE user_id = $1`,
            [userId]
        );
        return true;
    }
}

export default Notification;
