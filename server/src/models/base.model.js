class BaseModel {
    constructor(tableName) {
        this.tableName = tableName;
        this.db = require('./db');
    }

    async findAll(columns = '*') {
        const result = await this.db.query(`SELECT ${columns} FROM ${this.tableName} ORDER BY id ASC`);
        return result.rows;
    }

    async findById(id, columns = '*') {
        const result = await this.db.query(
            `SELECT ${columns} FROM ${this.tableName} WHERE id = ?`,
            [id]
        );
        return result.rows[0];
    }

    async findBy(columns) {
        const keys = Object.keys(columns);
        const values = Object.values(columns);
        const conditions = keys.map((key) => `${key} = ?`).join(' AND ');
        const result = await this.db.query(
            `SELECT * FROM ${this.tableName} WHERE ${conditions}`,
            values
        );
        return result.rows;
    }

    async findOneBy(columns) {
        const keys = Object.keys(columns);
        const values = Object.values(columns);
        const conditions = keys.map((key) => `${key} = ?`).join(' AND ');
        const result = await this.db.query(
            `SELECT * FROM ${this.tableName} WHERE ${conditions} LIMIT 1`,
            values
        );
        return result.rows[0];
    }

    async create(data) {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const columns = keys.join(', ');
        const placeholders = keys.map(() => '?').join(', ');

        const result = await this.db.query(
            `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`,
            values
        );
        // result.rows[0] is the OkPacket with insertId
        const insertId = result.rows[0].insertId;
        return this.findById(insertId);
    }

    async update(id, data) {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const setClause = keys.map((key) => `${key} = ?`).join(', ');

        await this.db.query(
            `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`,
            [...values, id]
        );
        return this.findById(id);
    }

    async delete(id) {
        const row = await this.findById(id);
        await this.db.query(
            `DELETE FROM ${this.tableName} WHERE id = ?`,
            [id]
        );
        return row;
    }

    async count() {
        const result = await this.db.query(`SELECT COUNT(*) as count FROM ${this.tableName}`);
        return parseInt(result.rows[0].count);
    }
}

module.exports = BaseModel;
