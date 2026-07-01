const loanModel = require('../models/loan.model');
const bookModel = require('../models/book.model');
const systemSettings = require('../models/systemSettings.model');
const systemLogModel = require('../models/systemLog.model');

class LoanController {
    async getLoansByUser(req, res) {
        try {
            const loans = await loanModel.findByUser(req.params.userId);
            res.json(loans);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getActiveLoansByUser(req, res) {
        try {
            const loans = await loanModel.findActiveByUser(req.params.userId);
            res.json(loans);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getOverdueLoans(req, res) {
        try {
            const loans = await loanModel.findOverdue();
            res.json(loans);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getAllActiveLoans(req, res) {
        try {
            const loans = await loanModel.getActiveLoans();
            res.json(loans);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async borrowBook(req, res) {
        try {
            const userId = req.body?.userId || req.user?.id;
            const bookId = req.params.bookId;

            const book = await bookModel.findById(bookId);
            if (!book) return res.status(404).json({ error: 'Book not found' });
            if (book.stock <= 0) return res.status(400).json({ error: 'Book is out of stock' });

            const loanPeriodDays = parseInt(await systemSettings.get('loan_period_days')) || 14;
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + loanPeriodDays);

            const loan = await loanModel.create({
                user_id: userId,
                book_id: bookId,
                due_date: dueDate
            });

            await bookModel.decrementStock(bookId);
            await systemLogModel.create(userId, 'BORROW_BOOK', { book_id: bookId }, req.ip);

            res.status(201).json(loan);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async returnBook(req, res) {
        try {
            await loanModel.returnBook(req.params.loanId);
            await systemLogModel.create(req.user?.id, 'RETURN_BOOK', { loan_id: req.params.loanId }, req.ip);
            res.json({ message: 'Book returned successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async extendLoan(req, res) {
        try {
            const days = parseInt(req.body.days) || 7;
            const loan = await loanModel.extendLoan(req.params.loanId, days);
            if (!loan) return res.status(404).json({ error: 'Loan not found or cannot be extended' });
            await systemLogModel.create(req.user?.id, 'EXTEND_LOAN', { loan_id: req.params.loanId }, req.ip);
            res.json(loan);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getStats(req, res) {
        try {
            const stats = await loanModel.getStats();
            res.json(stats);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new LoanController();