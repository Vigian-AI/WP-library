const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'okmqaz0912',
    database: 'library_db'
});

async function createAdmin() {
    const hash = await bcrypt.hash('admin123', 10);
    await pool.query(
        'INSERT INTO users (username, email, password_hash, full_name, role) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO NOTHING',
        ['admin', 'admin@library.com', hash, 'Admin User', 'admin']
    );
    console.log('Admin user created: admin@library.com / admin123');
    process.exit(0);
}

createAdmin().catch(e => {
    console.error(e);
    process.exit(1);
});
