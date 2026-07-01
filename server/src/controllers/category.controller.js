const categoryModel = require('../models/category.model');
const systemLogModel = require('../models/systemLog.model');

class CategoryController {
    async getAllCategories(req, res) {
        try {
            const categories = await categoryModel.findWithBookCount();
            res.json(categories);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getCategory(req, res) {
        try {
            const category = await categoryModel.findById(req.params.id);
            if (!category) return res.status(404).json({ error: 'Category not found' });
            res.json(category);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async createCategory(req, res) {
        try {
            const { name, description } = req.body;
            const category = await categoryModel.create({ name, description });
            await systemLogModel.create(req.user?.id, 'CREATE_CATEGORY', { category_id: category.id }, req.ip);
            res.status(201).json(category);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async updateCategory(req, res) {
        try {
            const category = await categoryModel.update(req.params.id, req.body);
            if (!category) return res.status(404).json({ error: 'Category not found' });
            await systemLogModel.create(req.user?.id, 'UPDATE_CATEGORY', { category_id: category.id }, req.ip);
            res.json(category);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async deleteCategory(req, res) {
        try {
            const category = await categoryModel.delete(req.params.id);
            if (!category) return res.status(404).json({ error: 'Category not found' });
            await systemLogModel.create(req.user?.id, 'DELETE_CATEGORY', { category_id: category.id }, req.ip);
            res.json({ message: 'Category deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new CategoryController();