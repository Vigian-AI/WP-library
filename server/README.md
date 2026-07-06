# WP-Library — Server Documentation

Backend REST API untuk sistem perpustakaan digital, dibangun dengan **Node.js + Express + MySQL**.

---

## Tech Stack

| Teknologi | Versi | Keterangan |
|-----------|-------|------------|
| Node.js | v18+ | Runtime JavaScript |
| Express | v5 | Web framework |
| MySQL2 | v3 | Database driver |
| bcryptjs | v3 | Hash password |
| jsonwebtoken | v9 | Autentikasi JWT |
| multer | v1.4 | Upload file (avatar) |
| dotenv | v17 | Environment variables |
| csv-parser | v3 | Import data buku dari CSV |

---

## Struktur Folder

```
server/
├── src/
│   ├── controllers/         # Logic bisnis per resource
│   │   ├── book.controller.js
│   │   ├── loan.controller.js
│   │   ├── user.controller.js
│   │   ├── category.controller.js
│   │   └── wishlist.controller.js
│   ├── middleware/
│   │   └── auth.middleware.js   # JWT auth + role authorization
│   ├── models/              # Interaksi database
│   │   ├── db.js            # Koneksi MySQL pool
│   │   ├── base.model.js    # CRUD generik (parent class)
│   │   ├── book.model.js
│   │   ├── loan.model.js
│   │   ├── user.model.js
│   │   ├── category.model.js
│   │   ├── wishlist.model.js
│   │   ├── notification.model.js
│   │   ├── systemLog.model.js
│   │   └── systemSettings.model.js
│   ├── routes/
│   │   └── index.js         # Semua route API
│   ├── scripts/             # Script utilitas
│   │   ├── import-books.js      # Import dari main_dataset.csv
│   │   ├── import-all-books.js  # Import dari folder book-covers
│   │   ├── create-users.js      # Seed user default
│   │   └── create-admin.js      # Buat akun admin
│   ├── index.js             # Entry point server
│   └── scripts/schema.sql   # Schema database MySQL
├── uploads/
│   └── avatars/             # Foto profil user
├── .env                     # Konfigurasi environment
├── docker-compose.yml       # Opsional: MySQL via Docker
└── package.json
```

---

## Setup & Menjalankan

### 1. Install dependencies
```bash
cd server
npm install
```

### 2. Konfigurasi `.env`
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=           # kosong jika MySQL tanpa password
DB_NAME=wp_library

PORT=3000
JWT_SECRET=wp_library_secret_key_ganti_ini
```

### 3. Setup database
Buka phpMyAdmin → buat database `wp_library` → import `src/scripts/schema.sql`.

Schema ini sudah mencakup status approval peminjaman, extension count, denda, dan reminder setting. Tidak ada migration SQL tambahan yang perlu dijalankan untuk setup awal.

### 4. Import data buku
```bash
npm run import-books        # dari main_dataset.csv
# atau
node src/scripts/import-all-books.js  # dari folder book-covers
```

### 5. Buat user default
```bash
npm run seed        # buat user admin & user biasa
```

### 6. Jalankan server
```bash
npm run dev         # development
npm start           # production
```

Server berjalan di: `http://localhost:3000`

---

## Autentikasi

Menggunakan **JWT (JSON Web Token)** dengan masa berlaku 7 hari.

Token dikirim di header:
```
Authorization: Bearer <token>
```

### Role
| Role | Akses |
|------|-------|
| `user` | Meminjam buku, kelola profil, wishlist |
| `admin` | Semua akses user + manajemen sistem |

---

## API Endpoints

### Auth
| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| POST | `/api/auth/login` | Public | Login, mendapat token JWT |
| POST | `/api/auth/register` | Public | Registrasi akun baru |

**Body login:**
```json
{ "email": "user@example.com", "password": "password123" }
```

**Response:**
```json
{
  "user": { "id": 1, "username": "user", "role": "user", ... },
  "token": "eyJhbGci..."
}
```

---

### Books
| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| GET | `/api/books` | Public | Semua buku |
| GET | `/api/books/search?q=:query` | Public | Cari buku |
| GET | `/api/books/popular?limit=10` | Public | Buku terpopuler |
| GET | `/api/books/new-arrivals?limit=10` | Public | Buku terbaru |
| GET | `/api/books/available` | Public | Buku tersedia (stok > 0) |
| GET | `/api/books/:id` | Public | Detail buku |
| GET | `/api/books/:id/similar?limit=5` | Public | Buku serupa |
| POST | `/api/books` | Admin | Tambah buku |
| PUT | `/api/books/:id` | Admin | Update buku |
| DELETE | `/api/books/:id` | Admin | Hapus buku |
| POST | `/api/books/:bookId/borrow` | User | Request peminjaman |

