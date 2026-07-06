const BaseModel = require('./base.model');

class LoanModel extends BaseModel {
    constructor() {
        super('loans');
    }

    async findByUser(userId) {
        const result = await this.db.query(`
            SELECT l.*, b.title, b.author, b.cover_image_url, b.rating, b.stock, b.format,
                   CASE
                       WHEN l.status = 'returned' THEN 0
                       WHEN l.due_date < NOW() THEN DATEDIFF(NOW(), l.due_date)
                       ELSE 0
                   END as overdue_days
            FROM loans l
            JOIN books b ON l.book_id = b.id
            WHERE l.user_id = ?
            ORDER BY l.loan_date DESC
        `, [userId]);
        return result.rows;
    }

    async findActiveByUser(userId) {
        const result = await this.db.query(`
            SELECT l.*, b.title, b.author, b.cover_image_url, b.rating, b.stock, b.format,
                   CASE WHEN l.due_date < NOW() THEN DATEDIFF(NOW(), l.due_date) ELSE 0 END as overdue_days,
                   DATEDIFF(l.due_date, NOW()) as days_remaining
            FROM loans l
            JOIN books b ON l.book_id = b.id
            WHERE l.user_id = ? AND l.status = 'active'
            ORDER BY l.due_date ASC
        `, [userId]);
        return result.rows;
    }

    async findOverdue() {
        const result = await this.db.query(`
            SELECT l.*, b.title, b.author, u.username, u.full_name, u.email,
                   DATEDIFF(NOW(), l.due_date) as overdue_days,
                   ROUND(DATEDIFF(NOW(), l.due_date) * 0.5, 2) as fine_amount
            FROM loans l
            JOIN books b ON l.book_id = b.id
            JOIN users u ON l.user_id = u.id
            WHERE l.status = 'active' AND l.due_date < NOW()
            ORDER BY l.due_date ASC
        `);
        return result.rows;
    }

    async findActiveBookByUser(userId, bookId) {
        const result = await this.db.query(`
            SELECT * FROM loans
            WHERE user_id = ? AND book_id = ? AND status IN ('active', 'pending')
            LIMIT 1
        `, [userId, bookId]);
        return result.rows[0];
    }

    async findPending() {
        const result = await this.db.query(`
            SELECT l.*, b.title, b.author, b.cover_image_url, b.format, b.stock,
                   u.username, u.full_name, u.email
            FROM loans l
            JOIN books b ON l.book_id = b.id
            JOIN users u ON l.user_id = u.id
            WHERE l.status = 'pending'
            ORDER BY l.created_at ASC
        `);
        return result.rows;
    }

