class SystemSettingsModel {
    constructor() {
        this.db = require('./db');
    }

    async get(key) {
        const result = await this.db.query(
            'SELECT value FROM system_settings WHERE `key` = ?',
            [key]
        );
        return result.rows[0]?.value;
    }

    async set(key, value, description = null) {
        // MySQL equivalent of ON CONFLICT DO UPDATE
        await this.db.query(
            `INSERT INTO system_settings (\`key\`, value, description)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE
                value = VALUES(value),
                description = COALESCE(VALUES(description), description),
                updated_at = NOW()`,
            [key, value, description]
        );
        const result = await this.db.query(
            'SELECT * FROM system_settings WHERE `key` = ?',
            [key]
        );
        return result.rows[0];
    }

    async getAll() {
        const result = await this.db.query(
            'SELECT * FROM system_settings ORDER BY `key` ASC'
        );
        return result.rows;
    }
}

module.exports = new SystemSettingsModel();