---

### Loans (Peminjaman)
| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| GET | `/api/users/:userId/loans` | Auth | Semua pinjaman user |
| GET | `/api/users/:userId/loans/active` | Auth | Pinjaman aktif user |
| POST | `/api/books/:bookId/borrow` | Auth | Request pinjam buku |
| POST | `/api/loans/:loanId/return` | Auth | Kembalikan buku |
| POST | `/api/loans/:loanId/extend` | Auth | Perpanjang 7 hari |
| GET | `/api/loans/pending` | Admin | Permintaan menunggu |
| GET | `/api/loans/active` | Admin | Semua pinjaman aktif |
| GET | `/api/loans/overdue` | Admin | Pinjaman terlambat |
| GET | `/api/loans/stats` | Admin | Statistik pinjaman |
| GET | `/api/loans/export` | Admin | Export CSV |
| POST | `/api/loans/:loanId/approve` | Admin | Setujui pinjaman |
| POST | `/api/loans/:loanId/reject` | Admin | Tolak pinjaman |
| POST | `/api/loans/:loanId/pay-fine` | Admin | Lunasi denda |
| POST | `/api/loans/send-reminders` | Admin | Kirim reminder |

**Alur peminjaman:**
```
User request → status: pending
Admin approve → status: active (stok berkurang)
Admin reject  → status: rejected
User return   → status: returned (denda dihitung otomatis)
```

**Aturan bisnis:**
- Maksimal 5 buku per user (configurable)
- Maksimal 2x perpanjangan per pinjaman
- Denda: $0.50/hari keterlambatan
- Reminder otomatis H-3 sebelum jatuh tempo

---

### Categories
| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| GET | `/api/categories` | Public | Semua kategori |
| GET | `/api/categories/:id` | Public | Detail kategori |
| POST | `/api/categories` | Admin | Tambah kategori |
| PUT | `/api/categories/:id` | Admin | Update kategori |
| DELETE | `/api/categories/:id` | Admin | Hapus kategori |

---

### Users
| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| GET | `/api/users` | Admin | Semua user |
| GET | `/api/users/:id` | Auth | Detail user |
| POST | `/api/users` | Admin | Buat user baru |
| PUT | `/api/users/:id` | Auth | Update profil |
| DELETE | `/api/users/:id` | Admin | Hapus user |
| POST | `/api/users/:id/password` | Auth | Ganti password |
| POST | `/api/users/:id/reset-password` | Admin | Reset password |
| POST | `/api/users/:id/avatar` | Auth | Upload foto profil |

---

### Wishlist
| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| GET | `/api/wishlist` | Auth | Wishlist user |
| POST | `/api/wishlist/:bookId` | Auth | Tambah ke wishlist |
| DELETE | `/api/wishlist/:bookId` | Auth | Hapus dari wishlist |

---

### Lainnya
| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| GET | `/api/stats` | Auth | Statistik gabungan |
| GET | `/api/logs` | Admin | Log aktivitas sistem |

---

## Database Schema

```
users          — id, username, email, password_hash, full_name, role, is_active, avatar_url
categories     — id, name, description
books          — id, isbn, title, author, format, price, cover_image_url, rating, stock, category_id
loans          — id, user_id, book_id, loan_date, due_date, return_date, status,
                 extension_count, fine_amount, fine_paid, notes
wishlists      — id, user_id, book_id
notifications  — id, user_id, title, message, type, is_read
system_settings— id, key, value, description
system_logs    — id, user_id, action, details (JSON), ip_address
```

---

## System Settings

Dapat diubah langsung di tabel `system_settings`:

| Key | Default | Deskripsi |
|-----|---------|-----------|
| `loan_period_days` | 14 | Durasi pinjaman (hari) |
| `fine_per_day` | 0.5 | Denda per hari terlambat ($) |
| `max_books_per_user` | 5 | Maks buku dipinjam per user |
| `max_extensions` | 2 | Maks perpanjangan per pinjaman |
| `reminder_days_before` | 3 | H-N sebelum jatuh tempo kirim reminder |

---

## Static Files

| URL | Folder | Keterangan |
|-----|--------|------------|
| `/book-covers/:category/:file` | `datasets/book-covers/` | Cover buku |
| `/uploads/avatars/:file` | `uploads/avatars/` | Avatar user |
