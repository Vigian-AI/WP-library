const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const db = require('../models/db');

async function importBooks() {
    const results = [];
    const filePath = path.join(__dirname, '../../../datasets/main_dataset.csv');

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            console.log(`Importing ${results.length} books...`);

            const uniqueCategories = [...new Set(results.map(b => b.category))];

            for (const categoryName of uniqueCategories) {
                await db.query(
                    'INSERT IGNORE INTO categories (name) VALUES (?)',
                    [categoryName]
                );
            }

            for (const book of results) {
                const categoryResult = await db.query(
                    'SELECT id FROM categories WHERE name = ?',
                    [book.category]
                );

                if (categoryResult.rows[0]) {
                    await db.query(
                        `INSERT INTO books (isbn, title, author, format, price, currency, old_price, cover_image_url, rating, stock, category_id)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                         ON DUPLICATE KEY UPDATE
                             title = VALUES(title),
                             author = VALUES(author),
                             format = VALUES(format),
                             price = VALUES(price),
                             currency = VALUES(currency),
                             old_price = VALUES(old_price),
                             cover_image_url = VALUES(cover_image_url),
                             rating = VALUES(rating),
                             stock = VALUES(stock),
                             category_id = VALUES(category_id)`,
                        [
                            book.isbn,
                            book.name,
                            book.author,
                            book.format,
                            parseFloat(book.price) || 0,
                            book.currency,
                            parseFloat(book.old_price) || null,
                            book.image,
                            parseFloat(book.book_depository_stars) || 0,
                            1,
                            categoryResult.rows[0].id
                        ]
                    );
                }
            }

            console.log('Books imported successfully!');
            process.exit(0);
        });
}

importBooks().catch(console.error);
