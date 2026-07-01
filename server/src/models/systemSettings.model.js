class SystemSettingsModel {
    constructor() {
        this.db = require('./db');
    }

    async get(key) {
        const result = await this.db.query(
            'SELECT value FROM system_settings WHERE key = $1',
            [key]
        );
        return result.rows[0]?.value;
    }

    async set(key, value, description = null) {
        const result = await this.db.query(
            `INSERT INTO system_settings (key, value, description) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (key) DO UPDATE 
             SET value = $2, description = COALESCE($3, system_settings.description), updated_at = NOW()
             RETURNING *`,
            [key, value, description]
        );
        return result.rows[0];
    }

    async getAll() {
        const result = await this.db.query(
            'SELECT * FROM system_settings ORDER BY key ASC'
        );
        return result.rows;
    }
}

module.exports = new SystemSettingsModel();