const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const db = require('../models/db');

async function importCategory(categoryName, bookCoversDir) {
    const categoryDir = path.join(bookCoversDir, categoryName);
    const csvFiles = fs.readdirSync(categoryDir).filter(f => f.endsWith('.csv'));

    if (csvFiles.length === 0) return { category: categoryName, count: 0 };

    const csvPath = path.join(categoryDir, csvFiles[0]);

    let categoryResult = await db.query(
        'SELECT id FROM categories WHERE name = $1',
        [categoryName]
    );

    if (categoryResult.rows.length === 0) {
        categoryResult = await db.query(
            'INSERT INTO categories (name) VALUES ($1) RETURNING id',
            [categoryName]
        );
    }

    const categoryId = categoryResult.rows[0].id;
    const books = [];

    return new Promise((resolve) => {
        fs.createReadStream(csvPath)
            .pipe(csv())
            .on('data', (data) => books.push(data))
            .on('end', async () => {
                const validBooks = [];
                for (const book of books) {
                    const localImagePath = book.img_paths || book.image || '';
                    if (!localImagePath) continue;

                    const imageFileName = path.basename(localImagePath);
                    const imageFullPath = path.join(categoryDir, imageFileName);

                    if (!fs.existsSync(imageFullPath)) continue;

                    const isbn = book.isbn || book.ISBN || '';
                    if (!isbn) continue;

                    validBooks.push({ ...book, isbn, imageFileName });
                }

                for (const book of validBooks) {
                    const coverImageUrl = `/book-covers/${categoryName}/${book.imageFileName}`;
                    const rating = parseFloat(book.book_depository_stars || book.rating || 0);
                    const price = parseFloat(book.price || 0);
                    const oldPrice = parseFloat(book.old_price || 0) || null;

                    await db.query(
                        `INSERT INTO books (isbn, title, author, format, price, currency, old_price, cover_image_url, rating, stock, category_id)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                        [
                            book.isbn,
                            book.name || book.title,
                            book.author,
                            book.format || 'Paperback',
                            price,
                            book.currency || '$',
                            oldPrice,
                            coverImageUrl,
                            rating,
                            5,
                            categoryId
                        ]
                    );
                }

                resolve({ category: categoryName, count: validBooks.length });
            });
    });
}

async function importAllBooks() {
    const bookCoversDir = path.join(__dirname, '../../../datasets/book-covers');
    const categories = fs.readdirSync(bookCoversDir).filter(f => {
        const fullPath = path.join(bookCoversDir, f);
        return fs.statSync(fullPath).isDirectory();
    });

    console.log(`Found ${categories.length} categories`);

    const results = await Promise.all(
        categories.map(cat => importCategory(cat, bookCoversDir))
    );

    results.forEach(r => console.log(`${r.category}: ${r.count} books`));

    const total = results.reduce((sum, r) => sum + r.count, 0);
    console.log(`\nTotal imported: ${total} books across ${results.length} categories`);
    process.exit(0);
}

importAllBooks().catch(console.error);
