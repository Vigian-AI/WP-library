const db = require('../models/db');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

async function updateCoverUrls() {
    console.log('Reading CSV files to build ISBN mapping...\n');
    const bookCoversDir = path.join(__dirname, '../../../datasets/book-covers');
    const categories = fs.readdirSync(bookCoversDir).filter(f => {
        const fullPath = path.join(bookCoversDir, f);
        return fs.statSync(fullPath).isDirectory();
    });

    // Build map: ISBN -> local image path from CSV
    const isbnToImageMap = {};
    
    for (const category of categories) {
        const csvPath = path.join(bookCoversDir, category, `${category}.csv`);
        
        if (!fs.existsSync(csvPath)) continue;

        await new Promise((resolve) => {
            fs.createReadStream(csvPath)
                .pipe(csv())
                .on('data', (row) => {
                    if (row.isbn && row.img_paths) {
                        // Extract filename from img_paths (e.g., "dataset/Art-Photography/0000001.jpg" -> "0000001.jpg")
                        const fileName = path.basename(row.img_paths);
                        const localUrl = `/book-covers/${category}/${fileName}`;
                        isbnToImageMap[row.isbn] = localUrl;
                    }
                })
                .on('end', () => {
                    console.log(`✓ Processed ${category}.csv`);
                    resolve();
                });
        });
    }

    console.log(`\nTotal ISBN mappings: ${Object.keys(isbnToImageMap).length}\n`);

    // Fetch all books from database
    console.log('Fetching books from database...');
    const result = await db.query('SELECT id, isbn, title, cover_image_url FROM books');
    const books = result.rows;

    let updated = 0;
    let skipped = 0;
    let notFound = 0;

    for (const book of books) {
        // Skip if already using local path
        if (book.cover_image_url && book.cover_image_url.startsWith('/book-covers/')) {
            skipped++;
            continue;
        }

        // Clean ISBN - remove dashes and spaces
        const cleanIsbn = book.isbn.replace(/[-\s]/g, '');

        // Try to find matching local image
        let localPath = isbnToImageMap[cleanIsbn] || isbnToImageMap[book.isbn];

        if (localPath) {
            await db.query(
                'UPDATE books SET cover_image_url = ? WHERE id = ?',
                [localPath, book.id]
            );
            console.log(`✓ Updated: ${book.isbn} -> ${localPath}`);
            updated++;
        } else {
            console.log(`✗ Not found: ${book.isbn} - ${book.title.substring(0, 50)}`);
            notFound++;
        }
    }

    console.log(`\n===== Summary =====`);
    console.log(`Total books: ${books.length}`);
    console.log(`Updated: ${updated}`);
    console.log(`Already local: ${skipped}`);
    console.log(`Not found locally: ${notFound}`);
    process.exit(0);
}

updateCoverUrls().catch(console.error);
