const BaseModel = require('./base.model');

class CategoryModel extends BaseModel {
    constructor() {
        super('categories');
    }

    async findByName(name) {
        return this.findOneBy({ name });
    }

    async findWithBookCount() {
        const result = await this.db.query(`
            SELECT c.*, COUNT(b.id) as book_count
            FROM categories c
            LEFT JOIN books b ON c.id = b.category_id
            GROUP BY c.id
            ORDER BY c.name ASC
        `);
        return result.rows;
    }
}

module.exports = new CategoryModel();