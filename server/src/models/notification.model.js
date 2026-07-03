const BaseModel = require('./base.model');

class NotificationModel extends BaseModel {
    constructor() {
        super('notifications');
    }

    async findByUser(userId, unreadOnly = false) {
        let query = `
            SELECT * FROM notifications
            WHERE user_id = ?
        `;
        const params = [userId];

        if (unreadOnly) {
            query += ' AND is_read = 0';
        }

        query += ' ORDER BY created_at DESC';

        const result = await this.db.query(query, params);
        return result.rows;
    }

    async markAsRead(id) {
        await this.db.query(
            'UPDATE notifications SET is_read = 1 WHERE id = ?',
            [id]
        );
        return this.findById(id);
    }

    async markAllAsRead(userId) {
        await this.db.query(
            'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
            [userId]
        );
        return true;
    }

    async createForUser(userId, title, message, type = 'info') {
        return this.create({ user_id: userId, title, message, type });
    }

    async getUnreadCount(userId) {
        const result = await this.db.query(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
            [userId]
        );
        return parseInt(result.rows[0].count);
    }
}

module.exports = new NotificationModel();
