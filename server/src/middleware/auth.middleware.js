const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');
const systemLogModel = require('../models/systemLog.model');

const JWT_SECRET = process.env.JWT_SECRET || 'library_secret_key';

class AuthMiddleware {
    async login(req, res) {
        try {
            const { email, password } = req.body;
            const user = await userModel.findByEmail(email);
            if (!user) return res.status(401).json({ error: 'Invalid credentials' });

            const isValid = await bcrypt.compare(password, user.password_hash);
            if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

            if (!user.is_active) return res.status(403).json({ error: 'Account is suspended' });

            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            await systemLogModel.create(user.id, 'LOGIN', null, req.ip);

            const { password_hash, ...safeUser } = user;
            res.json({ user: safeUser, token });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async register(req, res) {
        try {
            const { username, email, password, full_name } = req.body;

            const existingUser = await userModel.findByEmail(email);
            if (existingUser) return res.status(400).json({ error: 'Email already exists' });

            const passwordHash = await bcrypt.hash(password, 10);
            const user = await userModel.create({
                username,
                email,
                password_hash: passwordHash,
                full_name
            });

            await systemLogModel.create(user.id, 'REGISTER', null, req.ip);

            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            const { password_hash, ...safeUser } = user;
            res.status(201).json({ user: safeUser, token });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    authenticate(req, res, next) {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });

        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
            next();
        } catch (error) {
            res.status(401).json({ error: 'Invalid token' });
        }
    }

    authorize(roles = []) {
        return (req, res, next) => {
            if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
            if (roles.length > 0 && !roles.includes(req.user.role)) {
                return res.status(403).json({ error: 'Not authorized' });
            }
            next();
        };
    }
}

module.exports = new AuthMiddleware();