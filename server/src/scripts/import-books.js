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
                    'INSERT INTO categories (name) VALUES ($1) ON CONFLICT DO NOTHING',
                    [categoryName]
                );
            }
            
            for (const book of results) {
                const categoryResult = await db.query(
                    'SELECT id FROM categories WHERE name = $1',
                    [book.category]
                );
                
                if (categoryResult.rows[0]) {
                    await db.query(
                        `INSERT INTO books (isbn, title, author, format, price, currency, old_price, cover_image_url, rating, stock, category_id)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                         ON CONFLICT (isbn) DO UPDATE
                         SET title = $2, author = $3, format = $4, price = $5, currency = $6, old_price = $7, 
                             cover_image_url = $8, rating = $9, stock = $10, category_id = $11`,
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