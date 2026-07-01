const bcrypt = require('bcryptjs');
const userModel = require('../models/user.model');
const systemLogModel = require('../models/systemLog.model');

class UserController {
    async getAllUsers(req, res) {
        try {
            const users = await userModel.findAllWithStats();
            res.json(users);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getUser(req, res) {
        try {
            const user = await userModel.findById(req.params.id);
            if (!user) return res.status(404).json({ error: 'User not found' });
            const { password_hash, ...safeUser } = user;
            res.json(safeUser);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async createUser(req, res) {
        try {
            const { username, email, password, full_name, role } = req.body;
            
            const existingUser = await userModel.findByEmail(email);
            if (existingUser) return res.status(400).json({ error: 'Email already exists' });

            const passwordHash = await bcrypt.hash(password, 10);
            const user = await userModel.create({
                username,
                email,
                password_hash: passwordHash,
                full_name,
                role: role || 'user'
            });

            await systemLogModel.create(null, 'CREATE_USER', { user_id: user.id }, req.ip);
            const { password_hash, ...safeUser } = user;
            res.status(201).json(safeUser);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async updateUser(req, res) {
        try {
            const { full_name, email, role, is_active } = req.body;
            const user = await userModel.update(req.params.id, {
                full_name,
                email,
                role,
                is_active
            });
            if (!user) return res.status(404).json({ error: 'User not found' });
            await systemLogModel.create(req.user?.id, 'UPDATE_USER', { user_id: user.id }, req.ip);
            const { password_hash, ...safeUser } = user;
            res.json(safeUser);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async deleteUser(req, res) {
        try {
            const user = await userModel.delete(req.params.id);
            if (!user) return res.status(404).json({ error: 'User not found' });
            await systemLogModel.create(req.user?.id, 'DELETE_USER', { user_id: user.id }, req.ip);
            res.json({ message: 'User deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            const user = await userModel.findById(req.params.id);
            if (!user) return res.status(404).json({ error: 'User not found' });

            const isValid = await bcrypt.compare(currentPassword, user.password_hash);
            if (!isValid) return res.status(400).json({ error: 'Invalid current password' });

            const passwordHash = await bcrypt.hash(newPassword, 10);
            await userModel.updatePassword(req.params.id, passwordHash);
            await systemLogModel.create(req.user?.id, 'CHANGE_PASSWORD', { user_id: user.id }, req.ip);
            res.json({ message: 'Password changed successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async resetPassword(req, res) {
        try {
            const defaultPassword = 'password123';
            const passwordHash = await bcrypt.hash(defaultPassword, 10);
            await userModel.updatePassword(req.params.id, passwordHash);
            await systemLogModel.create(req.user?.id, 'RESET_PASSWORD', { user_id: req.params.id }, req.ip);
            res.json({ message: 'Password reset successfully', defaultPassword });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new UserController();