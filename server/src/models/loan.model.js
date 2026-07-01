const BaseModel = require('./base.model');

class LoanModel extends BaseModel {
    constructor() {
        super('loans');
    }

    async findByUser(userId) {
        const result = await this.db.query(`
            SELECT l.*, b.title, b.author, b.cover_image_url, b.rating, b.stock, b.format
            FROM loans l
            JOIN books b ON l.book_id = b.id
            WHERE l.user_id = $1
            ORDER BY l.loan_date DESC
        `, [userId]);
        return result.rows;
    }

    async findActiveByUser(userId) {
        const result = await this.db.query(`
            SELECT l.*, b.title, b.author, b.cover_image_url, b.rating, b.stock, b.format
            FROM loans l
            JOIN books b ON l.book_id = b.id
            WHERE l.user_id = $1 AND l.status = 'active'
            ORDER BY l.due_date ASC
        `, [userId]);
        return result.rows;
    }

    async findOverdue() {
        const result = await this.db.query(`
            SELECT l.*, b.title, b.author, u.username, u.full_name
            FROM loans l
            JOIN books b ON l.book_id = b.id
            JOIN users u ON l.user_id = u.id
            WHERE l.status = 'active' AND l.due_date < NOW()
            ORDER BY l.due_date ASC
        `);
        return result.rows;
    }

    async returnBook(loanId) {
        await this.db.transaction(async (client) => {
            await client.query(`
                UPDATE loans 
                SET return_date = NOW(), status = 'returned', updated_at = NOW()
                WHERE id = $1
            `, [loanId]);

            const loanResult = await client.query(
                'SELECT book_id FROM loans WHERE id = $1',
                [loanId]
            );

            await client.query(`
                UPDATE books SET stock = stock + 1 WHERE id = $1
            `, [loanResult.rows[0].book_id]);
        });

        return this.findById(loanId);
    }

    async extendLoan(loanId, days) {
        const result = await this.db.query(`
            UPDATE loans 
            SET due_date = due_date + INTERVAL '${days} days', updated_at = NOW()
            WHERE id = $1 AND status = 'active'
            RETURNING *
        `, [loanId]);
        return result.rows[0];
    }

    async getActiveLoans() {
        const result = await this.db.query(`
            SELECT l.*, b.title, b.author, u.username, u.full_name
            FROM loans l
            JOIN books b ON l.book_id = b.id
            JOIN users u ON l.user_id = u.id
            WHERE l.status = 'active'
            ORDER BY l.due_date ASC
        `);
        return result.rows;
    }

    async getStats() {
        const result = await this.db.query(`
            SELECT 
                COUNT(*) as total_loans,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_loans,
                COUNT(CASE WHEN status = 'returned' THEN 1 END) as returned_loans,
                COUNT(CASE WHEN due_date < NOW() AND status = 'active' THEN 1 END) as overdue_loans
            FROM loans
        `);
        return result.rows[0];
    }
}

module.exports = new LoanModel();