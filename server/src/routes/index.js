const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const authMiddleware = require('../middleware/auth.middleware');
const userController = require('../controllers/user.controller');
const bookController = require('../controllers/book.controller');
const loanController = require('../controllers/loan.controller');
const categoryController = require('../controllers/category.controller');
const wishlistController = require('../controllers/wishlist.controller');
const systemLogModel = require('../models/systemLog.model');
const notificationModel = require('../models/notification.model');
const bookModel = require('../models/book.model');
const loanModel = require('../models/loan.model');

// Multer config untuk upload avatar
const avatarDir = path.join(__dirname, '../../uploads/avatars');
if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });

const avatarStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, avatarDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `avatar_${req.params.id}_${Date.now()}${ext}`);
    },
});

const avatarUpload = multer({
    storage: avatarStorage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: (_req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) cb(null, true);
        else cb(new Error('Hanya file gambar (jpg, png, webp) yang diizinkan'));
    },
});

router.post('/auth/login', authMiddleware.login);
router.post('/auth/register', authMiddleware.register);

router.get('/books', bookController.getAllBooks);
router.get('/books/search', bookController.searchBooks);
router.get('/books/available', bookController.getAvailableBooks);
router.get('/books/popular', bookController.getPopularBooks);
router.get('/books/new-arrivals', bookController.getNewArrivals);
router.get('/books/:id', bookController.getBook);
router.get('/books/:id/similar', bookController.getSimilarBooks);
router.post('/books', authMiddleware.authenticate, authMiddleware.authorize(['admin']), bookController.createBook);
router.put('/books/:id', authMiddleware.authenticate, authMiddleware.authorize(['admin']), bookController.updateBook);
router.delete('/books/:id', authMiddleware.authenticate, authMiddleware.authorize(['admin']), bookController.deleteBook);

router.get('/categories', categoryController.getAllCategories);
router.get('/categories/:id', categoryController.getCategory);
router.post('/categories', authMiddleware.authenticate, authMiddleware.authorize(['admin']), categoryController.createCategory);
router.put('/categories/:id', authMiddleware.authenticate, authMiddleware.authorize(['admin']), categoryController.updateCategory);
router.delete('/categories/:id', authMiddleware.authenticate, authMiddleware.authorize(['admin']), categoryController.deleteCategory);

router.get('/users/:userId/loans', authMiddleware.authenticate, loanController.getLoansByUser);
router.get('/users/:userId/loans/active', authMiddleware.authenticate, loanController.getActiveLoansByUser);
router.post('/books/:bookId/borrow', authMiddleware.authenticate, loanController.borrowBook);
router.post('/loans/:loanId/return', authMiddleware.authenticate, loanController.returnBook);
router.post('/loans/:loanId/extend', authMiddleware.authenticate, loanController.extendLoan);

router.get('/wishlist', authMiddleware.authenticate, wishlistController.getWishlist);
router.post('/wishlist/:bookId', authMiddleware.authenticate, wishlistController.addToWishlist);
router.delete('/wishlist/:bookId', authMiddleware.authenticate, wishlistController.removeFromWishlist);

router.get('/users', authMiddleware.authenticate, authMiddleware.authorize(['admin']), userController.getAllUsers);
router.get('/users/:id', authMiddleware.authenticate, userController.getUser);
router.post('/users', authMiddleware.authenticate, authMiddleware.authorize(['admin']), userController.createUser);
router.put('/users/:id', authMiddleware.authenticate, userController.updateUser);
router.delete('/users/:id', authMiddleware.authenticate, authMiddleware.authorize(['admin']), userController.deleteUser);
router.post('/users/:id/password', authMiddleware.authenticate, userController.changePassword);
router.post('/users/:id/reset-password', authMiddleware.authenticate, authMiddleware.authorize(['admin']), userController.resetPassword);
router.post('/users/:id/avatar', authMiddleware.authenticate, avatarUpload.single('avatar'), userController.uploadAvatar);

router.get('/loans/overdue', authMiddleware.authenticate, authMiddleware.authorize(['admin']), loanController.getOverdueLoans);
router.get('/loans/active', authMiddleware.authenticate, authMiddleware.authorize(['admin']), loanController.getAllActiveLoans);
router.get('/loans/stats', authMiddleware.authenticate, authMiddleware.authorize(['admin']), loanController.getStats);

router.get('/logs', authMiddleware.authenticate, authMiddleware.authorize(['admin']), async (req, res) => {
    try {
        const logs = await systemLogModel.findAll();
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/stats', authMiddleware.authenticate, async (req, res) => {
    try {
        const bookStats = await bookModel.getStats();
        const loanStats = await loanModel.getStats();
        res.json({ bookStats, loanStats });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;