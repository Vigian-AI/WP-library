const bcrypt = require('bcryptjs');
const userModel = require('../models/user.model');

async function createDefaultUsers() {
    try {
        const adminExists = await userModel.findByEmail('admin@library.com');
        if (!adminExists) {
            const adminPassword = await bcrypt.hash('admin123', 10);
            await userModel.create({
                username: 'admin',
                email: 'admin@library.com',
                password_hash: adminPassword,
                full_name: 'Administrator',
                role: 'admin'
            });
            console.log('Admin user created: admin@library.com / admin123');
        }

        const userExists = await userModel.findByEmail('user@library.com');
        if (!userExists) {
            const userPassword = await bcrypt.hash('user123', 10);
            await userModel.create({
                username: 'user',
                email: 'user@library.com',
                password_hash: userPassword,
                full_name: 'Librarian User',
                role: 'user'
            });
            console.log('Regular user created: user@library.com / user123');
        }

        console.log('Default users ready!');
        process.exit(0);
    } catch (error) {
        console.error('Error creating users:', error);
        process.exit(1);
    }
}

createDefaultUsers();