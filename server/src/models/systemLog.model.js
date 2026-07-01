class SystemLogModel {
    constructor() {
        this.db = require('./db');
    }

    async create(userId, action, details = null, ipAddress = null) {
        const result = await this.db.query(
            `INSERT INTO system_logs (user_id, action, details, ip_address) 
             VALUES ($1, $2, $3, $4) 
             RETURNING *`,
            [userId, action, details, ipAddress]
        );
        return result.rows[0];
    }

    async findAll(limit = 100) {
        const result = await this.db.query(`
            SELECT sl.*, u.username, u.full_name
            FROM system_logs sl
            LEFT JOIN users u ON sl.user_id = u.id
            ORDER BY sl.created_at DESC
            LIMIT $1
        `, [limit]);
        return result.rows;
    }

    async findByUserId(userId, limit = 50) {
        const result = await this.db.query(
            `SELECT * FROM system_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
            [userId, limit]
        );
        return result.rows;
    }
}

module.exports = new SystemLogModel();