    async approveLoan(loanId, loanPeriodDays = 14) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + loanPeriodDays);

        await this.db.query(`
            UPDATE loans
            SET status = 'active',
                loan_date = NOW(),
                due_date = ?,
                updated_at = NOW()
            WHERE id = ? AND status = 'pending'
        `, [dueDate, loanId]);

        // Decrement stok
        const loan = await this.findById(loanId);
        if (loan) {
            await this.db.query(
                'UPDATE books SET stock = stock - 1 WHERE id = ? AND stock > 0',
                [loan.book_id]
            );
        }
        return loan;
    }

    async rejectLoan(loanId, reason = '') {
        await this.db.query(`
            UPDATE loans
            SET status = 'rejected',
                notes = ?,
                updated_at = NOW()
            WHERE id = ? AND status = 'pending'
        `, [reason, loanId]);
        return this.findById(loanId);
    }

    async countActiveByUser(userId) {
        const result = await this.db.query(
            `SELECT COUNT(*) as count FROM loans WHERE user_id = ? AND status IN ('active', 'pending')`,
            [userId]
        );
        return parseInt(result.rows[0].count);
    }

    async returnBook(loanId, finePerDay = 0.5) {
        await this.db.transaction(async (connection) => {
            // Hitung denda jika terlambat
            const [loanRows] = await connection.execute(
                `SELECT *, DATEDIFF(NOW(), due_date) as overdue_days FROM loans WHERE id = ?`,
                [loanId]
            );
            const loan = loanRows[0];
            const overdueDays = Math.max(0, loan.overdue_days || 0);
            const fineAmount = overdueDays > 0 ? overdueDays * finePerDay : 0;

            await connection.execute(`
                UPDATE loans
                SET return_date = NOW(),
                    status = 'returned',
                    fine_amount = ?,
                    updated_at = NOW()
                WHERE id = ?
            `, [fineAmount, loanId]);

            await connection.execute(
                'UPDATE books SET stock = stock + 1 WHERE id = ?',
                [loan.book_id]
            );
        });

        return this.findById(loanId);
    }

    async extendLoan(loanId, days, maxExtensions = 2) {
        const loan = await this.findById(loanId);
        if (!loan) return null;
        if (loan.status !== 'active') return null;

        const currentCount = loan.extension_count || 0;
        if (currentCount >= maxExtensions) {
            throw new Error(`Peminjaman tidak dapat diperpanjang lebih dari ${maxExtensions} kali`);
        }

        await this.db.query(`
            UPDATE loans
            SET due_date = DATE_ADD(due_date, INTERVAL ? DAY),
                extension_count = extension_count + 1,
                updated_at = NOW()
            WHERE id = ? AND status = 'active'
        `, [days, loanId]);
        return this.findById(loanId);
    }

    async payFine(loanId) {
        await this.db.query(
            `UPDATE loans SET fine_paid = 1, updated_at = NOW() WHERE id = ?`,
            [loanId]
        );
        return this.findById(loanId);
    }

    async getActiveLoans() {
        const result = await this.db.query(`
            SELECT l.*, b.title, b.author, b.cover_image_url, u.username, u.full_name,
                   DATEDIFF(l.due_date, NOW()) as days_remaining,
                   CASE WHEN l.due_date < NOW() THEN DATEDIFF(NOW(), l.due_date) ELSE 0 END as overdue_days
            FROM loans l
            JOIN books b ON l.book_id = b.id
            JOIN users u ON l.user_id = u.id
            WHERE l.status = 'active'
            ORDER BY l.due_date ASC
        `);
        return result.rows;
    }

    async getLoansNeedingReminder(daysBeforeDue = 3) {
        const result = await this.db.query(`
            SELECT l.*, b.title, b.author, u.username, u.full_name
            FROM loans l
            JOIN books b ON l.book_id = b.id
            JOIN users u ON l.user_id = u.id
            WHERE l.status = 'active'
              AND DATEDIFF(l.due_date, NOW()) = ?
              AND l.user_id NOT IN (
                  SELECT DISTINCT n.user_id FROM notifications n
                  WHERE n.type = 'due_reminder'
                    AND DATE(n.created_at) = CURDATE()
              )
        `, [daysBeforeDue]);
        return result.rows;
    }

    async getStats() {
        const result = await this.db.query(`
            SELECT
                COUNT(*) as total_loans,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_loans,
                COUNT(CASE WHEN status = 'returned' THEN 1 END) as returned_loans,
                COUNT(CASE WHEN due_date < NOW() AND status = 'active' THEN 1 END) as overdue_loans,
                COALESCE(SUM(CASE WHEN fine_amount > 0 AND fine_paid = 0 THEN fine_amount END), 0) as total_unpaid_fines,
                COALESCE(SUM(CASE WHEN fine_paid = 1 THEN fine_amount END), 0) as total_collected_fines
            FROM loans
        `);
        return result.rows[0];
    }

    async exportLoans(filter = {}) {
        let where = '1=1';
        const params = [];

        if (filter.status) { where += ' AND l.status = ?'; params.push(filter.status); }
        if (filter.userId) { where += ' AND l.user_id = ?'; params.push(filter.userId); }
        if (filter.from)   { where += ' AND l.loan_date >= ?'; params.push(filter.from); }
        if (filter.to)     { where += ' AND l.loan_date <= ?'; params.push(filter.to); }

        const result = await this.db.query(`
            SELECT l.id, u.full_name, u.username, b.title, b.author,
                   l.loan_date, l.due_date, l.return_date, l.status,
                   l.extension_count, l.fine_amount, l.fine_paid
            FROM loans l
            JOIN books b ON l.book_id = b.id
            JOIN users u ON l.user_id = u.id
            WHERE ${where}
            ORDER BY l.loan_date DESC
        `, params);
        return result.rows;
    }
}

module.exports = new LoanModel();
