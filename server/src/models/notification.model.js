const BaseModel = require('./base.model');

class NotificationModel extends BaseModel {
    constructor() {
        super('notifications');
    }

    async findByUser(userId, unreadOnly = false) {
        let query = `
            SELECT * FROM notifications
            WHERE user_id = $1
        `;
        const params = [userId];
        
        if (unreadOnly) {
            query += ' AND is_read = false';
        }
        
        query += ' ORDER BY created_at DESC';
        
        const result = await this.db.query(query, params);
        return result.rows;
    }

    async markAsRead(id) {
        const result = await this.db.query(
            `UPDATE notifications SET is_read = true WHERE id = $1 RETURNING *`,
            [id]
        );
        return result.rows[0];
    }

    async markAllAsRead(userId) {
        await this.db.query(
            `UPDATE notifications SET is_read = true WHERE user_id = $1`,
            [userId]
        );
        return true;
    }

    async createForUser(userId, title, message, type = 'info') {
        return this.create({ user_id: userId, title, message, type });
    }

    async getUnreadCount(userId) {
        const result = await this.db.query(
            `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false`,
            [userId]
        );
        return parseInt(result.rows[0].count);
    }
}

module.exports = new NotificationModel();