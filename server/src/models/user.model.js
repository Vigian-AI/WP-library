const BaseModel = require('./base.model');

class UserModel extends BaseModel {
    constructor() {
        super('users');
    }

    async findByUsername(username) {
        return this.findOneBy({ username });
    }

    async findByEmail(email) {
        return this.findOneBy({ email });
    }

    async findAllWithStats() {
        const result = await this.db.query(`
            SELECT u.*,
                   COUNT(DISTINCT CASE WHEN l.status = 'active' THEN l.id END) as active_loans,
                   COUNT(DISTINCT CASE WHEN n.is_read = 0 THEN n.id END) as unread_notifications
            FROM users u
            LEFT JOIN loans l ON u.id = l.user_id
            LEFT JOIN notifications n ON u.id = n.user_id
            GROUP BY u.id
            ORDER BY u.id ASC
        `);
        return result.rows;
    }

    async updateProfile(id, data) {
        const allowedFields = ['full_name', 'email'];
        const filteredData = {};
        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                filteredData[field] = data[field];
            }
        }
        return this.update(id, filteredData);
    }

    async updatePassword(id, passwordHash) {
        return this.update(id, { password_hash: passwordHash });
    }

    async changeRole(id, role) {
        return this.update(id, { role });
    }

    async toggleStatus(id, isActive) {
        return this.update(id, { is_active: isActive });
    }

    async getLoanHistory(userId) {
        const result = await this.db.query(`
            SELECT l.*, b.title, b.author, b.cover_image_url
            FROM loans l
            JOIN books b ON l.book_id = b.id
            WHERE l.user_id = ?
            ORDER BY l.loan_date DESC
        `, [userId]);
        return result.rows;
    }
}

module.exports = new UserModel();
