const wishlistModel = require('../models/wishlist.model');

class WishlistController {
    async getWishlist(req, res) {
        try {
            const items = await wishlistModel.findByUser(req.user.id);
            res.json(items);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async addToWishlist(req, res) {
        try {
            const { bookId } = req.params;
            const item = await wishlistModel.add(req.user.id, bookId);
            res.status(201).json(item);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async removeFromWishlist(req, res) {
        try {
            const { bookId } = req.params;
            const item = await wishlistModel.remove(req.user.id, bookId);
            res.json(item);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new WishlistController();
