const BaseModel = require('./base.model');

class WishlistModel extends BaseModel {
    constructor() {
        super('wishlists');
    }

    async findByUser(userId) {
        const result = await this.db.query(`
            SELECT w.*, b.title, b.author, b.cover_image_url, b.rating, b.stock
            FROM wishlists w
            JOIN books b ON w.book_id = b.id
            WHERE w.user_id = $1
            ORDER BY w.created_at DESC
        `, [userId]);
        return result.rows;
    }

    async add(userId, bookId) {
        const existing = await this.findOneBy({ user_id: userId, book_id: bookId });
        if (existing) return existing;
        return this.create({ user_id: userId, book_id: bookId });
    }

    async remove(userId, bookId) {
        const result = await this.db.query(
            `DELETE FROM wishlists WHERE user_id = $1 AND book_id = $2 RETURNING *`,
            [userId, bookId]
        );
        return result.rows[0];
    }
}

module.exports = new WishlistModel();