const BaseModel = require('./base.model');

class BookModel extends BaseModel {
    constructor() {
        super('books');
    }

    async search(query) {
        const searchTerm = `%${query}%`;
        const result = await this.db.query(`
            SELECT b.*, c.name as category_name
            FROM books b
            LEFT JOIN categories c ON b.category_id = c.id
            WHERE b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?
            ORDER BY b.title ASC
        `, [searchTerm, searchTerm, searchTerm]);
        return result.rows;
    }

    async findByCategory(categoryId) {
        return this.findBy({ category_id: categoryId });
    }

    async findByIsbn(isbn) {
        return this.findOneBy({ isbn });
    }

    async findAvailable() {
        const result = await this.db.query(`
            SELECT b.*, c.name as category_name
            FROM books b
            LEFT JOIN categories c ON b.category_id = c.id
            WHERE b.stock > 0
            ORDER BY b.title ASC
        `);
        return result.rows;
    }

    async findPopular(limit = 10) {
        const result = await this.db.query(`
            SELECT b.*, c.name as category_name, COUNT(l.id) as borrow_count
            FROM books b
            LEFT JOIN categories c ON b.category_id = c.id
            LEFT JOIN loans l ON b.id = l.book_id
            GROUP BY b.id, c.name
            ORDER BY borrow_count DESC, b.rating DESC
            LIMIT ?
        `, [limit]);
        return result.rows;
    }

    async findNewArrivals(limit = 10) {
        const result = await this.db.query(`
            SELECT b.*, c.name as category_name
            FROM books b
            LEFT JOIN categories c ON b.category_id = c.id
            ORDER BY b.created_at DESC
            LIMIT ?
        `, [limit]);
        return result.rows;
    }

    async getBookWithDetails(id) {
        const result = await this.db.query(`
            SELECT b.*, c.name as category_name
            FROM books b
            LEFT JOIN categories c ON b.category_id = c.id
            WHERE b.id = ?
        `, [id]);
        return result.rows[0];
    }

    async getSimilarBooks(bookId, limit = 5) {
        const bookResult = await this.db.query(
            'SELECT * FROM books WHERE id = ?',
            [bookId]
        );

        if (!bookResult.rows[0]) return [];

        const book = bookResult.rows[0];
        if (!book.category_id) return [];

        const categoryId = Number(book.category_id);
        const safeBookId = Number(bookId);
        const safeLimit = Math.max(1, parseInt(limit, 10) || 5);

        const result = await this.db.query(`
            SELECT * FROM books
            WHERE category_id = ? AND id != ?
            ORDER BY rating DESC
            LIMIT ${safeLimit}
        `, [categoryId, safeBookId]);
        return result.rows;
    }

    async decrementStock(id) {
        await this.db.query(
            'UPDATE books SET stock = stock - 1 WHERE id = ? AND stock > 0',
            [id]
        );
        return this.findById(id);
    }

    async incrementStock(id) {
        await this.db.query(
            'UPDATE books SET stock = stock + 1 WHERE id = ?',
            [id]
        );
        return this.findById(id);
    }

    async getStats() {
        const result = await this.db.query(`
            SELECT
                COUNT(*) as total_books,
                COALESCE(AVG(rating), 0) as average_rating,
                SUM(stock) as total_stock
            FROM books
        `);
        return result.rows[0];
    }
}

module.exports = new BookModel();
