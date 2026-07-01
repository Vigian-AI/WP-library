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
            `SELECT ${columns} FROM ${this.tableName} WHERE id = $1`,
            [id]
        );
        return result.rows[0];
    }

    async findBy(columns) {
        const keys = Object.keys(columns);
        const values = Object.values(columns);
        const conditions = keys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');
        const result = await this.db.query(
            `SELECT * FROM ${this.tableName} WHERE ${conditions}`,
            values
        );
        return result.rows;
    }

    async findOneBy(columns) {
        const keys = Object.keys(columns);
        const values = Object.values(columns);
        const conditions = keys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');
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
        const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
        
        const result = await this.db.query(
            `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders}) RETURNING *`,
            values
        );
        return result.rows[0];
    }

    async update(id, data) {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
        
        const result = await this.db.query(
            `UPDATE ${this.tableName} SET ${setClause} WHERE id = $${values.length + 1} RETURNING *`,
            [...values, id]
        );
        return result.rows[0];
    }

    async delete(id) {
        const result = await this.db.query(
            `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`,
            [id]
        );
        return result.rows[0];
    }

    async count() {
        const result = await this.db.query(`SELECT COUNT(*) FROM ${this.tableName}`);
        return parseInt(result.rows[0].count);
    }
}

module.exports = BaseModel;