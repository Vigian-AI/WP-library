const bookModel = require('../models/book.model');
const categoryModel = require('../models/category.model');
const loanModel = require('../models/loan.model');
const systemLogModel = require('../models/systemLog.model');

class BookController {
    async getAllBooks(req, res) {
        try {
            const books = await bookModel.findAll();
            res.json(books);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getBook(req, res) {
        try {
            const book = await bookModel.getBookWithDetails(req.params.id);
            if (!book) return res.status(404).json({ error: 'Book not found' });
            res.json(book);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async searchBooks(req, res) {
        try {
            const { q } = req.query;
            if (!q) return res.json([]);
            const books = await bookModel.search(q);
            res.json(books);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getBooksByCategory(req, res) {
        try {
            const books = await bookModel.findByCategory(req.params.categoryId);
            res.json(books);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getAvailableBooks(req, res) {
        try {
            const books = await bookModel.findAvailable();
            res.json(books);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getPopularBooks(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const books = await bookModel.findPopular(limit);
            res.json(books);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getNewArrivals(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const books = await bookModel.findNewArrivals(limit);
            res.json(books);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async createBook(req, res) {
        try {
            const { isbn, title, author, format, price, currency, old_price, category_id, cover_image_url } = req.body;
            
            const existingBook = await bookModel.findByIsbn(isbn);
            if (existingBook) return res.status(400).json({ error: 'Book with this ISBN already exists' });

            const book = await bookModel.create({
                isbn, title, author, format, price, currency, old_price, category_id, cover_image_url
            });

            await systemLogModel.create(req.user?.id, 'CREATE_BOOK', { book_id: book.id }, req.ip);
            res.status(201).json(book);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async updateBook(req, res) {
        try {
            const book = await bookModel.update(req.params.id, req.body);
            if (!book) return res.status(404).json({ error: 'Book not found' });
            await systemLogModel.create(req.user?.id, 'UPDATE_BOOK', { book_id: book.id }, req.ip);
            res.json(book);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async deleteBook(req, res) {
        try {
            const book = await bookModel.delete(req.params.id);
            if (!book) return res.status(404).json({ error: 'Book not found' });
            await systemLogModel.create(req.user?.id, 'DELETE_BOOK', { book_id: book.id }, req.ip);
            res.json({ message: 'Book deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getSimilarBooks(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 5;
            const books = await bookModel.getSimilarBooks(req.params.id, limit);
            res.json(books);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getStats(req, res) {
        try {
            const stats = await bookModel.getStats();
            res.json(stats);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new BookController();